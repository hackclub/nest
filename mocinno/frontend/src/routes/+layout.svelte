<script lang="ts">
	import './layout.css';
	import '#lib/theme.scss';
	import { ModeWatcher } from 'mode-watcher';
	import { browser } from '$app/env';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { onNavigate } from '$app/navigation';
	import favicon from '#lib/assets/favicon.png';

	let { children } = $props();

	onNavigate((navigation) => {
		if (navigation.shallow && navigation.type === 'goto') return;
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				enabled: browser
			}
		}
	});
</script>

<svelte:head><link rel="icon" type="image/png" href={favicon} /></svelte:head>

<ModeWatcher />
<QueryClientProvider client={queryClient}>
	{@render children?.()}
</QueryClientProvider>
