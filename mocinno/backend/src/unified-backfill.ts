// bun run unified:backfill
import { backfillShips } from '@/unified-sync';

try {
	await backfillShips();
	process.exit(0);
} catch (err) {
	console.error('Unified backfill failed:', err instanceof Error ? err.message : err);
	process.exit(1);
}
