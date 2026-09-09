import {
	type Backup,
	type BackupAttrs,
	type NodeLXC,
	type NodeLXCConfig,
	type NodeLXCInterfaces,
	type NodeLXCStatusCurrent,
	type NodeStatus,
	type NodeStorageStatus,
	type NodeTaskStatus,
	type NodeLXCPending
} from './types/pve';

import * as env from './env';
import { formatUptime } from './utils';

export async function pveFetch<T>(
	path: string,
	method = 'GET',
	body: Record<string, string | number | boolean> | null = null
): Promise<T> {
	const url = `${process.env.PVE_URL}${path}`;
	const options: RequestInit & { tls: { rejectUnauthorized: boolean } } = {
		method,
		headers: {
			Authorization: `PVEAPIToken=${process.env.PVE_TOKEN}`,
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json'
		},
		tls: {
			rejectUnauthorized: false
		}
	};

	if (body) {
		const params = new URLSearchParams();
		Object.entries(body).forEach(([k, v]) => params.append(k, v.toString()));
		options.body = params;
	}

	const res = await fetch(url, options);
	if (!res.ok) {
		const err = await res.text();
		throw new Error(`PVE API Error: ${res.status} - ${err}`);
	}

	return res.json() as Promise<T>;
}

export async function getContainerConfig(ct: { node: string | null; vmid: number | null }) {
	if (!ct.node || !ct.vmid) return null;
	try {
		const config: { data: NodeLXCConfig } = await pveFetch(
			`/nodes/${ct.node}/lxc/${ct.vmid}/config`
		);
		return config.data;
	} catch {
		return null;
	}
}

export async function isContainerSuspended(ct: { node: string | null; vmid: number | null }) {
	const config = await getContainerConfig(ct);
	return config?.description?.toLowerCase().includes('suspend') ?? false;
}

export async function setContainerDescription(
	ct: { node: string | null; vmid: number | null },
	description: string
) {
	if (!ct.node || !ct.vmid) return;
	await pveFetch(`/nodes/${ct.node}/lxc/${ct.vmid}/config`, 'PUT', {
		description
	});
}

export async function enableStartOnBoot(ct: { node: string | null; vmid: number | null }) {
	if (!ct.node || !ct.vmid) return;
	await pveFetch(`/nodes/${ct.node}/lxc/${ct.vmid}/config`, 'PUT', {
		onboot: 1
	});
}

export async function disableStartOnBoot(ct: { node: string | null; vmid: number | null }) {
	if (!ct.node || !ct.vmid) return;
	await pveFetch(`/nodes/${ct.node}/lxc/${ct.vmid}/config`, 'PUT', {
		onboot: 0
	});
}

export async function getContainerIP(
	ct: { node: string | null; vmid: number | null },
	userIp: string | null
) {
	if (!ct.node || !ct.vmid) return null;
	if (userIp) return userIp;
	try {
		const ifaces: { data: NodeLXCInterfaces } = await pveFetch(
			`/nodes/${ct.node}/lxc/${ct.vmid}/interfaces`
		);
		const eth0 = ifaces.data?.find((i) => i.name === 'eth0');
		return eth0?.inet?.split('/')[0] ?? null;
	} catch {
		return null;
	}
}

export async function getContainerStatus(ct: { node: string | null; vmid: number | null }) {
	if (!ct.node || !ct.vmid) return null;
	try {
		const status: { data: NodeLXCStatusCurrent } = await pveFetch(
			`/nodes/${ct.node}/lxc/${ct.vmid}/status/current`
		);
		return status.data;
	} catch {
		return null;
	}
}

export async function getContainerPending(ct: { node: string | null; vmid: number | null }) {
	if (!ct.node || !ct.vmid) return null;
	try {
		const status: { data: NodeLXCPending } = await pveFetch(
			`/nodes/${ct.node}/lxc/${ct.vmid}/pending`
		);
		return status.data;
	} catch {
		return null;
	}
}

export async function getNextVmid() {
	const clusterNext: { data: number } = await pveFetch(`/cluster/nextid`);
	return clusterNext.data;
}

export async function waitForTask(node: string | null, upid: string, timeoutMs = 30000) {
	if (!node) return;
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		const status: { data: NodeTaskStatus } = await pveFetch(
			`/nodes/${node}/tasks/${encodeURIComponent(upid)}/status`
		);
		if (status.data.status === 'stopped') {
			if (status.data.exitstatus !== 'OK') {
				throw new Error(`Task failed: ${status.data.exitstatus}`);
			}
			return status.data;
		}
		await new Promise((r) => setTimeout(r, 1000));
	}
	throw new Error('Task timed out');
}

export async function getNodeStats(node: string) {
	try {
		const [status, containers, rootfs] = await Promise.all([
			pveFetch<{ data: NodeStatus }>(`/nodes/${node}/status`),
			pveFetch<{ data: NodeLXC }>(`/nodes/${node}/lxc`),
			pveFetch<{ data: NodeStorageStatus }>(
				`/nodes/${node}/storage/${env.ROOTFS.split(':')[0]}/status`
			)
		]);

		return {
			cpu_percent: (status.data.cpu * 100).toFixed(2),
			ram_used_gb: (status.data.memory.used / 1024 ** 3).toFixed(2),
			ram_total_gb: (status.data.memory.total / 1024 ** 3).toFixed(2),
			ram_percent: ((status.data.memory.used / status.data.memory.total) * 100).toFixed(2),
			rootfs_used_gb: (rootfs.data.used / 1024 ** 3).toFixed(2),
			rootfs_total_gb: (rootfs.data.total / 1024 ** 3).toFixed(2),
			rootfs_percent: ((rootfs.data.used / rootfs.data.total) * 100).toFixed(2),
			container_count: containers.data.length,
			load_avg: status.data.loadavg.join(' / '),
			core_count: status.data.cpuinfo.cpus,
			uptime: formatUptime(status.data.uptime)
		};
	} catch (err) {
		if (err instanceof Error) {
			console.error('Failed to fetch node stats:', err.message);
			return;
		}
		console.error('Failed to fetch node stats:', err);
	}
}

export async function getNextNode() {
	const config = env.CONFIG;

	const percentsAllocated = await Promise.all(
		Object.entries(config.servers).map(async ([, { node, maxServers }]) => {
			const { data } = await pveFetch<{ data: NodeLXC }>(`/nodes/${node}/lxc`);
			return { node, percent: data.length / maxServers };
		})
	);

	if (percentsAllocated.length === 0) return null;

	percentsAllocated.sort((a, b) => a.percent - b.percent);
	const best = percentsAllocated[0];

	if (!best) {
		return null;
	}

	return best.node;
}

export async function getContainerBackups(ct: {
	node: string | null;
	vmid: number | null;
	username: string | null;
}) {
	if (!ct.node || !ct.vmid) return [];

	try {
		const backups: { data: Backup[] } = await pveFetch(
			`/nodes/${ct.node}/storage/pbs/content?vmid=${ct.vmid}&content=backup`
		);

		// incase old backups meant for another oser
		return backups.data.filter((b) => b.notes === ct.username);
	} catch (err) {
		console.error(`Failed to fetch backups for container ${ct.vmid} on node ${ct.node}:`, err);
		return [];
	}
}

export async function getBackupAttrs(node: string | null, volid: string) {
	if (!node) return null;
	try {
		const backup: { data: BackupAttrs } = await pveFetch(
			`/nodes/${node}/storage/pbs/content/${volid}`
		);
		return backup.data;
	} catch (err) {
		console.error(`Failed to fetch backup attrs for volid ${volid} on node ${node}:`, err);
		return null;
	}
}
