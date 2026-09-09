import { publicProcedure, router } from '@/modules/trpc';
import { authedProcedure } from '@/modules/trpc';
import * as dbHelpers from '@/db-helpers';

import userRouter from './user';
import adminRouter from './admin';
import applicationRouter from './application';
import { nodeStats } from '../public';

export const appRouter = router({
	isAdmin: authedProcedure.query(async ({ ctx }) => {
		return dbHelpers.isAdmin(ctx.user.email);
	}),
	user: userRouter,
	admin: adminRouter,
	application: applicationRouter,
	getStats: publicProcedure.query(async () => {
		return {
			success: !!nodeStats,
			message: nodeStats ? 'Stats retrieved.' : 'Stats not available yet, please try again later.',
			stats: nodeStats
		};
	})
});

export type AppRouter = typeof appRouter;
