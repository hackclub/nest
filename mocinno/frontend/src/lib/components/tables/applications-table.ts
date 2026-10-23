import { createColumnHelper, renderComponent, renderSnippet } from '@tanstack/svelte-table';
import type { DataTableFeatures } from './admin-table-features.js';
import ApplicationsTableActions, { reasonSnippet } from './applications-table-actions.svelte';
import { type RouterOutput } from '#lib/trpc.js';

const columnHelper = createColumnHelper<
	DataTableFeatures,
	RouterOutput['admin']['getApplications']['all'][number]
>();

export const columns = columnHelper.columns([
	columnHelper.accessor((row) => row.email || row.user?.email, {
		id: 'email',
		header: 'Email'
	}),
	columnHelper.accessor('username', {
		header: 'Username'
	}),
	columnHelper.accessor('reason', {
		cell: ({ row }) => {
			return renderSnippet(reasonSnippet, {
				reason: row.original.reason
			});
		},
		header: 'Reason'
	}),
	columnHelper.accessor('created_at', {
		cell: (info) => info.getValue()?.toDateString(),
		header: 'Submitted'
	}),
	columnHelper.display({
		id: 'actions',
		cell: ({ row }) => {
			return renderComponent(ApplicationsTableActions, {
				id: row.original.id,
				reviewer: row.original.reviewer ?? row.original.reviewed_by,
				status: row.original.status as 'pending' | 'approved' | 'rejected'
			});
		},
		header: 'Actions'
	})
]);
