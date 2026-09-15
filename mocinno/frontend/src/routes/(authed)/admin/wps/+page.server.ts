import type { PageServerLoad } from './$types';

import trpc from '$lib/server/trpc';

export const load = (async () => {
	const stats = await trpc.admin.getWpsStats.query();

	return {
		stats
	};
}) satisfies PageServerLoad;
