<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';
	import trpc, { type RouterInput, type RouterOutput } from '#lib/trpc.js';

	type Kind = RouterInput['admin']['sendLifecycleEmails']['kind'];

	let {
		kind,
		label,
		pending,
		blocked,
		onFinished
	}: {
		kind: Kind;
		label: string;
		pending: number;
		blocked?: string;
		onFinished?: () => void;
	} = $props();

	const flash = getFlash(page);

	let open = $state(false);
	let starting = $state(false);
	let testing = $state(false);
	let job = $state<RouterOutput['admin']['getLifecycleEmailStatus']>(null);

	const ownJob = $derived(job?.kind === kind ? job : null);
	const otherRunning = $derived(!!job?.running && job.kind !== kind);
	const done = $derived(ownJob ? ownJob.sent + ownJob.skipped + ownJob.failed.length : 0);
	const percent = $derived(ownJob?.total ? Math.round((done / ownJob.total) * 100) : 0);

	let pollTimer: ReturnType<typeof setInterval> | undefined;

	const poll = async () => {
		const wasRunning = job?.running;
		job = await trpc.admin.getLifecycleEmailStatus.query();
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
		poll().then(() => {
			if (job?.running) startPolling();
		});
		return () => clearInterval(pollTimer);
	});

	const sendTest = async () => {
		testing = true;
		const result = await trpc.admin.sendLifecycleTestEmail.mutate({ kind });
		$flash = { message: result.message, type: result.success ? 'success' : 'error' };
		testing = false;
	};

	const start = async () => {
		starting = true;
		const result = await trpc.admin.sendLifecycleEmails.mutate({ kind });
		$flash = { message: result.message, type: result.success ? 'success' : 'error' };
		starting = false;
		if (result.success) {
			await poll();
			startPolling();
		}
	};
</script>

<Button variant="outline" disabled={testing} onclick={sendTest}>
	{#if testing}<Spinner />{/if}
	Send test to me
</Button>

<Dialog.Root bind:open>
	<Dialog.Trigger
		class={buttonVariants()}
		disabled={!ownJob?.running && (pending === 0 || !!blocked || otherRunning)}
	>
		{#if ownJob?.running}
			<Spinner /> Sending {done}/{ownJob.total}
		{:else}
			Email {pending.toLocaleString()} not yet emailed
		{/if}
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-106.25">
		<Dialog.Header class="mb-4">
			<Dialog.Title>Send {label} email</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to send the {label} email?
			</Dialog.Description>
		</Dialog.Header>

		{#if ownJob}
			<div class="mb-4 flex flex-col gap-2">
				<div class="flex justify-between text-sm">
					<span>
						Started by {ownJob.startedBy}
						{#if ownJob.current}, sending to {ownJob.current}{/if}
					</span>
					<span>{done}/{ownJob.total}</span>
				</div>
				<div class="h-2 w-full overflow-hidden rounded-full bg-secondary">
					<div class="h-full bg-primary transition-all" style="width: {percent}%"></div>
				</div>
				{#if !ownJob.running}
					<p class="text-sm text-muted-foreground">
						Finished: {ownJob.sent} sent, {ownJob.failed.length} failed, {ownJob.skipped} already emailed
					</p>
				{/if}
				{#if ownJob.failed.length > 0}
					<ul class="max-h-32 overflow-y-auto text-sm text-destructive">
						{#each ownJob.failed as failure (failure.email)}
							<li>{failure.email}: {failure.error}</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}

		{#if !ownJob?.running}
			<Dialog.Footer>
				<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
					Cancel
				</Dialog.Close>
				<Button disabled={starting || pending === 0 || !!blocked || otherRunning} onclick={start}>
					{#if starting}<Spinner />{/if}
					Send {pending.toLocaleString()} emails
				</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>

{#if blocked}
	<p class="text-sm text-muted-foreground">{blocked}</p>
{:else if otherRunning}
	<p class="text-sm text-muted-foreground">Another lifecycle email send is running.</p>
{/if}
