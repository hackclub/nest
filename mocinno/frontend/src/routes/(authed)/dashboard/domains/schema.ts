import { z } from 'zod';

const domainString = z.stringFormat('domain', z.regexes.domain);

export const formSchema = z.object({
	domain: domainString.trim().toLowerCase(),
	proxy: z.uint32().max(65535).optional().default(80)
});

export type FormSchema = typeof formSchema;
