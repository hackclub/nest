<script lang="ts">
	import { resolve } from '$app/paths';
	import * as NavigationMenu from '$lib/components/ui/navigation-menu/index.js';
	import { navigationMenuTriggerStyle } from '$lib/components/ui/navigation-menu/navigation-menu-trigger.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { getContainerContext } from '$lib/user';
	import { page } from '$app/state';

	let { admin }: { admin: boolean } = $props();

	const container = getContainerContext();
</script>

<header class="sticky top-0 z-50 flex w-full items-center border-b bg-background">
	<div class="flex h-(--header-height) w-full items-center gap-2 px-4">
		<span class="font-bold">{page.url.pathname.startsWith('/admin') ? 'Nest Admin' : 'Nest'}</span>
		<NavigationMenu.Root>
			<NavigationMenu.List>
				{#if container() && !page.url.pathname.startsWith('/admin')}
					<NavigationMenu.Item>
						<NavigationMenu.Link>
							{#snippet child()}
								<a href={resolve('/(authed)/dashboard')} class={navigationMenuTriggerStyle()}
									>Dashboard</a
								>
							{/snippet}
						</NavigationMenu.Link>
					</NavigationMenu.Item>
					<NavigationMenu.Item>
						<NavigationMenu.Link>
							{#snippet child()}
								<a
									href={resolve('/(authed)/dashboard/domains')}
									class={navigationMenuTriggerStyle()}>Domains</a
								>
							{/snippet}
						</NavigationMenu.Link>
					</NavigationMenu.Item>
					<NavigationMenu.Item>
						<NavigationMenu.Link>
							{#snippet child()}
								<a href={resolve('/(authed)/dashboard/keys')} class={navigationMenuTriggerStyle()}
									>Keys</a
								>
							{/snippet}
						</NavigationMenu.Link>
					</NavigationMenu.Item>
					<NavigationMenu.Item>
						<NavigationMenu.Link>
							{#snippet child()}
								<a href={resolve('/(authed)/dashboard/email')} class={navigationMenuTriggerStyle()}
									>Email</a
								>
							{/snippet}
						</NavigationMenu.Link>
					</NavigationMenu.Item>
					<NavigationMenu.Item>
						<NavigationMenu.Link>
							{#snippet child()}
								<a
									href={resolve('/(authed)/dashboard/backups')}
									class={navigationMenuTriggerStyle()}>Backups</a
								>
							{/snippet}
						</NavigationMenu.Link>
					</NavigationMenu.Item>
				{:else if page.url.pathname.startsWith('/admin')}
					<NavigationMenu.Item>
						<NavigationMenu.Link>
							{#snippet child()}
								<a href={resolve('/(authed)/admin')} class={navigationMenuTriggerStyle()}>Stats</a>
							{/snippet}
						</NavigationMenu.Link>
					</NavigationMenu.Item>
					<NavigationMenu.Item>
						<NavigationMenu.Link>
							{#snippet child()}
								<a
									href={resolve('/(authed)/admin/applications')}
									class={navigationMenuTriggerStyle()}>Applications</a
								>
							{/snippet}
						</NavigationMenu.Link>
					</NavigationMenu.Item>
					<NavigationMenu.Item>
						<NavigationMenu.Link>
							{#snippet child()}
								<a href={resolve('/(authed)/admin/invites')} class={navigationMenuTriggerStyle()}
									>Invites</a
								>
							{/snippet}
						</NavigationMenu.Link>
					</NavigationMenu.Item>
					<NavigationMenu.Item>
						<NavigationMenu.Link>
							{#snippet child()}
								<a href={resolve('/(authed)/admin/containers')} class={navigationMenuTriggerStyle()}
									>Containers</a
								>
							{/snippet}
						</NavigationMenu.Link>
					</NavigationMenu.Item>
				{:else}
					<NavigationMenu.Item>
						<NavigationMenu.Link>
							{#snippet child()}
								<a href={resolve('/(authed)/application')} class={navigationMenuTriggerStyle()}
									>Apply</a
								>
							{/snippet}
						</NavigationMenu.Link>
					</NavigationMenu.Item>
				{/if}
			</NavigationMenu.List>
		</NavigationMenu.Root>
		<div class="w-full sm:ms-auto sm:w-auto">
			{#if !page.url.pathname.startsWith('/admin')}
				<Button href={resolve('/(authed)/settings')} class="cursor-pointer">Theme</Button>
				{#if admin}
					<Button href={resolve('/(authed)/admin')}
						><span class="rainbow-text">Admin Panel</span></Button
					>
				{/if}
			{:else}
				<Button href={resolve('/(authed)/dashboard')}>Back to Dashboard</Button>
			{/if}
		</div>
	</div>
</header>

<style>
	@keyframes rainbow {
		0% {
			color: red;
		}
		42% {
			color: lime;
		}
		57% {
			color: blue;
		}
		71% {
			color: indigo;
		}
		85% {
			color: violet;
		}
		100% {
			color: red;
		}
	}

	.rainbow-text {
		animation: rainbow 3s linear infinite;
	}
</style>
