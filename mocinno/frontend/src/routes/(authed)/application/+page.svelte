<script lang="ts">
	import Head from '$lib/components/head.svelte';
	import ApplyView from './apply-view.svelte';

	let { data } = $props();
</script>

<Head title="Apply" />

<div class="flex flex-1 items-center justify-center">
	<ApplyView {...data} />
</div>
