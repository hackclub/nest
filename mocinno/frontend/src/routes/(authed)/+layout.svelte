<script lang="ts">
	import SiteHeader from '$lib/components/dashboard-header.svelte';
	import * as Sentry from '@sentry/sveltekit';
	import { setUserContext, setContainerContext } from '$lib/user';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import { setTheme, theme } from 'mode-watcher';
	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';

	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	const flash = getFlash(page);

	setUserContext(() => data.session);

	setContainerContext(() => data.container);

	$effect(() => {
		Sentry.setUser({
			id: data.session.user.id,
			email: data.session.user.email
		});
	});

	$effect(() => {
		if (data.session.user.theme && data.session.user.theme !== theme.current) {
			setTheme(data.session.user.theme);
		}
	});
</script>

<div class="[--header-height:calc(--spacing(14))]">
	<SiteHeader admin={data.admin} />
	<div class="mx-auto flex w-full max-w-4xl flex-1 flex-col py-4 md:px-0">
		{#if $flash}
			{#if !Array.isArray($flash)}
				{@const message = $flash.message}
				{@const status = $flash.type}
				<Alert.Root
					class={[
						status === 'success'
							? 'border-primary/40 bg-primary/10'
							: 'border-destructive/40 bg-destructive/10',
						'mb-4 self-start rounded-xl border shadow-sm'
					]}
				>
					<Alert.Description
						class={[
							status === 'error' && 'text-destructive',
							'font-medium',
							'flex flex-row items-center gap-2'
						]}
					>
						{#if status === 'success'}
							<CheckCircle2Icon />
						{:else}
							<AlertCircleIcon />
						{/if}
						{message}
						<!--<ul class="list-inside list-disc text-sm">
							{#each message as single (single)}
								<li>{single}</li>
							{/each}
						</ul>-->
					</Alert.Description>
				</Alert.Root>
			{:else}
				<Alert.Root
					class="mb-4 self-start rounded-xl border border-primary/40 bg-primary/10 shadow-sm"
				>
					<Alert.Description class="flex flex-row items-center gap-2 font-medium">
						<ul class="list-inside list-disc items-center justify-center text-center text-sm">
							{#each $flash as message (message.message)}
								<li>
									{#if message.type === 'success'}
										<CheckCircle2Icon />
									{:else}
										<AlertCircleIcon />
									{/if}
									{message.message}
								</li>
							{/each}
						</ul>
					</Alert.Description>
				</Alert.Root>
			{/if}
		{/if}
		{@render children?.()}
	</div>
</div>
