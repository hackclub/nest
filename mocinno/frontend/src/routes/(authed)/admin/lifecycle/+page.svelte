<script lang="ts">
	import Head from '#lib/components/head.svelte';
	import { Separator } from '#lib/components/ui/separator/index.js';
	import AdminTable from '#lib/components/tables/admin-table.svelte';
	import Button from '#lib/components/ui/button/button.svelte';
	import {
		agedOutColumns,
		agedOutCsv,
		neverShippedColumns,
		neverShippedCsv,
		staleColumns,
		staleCsv
	} from '#lib/components/tables/lifecycle-table.js';
	import { downloadCsv } from '#lib/components/tables/csv.js';
	import type { PaginationState } from '@tanstack/table-core';

	let { data } = $props();

	const lists = $derived(data.lists);

	const tabs = $derived([
		{
			id: 'agedOut',
			title: 'Aged out',
			detail: 'Verified, but now over 18 on Hack Club Auth',
			rows: lists.agedOut,
			columns: agedOutColumns,
			csv: agedOutCsv,
			fileName: 'aged-out'
		},
		{
			id: 'neverShipped',
			title: 'Never shipped',
			detail: 'No approved projects, on Nest for over 3 months',
			rows: lists.neverShipped,
			columns: neverShippedColumns,
			csv: neverShippedCsv,
			fileName: 'never-shipped'
		},
		{
			id: 'stale',
			title: 'No ships in 3 months',
			detail: 'Has shipped, but not in the last 90 days',
			rows: lists.stale,
			columns: staleColumns,
			csv: staleCsv,
			fileName: 'no-ships-3-months'
		}
	] as const);

	let activeId = $state<(typeof tabs)[number]['id']>('agedOut');
	let searchQuery = $state('');
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });

	const active = $derived(tabs.find((tab) => tab.id === activeId)!);

	const filteredRows = $derived.by(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) return active.rows;
		return active.rows.filter(
			(row) =>
				row.username.toLowerCase().includes(query) || row.email?.toLowerCase().includes(query)
		);
	});

	const pageRows = $derived(
		filteredRows.slice(
			pagination.pageIndex * pagination.pageSize,
			(pagination.pageIndex + 1) * pagination.pageSize
		)
	);

	const authGaps = $derived(
		[
			{ count: lists.notChecked, label: 'not checked on Hack Club Auth yet' },
			{ count: lists.notFound, label: 'not found on Hack Club Auth' },
			{ count: lists.noEmail, label: 'with no email on file' }
		]
			.filter((gap) => gap.count > 0)
			.map((gap) => `${gap.count.toLocaleString()} ${gap.label}`)
	);

	function selectTab(id: typeof activeId) {
		activeId = id;
		searchQuery = '';
		pagination = { ...pagination, pageIndex: 0 };
	}
</script>

<Head title="Lifecycle" />

<div class="flex flex-1 flex-col gap-4">
	<h2 class="text-2xl font-bold tracking-tight">Lifecycle</h2>
	<p class="mt-1 text-muted-foreground">
		Who has aged out or stopped shipping<br />Last checked on Hack Club Auth: {lists.lastChecked
			? new Date(lists.lastChecked).toLocaleString()
			: 'not yet'}
	</p>
	<Separator class="my-4" />

	{#if !lists.backfill?.startsWith('finished')}
		<p class="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
			{lists.backfill
				? `The one-time Unified backfill ${lists.backfill}, but hasn't finished.`
				: 'The one-time Unified backfill has not been run.'} Only projects approved in the last 90 days
			are known until it does, so the shipping lists will be wrong (<code
				>bun run unified:backfill</code
			>).
		</p>
	{/if}

	{#if lists.checkError}
		<p
			class="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
		>
			{lists.checkError}
		</p>
	{/if}

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		{#each tabs as tab (tab.id)}
			<button
				type="button"
				class={[
					'rounded-md border p-4 text-start',
					activeId === tab.id ? 'border-primary bg-muted' : 'border-border'
				]}
				aria-pressed={activeId === tab.id}
				onclick={() => selectTab(tab.id)}
			>
				<h4 class="text-sm font-medium text-muted-foreground">{tab.title}</h4>
				<p class="text-xl font-bold">{tab.rows.length.toLocaleString()}</p>
				<p class="text-sm text-muted-foreground">{tab.detail}</p>
			</button>
		{/each}
	</div>

	{#if authGaps.length > 0}
		<p class="text-sm text-muted-foreground">
			The aged-out list may be missing containers: {authGaps.join(', ')}.
		</p>
	{/if}

	<div class="flex justify-end">
		<Button
			variant="outline"
			disabled={filteredRows.length === 0}
			onclick={() => downloadCsv(`nest-${active.fileName}`, active.csv, filteredRows)}
		>
			Download CSV
		</Button>
	</div>

	{#key activeId}
		<AdminTable
			data={pageRows}
			columns={active.columns}
			onPageChange={(next) => (pagination = next)}
			bind:searchQuery
			pageCount={Math.max(1, Math.ceil(filteredRows.length / pagination.pageSize))}
			rowCount={filteredRows.length}
			isManualPagination={true}
		/>
	{/key}
</div>
