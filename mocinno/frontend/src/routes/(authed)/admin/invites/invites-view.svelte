<script lang="ts">
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import type { RouterOutput } from '$lib/trpc';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import { formSchema, type FormSchema } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import AdminTable from '$lib/components/tables/admin-table.svelte';
	import { columns } from '$lib/components/tables/invites-table.js';
	import type { PaginationState } from '@tanstack/table-core';
	import trpc from '$lib/trpc';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import { DateFormatter, type DateValue, getLocalTimeZone } from '@internationalized/date';
	import Calendar from '$lib/components/ui/calendar/calendar.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from 'tailwind-variants';

	type Invites = RouterOutput['admin']['getInvites'];

	let {
		invites,
		form: initialForm
	}: { invites: Invites; form: SuperValidated<Infer<FormSchema>> } = $props();

	let invitesList = $derived(invites);
	let page = $state(0);
	let searchQuery = $state('');

	$effect(() => {
		trpc.admin.getInvites
			.query({
				query: searchQuery,
				page: page + 1
			})
			.then((invites) => {
				invitesList = invites;
			});
	});

	const onPageChange = (pagination: PaginationState) => {
		page = pagination.pageIndex;
		trpc.admin.getInvites
			.query({
				query: searchQuery,
				page: pagination.pageIndex + 1,
				limit: pagination.pageSize
			})
			.then((invites) => {
				invitesList = invites;
			});
	};

	const df = new DateFormatter('en-US', {
		dateStyle: 'long'
	});

	const form = $derived.by(() =>
		superForm(initialForm, {
			validators: zod4Client(formSchema)
		})
	);

	// svelte-ignore state_referenced_locally
	const { form: formData, enhance, message, errors, submitting } = form;

	let dateValue = $state<DateValue | undefined>();
	let timeValue = $state<string>();

	const expiresAtChange = () => {
		if (dateValue && timeValue) {
			const [hours, minutes, seconds] = timeValue.split(':').map(Number);
			const date = new Date(
				dateValue.year,
				dateValue.month - 1,
				dateValue.day,
				hours,
				minutes,
				seconds
			);
			$formData.expires = date;
		}
	};

	let contentRef = $state<HTMLElement | null>(null);
</script>

<div class="flex flex-1 flex-col gap-4">
	<h2 class="text-2xl font-bold tracking-tight">Invites</h2>
	<p class="mt-1 text-muted-foreground">
		An invite can bypass ID verification. This is useful for hackathons, large gatherings, etc.
	</p>
	<Separator class="my-4" />
	<AdminTable
		data={invitesList.data}
		{columns}
		{onPageChange}
		bind:searchQuery
		pageCount={invitesList.pageCount}
		rowCount={invitesList.count}
		isManualPagination={true}
	/>

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
					<div class="mb-2 grid gap-3 space-y-1">
						<Form.Field {form} name="uses">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Max Uses</Form.Label>
									<Input
										{...props}
										type="number"
										placeholder="Max Uses (Empty=Infinite)"
										bind:value={$formData.uses}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</div>
					<div class="mb-2 grid flex-1 gap-3 space-y-1">
						<Form.Field {form} name="expires">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Expiry</Form.Label>
									<div class="flex flex-row gap-2">
										<Popover.Root>
											<Popover.Trigger
												{...props}
												class={cn(
													buttonVariants({
														variant: 'outline',
														class: 'w-40 justify-start text-left font-normal'
													}),
													!dateValue && 'text-muted-foreground'
												)}
											>
												<CalendarIcon />
												{dateValue
													? df.format(dateValue.toDate(getLocalTimeZone()))
													: 'Pick a date'}
											</Popover.Trigger>
											<Popover.Content bind:ref={contentRef} class="w-auto p-0">
												<Calendar type="single" bind:value={dateValue} onchange={expiresAtChange} />
											</Popover.Content>
										</Popover.Root>
										<Input
											type="time"
											step="1"
											class="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
											bind:value={timeValue}
											onchange={expiresAtChange}
										/>
									</div>

									<Form.FieldErrors />
									<Input hidden value={$formData.expires} name={props.name} />
								{/snippet}
							</Form.Control>
						</Form.Field>
					</div>
				</div></Card.Content
			>
			<Card.Footer class="flex w-full items-center gap-2">
				<Form.Button class="w-full sm:ms-auto sm:w-auto" disabled={$submitting}
					>{#if $submitting}<Spinner />
					{/if} Create Invite</Form.Button
				>
			</Card.Footer>
		</form>
	</Card.Root>
</div>
