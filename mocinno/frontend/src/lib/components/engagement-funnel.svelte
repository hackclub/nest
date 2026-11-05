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
	type StageKey = Exclude<keyof Funnel, 'pending'>;

	let { funnel }: { funnel: Record<Range, Funnel> } = $props();

	const RANGES: { key: Range; label: string }[] = [
		{ key: '30d', label: '30 days' },
		{ key: '90d', label: '90 days' },
		{ key: 'all', label: 'All time' }
	];

	// `from` is the stage this one converts from; shipped branches off approved
	const STAGES: {
		key: StageKey;
		label: string;
		hint: string;
		from?: { key: StageKey; label: string };
	}[] = [
		{ key: 'signedUp', label: 'Signed up', hint: 'Logged in to Nest' },
		{
			key: 'eligible',
			label: 'Eligible',
			hint: 'Verified, or has an invite',
			from: { key: 'signedUp', label: 'signed up' }
		},
		{
			key: 'applied',
			label: 'Applied',
			hint: 'Submitted an application',
			from: { key: 'eligible', label: 'eligible' }
		},
		{
			key: 'approved',
			label: 'Approved',
			hint: 'Has a container',
			from: { key: 'applied', label: 'applied' }
		},
		{
			key: 'sshed',
			label: 'SSHed in',
			hint: 'At least once',
			from: { key: 'approved', label: 'approved' }
		},
		{
			key: 'returned',
			label: 'Came back',
			hint: 'SSHed in on 2+ days',
			from: { key: 'sshed', label: 'SSHed in' }
		},
		{
			key: 'shipped',
			label: 'Shipped',
			hint: 'Has a project in Unified',
			from: { key: 'approved', label: 'approved' }
		}
	];

	let range = $state<Range>('30d');

	const data = $derived(funnel[range]);
	const top = $derived(Math.max(1, data.signedUp));

	const pct = (n: number, of: number) => (of > 0 ? `${Math.round((n / of) * 100)}%` : '–');
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

	<ol class="flex flex-col gap-3">
		{#each STAGES as stage (stage.key)}
			{@const value = data[stage.key]}
			<li
				class="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[10rem_1fr_9rem] {stage.key ===
				'shipped'
					? 'border-t border-dashed border-border pt-3'
					: ''}"
			>
				<div class="col-start-1 row-start-1 min-w-0">
					<p class="text-sm font-medium">{stage.label}</p>
					<p class="text-xs text-muted-foreground">{stage.hint}</p>
				</div>

				<div
					class="col-span-2 row-start-2 h-5 rounded-sm bg-muted sm:col-span-1 sm:col-start-2 sm:row-start-1"
					aria-hidden="true"
				>
					{#if value > 0}
						<div
							class="h-full rounded-sm bg-(--funnel-bar) transition-[width]"
							style="width: max(4px, {(value / top) * 100}%)"
						></div>
					{/if}
				</div>

				<div class="col-start-2 row-start-1 text-end text-sm tabular-nums sm:col-start-3">
					<span class="font-semibold">{value.toLocaleString()}</span>
					<span class="text-muted-foreground">· {pct(value, data.signedUp)}</span>
					{#if stage.from}
						<p class="text-xs text-muted-foreground">
							{pct(value, data[stage.from.key])} of {stage.from.label}
						</p>
					{/if}
				</div>

				{#if stage.key === 'approved' && data.pending > 0}
					<p class="col-span-2 text-xs text-muted-foreground sm:col-start-2">
						{data.pending.toLocaleString()} more still waiting for review
					</p>
				{/if}
			</li>
		{/each}
	</ol>
</div>

<style>
	.engagement-funnel {
		--funnel-bar: var(--chart-2);
	}

	:global(.dark) .engagement-funnel {
		--funnel-bar: var(--chart-1);
	}
</style>
