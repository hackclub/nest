<script lang="ts">
	import './layout.css';
	import '$lib/theme.scss';
	import { ModeWatcher } from 'mode-watcher';
	import { onNavigate } from '$app/navigation';
	import favicon from '$lib/assets/favicon.png';

	let { children } = $props();

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head><link rel="icon" type="image/png" href={favicon} /></svelte:head>

<ModeWatcher />

{@render children?.()}
