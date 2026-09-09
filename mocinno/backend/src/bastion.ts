import {
	Server,
	Client as SSHClient,
	utils,
	type ClientChannel,
	type Connection,
	type ParsedKey,
	type PseudoTtyInfo,
	type ServerChannel,
	type WindowChangeInfo
} from 'ssh2';
import * as db from './db-helpers';
import * as env from './env';
import { isContainerSuspended, pveFetch, waitForTask } from './pve-utils';
import type { NodeLXCInterfaces, NodeLXCStatusCurrent, NodeLXCStatusStart } from './types/pve';

const specialHosts = env.CONFIG.specialHosts;

function parseTarget(target: string) {
	const idx = target.lastIndexOf(':');
	if (idx === -1) return { host: target, port: 22 };
	const port = Number(target.slice(idx + 1));
	return {
		host: target.slice(0, idx),
		port: Number.isFinite(port) && port > 0 ? port : 22
	};
}

async function findContainerByUsername(username: string) {
	const user = await db.findContainerByUsername(username);
	if (!user?.vmid) return null;

	let status: 'running' | 'stopped' | 'unknown' = 'unknown';
	let ip = user.ip || null;

	try {
		const statusRes = await pveFetch<{ data: NodeLXCStatusCurrent }>(
			`/nodes/${user.node}/lxc/${user.vmid}/status/current`
		);
		status = statusRes.data.status!;
	} catch {
		// Ignore
	}

	if (status === 'running' && !ip) {
		try {
			const ifaces = await pveFetch<{ data: NodeLXCInterfaces }>(
				`/nodes/${user.node}/lxc/${user.vmid}/interfaces`
			);
			const eth0 = ifaces.data?.find((i) => i.name === 'eth0');
			ip = eth0?.['inet']?.split('/')[0] || null;
		} catch {
			// Ignore
		}
	}

	const suspended = await isContainerSuspended(user);
	return {
		vmid: user.vmid,
		ip,
		status,
		sshKeys: user.ssh_keys,
		suspended,
		node: user.node,
		port: 22,
		upstreamUser: 'root'
	};
}

function verifyClientKey(
	ctx: {
		key: { data: Buffer };
		signature?: Buffer;
		blob?: Buffer;
		hashAlgo?: string;
	},
	allowedKeyStr: string
) {
	if (!allowedKeyStr) return false;
	const allowedKey = utils.parseKey(allowedKeyStr);
	if (allowedKey instanceof Error) return false;
	const parsed: ParsedKey = Array.isArray(allowedKey) ? allowedKey[0] : allowedKey;
	if (!ctx.key.data.equals(parsed.getPublicSSH())) return false;
	if (!ctx.signature) return true;
	return parsed.verify(ctx.blob!, ctx.signature, ctx.hashAlgo);
}

function writeAndClose(stream: ServerChannel, message: string) {
	stream.write(`\r\n${message}\r\n`);
	stream.close(() => console.log('[bastion] Stream closed after message:', message));
}

async function resolveContainer(
	containerPromise: Promise<Partial<Awaited<ReturnType<typeof findContainerByUsername>>>> | null,
	username: string,
	client: Connection,
	stream: ServerChannel | null
) {
	if (!containerPromise) {
		console.warn(`[bastion] No container promise for ${username}`);
		if (stream)
			writeAndClose(
				stream,
				'No container found for your account. Please contact an admin for assistance.'
			);
		client.end();
		return null;
	}

	let container: Partial<Awaited<ReturnType<typeof findContainerByUsername>>>;
	try {
		container = await containerPromise;
	} catch (e) {
		if (e instanceof Error) {
			console.error(`[bastion] Lookup failed for ${username}: ${e.message}`);
		} else {
			console.error(`[bastion] Lookup failed for ${username}, unknown error:`, e);
		}
		if (stream) writeAndClose(stream, 'Error looking up your container.');
		client.end();
		return null;
	}

	if (!container) {
		console.warn(`[bastion] No container found for ${username}`);
		if (stream) writeAndClose(stream, 'No container found for your account.');
		client.end();
		return null;
	}

	if (container.suspended) {
		console.warn(`[bastion] Container for ${username} is suspended`);
		if (stream)
			writeAndClose(
				stream,
				'Your container has been suspended. Please contact an admin for assistance.'
			);
		client.end();
		return null;
	}

	if (container.status !== 'running') {
		console.log(
			`[bastion] Container for ${username} is ${container.status}, attempting to start...`
		);
		if (stream) stream.write(`\r\nYour container is ${container.status}. Starting it up...\r\n`);
		try {
			if (!container.node || !container.vmid) {
				console.error(`[bastion] Missing node or vmid for ${username}'s container:`, container);
				if (stream)
					writeAndClose(
						stream,
						'Container configuration error. Please contact an admin for assistance.'
					);
				client.end();
				return null;
			}

			const result = await pveFetch<{ data: NodeLXCStatusStart }>(
				`/nodes/${container.node}/lxc/${container.vmid}/status/start`,
				'POST'
			);
			await waitForTask(container.node, result.data);
			await new Promise((r) => setTimeout(r, 3000));
			if (!container.ip) {
				try {
					const ifaces = await pveFetch<{ data: NodeLXCInterfaces }>(
						`/nodes/${container.node}/lxc/${container.vmid}/interfaces`
					);
					const eth0 = ifaces.data?.find((i) => i.name === 'eth0');
					container.ip = eth0?.['inet']?.split('/')[0] ?? null;
				} catch {
					// Ignore
				}
			}
			if (!container.ip) {
				if (stream)
					writeAndClose(
						stream,
						'Container started but could not determine IP. Try again in a moment.'
					);
				client.end();
				return null;
			}
			if (stream) stream.write('Container started. Connecting...\r\n');
		} catch (e) {
			if (e instanceof Error) {
				console.error(`[bastion] Failed to start container for ${username}: ${e.message}`);
			} else {
				console.error(`[bastion] Failed to start container for ${username}, unknown error:`, e);
			}
			if (stream) writeAndClose(stream, 'Failed to start your container. Please try again later.');
			client.end();
			return null;
		}
	}

	if (!container.ip) {
		console.warn(`[bastion] No IP for ${username}`);
		if (stream)
			writeAndClose(stream, 'Could not determine your container IP. Try again in a moment.');
		client.end();
		return null;
	}

	const port = container.port || 22;
	const label = container.vmid ? `vmid ${container.vmid}` : `special:${username}`;
	console.log(
		`[bastion] Routing ${username} -> ${container.upstreamUser ?? 'root'}@${container.ip}:${port} (${label})`
	);
	return container;
}

