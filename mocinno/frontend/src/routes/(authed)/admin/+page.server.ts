import type { PageServerLoad } from './$types';

import trpc from '$lib/server/trpc';

export const load = (async () => {
	return {
		stats: await trpc.admin.getStats.query()
	};
}) satisfies PageServerLoad;
