<script lang="ts">
	let { recent, stale, none }: { recent: number; stale: number; none: number } = $props();

	const total = $derived(recent + stale + none);
	const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

	const segments = $derived([
		{
			key: 'recent',
			label: 'Projects in last 90d',
			value: recent,
			color: 'var(--unified-recent)'
		},
		{
			key: 'stale',
			label: 'Projects, older than 90d',
			value: stale,
			color: 'var(--unified-stale)'
		},
		{ key: 'none', label: 'No projects', value: none, color: 'var(--unified-none)' }
	]);

	const RADIUS = 60;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
	const GAP = 4;

	const arcs = $derived.by(() => {
		if (total === 0) return [];

		let offset = 0;
		return segments
			.filter((s) => s.value > 0)
			.map((s) => {
				const length = (s.value / total) * CIRCUMFERENCE;
				const gap = s.value === total ? 0 : GAP;
				const arc = {
					...s,
					dash: `${Math.max(0, length - gap)} ${CIRCUMFERENCE - Math.max(0, length - gap)}`,
					offset: -offset
				};
				offset += length;
				return arc;
			});
	});

	let hovered = $state<string | null>(null);

	const focused = $derived(segments.find((s) => s.key === hovered) ?? null);
</script>

<div class="unified-chart @container">
	<div class="flex flex-col items-center gap-4 @lg:flex-row @lg:items-center @lg:gap-6">
		<div class="relative shrink-0">
			<svg
				viewBox="0 0 160 160"
				class="h-40 w-40"
				role="img"
				aria-label="Nest users split by whether they have a project in Unified, and how recent it is"
			>
				<g transform="rotate(-90 80 80)">
					<circle
						cx="80"
						cy="80"
						r={RADIUS}
						fill="none"
						stroke="var(--border)"
						stroke-width="16"
						opacity={total === 0 ? 1 : 0}
					/>
					{#each arcs as arc (arc.key)}
						<circle
							cx="80"
							cy="80"
							r={RADIUS}
							fill="none"
							stroke={arc.color}
							stroke-width={hovered === arc.key ? 20 : 16}
							stroke-dasharray={arc.dash}
							stroke-dashoffset={arc.offset}
							class="cursor-default transition-all duration-150"
							opacity={hovered && hovered !== arc.key ? 0.45 : 1}
							role="presentation"
							onmouseenter={() => (hovered = arc.key)}
							onmouseleave={() => (hovered = null)}
						>
							<title>{arc.label}: {arc.value} ({pct(arc.value)}%)</title>
						</circle>
					{/each}
				</g>
			</svg>
			<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
				<span class="text-3xl font-bold text-foreground">
					{focused ? pct(focused.value) : pct(recent)}%
				</span>
				<span class="max-w-20 text-center text-[11px] leading-tight text-muted-foreground">
					{focused ? focused.label : 'active in 90d'}
				</span>
			</div>
		</div>

		<ul class="flex w-full flex-col gap-2">
			{#each segments as segment (segment.key)}
				<li class="flex items-start gap-2 text-sm">
					<span
						class="mt-1 inline-block size-3 shrink-0 rounded-sm"
						style="background: {segment.color}"
						aria-hidden="true"
					></span>
					<span class="min-w-0 text-muted-foreground">{segment.label}</span>
					<span class="ms-auto shrink-0 font-medium whitespace-nowrap text-foreground tabular-nums">
						{segment.value.toLocaleString()}
						<span class="text-muted-foreground">({pct(segment.value)}%)</span>
					</span>
				</li>
			{/each}
			<li class="mt-1 flex items-center gap-2 border-t border-border pt-2 text-sm">
				<span class="text-muted-foreground">Total nest users</span>
				<span class="ms-auto shrink-0 font-medium text-foreground tabular-nums">
					{total.toLocaleString()}
				</span>
			</li>
		</ul>
	</div>
</div>

<style>
	.unified-chart {
		--unified-recent: var(--chart-2);
		--unified-stale: var(--chart-5);
		--unified-none: oklch(0.556 0 0);
	}

	:global(.dark) .unified-chart {
		--unified-recent: var(--chart-1);
		--unified-stale: var(--chart-2);
		--unified-none: oklch(0.556 0 0);
	}
</style>
