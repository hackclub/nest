import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
	const { container } = await parent();

	if (!container) {
		redirect(303, '/application');
	}

	return {
		container
	};
};
