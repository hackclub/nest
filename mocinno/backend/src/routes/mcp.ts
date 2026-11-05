import { createMcpHonoApp } from '@modelcontextprotocol/hono';
import { mount } from 'hono/mount';
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { requireMcpAuth } from '@better-auth/mcp';
import { auth } from '@/modules/auth';
import { z } from 'zod';
import { APP_DOMAIN, APP_SECURE } from '@/env';

const handler = createMcpHandler(
	() => {
		const server = new McpServer({ name: 'nest', version: '1.0.0' });
		server.registerTool(
			'add-note',
			{
				description: 'Save a note',
				inputSchema: z.object({ text: z.string() })
			},
			async ({ text }) => ({ content: [{ type: 'text', text: `Saved: ${text}` }] })
		);
		return server;
	},
	{
		legacy: 'reject'
	}
);

const app = createMcpHonoApp();

app.post(
	'/',
	mount(
		requireMcpAuth(
			auth,
			(request, accessTokenClaims) => {
				console.log(accessTokenClaims);
				return handler.fetch(request);
			},
			{
				resource: `${APP_SECURE ? 'https' : 'http'}://${APP_DOMAIN}/api/mcp`
			}
		)
	)
);

export default app;
