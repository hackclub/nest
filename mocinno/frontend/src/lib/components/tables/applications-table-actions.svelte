<script lang="ts" module>
	export { reasonSnippet };
</script>

<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { invalidateAll } from '$app/navigation';
	import { type RouterOutput } from '$lib/trpc';
	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';
	import trpc from '$lib/trpc';

	const flash = getFlash(page);

	type Application = RouterOutput['admin']['getApplications']['all'][number];

	let {
		status,
		id,
		reviewer
	}: {
		status: 'pending' | 'approved' | 'rejected';
		id: number;
		reviewer: string | Application['reviewer'];
	} = $props();

	let processWorking = $state(false);

	const processApplication = async (action: 'approve' | 'reject') => {
		processWorking = true;
		const result = await trpc.admin.processApplication.mutate({
			id,
			action
		});
		await invalidateAll();
		$flash = {
			message: result.message,
			type: result.success ? 'success' : 'error'
		};

		processWorking = false;
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
			processApplication('reject');
		}}
		variant="destructive"
		disabled={processWorking}
	>
		{#if processWorking}<Spinner />{/if}
		Reject
	</Button>
{:else if status === 'approved'}
	<span class="max-w-1/16 text-sm wrap-break-word whitespace-normal text-primary"
		>Approved by {typeof reviewer === 'string' ? reviewer : reviewer?.email}</span
	>
{:else if status === 'rejected'}
	<span class="max-w-1/16 text-sm wrap-break-word whitespace-normal text-destructive"
		>Rejected by {typeof reviewer === 'string' ? reviewer : reviewer?.email}</span
	>
{/if}
