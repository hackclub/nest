import * as db from '../db-helpers';
import { getContainerStatus, isContainerSuspended, getContainerBackups } from '@/pve-utils';
import { route } from '@/middleware';
import * as env from '@/env';
import type { Backup } from '@/types/pve';

const app = route.createApp();

app.get('/', async (c) => {
	const html = await c.get('engine').renderFile('home');
	return c.html(html);
});

app.get('/dashboard', async (c) => {
	const session = c.get('session');
	const profile = session.get('profile');
	if (!profile) return c.redirect('/api/authorization/login/start');

	const user = await db.findContainerBySub(profile.sub);
	const admin = db.isAdmin(profile.email);
	let container = null;
	let domains: {
		id: number;
		container_id: number | null;
		domain: string;
		proxy: number;
		created_at: Date | null;
	}[] = [];

	let suspended = false;
	let application = null;
	let eligible = false;
	let hackatime_ban = false;

	let backups: Backup[] = [];

	if (user?.vmid) {
		container = await getContainerStatus(user);
		domains = await db.getDomainsForUser(user.id);
		suspended = await isContainerSuspended(user);
		backups = await getContainerBackups(user);
	} else if (!user) {
		application = await db.getApplicationBySub(profile.sub);
		if (!application || application.status === 'rejected') {
			eligible = profile.verification_status === 'verified';
		}

		const inviteCode = session.get('invite_code');
		if (inviteCode && !eligible) {
			const invite = await db.getInvite(inviteCode);
			if (
				invite &&
				(!invite.max_uses || invite.uses < invite.max_uses) &&
				(!invite.expires_at || new Date() <= new Date(invite.expires_at))
			) {
				eligible = true;
			}
		}

		try {
			const result = await fetch(
				`https://hackatime.hackclub.com/api/v1/users/${profile.slack_id}/trust_factor`,
				{
					headers: {
						'User-Agent': 'Nest/1.0 (+https://hackclub.app)'
					}
				}
			);

			if (result.ok) {
				const data = (await result.json()) as {
					trust_level: string;
					trust_value: number;
				};

				hackatime_ban = data.trust_level === 'red';
			} else {
				console.error(
					`Failed to check hackatime ban status: ${result.status} - ${await result.text()}`
				);
			}
		} catch (err) {
			console.error(`Error checking hackatime ban status: ${err}`);
		}
	}

	const config = env.CONFIG;
	const html = await c.get('engine').renderFile('dashboard', {
		profile,
		user,
		container,
		domains,
		admin,
		suspended,
		application,
		eligible,
		hackatime_ban,
		backups,
		config: config
	});

	return c.html(html);
});

export default app;
