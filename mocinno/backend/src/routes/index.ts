import { route, authMiddleware } from '@/middleware';
import { auth } from '@/modules/auth';
import { trpcServer } from '@hono/trpc-server';

//import adminRoutes from './admin';
//import authRoutes from './auth';
//import userRoutes from './user';
import publicRoutes from './public';
//import applicationRoutes from './application';
import internalRoutes from './internal';

import { appRouter } from './trpc';

const app = route.createApp().basePath('/api');

app.use('/trpc/*', authMiddleware);
app.use('/auth/*', authMiddleware);

app.on(['POST', 'GET'], '/auth/*', (c) => {
	const url = new URL(c.req.url);

	// hca redirects to /oauth2/callback/:id, better-auth handles it at /callback/:id
	if (url.pathname.startsWith('/api/auth/oauth2/callback/')) {
		url.pathname = url.pathname.replace('/oauth2/callback/', '/callback/');
		return auth.handler(
			new Request(url.toString(), {
				method: c.req.method,
				headers: c.req.raw.headers,
				body: c.req.raw.body
			})
		);
	}

	return auth.handler(c.req.raw);
});

app.use(
	'/trpc/*',
	trpcServer({
		endpoint: '/api/trpc',
		router: appRouter,
		createContext: (opts, c) => ({
			session: c.get('sessionNew'),
			user: c.get('user'),
			headers: c.req.raw.headers
		})
	})
);

//app.route('/admin', adminRoutes);
//app.route('/authorization', authRoutes);
//app.route('/user', userRoutes);
app.route('/public', publicRoutes);
//app.route('/application', applicationRoutes);
app.route('/internal', internalRoutes);

export default app;
