<script lang="ts">
	type Point = { day: string; users: number };

	let { daily }: { daily: Point[] } = $props();

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
		const max = Math.max(1, ...daily.map((p) => p.users));
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
			const top = y(p.users);
			return { x, d: p.users > 0 ? roundedTop(x, top, barW, y(0) - top) : null };
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

<div class="ssh-activity flex flex-col gap-4">
	<h4 class="text-sm font-medium text-muted-foreground">Users who SSHed in, per day</h4>

	<div class="relative" bind:clientWidth={width}>
		{#if daily.length === 0}
			<p class="flex h-50 items-center justify-center text-sm text-muted-foreground">No data yet</p>
		{:else if width > 0}
			<svg {width} height={HEIGHT} role="img" aria-label="Daily active users over the last 30 days">
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
							fill="var(--ssh-active)"
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
						aria-label="{fullLabel(point)}: {point.users} users"
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
					<p>
						<span class="font-semibold tabular-nums">{tooltip.users.toLocaleString()}</span>
						<span class="text-muted-foreground">{tooltip.users === 1 ? 'user' : 'users'}</span>
					</p>
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
							<th class="pb-2 text-end font-medium">Users</th>
						</tr>
					</thead>
					<tbody>
						{#each [...daily].reverse() as p (p.day)}
							<tr class="border-b border-border last:border-0">
								<td class="py-1.5">{fullLabel(p)}</td>
								<td class="py-1.5 text-end tabular-nums">{p.users.toLocaleString()}</td>
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
	.ssh-activity {
		--ssh-active: var(--chart-2);
	}

	:global(.dark) .ssh-activity {
		--ssh-active: var(--chart-1);
	}
</style>
