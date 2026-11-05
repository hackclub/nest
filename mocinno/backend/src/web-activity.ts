import { db, schema } from '@/db';
import { localDay } from '@/ssh-activity';

// users already recorded today, so a session lookup costs at most one write per user per day
let seenDay = '';
const seen = new Set<string>();

export function recordWebVisit(userId: string, at = new Date()) {
	const day = localDay(at);

	if (day !== seenDay) {
		seenDay = day;
		seen.clear();
	}

	if (seen.has(userId)) return;
	seen.add(userId);

	db.insert(schema.webActivityTable)
		.values({ user_id: userId, day, first_at: at })
		.onConflictDoNothing()
		.catch((e) => {
			// let a later request retry
			seen.delete(userId);
			console.error('[web-activity] Failed to record visit:', e instanceof Error ? e.message : e);
		});
}
