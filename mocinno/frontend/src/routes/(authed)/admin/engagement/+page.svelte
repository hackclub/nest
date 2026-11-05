<script lang="ts">
	import Head from '#lib/components/head.svelte';
	import EngagementFunnel from '#lib/components/engagement-funnel.svelte';
	import SshActivityChart from '#lib/components/ssh-activity-chart.svelte';
	import { Separator } from '#lib/components/ui/separator/index.js';

	let { data } = $props();

	const stats = $derived(data.stats);

	const FAILURE_LABELS: Record<string, string> = {
		key_rejected: 'SSH key not recognised',
		no_keys: 'No SSH keys on account',
		suspended: 'Container suspended',
		start_failed: 'Container failed to start',
		no_ip: 'Container has no IP',
		lookup_error: 'Lookup error',
		config_error: 'Container misconfigured'
	};

	const failureTotal = $derived(stats.failures.reduce((n, f) => n + f.count, 0));

	const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
	function ago(iso: string) {
		const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
		const units: [Intl.RelativeTimeFormatUnit, number][] = [
			['day', 86400],
			['hour', 3600],
			['minute', 60]
		];
		for (const [unit, size] of units) {
			if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
		}
		return 'just now';
	}
</script>

<Head title="Engagement" />

<div class="flex flex-1 flex-col gap-4">
	<h2 class="text-2xl font-bold tracking-tight">Engagement</h2>
	<p class="mt-1 text-muted-foreground">
		Who's using their Nest, based on SSH through the bastion<br />Updated {ago(stats.generatedAt)}
	</p>
	<Separator class="my-4" />

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<div class="rounded-md border border-border p-4">
			<h4 class="text-sm font-medium text-muted-foreground">Active today</h4>
			<p class="text-xl font-bold tabular-nums">{stats.dau.toLocaleString()}</p>
		</div>
		<div class="rounded-md border border-border p-4">
			<h4 class="text-sm font-medium text-muted-foreground">Active, last 7 days</h4>
			<p class="text-xl font-bold tabular-nums">{stats.wau.toLocaleString()}</p>
		</div>
		<div class="rounded-md border border-border p-4">
			<h4 class="text-sm font-medium text-muted-foreground">Active, last 30 days</h4>
			<p class="text-xl font-bold tabular-nums">{stats.mau.toLocaleString()}</p>
		</div>
	</div>

	<div class="rounded-md border border-border p-4">
		<SshActivityChart daily={stats.daily} />
	</div>

	<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
		<div class="rounded-md border border-border p-4 lg:col-span-2">
			<EngagementFunnel funnel={stats.funnel} medianReviewHours={stats.medianReviewHours} />
		</div>

		<div class="rounded-md border border-border p-4">
			<h4 class="mb-1 text-sm font-medium text-muted-foreground">Failed SSH, last 7 days</h4>
			<p class="mb-4 text-xs text-muted-foreground">
				Only for real Nest usernames, counted once per connection
			</p>
			{#if stats.failures.length === 0}
				<p class="text-sm text-muted-foreground">No failures recorded.</p>
			{:else}
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border text-left text-muted-foreground">
							<th class="pb-2 font-medium">Reason</th>
							<th class="pb-2 text-end font-medium">Connections</th>
						</tr>
					</thead>
					<tbody>
						{#each stats.failures as failure (failure.reason)}
							<tr class="border-b border-border">
								<td class="py-2">{FAILURE_LABELS[failure.reason] ?? failure.reason}</td>
								<td class="py-2 text-end tabular-nums">{failure.count.toLocaleString()}</td>
							</tr>
						{/each}
						<tr>
							<td class="py-2 font-medium">Total</td>
							<td class="py-2 text-end font-medium tabular-nums">
								{failureTotal.toLocaleString()}
							</td>
						</tr>
					</tbody>
				</table>
			{/if}
		</div>
	</div>
</div>
