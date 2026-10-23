import type { PageServerLoad } from './$types';

import trpc from '#lib/server/trpc.js';

export const load = (async () => {
	const stats = await trpc.admin.getUnifiedStats.query();

	return {
		stats
	};
}) satisfies PageServerLoad;
