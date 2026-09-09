import * as db from './db-helpers';
import { pveFetch, setContainerDescription } from './pve-utils';
import type { NodeLXCIndex, NodeLXCInterfaces, NodeLXCStatusStop } from './types/pve';
import * as env from './env';

const WINDOW_MS = 5 * 60 * 1000;
const SLOW_BIG_HIT_THRESHOLD = 100;
const SLOW_IP_THRESHOLD = 20;
const FAST_BIG_HIT_THRESHOLD = 30;
const FAST_IP_THRESHOLD = 10;
const SEQUENTIAL_PORT_TRIGGER = 15;
const UNIQUE_PORTS_THRESHOLD = 50;

const SAFE_PORTS = new Set([80, 443, 22, 53, 123, 587, 853, 1433, 3306, 5432, 6379, 27017]);

const SUSPEND_COOLDOWN_MS = 300_000;

const containers = new Map<
	number,
	{
		bigHits: number;
		uniqueIPs: Set<string>;
		portsPerDest: Map<string, Set<number>>;
		lastReset: number;
	}
>();
const recentPorts: Record<string, number[]> = {};
const lastSuspended = new Map();
const ipToVmid = new Map();
const vmidToName = new Map();
const vmidToNode = new Map();

async function refreshIPMap() {
	const vmidsWithKnownIP = new Set();

	try {
		const users = await db.getAllUsers();
		for (const user of users) {
			if (user.ip && user.vmid) {
				ipToVmid.set(user.ip, user.vmid);
				vmidsWithKnownIP.add(user.vmid);
			}
			if (user.vmid) {
				if (user.username) vmidToName.set(user.vmid, user.username);
				if (user.node) vmidToNode.set(user.vmid, user.node);
			}
		}
	} catch (e) {
		if (e instanceof Error) {
			console.error('failed to load users from db:', e.message);
		} else {
			console.error('failed to load users from db, unknown error:', e);
		}
	}

	for (const server of Object.values(env.CONFIG.servers)) {
		const node = server.node;
		try {
			const list = await pveFetch<{ data: NodeLXCIndex }>(`/nodes/${node}/lxc`);
			for (const ct of list.data) {
				vmidToNode.set(ct.vmid, node);
				if (ct.name && !vmidToName.has(ct.vmid)) {
					vmidToName.set(ct.vmid, ct.name);
				}
				if (vmidsWithKnownIP.has(ct.vmid)) continue;

				try {
					const ifaces = await pveFetch<{ data: NodeLXCInterfaces }>(
						`/nodes/${node}/lxc/${ct.vmid}/interfaces`
					);
					const eth0 = ifaces.data?.find((i) => i.name === 'eth0');
					const ip = eth0?.['inet']?.split('/')[0];
					if (ip) {
						ipToVmid.set(ip, ct.vmid);
						vmidsWithKnownIP.add(ct.vmid);
					}
				} catch (e) {
					if (e instanceof Error) {
						console.error(`failed to get interfaces for vmid ${ct.vmid} on ${node}:`, e.message);
					} else {
						console.error(
							`failed to get interfaces for vmid ${ct.vmid} on ${node}, unknown error:`,
							e
						);
					}
				}
			}
		} catch (e) {
			if (e instanceof Error) {
				console.error(`failed to list containers on ${node}:`, e.message);
			} else {
				console.error(`failed to list containers on ${node}, unknown error:`, e);
			}
		}
	}

	console.log(`IP map refreshed: ${ipToVmid.size} containers`);
}

function getState(vmid: number) {
	const now = Date.now();
	let state = containers.get(vmid);
	if (!state || now - state.lastReset > WINDOW_MS) {
		state = {
			bigHits: 0,
			uniqueIPs: new Set(),
			portsPerDest: new Map(),
			lastReset: now
		};
		containers.set(vmid, state);
		for (const key of Object.keys(recentPorts)) {
			if (key.startsWith(`${vmid}:`)) delete recentPorts[key];
		}
	}
	return state;
}

function isSequential(vmid: number, destIP: string, port: number) {
	const key = `${vmid}:${destIP}`;
	if (!recentPorts[key]) recentPorts[key] = [];
	const ports = recentPorts[key];
	ports.push(port);
	if (ports.length > SEQUENTIAL_PORT_TRIGGER + 1) ports.shift();
	if (ports.length < SEQUENTIAL_PORT_TRIGGER) return false;
	return ports.every((p, i) => i === 0 || p === ports[i - 1]! + 1);
}

