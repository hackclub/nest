<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';
	import trpc, { type RouterOutput } from '$lib/trpc';

	let { onFinished }: { onFinished?: () => void } = $props();

	const flash = getFlash(page);

	let open = $state(false);
	let nodes = $state<string[]>([]);
	let from = $state('');
	let to = $state('');
	let count = $state(1);
	let starting = $state(false);
	let job = $state<RouterOutput['admin']['getMigrationStatus']>(null);

	let percent = $derived(job ? Math.round((job.done / job.total) * 100) : 0);

	let pollTimer: ReturnType<typeof setInterval> | undefined;

	const poll = async () => {
		const wasRunning = job?.running;
		job = await trpc.admin.getMigrationStatus.query();
		if (!job?.running) {
			clearInterval(pollTimer);
			pollTimer = undefined;
			if (wasRunning) onFinished?.();
		}
	};

	const startPolling = () => {
		if (!pollTimer) pollTimer = setInterval(poll, 2000);
	};

	onMount(() => {
		trpc.admin.getNodes.query().then((n) => (nodes = n));
		poll().then(() => {
			if (job?.running) startPolling();
		});
		return () => clearInterval(pollTimer);
	});

	const start = async (event: SubmitEvent) => {
		event.preventDefault();
		starting = true;
		const result = await trpc.admin.startMassMigration.mutate({ from, to, count });
		$flash = { message: result.message, type: result.success ? 'success' : 'error' };
		starting = false;
		if (result.success) {
			await poll();
			startPolling();
		}
	};
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>
		{#if job?.running}
			<Spinner /> Migrating {job.done}/{job.total}
		{:else}
			Mass migrate
		{/if}
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-106.25">
		<Dialog.Header class="mb-4">
			<Dialog.Title>Mass migrate containers</Dialog.Title>
			<Dialog.Description>
				Moves containers between nodes, highest VMID first. Running containers are restarted.
			</Dialog.Description>
		</Dialog.Header>

		{#if job}
			<div class="mb-4 flex flex-col gap-2">
				<div class="flex justify-between text-sm">
					<span>
						{job.from} → {job.to}
						{#if job.current}· migrating {job.current}{/if}
					</span>
					<span>{job.done}/{job.total}</span>
				</div>
				<div class="h-2 w-full overflow-hidden rounded-full bg-secondary">
					<div class="h-full bg-primary transition-all" style="width: {percent}%"></div>
				</div>
				{#if !job.running}
					<p class="text-sm text-muted-foreground">
						Finished: {job.total - job.failed.length} migrated, {job.failed.length} failed
					</p>
				{/if}
				{#if job.failed.length > 0}
					<ul class="max-h-32 overflow-y-auto text-sm text-destructive">
						{#each job.failed as failure (failure.vmid)}
							<li>{failure.vmid}: {failure.error}</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}

		{#if !job?.running}
			<form onsubmit={start} class="flex flex-col gap-4">
				<div class="flex gap-4">
					<div class="flex flex-1 flex-col gap-2">
						<Label>From</Label>
						<Select.Root type="single" bind:value={from}>
							<Select.Trigger class="w-full">{from || 'Select node'}</Select.Trigger>
							<Select.Content>
								{#each nodes as node (node)}
									<Select.Item value={node} label={node}>{node}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-1 flex-col gap-2">
						<Label>To</Label>
						<Select.Root type="single" bind:value={to}>
							<Select.Trigger class="w-full">{to || 'Select node'}</Select.Trigger>
							<Select.Content>
								{#each nodes.filter((n) => n !== from) as node (node)}
									<Select.Item value={node} label={node}>{node}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
				<div class="flex flex-col gap-2">
					<Label for="migrate-count">Number of containers</Label>
					<Input id="migrate-count" type="number" min="1" bind:value={count} />
				</div>
				<Dialog.Footer>
					<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
						Cancel
					</Dialog.Close>
					<Button type="submit" disabled={starting || !from || !to || from === to || count < 1}>
						{#if starting}<Spinner />{/if}
						Migrate
					</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
