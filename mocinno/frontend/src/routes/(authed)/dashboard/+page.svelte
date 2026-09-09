<script lang="ts">
	import type { PageProps } from './$types';
	import Head from '$lib/components/head.svelte';
	import ContainerView from './container-view.svelte';

	let { data }: PageProps = $props();
</script>

<Head title="Dashboard" />

<div class="flex flex-1 items-center justify-center">
	<ContainerView container={data.container} />
</div>
