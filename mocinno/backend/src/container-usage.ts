import { eq, gte, isNotNull, lt, sql } from 'drizzle-orm';

import { db, schema } from '@/db';
import { pveFetch } from '@/pve-utils';
import { localDay } from '@/ssh-activity';
import type { ClusterResources } from '@/types/pve';

const DAY = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;
const RETENTION_DAYS = 90;
const INSERT_BATCH = 500;

const IDLE_MIN_DAYS = 7;
const IDLE_MAX_CPU = 0.01;
const IDLE_MAX_NET_PER_DAY = 10 * 1024 * 1024;

const { containerUsageTable: latest, containerUsageDailyTable: daily } = schema;

function counterDelta(current: number, previous: number | null) {
	if (previous === null) return 0;
	return current < previous ? current : current - previous;
}

async function collectUsage(now: Date) {
	const [resources, containers] = await Promise.all([
		pveFetch<{ data: ClusterResources }>('/cluster/resources?type=vm'),
		db
			.select({
				id: schema.containersTable.id,
				vmid: schema.containersTable.vmid,
				netin: latest.netin,
				netout: latest.netout
			})
			.from(schema.containersTable)
			.leftJoin(latest, eq(latest.container_id, schema.containersTable.id))
			.where(isNotNull(schema.containersTable.vmid))
	]);

	const byVmid = new Map(
		resources.data.filter((r) => r.type === 'lxc').map((resource) => [resource.vmid, resource])
	);
	const day = localDay(now);
	const latestRows: (typeof latest.$inferInsert)[] = [];
	const dailyRows: (typeof daily.$inferInsert)[] = [];

	for (const container of containers) {
		const r = byVmid.get(container.vmid!);
		if (!r || (r.status !== 'running' && r.status !== 'stopped')) continue;

		const cpu = r.cpu ?? 0;
		const mem = r.mem ?? 0;
		const netin = r.netin ?? 0;
		const netout = r.netout ?? 0;

		latestRows.push({
			container_id: container.id,
			status: r.status,
			cpu,
			cpus: r.maxcpu ?? 0,
			mem,
			maxmem: r.maxmem ?? 0,
			disk: r.disk ?? 0,
			maxdisk: r.maxdisk ?? 0,
			netin,
			netout,
			sampled_at: now
		});

		if (r.status !== 'running') continue;

		dailyRows.push({
			container_id: container.id,
			day,
			samples: 1,
			cpu_sum: cpu,
			cpu_max: cpu,
			mem_sum: mem,
			mem_max: mem,
			net_bytes: counterDelta(netin, container.netin) + counterDelta(netout, container.netout)
		});
	}

	return { latestRows, dailyRows };
}

async function pollUsage(now = new Date()) {
	const { latestRows, dailyRows } = await collectUsage(now);

	await db.transaction(async (tx) => {
		for (let i = 0; i < latestRows.length; i += INSERT_BATCH) {
			await tx
				.insert(latest)
				.values(latestRows.slice(i, i + INSERT_BATCH))
				.onConflictDoUpdate({
					target: latest.container_id,
					set: {
						status: sql`excluded.status`,
						cpu: sql`excluded.cpu`,
						cpus: sql`excluded.cpus`,
						mem: sql`excluded.mem`,
						maxmem: sql`excluded.maxmem`,
						disk: sql`excluded.disk`,
						maxdisk: sql`excluded.maxdisk`,
						netin: sql`excluded.netin`,
						netout: sql`excluded.netout`,
						sampled_at: sql`excluded.sampled_at`
					}
				});
		}

		for (let i = 0; i < dailyRows.length; i += INSERT_BATCH) {
			await tx
				.insert(daily)
				.values(dailyRows.slice(i, i + INSERT_BATCH))
				.onConflictDoUpdate({
					target: [daily.container_id, daily.day],
					set: {
						samples: sql`${daily.samples} + excluded.samples`,
						cpu_sum: sql`${daily.cpu_sum} + excluded.cpu_sum`,
						cpu_max: sql`greatest(${daily.cpu_max}, excluded.cpu_max)`,
						mem_sum: sql`${daily.mem_sum} + excluded.mem_sum`,
						mem_max: sql`greatest(${daily.mem_max}, excluded.mem_max)`,
						net_bytes: sql`${daily.net_bytes} + excluded.net_bytes`
					}
				});
		}

		await tx
			.delete(daily)
			.where(lt(daily.day, localDay(new Date(now.getTime() - RETENTION_DAYS * DAY))));
	});
}

let lastError: string | null = null;
let running: Promise<void> | null = null;

export function pollContainerUsage(): Promise<void> {
	// prevents hung poll overlaps with next one
	running ??= pollUsage()
		.then(() => {
			lastError = null;
		})
		.catch((err) => {
			const reason = err instanceof Error ? err.message : String(err);
			console.error('Failed to poll container usage:', reason);

			lastError = `Could not read usage from Proxmox: ${reason}`;
		})
		.finally(() => {
			running = null;
		});

	return running;
}

export async function getContainerUsage(now = new Date()) {
	const sinceDay = localDay(new Date(now.getTime() - (WINDOW_DAYS - 1) * DAY));

	const [rows, history] = await Promise.all([
		db
			.select({
				containerId: schema.containersTable.id,
				username: schema.containersTable.username,
				vmid: schema.containersTable.vmid,
				node: schema.containersTable.node,
				lastSshAt: schema.containersTable.last_ssh_at,
				status: latest.status,
				cpu: latest.cpu,
				cpus: latest.cpus,
				mem: latest.mem,
				maxmem: latest.maxmem,
				disk: latest.disk,
				maxdisk: latest.maxdisk,
				sampledAt: latest.sampled_at
			})
			.from(latest)
			.innerJoin(schema.containersTable, eq(schema.containersTable.id, latest.container_id)),
		db
			.select({
				containerId: daily.container_id,
				days: sql<number>`count(*)::int`,
				samples: sql<number>`sum(${daily.samples})::int`,
				cpuSum: sql<number>`sum(${daily.cpu_sum})::float8`,
				cpuMax: sql<number>`max(${daily.cpu_max})::float8`,
				netBytes: sql<number>`sum(${daily.net_bytes})::float8`
			})
			.from(daily)
			.where(gte(daily.day, sinceDay))
			.groupBy(daily.container_id)
	]);

	const historyById = new Map(history.map((row) => [row.containerId, row]));

	return {
		rows: rows.map((row) => {
			const h = historyById.get(row.containerId);
			const avgCpu = h ? h.cpuSum / h.samples : null;
			const netPerDay = h ? h.netBytes / h.days : null;

			return {
				...row,
				avgCpu,
				peakCpu: h?.cpuMax ?? null,
				netPerDay,
				daysOfHistory: h?.days ?? 0,
				idle:
					row.status === 'running' &&
					(h?.days ?? 0) >= IDLE_MIN_DAYS &&
					avgCpu !== null &&
					avgCpu < IDLE_MAX_CPU &&
					netPerDay !== null &&
					netPerDay < IDLE_MAX_NET_PER_DAY
			};
		}),
		windowDays: WINDOW_DAYS,
		lastSampledAt: rows.reduce<Date | null>(
			(max, row) => (!max || row.sampledAt > max ? row.sampledAt : max),
			null
		),
		pollError: lastError
	};
}

pollContainerUsage();

Bun.cron('*/5 * * * *', pollContainerUsage);
