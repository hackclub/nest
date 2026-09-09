import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';

import { auth } from '@/modules/auth';

import * as dbHelpers from '@/db-helpers';

interface TRPCContext {
	session: typeof auth.$Infer.Session.session | null;
	user: typeof auth.$Infer.Session.user | null;
	headers: Headers;
}

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<TRPCContext>().create({
	transformer: superjson,
	errorFormatter(opts) {
		const { shape, error } = opts;
		return {
			...shape,
			data: {
				...shape.data,
				stack: error.cause
			}
		};
	}
});

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;

export const authedProcedure = publicProcedure.use(async (opts) => {
	const { ctx } = opts;

	if (!ctx.session || !ctx.user) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'You must be logged in to access this resource.'
		});
	}

	return opts.next({
		ctx: {
			...ctx,
			user: ctx.user,
			session: ctx.session
		}
	});
});

export const adminProcedure = authedProcedure.use(async (opts) => {
	const { ctx } = opts;

	if (!dbHelpers.isAdmin(ctx.user.email)) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'You must be an admin to access this resource.'
		});
	}

	return opts.next({
		ctx
	});
});
