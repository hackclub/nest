<script module>
	export { externalLink };
</script>

<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import ConfirmDialog from '$lib/components/confirm-dialog.svelte';
	import { invalidateAll } from '$app/navigation';
	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';
	import trpc from '$lib/trpc';

	const flash = getFlash(page);

	let { id, name }: { id: number; name: string } = $props();

	let deleteConfirm = $state(false);
	let deleteWorking = $state(false);

	const deleteProject = async () => {
		deleteWorking = true;
		const result = await trpc.admin.deleteProject.mutate({ id });
		await invalidateAll();
		$flash = {
			message: result.message,
			type: result.success ? 'success' : 'error'
		};
		deleteWorking = false;
	};
</script>

{#snippet externalLink({ href }: { href: string })}
	<a
		{href}
		rel="external noreferrer"
		target="_blank"
		class="block max-w-56 truncate hover:underline"
		title={href}
	>
		{href}
	</a>
{/snippet}

<ConfirmDialog
	bind:open={deleteConfirm}
	title="Delete project?"
	description={`"${name}" will be permanently removed from the owner's project list.`}
	onConfirm={deleteProject}
/>

<Button
	onclick={() => (deleteConfirm = true)}
	variant="destructive"
	size="sm"
	disabled={deleteWorking}
>
	{#if deleteWorking}<Spinner />{/if}
	Delete
</Button>
