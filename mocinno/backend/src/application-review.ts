import { z } from 'zod';

export const applicationReviewSchema = z.discriminatedUnion('action', [
	z.object({ id: z.int(), action: z.literal('approve') }),
	z.object({
		id: z.int(),
		action: z.literal('reject'),
		reason: z.string().trim().min(1, 'Please enter a rejection reason').max(2000)
	})
]);
