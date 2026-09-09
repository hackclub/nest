import type { LayoutServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import { loadFlash } from 'sveltekit-flash-message/server';
import { setFlash } from 'sveltekit-flash-message/server';
import * as Sentry from '@sentry/sveltekit';

import trpc from '$lib/server/trpc';
import type { RouterOutput } from '$lib/trpc';

export const load: LayoutServerLoad = loadFlash(async ({ locals, cookies }) => {
	if (!locals.session || !locals.user) {
		redirect(303, '/');
	}

	Sentry.setUser({
		id: locals.user.id,
		email: locals.user.email
	});

	let container: RouterOutput['user']['container'] = null;

	try {
		container = await trpc.user.container.query();
	} catch (err) {
		Sentry.captureException(err);
		error(500, {
			message:
				"If you're seeing this there's a potential outage with Proxmox, please check the status page"
		});
	}
	if (locals.session?.sudo && !container?.suspended) {
		setFlash(
			{
				type: 'error',
				message:
					"You are currently in sudo mode. It allows one action, to confirm deletion press 'Delete Container' again."
			},
			cookies
		);
	}

	return {
		session: {
			user: locals.user,
			session: locals.session
		},
		container,
		admin: await trpc.isAdmin.query()
	};
});
