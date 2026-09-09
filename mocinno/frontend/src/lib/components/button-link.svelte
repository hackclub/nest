<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		href: hrefLink,
		onclick,
		class: className,
		children
	}: { href?: string; onclick?: () => void; class?: string; children: Snippet } = $props();
</script>

{#if hrefLink}
	<a
		href={/* eslint-disable-line */ hrefLink}
		{onclick}
		class={[
			'group xl:text-md flex grow items-center gap-x-2 rounded-lg border-2 border-primary px-4 py-2 font-dm-mono text-base font-medium transition-all duration-200 hover:scale-105 active:scale-95',
			className
		]}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		{onclick}
		class={[
			'group xl:text-md flex grow items-center gap-x-2 rounded-lg border-2 border-primary px-4 py-2 text-start font-dm-mono text-base font-medium transition-all duration-200 hover:scale-105 active:scale-95',
			className
		]}
	>
		{@render children?.()}
	</button>
{/if}
