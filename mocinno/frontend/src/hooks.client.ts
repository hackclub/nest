import * as Sentry from '@sentry/sveltekit';
import { SENTRY_DSN, NODE_ENV } from '$app/env/public';

Sentry.init({
	dsn: SENTRY_DSN,
	environment: NODE_ENV,

	// Tracing
	tracesSampleRate: 1.0,
	tracePropagationTargets: ['localhost', /^\/api/],

	integrations: [Sentry.replayIntegration(), Sentry.browserProfilingIntegration()],

	// Session Replay
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,

	// Browser Profiling
	profileSessionSampleRate: 1.0,
	profileLifecycle: 'trace'
});

export const handleError = Sentry.handleErrorWithSentry();
