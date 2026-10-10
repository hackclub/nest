import { CONFIG } from '@/env';

const NDP_PORT = 9191;
const NDP_TIMEOUT_MS = 10_000;

async function callNdp(node: string | null, action: 'add' | 'remove', vmid: number) {
	const server = CONFIG.servers.find((s) => s.node === node);
	if (!server) {
		throw new Error(`No server configuration for node ${node}`);
	}

	const res = await fetch(`http://${server.hostIP}:${NDP_PORT}/${action}/${vmid}`, {
		headers: { Authorization: `Bearer ${process.env.NDP_API_KEY}` },
		signal: AbortSignal.timeout(NDP_TIMEOUT_MS)
	});

	if (!res.ok) {
		throw new Error(
			`NDP API error (${action} ${vmid} on ${node}): ${res.status} - ${await res.text()}`
		);
	}

	return res.text();
}

export function ndpAdd(node: string | null, vmid: number) {
	return callNdp(node, 'add', vmid);
}

// only works while the container is still on that node, it reads the address off pct config
export function ndpRemove(node: string | null, vmid: number) {
	return callNdp(node, 'remove', vmid);
}

export async function ndpRemoveSafe(node: string | null, vmid: number) {
	try {
		await ndpRemove(node, vmid);
		return true;
	} catch (err) {
		console.error(`Failed to remove NDP entry for ${vmid} on ${node}:`, err);
		return false;
	}
}
