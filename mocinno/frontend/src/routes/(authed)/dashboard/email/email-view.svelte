<script lang="ts">
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import type { RouterOutput } from '$lib/trpc';
	import trpc from '$lib/trpc';
	import { invalidateAll } from '$app/navigation';
	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';

	const flash = getFlash(page);

	type Container = RouterOutput['user']['container'];
	type Email = RouterOutput['user']['email'];

	let { container, email }: { container: Container; email: Email } = $props();

	let creating = $state(false);
	let resetting = $state(false);
	let confirmOpen = $state(false);
	let password = $state<string | null>(null);
	let aupAgreed = $state(false);

	const address = $derived(`${container?.username}@user.hackclub.app`);

	const create = async () => {
		creating = true;
		try {
			const result = await trpc.user.createEmail.mutate();
			if (result.success && result.account) {
				password = result.account.password;
			} else {
				$flash = { message: result.message, type: 'error' };
			}
			await invalidateAll();
		} finally {
			creating = false;
		}
	};

	const reset = async () => {
		confirmOpen = false;
		resetting = true;
		try {
			const result = await trpc.user.resetEmailPassword.mutate();
			if (result.success && result.password) {
				password = result.password;
			} else {
				$flash = { message: result.message, type: 'error' };
			}
		} finally {
			resetting = false;
		}
	};
</script>

<div class="flex flex-1 flex-col gap-4">
	<h2 class="text-2xl font-bold tracking-tight">Email</h2>
	<p class="mt-1 text-muted-foreground">Manage your @user.hackclub.app email. You will need to reset the password after creating an account. Any type of abusive behaviour will lead to a ban</p>
	<Separator class="my-4" />

	{#if password}
		<Alert.Root>
			<CheckCircle2Icon />
			<Alert.Description>
				<p class="mb-2">Save this password now. It won't be shown again.</p>
				<code class="rounded bg-muted px-2 py-1 font-mono text-sm select-all">{password}</code>
			</Alert.Description>
		</Alert.Root>
	{/if}

	{#if !email}
		<Card.Root class="w-full">
			<Card.Content class="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
				<div class="flex-1 space-y-1">
					<p class="font-medium">You can get {address}</p>
					<p class="text-sm text-muted-foreground">
						Create a mailbox to start receiving mail at this address.
					</p>
					<div class="flex items-center gap-2 pt-2">
						<Checkbox id="aup-agreed" bind:checked={aupAgreed} />
						<Label for="aup-agreed" class="text-sm font-normal text-muted-foreground">
							I have read the <a
								href="https://guides.hackclub.app/index.php/Acceptable_Use_Policy"
								class="text-primary hover:underline"
								rel="external"
								target="_blank">Acceptable Use Policy</a
							> and acknowledge that any violation is a permanent suspension
						</Label>
					</div>
				</div>
				<Button onclick={create} disabled={creating || !aupAgreed} class="w-full sm:w-auto">
					{#if creating}<Spinner />{/if} Create
				</Button>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root class="w-full">
			<Card.Content class="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
				<div class="flex-1 space-y-1">
					<p class="font-medium">{email.address}</p>
					<p class="text-sm text-muted-foreground">
						Use your mail via <a href="https://mail.hackclub.app" class="text-primary underline">mail.hackclub.app</a>, or add mx.user.hackclub.app SMTP+IMAP to your email client of choice.
					</p>
				</div>
				<Button
					variant="outline"
					onclick={() => (confirmOpen = true)}
					disabled={resetting}
					class="w-full sm:w-auto"
				>
					{#if resetting}<Spinner />{/if} Reset password
				</Button>
			</Card.Content>
		</Card.Root>

		<Dialog.Root bind:open={confirmOpen}>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Reset your email password?</Dialog.Title>
					<Dialog.Description>
						Every device and app currently signed in to {email.address} will stop working until you
						enter the new password.
					</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer>
					<Button variant="outline" onclick={() => (confirmOpen = false)}>Cancel</Button>
					<Button onclick={reset}>Reset password</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	{/if}
</div>
