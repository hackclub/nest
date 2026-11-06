import { createMcpHonoApp } from '@modelcontextprotocol/hono';
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { auth } from '@/modules/auth';
import { z } from 'zod';
import { APP_DOMAIN, APP_SECURE } from '@/env';
import type { Context } from 'hono';
import {
	createDpopReplayStore,
	isInsufficientScopeError,
	requestToResourceInput,
	verifyAccessTokenRequest,
	type VerifyAccessTokenRequestOptions
} from 'better-auth/oauth2';
import type { JWTPayload } from 'better-auth';
import { createResourceServerChallenge } from '@better-auth/oauth-provider';
import type { HeadersInit } from 'bun';

function toChallengeResponse(
	error: unknown,
	resource: string,
	opts?: Parameters<typeof createResourceServerChallenge>[2]
): Response {
	const challenge = createResourceServerChallenge(error, resource, opts);
	if (!challenge) throw error;
	const headers = new Headers(challenge.headers as HeadersInit);
	headers.set('Content-Type', 'application/json');
	return new Response(
		JSON.stringify({
			jsonrpc: '2.0',
			error: { code: -32000, message: challenge.message },
			id: null
		}),
		{ status: challenge.statusCode, headers }
	);
}

const handler = createMcpHandler(() => {
	const server = new McpServer({ name: 'nest', version: '1.0.0' });
	server.registerTool(
		'user-info',
		{
			title: 'User Info',
			description: 'Get user information'
		},
		async (ctx) => ({
			content: [{ type: 'text', text: JSON.stringify(ctx.http?.authInfo?.extra?.user) }]
		})
	);
	return server;
});

const app = createMcpHonoApp({
	allowedHosts: [
		'nest.hackclub.com',
		new URL(`${APP_SECURE ? 'https' : 'http'}://${APP_DOMAIN}`).hostname
	]
});

app.all('/', async (c: Context) => {
	try {
		const { internalAdapter } = await auth.$context;

		const url = new URL(c.req.url);

		const resource = `${APP_SECURE ? 'https' : 'http'}://${APP_DOMAIN}/api/mcp`;

		const accessTokenVerificationOptions: VerifyAccessTokenRequestOptions = {
			verifyOptions: {
				requiredClaims: ['azp'],
				issuer: `${url.origin}/api/auth`,
				audience: resource
			},
			jwksUrl: `${url.origin}/api/auth/jwks`,
			dpop: {
				replayStore: createDpopReplayStore(internalAdapter)
			}
		};

		let accessTokenClaims: JWTPayload;
		try {
			accessTokenClaims = await verifyAccessTokenRequest(
				requestToResourceInput(c.req.raw),
				accessTokenVerificationOptions
			);
		} catch (error) {
			console.error('Error verifying access token:', error);
			return toChallengeResponse(error, resource);
		}

		let user: typeof auth.$Infer.Session.user | null = null;

		try {
			user = (await internalAdapter.findUserById(accessTokenClaims.sub as string)) as
				typeof auth.$Infer.Session.user | null;
		} catch (error) {
			console.error('Error fetching user:', error);
			return toChallengeResponse(error, resource);
		}

		try {
			return handler.fetch(c.req.raw, {
				parsedBody: c.get('parsedBody'),
				authInfo: {
					token: accessTokenClaims.jti!,
					clientId: accessTokenClaims.client_id as string,
					scopes: (accessTokenClaims.scope as string).split(' '),
					extra: {
						user
					}
				}
			});
		} catch (error) {
			console.error('Error in resourceHandler:', error);
			if (isInsufficientScopeError(error)) {
				return toChallengeResponse(error, resource);
			}
			throw error;
		}
	} catch (err) {
		console.error(err);
	}
});

export default app;
