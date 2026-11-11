import type { PageServerLoad } from './$types';

import trpc from '#lib/server/trpc.js';

export const load = (async () => {
	return {
		lists: await trpc.admin.getLifecycleLists.query()
	};
}) satisfies PageServerLoad;
