import { createColumnHelper } from '@tanstack/svelte-table';
import type { DataTableFeatures } from './admin-table-features.js';
import type { CsvColumn } from './csv.js';
import { type RouterOutput } from '#lib/trpc.js';

export type UsageRow = RouterOutput['admin']['getContainerUsage']['rows'][number];

const columnHelper = createColumnHelper<DataTableFeatures, UsageRow>();

const percent = (value: number | null) => (value === null ? '–' : `${(value * 100).toFixed(1)}%`);

function bytes(value: number | null) {
	if (value === null) return '–';
	if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(1)} GB`;
	if (value >= 1024 ** 2) return `${Math.round(value / 1024 ** 2)} MB`;
	return `${Math.round(value / 1024)} KB`;
}

const usedOf = (used: number, max: number) =>
	max > 0 ? `${Math.round((used / max) * 100)}% of ${bytes(max)}` : bytes(used);

export const usageColumns = columnHelper.columns([
	columnHelper.accessor('username', {
		header: 'Username'
	}),
	columnHelper.accessor((row) => row.node ?? 'Unknown', {
		id: 'node',
		header: 'Node'
	}),
	columnHelper.accessor('status', {
		header: 'Status'
	}),
	columnHelper.accessor('avgCpu', {
		cell: (info) => percent(info.getValue()),
		header: 'Avg CPU'
	}),
	columnHelper.accessor('peakCpu', {
		cell: (info) => percent(info.getValue()),
		header: 'Peak CPU'
	}),
	columnHelper.display({
		id: 'memory',
		cell: ({ row }) => usedOf(row.original.mem, row.original.maxmem),
		header: 'Memory'
	}),
	columnHelper.display({
		id: 'disk',
		cell: ({ row }) => usedOf(row.original.disk, row.original.maxdisk),
		header: 'Disk'
	}),
	columnHelper.accessor('netPerDay', {
		cell: (info) => bytes(info.getValue()),
		header: 'Net / day'
	}),
	columnHelper.accessor('lastSshAt', {
		cell: (info) => info.getValue()?.toDateString() ?? 'Never',
		header: 'Last SSH'
	})
]);

const rounded = (value: number | null, divisor: number) =>
	value === null ? null : Math.round((value / divisor) * 10) / 10;

const percentOf = (used: number, max: number) => (max > 0 ? rounded(used, max / 100) : null);

const MB = 1024 ** 2;
const GB = 1024 ** 3;

// plain numbers in fixed units, so the file can be sorted and summed in a spreadsheet
export const usageCsv: CsvColumn<UsageRow>[] = [
	{ header: 'Username', value: (row) => row.username },
	{ header: 'VMID', value: (row) => row.vmid },
	{ header: 'Node', value: (row) => row.node },
	{ header: 'Status', value: (row) => row.status },
	{ header: 'Cores', value: (row) => row.cpus },
	{ header: 'CPU now %', value: (row) => rounded(row.cpu, 0.01) },
	{ header: 'Avg CPU %', value: (row) => rounded(row.avgCpu, 0.01) },
	{ header: 'Peak CPU %', value: (row) => rounded(row.peakCpu, 0.01) },
	{ header: 'Memory used MB', value: (row) => rounded(row.mem, MB) },
	{ header: 'Memory limit MB', value: (row) => rounded(row.maxmem, MB) },
	{ header: 'Memory %', value: (row) => percentOf(row.mem, row.maxmem) },
	{ header: 'Disk used GB', value: (row) => rounded(row.disk, GB) },
	{ header: 'Disk limit GB', value: (row) => rounded(row.maxdisk, GB) },
	{ header: 'Disk %', value: (row) => percentOf(row.disk, row.maxdisk) },
	{ header: 'Network per day MB', value: (row) => rounded(row.netPerDay, MB) },
	{ header: 'Days of history', value: (row) => row.daysOfHistory },
	{ header: 'Idle', value: (row) => (row.idle ? 'yes' : 'no') },
	{ header: 'Last SSH', value: (row) => row.lastSshAt?.toISOString() },
	{ header: 'Read at', value: (row) => row.sampledAt.toISOString() }
];
