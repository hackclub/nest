import type { AppRouter } from '@mocinno/backend/trpc';
import { createTRPCClient, httpBatchLink, httpSubscriptionLink, splitLink } from '@trpc/client';
import superjson from 'superjson';
import { getRequestEvent } from '$app/server';

import { APP_DOMAIN, APP_SECURE } from '$app/env/public';

const trpc = createTRPCClient<AppRouter>({
	links: [
		splitLink({
			condition: (op) => op.type === 'subscription',
			true: httpSubscriptionLink({
				url: `${APP_SECURE ? 'https' : 'http'}://${APP_DOMAIN}/api/trpc`,
				transformer: superjson,
				eventSourceOptions: async () => {
					return {
						headers: {
							Authorization: `Bearer ${getRequestEvent().cookies.get(APP_SECURE ? '__Secure-mocinno.session_token' : 'mocinno.session_token')}`
						}
					};
				}
			}),
			false: httpBatchLink({
				url: `${APP_SECURE ? 'https' : 'http'}://${APP_DOMAIN}/api/trpc`,
				transformer: superjson,
				headers() {
					return {
						Authorization: `Bearer ${getRequestEvent().cookies.get(APP_SECURE ? '__Secure-mocinno.session_token' : 'mocinno.session_token')}`
					};
				}
			})
		})
	]
});

export default trpc;
