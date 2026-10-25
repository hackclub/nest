import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { bearer, genericOAuth } from 'better-auth/plugins';
import { createAuthMiddleware } from 'better-auth/api';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { getOAuthState } from 'better-auth/api';
import type { BetterAuthPlugin } from 'better-auth';

import {
	ENCRYPTION_KEY,
	APP_DOMAIN,
	APP_SECURE,
	OAUTH_CLIENT_ID,
	OAUTH_CLIENT_SECRET
} from '@/env';
import { isContainerSuspended } from '@/pve-utils';

// better-auth 1.7 moved generic oauth callbacks to /callback/:id, keep the
// /oauth2/callback/:id url that's registered with hca (see routes/index.ts)
const legacyOAuthCallback = (): BetterAuthPlugin => {
	const setCallbackPath = (providers: { id: string; callbackPath?: string }[]) => {
		for (const provider of providers) {
			if (provider.id === 'hackclub') provider.callbackPath = '/oauth2/callback/hackclub';
		}
	};

	return {
		id: 'legacy-oauth-callback',
		init: (ctx) => {
			setCallbackPath(ctx.socialProviders);
		},
		hooks: {
			// generic-oauth re-adds the provider if discovery failed at startup
			before: [
				{
					matcher: () => true,
					handler: createAuthMiddleware(async (ctx) => {
						setCallbackPath(ctx.context.socialProviders);
					})
				}
			]
		}
	};
};

export const auth = betterAuth({
	secret: ENCRYPTION_KEY,
	baseURL: {
		allowedHosts: ['dashboard.hackclub.app', 'nest.hackclub.com', APP_DOMAIN || ''],
		protocol: APP_SECURE ? 'https' : 'http'
	},
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema
	}),
	user: {
		additionalFields: {
			slack_id: {
				type: 'string',
				required: true,
				input: false
			},
			verification_status: {
				type: ['verified', 'pending', 'ineligible', 'needs_submission'],
				required: true,
				input: false
			},
			theme: {
				type: 'string',
				defaultValue: 'system',
				required: false,
				input: true
			}
		}
	},
	session: {
		additionalFields: {
			invite_code: {
				type: 'string',
				required: false,
				input: true
			},
			sudo: {
				type: 'boolean',
				defaultValue: false,
				required: true,
				input: false
			}
		}
	},
	plugins: [
		bearer(),
		genericOAuth({
			config: [
				{
					providerId: 'hackclub',
					clientId: OAUTH_CLIENT_ID,
					clientSecret: OAUTH_CLIENT_SECRET,
					discoveryUrl: 'https://auth.hackclub.com/.well-known/openid-configuration',
					scopes: ['openid', 'profile', 'email', 'verification_status', 'slack_id'],
					prompt: 'consent',
					overrideUserInfo: true,
					mapProfileToUser: (profile) => ({
						slack_id: profile.slack_id as string,
						verification_status: profile.verification_status as string
					})
				}
			]
		}),
		legacyOAuthCallback()
	],
	advanced: {
		cookiePrefix: 'mocinno',
		useSecureCookies: APP_SECURE,
		trustedProxyHeaders: true
	},
	databaseHooks: {
		session: {
			create: {
				before: async (session, ctx) => {
					if (!ctx) {
						return;
					}

					const additionalData = await getOAuthState();

					if (ctx.path.startsWith('/callback/')) {
						let canSudo = true;

						const container = await db.query.containersTable.findFirst({
							where: (containersTable, { eq }) => eq(containersTable.user_id, session.userId)
						});

						if (additionalData?.sudo && container) {
							const suspended = await isContainerSuspended(container);

							canSudo = !suspended;
						}

						return {
							data: {
								invite_code: additionalData?.invite_code,
								sudo: (canSudo && additionalData?.sudo) || false
							}
						};
					}
				}
			}
		}
	},
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			switch (true) {
				case ctx.path.startsWith('/callback/'): {
					if (!ctx.context.newSession) {
						break;
					}

					if (!ctx.request) {
						break;
					}

					const accounts = await ctx.context.internalAdapter.findAccountByUserId(
						ctx.context.newSession.user.id
					);

					const hca = accounts.find((account) => account.providerId === 'hackclub');

					if (!hca) {
						break;
					}

					const container = await db.query.containersTable.findFirst({
						where: (containersTable, { eq }) => eq(containersTable.sub, hca.accountId)
					});

					if (container) {
						await db
							.update(schema.containersTable)
							.set({
								user_id: ctx.context.newSession.user.id,
								sub: null
							})
							.where(eq(schema.containersTable.id, container.id));
					}

					const applications = await db.query.applicationsTable.findMany({
						where: (applicationsTable, { eq }) => eq(applicationsTable.sub, hca.accountId)
					});

					for (const application of applications) {
						await db
							.update(schema.applicationsTable)
							.set({
								user_id: ctx.context.newSession.user.id,
								sub: null,
								email: null
							})
							.where(eq(schema.applicationsTable.id, application.id));
					}

					const reviewerApplications = await db.query.applicationsTable.findMany({
						where: (applicationsTable, { eq }) =>
							eq(applicationsTable.reviewed_by, ctx.context.newSession!.user.email)
					});

					for (const application of reviewerApplications) {
						await db
							.update(schema.applicationsTable)
							.set({
								reviewed_by: ctx.context.newSession.user.id
							})
							.where(eq(schema.applicationsTable.id, application.id));
					}

					break;
				}
			}
		})
	}
});

export type Auth = typeof auth;
