import adapter from '@sveltejs/adapter-node';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { sentrySvelteKit } from '@sentry/sveltekit';

export default defineConfig({
	plugins: [
		sentrySvelteKit({
			org: 'hack-club',
			project: 'mocinno',
			authToken: process.env.SENTRY_AUTH_TOKEN,
			adapter: 'node'
		}),
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
				experimental: { async: true }
			},
			adapter: adapter(),
			experimental: {
				remoteFunctions: true,
				handleRenderingErrors: true,
				explicitEnvironmentVariables: true,
				instrumentation: {
					server: true
				},
				tracing: {
					server: true
				}
			},
			alias: {
				'@': '../backend/src'
			}
		})
	],
	server: {
		host: true,
		allowedHosts: ['localhost', '.localhost', process.env.APP_DOMAIN || ''],
		proxy: {
			'/api': {
				target: `http://localhost:${process.env.MOCINNO_PORT}`
			}
		}
	}
});
