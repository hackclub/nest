<script lang="ts">
	import Head from '$lib/components/head.svelte';
	import KeysView from './keys-view.svelte';

	let { data } = $props();
</script>

<Head title="SSH Keys" />

<div class="flex flex-1 items-center justify-center">
	<KeysView {...data} />
</div>
