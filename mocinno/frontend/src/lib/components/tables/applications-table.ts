import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent, renderSnippet } from '$lib/components/ui/data-table/index.js';
import ApplicationsTableActions, { reasonSnippet } from './applications-table-actions.svelte';
import { type RouterOutput } from '$lib/trpc';

export const columns: ColumnDef<RouterOutput['admin']['getApplications']['all'][number]>[] = [
	{
		accessorFn: (row) => row.user?.email ?? row.email,
		header: 'Email'
	},
	{
		accessorKey: 'username',
		header: 'Username'
	},
	{
		cell: ({ row }) => {
			return renderSnippet(reasonSnippet, {
				reason: row.original.reason
			});
		},
		header: 'Reason'
	},
	{
		accessorFn: (row) => row.created_at?.toDateString(),
		header: 'Submitted'
	},
	{
		id: 'actions',
		cell: ({ row }) => {
			return renderComponent(ApplicationsTableActions, {
				id: row.original.id,
				reviewer: row.original.reviewer ?? row.original.reviewed_by,
				status: row.original.status as 'pending' | 'approved' | 'rejected'
			});
		},
		header: 'Actions'
	}
];
