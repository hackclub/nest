<script lang="ts">
	import Head from '$lib/components/head.svelte';
	import DomainsView from './domains-view.svelte';

	let { data } = $props();
</script>

<Head title="Domains" />

<div class="flex flex-1 items-center justify-center">
	<DomainsView {...data} />
</div>
