<script lang="ts">
	import Head from '$lib/components/head.svelte';
	import EmailView from './email-view.svelte';

	let { data } = $props();
</script>

<Head title="Email" />

<div class="flex flex-1 items-center justify-center">
	<EmailView {...data} />
</div>
