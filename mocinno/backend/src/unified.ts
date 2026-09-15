import { eq } from 'drizzle-orm';

import { db, schema } from '@/db';
import { UNIFIED_CSV_PATH } from '@/env';
import { countParticipation, loadCsvIndex, type CsvIndex } from '@/unified-csv';

const DAY = 24 * 60 * 60 * 1000;
const RECENT_WINDOW_DAYS = 90;

export type UnifiedStats = {
	totalUsers: number;
	usersWithProjects: number;
	usersRecent: number;
	lastImport: string | null;
	csvError: string | null;
};

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
			lastImport: null,
			csvError: `Could not read ${UNIFIED_CSV_PATH}: ${reason}`
		};

		return cached;
	}

	const [containerRows, applicationRows] = await Promise.all([
		db
			.select({
				sub: schema.containersTable.sub,
				email: schema.user.email
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
	let unresolved = 0;

	for (const container of containerRows) {
		const email = container.email ?? (container.sub ? emailBySub.get(container.sub)?.email : null);

		if (!email) {
			unresolved++;
			continue;
		}

		emails.push(email);
	}

	if (unresolved > 0) {
		console.warn(`Unified stats: ${unresolved} container(s) have no email on user or applications`);
	}

	const counts = countParticipation(index, emails, Date.now() - RECENT_WINDOW_DAYS * DAY);

	cached = {
		...counts,
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
