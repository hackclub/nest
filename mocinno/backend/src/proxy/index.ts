import * as env from '@/env';

import {
	getChallengeResponse,
	getOrIssueCertificate,
	isPublicDomain,
	renewExpiringCertificates
} from '@/cert';

import {
	isWebSocketUpgrade,
	proxyRequest,
	proxyWebSocket,
	reloadProxy,
	wsHandlers,
	type WSData
} from './utils';

import * as db from '@/db-helpers';

Bun.serve<WSData>({
	port: process.env.PORT || 80,
	hostname: '0.0.0.0',
	websocket: wsHandlers,

	async fetch(req, server) {
		const url = new URL(req.url);

		if (url.pathname.startsWith('/.well-known/acme-challenge/')) {
			const token = url.pathname.split('/').pop();
			const keyAuth = getChallengeResponse(token);

			if (keyAuth)
				return new Response(keyAuth, {
					headers: { 'Content-Type': 'application/octet-stream' }
				});
			return new Response('Not found', { status: 404 });
		}

		const host = req.headers.get('host')?.split(':')[0] || '';

		if (env.DISABLE_SSL || !isPublicDomain(host)) {
			try {
				let target: string;
				const appDomain = env.APP_DOMAIN;

				if (appDomain && host === appDomain) {
					target = `127.0.0.1:${env.MOCINNO_PORT}`;
				} else {
					const domainRow = await db.getDomainByName(host);
					if (!domainRow) return new Response('Not found', { status: 404 });
					target = `${domainRow.ip}:${domainRow.proxy}`;
				}

				if (isWebSocketUpgrade(req)) {
					return (
						proxyWebSocket(req, target, server) ??
						new Response('WebSocket upgrade failed', { status: 500 })
					);
				}

				return proxyRequest(req, target);
			} catch (err) {
				if (err instanceof Error) {
					console.error('HTTP proxy error:', err.message);
				} else {
					console.error('HTTP proxy error:', err);
				}
				return new Response('Bad Gateway', { status: 502 });
			}
		}
		return Response.redirect(`https://${req.headers.get('host')}${url.pathname}${url.search}`, 301);
	}
});

(async () => {
	if (!env.DISABLE_SSL) {
		if (env.APP_DOMAIN) {
			try {
				await getOrIssueCertificate(env.APP_DOMAIN);
				console.log(`Certificate ready for ${env.APP_DOMAIN}`);
			} catch (err) {
				if (err instanceof Error) {
					console.error(`Failed to issue certificate for ${env.APP_DOMAIN}:`, err.message);
					return;
				}
				console.error(`Failed to issue certificate for ${env.APP_DOMAIN}, error unknown:`, err);
			}
		}

		const domains = await db.getAllDomains();
		for (const d of domains) {
			try {
				await getOrIssueCertificate(d.domain);
			} catch (err) {
				if (err instanceof Error) {
					console.error(`Failed to issue certificate for ${d.domain}:`, err.message);
					return;
				}
				console.error(`Failed to issue certificate for ${d.domain}, error unknown:`, err);
			}
		}

		await reloadProxy();
		console.log('Proxy server running on port 443');

		setInterval(
			async () => {
				try {
					await renewExpiringCertificates();
					await reloadProxy();
				} catch (err) {
					if (err instanceof Error) {
						console.error('Certificate renewal error:', err.message);
					} else {
						console.error('Certificate renewal error:', err);
					}
				}
			},
			12 * 60 * 60 * 1000
		);
	} else {
		console.log("[!] SSL is disabled. Please don't be stupid with this.");
	}
})();
