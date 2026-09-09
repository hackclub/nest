import * as db from './db-helpers.js';
import config from '../../config.ts';
import * as env from './env';
import { pveFetch } from './pve-utils.js';
import type { NodeLXCIndex } from './types/pve.js';

const CPU_THRESHOLD = 0.9;
const CHECK_INTERVAL_MS = 30 * 60 * 1000;
const NOTIFY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const WINDOW_SECONDS = 12 * 60 * 60;
const MIN_DATA_POINTS = 24;
const lastNotified = new Map();

async function notifySlack(vmid: number, username: string, avgCpu: number, cores: string) {
	const url = env.SLACK_WEBHOOK_URL;
	if (!url) return;
	try {
		await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				text: `Container ${vmid} (${username}) averaging ${(avgCpu * 100).toFixed(1)}% CPU over 12h`,
				blocks: [
					{
						type: 'section',
						text: { type: 'mrkdwn', text: `:fire: *High sustained CPU usage*` }
					},
					{
						type: 'section',
						fields: [
							{ type: 'mrkdwn', text: `*User*\n${username}` },
							{ type: 'mrkdwn', text: `*VMID*\n${vmid}` },
							{
								type: 'mrkdwn',
								text: `*12h avg*\n${(avgCpu * 100).toFixed(1)}% of ${cores} core(s)`
							}
						]
					}
				]
			})
		});
	} catch (e) {
		if (e instanceof Error) {
			console.error(`slack notification failed:`, e.message);
		} else {
			console.error(`slack notification failed, unknown error:`, e);
		}
	}
}

async function checkNode(node: string, vmidToName: Map<number, string>, liveVmids: Set<number>) {
	let list;
	try {
		list = await pveFetch<{ data: NodeLXCIndex }>(`/nodes/${node}/lxc`);
	} catch (e) {
		if (e instanceof Error) {
			console.error(`failed to fetch container list on ${node}:`, e.message);
		} else {
			console.error(`failed to fetch container list on ${node}, unknown error:`, e);
		}
		return;
	}

	for (const ct of list.data) {
		liveVmids.add(ct.vmid);
		if (ct.status !== 'running') continue;

		try {
			const rrd = await pveFetch<{ data: { time: number; cpu: number }[] }>(
				`/nodes/${node}/lxc/${ct.vmid}/rrddata?timeframe=day&cf=AVERAGE`
			);
			const cutoff = Date.now() / 1000 - WINDOW_SECONDS;
			const points = rrd.data.filter((p) => typeof p.cpu === 'number' && p.time >= cutoff);
			if (points.length < MIN_DATA_POINTS) continue;

			const avg = points.reduce((s, p) => s + p.cpu, 0) / points.length;
			if (avg < CPU_THRESHOLD) continue;

			const now = Date.now();
			const last = lastNotified.get(ct.vmid);
			if (last && now - last < NOTIFY_COOLDOWN_MS) continue;
			lastNotified.set(ct.vmid, now);

			const username = vmidToName.get(ct.vmid) || ct.name || 'unknown';
			const cores = ct.cpus || '?';
			console.log(
				`high cpu: vmid ${ct.vmid} (${username}) on ${node} avg ${(avg * 100).toFixed(1)}%`
			);
			await notifySlack(ct.vmid, username, avg, cores.toString());
		} catch (e) {
			if (e instanceof Error) {
				console.error(`failed to check vmid ${ct.vmid} on ${node}:`, e.message);
			} else {
				console.error(`failed to check vmid ${ct.vmid} on ${node}, unknown error:`, e);
			}
		}
	}
}

async function checkAllContainers() {
	const vmidToName = new Map<number, string>();
	try {
		const users = await db.getAllUsers();
		for (const u of users) {
			if (u.vmid) vmidToName.set(u.vmid, u.username);
		}
	} catch (e) {
		if (e instanceof Error) {
			console.error('failed to load users:', e.message);
		} else {
			console.error('failed to load users, unknown error:', e);
		}
	}

	const nodes = Object.values(config.servers).map((s) => s.node);
	const liveVmids = new Set<number>();

	await Promise.all(nodes.map((node) => checkNode(node, vmidToName, liveVmids)));

	for (const vmid of lastNotified.keys()) {
		if (!liveVmids.has(vmid)) lastNotified.delete(vmid);
	}
}

console.log('cpu monitor starting');

(async function loop() {
	try {
		await checkAllContainers();
	} catch (e) {
		if (e instanceof Error) {
			console.error('check run failed:', e.message);
		} else {
			console.error('check run failed, unknown error:', e);
		}
	}
	setTimeout(loop, CHECK_INTERVAL_MS);
})();
