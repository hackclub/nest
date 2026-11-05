import type { PageServerLoad } from './$types';

import trpc from '#lib/server/trpc.js';

export const load = (async () => {
	const stats = await trpc.admin.getEngagementStats.query();

	return {
		stats
	};
}) satisfies PageServerLoad;
