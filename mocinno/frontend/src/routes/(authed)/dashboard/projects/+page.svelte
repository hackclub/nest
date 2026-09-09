<script lang="ts">
	import Head from '$lib/components/head.svelte';
	import ProjectsView from './projects-view.svelte';

	let { data } = $props();
</script>

<Head title="Projects" />

<div class="flex flex-1 items-center justify-center">
	<ProjectsView {...data} />
</div>
