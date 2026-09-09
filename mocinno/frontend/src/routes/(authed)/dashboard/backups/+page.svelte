<script lang="ts">
	import Head from '$lib/components/head.svelte';
	import BackupsView from './backups-view.svelte';

	let { data } = $props();
</script>

<Head title="Backups" />

<div class="flex flex-1 items-center justify-center">
	<BackupsView {...data} />
</div>
