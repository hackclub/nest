<script lang="ts">
	import NestLogo from '$lib/components/nestlogo.svelte';
	import Menu from '@lucide/svelte/icons/menu';
	import Terminal from '@lucide/svelte/icons/terminal';
	import House from '@lucide/svelte/icons/house';
	import ToolCase from '@lucide/svelte/icons/tool-case';
	import Book from '@lucide/svelte/icons/book';
	import Server from '@lucide/svelte/icons/server';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import authClient from '$lib/auth';
	import type { Component } from 'svelte';
	import { goto } from '$app/navigation';

	interface NavItem {
		href: string;
		icon: Component;
		class: string;
		text: string;
	}

	let isOpen = $state(false);

	const navItems: NavItem[] = [
		{
			href: resolve('/'),
			icon: House,
			class: 'text-2xl md:mr-2',
			text: 'Home'
		},
		{
			href: resolve('/projects'),
			icon: ToolCase,
			class: 'text-2xl md:mr-2',
			text: 'Projects'
		},
		{
			href: 'https://guides.hackclub.app/',
			icon: Book,
			class: 'text-2xl md:mr-2',
			text: 'Wiki'
		},
		{
			href: 'https://status.hackclub.app/',
			icon: Server,
			class: 'text-2xl md:mr-2',
			text: 'Status'
		}
	];

	let { user }: { user: typeof authClient.$Infer.Session.user | null } = $props();
</script>

<nav
	class="sticky top-0 z-50 flex items-center justify-between border-b-2 border-violet-950 bg-[#03001c] px-4 py-4 transition-all duration-150 ease-out md:relative lg:border-transparent lg:bg-transparent lg:px-16 lg:py-8 lg:max-tabletx:px-8"
>
	<div class="right-0 flex items-end gap-x-4 lg:hidden">
		<a href={resolve('/')} class="transition-transform hover:scale-105">
			<NestLogo width={70} height={70} class="text-foreground" />
		</a>
	</div>

	<div class="hidden items-end gap-x-4 font-dm-mono md:gap-x-9 lg:flex">
		<a href={resolve('/')} class="shrink-0 transition-transform hover:scale-105">
			<NestLogo width={85} height={85} class="text-foreground" />
		</a>
		{#each navItems as item (item.href)}
			<a
				href={/* eslint-disable-line */ item.href}
				class="group flex items-center text-xl font-light transition-colors hover:text-primary 2xl:text-2xl"
			>
				<span class="mr-2 transition-transform group-hover:scale-110"
					><item.icon class={item.class} /></span
				>
				<span class="border-b-2 border-transparent group-hover:border-primary">
					{item.text}
				</span>
			</a>
		{/each}
	</div>

	<div class="flex justify-end bg-[#03001c] shadow-lg lg:hidden">
		<button class="z-50" onclick={() => (isOpen = !isOpen)}>
			<Menu class="text-lg" />
		</button>

		<div
			class={`${isOpen ? 'absolute' : 'hidden'} right-0 z-40 mt-10 h-screen w-screen gap-y-10 border-t-2 border-violet-950 p-5 backdrop-blur-3xl backdrop-brightness-50`}
		>
			<button onclick={() => (isOpen = false)}>
				{#each navItems as item (item.href)}
					<a
						href={/* eslint-disable-line */ item.href}
						class="group ml-5 flex items-center py-5 text-xl font-light transition-colors hover:text-primary"
					>
						<span class="mr-2 transition-transform group-hover:scale-110"
							><item.icon class={item.class} /></span
						>
						<span class="border-b-2 border-transparent group-hover:border-primary">
							{item.text}
						</span>
					</a>
				{/each}
			</button>
		</div>
	</div>

	<div
		class="absolute right-8 hidden animate-fadeInDown items-center justify-end gap-x-4 py-4 opacity-0 lg:flex lg:py-8"
	>
		<button
			onclick={() => {
				if (user && !page.url.searchParams.get('invite')) {
					goto(resolve('/dashboard'));
				} else {
					authClient.signIn.oauth2({
						providerId: 'hackclub',
						callbackURL: '/dashboard',
						additionalData: {
							invite_code: page.url.searchParams.get('invite')
						}
					});
				}
			}}
			class="group flex cursor-pointer items-center gap-x-2 rounded-lg border-2 border-primary px-4 py-2 font-dm-mono text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 tabletx:text-base 2xl:text-xl"
		>
			<Terminal /><span>Dashboard</span>
		</button>
	</div>
</nav>
