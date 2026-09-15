import { eq } from 'drizzle-orm';

import { db, schema } from '@/db';
import { WPS_CSV_PATH } from '@/env';
import { countParticipation, loadCsvIndex, type CsvIndex } from '@/wps-csv';

const DAY = 24 * 60 * 60 * 1000;
const RECENT_WINDOW_DAYS = 90;

export type WpsStats = {
	totalUsers: number;
	usersWithProjects: number;
	usersRecent: number;
	lastImport: string | null;
	csvError: string | null;
};

let cached: WpsStats | null = null;

export async function refreshWpsStats(): Promise<WpsStats> {
	let index: CsvIndex;

	try {
		index = await loadCsvIndex(WPS_CSV_PATH);
	} catch (err) {
		const reason = err instanceof Error ? err.message : String(err);
		console.error('Failed to read the WPS export:', reason);

		cached = {
			totalUsers: 0,
			usersWithProjects: 0,
			usersRecent: 0,
			lastImport: null,
			csvError: `Could not read ${WPS_CSV_PATH}: ${reason}`
		};

		return cached;
	}

	// A nest user is someone with a container -- the same population the projects
	// page counts. Applicants without a container are not nest users yet.
	const rows = await db
		.select({ email: schema.user.email })
		.from(schema.containersTable)
		.innerJoin(schema.user, eq(schema.containersTable.user_id, schema.user.id));

	const counts = countParticipation(
		index,
		rows.map((row) => row.email),
		Date.now() - RECENT_WINDOW_DAYS * DAY
	);

	cached = {
		...counts,
		lastImport: index.exportedAt.toISOString().slice(0, 10),
		csvError: null
	};

	return cached;
}

export async function getWpsStats(): Promise<WpsStats> {
	if (!cached) {
		return refreshWpsStats();
	}

	return cached;
}

// The csv changes rarely, but the 90-day window slides and users get added.
// An unchanged file skips the parse, so this is usually just the one query.
Bun.cron('*/15 * * * *', refreshWpsStats);
