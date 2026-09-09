<script module>
	export { booleanBadge };
</script>

<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
	import BadgeXIcon from '@lucide/svelte/icons/badge-x';
	import { invalidateAll } from '$app/navigation';
	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';
	import trpc from '$lib/trpc';

	const flash = getFlash(page);

	let { suspended, id }: { suspended: boolean; id: number } = $props();

	let suspendConfirm = $state(false);
	let suspendWorking = $state(false);
	let suspendReason = $state('');

	const toggleSuspend = async () => {
		suspendWorking = true;
		const result = await trpc.admin.toggleSuspend.mutate({
			id,
			reason: suspendReason
		});
		await invalidateAll();
		$flash = {
			message: result.message,
			type: result.success ? 'success' : 'error'
		};
		suspendWorking = false;
	};
</script>

{#snippet booleanBadge({
	bool,
	colorInverse = false,
	trueText = 'Yes',
	falseText = 'No'
}: {
	bool: boolean;
	colorInverse?: boolean;
	trueText?: string;
	falseText?: string;
})}
	<Badge
		variant="secondary"
		class={colorInverse
			? [
					!bool && 'bg-lime-500 dark:bg-lime-600',
					bool && 'bg-red-500 dark:bg-red-600',
					'text-white'
				]
			: [
					bool && 'bg-lime-500 dark:bg-lime-600',
					!bool && 'bg-red-500 dark:bg-red-600',
					'text-white'
				]}
	>
		{#if bool}<BadgeCheckIcon />{:else}<BadgeXIcon />{/if}
		{bool ? trueText : falseText}
	</Badge>
{/snippet}

<Dialog.Root bind:open={suspendConfirm}>
	<Dialog.Content class="sm:max-w-106.25">
		<form
			onsubmit={(e) => {
				e.preventDefault();
				toggleSuspend();
				suspendConfirm = false;
			}}
		>
			<Dialog.Header>
				<Dialog.Title>Suspend container</Dialog.Title>
				<Dialog.Description>
					Please provide a reason for suspending this container.
				</Dialog.Description>
			</Dialog.Header>
			<div class="flex items-start gap-x-4">
				<div class="mb-2 grid flex-1 gap-3 space-y-1">
					<Label for="reason">Reason</Label>
					<Input
						id="reason"
						name="reason"
						placeholder="Enter reason for suspension"
						bind:value={suspendReason}
					/>
				</div>
			</div>
			<Dialog.Footer>
				<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
					Cancel
				</Dialog.Close>
				<Button type="submit" variant="destructive">Suspend</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<Button
	onclick={() => {
		if (suspended) {
			toggleSuspend();
		} else {
			suspendReason = '';
			suspendConfirm = true;
		}
	}}
	variant={suspended ? 'default' : 'destructive'}
	disabled={suspendWorking}
>
	{#if suspendWorking}<Spinner />{/if}
	{suspended ? 'Unsuspend' : 'Suspend'}
</Button>
