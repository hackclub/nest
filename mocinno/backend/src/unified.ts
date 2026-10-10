import { eq } from 'drizzle-orm';

import { db, schema } from '@/db';
import { UNIFIED_CSV_PATH } from '@/env';
import { countParticipation, loadCsvIndex, type CsvIndex } from '@/unified-csv';

const DAY = 24 * 60 * 60 * 1000;
const RECENT_WINDOW_DAYS = 90;

export type UnifiedHistoryRange = '30d' | '6m' | '1y';

export type UnifiedHistoryPoint = {
	start: string;
	end: string;
	recent: number;
	stale: number;
	none: number;
};

export type UnifiedStats = {
	totalUsers: number;
	usersWithProjects: number;
	usersRecent: number;
	history: Record<UnifiedHistoryRange, UnifiedHistoryPoint[]>;
	lastImport: string | null;
	csvError: string | null;
};

type Bucket = { start: Date; end: Date };

// yyyy-mm-dd in server time, so the client doesn't shift it by its own timezone
const localDate = (d: Date) =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function dailyBuckets(now: Date, days: number): Bucket[] {
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

	return Array.from({ length: days }, (_, i) => {
		const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1 - i));
		const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
		return { start, end };
	});
}

function weeklyBuckets(now: Date, weeks: number): Bucket[] {
	// weeks start on monday
	const monday = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate() - ((now.getDay() + 6) % 7)
	);

	return Array.from({ length: weeks }, (_, i) => {
		const start = new Date(
			monday.getFullYear(),
			monday.getMonth(),
			monday.getDate() - (weeks - 1 - i) * 7
		);
		const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
		return { start, end };
	});
}

function monthlyBuckets(now: Date, months: number): Bucket[] {
	return Array.from({ length: months }, (_, i) => {
		const start = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
		const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
		return { start, end };
	});
}

// index of the last ship at or before `at`, or -1
function lastShipAtOrBefore(ships: number[], at: number): number {
	let lo = 0;
	let hi = ships.length;

	while (lo < hi) {
		const mid = (lo + hi) >> 1;
		if (ships[mid]! <= at) lo = mid + 1;
		else hi = mid;
	}

	return lo - 1;
}

// each point is a snapshot at the end of its bucket (or now, for the current one),
// counting only users who had joined nest by then
function buildHistory(
	users: { ships: number[] | undefined; joinedAt: number }[],
	buckets: Bucket[],
	now: number
): UnifiedHistoryPoint[] {
	return buckets.map(({ start, end }) => {
		const at = Math.min(end.getTime() - 1, now);
		const cutoff = at - RECENT_WINDOW_DAYS * DAY;

		let recent = 0;
		let stale = 0;
		let none = 0;

		for (const user of users) {
			if (user.joinedAt > at) continue;

			const i = user.ships ? lastShipAtOrBefore(user.ships, at) : -1;

			if (i === -1) none++;
			else if (user.ships![i]! >= cutoff) recent++;
			else stale++;
		}

		return { start: localDate(start), end: new Date(at).toISOString(), recent, stale, none };
	});
}

const EMPTY_HISTORY: UnifiedStats['history'] = { '30d': [], '6m': [], '1y': [] };

let cached: UnifiedStats | null = null;

export async function refreshUnifiedStats(): Promise<UnifiedStats> {
	let index: CsvIndex;

	try {
		index = await loadCsvIndex(UNIFIED_CSV_PATH);
	} catch (err) {
		const reason = err instanceof Error ? err.message : String(err);
		console.error('Failed to read the Unified export:', reason);

		cached = {
			totalUsers: 0,
			usersWithProjects: 0,
			usersRecent: 0,
			history: EMPTY_HISTORY,
			lastImport: null,
			csvError: `Could not read ${UNIFIED_CSV_PATH}: ${reason}`
		};

		return cached;
	}

	const [containerRows, applicationRows] = await Promise.all([
		db
			.select({
				sub: schema.containersTable.sub,
				created_at: schema.containersTable.created_at,
				email: schema.user.email,
				user_created_at: schema.user.createdAt
			})
			.from(schema.containersTable)
			.leftJoin(schema.user, eq(schema.containersTable.user_id, schema.user.id)),
		db
			.select({
				sub: schema.applicationsTable.sub,
				email: schema.applicationsTable.email,
				created_at: schema.applicationsTable.created_at
			})
			.from(schema.applicationsTable)
	]);

	const emailBySub = new Map<string, { email: string; createdAt: number }>();

	for (const application of applicationRows) {
		if (!application.sub || !application.email) continue;

		const createdAt = application.created_at?.getTime() ?? 0;
		const existing = emailBySub.get(application.sub);

		if (!existing || createdAt > existing.createdAt) {
			emailBySub.set(application.sub, { email: application.email, createdAt });
		}
	}

	const emails: string[] = [];
	const joinedByEmail = new Map<string, number>();
	let unresolved = 0;

	for (const container of containerRows) {
		const email = container.email ?? (container.sub ? emailBySub.get(container.sub)?.email : null);

		if (!email) {
			unresolved++;
			continue;
		}

		emails.push(email);

		// a user joins nest when their container is made
		const key = email.trim().toLowerCase();
		const joinedAt = (container.created_at ?? container.user_created_at)?.getTime() ?? 0;
		const previous = joinedByEmail.get(key);

		if (key && (previous === undefined || joinedAt < previous)) {
			joinedByEmail.set(key, joinedAt);
		}
	}

	if (unresolved > 0) {
		console.warn(`Unified stats: ${unresolved} container(s) have no email on user or applications`);
	}

	const now = new Date();
	const counts = countParticipation(index, emails, now.getTime() - RECENT_WINDOW_DAYS * DAY);

	const users = [...joinedByEmail].map(([email, joinedAt]) => ({
		ships: index.shipsByEmail.get(email),
		joinedAt
	}));

	cached = {
		...counts,
		history: {
			'30d': buildHistory(users, dailyBuckets(now, 30), now.getTime()),
			'6m': buildHistory(users, weeklyBuckets(now, 26), now.getTime()),
			'1y': buildHistory(users, monthlyBuckets(now, 12), now.getTime())
		},
		lastImport: index.exportedAt.toISOString().slice(0, 10),
		csvError: null
	};

	return cached;
}

export async function getUnifiedStats(): Promise<UnifiedStats> {
	if (!cached) {
		return refreshUnifiedStats();
	}

	return cached;
}

Bun.cron('*/15 * * * *', refreshUnifiedStats);
