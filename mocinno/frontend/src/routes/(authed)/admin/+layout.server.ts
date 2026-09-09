import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

import trpc from '$lib/server/trpc';

export const load: LayoutServerLoad = async () => {
	if (!(await trpc.isAdmin.query())) {
		redirect(303, '/dashboard');
	}
};
