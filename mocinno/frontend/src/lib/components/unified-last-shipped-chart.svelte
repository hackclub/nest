<script lang="ts">
	type Point = { start: string; end: string; users: number };
	let { points }: { points: Point[] } = $props();
	let width = $state(0);
	let hovered = $state<number | null>(null);
	let showTable = $state(false);
	const total = $derived(points.reduce((sum, point) => sum + point.users, 0));
	const label = (day: string) => {
		const [year, month, date] = day.split('-').map(Number);
		return new Date(year, month - 1, date).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric'
		});
	};
	const period = (point: Point) => `${label(point.start)} – ${label(point.end)}`;
	const HEIGHT = 240;
	const PAD = { top: 24, right: 8, bottom: 28, left: 40 };
	const plotH = HEIGHT - PAD.top - PAD.bottom;
	const plotW = $derived(Math.max(0, width - PAD.left - PAD.right));
	const band = $derived(points.length ? plotW / points.length : 0);
	const barW = $derived(Math.min(32, band * 0.65));
	const ticks = $derived.by(() => {
		const rough = Math.max(1, ...points.map((point) => point.users)) / 4;
		const magnitude = 10 ** Math.floor(Math.log10(rough));
		const step = Math.max(1, ([1, 2, 5, 10].find((n) => n * magnitude >= rough) ?? 10) * magnitude);
		const top = Math.ceil(Math.max(1, ...points.map((point) => point.users)) / step) * step;
		return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
	});
	const y = (value: number) => PAD.top + plotH - (value / (ticks.at(-1) ?? 1)) * plotH;
	const labelEvery = $derived(
		Math.max(1, Math.ceil(points.length / Math.max(1, Math.floor(plotW / 70))))
	);
	const tooltip = $derived(hovered === null ? null : points[hovered]);
</script>

<div class="last-shipped flex flex-col gap-4">
	<h4 class="text-sm font-medium text-muted-foreground">Last shipped at</h4>
	<div class="relative" bind:clientWidth={width}>
		{#if total === 0}
			<p class="flex h-60 items-center justify-center text-sm text-muted-foreground">
				No users shipped in the past 3 months
			</p>
		{:else if width > 0}
			<svg
				{width}
				height={HEIGHT}
				role="img"
				aria-label="Users by the week of their most recent ship in the past three months"
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
						class="fill-muted-foreground text-[11px] tabular-nums">{tick.toLocaleString()}</text
					>
				{/each}
				{#each points as point, i (point.start)}
					{@const x = PAD.left + i * band + (band - barW) / 2}
					<rect
						{x}
						y={y(point.users)}
						width={barW}
						height={Math.max(0, y(0) - y(point.users))}
						rx="3"
						fill="var(--last-shipped-color)"
						opacity={hovered !== null && hovered !== i ? 0.45 : 1}
					/>
					{#if (points.length - 1 - i) % labelEvery === 0}
						<text
							x={i === points.length - 1 ? x + barW : x + barW / 2}
							y={HEIGHT - 7}
							text-anchor={i === points.length - 1 ? 'end' : 'middle'}
							class="fill-muted-foreground text-[11px]">{label(point.start)}</text
						>
					{/if}
					<rect
						x={PAD.left + i * band}
						y={PAD.top}
						width={band}
						height={plotH}
						fill="transparent"
						role="button"
						tabindex="0"
						aria-label="{period(point)}: {point.users} users last shipped"
						onpointerenter={() => (hovered = i)}
						onpointerleave={() => (hovered = null)}
						onfocus={() => (hovered = i)}
						onblur={() => (hovered = null)}
					>
						<title>{period(point)}: {point.users} users</title>
					</rect>
				{/each}
			</svg>
			{#if tooltip}
				<div
					class="pointer-events-none absolute top-0 rounded-md border border-border bg-popover p-2.5 text-xs text-popover-foreground shadow-md"
					style="left: {Math.max(
						0,
						Math.min(width - 168, PAD.left + (hovered ?? 0) * band)
					)}px; width: 168px"
				>
					<p class="font-medium">{period(tooltip)}</p>
					<p class="mt-1 text-muted-foreground">
						<span class="font-semibold text-foreground tabular-nums"
							>{tooltip.users.toLocaleString()}</span
						> users last shipped
					</p>
				</div>
			{/if}
		{:else}
			<div class="h-60"></div>
		{/if}
	</div>
	{#if points.length > 0}
		<div>
			<button
				type="button"
				class="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
				aria-expanded={showTable}
				onclick={() => (showTable = !showTable)}
				>{showTable ? 'Hide table' : 'Show as table'}</button
			>
			{#if showTable}
				<table class="mt-2 w-full text-sm">
					<thead
						><tr class="border-b border-border text-left text-muted-foreground"
							><th class="pb-2 font-medium">Latest ship</th><th class="pb-2 text-end font-medium"
								>Users</th
							></tr
						></thead
					>
					<tbody>
						{#each [...points].reverse() as point (point.start)}
							<tr class="border-b border-border last:border-0"
								><td class="py-1.5">{period(point)}</td><td class="py-1.5 text-end tabular-nums"
									>{point.users.toLocaleString()}</td
								></tr
							>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
	{/if}
</div>

<style>
	.last-shipped {
		--last-shipped-color: var(--chart-2);
	}
	:global(.dark) .last-shipped {
		--last-shipped-color: var(--chart-1);
	}
</style>
