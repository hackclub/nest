import { eq, sql } from 'drizzle-orm';

import { db, schema } from '@/db';
import { getSetting, setSetting } from '@/db-helpers';
import { checkHcaStatus } from '@/hca';
import { AGED_OUT_RESULT, buildLifecycleLists, type LifecycleMember } from '@/lifecycle-lists';
import { getBackfillStatus } from '@/unified-sync';

const DAY = 24 * 60 * 60 * 1000;
const CHECK_DELAY_MS = 200;

const CHECKED_KEY = 'hca_status_checked_at';

async function loadMembers(): Promise<LifecycleMember[]> {
	const [containerRows, applicationRows] = await Promise.all([
		db
			.select({
				containerId: schema.containersTable.id,
				username: schema.containersTable.username,
				sub: schema.containersTable.sub,
				node: schema.containersTable.node,
				createdAt: schema.containersTable.created_at,
				lastSshAt: schema.containersTable.last_ssh_at,
				email: schema.user.email,
				userCreatedAt: schema.user.createdAt,
				hcaResult: schema.hcaStatusTable.result,
				agedOutAt: schema.hcaStatusTable.aged_out_at
			})
			.from(schema.containersTable)
			.leftJoin(schema.user, eq(schema.containersTable.user_id, schema.user.id))
			.leftJoin(
				schema.hcaStatusTable,
				eq(schema.hcaStatusTable.container_id, schema.containersTable.id)
			),
		db
			.select({
				sub: schema.applicationsTable.sub,
				email: schema.applicationsTable.email,
				createdAt: schema.applicationsTable.created_at
			})
			.from(schema.applicationsTable)
	]);

	// look up application for email
	const emailBySub = new Map<string, { email: string; createdAt: number }>();

	for (const application of applicationRows) {
		if (!application.sub || !application.email) continue;

		const createdAt = application.createdAt?.getTime() ?? 0;
		const existing = emailBySub.get(application.sub);

		if (!existing || createdAt > existing.createdAt) {
			emailBySub.set(application.sub, { email: application.email, createdAt });
		}
	}

	return containerRows.map(({ sub, createdAt, userCreatedAt, email, ...row }) => ({
		...row,
		email: email ?? (sub ? emailBySub.get(sub)?.email : null) ?? null,
		joinedAt: createdAt ?? userCreatedAt
	}));
}

async function saveStatus(containerId: number, result: string) {
	const now = new Date();
	const agedOut = result === AGED_OUT_RESULT;

	await db
		.insert(schema.hcaStatusTable)
		.values({
			container_id: containerId,
			result,
			aged_out_at: agedOut ? now : null,
			checked_at: now
		})
		.onConflictDoUpdate({
			target: schema.hcaStatusTable.container_id,
			set: {
				result,
				checked_at: now,
				aged_out_at: agedOut ? sql`coalesce(${schema.hcaStatusTable.aged_out_at}, ${now})` : null
			}
		});
}

let lastError: string | null = null;
let running: Promise<void> | null = null;

async function doCheck(force: boolean) {
	try {
		if (!force) {
			const checked = await getSetting(CHECKED_KEY);
			if (checked && Date.now() - Date.parse(checked) < DAY) return;
		}

		const members = (await loadMembers()).filter((member) => member.email);
		let failed = 0;

		for (const member of members) {
			try {
				await saveStatus(member.containerId, await checkHcaStatus(member.email!));
			} catch (err) {
				failed++;
				console.error(`Failed to check HCA status for container ${member.containerId}:`, err);
			}

			await Bun.sleep(CHECK_DELAY_MS);
		}

		lastError = failed > 0 ? `${failed} of ${members.length} HCA checks failed` : null;

		if (failed < members.length) await setSetting(CHECKED_KEY, new Date().toISOString());
		console.log(`HCA status check: ${members.length} containers, ${failed} failed`);
	} catch (err) {
		const reason = err instanceof Error ? err.message : String(err);
		console.error('Failed to check HCA statuses:', reason);

		lastError = `Could not check HCA statuses: ${reason}`;
	}
}

export function checkHcaStatuses({ force = false } = {}): Promise<void> {
	running ??= doCheck(force).finally(() => {
		running = null;
	});

	return running;
}

export async function getLifecycleLists() {
	const [members, shipRows, lastChecked, backfill] = await Promise.all([
		loadMembers(),
		db
			.select({
				email: schema.unifiedShipsTable.email,
				approvedAt: schema.unifiedShipsTable.approved_at
			})
			.from(schema.unifiedShipsTable),
		getSetting(CHECKED_KEY),
		getBackfillStatus()
	]);

	return {
		...buildLifecycleLists(members, shipRows, new Date()),
		notChecked: members.filter((m) => m.email && !m.hcaResult).length,
		notFound: members.filter((m) => m.hcaResult === 'not_found').length,
		noEmail: members.filter((m) => !m.email).length,
		lastChecked,
		backfill,
		checkError: lastError
	};
}

checkHcaStatuses();

Bun.cron('30 4 * * *', () => checkHcaStatuses({ force: true }));
