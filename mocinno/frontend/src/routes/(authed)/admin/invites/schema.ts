import { z } from 'zod';

export const formSchema = z.object({
	uses: z.int().min(1).optional(),
	expires: z.date().optional()
});

export type FormSchema = typeof formSchema;
