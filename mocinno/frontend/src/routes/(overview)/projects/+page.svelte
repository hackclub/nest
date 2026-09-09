<script lang="ts">
	import Head from '$lib/components/head.svelte';
	import ProjectCard from '$lib/components/projectCard.svelte';
	import { getProjects, type Project } from '../data.remote';

	let projects = $state<Project[]>(await getProjects());

	const categories = ['All', 'Websites', 'Bots', 'Game_Servers', 'Backends', 'Other'];

	let selectedCategory = $state<string>('All');

	const filteredProjects = $derived.by(() =>
		selectedCategory && selectedCategory !== 'All'
			? projects.filter((p) => p.category === selectedCategory)
			: projects
	);
</script>

<Head title="Projects" />

<div class="container mx-auto flex-1 px-4 py-8">
	<h1 class="mb-8 text-center text-4xl font-medium text-primary">Nest Projects</h1>
	<div class="mb-8 rounded-lg bg-linear-to-b from-[#1a1a2e] to-[#16213e] p-4 shadow-lg">
		<div class="mb-2 font-mono text-green-400">
			<span class="text-blue-400">nest@hackclub:~$</span> ls
		</div>
		<div class="mb-4 flex flex-wrap gap-2">
			<button
				onclick={() => (selectedCategory = 'All')}
				class={`rounded px-3 py-1 text-sm transition-colors ${
					selectedCategory === 'All'
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-foreground hover:bg-accent/40'
				}`}
			>
				categories/
			</button>
			<a
				href="https://airtable.com/appn7WTuXlxFRrQFb/shr60ela2ZHdEDwQf"
				class="rounded bg-muted px-3 py-1 text-sm text-foreground transition-colors hover:bg-accent/40"
			>
				register_project.sh
			</a>
		</div>
		{#if selectedCategory === 'All'}
			<div class="mb-2 font-mono text-green-400">
				<span class="text-blue-400">nest@hackclub:~$</span> cat categories/*.txt
			</div>
		{:else}
			<div class="mb-2 font-mono text-green-400">
				<span class="text-blue-400">nest@hackclub:~$</span> cat categories/{selectedCategory.toLowerCase()}.txt
			</div>
		{/if}
		<div class="flex flex-wrap gap-2">
			{#each categories as category (category)}
				<button
					onclick={() => (selectedCategory = category)}
					class={`rounded px-3 py-1 text-sm transition-colors ${
						selectedCategory === category
							? 'bg-primary text-primary-foreground'
							: 'bg-muted text-foreground hover:bg-accent/40'
					}`}
				>
					{category.toLowerCase()}.txt
				</button>
			{/each}
		</div>
	</div>
	<div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#each filteredProjects as project, i (i)}
			<div>
				<ProjectCard {project} />
			</div>
		{:else}
			<p class="col-span-full text-center text-lg text-muted-foreground">No projects here yet.</p>
		{/each}
	</div>
</div>
