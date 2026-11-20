import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ locals, url }) => {
	if (locals.user && !url.searchParams.has('redirect_uri')) {
		return redirect(303, '/dashboard');
	}
}) satisfies PageServerLoad;
