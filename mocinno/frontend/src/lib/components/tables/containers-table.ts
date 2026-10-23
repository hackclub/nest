import { createColumnHelper, renderComponent, renderSnippet } from '@tanstack/svelte-table';
import type { DataTableFeatures } from './admin-table-features.js';
import { type RouterOutput } from '#lib/trpc.js';
import ContainersTableActions, { booleanBadge } from './containers-table-actions.svelte';

const columnHelper = createColumnHelper<
	DataTableFeatures,
	RouterOutput['admin']['getContainers']['data'][number]
>();

export const columns = columnHelper.columns([
	columnHelper.accessor('username', {
		header: 'Username'
	}),
	columnHelper.accessor('vmid', {
		header: 'VMID'
	}),
	columnHelper.accessor('suspended', {
		cell: ({ row }) => {
			return renderSnippet(booleanBadge, { bool: row.original.suspended, colorInverse: true });
		},
		header: 'Suspended'
	}),
	columnHelper.accessor('created_at', {
		cell: (info) => info.getValue()?.toDateString(),
		header: 'Created'
	}),
	columnHelper.display({
		id: 'actions',
		cell: ({ row }) => {
			return renderComponent(ContainersTableActions, {
				id: row.original.id,
				suspended: row.original.suspended
			});
		},
		header: 'Actions'
	})
]);
