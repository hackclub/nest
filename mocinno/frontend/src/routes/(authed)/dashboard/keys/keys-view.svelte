<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import type { RouterOutput } from '$lib/trpc';
	import trpc from '$lib/trpc';
	import { invalidateAll } from '$app/navigation';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import { formSchema, type FormSchema } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';

	const flash = getFlash(page);

	type Container = RouterOutput['user']['container'];

	let {
		container,
		form: initialForm
	}: { container: Container; form: SuperValidated<Infer<FormSchema>> } = $props();

	const removeKey = async (key: string) => {
		const result = await trpc.user.removeKey.mutate({ key });
		await invalidateAll();
		$flash = {
			message: result.message,
			type: result.success ? 'success' : 'error'
		};
	};

	const form = $derived.by(() =>
		superForm(initialForm, {
			validators: zod4Client(formSchema)
		})
	);

	// svelte-ignore state_referenced_locally
	const { form: formData, enhance, message, errors, submitting } = form;
</script>

<div class="flex flex-1 flex-col gap-4">
	<h2 class="text-2xl font-bold tracking-tight">SSH Keys</h2>
	<p class="mt-1 text-muted-foreground">
		Manage the SSH public keys that can access your container.
	</p>
	<Separator class="my-4" />
	<Table.Root class="overflow-hidden rounded-lg border border-border bg-muted/25 shadow-sm">
		<Table.Header>
			<Table.Row>
				<Table.Head>Key</Table.Head>
				<Table.Head class="text-end">Actions</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each container?.ssh_keys as key (key)}
				<Table.Row>
					<Table.Cell class="break-all whitespace-normal">{key}</Table.Cell>
					<Table.Cell class="text-end">
						<Button variant="outline" size="sm" onclick={() => removeKey(key)}>Remove</Button>
					</Table.Cell>
				</Table.Row>
			{:else}
				<Table.Row>
					<Table.Cell colspan={2} class="text-center text-muted-foreground">
						No ssh keys found.
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>

	<Card.Root class="container my-4 w-full flex-1 flex-col">
		<form use:enhance method="POST">
			<Card.Content>
				{#if $errors._errors || $message}
					<Alert.Root variant={$errors._errors ? 'destructive' : 'default'} class="mb-4">
						{#if $errors._errors}<AlertCircleIcon />
						{:else}
							<CheckCircle2Icon />
						{/if}
						<Alert.Description>
							<ul class="list-inside list-disc text-sm">
								{#each $errors._errors as error (error)}
									<li>{error}</li>
								{/each}
								{#if $message}
									<li>{$message}</li>
								{/if}
							</ul>
						</Alert.Description>
					</Alert.Root>
				{/if}
				<div class="flex items-start gap-x-4">
					<div class="mb-2 grid flex-1 gap-3 space-y-1">
						<Form.Field {form} name="key">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Public key</Form.Label>
									<Textarea
										{...props}
										class="h-28 break-all"
										placeholder="ssh-ed25519 AAAA... or ssh-ecdsa AAAA..."
										bind:value={$formData.key}
									/>
								{/snippet}
							</Form.Control>
							<Form.FormDescription
								>Paste your public key here (ssh-ed25519 or ssh-ecdsa).</Form.FormDescription
							>
							<Form.FieldErrors />
						</Form.Field>
					</div>
				</div></Card.Content
			>
			<Card.Footer class="flex w-full items-center gap-2">
				<Form.Button class="w-full sm:ms-auto sm:w-auto" disabled={$submitting}
					>{#if $submitting}<Spinner />
					{/if} Add SSH Key</Form.Button
				>
			</Card.Footer>
		</form>
	</Card.Root>
</div>
