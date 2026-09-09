import type { PageServerLoad } from './$types.js';
import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { formSchema, type Project } from './schema';
import { zod4 } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async ({ parent }) => {
	const { container } = await parent();

	if (!container) {
		redirect(303, '/application');
	}

	return {
		form: await superValidate(zod4(formSchema)),
		container,
		// TODO(backend): swap for `await trpc.user.projects.query()` once the projects
		// table and the user tRPC procedures exist. Until then the view keeps the list
		// in local state so the UI can be used end to end.
		projects: [] as Project[]
	};
};
