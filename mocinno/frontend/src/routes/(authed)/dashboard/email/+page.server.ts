import type { PageServerLoad } from './$types.js';
import { redirect } from '@sveltejs/kit';
import trpc from '$lib/server/trpc';

export const load: PageServerLoad = async ({ parent }) => {
	const { container } = await parent();

	if (!container) {
		redirect(303, '/application');
	}

	return {
		container,
		email: await trpc.user.email.query()
	};
};
