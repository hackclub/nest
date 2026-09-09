import { issueCertificate } from '@/cert';
import {
	getContainerIP,
	getContainerStatus,
	isContainerSuspended,
	pveFetch,
	waitForTask
} from '@/pve-utils';
import type {
	Backup,
	NodeLXCDelete,
	NodeLXCPost,
	NodeLXCStatusReboot,
	NodeLXCStatusStart,
	NodeLXCStatusStop
} from '@/types/pve';
import { checkDNSVerification, isFQDN, isWhitelisted } from '@/utils';
import { reloadProxy } from '@/proxy/utils';
import * as db from '@/db-helpers';
import * as env from '@/env';
import { utils } from 'ssh2';
import { route } from '@/middleware';

const app = route.createApp();

app.post('/container/start', async (c) => {
	const profile = c.get('session').get('profile');
	if (!profile) {
		c.status(401);
		return c.json({ error: 'Unauthorized' });
	}

	const user = await db.findContainerBySub(profile.sub);
	if (!user?.vmid) {
		c.status(404);
		return c.json({ error: 'No container found' });
	}

	if (await isContainerSuspended(user)) {
		c.status(403);
		return c.json({ error: 'Your container is suspended. Contact an admin.' });
	}

	const result = await pveFetch<{ data: NodeLXCStatusStart }>(
		`/nodes/${user.node}/lxc/${user.vmid}/status/start`,
		'POST'
	);
	await waitForTask(user.node, result.data);

	return c.json({ message: 'Container started' });
});

app.post('/container/stop', async (c) => {
	const profile = c.get('session').get('profile');
	if (!profile) {
		c.status(401);
		return c.json({ error: 'Unauthorized' });
	}

	const user = await db.findContainerBySub(profile.sub);
	if (!user?.vmid) {
		c.status(404);
		return c.json({ error: 'No container found' });
	}

	if (await isContainerSuspended(user)) {
		c.status(403);
		return c.json({ error: 'Your container is suspended. Contact an admin.' });
	}

	const result = await pveFetch<{ data: NodeLXCStatusStop }>(
		`/nodes/${user.node}/lxc/${user.vmid}/status/stop`,
		'POST'
	);
	await waitForTask(user.node, result.data);

	return c.json({ message: 'Container stopped' });
});

app.post('/container/reboot', async (c) => {
	const profile = c.get('session').get('profile');
	if (!profile) {
		c.status(401);
		return c.json({ error: 'Unauthorized' });
	}

	const user = await db.findContainerBySub(profile.sub);
	if (!user?.vmid) {
		c.status(404);
		return c.json({ error: 'No container found' });
	}

	if (await isContainerSuspended(user)) {
		c.status(403);
		return c.json({ error: 'Your container is suspended. Contact an admin.' });
	}

	const result = await pveFetch<{ data: NodeLXCStatusReboot }>(
		`/nodes/${user.node}/lxc/${user.vmid}/status/reboot`,
		'POST'
	);
	await waitForTask(user.node, result.data);

	return c.json({ message: 'Container rebooted' });
});

app.post('/container/delete', async (c) => {
	const session = c.get('session');
	const profile = session.get('profile');
	if (!profile) {
		c.status(401);
		return c.json({ error: 'Unauthorized' });
	}

	const sudo = session.get('sudo');
	if (!sudo) {
		c.status(403);
		return c.json({
			error: 'Sudo required',
			redirect: '/api/authorization/sudo/start'
		});
	}

	const user = await db.findContainerBySub(profile.sub);
	if (!user?.vmid) {
		c.status(404);
		return c.json({ error: 'No container found' });
	}

	if (await isContainerSuspended(user)) {
		c.status(403);
		return c.json({
			error: 'Your container is suspended. You cannot delete it. Contact an admin.'
		});
	}

	const status = await getContainerStatus(user);

	if (status?.status === 'running') {
		const stopResult = await pveFetch<{ data: NodeLXCStatusStop }>(
			`/nodes/${user.node}/lxc/${user.vmid}/status/stop`,
			'POST'
		);
		await waitForTask(user.node, stopResult.data);
	}

	const backups = await pveFetch<{ data: Backup[] }>(
		`/nodes/${user.node}/storage/pbs/content?vmid=${user.vmid}`,
		'GET'
	);

	await Promise.all(
		backups.data
			.filter((b) => b.content === 'backup')
			.map((b) =>
				pveFetch(`/nodes/${user.node}/storage/pbs/content/${encodeURIComponent(b.volid)}`, 'DELETE')
			)
	);

	const deleteResult = await pveFetch<{ data: NodeLXCDelete }>(
		`/nodes/${user.node}/lxc/${user.vmid}`,
		'DELETE'
	);
	await waitForTask(user.node, deleteResult.data);
	await db.deleteUser(profile.sub);

	return c.json({ message: 'Deleted', vmid: user.vmid });
});

