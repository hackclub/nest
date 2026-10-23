import type { PageServerLoad } from './$types';

import trpc from '#lib/server/trpc.js';

export const load = (async () => {
	const applications = await trpc.admin.getApplications.query({
		query: '',
		page: 1
	});

	return {
		applications
	};
}) satisfies PageServerLoad;
