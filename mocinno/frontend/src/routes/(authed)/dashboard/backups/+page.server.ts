import type { PageServerLoad } from './$types.js';
import { redirect } from '@sveltejs/kit';

import trpc from '$lib/server/trpc';

export const load: PageServerLoad = async ({ parent }) => {
	const { container } = await parent();

	if (!container) {
		redirect(303, '/application');
	}

	const backups = await trpc.user.backups.query();

	return {
		container,
		backups
	};
};
