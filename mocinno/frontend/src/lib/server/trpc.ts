import type { AppRouter } from '@mocinno/backend/trpc';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { getRequestEvent } from '$app/server';

import { APP_DOMAIN, APP_SECURE } from '$app/env/public';

const trpc = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${APP_SECURE ? 'https' : 'http'}://${APP_DOMAIN}/api/trpc`,
			transformer: superjson,
			headers() {
				return {
					Authorization: `Bearer ${getRequestEvent().cookies.get(APP_SECURE ? '__Secure-mocinno.session_token' : 'mocinno.session_token')}`
				};
			}
		})
	]
});

export default trpc;
