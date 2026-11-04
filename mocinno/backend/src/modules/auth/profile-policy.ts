import type { BetterAuthOptions } from 'better-auth';

export const additionalUserFields = {
	slack_id: {
		type: 'string',
		required: false,
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
} satisfies NonNullable<BetterAuthOptions['user']>['additionalFields'];
