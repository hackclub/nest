<script lang="ts" module>
	export { reasonSnippet };
</script>

<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { refreshAll } from '$app/navigation';
	import { type RouterOutput } from '#lib/trpc.js';
	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';
	import trpc from '#lib/trpc.js';

	const flash = getFlash(page);

	type Application = RouterOutput['admin']['getApplications']['all'][number];

	let {
		status,
		id,
		reviewer,
		rejectionReason
	}: {
		status: 'pending' | 'approved' | 'rejected';
		id: number;
		reviewer: string | Application['reviewer'];
		rejectionReason: string | null;
	} = $props();

	let processWorking = $state(false);
	let rejectOpen = $state(false);
	let reason = $state('');
	let rejectionError = $state('');

	const processApplication = async (action: 'approve' | 'reject') => {
		if (processWorking) return;
		processWorking = true;
		rejectionError = '';
		try {
			const result = await trpc.admin.processApplication.mutate(
				action === 'reject' ? { id, action, reason: reason.trim() } : { id, action }
			);
			if (!result.success && action === 'reject') {
				rejectionError = result.message;
				return;
			}
			if (result.success) {
				rejectOpen = false;
				reason = '';
			}
			$flash = {
				message: result.message,
				type: result.success ? 'success' : 'error'
			};
			await refreshAll();
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to process application';
			if (action === 'reject') rejectionError = message;
			else $flash = { message, type: 'error' };
		} finally {
			processWorking = false;
		}
	};
</script>

{#snippet reasonSnippet({ reason }: { reason: string })}
	<span class="max-w-4xl text-sm wrap-break-word whitespace-normal">{reason}</span>
{/snippet}

{#if status === 'pending'}
	<Button
		onclick={() => {
			processApplication('approve');
		}}
		disabled={processWorking}
	>
		{#if processWorking}<Spinner />{/if}
		Approve
	</Button>
	<Button
		onclick={() => {
			rejectionError = '';
			rejectOpen = true;
		}}
		variant="destructive"
		disabled={processWorking}
	>
		{#if processWorking}<Spinner />{/if}
		Reject
	</Button>
	<Dialog.Root bind:open={rejectOpen}>
		<Dialog.Content
			showCloseButton={!processWorking}
			onInteractOutside={(event) => {
				if (processWorking) event.preventDefault();
			}}
			onEscapeKeydown={(event) => {
				if (processWorking) event.preventDefault();
			}}
		>
			<form
				class="grid gap-4"
				onsubmit={(event) => {
					event.preventDefault();
					processApplication('reject');
				}}
			>
				<Dialog.Header>
					<Dialog.Title>Reject application</Dialog.Title>
					<Dialog.Description>They'll see what you put here</Dialog.Description>
				</Dialog.Header>
				<div class="grid gap-2">
					<Label for={`rejection-reason-${id}`}>Rejection reason</Label>
					<Textarea
						id={`rejection-reason-${id}`}
						bind:value={reason}
						required
						maxlength={2000}
						rows={5}
						disabled={processWorking}
						placeholder="ur username bad"
					/>
					{#if rejectionError}<p role="alert" class="text-sm text-destructive">
							{rejectionError}
						</p>{/if}
				</div>
				<Dialog.Footer>
					<Button
						type="button"
						variant="outline"
						disabled={processWorking}
						onclick={() => {
							rejectOpen = false;
						}}>Cancel</Button
					>
					<Button type="submit" variant="destructive" disabled={processWorking || !reason.trim()}>
						{#if processWorking}<Spinner />{/if}
						Reject and send email
					</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
{:else if status === 'approved'}
	<span class="max-w-1/16 text-sm wrap-break-word whitespace-normal text-primary"
		>Approved by {typeof reviewer === 'string' ? reviewer : reviewer?.email}</span
	>
{:else if status === 'rejected'}
	<div class="text-sm wrap-break-word whitespace-normal text-destructive">
		<span>Rejected by {typeof reviewer === 'string' ? reviewer : reviewer?.email}</span>
		{#if rejectionReason}<p class="mt-1 whitespace-pre-wrap">{rejectionReason}</p>{/if}
	</div>
{/if}
