import { defineEnvVars } from '@sveltejs/kit/env';
import { building } from '$app/env';
import z from 'zod';

export const variables = defineEnvVars({
	APP_DOMAIN: {
		public: true,
		schema: building ? z.optional(z.string()) : z.string()
	},
	APP_SECURE: {
		public: true,
		schema: building ? z.optional(z.stringbool()) : z.stringbool()
	},
	SENTRY_DSN: {
		public: true,
		schema: building ? z.optional(z.string()) : z.string()
	},
	NODE_ENV: {
		public: true,
		schema: building ? z.optional(z.string()) : z.string()
	},
	AIRTABLE_API_KEY: {
		public: false,
		schema: building ? z.optional(z.string()) : z.string()
	},
	AIRTABLE_BASE: {
		public: false,
		schema: building ? z.optional(z.string()) : z.string()
	}
});
