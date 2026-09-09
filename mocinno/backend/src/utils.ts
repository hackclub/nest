import { resolve } from 'node:dns/promises';
import * as crypto from 'node:crypto';
import reservedUsernames from '@/reservedUsernames';
import { CONFIG } from '@/env';

import * as dbHelpers from '@/db-helpers';

export async function checkUsername(username: string): Promise<{
	allowed: boolean;
	error?: 'reserved' | 'invalid' | 'taken';
}> {
	if (!username || !/^[a-z][a-z0-9_-]{1,30}[a-z0-9]$/.test(username)) {
		return {
			allowed: false,
			error: 'invalid'
		};
	}
	if (reservedUsernames.includes(username.toLowerCase())) {
		return {
			allowed: false,
			error: 'reserved'
		};
	}

	const taken = await dbHelpers.isUsernameTaken(username);
	return {
		allowed: !taken,
		error: taken ? 'taken' : undefined
	};
}

export async function checkDNSVerification(domain: string, username: string) {
	try {
		const records = await resolve(domain, 'TXT');
		for (const record of records) {
			const txt = record.join('');
			if (txt === `domain-verification=${username}`) return true;
		}
	} catch {
		// Ignore
	}

	try {
		const cnames = await resolve(domain, 'CNAME');
		for (const cname of cnames) {
			if (cname === `${username}.hackclub.app` || cname === `${username}.hackclub.app.`)
				return true;
		}
	} catch {
		// Ignore
	}

	return false;
}

export function formatUptime(seconds: number) {
	const d = Math.floor(seconds / 86400);
	const h = Math.floor((seconds % 86400) / 3600);
	const m = Math.floor((seconds % 3600) / 60);

	const parts = [];
	if (d) parts.push(`${d}d`);
	if (h) parts.push(`${h}h`);
	if (m) parts.push(`${m}m`);

	return parts.join(' ') || '0m';
}

export function isFQDN(domain: string) {
	return /^(?!-)[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(domain);
}

export function isWhitelisted(domain: string, username: string) {
	return (
		domain === `${username}.hackclub.app` ||
		domain.endsWith(`.${username}.hackclub.app`) ||
		domain.endsWith(`.${username}.localhost`) ||
		domain.endsWith(`${username}.localhost`)
	);
}

export function generateState(length = 16) {
	return crypto
		.randomBytes(length)
		.toString('base64')
		.replace(/[^a-zA-Z0-9]/g, '')
		.slice(0, length);
}

export function getTemplates() {
	return CONFIG.servers[0]?.templates.map((t) => t.name) || [];
}
