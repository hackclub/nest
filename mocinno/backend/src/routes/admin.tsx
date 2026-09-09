import { route } from '@/middleware';
import * as db from '@/db-helpers';
import {
	disableStartOnBoot,
	enableStartOnBoot,
	getContainerStatus,
	getNextNode,
	getNextVmid,
	getNodeStats,
	isContainerSuspended,
	pveFetch,
	setContainerDescription,
	waitForTask
} from '@/pve-utils';
import { reloadProxy } from '@/proxy/utils';
import * as env from '@/env';
import * as crypto from 'node:crypto';
import type { NodeLXCConfig, NodeLXCPost, NodeLXCStatusStop } from '@/types/pve';
import transporter from '@/mail';
import { render } from 'react-email';
import ApprovedEmail from '@email/approved.tsx';
import RejectedEmail from '@email/rejected.tsx';

const app = route.createApp();

let nodeStats:
	| {
			name: string;
			stats: Awaited<ReturnType<typeof getNodeStats>>;
	  }[]
	| null = null;

async function requestNodeStats() {
	try {
		const config = env.CONFIG;

		const nodes = config.servers.map((s) => s.node);

		const stats = await Promise.all(
			nodes.map(async (node) => {
				const stats = await getNodeStats(node);
				return { name: node, stats };
			})
		);

		nodeStats = stats;
	} catch (err) {
		if (err instanceof Error) {
			console.error('Failed to update admin node stats:', err.message);
			return;
		}
		console.error('Failed to update admin node stats:', err);
	}
}

// Every min
Bun.cron('* * * * *', requestNodeStats);

app.post('/proxy/reload', async (c) => {
	const profile = c.get('session').get('profile');
	if (!profile || !db.isAdmin(profile.email)) {
		c.status(403);
		return c.json({ error: 'Forbidden' });
	}
	await reloadProxy();
	return c.json({ message: 'Proxy reloaded' });
});

app.get('/', async (c) => {
	const session = c.get('session');
	const engine = c.get('engine');
	const profile = session.get('profile');
	if (!profile) return c.redirect('/api/authorization/login/start');
	if (!db.isAdmin(profile.email)) {
		c.status(403);
		return c.text('Forbidden');
	}

	const users: unknown[] = [];
	const applications = await db.getPendingApplications();
	const allApplications = await db.getAllApplications();
	const invites = await db.getAllInvites();

	if (nodeStats === null) {
		await requestNodeStats();
	}

	const html = await engine.renderFile('admin', {
		profile,
		users,
		applications,
		allApplications,
		invites,
		stats: nodeStats,
		appDomain: process.env.APP_DOMAIN || c.req.header('host')
	});

	return c.html(html);
});

app.post('/invites/create', async (c) => {
	const profile = c.get('session').get('profile');
	if (!profile || !db.isAdmin(profile.email)) {
		c.status(403);
		return c.json({ error: 'Forbidden' });
	}

	const body = await c.req.json();
	const code = crypto.randomBytes(8).toString('hex');
	const maxUses = parseInt(body.maxUses) || 0;
	const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

	const invite = await db.createInvite({
		code,
		adminEmail: profile.email,
		maxUses,
		expiresAt
	});
	return c.json({ message: 'Invite created', invite });
});

app.post('/invites/delete', async (c) => {
	const profile = c.get('session').get('profile');
	if (!profile || !db.isAdmin(profile.email)) {
		c.status(403);
		return c.json({ error: 'Forbidden' });
	}

	const { code } = await c.req.json();
	await db.deleteInvite(code);
	return c.json({ message: 'Invite deleted' });
});

app.get('/users', async (c) => {
	const profile = c.get('session').get('profile');
	if (!profile || !db.isAdmin(profile.email)) {
		c.status(403);
		return c.json({ error: 'Forbidden' });
	}

	const query = c.req.query('q') || '';
	const page = Math.max(1, parseInt(c.req.query('page') ?? '1'));
	const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '50')));
	const offset = (page - 1) * limit;

	const { users, total } = await db.searchUsers({ query, limit, offset });

	const usersWithStatus = [];
	for (const user of users) {
		let container = null;
		let suspended = false;
		if (user.vmid) {
			container = await getContainerStatus(user);
			suspended = await isContainerSuspended(user);
		}
		usersWithStatus.push({ ...user, container, suspended });
	}

	return c.json({
		users: usersWithStatus,
		total,
		page,
		limit,
		pages: Math.ceil(total / limit)
	});
});

