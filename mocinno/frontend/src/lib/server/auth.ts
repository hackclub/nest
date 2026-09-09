import { createAuthClient } from 'better-auth/client';
import { genericOAuthClient } from 'better-auth/client/plugins';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import type { Auth } from '@mocinno/backend/auth';

import { APP_DOMAIN, APP_SECURE } from '$app/env/public';

import { getRequestEvent } from '$app/server';

const authServer = createAuthClient({
	baseURL: `${APP_SECURE ? 'https' : 'http'}://${APP_DOMAIN}`,
	plugins: [inferAdditionalFields<Auth>(), genericOAuthClient()],
	fetchOptions: {
		onSuccess: (ctx) => {
			const authToken = ctx.response.headers.get('set-auth-token'); // get the token from the response headers
			if (authToken) {
				getRequestEvent().cookies.set(
					APP_SECURE ? '__Secure-mocinno.session_token' : 'mocinno.session_token',
					authToken,
					{
						httpOnly: true,
						secure: APP_SECURE,
						sameSite: 'lax',
						path: '/',
						maxAge: 60 * 60 * 24 * 7 // 7 days
					}
				);
			}
		},
		auth: {
			type: 'Bearer',
			token: () =>
				getRequestEvent().cookies.get(
					APP_SECURE ? '__Secure-mocinno.session_token' : 'mocinno.session_token'
				)
		}
	}
});

export default authServer;
