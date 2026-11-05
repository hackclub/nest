import { gte, sql, sum } from 'drizzle-orm';

import { db, schema } from '@/db';
import { localDay } from '@/ssh-activity';

const DAY = 24 * 60 * 60 * 1000;
const CACHE_MS = 5 * 60 * 1000;
const DAU_DAYS = 30;
const FAILURE_DAYS = 7;

export type FunnelRange = '30d' | '90d' | 'all';

// each stage counts users who also meet every earlier stage, except `shipped`,
// which only requires `approved` (ssh tracking is newer than most ships)
export type Funnel = {
	signedUp: number;
	eligible: number;
	applied: number;
	approved: number;
	pending: number;
	sshed: number;
	returned: number;
	shipped: number;
};

export type EngagementStats = {
	dau: number;
	wau: number;
	mau: number;
	daily: { day: string; users: number }[];
	failures: { reason: string; count: number }[];
	funnel: Record<FunnelRange, Funnel>;
	medianReviewHours: number | null;
	generatedAt: string;
};

const daysAgo = (now: Date, days: number) =>
	localDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - days));

async function distinctActive(sinceDay: string) {
	const [row] = await db
		.select({ n: sql<number>`count(distinct ${schema.sshActivityTable.container_id})::int` })
		.from(schema.sshActivityTable)
		.where(gte(schema.sshActivityTable.day, sinceDay));
	return row?.n ?? 0;
}

async function getFunnel(since: Date | null): Promise<Funnel> {
	const cohort = since ? sql`where u.created_at >= ${since}` : sql``;

	const rows = (await db.execute(sql`
		with u as (
			select
				u.verification_status = 'verified' as verified,
				exists (select 1 from applications a where a.user_id = u.id) as applied,
				exists (
					select 1 from applications a where a.user_id = u.id and a.status = 'pending'
				) as pending,
				c.id is not null as approved,
				(select count(*) from ssh_activity s where s.container_id = c.id) as ssh_days,
				exists (
					select 1 from unified_ships us where lower(trim(us.email)) = lower(trim(u.email))
				) as shipped
			from "user" u
			left join containers c on c.user_id = u.id
			${cohort}
		)
		select
			count(*)::int as "signedUp",
			count(*) filter (where verified or applied)::int as "eligible",
			count(*) filter (where applied)::int as "applied",
			count(*) filter (where applied and approved)::int as "approved",
			count(*) filter (where applied and not approved and pending)::int as "pending",
			count(*) filter (where applied and approved and ssh_days > 0)::int as "sshed",
			count(*) filter (where applied and approved and ssh_days > 1)::int as "returned",
			count(*) filter (where applied and approved and shipped)::int as "shipped"
		from u
	`)) as Funnel[];

	return rows[0]!;
}

async function getMedianReviewHours(since: Date) {
	const rows = (await db.execute(sql`
		select percentile_cont(0.5) within group (
			order by extract(epoch from (reviewed_at - created_at)) / 3600
		) as hours
		from applications
		where reviewed_at is not null and reviewed_at >= ${since}
	`)) as { hours: number | null }[];
	const hours = rows[0]?.hours;
	return hours == null ? null : Math.round(Number(hours) * 10) / 10;
}

export async function computeEngagementStats(now = new Date()): Promise<EngagementStats> {
	const [dau, wau, mau, dailyRows, failureRows, funnelAll, funnel90, funnel30, medianReviewHours] =
		await Promise.all([
			distinctActive(daysAgo(now, 0)),
			distinctActive(daysAgo(now, 6)),
			distinctActive(daysAgo(now, DAU_DAYS - 1)),
			db
				.select({ day: schema.sshActivityTable.day, users: sql<number>`count(*)::int` })
				.from(schema.sshActivityTable)
				.where(gte(schema.sshActivityTable.day, daysAgo(now, DAU_DAYS - 1)))
				.groupBy(schema.sshActivityTable.day),
			db
				.select({
					reason: schema.sshFailuresTable.reason,
					count: sql<number>`${sum(schema.sshFailuresTable.count)}::int`
				})
				.from(schema.sshFailuresTable)
				.where(gte(schema.sshFailuresTable.day, daysAgo(now, FAILURE_DAYS - 1)))
				.groupBy(schema.sshFailuresTable.reason),
			getFunnel(null),
			getFunnel(new Date(now.getTime() - 90 * DAY)),
			getFunnel(new Date(now.getTime() - 30 * DAY)),
			getMedianReviewHours(new Date(now.getTime() - 30 * DAY))
		]);

	// fill in days with no logins so the chart has a continuous axis
	const byDay = new Map(dailyRows.map((r) => [r.day, r.users]));
	const daily = Array.from({ length: DAU_DAYS }, (_, i) => {
		const day = daysAgo(now, DAU_DAYS - 1 - i);
		return { day, users: byDay.get(day) ?? 0 };
	});

	return {
		dau,
		wau,
		mau,
		daily,
		failures: failureRows.sort((a, b) => b.count - a.count),
		funnel: { all: funnelAll, '90d': funnel90, '30d': funnel30 },
		medianReviewHours,
		generatedAt: now.toISOString()
	};
}

let cached: { stats: EngagementStats; at: number } | null = null;

export async function getEngagementStats(): Promise<EngagementStats> {
	if (cached && Date.now() - cached.at < CACHE_MS) return cached.stats;
	const stats = await computeEngagementStats();
	cached = { stats, at: Date.now() };
	return stats;
}
