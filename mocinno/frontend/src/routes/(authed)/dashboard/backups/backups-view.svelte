<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import type { RouterOutput } from '$lib/trpc';
	import trpc from '$lib/trpc';
	import { invalidateAll } from '$app/navigation';
	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';

	const flash = getFlash(page);

	type Backups = RouterOutput['user']['backups'];

	let { backups }: { backups: Backups } = $props();

	let restoring = $state(false);

	const restoreBackup = async (volId: string) => {
		restoring = true;
		const result = await trpc.user.restoreBackup.mutate({ volId });
		await invalidateAll();
		$flash = {
			message: result.message,
			type: result.success ? 'success' : 'error'
		};
		restoring = false;
	};
</script>

<div class="flex flex-1 flex-col gap-4">
	<h2 class="text-2xl font-bold tracking-tight">Backups</h2>
	<p class="mt-1 text-muted-foreground">View and restore your container backups.</p>
	<Separator class="my-4" />
	<Table.Root class="overflow-hidden rounded-lg border border-border bg-muted/25 shadow-sm">
		<Table.Header>
			<Table.Row>
				<Table.Head>Backup ID</Table.Head>
				<Table.Head>Created At</Table.Head>
				<Table.Head class="text-end">Actions</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each backups as backup (backup.volid)}
				<Table.Row>
					<Table.Cell class="font-medium">{backup.volid}</Table.Cell>
					<Table.Cell
						>{new Date((backup.ctime || Date.now() / 1000) * 1000).toLocaleString()}</Table.Cell
					>
					<Table.Cell class="flex justify-end text-end">
						<Button
							variant="outline"
							size="sm"
							disabled={restoring}
							onclick={() => restoreBackup(backup.volid)}
						>
							{#if restoring}
								<Spinner />
							{/if}
							Restore
						</Button>
					</Table.Cell>
				</Table.Row>
			{:else}
				<Table.Row>
					<Table.Cell colspan={3} class="text-center text-muted-foreground">
						No backups found.
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
