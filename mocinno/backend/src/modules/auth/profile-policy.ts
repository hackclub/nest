import { APIError, createAuthMiddleware } from 'better-auth/api';
import type { BetterAuthOptions } from 'better-auth';

export const additionalUserFields = {
	slack_id: {
		type: 'string',
		required: true,
		input: true
	},
	verification_status: {
		type: ['verified', 'pending', 'ineligible', 'needs_submission'],
		required: true,
		input: true
	},
	theme: {
		type: 'string',
		defaultValue: 'system',
		required: false,
		input: true
	}
} satisfies NonNullable<BetterAuthOptions['user']>['additionalFields'];

export const protectHcaProfile = createAuthMiddleware(async (ctx) => {
	if (ctx.path !== '/update-user') return;

	for (const field of ['slack_id', 'verification_status']) {
		if (ctx.body && Object.hasOwn(ctx.body, field)) {
			throw new APIError('BAD_REQUEST', {
				code: 'FIELD_NOT_ALLOWED',
				message: `${field} can't be updated`
			});
		}
	}
});
