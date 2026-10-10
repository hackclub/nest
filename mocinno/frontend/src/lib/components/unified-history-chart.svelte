<script lang="ts">
	type Point = { start: string; end: string; recent: number; stale: number; none: number };
	type Range = '30d' | '6m' | '1y';

	let { history }: { history: Record<Range, Point[]> } = $props();

	const RANGES: { key: Range; label: string }[] = [
		{ key: '30d', label: '30 days' },
		{ key: '6m', label: '6 months' },
		{ key: '1y', label: '1 year' }
	];

	// stacked bottom to top, so the group we care about sits on the baseline
	const SERIES = [
		{
			key: 'recent',
			label: 'Shipped in last 90d',
			short: 'Last 90d',
			color: 'var(--unified-recent)'
		},
		{
			key: 'stale',
			label: 'Shipped, older than 90d',
			short: 'Older',
			color: 'var(--unified-stale)'
		},
		{ key: 'none', label: 'Never shipped', short: 'Never', color: 'var(--unified-none)' }
	] as const;

	let range = $state<Range>('30d');
	let showTable = $state(false);
	let hovered = $state<number | null>(null);
	let width = $state(0);

	const points = $derived(history[range]);

	const parseDay = (value: string) => {
		const [y, m, d] = value.split('-').map(Number);
		return new Date(y, m - 1, d);
	};

	const axisLabel = (p: Point) => {
		const date = parseDay(p.start);
		return range === '1y'
			? date.toLocaleDateString(undefined, { month: 'short' })
			: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	};

	const fullLabel = (p: Point) => {
		const date = parseDay(p.start);
		if (range === '1y')
			return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
		const day = date.toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
		return range === '6m' ? `Week of ${day}` : day;
	};

	const total = (p: Point) => p.recent + p.stale + p.none;
	const pct = (n: number, of: number) => (of > 0 ? Math.round((n / of) * 100) : 0);

	const HEIGHT = 240;
	const PAD = { top: 8, right: 4, bottom: 24, left: 40 };
	const GAP = 2;
	const RADIUS = 4;

	const plotW = $derived(Math.max(0, width - PAD.left - PAD.right));
	const plotH = HEIGHT - PAD.top - PAD.bottom;

	const ticks = $derived.by(() => {
		const max = Math.max(1, ...points.map(total));
		const rough = max / 4;
		const magnitude = 10 ** Math.floor(Math.log10(rough));
		const step = ([1, 2, 5, 10].find((m) => m * magnitude >= rough) ?? 10) * magnitude;
		const top = Math.ceil(max / step) * step;
		return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
	});

	const yMax = $derived(ticks.at(-1) ?? 1);
	const y = (v: number) => PAD.top + plotH - (v / yMax) * plotH;

	const band = $derived(points.length > 0 ? plotW / points.length : 0);
	const barW = $derived(Math.min(32, Math.max(2, band * 0.7)));

	// show at most ~8 x labels, always including the latest bucket
	const labelEvery = $derived(
		Math.max(1, Math.ceil(points.length / Math.max(1, Math.floor(plotW / 64))))
	);
	const showLabel = (i: number) => (points.length - 1 - i) % labelEvery === 0;

	function roundedTop(x: number, top: number, w: number, h: number) {
		const r = Math.min(RADIUS, w / 2, h);
		return `M${x},${top + h}V${top + r}Q${x},${top} ${x + r},${top}H${x + w - r}Q${x + w},${top} ${x + w},${top + r}V${top + h}Z`;
	}

	const bars = $derived(
		points.map((p, i) => {
			const x = PAD.left + band * i + (band - barW) / 2;
			const visible = SERIES.filter((s) => p[s.key] > 0);
			let base = 0;

			const segments = visible.map((s, j) => {
				const value = p[s.key];
				const bottom = y(base);
				const top = y(base + value);
				base += value;

				// carve a surface gap under every segment but the lowest
				const h = Math.max(0, bottom - top - (j > 0 ? GAP : 0));
				const isTop = j === visible.length - 1;

				return {
					key: s.key,
					color: s.color,
					d: isTop ? roundedTop(x, top, barW, h) : `M${x},${top}h${barW}v${h}h${-barW}Z`
				};
			});

			return { x, segments };
		})
	);

	const tooltip = $derived(hovered === null ? null : points[hovered]);
	// beside the hovered column, flipping to its left when there's no room on the right
	const TOOLTIP_W = 176;
	const tooltipLeft = $derived.by(() => {
		if (hovered === null) return 0;
		const right = PAD.left + band * (hovered + 1) + 8;
		if (right + TOOLTIP_W <= width) return right;
		return Math.max(0, PAD.left + band * hovered - 8 - TOOLTIP_W);
	});
