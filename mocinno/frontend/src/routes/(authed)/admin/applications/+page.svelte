<script lang="ts">
	import Head from '$lib/components/head.svelte';
	import trpc from '$lib/trpc';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import AdminTable from '$lib/components/tables/admin-table.svelte';
	import { columns } from '$lib/components/tables/applications-table.js';
	import type { PaginationState } from '@tanstack/table-core';

	let { data } = $props();

	let applicationsList = $derived(data.applications);
	let page = $state(0);
	let searchQuery = $state('');

	$effect(() => {
		trpc.admin.getApplications
			.query({
				query: searchQuery,
				page: page + 1
			})
			.then((applications) => {
				applicationsList = applications;
			});
	});

	const onPageChange = (pagination: PaginationState) => {
		page = pagination.pageIndex;
		trpc.admin.getApplications
			.query({
				query: searchQuery,
				page: pagination.pageIndex + 1,
				limit: pagination.pageSize
			})
			.then((applications) => {
				applicationsList = applications;
			});
	};
</script>

<Head title="Applications" />

<div class="flex flex-1 flex-col gap-4">
	<h2 class="text-2xl font-bold tracking-tight">Applications</h2>
	<p class="mt-1 text-muted-foreground">Manage users, applications, and invites.</p>
	<Separator class="my-4" />
	<h3 class="text-lg font-medium">Pending applications ({applicationsList.pending.length})</h3>
	<AdminTable
		data={applicationsList.pending}
		{columns}
		isManualPagination={false}
		shouldShowSearchInput={false}
	/>
	<Separator class="my-4" />
	<h3 class="text-lg font-medium">All applications</h3>
	<AdminTable
		data={applicationsList.all}
		{columns}
		{onPageChange}
		bind:searchQuery
		pageCount={applicationsList.pageCount}
		rowCount={applicationsList.count}
		isManualPagination={true}
	/>
</div>
