<script lang="ts">
	import Head from '#lib/components/head.svelte';
	import { Separator } from '#lib/components/ui/separator/index.js';
	import AdminTable from '#lib/components/tables/admin-table.svelte';
	import * as Select from '#lib/components/ui/select/index.js';
	import Button from '#lib/components/ui/button/button.svelte';
	import { downloadCsv } from '#lib/components/tables/csv.js';
	import { usageColumns, usageCsv, type UsageRow } from '#lib/components/tables/usage-table.js';
	import trpc from '#lib/trpc.js';
	import type { PaginationState } from '@tanstack/table-core';

	let { data } = $props();

	const usage = $derived(data.usage);

	const ratio = (used: number, max: number) => (max > 0 ? used / max : 0);
	const memRatio = (row: UsageRow) => ratio(row.mem, row.maxmem);
	const diskRatio = (row: UsageRow) => ratio(row.disk, row.maxdisk);

	const sorts = {
		cpu: { label: 'Avg CPU', value: (row: UsageRow) => row.avgCpu ?? 0 },
		memory: { label: 'Memory used', value: memRatio },
		disk: { label: 'Disk used', value: diskRatio },
		network: { label: 'Network / day', value: (row: UsageRow) => row.netPerDay ?? 0 }
	};
	type SortId = keyof typeof sorts;

	const filters: {
		id: string;
		title: string;
		detail: string;
		match: (row: UsageRow) => boolean;
		sort: SortId;
	}[] = [
		{ id: 'all', title: 'All', detail: 'Every container', match: () => true, sort: 'cpu' },
		{
			id: 'cpu',
			title: 'High CPU',
			detail: 'Averaging 50%+ of its cores',
			match: (row) => (row.avgCpu ?? 0) >= 0.5,
			sort: 'cpu'
		},
		{
			id: 'memory',
			title: 'High memory',
			detail: 'Using 80%+ of its limit now',
			match: (row) => memRatio(row) >= 0.8,
			sort: 'memory'
		},
		{
			id: 'disk',
			title: 'Near disk limit',
			detail: 'Using 85%+ of its disk',
			match: (row) => diskRatio(row) >= 0.85,
			sort: 'disk'
		},
		{
			id: 'idle',
			title: 'Idle',
			detail: 'Running, under 1% CPU and 10 MB/day, 7+ days of data',
			match: (row) => row.idle,
			sort: 'cpu'
		},
		{
			id: 'stopped',
			title: 'Stopped',
			detail: 'Not running right now',
			match: (row) => row.status === 'stopped',
			sort: 'disk'
		}
	];

	let activeId = $state('all');
	let sortBy = $state<SortId>('cpu');
	let node = $state('all');
	let searchQuery = $state('');
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });

	const active = $derived(filters.find((filter) => filter.id === activeId)!);
	const nodes = $derived([...new Set(usage.rows.flatMap((row) => row.node ?? []))].sort());

	const inNode = $derived(usage.rows.filter((row) => node === 'all' || row.node === node));

	const visibleRows = $derived.by(() => {
		const query = searchQuery.trim().toLowerCase();
		const value = sorts[sortBy].value;

		return inNode
			.filter(active.match)
			.filter((row) => !query || row.username.toLowerCase().includes(query))
			.sort((a, b) => value(b) - value(a));
	});

	const pageRows = $derived(
		visibleRows.slice(
			pagination.pageIndex * pagination.pageSize,
			(pagination.pageIndex + 1) * pagination.pageSize
		)
	);

	function resetPage() {
		pagination = { ...pagination, pageIndex: 0 };
	}

	function selectFilter(filter: (typeof filters)[number]) {
		activeId = filter.id;
		sortBy = filter.sort;
		searchQuery = '';
		resetPage();
	}

	let downloading = $state(false);
	let downloadError = $state(false);

	// refetched so a tab left open still exports the latest readings
	async function downloadSnapshot() {
		downloading = true;
		downloadError = false;

		try {
			const { rows } = await trpc.admin.getContainerUsage.query();
			downloadCsv(
				'nest-usage-snapshot',
				usageCsv,
				rows.sort((a, b) => a.username.localeCompare(b.username))
			);
		} catch (err) {
			console.error('Failed to download usage snapshot:', err);
			downloadError = true;
		} finally {
			downloading = false;
		}
	}
</script>

<Head title="Usage" />

<div class="flex flex-1 flex-col gap-4">
	<h2 class="text-2xl font-bold tracking-tight">Usage</h2>
	<p class="mt-1 text-muted-foreground">
		What each container is using, averaged over up to {usage.windowDays} days<br />Last read from
		Proxmox: {usage.lastSampledAt ? usage.lastSampledAt.toLocaleString() : 'not yet'}
	</p>
	<Separator class="my-4" />

	{#if usage.pollError}
		<p
			class="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
		>
			{usage.pollError}
		</p>
	{/if}

	<div class="grid grid-cols-2 gap-4 lg:grid-cols-3">
		{#each filters as filter (filter.id)}
			<button
				type="button"
				class={[
					'rounded-md border p-4 text-start',
					activeId === filter.id ? 'border-primary bg-muted' : 'border-border'
				]}
				aria-pressed={activeId === filter.id}
				onclick={() => selectFilter(filter)}
			>
				<h4 class="text-sm font-medium text-muted-foreground">{filter.title}</h4>
				<p class="text-xl font-bold">{inNode.filter(filter.match).length.toLocaleString()}</p>
				<p class="text-sm text-muted-foreground">{filter.detail}</p>
			</button>
		{/each}
	</div>

	{#if downloadError}
		<p
			class="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
		>
			Could not download the snapshot, please try again.
		</p>
	{/if}

	<div class="flex flex-wrap justify-end gap-2">
		<Button variant="outline" class="me-auto" disabled={downloading} onclick={downloadSnapshot}>
			{downloading ? 'Preparing…' : 'Download all containers (CSV)'}
		</Button>
		<Select.Root type="single" bind:value={node} onValueChange={resetPage}>
			<Select.Trigger class="w-44" aria-label="Node">
				{node === 'all' ? 'All nodes' : node}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="all" label="All nodes" />
				{#each nodes as name (name)}
					<Select.Item value={name} label={name} />
				{/each}
			</Select.Content>
		</Select.Root>
		<Select.Root type="single" bind:value={sortBy} onValueChange={resetPage}>
			<Select.Trigger class="w-44" aria-label="Sort by">
				Sort: {sorts[sortBy].label}
			</Select.Trigger>
			<Select.Content>
				{#each Object.entries(sorts) as [id, sort] (id)}
					<Select.Item value={id} label={sort.label} />
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	{#key activeId}
		<AdminTable
			data={pageRows}
			columns={usageColumns}
			onPageChange={(next) => (pagination = next)}
			bind:searchQuery
			pageCount={Math.max(1, Math.ceil(visibleRows.length / pagination.pageSize))}
			rowCount={visibleRows.length}
			isManualPagination={true}
		/>
	{/key}
</div>
