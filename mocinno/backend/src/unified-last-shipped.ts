export type LastShippedPoint = { start: string; end: string; users: number };

const dateLabel = (date: Date) =>
	`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// first/last weeks are incomplete
export function buildLastShipped(
	users: { ships: number[] | undefined; joinedAt: number }[],
	now: Date
): LastShippedPoint[] {
	const firstOfMonth = new Date(now.getFullYear(), now.getMonth() - 3, 1);
	const daysInMonth = new Date(
		firstOfMonth.getFullYear(),
		firstOfMonth.getMonth() + 1,
		0
	).getDate();
	const cutoff = new Date(
		firstOfMonth.getFullYear(),
		firstOfMonth.getMonth(),
		Math.min(now.getDate(), daysInMonth)
	);
	const buckets: { start: Date; end: Date; users: number }[] = [];
	let start = cutoff;
	while (start.getTime() <= now.getTime()) {
		const daysToMonday = 7 - ((start.getDay() + 6) % 7);
		const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + daysToMonday);
		buckets.push({ start, end, users: 0 });
		start = end;
	}

	for (const user of users) {
		if (user.joinedAt > now.getTime() || !user.ships) continue;
		const latest = user.ships.findLast((ship) => Number.isFinite(ship) && ship <= now.getTime());
		if (latest === undefined || latest < cutoff.getTime()) continue;
		const bucket = buckets.find(
			(bucket) => latest >= bucket.start.getTime() && latest < bucket.end.getTime()
		);
		if (bucket) bucket.users++;
	}

	return buckets.map(({ start, end, users }) => ({
		start: dateLabel(start),
		end: dateLabel(new Date(Math.min(end.getTime() - 1, now.getTime()))),
		users
	}));
}
