import type { AppRouter } from '@mocinno/backend/trpc';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

const trpc = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `/api/trpc`,
			transformer: superjson
		})
	]
});

export default trpc;
