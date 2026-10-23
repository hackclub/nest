import { createColumnHelper, renderComponent, renderSnippet } from '@tanstack/svelte-table';
import type { DataTableFeatures } from './admin-table-features.js';
import { type RouterOutput } from '#lib/trpc.js';
import ProjectsTableActions, { externalLink } from './projects-table-actions.svelte';

const columnHelper = createColumnHelper<
	DataTableFeatures,
	RouterOutput['admin']['getProjects']['data'][number]
>();

export const columns = columnHelper.columns([
	columnHelper.accessor('name', {
		header: 'Name'
	}),
	columnHelper.accessor((row) => row.container?.username, {
		header: 'Owner'
	}),
	columnHelper.accessor('demo', {
		cell: ({ row }) => {
			return renderSnippet(externalLink, { href: row.original.demo });
		},
		header: 'Demo'
	}),
	columnHelper.accessor('repo', {
		cell: ({ row }) => {
			return renderSnippet(externalLink, { href: row.original.repo });
		},
		header: 'Repository'
	}),
	columnHelper.accessor('created_at', {
		cell: (info) => info.getValue()?.toDateString(),
		header: 'Created'
	}),
	columnHelper.display({
		id: 'actions',
		cell: ({ row }) => {
			return renderComponent(ProjectsTableActions, {
				id: row.original.id,
				name: row.original.name
			});
		},
		header: 'Actions'
	})
]);
