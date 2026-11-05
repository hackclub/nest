import * as env from './env';
import { route } from './middleware';

import '@/proxy/index.ts';
import routes from '@/routes';
import { mount } from 'hono/mount';
import { syncAllContainerNetworks } from '@/network';
import { serverClient } from '@/modules/auth/client';
import { auth } from '@/modules/auth';
import { oauthProviderAuthServerMetadata } from '@better-auth/oauth-provider';
import { DPOP_SIGNING_ALGORITHMS } from 'better-auth/oauth2';

const app = route.createApp();

app.route('', routes);
app.get(
	'/.well-known/oauth-authorization-server/api/auth',
	mount(oauthProviderAuthServerMetadata(auth))
);
app.get('/.well-known/oauth-protected-resource/*', async (c) => {
	console.log(c.req.url);
	const url = new URL(c.req.url);
	return c.json(
		await serverClient.getProtectedResourceMetadata({
			resource: `${url.origin}/api/mcp`,
			authorization_servers: [`${url.origin}/.well-known/oauth-authorization-server/api/auth`],
			bearer_methods_supported: ['header'],
			dpop_signing_alg_values_supported: [...DPOP_SIGNING_ALGORITHMS]
		})
	);
});
// Bring container networking in line with the node config (gateways, ipv6 prefix)
syncAllContainerNetworks().catch((err) => console.error('[network] Startup sync crashed:', err));

process.on('uncaughtException', (error) => {
	console.error(error);
});

process.on('unhandledRejection', (error) => {
	console.error(error);
});

export default {
	...app,
	fetch: (req: Request) => {
		const url = new URL(req.url);
		url.protocol = req.headers.get('x-forwarded-proto') ?? url.protocol;
		// @ts-expect-error I don't even know why there's a constructor issue
		return app.fetch(new Request(url, req));
	},
	port: env.MOCINNO_PORT,
	maxRequestBodySize: env.MOCINNO_MAX_BODY_REQUEST_SIZE,
	hostname: env.MOCINNO_HOSTNAME,
	idleTimeout: 30
};
