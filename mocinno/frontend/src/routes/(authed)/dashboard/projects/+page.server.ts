import type { PageServerLoad, Actions } from './$types.js';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate, message, setError } from 'sveltekit-superforms';
import { formSchema } from './schema';
import trpc from '$lib/server/trpc';
import { zod4 } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async ({ parent }) => {
	const { container } = await parent();

	if (!container) {
		redirect(303, '/application');
	}

	return {
		form: await superValidate(zod4(formSchema)),
		container,
		projects: await trpc.user.projects.query()
	};
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod4(formSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		try {
			const addResult = await trpc.user.addProject.mutate({
				name: form.data.name,
				demo: form.data.demo,
				repo: form.data.repo
			});

			if (!addResult.success) {
				return setError(form, addResult.message || 'Failed to add project.');
			}
			return message(form, addResult.message);
		} catch (err) {
			console.error('Error adding project:', err);
			return fail(500, {
				form,
				message: 'An error occurred while adding project.'
			});
		}
	}
};
