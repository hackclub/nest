import type { PageServerLoad, Actions } from './$types.js';
import { fail } from '@sveltejs/kit';
import { superValidate, message, setError } from 'sveltekit-superforms';
import { formSchema } from './schema';
import trpc from '$lib/server/trpc';
import { zod4 } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async () => {
	const invites = await trpc.admin.getInvites.query({
		query: '',
		page: 1
	});

	return {
		form: await superValidate(zod4(formSchema)),
		invites
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
			const updateResult = await trpc.admin.createInvite.mutate({
				uses: form.data.uses,
				expires: form.data.expires
			});

			if (!updateResult.success) {
				return setError(form, updateResult.message || 'Failed to add ssh key.');
			}
			return message(form, updateResult.message);
		} catch (err) {
			console.error('Error adding ssh key:', err);
			return fail(500, {
				form,
				message: 'An error occurred while adding ssh key.'
			});
		}
	}
};
