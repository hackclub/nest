import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent, renderSnippet } from '$lib/components/ui/data-table/index.js';
import ProjectsTableActions, { externalLink } from './projects-table-actions.svelte';
import { type RouterOutput } from '$lib/trpc';

export const columns: ColumnDef<RouterOutput['admin']['getProjects']['data'][number]>[] = [
	{
		accessorKey: 'name',
		header: 'Name'
	},
	{
		accessorFn: (row) => row.container?.username,
		header: 'Owner'
	},
	{
		id: 'demo',
		cell: ({ row }) => {
			return renderSnippet(externalLink, { href: row.original.demo });
		},
		header: 'Demo'
	},
	{
		id: 'repo',
		cell: ({ row }) => {
			return renderSnippet(externalLink, { href: row.original.repo });
		},
		header: 'Repository'
	},
	{
		accessorFn: (row) => row.created_at?.toDateString(),
		header: 'Created'
	},
	{
		id: 'actions',
		cell: ({ row }) => {
			return renderComponent(ProjectsTableActions, {
				id: row.original.id,
				name: row.original.name
			});
		},
		header: 'Actions'
	}
];
