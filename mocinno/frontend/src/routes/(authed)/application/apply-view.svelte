<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import * as Select from '$lib/components/ui/select/index.js';
	import { type RouterOutput } from '$lib/trpc';
	import { formSchema, type FormSchema } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let {
		form: initialForm,
		templates,
		eligible,
		application
	}: {
		form: SuperValidated<Infer<FormSchema>>;
		templates: RouterOutput['application']['getTemplates'];
		eligible: RouterOutput['application']['checkEligible'];
		application: RouterOutput['application']['getApplication'] | null;
	} = $props();

	const triggerContent = $derived(
		templates.find((f) => f === $formData.template) ?? 'Please select a template'
	);

	const form = $derived.by(() =>
		superForm(initialForm, {
			validators: zod4Client(formSchema)
		})
	);

	const { form: formData, enhance, message, errors } = $derived(form);
</script>

<div class="flex flex-1 flex-col gap-4">
	<h2 class="text-2xl font-bold tracking-tight">Apply for Nest</h2>
	<p class="mt-1 text-muted-foreground">
		Apply for a container on Nest by filling out the details below.<br />
		Confused? Consider
		<a
			href="https://guides.hackclub.app/index.php/Quickstart"
			class="text-primary hover:underline"
			rel="external">checking out the quickstart guide</a
		>
	</p>
	<Separator class="my-4" />
	{#if application && application.status === 'rejected'}
		<Card.Root
			class="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 font-medium text-destructive shadow-sm"
		>
			<Card.Content
				>Your previous application was rejected. You may submit a new one below.</Card.Content
			>
		</Card.Root>
	{/if}
	<Card.Root
		class={[
			(!eligible.eligible || eligible.hackatime_ban) &&
				application?.status === 'rejected' &&
				'bg-destructive/10 shadow-sm',
			'container w-full flex-1 flex-col'
		]}
	>
		{#if eligible.eligible && !eligible.hackatime_ban && ((application && application.status === 'rejected') || !application)}
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
					<div class="grid gap-3">
						<Form.Field {form} name="template">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Select operating system</Form.Label>
									<Select.Root {...props} type="single" bind:value={$formData.template}>
										<Select.Trigger class="w-60">
											{triggerContent}
										</Select.Trigger>
										<Select.Content>
											<Select.Group>
												<Select.Label>Templates</Select.Label>
												{#each templates as template (template)}
													<Select.Item value={template} label={template}>
														{template}
													</Select.Item>
												{/each}
											</Select.Group>
										</Select.Content>
									</Select.Root>
								{/snippet}
							</Form.Control>
							<Form.Description
								>Choose the OS template to initialize on your container.</Form.Description
							>
							<Form.FieldErrors />
						</Form.Field>
					</div>
					<Separator class="my-4" />
					<div class="grid gap-3">
						<Form.Field {form} name="username">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>System Username</Form.Label>
									<Input {...props} bind:value={$formData.username} />
								{/snippet}
							</Form.Control>
							<Form.Description
								>Must be 3-32 characters: letters, numbers, hyphens.</Form.Description
							>
							<Form.FieldErrors />
						</Form.Field>
					</div>
					<div class="grid gap-3">
						<Form.Field {form} name="sshKey">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>SSH Public Key</Form.Label>
									<Textarea {...props} class="break-all" bind:value={$formData.sshKey} />
								{/snippet}
							</Form.Control>
							<Form.Description>You'll login with this instead of a password.</Form.Description>
							<Form.FieldErrors />
						</Form.Field>
					</div>
					<div class="grid gap-3">
						<Form.Field {form} name="reason">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Intended Use</Form.Label>
									<Textarea {...props} class="wrap-break-word" bind:value={$formData.reason} />
								{/snippet}
							</Form.Control>
							<Form.Description>
								Please provide at least 10 characters. It helps us understand what people use Nest
								for!
							</Form.Description>
							<Form.FieldErrors />
						</Form.Field>
					</div>
				</Card.Content>
				<Card.Footer class="flex w-full items-center gap-2">
					<span
						>By clicking "Submit Application", I agree to the <a
							href="https://guides.hackclub.app/index.php/Acceptable_Use_Policy"
							class="text-primary hover:underline"
							rel="external">Acceptable Use Policy</a
						>
						and
						<a href="/privacy.pdf" class="text-primary hover:underline" rel="external"
							>Privacy Policy</a
						></span
					>
					<Form.Button class="w-full sm:ms-auto sm:w-auto">Submit Application</Form.Button>
				</Card.Footer>
			</form>
		{:else if application?.status === 'pending'}
			<Card.Content class="text-center">
				<h3 class="mb-2 text-lg font-semibold">Application Pending Review</h3>
				<p class="mb-4 text-sm text-muted-foreground">
					You have already submitted a request. An admin will review it soon.
				</p>
				<ul class="list-inside list-disc pl-5 text-sm text-muted-foreground">
					<li><strong>Username:</strong> {application.username}</li>
					<li><strong>Submitted:</strong> {application.created_at}</li>
				</ul>
			</Card.Content>
		{:else}
			<Card.Content class="text-center">
				<p class="mb-4 font-medium text-destructive">You are not currently eligible for Nest.</p>

				<p class="text-sm text-muted-foreground">
					{eligible.failReason}
				</p>

				{#if eligible.hackatime_ban}
					<p class="mt-2 text-sm text-muted-foreground">
						If you believe you are not banned then please contact an admin in #nest-help on Slack.
					</p>
				{/if}
			</Card.Content>
		{/if}
	</Card.Root>
</div>
