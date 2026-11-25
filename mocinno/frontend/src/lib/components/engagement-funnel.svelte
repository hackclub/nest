<script lang="ts">
	import { Area, AreaChart } from 'layerchart';

	type Funnel = {
		signedUp: number;
		eligible: number;
		applied: number;
		appliedWithoutSignup: number;
		approved: number;
		legacy: number;
		containerOwners: number;
		sshed: number;
		returned: number;
		shipped: number;
	};
	type Range = '30d' | '90d' | 'all';
	type StageKey = 'signedUp' | 'eligible' | 'applied' | 'containerOwners' | 'sshed' | 'returned';

	let { funnel }: { funnel: Record<Range, Funnel> } = $props();

	const RANGES: { key: Range; label: string }[] = [
		{ key: '30d', label: '30 days' },
		{ key: '90d', label: '90 days' },
		{ key: 'all', label: 'All time' }
	];

	const STAGES: { key: StageKey; label: string; hint: string }[] = [
		{ key: 'signedUp', label: 'Signed up', hint: 'Logged in to Nest' },
		{ key: 'eligible', label: 'Eligible', hint: 'Verified account or a recorded application' },
		{ key: 'applied', label: 'Applied', hint: 'Submitted an application' },
		{ key: 'containerOwners', label: 'Has a container', hint: 'Owners from both paths' },
		{ key: 'sshed', label: 'SSHed in', hint: 'Through the bastion, at least once' },
		{ key: 'returned', label: 'Came back', hint: 'SSHed in on 2+ days' }
	];

	let range = $state<Range>('30d');
	const data = $derived(funnel[range]);

	const ratio = (n: number, of: number) => (of > 0 ? n / of : null);
	const pct = (r: number | null) => (r === null ? '–' : `${Math.round(r * 100)}%`);

	const rows = $derived(
		STAGES.map((stage, i) => {
			const value = data[stage.key];
			const prev = i === 0 ? value : data[STAGES[i - 1].key];
			return {
				...stage,
				value,
				step: ratio(value, prev)
			};
		})
	);

	// Give each stage a short plateau centered over its label.
	const points = $derived(
		rows.flatMap((row, index) => [
			{ position: index + (index === 0 ? 0 : 0.3), value: row.value },
			{ position: index + (index === rows.length - 1 ? 1 : 0.7), value: row.value }
		])
	);
	const gradientId = $props.id();
	const layers = [
		{ padding: 0.18, opacity: 0.12 },
		{ padding: 0.09, opacity: 0.24 },
		{ padding: 0, opacity: 1 }
	];
	const extent = $derived(Math.max(1, ...rows.map((row) => row.value)));
</script>

<div class="engagement-funnel flex flex-col gap-4">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h4 class="text-sm font-medium text-muted-foreground">Engagement funnel</h4>
		<div class="inline-flex rounded-md border border-border p-0.5" role="group" aria-label="Range">
			{#each RANGES as r (r.key)}
				<button
					type="button"
					class="rounded-sm px-2.5 py-1 text-xs font-medium transition-colors {range === r.key
						? 'bg-accent text-accent-foreground'
						: 'text-muted-foreground hover:text-foreground'}"
					aria-pressed={range === r.key}
					onclick={() => (range = r.key)}
				>
					{r.label}
				</button>
			{/each}
		</div>
	</div>

	<div>
		<div aria-hidden="true">
			<AreaChart
				data={points}
				x="position"
				y={[(point) => point.value, (point) => -point.value]}
				xDomain={[0, rows.length]}
				yDomain={[-extent * 1.2, extent * 1.2]}
				height={128}
				padding={0}
				axis={false}
				grid={false}
				tooltipContext={false}
			>
				{#snippet marks({ context })}
					<defs>
						<linearGradient id={gradientId}>
							<stop offset="0%" stop-color="var(--funnel-bar)" />
							<stop
								offset="100%"
								stop-color="color-mix(in oklab, var(--funnel-bar) 65%, var(--funnel-accent))"
							/>
						</linearGradient>
					</defs>
					{#each layers as layer (layer.padding)}
						<Area
							y0={(point) => (point.value > 0 ? -(point.value + extent * layer.padding) : 0)}
							y1={(point) => (point.value > 0 ? point.value + extent * layer.padding : 0)}
							fill={`url(#${gradientId})`}
							opacity={layer.opacity}
						/>
					{/each}
					{#each rows.slice(1) as row, i (row.key)}
						<line
							x1={context.xScale(i + 1)}
							x2={context.xScale(i + 1)}
							y1={0}
							y2={context.height}
							stroke="var(--background)"
							stroke-width={3}
						/>
					{/each}
				{/snippet}
			</AreaChart>
		</div>
		<ol class="mt-2 grid grid-cols-6 text-center">
			{#each rows as row, i (row.key)}
				<li class="flex flex-col items-center gap-0.5 px-0.5" title={row.hint}>
					<span class="text-xs leading-tight text-muted-foreground">{row.label}</span>
					<strong class="text-sm tabular-nums">{row.value.toLocaleString()}</strong>
					{#if i > 0 && row.key !== 'containerOwners' && !(row.key === 'eligible' && data.appliedWithoutSignup)}
						<span class="text-xs text-muted-foreground" title="Share of the previous stage">
							{pct(row.step)}
						</span>
					{/if}
				</li>
			{/each}
		</ol>
	</div>
	<div
		class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t pt-3 text-xs tabular-nums"
	>
		{#if data.legacy > 0}
			<p>
				<strong>{data.approved.toLocaleString()}</strong> via application
				<span class="text-muted-foreground"
					>+ {data.legacy.toLocaleString()} with no application on record</span
				>
			</p>
		{/if}
		<p>Applicants with a container <strong>{pct(ratio(data.approved, data.applied))}</strong></p>
		<p>
			Shipped <strong>{data.shipped.toLocaleString()}</strong>
			<span class="text-muted-foreground"
				>({pct(ratio(data.shipped, data.containerOwners))} of owners)</span
			>
		</p>
	</div>
</div>

<style>
	.engagement-funnel {
		--funnel-bar: var(--chart-2);
		--funnel-accent: var(--chart-1);
	}

	:global(.dark) .engagement-funnel {
		--funnel-bar: var(--chart-1);
		--funnel-accent: var(--chart-2);
	}
</style>