app.get('/applications', async (c) => {
	const profile = c.get('session').get('profile');
	if (!profile || !db.isAdmin(profile.email)) {
		c.status(403);
		return c.json({ error: 'Forbidden' });
	}

	const applications = await db.getPendingApplications();
	return c.json(applications);
});

app.post('/applications/approve', async (c) => {
	const profile = c.get('session').get('profile');
	if (!profile || !db.isAdmin(profile.email)) {
		c.status(403);
		return c.json({ error: 'Forbidden' });
	}

	const body = await c.req.json();
	const appId = body.id;
	if (!appId) {
		c.status(400);
		return c.json({ error: 'Application ID required' });
	}

	const application = await db.getApplicationById(appId);

	if (!application) {
		c.status(404);
		return c.json({ error: 'Application not found' });
	}

	if (application.status !== 'pending') {
		c.status(400);
		return c.json({ error: 'Application already processed' });
	}

	const config = env.CONFIG;

	const vmid = await getNextVmid();
	const node = await getNextNode();

	const serverConfig = config.servers.find((s) => s.node === node);

	if (!serverConfig) {
		c.status(500);
		return c.json({
			error: "Something has gone terribly wrong, the server configuration can't be found"
		});
	}

	setTimeout(requestNodeStats, 0);

	const templateConfig = Array.isArray(serverConfig.templates)
		? serverConfig.templates.find((t) => t.name === application.template) ||
			serverConfig.templates[0]
		: serverConfig.templates;

	const password = crypto.randomBytes(12).toString('hex');
	const allocated = await db.allocateIP(serverConfig.ipv4.cidr, serverConfig.ipv4.gateway);

	let net0 = `name=eth0,bridge=vmbr4030,firewall=0,ip=${allocated.ip}/${allocated.prefix},gw=${serverConfig.ipv4?.gateway || allocated.gateway}`;

	if (serverConfig.ipv6) {
		net0 += `,ip6=${serverConfig.ipv6.prefix}${vmid}/${serverConfig.ipv6.cidr},gw6=${serverConfig.ipv6.gateway}`;
	}

	console.log('net0: ', net0);
	console.log('ipv6 config: ', serverConfig.ipv6);

	const result = await pveFetch<{ data: NodeLXCPost }>(`/nodes/${node}/lxc`, 'POST', {
		vmid,
		ostemplate: templateConfig?.template || env.OS_TEMPLATE,
		rootfs: serverConfig.rootfs || env.ROOTFS,
		unprivileged: 1,
		features: 'nesting=1',
		cores: 2,
		memory: 2048,
		swap: 512,
		net0,
		hostname: application.username,
		'ssh-public-keys': `${env.BASTION_PROXY_PUB_KEY}\n${application.ssh_key}`,
		password,
		start: 1,
		onboot: 1
	});

	await waitForTask(node, result.data);

	await fetch(`http://${serverConfig.hostIP}:9191/add/${vmid}`, {
		headers: { Authorization: `Bearer ${process.env.NDP_API_KEY}` }
	});

	await db.createContainer({
		user_id: application.user_id,
		sub: application.sub,
		username: application.username,
		sshKeys: [application.ssh_key],
		vmid: vmid,
		ip: allocated.ip,
		ipv6: serverConfig.ipv6 ? `${serverConfig.ipv6.prefix}${vmid}` : null,
		node
	});

	await db.updateApplicationStatus(appId, 'approved', profile.email);
	await transporter.sendMail({
		from: env.SMTP_FROM,
		to: application.user?.email ?? application.email!, // This situation might happen in-between migrations but not in the near future
		subject: 'Nest account approved!',
		html: await render(
			<ApprovedEmail
				username={application.username}
				domain={env.APP_DOMAIN || 'hackclub.app'}
				url={env.APP_DOMAIN || 'https://dashboard.hackclub.app'}
			/>
		)
	});
	return c.json({ message: 'Approved and container created', vmid, password });
});

