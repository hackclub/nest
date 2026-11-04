import * as env from './env';
import { route } from './middleware';

import '@/proxy/index.ts';
import routes from '@/routes';
import { syncAllContainerNetworks } from '@/network';

const app = route.createApp();

app.route('', routes);

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
	port: env.MOCINNO_PORT,
	maxRequestBodySize: env.MOCINNO_MAX_BODY_REQUEST_SIZE,
	hostname: env.MOCINNO_HOSTNAME,
	idleTimeout: 30
};
