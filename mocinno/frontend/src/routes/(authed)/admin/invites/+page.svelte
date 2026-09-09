<script lang="ts">
	import Head from '$lib/components/head.svelte';
	import InvitesView from './invites-view.svelte';

	let { data } = $props();
</script>

<Head title="Invites" />

<div class="flex flex-1 items-center justify-center">
	<InvitesView {...data} />
</div>
