import type { LayoutServerLoad } from './$types';
import { setFlash } from 'sveltekit-flash-message/server';

export const load: LayoutServerLoad = async ({ parent, cookies }) => {
	const { container } = await parent();

	if (container?.suspended) {
		setFlash(
			{
				type: 'error',
				message:
					'Your container is suspended, you will be unable to perform any actions while the suspension is active.'
			},
			cookies
		);
	}
};