async function suspendContainer(vmid: number, reason: string) {
	const now = Date.now();
	const last = lastSuspended.get(vmid);
	if (last && now - last < SUSPEND_COOLDOWN_MS) return;
	lastSuspended.set(vmid, now);
	console.error(`suspend! vmid ${vmid} — ${reason}`);

	const node = vmidToNode.get(vmid);
	if (!node) {
		console.error(`failed to suspend vmid ${vmid}: unknown node`);
		return;
	}

	try {
		await setContainerDescription({ node: vmidToNode.get(vmid), vmid }, `suspend: ${reason}`);
		await pveFetch<{ data: NodeLXCStatusStop }>(`/nodes/${node}/lxc/${vmid}/status/stop`, 'POST');
	} catch (e) {
		if (e instanceof Error) {
			console.error(`failed to suspend vmid ${vmid}:`, e.message);
		} else {
			console.error(`failed to suspend vmid ${vmid}, unknown error:`, e);
		}
	}
	await notifySlack(vmid, reason);
}

async function notifySlack(vmid: number, reason: string) {
	const url = env.SLACK_WEBHOOK_URL;
	if (!url) return;
	const username = vmidToName.get(vmid) || 'unknown';
	try {
		await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				text: `Container ${vmid} (${username}) suspended: ${reason}`,
				blocks: [
					{
						type: 'section',
						text: {
							type: 'mrkdwn',
							text: `:rotating_light: *Container Suspended*`
						}
					},
					{
						type: 'section',
						fields: [
							{ type: 'mrkdwn', text: `*User*\n${username}` },
							{ type: 'mrkdwn', text: `*VMID*\n${vmid}` }
						]
					},
					{
						type: 'section',
						text: {
							type: 'mrkdwn',
							text: `*Reason*\n${reason}`
						}
					}
				]
			})
		});
	} catch (e) {
		if (e instanceof Error) {
			console.error(`error! Slack notification failed:`, e.message);
		} else {
			console.error(`error! Slack notification failed, unknown error:`, e);
		}
	}
}

function parseTcpdumpLine(line: string) {
	const match = line.match(/IP (\d+\.\d+\.\d+\.\d+)\.(\d+) > (\d+\.\d+\.\d+\.\d+)\.(\d+):/);
	if (!match) return null;

	const srcIP = match[1];
	const vmid = ipToVmid.get(srcIP);
	if (!vmid || vmid < 107) return null;

	return {
		srcIP,
		destIP: match[3],
		destPort: parseInt(match[4]!, 10),
		vmid
	};
}

function onConnection(vmid: number, destIP: string, destPort: number) {
	const state = getState(vmid);
	const isBigHit = !SAFE_PORTS.has(destPort);

	if (isBigHit) state.bigHits++;
	state.uniqueIPs.add(destIP);

	if (isBigHit) {
		if (!state.portsPerDest.has(destIP)) state.portsPerDest.set(destIP, new Set());
		state.portsPerDest.get(destIP)!.add(destPort);

		if (state.portsPerDest.get(destIP)!.size >= UNIQUE_PORTS_THRESHOLD) {
			suspendContainer(
				vmid,
				`port scan on ${destIP}: ${state.portsPerDest.get(destIP)!.size} unique ports`
			);
			return;
		}
	}

	if (isSequential(vmid, destIP, destPort)) {
		suspendContainer(vmid, `sequential port scan detected (reached port ${destPort})`);
		return;
	}

	if (state.bigHits >= FAST_BIG_HIT_THRESHOLD && state.uniqueIPs.size >= FAST_IP_THRESHOLD) {
		suspendContainer(
			vmid,
			`fast threshold: ${state.bigHits} big hits across ${state.uniqueIPs.size} IPs`
		);
		return;
	}

	if (state.bigHits >= SLOW_BIG_HIT_THRESHOLD && state.uniqueIPs.size >= SLOW_IP_THRESHOLD) {
		suspendContainer(
			vmid,
			`slow threshold: ${state.bigHits} big hits across ${state.uniqueIPs.size} IPs`
		);
	}
}

async function main() {
	console.log('starting tcpdump...');

	await refreshIPMap();
	setInterval(refreshIPMap, 60_000);

	const proc = Bun.spawn(['tcpdump', '-l', '-n', '-i', 'any', 'tcp[tcpflags] & tcp-syn != 0'], {
		stdout: 'pipe'
	});

	const decoder = new TextDecoder();
	let buffer = '';

	for await (const chunk of proc.stdout) {
		buffer += decoder.decode(chunk);
		const lines = buffer.split('\n');
		buffer = lines.pop() ?? '';

		for (const line of lines) {
			if (!line.trim()) continue;
			const parsed = parseTcpdumpLine(line);
			if (parsed) {
				if (!parsed.destIP) continue;
				onConnection(parsed.vmid, parsed.destIP, parsed.destPort);
			}
		}
	}
}

main();
