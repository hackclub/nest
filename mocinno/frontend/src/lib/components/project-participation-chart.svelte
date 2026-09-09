<script lang="ts">
	let { withProjects, withoutProjects }: { withProjects: number; withoutProjects: number } =
		$props();

	const total = $derived(withProjects + withoutProjects);
	const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

	// Emphasis pairing: the accent hue carries "has a project" (the thing we care
	// about), a neutral carries the rest. Both segments are direct-labelled below,
	// so the split never depends on colour alone.
	const segments = $derived([
		{ key: 'with', label: 'Has a project', value: withProjects, color: 'var(--chart-2)' },
		{
			key: 'without',
			label: 'No projects',
			value: withoutProjects,
			color: 'var(--muted-foreground)'
		}
	]);

	const RADIUS = 60;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
	// Surface-coloured gap between the two arcs, in px along the circumference.
	const GAP = 4;

	const arcs = $derived.by(() => {
		if (total === 0) return [];

		let offset = 0;
		return segments
			.filter((s) => s.value > 0)
			.map((s) => {
				const length = (s.value / total) * CIRCUMFERENCE;
				// A single full-circle segment needs no gap carved out of it.
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

<div class="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
	<div class="relative shrink-0">
		<svg
			viewBox="0 0 160 160"
			class="h-40 w-40"
			role="img"
			aria-label="Containers with a project versus without"
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
				{focused ? pct(focused.value) : pct(withProjects)}%
			</span>
			<span class="max-w-20 text-center text-[11px] leading-tight text-muted-foreground">
				{focused ? focused.label : 'have a project'}
			</span>
		</div>
	</div>

	<ul class="flex w-full flex-col gap-2">
		{#each segments as segment (segment.key)}
			<li class="flex items-center gap-2 text-sm">
				<span
					class="inline-block size-3 shrink-0 rounded-sm"
					style="background: {segment.color}"
					aria-hidden="true"
				></span>
				<span class="text-muted-foreground">{segment.label}</span>
				<span class="ms-auto font-medium text-foreground tabular-nums">
					{segment.value}
					<span class="text-muted-foreground">({pct(segment.value)}%)</span>
				</span>
			</li>
		{/each}
		<li class="mt-1 flex items-center gap-2 border-t border-border pt-2 text-sm">
			<span class="text-muted-foreground">Total containers</span>
			<span class="ms-auto font-medium text-foreground tabular-nums">{total}</span>
		</li>
	</ul>
</div>
