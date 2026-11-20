import adapter from '@sveltejs/adapter-bun';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { sentrySvelteKit } from '@sentry/sveltekit/vite';

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
			// bun's default of 10s drops pages whose server load is slow
			adapter: adapter({ serverOptions: { idleTimeout: 35 } }),
			experimental: {
				remoteFunctions: true
			}
		})
	],
	server: {
		host: true,
		allowedHosts: ['localhost', '.localhost', process.env.APP_DOMAIN || ''],
		proxy: {
			'/api': {
				target: `http://localhost:${process.env.MOCINNO_PORT}`
			},
			'/.well-known': {
				target: `http://localhost:${process.env.MOCINNO_PORT}`
			}
		}
	}
});
