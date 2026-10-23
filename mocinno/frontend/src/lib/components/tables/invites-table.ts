import { createColumnHelper, renderComponent } from '@tanstack/svelte-table';
import type { DataTableFeatures } from './admin-table-features.js';
import { type RouterOutput } from '#lib/trpc.js';
import InvitesTableActions from './invites-table-actions.svelte';

const columnHelper = createColumnHelper<
	DataTableFeatures,
	RouterOutput['admin']['getInvites']['data'][number]
>();

export const columns = columnHelper.columns([
	columnHelper.accessor('code', {
		header: 'Code'
	}),
	columnHelper.accessor('uses', {
		header: 'Uses'
	}),
	columnHelper.accessor('max_uses', {
		cell: (info) => info.getValue() ?? 'Unlimited',
		header: 'Max Uses'
	}),
	columnHelper.accessor('expires_at', {
		cell: (info) => info.getValue()?.toDateString(),
		header: 'Expires'
	}),
	columnHelper.accessor('admin_email', {
		header: 'Created By'
	}),
	columnHelper.display({
		id: 'actions',
		cell: ({ row }) => {
			return renderComponent(InvitesTableActions, {
				code: row.original.code
			});
		},
		header: 'Actions'
	})
]);
