<script lang="ts" generics="TData extends RowData">
	import { type ColumnDef, type RowData, createTable, FlexRender } from '@tanstack/svelte-table';
	import * as Table from '#lib/components/ui/table/index.js';
	import { features, type DataTableFeatures } from './admin-table-features.js';
	import { untrack } from 'svelte';
	import type { PaginationState, SortingState } from '@tanstack/table-core';
	import Button from '#lib/components/ui/button/button.svelte';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import * as InputGroup from '#lib/components/ui/input-group/index.js';
	import * as Pagination from '#lib/components/ui/pagination/index.js';
	import SearchIcon from '@lucide/svelte/icons/search';

	type DataTableProps<TData extends RowData> = {
		columns: ColumnDef<DataTableFeatures, TData>[];
		data: TData[];
	};

	let {
		data,
		columns,
		pageCount = undefined,
		rowCount = undefined,
		onPageChange = undefined,
		searchQuery = $bindable(''),
		shouldShowSearchInput = true,
		isManualPagination = false
	}: DataTableProps<TData> & {
		pageCount?: number;
		rowCount?: number;
		onPageChange?: (updater: PaginationState) => void;
		searchQuery?: string;
		shouldShowSearchInput?: boolean;
		isManualPagination?: boolean;
	} = $props();

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
	let sorting = $state<SortingState>([]);

	const table = createTable({
		features,
		get data() {
			return data;
		},
		columns: untrack(() => columns),
		get manualPagination() {
			return isManualPagination;
		},
		get pageCount() {
			return pageCount;
		},
		get rowCount() {
			return rowCount;
		},
		state: {
			get pagination() {
				return pagination;
			},
			get sorting() {
				return sorting;
			}
		},
		onPaginationChange: (updater) => {
			pagination = typeof updater === 'function' ? updater(pagination) : updater;
			onPageChange?.(pagination);
		}
	});

	function getPage() {
		return pagination.pageIndex + 1;
	}

	function setPage(newPage: number) {
		table.setPageIndex(newPage - 1);
	}
</script>

<div>
	<div class="flex items-center py-4">
		{#if shouldShowSearchInput}
			<InputGroup.Root class="max-w-sm">
				<InputGroup.Input
					placeholder="Search..."
					bind:value={searchQuery}
					oninput={() => {
						table.setPageIndex(0);
					}}
				/>
				<InputGroup.Addon>
					<SearchIcon />
				</InputGroup.Addon>
			</InputGroup.Root>
		{/if}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="outline" class="ms-auto">Columns</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				{#each table.getAllColumns().filter((col) => col.getCanHide()) as column (column.id)}
					<DropdownMenu.CheckboxItem
						bind:checked={() => column.getIsVisible(), (v) => column.toggleVisibility(!!v)}
					>
						{column.columnDef.header}
					</DropdownMenu.CheckboxItem>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<Table.Row>
						{#each headerGroup.headers as header (header.id)}
							<Table.Head colspan={header.colSpan}>
								{#if !header.isPlaceholder}
									<FlexRender {header} />
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
			<Table.Body>
				{#each table.getRowModel().rows as row (row.id)}
					<Table.Row data-state={row.getIsSelected() && 'selected'}>
						{#each row.getVisibleCells() as cell (cell.id)}
							<Table.Cell>
								<FlexRender {cell} />
							</Table.Cell>
						{/each}
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={columns.length} class="h-24 text-center">No results.</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
	<div class="flex items-center justify-end space-x-2 py-4">
		<Pagination.Root
			class="justify-end"
			bind:page={getPage, setPage}
			count={rowCount ?? data.length}
			perPage={pagination.pageSize}
		>
			{#snippet children({ pages, currentPage })}
				<Pagination.Content>
					<Pagination.Item>
						<Pagination.Previous />
					</Pagination.Item>
					{#each pages as page (page.key)}
						{#if page.type === 'ellipsis'}
							<Pagination.Item>
								<Pagination.Ellipsis />
							</Pagination.Item>
						{:else}
							<Pagination.Item>
								<Pagination.Link {page} isActive={currentPage === page.value}>
									{page.value}
								</Pagination.Link>
							</Pagination.Item>
						{/if}
					{/each}
					<Pagination.Item>
						<Pagination.Next />
					</Pagination.Item>
				</Pagination.Content>
			{/snippet}
		</Pagination.Root>
	</div>
</div>
