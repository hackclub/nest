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
