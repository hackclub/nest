import { getConnInfo } from 'hono/bun';
import { ipRestriction } from 'hono/ip-restriction';
import { createMiddleware, createFactory } from 'hono/factory';
import { auth } from '@/modules/auth';

export const localOnly = ipRestriction(
	getConnInfo,
	{
		denyList: [],
		allowList: [
			'127.0.0.1',
			'::1',
			'::ffff:127.0.0.1',
			'172.16.0.0/12',
			'192.168.0.0/16',
			'fc00::/7',
			'fe80::/10'
		]
	},
	async (remote, c) => {
		return c.json({ error: 'Forbidden.', success: false }, 403);
	}
);

export const denyForward = createMiddleware(async (c, next) => {
	if (
		c.req.header('X-Forwarded-For') ||
		c.req.header('X-Forwarded-Proto') ||
		c.req.header('X-Forwarded-Host')
	)
		return c.json({ error: 'Forbidden.', success: false }, 403);
	return next();
});

export const route = createFactory<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		sessionNew: typeof auth.$Infer.Session.session | null;
	};
}>();

export const authMiddleware = createMiddleware<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		sessionNew: typeof auth.$Infer.Session.session | null;
	};
}>(async (c, next) => {
	try {
		const session = await auth.api.getSession({ headers: c.req.raw.headers });
		if (!session) {
			c.set('user', null);
			c.set('sessionNew', null);
			await next();
			return;
		}
		c.set('user', session.user);
		c.set('sessionNew', session.session);
		await next();
	} catch (error) {
		console.error(error);
		await next();
	}
});
