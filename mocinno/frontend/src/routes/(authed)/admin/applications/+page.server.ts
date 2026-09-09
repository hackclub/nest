import type { PageServerLoad } from './$types';

import trpc from '$lib/server/trpc';

export const load = (async () => {
	const applications = await trpc.admin.getApplications.query({
		query: '',
		page: 1
	});

	return {
		applications
	};
}) satisfies PageServerLoad;
