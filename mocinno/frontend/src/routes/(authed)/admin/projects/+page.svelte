<script lang="ts">
	import Head from '$lib/components/head.svelte';
	import trpc from '$lib/trpc';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import AdminTable from '$lib/components/tables/admin-table.svelte';
	import ParticipationChart from '$lib/components/project-participation-chart.svelte';
	import { columns } from '$lib/components/tables/projects-table.js';
	import type { PaginationState } from '@tanstack/table-core';

	let { data } = $props();

	let projectsList = $derived(data.projects);
	let page = $state(0);
	let searchQuery = $state('');

	$effect(() => {
		trpc.admin.getProjects
			.query({
				query: searchQuery,
				page: page + 1
			})
			.then((projects) => {
				projectsList = projects;
			});
	});

	const onPageChange = (pagination: PaginationState) => {
		page = pagination.pageIndex;
		trpc.admin.getProjects
			.query({
				query: searchQuery,
				page: pagination.pageIndex + 1,
				limit: pagination.pageSize
			})
			.then((projects) => {
				projectsList = projects;
			});
	};

	const stats = $derived(data.stats);

	const avgPerUser = $derived(
		stats.containersWithProjects > 0
			? (stats.totalProjects / stats.containersWithProjects).toFixed(1)
			: '0'
	);
</script>

<Head title="Projects" />

<div class="flex flex-1 flex-col gap-4">
	<h2 class="text-2xl font-bold tracking-tight">Projects</h2>
	<p class="mt-1 text-muted-foreground">What people are actually running in their containers</p>
	<Separator class="my-4" />

	<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
		<div class="rounded-md border border-border p-4">
			<h4 class="text-sm font-medium text-muted-foreground">Total projects</h4>
			<p class="text-xl font-bold">{stats.totalProjects}</p>
		</div>
		<div class="rounded-md border border-border p-4">
			<h4 class="text-sm font-medium text-muted-foreground">Containers with a project</h4>
			<p class="text-xl font-bold">
				{stats.containersWithProjects}
				<span class="text-sm font-normal text-muted-foreground">/ {stats.containersTotal}</span>
			</p>
		</div>
		<div class="rounded-md border border-border p-4">
			<h4 class="text-sm font-medium text-muted-foreground">Avg. per user</h4>
			<p class="text-xl font-bold">{avgPerUser}</p>
		</div>
		<div class="rounded-md border border-border p-4">
			<h4 class="text-sm font-medium text-muted-foreground">Added last 7 days</h4>
			<p class="text-xl font-bold">
				{stats.addedLast7Days}
				<span class="text-sm font-normal text-muted-foreground"
					>/ {stats.addedLast30Days} in 30d</span
				>
			</p>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<div class="rounded-md border border-border p-4">
			<h4 class="mb-4 text-sm font-medium text-muted-foreground">Participation</h4>
			<ParticipationChart
				withProjects={stats.containersWithProjects}
				withoutProjects={stats.containersWithoutProjects}
			/>
		</div>

		<div class="rounded-md border border-border p-4">
			<h4 class="mb-4 text-sm font-medium text-muted-foreground">Repository hosts</h4>
			{#if stats.topHosts.length > 0}
				{@const max = Math.max(...stats.topHosts.map((h) => h.total))}
				<ul class="flex flex-col gap-2">
					{#each stats.topHosts as host (host.host)}
						<li class="flex items-center gap-3 text-sm">
							<span class="w-32 shrink-0 truncate text-muted-foreground" title={host.host}>
								{host.host}
							</span>
							<span class="h-2 flex-1 overflow-hidden rounded-sm bg-muted">
								<span
									class="block h-full rounded-sm"
									style="width: {(host.total / max) * 100}%; background: var(--chart-2)"
								></span>
							</span>
							<span class="w-8 shrink-0 text-end font-medium tabular-nums">{host.total}</span>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-sm text-muted-foreground">No projects yet.</p>
			{/if}
		</div>
	</div>

	<AdminTable
		data={projectsList.data}
		{columns}
		{onPageChange}
		bind:searchQuery
		pageCount={projectsList.pageCount}
		rowCount={projectsList.count}
		isManualPagination={true}
	/>
</div>
