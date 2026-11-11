import { createColumnHelper } from '@tanstack/svelte-table';
import type { DataTableFeatures } from './admin-table-features.js';
import type { CsvColumn } from './csv.js';
import { type RouterOutput } from '#lib/trpc.js';

export type LifecycleRow = RouterOutput['admin']['getLifecycleLists']['agedOut'][number];

const columnHelper = createColumnHelper<DataTableFeatures, LifecycleRow>();

const day = (date: Date | null | undefined) => date?.toDateString() ?? 'Never';

const person = columnHelper.columns([
	columnHelper.accessor('username', {
		header: 'Username'
	}),
	columnHelper.accessor((row) => row.email ?? 'Unknown', {
		id: 'email',
		header: 'Email'
	}),
	columnHelper.accessor((row) => row.node ?? 'Unknown', {
		id: 'node',
		header: 'Node'
	}),
	columnHelper.accessor('joinedAt', {
		cell: (info) => info.getValue()?.toDateString() ?? 'Unknown',
		header: 'Joined'
	})
]);

const lastSsh = columnHelper.accessor('lastSshAt', {
	cell: (info) => day(info.getValue()),
	header: 'Last SSH'
});

const lastShipped = columnHelper.accessor('lastShippedAt', {
	cell: (info) => info.getValue()?.toDateString() ?? 'Unknown date',
	header: 'Last shipped'
});

export const agedOutColumns = columnHelper.columns([
	...person,
	columnHelper.accessor('agedOutAt', {
		cell: (info) => info.getValue()?.toDateString() ?? 'Unknown',
		header: 'First seen aged out'
	}),
	lastSsh
]);

export const neverShippedColumns = columnHelper.columns([...person, lastSsh]);

export const staleColumns = columnHelper.columns([...person, lastShipped, lastSsh]);

type LifecycleCsvColumn = CsvColumn<LifecycleRow>;

// yyyy-mm-dd in the viewer's timezone, matching the dates in the table
const isoDay = (date: Date | null | undefined) => date?.toLocaleDateString('en-CA');

const personCsv: LifecycleCsvColumn[] = [
	{ header: 'Username', value: (row) => row.username },
	{ header: 'Email', value: (row) => row.email },
	{ header: 'Node', value: (row) => row.node },
	{ header: 'Joined', value: (row) => isoDay(row.joinedAt) }
];

const lastSshCsv: LifecycleCsvColumn = {
	header: 'Last SSH',
	value: (row) => isoDay(row.lastSshAt)
};

export const agedOutCsv: LifecycleCsvColumn[] = [
	...personCsv,
	{ header: 'First seen aged out', value: (row) => isoDay(row.agedOutAt) },
	lastSshCsv
];

export const neverShippedCsv: LifecycleCsvColumn[] = [...personCsv, lastSshCsv];

export const staleCsv: LifecycleCsvColumn[] = [
	...personCsv,
	{ header: 'Last shipped', value: (row) => isoDay(row.lastShippedAt) },
	lastSshCsv
];