const server = new Server({ hostKeys: [env.BASTION_HOST_PRIV_KEY] }, (client) => {
	let username: string | null = null;
	let containerPromise: Promise<
		Partial<Awaited<ReturnType<typeof findContainerByUsername>>>
	> | null = null;

	client.on('authentication', async (ctx) => {
		username = ctx.username;

		if (ctx.method === 'none') {
			return ctx.reject(['publickey']);
		}

		if (ctx.method !== 'publickey') {
			return ctx.reject(['publickey']);
		}

		const special = specialHosts?.[username];
		if (special) {
			const keys = special.authorized_keys || [];
			const allowAny = keys.includes('*');
			if (!allowAny && !keys.some((key) => verifyClientKey(ctx, key))) {
				console.warn(`[bastion] Key rejected for special host ${username}`);
				return ctx.reject(['publickey']);
			}
			const { host, port } = parseTarget(special.target);
			containerPromise = Promise.resolve({
				ip: host,
				port,
				status: 'running',
				suspended: false,
				upstreamUser: special.username || username
			});
			return ctx.accept();
		}

		try {
			if (!containerPromise) containerPromise = findContainerByUsername(username);
			const container = await containerPromise;

			if (!container?.sshKeys?.length) {
				console.warn(`[bastion] No SSH keys on record for ${username}`);
				return ctx.reject(['publickey']);
			}

			if (container.sshKeys.some((key) => verifyClientKey(ctx, key))) {
				return ctx.accept();
			}
		} catch (e) {
			if (e instanceof Error) {
				console.error(`[bastion] Auth lookup failed for ${username}: ${e.message}`);
			} else {
				console.error(`[bastion] Auth lookup failed for ${username}, unknown error:`, e);
			}
		}

		ctx.reject(['publickey']);
	});

	client.on('ready', () => {
		console.log(`[bastion] ${username} authenticated`);

		client.on('session', (accept) => {
			const session = accept();
			let pty: ReturnType<typeof normalizePty> = null;
			const env: Record<string, string> = {};
			let upstreamStream: ClientChannel | null = null;

			session.on('auth-agent', (accept, reject) => {
				reject?.();
			});

			session.on('env', (accept, reject, info) => {
				if (!isValidEnvKey(info.key)) {
					reject?.();
					return;
				}
				env[info.key] = info.val;
				accept?.();
			});

			session.on('pty', (accept, reject, info) => {
				pty = normalizePty(info);
				accept();
			});

			session.on('window-change', (accept, reject, info) => {
				if (!pty) {
					accept?.();
					return;
				}
				pty = updatePty(pty, info);
				if (!pty) {
					accept?.();
					return;
				}
				upstreamStream?.setWindow?.(pty.rows, pty.cols, pty.height, pty.width);
				accept?.();
			});

			session.on('signal', (accept, reject, info) => {
				upstreamStream?.signal?.(info.name);
				accept?.();
			});

			session.on('shell', async (accept) => {
				const stream = accept();
				const container = await resolveContainer(containerPromise, username!, client, stream);
				if (!container) return;
				proxyToContainer(container.ip!, stream, client, {
					getPty: () => pty,
					getEnv: () => env,
					onStream: (stream) => {
						upstreamStream = stream;
					},
					username: container.upstreamUser,
					port: container.port
				});
			});

			session.on('exec', async (accept, reject, info) => {
				const stream = accept();
				const container = await resolveContainer(containerPromise, username!, client, stream);
				if (!container) return;
				proxyToContainer(container.ip!, stream, client, {
					command: info.command,
					getPty: () => pty,
					getEnv: () => env,
					onStream: (stream) => {
						upstreamStream = stream;
					},
					username: container.upstreamUser,
					port: container.port
				});
			});

			session.on('subsystem', async (accept, reject, info) => {
				if (info.name === 'sftp') {
					const stream = accept();
					const container = await resolveContainer(containerPromise, username!, client, stream);
					if (!container) return;
					proxyToContainer(container.ip!, stream, client, {
						subsystem: 'sftp',
						username: container.upstreamUser,
						port: container.port
					});
				} else {
					reject();
				}
			});
		});
	});

	client.on('error', (err) => {
		console.error(`[bastion] Client error: ${err.message}`);
	});
});

