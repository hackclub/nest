import { gte, sql } from 'drizzle-orm';

import { db, schema } from '@/db';
import { getSetting, setSetting } from '@/db-helpers';
import { AIRBRIDGE_KEY, AIRBRIDGE_URL } from '@/env';
import {
	DATED_FORMULA,
	UNDATED_FORMULA,
	fetchApprovedProjects,
	fetchShipRows,
	localDate,
	monthRanges,
	rangeFormula,
	sinceFormula,
	toApprovedDate,
	type ShipRow
} from '@/unified-airbridge';

const DAY = 24 * 60 * 60 * 1000;
const RECENT_SYNC_DAYS = 90;
const INSERT_BATCH = 1000;

const BACKFILLED_KEY = 'unified_backfill';
const SYNCED_KEY = 'unified_synced_at';

type Executor = Pick<typeof db, 'insert'>;

async function upsertShips(executor: Executor, rows: ShipRow[]) {
	for (let i = 0; i < rows.length; i += INSERT_BATCH) {
		const batch = rows.slice(i, i + INSERT_BATCH);

		await executor
			.insert(schema.unifiedShipsTable)
			.values(
				batch.map((row) => ({
					record_id: row.recordId,
					email: row.email,
					approved_at: row.approvedAt
				}))
			)
			.onConflictDoUpdate({
				target: schema.unifiedShipsTable.record_id,
				set: {
					email: sql`excluded.email`,
					approved_at: sql`excluded.approved_at`,
					synced_at: sql`now()`
				}
			});
	}
}

function requireKey(): string {
	if (!AIRBRIDGE_KEY) throw new Error('AIRBRIDGE_KEY is not set');
	return AIRBRIDGE_KEY;
}

// claims the backfill by inserting its marker; false if any earlier run already claimed it
async function claimBackfill(): Promise<boolean> {
	const claimed = await db
		.insert(schema.settingsTable)
		.values({ key: BACKFILLED_KEY, value: `started ${new Date().toISOString()}` })
		.onConflictDoNothing()
		.returning();

	return claimed.length > 0;
}

// full table sync (one-time)
export async function backfillShips(now = new Date()) {
	const key = requireKey();

	if (!(await claimBackfill())) {
		const marker = await getSetting(BACKFILLED_KEY);
		throw new Error(
			`already run (${marker}). to run it again, delete the '${BACKFILLED_KEY}' row from settings`
		);
	}

	const [earliest] = await fetchApprovedProjects(AIRBRIDGE_URL, key, {
		fields: ['Approved At'],
		filterByFormula: DATED_FORMULA,
		sort: [{ field: 'Approved At', direction: 'asc' }],
		maxRecords: 1
	});
	const from = toApprovedDate(earliest?.fields?.['Approved At']) ?? localDate(now);

	let total = 0;

	for (const range of monthRanges(from, now)) {
		const rows = await fetchShipRows(AIRBRIDGE_URL, key, rangeFormula(range.from, range.to));
		await upsertShips(db, rows);

		total += rows.length;
		console.log(`Unified backfill: ${range.from} → ${rows.length} ships`);
	}

	const undated = await fetchShipRows(AIRBRIDGE_URL, key, UNDATED_FORMULA);
	await upsertShips(db, undated);
	total += undated.length;

	await setSetting(BACKFILLED_KEY, `finished ${new Date().toISOString()}`);
	console.log(`Unified backfill: done, ${total} ships`);
}

export async function syncRecentShips(now = new Date()) {
	const key = requireKey();
	const cutoff = localDate(new Date(now.getTime() - RECENT_SYNC_DAYS * DAY));

	const rows = await fetchShipRows(AIRBRIDGE_URL, key, sinceFormula(cutoff));

	await db.transaction(async (tx) => {
		await tx
			.delete(schema.unifiedShipsTable)
			.where(gte(schema.unifiedShipsTable.approved_at, cutoff));
		await upsertShips(tx, rows);
	});

	await setSetting(SYNCED_KEY, new Date().toISOString());
	console.log(`Unified sync: ${rows.length} ships since ${cutoff}`);
}

let lastError: string | null = null;
let running: Promise<void> | null = null;

async function doSync(force: boolean) {
	try {
		if (!force) {
			// skip the boot-time sync if the daily one already ran recently
			const synced = await getSetting(SYNCED_KEY);
			if (synced && Date.now() - Date.parse(synced) < DAY) return;
		}

		await syncRecentShips();
		lastError = null;
	} catch (err) {
		const reason = err instanceof Error ? err.message : String(err);
		console.error('Failed to sync Unified ships from Airbridge:', reason);

		lastError = `Could not sync from Airbridge: ${reason}`;
	}
}

export function syncShips({ force = false } = {}): Promise<void> {
	running ??= doSync(force).finally(() => {
		running = null;
	});

	return running;
}

export function getSyncError() {
	return lastError;
}

export function getLastSync() {
	return getSetting(SYNCED_KEY);
}

export function getBackfillStatus() {
	return getSetting(BACKFILLED_KEY);
}
