import { route } from '@/middleware';
import { getNodeStats } from '@/pve-utils';
import * as env from '@/env';
import { db, schema } from '@/db';
import { count } from 'drizzle-orm';

type NodeStats = Awaited<ReturnType<typeof getNodeStats>>;

interface StatStructure {
	users: number;
	nodes: Record<string, NodeStats>;
}

// I'm not requesting stats on startup, while I could I feel that's not a good idea - Laura
export let nodeStats: StatStructure | null = null;

// requests every 3 minutes, clarification because cron expressions can be confusing
Bun.cron('*/3 * * * *', async () => {
	try {
		const config = env.CONFIG;

		const nodes = config.servers.map((s) => s.node);

		const stats = await Promise.all(
			nodes.map(async (node) => {
				const stats = await getNodeStats(node);
				return { name: node, stats };
			})
		);

		const rowCount = await db.select({ count: count() }).from(schema.containersTable);

		nodeStats = {
			users: rowCount[0]?.count ?? 271, // user count captured on 27/04/2026 at 23:33 EEST
			nodes: Object.fromEntries(stats.map(({ name, stats }) => [name, stats]))
		};
	} catch (err) {
		if (err instanceof Error) {
			console.error('Failed to update node stats:', err.message);
			return;
		}
		console.error('Failed to update node stats:', err);
	}
});

const app = route.createApp();

app.get('/stats', async (c) => {
	if (!nodeStats) {
		c.status(503);
		return c.json({
			error: 'Stats not available yet, please try again later.'
		});
	}

	return c.json(nodeStats);
});

export default app;
