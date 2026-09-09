import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: process.env.SENTRY_DSN,
	environment: process.env.NODE_ENV,

	// Tracing
	tracesSampleRate: 1.0

	// Note: @sentry/profiling-node is a native V8 add-on and does NOT run on Bun.
	// If you switch to Node.js, install @sentry/profiling-node and add:
	//   import { nodeProfilingIntegration } from '@sentry/profiling-node';
	//   integrations: [nodeProfilingIntegration()],
	//   profileSessionSampleRate: 1.0,
	//   profileLifecycle: 'trace',
});
