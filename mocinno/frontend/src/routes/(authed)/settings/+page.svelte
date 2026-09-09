<script lang="ts">
	import type { PageProps } from './$types';
	import Head from '$lib/components/head.svelte';
	import ThemeView from './theme-view.svelte';

	let { data }: PageProps = $props();
</script>

<Head title="Themes" />

<div class="flex flex-1 items-center justify-center">
	<ThemeView {...data} />
</div>
