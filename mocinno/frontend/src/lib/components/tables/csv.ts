export type CsvColumn<T> = {
	header: string;
	value: (row: T) => string | number | null | undefined;
};

function csvCell(value: string) {
	// spreadsheets run cells starting with these as formulas
	const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
	return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function toCsv<T>(columns: CsvColumn<T>[], rows: readonly T[]) {
	return [
		columns.map((column) => csvCell(column.header)),
		...rows.map((row) => columns.map((column) => csvCell(String(column.value(row) ?? ''))))
	]
		.map((cells) => cells.join(','))
		.join('\r\n');
}

export function downloadCsv<T>(name: string, columns: CsvColumn<T>[], rows: readonly T[]) {
	const url = URL.createObjectURL(new Blob([toCsv(columns, rows)], { type: 'text/csv' }));
	const link = document.createElement('a');
	link.href = url;
	link.download = `${name}-${new Date().toLocaleDateString('en-CA')}.csv`;
	link.click();
	URL.revokeObjectURL(url);
}
