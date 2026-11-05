<script lang="ts">
	type Series = 'either' | 'ssh' | 'web';
	type Point = { day: string } & Record<Series, number>;

	let { daily }: { daily: Point[] } = $props();

	const SERIES: { key: Series; label: string; title: string }[] = [
		{ key: 'either', label: 'Either', title: 'SSHed in or used the dashboard' },
		{ key: 'ssh', label: 'SSH', title: 'SSHed in through the bastion' },
		{ key: 'web', label: 'Dashboard', title: 'Used the dashboard while signed in' }
	];

	// one series at a time, so the chart stays a single colour
	let series = $state<Series>('either');
	const value = (p: Point) => p[series];
	const current = $derived(SERIES.find((s) => s.key === series)!);

	let showTable = $state(false);
	let hovered = $state<number | null>(null);
	let width = $state(0);

	const parseDay = (value: string) => {
		const [y, m, d] = value.split('-').map(Number);
		return new Date(y, m - 1, d);
	};

	const axisLabel = (p: Point) =>
		parseDay(p.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

	const fullLabel = (p: Point) =>
		parseDay(p.day).toLocaleDateString(undefined, {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});

	const HEIGHT = 200;
	const PAD = { top: 8, right: 4, bottom: 24, left: 40 };
	const RADIUS = 4;

	const plotW = $derived(Math.max(0, width - PAD.left - PAD.right));
	const plotH = HEIGHT - PAD.top - PAD.bottom;

	const ticks = $derived.by(() => {
		const max = Math.max(1, ...daily.map(value));
		const rough = max / 4;
		const magnitude = 10 ** Math.floor(Math.log10(Math.max(1, rough)));
		const step = Math.max(1, ([1, 2, 5, 10].find((m) => m * magnitude >= rough) ?? 10) * magnitude);
		const top = Math.ceil(max / step) * step;
		return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
	});

	const yMax = $derived(ticks.at(-1) ?? 1);
	const y = (v: number) => PAD.top + plotH - (v / yMax) * plotH;

	const band = $derived(daily.length > 0 ? plotW / daily.length : 0);
	const barW = $derived(Math.min(32, Math.max(2, band * 0.7)));

	const labelEvery = $derived(
		Math.max(1, Math.ceil(daily.length / Math.max(1, Math.floor(plotW / 64))))
	);
	const showLabel = (i: number) => (daily.length - 1 - i) % labelEvery === 0;

	function roundedTop(x: number, top: number, w: number, h: number) {
		const r = Math.min(RADIUS, w / 2, h);
		return `M${x},${top + h}V${top + r}Q${x},${top} ${x + r},${top}H${x + w - r}Q${x + w},${top} ${x + w},${top + r}V${top + h}Z`;
	}

	const bars = $derived(
		daily.map((p, i) => {
			const x = PAD.left + band * i + (band - barW) / 2;
			const top = y(value(p));
			return { x, d: value(p) > 0 ? roundedTop(x, top, barW, y(0) - top) : null };
		})
	);

	const tooltip = $derived(hovered === null ? null : daily[hovered]);
	const TOOLTIP_W = 168;
	const tooltipLeft = $derived.by(() => {
		if (hovered === null) return 0;
		const right = PAD.left + band * (hovered + 1) + 8;
		if (right + TOOLTIP_W <= width) return right;
		return Math.max(0, PAD.left + band * hovered - 8 - TOOLTIP_W);
	});
</script>

<div class="activity-chart flex flex-col gap-4">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h4 class="text-sm font-medium text-muted-foreground">Active users per day: {current.title}</h4>
		<div
			class="inline-flex rounded-md border border-border p-0.5"
			role="group"
			aria-label="Activity"
		>
			{#each SERIES as s (s.key)}
				<button
					type="button"
					class="rounded-sm px-2.5 py-1 text-xs font-medium transition-colors {series === s.key
						? 'bg-accent text-accent-foreground'
						: 'text-muted-foreground hover:text-foreground'}"
					aria-pressed={series === s.key}
					onclick={() => {
						series = s.key;
						hovered = null;
					}}
				>
					{s.label}
				</button>
			{/each}
		</div>
	</div>

	<div class="relative" bind:clientWidth={width}>
		{#if daily.length === 0}
			<p class="flex h-50 items-center justify-center text-sm text-muted-foreground">No data yet</p>
		{:else if width > 0}
			<svg
				{width}
				height={HEIGHT}
				role="img"
				aria-label="Daily active users over the last 30 days: {current.title}"
			>
				{#each ticks as tick (tick)}
					<line
						x1={PAD.left}
						x2={width - PAD.right}
						y1={y(tick)}
						y2={y(tick)}
						stroke="var(--border)"
						stroke-dasharray={tick === 0 ? undefined : '2 3'}
					/>
					<text
						x={PAD.left - 8}
						y={y(tick)}
						dy="0.32em"
						text-anchor="end"
						class="fill-muted-foreground text-[11px] tabular-nums"
					>
						{tick.toLocaleString()}
					</text>
				{/each}

				{#each bars as bar, i (daily[i].day)}
					{#if bar.d}
						<path
							d={bar.d}
							fill="var(--activity-bar)"
							opacity={hovered !== null && hovered !== i ? 0.45 : 1}
							class="transition-opacity"
						/>
					{/if}
					{#if showLabel(i)}
						<text
							x={i === daily.length - 1 ? bar.x + barW : bar.x + barW / 2}
							y={HEIGHT - 6}
							text-anchor={i === daily.length - 1 ? 'end' : 'middle'}
							class="fill-muted-foreground text-[11px]"
						>
							{axisLabel(daily[i])}
						</text>
					{/if}
				{/each}

				{#each daily as point, i (point.day)}
					<rect
						x={PAD.left + band * i}
						y={PAD.top}
						width={band}
						height={plotH}
						fill="transparent"
						role="button"
						tabindex="0"
						aria-label="{fullLabel(point)}: {value(point)} users"
						class="outline-none"
						onpointerenter={() => (hovered = i)}
						onpointerleave={() => (hovered = null)}
						onfocus={() => (hovered = i)}
						onblur={() => (hovered = null)}
					/>
				{/each}
			</svg>

			{#if tooltip}
				<div
					class="pointer-events-none absolute top-0 z-10 rounded-md border border-border bg-popover p-2.5 text-xs text-popover-foreground shadow-md"
					style="left: {tooltipLeft}px; width: {TOOLTIP_W}px"
				>
					<p class="mb-1 font-medium">{fullLabel(tooltip)}</p>
					<ul class="flex flex-col gap-0.5">
						{#each SERIES as s (s.key)}
							<li class="flex gap-2 {s.key === series ? '' : 'text-muted-foreground'}">
								<span class="tabular-nums {s.key === series ? 'font-semibold' : ''}">
									{tooltip[s.key].toLocaleString()}
								</span>
								<span class="ms-auto">{s.label}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		{:else}
			<div class="h-50"></div>
		{/if}
	</div>

	<div>
		<button
			type="button"
			class="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
			onclick={() => (showTable = !showTable)}
		>
			{showTable ? 'Hide table' : 'Show as table'}
		</button>

		{#if showTable}
			<div class="mt-2 max-h-72 overflow-auto">
				<table class="w-full text-sm">
					<thead class="sticky top-0 bg-background">
						<tr class="border-b border-border text-left text-muted-foreground">
							<th class="pb-2 font-medium">Day</th>
							{#each SERIES as s (s.key)}
								<th class="pb-2 text-end font-medium">{s.label}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each [...daily].reverse() as p (p.day)}
							<tr class="border-b border-border last:border-0">
								<td class="py-1.5">{fullLabel(p)}</td>
								{#each SERIES as s (s.key)}
									<td class="py-1.5 text-end tabular-nums">{p[s.key].toLocaleString()}</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<style>
	/* same per-theme step as the primary series in the unified charts */
	.activity-chart {
		--activity-bar: var(--chart-2);
	}

	:global(.dark) .activity-chart {
		--activity-bar: var(--chart-1);
	}
</style>
