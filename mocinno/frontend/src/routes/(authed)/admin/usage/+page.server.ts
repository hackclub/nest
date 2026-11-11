import type { PageServerLoad } from './$types';

import trpc from '#lib/server/trpc.js';

export const load = (async () => {
	return {
		usage: await trpc.admin.getContainerUsage.query()
	};
}) satisfies PageServerLoad;
