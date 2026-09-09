<script lang="ts">
	import Nav from '$lib/components/nav.svelte';
	import Footer from '$lib/components/footer.svelte';
	import { type LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<div class="flex min-h-screen flex-col font-dm-mono">
	<Nav user={data.user} />
	<main class="scrollbar-custom flex-1 overflow-hidden">{@render children?.()}</main>
	<Footer user={data.user} />
</div>
