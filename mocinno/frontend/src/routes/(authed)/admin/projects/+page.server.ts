import type { PageServerLoad } from './$types';

import trpc from '$lib/server/trpc';

export const load = (async () => {
	const [projects, stats] = await Promise.all([
		trpc.admin.getProjects.query({
			query: '',
			page: 1
		}),
		trpc.admin.getProjectStats.query()
	]);

	return {
		projects,
		stats
	};
}) satisfies PageServerLoad;