app.get('/domains', async (c) => {
	const profile = c.get('session').get('profile');
	if (!profile) {
		c.status(401);
		return c.json({ error: 'Unauthorized' });
	}

	const user = await db.findContainerBySub(profile.sub);
	if (!user) {
		c.status(404);
		return c.json({ error: 'No account found' });
	}

	const domains = await db.getDomainsForUser(user.id);
	return c.json(domains);
});

app.post('/domains/add', async (c) => {
	const profile = c.get('session').get('profile');
	if (!profile) {
		c.status(401);
		return c.json({ error: 'Unauthorized' });
	}

	const user = await db.findContainerBySub(profile.sub);
	if (!user?.vmid) {
		c.status(400);
		return c.json({ error: 'You need a container first' });
	}

	const body = await c.req.json();
	const domain = body.domain?.toLowerCase()?.trim();
	const proxy = body.proxy || null;

	if (!domain || !isFQDN(domain)) {
		c.status(400);
		return c.json({ error: 'Invalid domain name' });
	}

	if (await db.domainExists(domain)) {
		c.status(409);
		return c.json({ error: 'Domain is already taken' });
	}

	const ip = await getContainerIP(user, user.ip);

	if (!ip) {
		c.status(500);
		return c.json({ error: 'Could not determine container IP' });
	}

	const whitelisted = isWhitelisted(domain, user.username);

	if (!whitelisted) {
		const userDomains = await db.getDomainsForUser(user.id);
		const isSubOfOwned = userDomains.some((d) => domain.endsWith('.' + d.domain));

		if (!isSubOfOwned) {
			const verified = await checkDNSVerification(domain, user.username);
			if (!verified) {
				c.status(403);
				return c.json({
					error: `Domain not verified. Either add a TXT record "${domain}" → "domain-verification=${user.username}" or set a CNAME to "${user.username}.hackclub.app". Then try again.`
				});
			}
		}
	}

	const proxyTarget = proxy || `${ip}:80`;
	const row = await db.addDomain({
		containerId: user.id,
		domain,
		proxy: proxyTarget
	});

	if (!env.DISABLE_SSL) {
		try {
			await issueCertificate(domain);
			await reloadProxy();
		} catch (err) {
			if (err instanceof Error) {
				console.error(`Failed to issue certificate for ${domain}:`, err.message);
			} else {
				console.error(`Failed to issue certificate for ${domain}, error unknown:`, err);
			}
		}
	}

	return c.json({ message: `${domain} added`, domain: row });
});

app.post('/domains/remove', async (c) => {
	const profile = c.get('session').get('profile');
	if (!profile) {
		c.status(401);
		return c.json({ error: 'Unauthorized' });
	}

	const user = await db.findContainerBySub(profile.sub);
	if (!user) {
		c.status(404);
		return c.json({ error: 'No account found' });
	}

	const body = await c.req.json();
	const domain = body.domain?.toLowerCase()?.trim();

	if (!domain) {
		c.status(400);
		return c.json({ error: 'Domain is required' });
	}

	const removed = await db.removeDomain(user.id, domain);
	if (!removed) {
		c.status(404);
		return c.json({ error: 'Domain not found or not owned by you' });
	}

	await db.deleteCertificate(domain);
	await reloadProxy();

	return c.json({ message: `${domain} removed` });
});

