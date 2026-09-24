import { and, eq, isNotNull } from 'drizzle-orm';
import { db, schema } from '@/db';
import { CONFIG } from '@/env';
import { getContainerConfig, pveFetch } from '@/pve-utils';

type ServerConfig = (typeof CONFIG.servers)[number];

export function getServerConfig(node: string | null) {
	return CONFIG.servers.find((s) => s.node === node) ?? null;
}

export function ipv6ForVmid(serverConfig: ServerConfig, vmid: number) {
	return serverConfig.ipv6 ? `${serverConfig.ipv6.prefix}${vmid}` : null;
}

function ipv4Prefix(serverConfig: ServerConfig) {
	return parseInt(serverConfig.ipv4.cidr.split('/')[1]!, 10);
}

// Network fields that are derived from the node's config, everything else in net0 is left alone
function expectedNetFields(serverConfig: ServerConfig, vmid: number, ip: string) {
	const fields: Record<string, string> = {
		ip: `${ip}/${ipv4Prefix(serverConfig)}`,
		gw: serverConfig.ipv4.gateway
	};

	if (serverConfig.ipv6) {
		fields.ip6 = `${ipv6ForVmid(serverConfig, vmid)}/${serverConfig.ipv6.cidr}`;
		fields.gw6 = serverConfig.ipv6.gateway;
	}

	return fields;
}

export function buildNet0(serverConfig: ServerConfig, vmid: number, ip: string) {
	const fields = expectedNetFields(serverConfig, vmid, ip);
	return [
		'name=eth0',
		'bridge=vmbr4030',
		'firewall=0',
		...Object.entries(fields).map(([k, v]) => `${k}=${v}`)
	].join(',');
}

function parseNet(net: string) {
	const map = new Map<string, string>();
	for (const part of net.split(',')) {
		const idx = part.indexOf('=');
		if (idx === -1) continue;
		map.set(part.slice(0, idx), part.slice(idx + 1));
	}
	return map;
}

/**
 * Makes the container's net0 (ipv4 gateway/prefix, ipv6 address/gateway) match the config of
 * the node it's on, and makes sure the ipv6 in the db matches. Returns true if anything changed.
 */
export async function syncContainerNetwork(ct: {
	id: number;
	vmid: number;
	node: string;
	ip: string | null;
	ipv6: string | null;
}) {
	const serverConfig = getServerConfig(ct.node);
	if (!serverConfig) throw new Error(`No server config for node ${ct.node}`);

	const config = await getContainerConfig(ct);
	if (!config) throw new Error(`Couldn't fetch config for ${ct.vmid} on ${ct.node}`);

	const current = config.net0;
	if (!current) throw new Error(`Container ${ct.vmid} has no net0`);

	const net = parseNet(current);
	const ip = ct.ip ?? net.get('ip')?.split('/')[0];
	if (!ip || ip === 'dhcp') throw new Error(`Container ${ct.vmid} has no static ipv4`);

	const expected = expectedNetFields(serverConfig, ct.vmid, ip);
	let changed = false;

	for (const [key, value] of Object.entries(expected)) {
		if (net.get(key) !== value) {
			net.set(key, value);
			changed = true;
		}
	}

	if (changed) {
		const net0 = [...net].map(([k, v]) => `${k}=${v}`).join(',');
		console.log(`[network] ${ct.vmid}: ${current} -> ${net0}`);
		// PVE applies net changes to running containers without a restart
		await pveFetch(`/nodes/${ct.node}/lxc/${ct.vmid}/config`, 'PUT', { net0 });
	}

	const ipv6 = ipv6ForVmid(serverConfig, ct.vmid);
	if (ct.ipv6 !== ipv6) {
		await db
			.update(schema.containersTable)
			.set({ ipv6 })
			.where(eq(schema.containersTable.id, ct.id));
		changed = true;
	}

	return changed;
}

export async function syncAllContainerNetworks() {
	const containers = await db
		.select({
			id: schema.containersTable.id,
			vmid: schema.containersTable.vmid,
			node: schema.containersTable.node,
			ip: schema.containersTable.ip,
			ipv6: schema.containersTable.ipv6
		})
		.from(schema.containersTable)
		.where(and(isNotNull(schema.containersTable.vmid), isNotNull(schema.containersTable.node)));

	let updated = 0;
	let failed = 0;

	for (const ct of containers) {
		try {
			if (await syncContainerNetwork({ ...ct, vmid: ct.vmid!, node: ct.node! })) updated++;
		} catch (err) {
			failed++;
			console.error(
				`[network] Failed to sync ${ct.vmid}:`,
				err instanceof Error ? err.message : err
			);
		}
	}

	console.log(
		`[network] Checked ${containers.length} containers, updated ${updated}, failed ${failed}`
	);
}

if (import.meta.main) {
	await syncAllContainerNetworks();
	process.exit(0);
}
