import type { RequestHandler } from './$types';
import favicon from '$lib/assets/favicon.png';

export const GET: RequestHandler = async ({ fetch }) => {
	return fetch(favicon);
};
