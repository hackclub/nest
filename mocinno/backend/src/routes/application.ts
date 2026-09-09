import * as db from '@/db-helpers';
import { utils } from 'ssh2';
import { route } from '@/middleware';
import reservedUsernames from '@/reservedUsernames';

const app = route.createApp();

app.get('/username/check', async (c) => {
	const username = c.req.query('username')?.toLowerCase();
	if (!username || !/^[a-z][a-z0-9_-]{1,30}[a-z0-9]$/.test(username)) {
		return c.json({
			available: false,
			error:
				'Invalid username. 3-32 chars, lowercase alphanumeric, hyphens, underscores. Must start with a letter and end with a letter or number.'
		});
	}
	if (reservedUsernames.includes(username.toLowerCase())) {
		return c.json({ available: false, error: 'This username is reserved.' });
	}

	const taken = await db.isUsernameTaken(username);
	return c.json({ available: !taken });
});

app.post('/submit', async (c) => {
	const profile = c.get('session').get('profile');

	if (!profile) {
		c.status(401);
		return c.json({ error: 'Unauthorized' });
	}

	const existing = await db.findContainerBySub(profile.sub);
	if (existing) {
		c.status(400);
		return c.json({ error: 'You already have an account' });
	}

	const pendingApp = await db.getApplicationBySub(profile.sub);
	if (pendingApp?.status === 'pending') {
		c.status(400);
		return c.json({ error: 'You already have a pending application' });
	}

	let eligible = profile.verification_status === 'verified';
	const inviteCode = c.get('session').get('invite_code');
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

	if (!eligible) {
		c.status(403);
		return c.json({
			error:
				'You are not eligible. You must be verified on auth.hackclub.com or have a valid invite code.'
		});
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

		if (!result.ok && result.status != 404) {
			console.error(
				`Failed to check hackatime ban status: ${result.status} - ${await result.text()}`
			);

			c.status(500);
			return c.json({ error: 'Failed to check hackatime ban status.' });
		}

		const data = (await result.json()) as {
			trust_level: string;
			trust_value: number;
		};

		if (data.trust_level === 'red') {
			c.status(403);

			return c.json({
				error: 'You are not eligible for nest as you currently have a fraud ban.'
			});
		}
	} catch (e) {
		console.error('Error checking hackatime ban status:', e);

		c.status(500);
		return c.json({ error: 'Failed to check hackatime ban status.' });
	}

	const body = await c.req.json();
	const username = body.username?.toLowerCase();
	const sshKey = body.sshKey?.trim();
	const reason = body.reason?.trim();
	const template = body.template;

	if (sshKey && sshKey.includes('PRIVATE KEY')) {
		c.status(400);
		return c.json({
			error: 'Please use your SSH public key, not your private key.'
		});
	}

	if (!username || !/^[a-z][a-z0-9_-]{1,30}[a-z0-9]$/.test(username)) {
		c.status(400);
		return c.json({
			error:
				'Invalid username. 3-32 chars, lowercase alphanumeric, hyphens, underscores. Must start with a letter and end with a letter or number.'
		});
	}
	if (reservedUsernames.includes(username.toLowerCase())) {
		return c.json({ error: 'This username is reserved.' });
	}

	try {
		const parsed = utils.parseKey(sshKey);

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

	if (!reason || reason.length < 10) {
		c.status(400);
		return c.json({
			error: 'Please provide a reason (at least 10 characters).'
		});
	}

	const taken = await db.isUsernameTaken(username);
	if (taken) {
		c.status(409);
		return c.json({ error: 'Username is already taken' });
	}

	const app = await db.createApplication({
		sub: profile.sub,
		email: profile.email,
		username,
		sshKey,
		reason,
		template
	});

	if (inviteCode && profile.verification_status !== 'verified') {
		await db.incrementInvite(inviteCode);
		c.get('session').set('invite_code', null);
	}

	return c.json({ message: 'Application submitted', application: app });
});

export default app;
