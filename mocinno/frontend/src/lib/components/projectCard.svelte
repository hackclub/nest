<script lang="ts">
	import CodeXml from '@lucide/svelte/icons/code-xml';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import type { Project } from '../../routes/(overview)/data.remote';

	let { project }: { project: Project } = $props();

	const MAX_DESCRIPTION_LENGTH = 90;

	let expanded = $state(false);

	let isLongDescription = $derived(project.description.length > MAX_DESCRIPTION_LENGTH);
</script>

{#snippet expandButton({ expanded, onclick }: { expanded: boolean; onclick: () => void })}
	<button
		class="text-HCPurpleText hover:text-HCPurple absolute right-0 bottom-0 transition-colors"
		{onclick}
		aria-label={expanded ? 'Collapse description' : 'Expand description'}
	>
		{#if expanded}
			<ChevronUp size={12} />
		{:else}
			<ChevronDown size={12} />
		{/if}
	</button>
{/snippet}

<article
	class="flex w-full flex-col rounded-lg border-2 border-violet-950 sm:w-full md:w-full lg:w-full xl:w-full 2xl:w-full"
>
	<img
		src={project.image}
		width={400}
		height={200}
		alt={`Project "${project.name}"`}
		class="h-48 w-full rounded-t-md object-cover sm:h-56 md:h-64"
	/>
	<div class="flex flex-col gap-y-2 p-3 sm:p-4">
		<div class="relative pb-6">
			<div class="relative overflow-hidden">
				<div class="flex items-start justify-between">
					<h2 class="text-sm font-medium sm:text-base lg:text-lg 2xl:text-xl">
						{project.name}
					</h2>
					<a href={project.repo} rel="external" aria-label={`View ${project.name} repository`}>
						<CodeXml size={16} class="text-primary" />
					</a>
				</div>
				<p
					class="text-xs sm:text-sm 2xl:text-base"
					style={expanded || !isLongDescription
						? undefined
						: 'display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;'}
				>
					{project.description}
				</p>
			</div>
			{#if isLongDescription}
				{@render expandButton({ expanded, onclick: () => (expanded = !expanded) })}
			{/if}
		</div>
		<div class="mt-1 flex items-center gap-x-2 sm:mt-2">
			<img
				src={project.authorPfp}
				width={20}
				height={20}
				alt={project.authorName}
				class="h-5 w-5 rounded-full"
			/>
			<p class="text-sm sm:text-base">{project.authorName}</p>
		</div>
	</div>
</article>
