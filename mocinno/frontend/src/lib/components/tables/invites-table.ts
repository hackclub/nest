import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import InvitesTableActions from './invites-table-actions.svelte';
import { type RouterOutput } from '$lib/trpc';

export const columns: ColumnDef<RouterOutput['admin']['getInvites']['data'][number]>[] = [
	{
		accessorKey: 'code',
		header: 'Code'
	},
	{
		accessorKey: 'uses',
		header: 'Uses'
	},
	{
		accessorFn: (row) => row.max_uses ?? 'Unlimited',
		header: 'Max Uses'
	},
	{
		accessorFn: (row) => (row.expires_at ? row.expires_at.toDateString() : 'Never'),
		header: 'Expires'
	},
	{
		accessorKey: 'admin_email',
		header: 'Created By'
	},
	{
		id: 'actions',
		cell: ({ row }) => {
			return renderComponent(InvitesTableActions, {
				code: row.original.code
			});
		},
		header: 'Actions'
	}
];