app.post('/ssh-keys/add', async (c) => {
	const profile = c.get('session').get('profile');
	if (!profile) {
		c.status(401);
		return c.json({ error: 'Unauthorized' });
	}

	const user = await db.findContainerBySub(profile.sub);
	if (!user) {
		c.status(404);
		return c.json({ error: 'No account found' });
	}

	const body = await c.req.json();
	const key = body.key?.trim();

	if (key && key.includes('PRIVATE KEY')) {
		c.status(400);
		return c.json({
			error: 'Please use your SSH public key, not your private key.'
		});
	}

	try {
		const parsed = utils.parseKey(key);

		if (parsed instanceof Error) {
			c.status(400);
			return c.json({ error: 'Invalid SSH public key format.' });
		}
	} catch (e) {
		if (e instanceof Error) {
			console.error('SSH key parsing error:', e.message);
		} else {
			console.error('Unexpected error during SSH key parsing:', e);
		}

		c.status(400);
		return c.json({
			error: 'Invalid SSH public key format.'
		});
	}

	const currentKeys = user.ssh_keys || [];
	if (currentKeys.includes(key)) {
		c.status(409);
		return c.json({ error: 'This key is already added' });
	}
	if (currentKeys.length >= 10) {
		c.status(400);
		return c.json({ error: 'Maximum of 10 SSH keys allowed' });
	}

	const newKeys = [...currentKeys, key];
	await db.updateUserSSHKeys(profile.sub, newKeys);

	if (user.vmid) {
		try {
			await pveFetch(`/nodes/${user.node}/lxc/${user.vmid}/config`, 'PUT', {
				'ssh-public-keys': `${env.BASTION_PROXY_PUB_KEY}\n${newKeys.join('\n')}`
			});
		} catch (e) {
			if (e instanceof Error) {
				console.error(`Failed to update container SSH keys for ${user.username}:`, e.message);
			} else {
				console.error(
					`Failed to update container SSH keys for ${user.username}, error unknown:`,
					e
				);
			}
		}
	}

	return c.json({ message: 'SSH key added' });
});

app.post('/ssh-keys/remove', async (c) => {
	const profile = c.get('session').get('profile');
	if (!profile) {
		c.status(401);
		return c.json({ error: 'Unauthorized' });
	}

	const user = await db.findContainerBySub(profile.sub);
	if (!user) {
		c.status(404);
		return c.json({ error: 'No account found' });
	}

	const body = await c.req.json();
	const key = body.key?.trim();

	if (!key) {
		c.status(400);
		return c.json({ error: 'Key is required' });
	}

	const currentKeys = user.ssh_keys || [];
	if (!currentKeys.includes(key)) {
		c.status(404);
		return c.json({ error: 'Key not found' });
	}
	if (currentKeys.length <= 1) {
		c.status(400);
		return c.json({ error: 'You must have at least one SSH key' });
	}

	const newKeys = currentKeys.filter((k) => k !== key);
	await db.updateUserSSHKeys(profile.sub, newKeys);

	if (user.vmid) {
		try {
			await pveFetch(`/nodes/${user.node}/lxc/${user.vmid}/config`, 'PUT', {
				'ssh-public-keys': `${env.BASTION_PROXY_PUB_KEY}\n${newKeys.join('\n')}`
			});
		} catch (e) {
			if (e instanceof Error) {
				console.error(`Failed to update container SSH keys for ${user.username}:`, e.message);
			} else {
				console.error(
					`Failed to update container SSH keys for ${user.username}, error unknown:`,
					e
				);
			}
		}
	}

	return c.json({ message: 'SSH key removed' });
});

app.post('/backups/restore', async (c) => {
	const profile = c.get('session').get('profile');

	if (!profile) {
		c.status(401);
		return c.json({ error: 'Unauthorized' });
	}

	const user = await db.findContainerBySub(profile.sub);

	if (!user?.vmid) {
		c.status(404);
		return c.json({ error: 'No container found' });
	}

	const body = await c.req.json();
	const volid = body.volid;

	if (!volid) {
		c.status(400);
		return c.json({ error: 'Backup volid is required' });
	}

	const isRunning = (await getContainerStatus(user))?.status === 'running';

	if (isRunning) {
		const stopResult = await pveFetch<{ data: NodeLXCStatusStop }>(
			`/nodes/${user.node}/lxc/${user.vmid}/status/stop`,
			'POST'
		);
		await waitForTask(user.node, stopResult.data);
	}

	try {
		const restoreResult = await pveFetch<{ data: NodeLXCPost }>(`/nodes/${user.node}/lxc`, 'POST', {
			ostemplate: volid,
			vmid: user.vmid,
			force: 1,
			restore: 1,
			storage: 'local-zfs'
		});

		await waitForTask(user.node, restoreResult.data, 900000);
	} catch (e) {
		if (e instanceof Error) {
			console.error(`Failed to restore backup ${volid} for ${user.username}:`, e.message);
		} else {
			console.error(`Failed to restore backup ${volid} for ${user.username}, error unknown:`, e);
		}
		c.status(500);
		return c.json({ error: 'Failed to restore backup' });
	}

	return c.json({
		message: 'Backup restored.'
	});
});

export default app;
