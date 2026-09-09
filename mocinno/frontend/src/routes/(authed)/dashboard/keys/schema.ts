import { z } from 'zod';

export const formSchema = z.object({
	key: z.string().trim().min(1, 'SSH key is required.')
});

export type FormSchema = typeof formSchema;
