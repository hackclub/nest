import { denyForward, localOnly, route } from '@/middleware';
import {
	getContainerIP,
	getContainerStatus,
	isContainerSuspended,
	pveFetch,
	waitForTask
} from '@/pve-utils';
import * as db from '@/db-helpers';
import * as env from '@/env';
import type { NodeLXCStatusStart } from '@/types/pve';

const app = route.createApp();

app.post('/pubkey', localOnly, denyForward, async (c) => {
	const body = await c.req.json();
	const username = body.username;
	const publicKey = body.publicKey;

	if (!username || !publicKey) return c.json({ success: false });

	const user = await db.findContainerByUsername(username);
	if (!user || !user.ssh_keys || user.ssh_keys.length === 0) {
		return c.json({ success: false });
	}

	const clientKeyParts = publicKey.trim().split(' ');
	const clientKeyData = clientKeyParts.length >= 2 ? clientKeyParts[1] : publicKey;

	const matched = user.ssh_keys.some((k) => {
		const parts = k.trim().split(' ');
		const data = parts.length >= 2 ? parts[1] : k;
		return data === clientKeyData;
	});

	if (matched) {
		return c.json({ success: true });
	}

	return c.json({ success: false });
});

app.post('/config', localOnly, denyForward, async (c) => {
	const body = await c.req.json();
	const username = body.username;

	if (!username) return c.json({ config: {} });

	const user = await db.findContainerByUsername(username);
	if (!user || !user.vmid) return c.json({ config: {} });

	const suspended = await isContainerSuspended(user);
	if (suspended) {
		return c.json({ config: {} });
	}

	let ip = await getContainerIP(user, user.ip);
	const statusRes = await getContainerStatus(user);
	const status = statusRes?.status;

	if (status !== 'running') {
		try {
			const result = await pveFetch<{ data: NodeLXCStatusStart }>(
				`/nodes/${user.node}/lxc/${user.vmid}/status/start`,
				'POST'
			);

			await waitForTask(user.node, result.data);
			await new Promise((r) => setTimeout(r, 3000));

			ip = await getContainerIP(user, null);
		} catch {
			return c.json({ config: {} });
		}
	}

	if (!ip) return c.json({ config: {} });

	return c.json({
		config: {
			backend: 'sshproxy',
			sshproxy: {
				server: ip,
				port: 22,
				usernamePassThrough: false,
				username: 'root',
				privateKey: env.BASTION_PROXY_PRIV_KEY
			}
		}
	});
});

app.get('/tls-ask', async (c) => {
	const domain = c.req.query('domain');
	if (!domain) {
		c.status(400);
		return c.text('Missing domain');
	}

	if (domain == 'dashboard.hackclub.app') return c.text('OK');

	if (domain.endsWith('.hackclub.app')) {
		const parts = domain.replace('.hackclub.app', '').split('.');
		const username = parts[parts.length - 1];

		if (!username) {
			c.status(400);
			return c.text('Invalid domain');
		}

		const user = await db.findContainerByUsername(username);

		if (!user) {
			c.status(404);
			return c.text('Not found');
		}

		const domainRow = await db.getDomainByName(domain);

		if (domainRow || domain === `${username}.hackclub.app`) {
			return c.text('OK');
		}

		c.status(404);
		return c.text('Not found');
	}

	const appDomain = process.env.APP_DOMAIN;
	if (appDomain && domain === appDomain) return c.text('OK');

	const domainRow = await db.getDomainByName(domain);
	if (domainRow) return c.text('OK');

	c.status(404);
	return c.text('Not found');
});

// wtf is this route used for
// containerssh - lara
app.post('/password', localOnly, denyForward, async (c) => {
	return c.json({ success: false });
});

export default app;
