import { z } from 'zod';

export const formSchema = z.object({
	username: z
		.string()
		.min(3, 'Username must be at least 3 characters long.')
		.max(32, 'Username cannot exceed 32 characters.')
		.regex(/^[a-zA-Z0-9-]+$/, 'Must be 3-32 characters: letters, numbers, hyphens.'),
	sshKey: z.string(),
	reason: z.string().min(10, 'Reason must be at least 10 characters long.'),
	template: z.string()
});

export type FormSchema = typeof formSchema;
