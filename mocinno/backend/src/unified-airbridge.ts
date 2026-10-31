// airbridge errors out if it takes too long
const FETCH_TIMEOUT_MS = 60 * 1000;

export type AirbridgeRecord = { id?: string; fields?: Record<string, unknown> };

export type AirbridgeSelect = {
	fields?: string[];
	filterByFormula?: string;
	sort?: { field: string; direction?: 'asc' | 'desc' }[];
	maxRecords?: number;
};

export type ShipRow = { recordId: string; email: string; approvedAt: string | null };

export type ShipIndex = {
	latestByEmail: Map<string, number>;
	shipsByEmail: Map<string, number[]>;
	rowsIndexed: number;
};

const pad = (n: number) => String(n).padStart(2, '0');

// yyyy-mm-dd in server time
export const localDate = (d: Date) =>
	`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// airtable date fields come back as yyyy-mm-dd, date+time fields as iso strings
export function toApprovedDate(value: unknown): string | null {
	if (typeof value !== 'string') return null;

	const trimmed = value.trim();
	if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

	const parsed = Date.parse(trimmed);
	return Number.isNaN(parsed) ? null : localDate(new Date(parsed));
}

// local midnight, not utc, so day/week buckets line up with server time
export function parseApprovedAt(value: string | null): number | null {
	const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) return null;

	const [, year, month, day] = match;
	const parsed = new Date(Number(year), Number(month) - 1, Number(day));

	return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

export function toShipRows(records: AirbridgeRecord[]): ShipRow[] {
	const rows: ShipRow[] = [];

	for (const record of records) {
		const rawEmail = record.fields?.['Email'];
		const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
		if (!record.id || !email) continue;

		rows.push({
			recordId: record.id,
			email,
			approvedAt: toApprovedDate(record.fields?.['Approved At'])
		});
	}

	return rows;
}

// airbridge's formula parser has no date functions, so windows are plain string comparisons
export const sinceFormula = (from: string) => `{Approved At} >= '${from}'`;
export const rangeFormula = (from: string, to: string) =>
	`AND({Approved At} >= '${from}', {Approved At} < '${to}')`;
export const UNDATED_FORMULA = '{Approved At} = BLANK()';
export const DATED_FORMULA = 'NOT({Approved At} = BLANK())';

// [from, to) month windows covering `earliest` through the month containing `now`
export function monthRanges(earliest: string, now: Date): { from: string; to: string }[] {
	const [year, month] = earliest.split('-').map(Number);
	const ranges: { from: string; to: string }[] = [];

	let start = new Date(year!, month! - 1, 1);
	while (start.getTime() <= now.getTime()) {
		const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
		ranges.push({ from: localDate(start), to: localDate(end) });
		start = end;
	}

	return ranges;
}

export function buildShipIndex(rows: { email: string; approvedAt: string | null }[]): ShipIndex {
	const latestByEmail = new Map<string, number>();
	const shipsByEmail = new Map<string, number[]>();
	let rowsIndexed = 0;

	for (const row of rows) {
		const email = row.email.trim().toLowerCase();
		if (!email) continue;

		rowsIndexed++;

		// no approval date still counts as a project, just never a recent one
		const approved = parseApprovedAt(row.approvedAt) ?? Number.NEGATIVE_INFINITY;
		const previous = latestByEmail.get(email);

		if (previous === undefined || approved > previous) {
			latestByEmail.set(email, approved);
		}

		const ships = shipsByEmail.get(email);
		if (ships) ships.push(approved);
		else shipsByEmail.set(email, [approved]);
	}

	for (const ships of shipsByEmail.values()) {
		ships.sort((a, b) => a - b);
	}

	return { latestByEmail, shipsByEmail, rowsIndexed };
}

export function countParticipation(
	index: ShipIndex,
	emails: string[],
	cutoff: number
): { totalUsers: number; usersWithProjects: number; usersRecent: number } {
	const seen = new Set<string>();

	let usersWithProjects = 0;
	let usersRecent = 0;

	for (const raw of emails) {
		const email = raw.trim().toLowerCase();
		if (!email || seen.has(email)) continue;
		seen.add(email);

		const latest = index.latestByEmail.get(email);
		if (latest === undefined) continue;

		usersWithProjects++;
		if (latest >= cutoff) usersRecent++;
	}

	return { totalUsers: seen.size, usersWithProjects, usersRecent };
}

export async function fetchApprovedProjects(
	baseUrl: string,
	authKey: string,
	select: AirbridgeSelect
): Promise<AirbridgeRecord[]> {
	const url = new URL(`${baseUrl.replace(/\/+$/, '')}/Nest/Approved%20Projects`);
	url.searchParams.set('authKey', authKey);
	url.searchParams.set('select', JSON.stringify(select));

	const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });

	if (!res.ok) {
		const body = await res.text().catch(() => '');
		const detail = body.trimStart().startsWith('{') ? `: ${body.slice(0, 200)}` : '';
		throw new Error(`airbridge responded ${res.status}${detail}`);
	}

	const body: unknown = await res.json();

	if (!Array.isArray(body)) {
		throw new Error('airbridge returned a non-array response');
	}

	return body as AirbridgeRecord[];
}

export async function fetchShipRows(
	baseUrl: string,
	authKey: string,
	filterByFormula: string
): Promise<ShipRow[]> {
	const records = await fetchApprovedProjects(baseUrl, authKey, {
		fields: ['Email', 'Approved At'],
		filterByFormula
	});

	return toShipRows(records);
}
