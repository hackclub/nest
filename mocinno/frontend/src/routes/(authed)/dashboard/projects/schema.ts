import { z } from 'zod';

export const formSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Project name is required.')
		.max(100, 'Project name must be 100 characters or fewer.'),
	demo: z
		.url({ error: 'Enter a valid demo URL, including https://' })
		.trim()
		.min(1, 'Demo URL is required.'),
	repo: z
		.url({ error: 'Enter a valid repository URL, including https://' })
		.trim()
		.min(1, 'Repository URL is required.')
});

export type FormSchema = typeof formSchema;
