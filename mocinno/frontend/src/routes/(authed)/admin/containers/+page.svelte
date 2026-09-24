<script lang="ts">
	import Head from '$lib/components/head.svelte';
	import trpc from '$lib/trpc';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import AdminTable from '$lib/components/tables/admin-table.svelte';
	import { columns } from '$lib/components/tables/containers-table.js';
	import type { PaginationState } from '@tanstack/table-core';
	import MassMigrateDialog from './mass-migrate-dialog.svelte';

	let { data } = $props();

	let containersList = $derived(data.containers);
	let page = $state(0);
	let searchQuery = $state('');

	$effect(() => {
		trpc.admin.getContainers
			.query({
				query: searchQuery,
				page: page + 1
			})
			.then((containers) => {
				containersList = containers;
			});
	});

	const refresh = () => {
		trpc.admin.getContainers.query({ query: searchQuery, page: page + 1 }).then((containers) => {
			containersList = containers;
		});
	};

	const onPageChange = (pagination: PaginationState) => {
		page = pagination.pageIndex;
		trpc.admin.getContainers
			.query({
				query: searchQuery,
				page: pagination.pageIndex + 1,
				limit: pagination.pageSize
			})
			.then((containers) => {
				containersList = containers;
			});
	};
</script>

<Head title="Containers" />

<div class="flex flex-1 flex-col gap-4">
	<div class="flex items-center justify-between gap-4">
		<h2 class="text-2xl font-bold tracking-tight">Containers</h2>
		<MassMigrateDialog onFinished={refresh} />
	</div>
	<p class="mt-1 text-muted-foreground">
		People being dumb? <br />Send them to the void here
	</p>
	<Separator class="my-4" />
	<AdminTable
		data={containersList.data}
		{columns}
		{onPageChange}
		bind:searchQuery
		pageCount={containersList.pageCount}
		rowCount={containersList.count}
		isManualPagination={true}
	/>
</div>
