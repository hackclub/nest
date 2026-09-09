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
		domains: await trpc.user.domains.query()
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
			const updateResult = await trpc.user.addDomain.mutate({
				domain: form.data.domain,
				proxy: form.data.proxy
			});

			if (!updateResult.success) {
				return setError(form, updateResult.message || 'Failed to add domain.');
			}
			return message(form, updateResult.message);
		} catch (err) {
			console.error('Error adding domain:', err);
			return fail(500, {
				form,
				message: 'An error occurred while adding domain.'
			});
		}
	}
};
