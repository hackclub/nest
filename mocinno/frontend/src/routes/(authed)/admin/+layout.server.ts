import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

import trpc from '$lib/server/trpc';

const VIEWER_PATHS = ['/admin', '/admin/projects', '/admin/unified'];

export const load: LayoutServerLoad = async ({ url }) => {
	if (!(await trpc.isViewer.query())) {
		redirect(303, '/dashboard');
	}

	if (!VIEWER_PATHS.includes(url.pathname.replace(/\/$/, '')) && !(await trpc.isAdmin.query())) {
		redirect(303, '/admin');
	}
};
