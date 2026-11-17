import { buildShipIndex } from '@/unified-airbridge';

const DAY = 24 * 60 * 60 * 1000;
const INACTIVE_DAYS = 90;
const WARN_DAYS = 60;

export const AGED_OUT_RESULT = 'verified_but_over_18';

export const LIFECYCLE_EMAIL_KINDS = ['aged_out', 'never_shipped'] as const;
export type LifecycleEmailKind = (typeof LIFECYCLE_EMAIL_KINDS)[number];

const SUSPEND_AFTER_DAYS = 30;

export const suspendAfter = (sentAt: Date) => new Date(sentAt.getTime() + SUSPEND_AFTER_DAYS * DAY);

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export type LifecycleMember = {
	containerId: number;
	username: string;
	email: string | null;
	node: string | null;
	joinedAt: Date | null;
	lastSshAt: Date | null;
	hcaResult: string | null;
	agedOutAt: Date | null;
};

export type LifecycleRow = LifecycleMember & { lastShippedAt: Date | null };

export type LifecycleLists = {
	agedOut: LifecycleRow[];
	neverShipped: LifecycleRow[];
	toWarn: LifecycleRow[];
	stale: LifecycleRow[];
};

const time = (date: Date | null) => date?.getTime() ?? 0;

export function buildLifecycleLists(
	members: LifecycleMember[],
	ships: { email: string; approvedAt: string | null }[],
	now: Date
): LifecycleLists {
	const { latestByEmail } = buildShipIndex(ships);
	const cutoff = now.getTime() - INACTIVE_DAYS * DAY;
	const warnCutoff = now.getTime() - WARN_DAYS * DAY;
	const lists: LifecycleLists = { agedOut: [], neverShipped: [], toWarn: [], stale: [] };

	for (const member of members) {
		const latest = member.email ? latestByEmail.get(normalizeEmail(member.email)) : undefined;
		const row = {
			...member,
			lastShippedAt: latest !== undefined && Number.isFinite(latest) ? new Date(latest) : null
		};

		if (member.hcaResult === AGED_OUT_RESULT) {
			lists.agedOut.push(row);
			continue;
		}

		if (!member.email) continue;

		if (latest === undefined) {
			if (time(member.joinedAt) <= cutoff) lists.neverShipped.push(row);
			if (time(member.joinedAt) <= warnCutoff) lists.toWarn.push(row);
		} else if (latest < cutoff) {
			lists.stale.push(row);
		}
	}

	lists.agedOut.sort((a, b) => time(a.agedOutAt) - time(b.agedOutAt));
	lists.neverShipped.sort((a, b) => time(a.joinedAt) - time(b.joinedAt));
	lists.toWarn.sort((a, b) => time(a.joinedAt) - time(b.joinedAt));
	lists.stale.sort((a, b) => time(a.lastShippedAt) - time(b.lastShippedAt));

	return lists;
}
