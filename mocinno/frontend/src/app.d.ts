import authClient from '$lib/auth';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

type Flash = { type: 'success' | 'error'; message: string };

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: typeof authClient.$Infer.Session.session | null;
			user: typeof authClient.$Infer.Session.user | null;
		}
		interface PageData {
			flash?: Flash | Flash[];
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