function normalizePty(
	info: PseudoTtyInfo & { term?: string }
): (PseudoTtyInfo & { term?: string }) | null {
	if (!info) return null;
	return {
		term: info.term,
		cols: info.cols,
		rows: info.rows,
		width: info.width,
		height: info.height,
		modes: info.modes ?? null
	};
}

function isValidEnvKey(key: string) {
	return typeof key === 'string' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(key);
}

function updatePty(
	current: (PseudoTtyInfo & { term?: string }) | null,
	info: WindowChangeInfo
): ReturnType<typeof normalizePty> {
	if (!info) return current;
	return {
		term: current?.term ?? 'vt100',
		cols: info.cols ?? current?.cols ?? 80,
		rows: info.rows ?? current?.rows ?? 24,
		width: info.width ?? current?.width ?? 640,
		height: info.height ?? current?.height ?? 480,
		modes: current!.modes // this could cause issues
	};
}

function proxyToContainer(
	ip: string,
	clientStream: ServerChannel,
	client: Connection,
	options: {
		command?: string | null;
		subsystem?: string | null;
		getPty?: () => ReturnType<typeof normalizePty>;
		getEnv?: () => Record<string, string>;
		onStream?: (stream: ClientChannel) => void;
		username?: string;
		port?: number;
	} = {}
) {
	const {
		command = null,
		subsystem = null,
		getPty = () => null,
		getEnv = () => ({}),
		onStream = null,
		username = 'root',
		port = 22
	} = options;
	const conn = new SSHClient();

	conn.on('ready', () => {
		const pty = getPty();
		const env = getEnv();

		if (subsystem) {
			conn.subsys(subsystem, (err, containerStream) => {
				if (err) {
					clientStream.close();
					conn.end();
					return;
				}
				pipeStreams(clientStream, containerStream, conn, client, onStream);
			});
		} else if (command) {
			const execOptions = {
				env,
				...(pty ? { pty } : {})
			};
			conn.exec(command, execOptions, (err, containerStream) => {
				if (err) {
					clientStream.close();
					conn.end();
					return;
				}
				pipeStreams(clientStream, containerStream, conn, client, onStream);
			});
		} else {
			const shellOptions = { env };
			const openShell = pty
				? (callback: (err: Error | undefined, stream: ClientChannel) => void) =>
						conn.shell(pty, shellOptions, callback)
				: (callback: (err: Error | undefined, stream: ClientChannel) => void) =>
						conn.shell(false, shellOptions, callback);
			openShell((err, containerStream) => {
				if (err) {
					clientStream.close();
					conn.end();
					return;
				}
				pipeStreams(clientStream, containerStream, conn, client, onStream);
			});
		}
	});

	conn.on('error', (err) => {
		console.error(`[bastion] Upstream error: ${err.message}`);
		try {
			clientStream.close();
		} catch {
			// Ignore
		}
		try {
			client.end();
		} catch {
			// Ignore
		}
	});

	conn.connect({
		host: ip,
		port,
		username,
		privateKey: env.BASTION_PROXY_PRIV_KEY
	});
}

function pipeStreams(
	clientStream: ServerChannel,
	containerStream: ClientChannel,
	upstreamConn: SSHClient,
	client: Connection,
	onStream: ((stream: ClientChannel) => void) | null = null
) {
	onStream?.(containerStream);
	clientStream.pipe(containerStream).pipe(clientStream);
	if (containerStream.stderr && clientStream.stderr) {
		containerStream.stderr.pipe(clientStream.stderr);
	}

	clientStream.on('close', () => {
		upstreamConn.end();
	});

	containerStream.on('close', () => {
		try {
			clientStream.close();
		} catch {
			// Ignore
		}
		// removing this seems to fix terminus
		// try { client.end(); } catch { }
	});

	containerStream.on(
		'exit',
		(code: null, signalName: string, didCoreDump: string, description: string) => {
			if (typeof code === 'number') {
				clientStream.exit(code);
			} else if (signalName) {
				clientStream.exit(signalName.replace(/^SIG/, ''), Boolean(didCoreDump), description);
			} else {
				clientStream.exit(0);
			}
			clientStream.close();
		}
	);
}

const port = parseInt(process.env.BASTION_PORT || '2222');
server.listen(port, '::', () => {
	console.log(`[bastion] SSH bastion listening on port ${port}`);
});
