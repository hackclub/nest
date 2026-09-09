import type { PageServerLoad } from './$types';

import trpc from '$lib/server/trpc';

export const load = (async () => {
	const containers = await trpc.admin.getContainers.query({
		query: '',
		page: 1
	});

	return {
		containers
	};
}) satisfies PageServerLoad;
