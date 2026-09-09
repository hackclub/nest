<script lang="ts">
	import CodeXml from '@lucide/svelte/icons/code-xml';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import type { RouterOutput } from '$lib/trpc';
	import ButtonLink from '$lib/components/button-link.svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import authClient from '$lib/auth';
	import { goto } from '$app/navigation';
	import type { Project } from '../../routes/(overview)/data.remote';
	import ProjectCard from './projectCard.svelte';

	let {
		stats,
		projects,
		user
	}: {
		stats: RouterOutput['getStats'] | null;
		projects: Project[];
		user: typeof authClient.$Infer.Session.user | null;
	} = $props();
</script>

<section
	class="font-dm-monolg:px-16 flex flex-col items-center gap-y-4 px-4 py-8 lg:py-12 2xl:px-32 2xl:py-16"
>
	<h2 class="px-2 text-center text-3xl font-medium sm:text-3xl md:text-4xl 2xl:text-5xl">
		Join the <span class="text-primary">{stats?.stats?.users} other teens</span>
		using Nest
	</h2>
	<p class="p-4 text-center text-lg 2xl:text-xl">
		See what fellow &quot;birds&quot; are hosting on Nest!
	</p>
	{#if projects.length > 0}
		<div
			class="grid w-full grid-cols-1 gap-7 px-5 sm:grid-cols-2 md:grid-cols-3 lg:w-11/12 2xl:w-4/5"
		>
			{#each projects as project (project.name)}
				<ProjectCard {project} />
			{/each}
		</div>
	{:else}
		<div class="flex w-full items-center justify-center text-center">
			No projects here yet, submit your project for a chance to be featured on the showcase!
		</div>
	{/if}
	<div class="mt-8 flex flex-col items-center gap-4 sm:flex-row">
		<ButtonLink
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
			class="cursor-pointer bg-primary text-primary-foreground"
		>
			Start your project <CodeXml class="ml-2" />
		</ButtonLink>
		<ButtonLink
			href="/projects"
			class="text-primary hover:bg-primary hover:text-primary-foreground"
		>
			See all projects <ArrowRight class="ml-2" />
		</ButtonLink>
	</div>
</section>
