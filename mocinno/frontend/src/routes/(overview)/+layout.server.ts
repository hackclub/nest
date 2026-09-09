import type { LayoutServerLoad } from './$types';
import trpc from '$lib/server/trpc';

export const load = (async ({ locals }) => {
	const stats = await trpc.getStats.query();

	return {
		user: locals.user,
		stats
	};
}) satisfies LayoutServerLoad;