app.post('/applications/reject', async (c) => {
	const profile = c.get('session').get('profile');
	if (!profile || !db.isAdmin(profile.email)) {
		c.status(403);
		return c.json({ error: 'Forbidden' });
	}

	const body = await c.req.json();
	const appId = body.id;
	if (!appId) {
		c.status(400);
		return c.json({ error: 'Application ID required' });
	}

	const application = await db.getApplicationById(appId);
	if (!application) {
		c.status(404);
		return c.json({ error: 'Application not found' });
	}
	if (application.status !== 'pending') {
		c.status(400);
		return c.json({ error: 'Application already processed' });
	}

	await db.updateApplicationStatus(appId, 'rejected', profile.email);

	await transporter.sendMail({
		from: env.SMTP_FROM,
		to: application.user?.email ?? application.email!,
		subject: 'Nest account rejected',
		html: await render(<RejectedEmail username={application.username} />)
	});
	return c.json({ message: 'Application rejected' });
});

app.post('/users/suspend', async (c) => {
	const profile = c.get('session').get('profile');
	if (!profile || !db.isAdmin(profile.email)) {
		c.status(403);
		return c.json({ error: 'Forbidden' });
	}

	const body = await c.req.json();
	const vmid = body.vmid;
	const reason = body.reason || 'Suspended by admin';
	if (!vmid) {
		c.status(400);
		return c.json({ error: 'VMID required' });
	}

	const user = await db.findContainerByVmid(vmid);

	if (!user) {
		c.status(404);
		return c.json({ error: 'No account found' });
	}

	setTimeout(requestNodeStats, 0);

	await setContainerDescription(user, `suspend: ${reason}`);
	await disableStartOnBoot(user);

	try {
		const status = await getContainerStatus(user);
		if (status?.status === 'running') {
			const stopResult = await pveFetch<{ data: NodeLXCStatusStop }>(
				`/nodes/${user.node}/lxc/${user.vmid}/status/stop`,
				'POST'
			);
			await waitForTask(user.node, stopResult.data);
		}
	} catch {
		// Ignore
	}

	return c.json({ message: `Container ${vmid} suspended` });
});

app.post('/users/unsuspend', async (c) => {
	const profile = c.get('session').get('profile');
	if (!profile || !db.isAdmin(profile.email)) {
		c.status(403);
		return c.json({ error: 'Forbidden' });
	}

	const body = await c.req.json();
	const vmid = body.vmid;
	if (!vmid) {
		c.status(400);
		return c.json({ error: 'VMID required' });
	}

	const user = await db.findContainerByVmid(vmid);

	if (!user) {
		c.status(404);
		return c.json({ error: 'No account found' });
	}

	setTimeout(requestNodeStats, 0);

	await setContainerDescription(user, '');
	await enableStartOnBoot(user);

	return c.json({ message: `Container ${vmid} unsuspended` });
});

app.post('/users/update', async (c) => {
	const profile = c.get('session').get('profile');
	if (!profile || !db.isAdmin(profile.email)) {
		c.status(403);
		return c.json({ error: 'Forbidden' });
	}

	const body = await c.req.json();
	const vmid = body.vmid;
	if (!vmid) {
		c.status(400);
		return c.json({ error: 'VMID required' });
	}

	const user = await db.findContainerByVmid(vmid);

	if (!user) {
		c.status(404);
		return c.json({ error: 'No account found' });
	}

	setTimeout(requestNodeStats, 0);

	const updates: NodeLXCConfig = {};

	if (body.cores !== undefined) {
		const cores = parseInt(body.cores);

		if (isNaN(cores) || cores < 1 || cores > 16) {
			c.status(400);
			return c.json({ error: 'Cores must be 1-16' });
		}

		updates.cores = cores;
	}

	if (body.memory !== undefined) {
		const memory = parseInt(body.memory);

		if (isNaN(memory) || memory < 128 || memory > 32768) {
			c.status(400);
			return c.json({ error: 'Memory must be 128-32768 MB' });
		}

		updates.memory = memory;
	}

	if (body.username !== undefined) {
		const username = body.username.toLowerCase();

		if (!/^[a-z][a-z0-9_-]{1,30}[a-z0-9]$/.test(username)) {
			c.status(400);
			return c.json({ error: 'Invalid username' });
		}

		const taken = await db.isUsernameTaken(username);
		if (taken) {
			c.status(409);
			return c.json({ error: 'Username already taken' });
		}

		await db.updateUsername(vmid, username);
		updates.hostname = username;
	}

	if (Object.keys(updates).length > 0) {
		await pveFetch<{ data: null }>(`/nodes/${user.node}/lxc/${user.vmid}/config`, 'PUT', updates);
	}

	return c.json({ message: 'Updated' });
});

export default app;
