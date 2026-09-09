import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent, renderSnippet } from '$lib/components/ui/data-table/index.js';
import ContainersTableActions, { booleanBadge } from './containers-table-actions.svelte';
import { type RouterOutput } from '$lib/trpc';

export const columns: ColumnDef<RouterOutput['admin']['getContainers']['data'][number]>[] = [
	{
		accessorKey: 'username',
		header: 'Username'
	},
	{
		accessorKey: 'vmid',
		header: 'VMID'
	},
	{
		accessorKey: 'suspended',
		cell: ({ row }) => {
			return renderSnippet(booleanBadge, { bool: row.original.suspended, colorInverse: true });
		},
		header: 'Suspended'
	},
	{
		accessorFn: (row) => row.created_at?.toDateString(),
		header: 'Created'
	},
	{
		id: 'actions',
		cell: ({ row }) => {
			return renderComponent(ContainersTableActions, {
				id: row.original.id,
				suspended: row.original.suspended
			});
		},
		header: 'Actions'
	}
];
