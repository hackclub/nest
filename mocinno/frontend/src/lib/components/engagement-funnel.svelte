<script lang="ts">
	type Funnel = {
		signedUp: number;
		eligible: number;
		applied: number;
		approved: number;
		pending: number;
		sshed: number;
		returned: number;
		shipped: number;
	};
	type Range = '30d' | '90d' | 'all';
	type StageKey = 'signedUp' | 'eligible' | 'applied' | 'approved' | 'sshed' | 'returned';

	let {
		funnel,
		medianReviewHours
	}: { funnel: Record<Range, Funnel>; medianReviewHours: number | null } = $props();

	const RANGES: { key: Range; label: string }[] = [
		{ key: '30d', label: '30 days' },
		{ key: '90d', label: '90 days' },
		{ key: 'all', label: 'All time' }
	];

	// strictly nested, so every stage is a subset of the one above it
	const STAGES: { key: StageKey; label: string; hint: string }[] = [
		{ key: 'signedUp', label: 'Signed up', hint: 'Logged in to Nest' },
		{ key: 'eligible', label: 'Eligible', hint: 'Verified, or has an invite' },
		{ key: 'applied', label: 'Applied', hint: 'Submitted an application' },
		{ key: 'approved', label: 'Approved', hint: 'Has a container' },
		{ key: 'sshed', label: 'SSHed in', hint: 'Through the bastion, at least once' },
		{ key: 'returned', label: 'Came back', hint: 'SSHed in on 2+ days' }
	];

	// a step conversion below this is flagged as the place people drop off
	const DROP_OFF = 0.5;

	const ROW = 40;
	const GAP = 2;
	const NECK = 14;
	const MIN_W = 6;

	let range = $state<Range>('30d');
	let hovered = $state<number | null>(null);
	let width = $state(0);

	const data = $derived(funnel[range]);
	const height = STAGES.length * ROW;

	const ratio = (n: number, of: number) => (of > 0 ? n / of : null);
	const pct = (r: number | null) => (r === null ? '–' : `${Math.round(r * 100)}%`);

	const rows = $derived(
		STAGES.map((stage, i) => {
			const value = data[stage.key];
			const prev = i === 0 ? value : data[STAGES[i - 1].key];
			return {
				...stage,
				value,
				step: ratio(value, prev),
				ofTop: ratio(value, data.signedUp)
			};
		})
	);

	const bandW = (value: number) =>
		data.signedUp > 0 ? Math.max(MIN_W, (value / data.signedUp) * width) : MIN_W;

	// each band starts at the previous band's width and curves in to its own
	const paths = $derived(
		rows.map((row, i) => {
			const c = width / 2;
			const p = bandW(i === 0 ? row.value : rows[i - 1].value) / 2;
			const w = bandW(row.value) / 2;
			const y0 = i * ROW;
			const y1 = y0 + ROW - GAP;
			const n = y0 + NECK;
			const m = y0 + NECK / 2;
			return `M${c - p},${y0}H${c + p}C${c + p},${m} ${c + w},${m} ${c + w},${n}V${y1}H${c - w}V${n}C${c - w},${m} ${c - p},${m} ${c - p},${y0}Z`;
		})
	);

	// lighter further down the funnel, same hue throughout; mixed toward white rather than
	// faded with opacity so the lower stages don't sink into a dark background
	const shade = (i: number) =>
		`color-mix(in oklab, var(--funnel-bar), white ${Math.round((i / Math.max(1, STAGES.length - 1)) * 55)}%)`;

	const formatHours = (h: number | null) =>
		h === null ? '–' : h < 48 ? `${h}h` : `${Math.round((h / 24) * 10) / 10} days`;
</script>

<div class="engagement-funnel flex flex-col gap-4">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h4 class="text-sm font-medium text-muted-foreground">Funnel, by when users signed up</h4>
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

	<div
		class="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)_auto] gap-x-4"
		style="grid-template-rows: repeat({STAGES.length}, {ROW}px)"
	>
		{#each rows as row, i (row.key)}
			<p
				class="col-start-1 flex items-center pb-0.5 text-sm transition-colors {hovered !== null &&
				hovered !== i
					? 'text-muted-foreground'
					: ''}"
				style="grid-row: {i + 1}"
			>
				{row.label}
			</p>
			<p
				class="col-start-3 flex items-center justify-end gap-1 pb-0.5 text-sm whitespace-nowrap tabular-nums"
				style="grid-row: {i + 1}"
			>
				<span class="font-semibold">{row.value.toLocaleString()}</span>
				<span
					class={row.step !== null && row.step < DROP_OFF
						? 'text-destructive'
						: 'text-muted-foreground'}
				>
					· {pct(row.step)}
				</span>
			</p>
		{/each}

		<div class="relative col-start-2 row-span-full" bind:clientWidth={width}>
			{#if width > 0}
				<svg {width} {height} role="img" aria-label="Funnel from sign-up to returning SSH users">
					{#each paths as d, i (rows[i].key)}
						<path
							{d}
							fill={shade(i)}
							opacity={hovered !== null && hovered !== i ? 0.5 : 1}
							class="transition-opacity"
						/>
					{/each}
					{#each rows as row, i (row.key)}
						<rect
							x="0"
							y={i * ROW}
							{width}
							height={ROW}
							fill="transparent"
							role="button"
							tabindex="0"
							aria-label="{row.label}: {row.value} users, {pct(row.step)} of the previous stage"
							class="outline-none"
							onpointerenter={() => (hovered = i)}
							onpointerleave={() => (hovered = null)}
							onfocus={() => (hovered = i)}
							onblur={() => (hovered = null)}
						/>
					{/each}
				</svg>

				{#if hovered !== null}
					{@const row = rows[hovered]}
					<div
						class="pointer-events-none absolute left-1/2 z-10 w-56 -translate-x-1/2 rounded-md border border-border bg-popover p-2.5 text-xs text-popover-foreground shadow-md"
						style="top: {(hovered + 1) * ROW + 4}px"
					>
						<p class="font-medium">{row.label}</p>
						<p class="mb-1.5 text-muted-foreground">{row.hint}</p>
						<p>
							<span class="font-semibold tabular-nums">{row.value.toLocaleString()}</span>
							<span class="text-muted-foreground">users</span>
						</p>
						{#if hovered > 0}
							<p class="text-muted-foreground">
								{pct(row.step)} of {rows[hovered - 1].label.toLowerCase()}
							</p>
						{/if}
						<p class="text-muted-foreground">{pct(row.ofTop)} of everyone who signed up</p>
					</div>
				{/if}
			{/if}
		</div>
	</div>

	<dl
		class="flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground"
	>
		<div class="flex gap-1">
			<dt>Shipped (of approved):</dt>
			<dd class="font-medium text-foreground tabular-nums">
				{data.shipped.toLocaleString()} · {pct(ratio(data.shipped, data.approved))}
			</dd>
		</div>
		<div class="flex gap-1">
			<dt>Waiting for review:</dt>
			<dd class="font-medium text-foreground tabular-nums">{data.pending.toLocaleString()}</dd>
		</div>
		<div class="flex gap-1">
			<dt>Median review time (last 30 days):</dt>
			<dd class="font-medium text-foreground tabular-nums">{formatHours(medianReviewHours)}</dd>
		</div>
	</dl>
</div>

<style>
	.engagement-funnel {
		--funnel-bar: var(--chart-2);
	}

	:global(.dark) .engagement-funnel {
		--funnel-bar: var(--chart-1);
	}
</style>
