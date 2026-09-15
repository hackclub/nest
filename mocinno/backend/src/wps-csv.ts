import { statSync } from 'node:fs';

/**
 * Minimal RFC4180 parser. The export does contain quoted fields, so splitting on
 * commas is not enough.
 */
export function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let quoted = false;

	for (let i = 0; i < text.length; i++) {
		const char = text[i];

		if (quoted) {
			if (char === '"') {
				// A doubled quote inside a quoted field is a literal quote.
				if (text[i + 1] === '"') {
					field += '"';
					i++;
				} else {
					quoted = false;
				}
			} else {
				field += char;
			}
			continue;
		}

		if (char === '"') {
			quoted = true;
		} else if (char === ',') {
			row.push(field);
			field = '';
		} else if (char === '\n') {
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
		} else if (char !== '\r') {
			field += char;
		}
	}

	// Trailing line with no newline terminator.
	if (field !== '' || row.length > 0) {
		row.push(field);
		rows.push(row);
	}

	return rows;
}

/** The export writes `9/14/2026 1:32pm`, which Date cannot parse on its own. */
export function parseCreated(value: string): number | null {
	const match = value
		.trim()
		.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(am|pm))?$/i);

	if (!match) return null;

	const [, month, day, year, hour, minute, meridiem] = match;

	// 12am is hour 0 and 12pm is hour 12, so mod before adding the offset.
	let hours = hour ? Number(hour) % 12 : 0;
	if (meridiem?.toLowerCase() === 'pm') hours += 12;

	const parsed = new Date(
		Number(year),
		Number(month) - 1,
		Number(day),
		hours,
		minute ? Number(minute) : 0
	);

	return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

export type CsvIndex = {
	mtimeMs: number;
	size: number;
	/** Lowercased email -> timestamp of that email's most recent project. */
	latestByEmail: Map<string, number>;
	/** Rows that carried a usable email. */
	rowsIndexed: number;
	exportedAt: Date;
};

export function buildCsvIndex(text: string, mtimeMs: number, size: number, mtime: Date): CsvIndex {
	// Excel writes a BOM on the first header, which would corrupt that column name.
	const rows = parseCsv(text.replace(/^﻿/, ''));
	const header = rows.shift();

	if (!header) {
		throw new Error('csv is empty');
	}

	// Looked up by name so a reordered or extended export keeps working.
	const columns = header.map((column) => column.trim().toLowerCase());
	const emailIndex = columns.indexOf('email');
	const createdIndex = columns.indexOf('created');

	if (emailIndex === -1 || createdIndex === -1) {
		throw new Error('csv is missing an Email or Created column');
	}

	const latestByEmail = new Map<string, number>();
	let rowsIndexed = 0;

	for (const row of rows) {
		const email = row[emailIndex]?.trim().toLowerCase();
		if (!email) continue;

		rowsIndexed++;

		// An unparseable date still counts as participation, just never as recent.
		const created = parseCreated(row[createdIndex] ?? '') ?? Number.NEGATIVE_INFINITY;
		const previous = latestByEmail.get(email);

		if (previous === undefined || created > previous) {
			latestByEmail.set(email, created);
		}
	}

	return { mtimeMs, size, latestByEmail, rowsIndexed, exportedAt: mtime };
}

/**
 * Buckets a list of nest-user emails against the index. Emails are deduped and
 * normalised here, so callers can pass raw column values.
 */
export function countParticipation(
	index: CsvIndex,
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

let cachedIndex: CsvIndex | null = null;

/**
 * Parses the export and indexes it by email. Re-reads only when the file's mtime
 * or size has moved, so the 50k-row parse does not run per request.
 */
export async function loadCsvIndex(path: string): Promise<CsvIndex> {
	const stat = statSync(path);

	if (cachedIndex && cachedIndex.mtimeMs === stat.mtimeMs && cachedIndex.size === stat.size) {
		return cachedIndex;
	}

	const text = await Bun.file(path).text();
	cachedIndex = buildCsvIndex(text, stat.mtimeMs, stat.size, stat.mtime);

	return cachedIndex;
}
