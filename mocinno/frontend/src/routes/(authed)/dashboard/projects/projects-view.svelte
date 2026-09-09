<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import ConfirmDialog from '$lib/components/confirm-dialog.svelte';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import { formSchema, type FormSchema, type Project } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let {
		projects,
		form: initialForm
	}: { projects: Project[]; form: SuperValidated<Infer<FormSchema>> } = $props();

	// TODO(backend): this list is local only for the frontend pass. Once the tRPC
	// procedures land, drop it and read straight from `projects` + `invalidateAll()`.
	// svelte-ignore state_referenced_locally
	let projectList = $state<Project[]>([...projects]);

	let addMessage = $state<string | null>(null);

	const form = $derived.by(() =>
		superForm(initialForm, {
			SPA: true,
			validators: zod4Client(formSchema),
			onUpdate: ({ form: validated }) => {
				if (!validated.valid) return;

				// TODO(backend): await trpc.user.addProject.mutate(validated.data)
				projectList.push({ id: crypto.randomUUID(), ...validated.data });
				addMessage = `Added "${validated.data.name}".`;
				formData.set({ name: '', demo: '', repo: '' });
			}
		})
	);

	// svelte-ignore state_referenced_locally
	const { form: formData, enhance, errors, submitting } = form;

	let editing = $state<Project | null>(null);
	let editOpen = $state(false);
	let editValues = $state({ name: '', demo: '', repo: '' });
	let editErrors = $state<Record<string, string[]>>({});

	const openEdit = (project: Project) => {
		editing = project;
		editValues = { name: project.name, demo: project.demo, repo: project.repo };
		editErrors = {};
		editOpen = true;
	};

	const saveEdit = (event: SubmitEvent) => {
		event.preventDefault();
		if (!editing) return;

		const parsed = formSchema.safeParse(editValues);
		if (!parsed.success) {
			const fieldErrors: Record<string, string[]> = {};
			for (const issue of parsed.error.issues) {
				const key = String(issue.path[0]);
				(fieldErrors[key] ??= []).push(issue.message);
			}
			editErrors = fieldErrors;
			return;
		}

		// TODO(backend): await trpc.user.updateProject.mutate({ id: editing.id, ...parsed.data })
		const id = editing.id;
		projectList = projectList.map((p) => (p.id === id ? { id, ...parsed.data } : p));
		addMessage = `Updated "${parsed.data.name}".`;
		editOpen = false;
		editing = null;
	};

	let deleting = $state<Project | null>(null);
	let deleteOpen = $state(false);

	const openDelete = (project: Project) => {
		deleting = project;
		deleteOpen = true;
	};

	const confirmDelete = () => {
		if (!deleting) return;

		// TODO(backend): await trpc.user.removeProject.mutate({ id: deleting.id })
		const id = deleting.id;
		addMessage = `Removed "${deleting.name}".`;
		projectList = projectList.filter((p) => p.id !== id);
		deleteOpen = false;
		deleting = null;
	};
</script>

