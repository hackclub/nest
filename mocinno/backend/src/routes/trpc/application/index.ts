import { router } from '@/modules/trpc';
import { authedProcedure } from '@/modules/trpc';
import { z } from 'zod';

import { db } from '@/db';
import { auth } from '@/modules/auth';

import * as dbHelpers from '@/db-helpers';
import { checkUsername, getTemplates } from '@/utils';
import { utils as sshutils } from 'ssh2';

const applicationRouter = router({
	checkUsername: authedProcedure.input(z.string()).query(async ({ input }) => {
		return await checkUsername(input);
	}),
	getTemplates: authedProcedure.query(async () => {
		return getTemplates();
	}),
	checkEligible: authedProcedure.query(async ({ ctx }) => {
		let verification_status = ctx.user.verification_status;

		try {
			const result = await fetch(
				`https://auth.hackclub.com/api/external/check?email=${encodeURIComponent(ctx.user.email)}`,
				{
					headers: {
						'User-Agent': 'Nest/1.0 (+https://hackclub.app)'
					}
				}
			);

			if (result.ok) {
				const data = (await result.json()) as { result: string };

				const mapped: Record<string, string> = {
					verified_eligible: 'verified',
					verified_but_ineligible: 'ineligible',
					ineligible: 'ineligible',
					pending: 'pending',
					needs_submission: 'needs_submission'
				};

				const newStatus = mapped[data.result];

				if (newStatus && newStatus !== verification_status) {
					await dbHelpers.updateVerificationStatus(ctx.user.id, newStatus);
					verification_status = newStatus as typeof verification_status;
				}
			} else {
				console.error(
					`Failed to check HCA verification status: ${result.status} - ${await result.text()}`
				);
			}
		} catch (err) {
			console.error(`Error checking HCA verification status: ${err}`);
		}

		let hackatime_ban = false;

		try {
			const result = await fetch(
				`https://hackatime.hackclub.com/api/v1/users/${ctx.user.slack_id}/trust_factor`,
				{
					headers: {
						'User-Agent': 'Nest/1.0 (+https://hackclub.app)'
					}
				}
			);

			if (result.ok) {
				const data = (await result.json()) as {
					trust_level: string;
					trust_value: number;
				};

				hackatime_ban = data.trust_level === 'red';
			} else {
				console.error(
					`Failed to check hackatime ban status: ${result.status} - ${await result.text()}`
				);
			}
		} catch (err) {
			console.error(`Error checking hackatime ban status: ${err}`);
		}

		// eslint-disable-next-line no-useless-assignment
		let failReason = '';
		let eligible = verification_status === 'verified';

		const inviteCode = ctx.session.invite_code;
		if (inviteCode && !eligible) {
			const invite = await dbHelpers.getInvite(inviteCode);
			if (
				invite &&
				(!invite.max_uses || invite.uses < invite.max_uses) &&
				(!invite.expires_at || new Date() <= new Date(invite.expires_at))
			) {
				eligible = true;
			}
		}
		// This is dumb but i felt like it would be funny - Lara
		switch (true) {
			case !eligible && !hackatime_ban:
				failReason = 'Please provide identity documents to Hack Club Auth to confirm eligibility.';
				break;
			case hackatime_ban && eligible:
				failReason =
					'You currently have an active hackatime/fraud ban. If you believe this ban is a mistake please contact @fraudsquad on Slack.';
				break;
			case hackatime_ban && !eligible:
				// Unlikely to happen but hell, if somebody manages this, i'd be amazed
				failReason =
					'You currently have an active hackatime/fraud ban and are not verified on Hack Club Auth.';
				break;
			default:
				failReason = 'How did you even hit the default case';
				break;
		}

		return { hackatime_ban, eligible, failReason };
	}),
	submitApplication: authedProcedure
		.input(
			z.object({
				username: z
					.string()
					.min(3, 'Username must be at least 3 characters long.')
					.max(32, 'Username cannot exceed 32 characters.')
					.regex(/^[a-zA-Z0-9-]+$/),
				sshKey: z.string(),
				reason: z.string().min(10, 'Reason must be at least 10 characters long.'),
				template: z.string()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const container = await db.query.containersTable.findFirst({
				where: (container, { eq }) => eq(container.user_id, ctx.user.id)
			});

			if (container) {
				return {
					success: false,
					message: 'You already have an account'
				};
			}

			const pendingApp = await dbHelpers.getApplicationByUserId(ctx.user.id);
			if (pendingApp?.status === 'pending') {
				return {
					success: false,
					message: 'You already have a pending application'
				};
			}

			let eligible = ctx.user.verification_status === 'verified';

			const inviteCode = ctx.session.invite_code;
			if (inviteCode && !eligible) {
				const invite = await dbHelpers.getInvite(inviteCode);
				if (
					invite &&
					(!invite.max_uses || invite.uses < invite.max_uses) &&
					(!invite.expires_at || new Date() <= new Date(invite.expires_at))
				) {
					eligible = true;
				}
			}

			if (!eligible) {
				return {
					success: false,
					message:
						'You are not eligible. You must be verified on auth.hackclub.com or have a valid invite code.'
				};
			}

			try {
				const result = await fetch(
					`https://hackatime.hackclub.com/api/v1/users/${ctx.user.slack_id}/trust_factor`,
					{
						headers: {
							'User-Agent': 'Nest/1.0 (+https://hackclub.app)'
						}
					}
				);

				if (!result.ok && result.status != 404) {
					console.error(
						`Failed to check hackatime ban status: ${result.status} - ${await result.text()}`
					);

					return {
						success: false,
						message: 'Failed to check hackatime ban status.'
					};
				}

				const data = (await result.json()) as {
					trust_level: string;
					trust_value: number;
				};

				if (data.trust_level === 'red') {
					return {
						success: false,
						message: 'You are not eligible for nest as you currently have a fraud ban.'
					};
				}
			} catch (e) {
				console.error('Error checking hackatime ban status:', e);

				return {
					success: false,
					message: 'Failed to check hackatime ban status.'
				};
			}

			if (input.sshKey.includes('PRIVATE KEY')) {
				return {
					success: false,
					message: 'SSH key cannot contain a private key.'
				};
			}

			const valid = await checkUsername(input.username);

			if (valid.allowed === false) {
				let message = 'Username is not allowed.';

				switch (valid.error) {
					case 'reserved':
						message = 'Username is reserved.';
						break;
					case 'invalid':
						message = 'Username is invalid.';
						break;
					case 'taken':
						message = 'Username is already taken.';
						break;
				}

				return {
					success: false,
					message
				};
			}

			const templates = getTemplates();

			if (!templates.includes(input.template)) {
				return {
					success: false,
					message: 'Selected template is not available.'
				};
			}

			try {
				const parsed = sshutils.parseKey(input.sshKey);

				if (parsed instanceof Error) {
					return {
						success: false,
						message: 'Invalid SSH public key format.'
					};
				}
			} catch (e) {
				if (e instanceof Error) {
					console.error('SSH key parsing error:', e.message);
				} else {
					console.error('Unexpected error during SSH key parsing:', e);
				}
				return {
					success: false,
					message: 'Invalid SSH public key format.'
				};
			}

			const app = await dbHelpers.createApplication({
				user_id: ctx.user.id,
				username: input.username,
				sshKey: input.sshKey,
				reason: input.reason,
				template: input.template
			});

			if (inviteCode && ctx.user.verification_status !== 'verified') {
				await dbHelpers.incrementInvite(inviteCode);
				auth.api.updateSession({
					body: {
						invite_code: null
					},
					headers: ctx.headers
				});
			}

			return {
				success: true,
				message: 'Application submitted successfully.',
				application: app
			};
		}),
	getApplication: authedProcedure.query(async ({ ctx }) => {
		return await dbHelpers.getApplicationByUserId(ctx.user.id);
	})
});

export default applicationRouter;