</script>

<div class="unified-history flex flex-col gap-4">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h4 class="text-sm font-medium text-muted-foreground">Nest users over time</h4>
		<div class="inline-flex rounded-md border border-border p-0.5" role="group" aria-label="Range">
			{#each RANGES as r (r.key)}
				<button
					type="button"
					class="rounded-sm px-2.5 py-1 text-xs font-medium transition-colors {range === r.key
						? 'bg-accent text-accent-foreground'
						: 'text-muted-foreground hover:text-foreground'}"
					aria-pressed={range === r.key}
					onclick={() => {
						range = r.key;
						hovered = null;
					}}
				>
					{r.label}
				</button>
			{/each}
		</div>
	</div>

	<ul class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
		{#each SERIES as s (s.key)}
			<li class="flex items-center gap-2 text-muted-foreground">
				<span
					class="inline-block size-3 rounded-sm"
					style="background: {s.color}"
					aria-hidden="true"
				></span>
				{s.label}
			</li>
		{/each}
	</ul>

	<div class="relative" bind:clientWidth={width}>
		{#if points.length === 0}
			<p class="flex h-60 items-center justify-center text-sm text-muted-foreground">No data yet</p>
		{:else if width > 0}
			<svg
				{width}
				height={HEIGHT}
				role="img"
				aria-label="Nest users per period, split by whether and how recently they shipped a project"
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

				{#each bars as bar, i (points[i].start)}
					<g opacity={hovered !== null && hovered !== i ? 0.45 : 1} class="transition-opacity">
						{#each bar.segments as seg (seg.key)}
							<path d={seg.d} fill={seg.color} />
						{/each}
					</g>
					{#if showLabel(i)}
						<text
							x={i === points.length - 1 ? bar.x + barW : bar.x + barW / 2}
							y={HEIGHT - 6}
							text-anchor={i === points.length - 1 ? 'end' : 'middle'}
							class="fill-muted-foreground text-[11px]"
						>
							{axisLabel(points[i])}
						</text>
					{/if}
				{/each}

				{#each points as point, i (point.start)}
					<rect
						x={PAD.left + band * i}
						y={PAD.top}
						width={band}
						height={plotH}
						fill="transparent"
						role="button"
						tabindex="0"
						aria-label="{fullLabel(
							point
						)}: {point.recent} shipped in last 90d, {point.stale} shipped earlier, {point.none} never shipped"
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
					<p class="mb-1.5 font-medium">{fullLabel(tooltip)}</p>
					<ul class="flex flex-col gap-1">
						{#each [...SERIES].reverse() as s (s.key)}
							<li class="flex items-center gap-2">
								<span class="h-0.5 w-3 shrink-0 rounded-full" style="background: {s.color}"></span>
								<span class="font-semibold tabular-nums">{tooltip[s.key].toLocaleString()}</span>
								<span class="text-muted-foreground">{pct(tooltip[s.key], total(tooltip))}%</span>
								<span class="ms-auto truncate text-muted-foreground">{s.short}</span>
							</li>
						{/each}
						<li class="mt-1 flex border-t border-border pt-1">
							<span class="font-semibold tabular-nums">{total(tooltip).toLocaleString()}</span>
							<span class="ms-auto text-muted-foreground">Total</span>
						</li>
					</ul>
				</div>
			{/if}
		{:else}
			<div class="h-60"></div>
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
							<th class="pb-2 font-medium">Period</th>
							{#each SERIES as s (s.key)}
								<th class="pb-2 text-end font-medium">{s.label}</th>
							{/each}
							<th class="pb-2 text-end font-medium">Total</th>
						</tr>
					</thead>
					<tbody>
						{#each [...points].reverse() as p (p.start)}
							<tr class="border-b border-border last:border-0">
								<td class="py-1.5">{fullLabel(p)}</td>
								{#each SERIES as s (s.key)}
									<td class="py-1.5 text-end tabular-nums">{p[s.key].toLocaleString()}</td>
								{/each}
								<td class="py-1.5 text-end tabular-nums">{total(p).toLocaleString()}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<style>
	/* same validated per-theme pairing as unified-breakdown-chart */
	.unified-history {
		--unified-recent: var(--chart-2);
		--unified-stale: var(--chart-5);
		--unified-none: oklch(0.556 0 0);
	}

	:global(.dark) .unified-history {
		--unified-recent: var(--chart-1);
		--unified-stale: var(--chart-2);
		--unified-none: oklch(0.556 0 0);
	}
</style>