<div class="flex flex-1 flex-col gap-4">
	<h2 class="text-2xl font-bold tracking-tight">Projects</h2>
	<p class="mt-1 text-muted-foreground">
		List the projects you are running in your container, so others can see what Nest is being used
		for.
	</p>

	<Alert.Root class="border-primary/40 bg-primary/10">
		<TriangleAlertIcon />
		<Alert.Title>Use the exact same details as your YSWS submission</Alert.Title>
		<Alert.Description>
			The project name, demo URL and repository URL you enter here must be identical to the name,
			demo URL and repository URL you use when you ship this project for a YSWS. If they don't
			match, we can't tie the two together and your project may not be counted.
		</Alert.Description>
	</Alert.Root>

	<Separator class="my-4" />
	<Table.Root class="overflow-hidden rounded-lg border border-border bg-muted/25 shadow-sm">
		<Table.Header>
			<Table.Row>
				<Table.Head>Name</Table.Head>
				<Table.Head>Demo</Table.Head>
				<Table.Head>Repository</Table.Head>
				<Table.Head class="text-end">Actions</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each projectList as project (project.id)}
				<Table.Row>
					<Table.Cell class="font-medium">{project.name}</Table.Cell>
					<Table.Cell class="max-w-56 truncate">
						<a
							href={project.demo}
							rel="external noreferrer"
							target="_blank"
							class="hover:underline"
						>
							{project.demo}
						</a>
					</Table.Cell>
					<Table.Cell class="max-w-56 truncate">
						<a
							href={project.repo}
							rel="external noreferrer"
							target="_blank"
							class="hover:underline"
						>
							{project.repo}
						</a>
					</Table.Cell>
					<Table.Cell class="flex justify-end gap-2 text-end">
						<Button variant="outline" size="sm" onclick={() => openEdit(project)}>
							<PencilIcon /> Edit
						</Button>
						<Button variant="outline" size="sm" onclick={() => openDelete(project)}>
							<TrashIcon /> Delete
						</Button>
					</Table.Cell>
				</Table.Row>
			{:else}
				<Table.Row>
					<Table.Cell colspan={4} class="text-center text-muted-foreground">
						No projects found.
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>

	<Card.Root class="container my-4 w-full flex-1 flex-col">
		<form use:enhance method="POST">
			<Card.Content>
				{#if $errors._errors || addMessage}
					<Alert.Root variant={$errors._errors ? 'destructive' : 'default'} class="mb-4">
						{#if $errors._errors}<AlertCircleIcon />
						{:else}
							<CheckCircle2Icon />
						{/if}
						<Alert.Description>
							<ul class="list-inside list-disc text-sm">
								{#each $errors._errors ?? [] as error (error)}
									<li>{error}</li>
								{/each}
								{#if addMessage}
									<li>{addMessage}</li>
								{/if}
							</ul>
						</Alert.Description>
					</Alert.Root>
				{/if}
				<div class="flex flex-col items-start gap-x-4 sm:flex-row">
					<div class="mb-2 grid w-full gap-3 space-y-1 sm:w-56">
						<Form.Field {form} name="name">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Name</Form.Label>
									<Input {...props} placeholder="My Cool Project" bind:value={$formData.name} />
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</div>
					<div class="mb-2 grid w-full flex-1 gap-3 space-y-1">
						<Form.Field {form} name="demo">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Demo URL</Form.Label>
									<Input
										{...props}
										placeholder="https://myproject.hackclub.app"
										bind:value={$formData.demo}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</div>
					<div class="mb-2 grid w-full flex-1 gap-3 space-y-1">
						<Form.Field {form} name="repo">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Repository URL</Form.Label>
									<Input
										{...props}
										placeholder="https://github.com/you/myproject"
										bind:value={$formData.repo}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</div>
				</div></Card.Content
			>
			<Card.Footer class="flex w-full items-center gap-2">
				<span>
					All three fields are required, and must match what you ship for a YSWS exactly.
				</span>
				<Form.Button class="w-full sm:ms-auto sm:w-auto" disabled={$submitting}>
					Add Project
				</Form.Button>
			</Card.Footer>
		</form>
	</Card.Root>
</div>

<Dialog.Root bind:open={editOpen}>
	<Dialog.Content>
		<form onsubmit={saveEdit}>
			<Dialog.Header class="mb-4">
				<Dialog.Title>Edit project</Dialog.Title>
				<Dialog.Description>
					Keep the name, demo URL and repository URL the same as the ones you ship for a YSWS.
				</Dialog.Description>
			</Dialog.Header>
			<div class="grid gap-4">
				<div class="grid gap-2">
					<Label for="edit-name">Name</Label>
					<Input id="edit-name" bind:value={editValues.name} />
					{#each editErrors.name ?? [] as error (error)}
						<p class="text-sm text-destructive">{error}</p>
					{/each}
				</div>
				<div class="grid gap-2">
					<Label for="edit-demo">Demo URL</Label>
					<Input id="edit-demo" bind:value={editValues.demo} />
					{#each editErrors.demo ?? [] as error (error)}
						<p class="text-sm text-destructive">{error}</p>
					{/each}
				</div>
				<div class="grid gap-2">
					<Label for="edit-repo">Repository URL</Label>
					<Input id="edit-repo" bind:value={editValues.repo} />
					{#each editErrors.repo ?? [] as error (error)}
						<p class="text-sm text-destructive">{error}</p>
					{/each}
				</div>
			</div>
			<Dialog.Footer class="mt-4">
				<Button type="button" variant="outline" onclick={() => (editOpen = false)}>Cancel</Button>
				<Button type="submit">Save changes</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<ConfirmDialog
	bind:open={deleteOpen}
	title="Delete project?"
	description={`"${deleting?.name ?? ''}" will be removed from your projects list. You can add it again later.`}
	onConfirm={confirmDelete}
	onCancel={() => (deleting = null)}
/>
