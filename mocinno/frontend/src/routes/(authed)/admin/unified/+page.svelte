<script lang="ts">
	import Head from '$lib/components/head.svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import UnifiedBreakdownChart from '$lib/components/unified-breakdown-chart.svelte';

	let { data } = $props();

	const stats = $derived(data.stats);

	const usersStale = $derived(stats.usersWithProjects - stats.usersRecent);
	const usersNone = $derived(stats.totalUsers - stats.usersWithProjects);

	const pct = (n: number) => (stats.totalUsers > 0 ? Math.round((n / stats.totalUsers) * 100) : 0);
</script>

<Head title="Unified" />

<div class="flex flex-1 flex-col gap-4">
	<h2 class="text-2xl font-bold tracking-tight">Unified</h2>
	<p class="mt-1 text-muted-foreground">
		How many nest users have projects in the Unified DB<br />Last import: {stats.lastImport ??
			'never'}
	</p>
	<Separator class="my-4" />

	{#if stats.csvError}
		<p
			class="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
		>
			{stats.csvError}
		</p>
	{/if}

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<div class="rounded-md border border-border p-4">
			<h4 class="text-sm font-medium text-muted-foreground">Nest users</h4>
			<p class="text-xl font-bold">{stats.totalUsers.toLocaleString()}</p>
		</div>
		<div class="rounded-md border border-border p-4">
			<h4 class="text-sm font-medium text-muted-foreground">With a project in Unified</h4>
			<p class="text-xl font-bold">
				{stats.usersWithProjects.toLocaleString()}
				<span class="text-sm font-normal text-muted-foreground">
					/ {pct(stats.usersWithProjects)}%
				</span>
			</p>
		</div>
		<div class="rounded-md border border-border p-4">
			<h4 class="text-sm font-medium text-muted-foreground">With a project in the last 90 days</h4>
			<p class="text-xl font-bold">
				{stats.usersRecent.toLocaleString()}
				<span class="text-sm font-normal text-muted-foreground">
					/ {pct(stats.usersRecent)}%
				</span>
			</p>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<div class="rounded-md border border-border p-4">
			<h4 class="mb-4 text-sm font-medium text-muted-foreground">Nest users in Unified</h4>
			<UnifiedBreakdownChart recent={stats.usersRecent} stale={usersStale} none={usersNone} />
		</div>

		<div class="rounded-md border border-border p-4">
			<h4 class="mb-4 text-sm font-medium text-muted-foreground">Breakdown</h4>
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border text-left text-muted-foreground">
						<th class="pb-2 font-medium">Group</th>
						<th class="pb-2 text-end font-medium">Users</th>
						<th class="pb-2 text-end font-medium">Share</th>
					</tr>
				</thead>
				<tbody>
					<tr class="border-b border-border">
						<td class="py-2">Projects in last 90d</td>
						<td class="py-2 text-end tabular-nums">{stats.usersRecent.toLocaleString()}</td>
						<td class="py-2 text-end tabular-nums">{pct(stats.usersRecent)}%</td>
					</tr>
					<tr class="border-b border-border">
						<td class="py-2">Projects, but older than 90d</td>
						<td class="py-2 text-end tabular-nums">{usersStale.toLocaleString()}</td>
						<td class="py-2 text-end tabular-nums">{pct(usersStale)}%</td>
					</tr>
					<tr class="border-b border-border">
						<td class="py-2">No projects</td>
						<td class="py-2 text-end tabular-nums">{usersNone.toLocaleString()}</td>
						<td class="py-2 text-end tabular-nums">{pct(usersNone)}%</td>
					</tr>
					<tr>
						<td class="py-2 font-medium">Total</td>
						<td class="py-2 text-end font-medium tabular-nums">
							{stats.totalUsers.toLocaleString()}
						</td>
						<td class="py-2 text-end font-medium tabular-nums">100%</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</div>
