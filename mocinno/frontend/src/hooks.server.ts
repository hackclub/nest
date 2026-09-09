import authServer from '$lib/server/auth';
import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import type { Handle } from '@sveltejs/kit';

// Required for browser profiling: the JS Self-Profiling API needs this header
const documentPolicyHandle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set('Document-Policy', 'js-profiling');
	return response;
};

export const handleAuth: Handle = async ({ event, resolve }) => {
	try {
		const session = await authServer.getSession();

		if (session.error) {
			console.error('Error fetching session:', session.error);
		}

		if (session.data) {
			event.locals.session = session.data.session;
			event.locals.user = session.data.user;
		} else {
			event.locals.session = null;
			event.locals.user = null;
		}

		const response = await resolve(event);
		return response;
	} catch (err) {
		console.error('Error in handle function:', err);
		const response = await resolve(event);
		return response;
	}
};

export const handleError = Sentry.handleErrorWithSentry();

export const sentryHandle = Sentry.sentryHandle();

export const handle = sequence(sentryHandle, documentPolicyHandle, handleAuth);
