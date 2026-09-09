<script lang="ts">
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { mode, setTheme as setThemeState } from 'mode-watcher';
	import { themeInfo, Theme } from './themes';
	import authClient from '$lib/auth';
	import { invalidateAll } from '$app/navigation';

	let { user }: { user: typeof authClient.$Infer.Session.user } = $props();

	const setTheme = async (theme: Theme) => {
		setThemeState(theme);
		await authClient.updateUser({ theme });
		await invalidateAll();
	};
</script>

{#snippet themeSnippet(theme: Theme)}
	{@const info = themeInfo[theme]}
	<button
		class="block rounded-xl border border-border bg-muted p-4 text-left transition-colors outline-none data-active:border-primary data-active:bg-primary/10"
		data-active={theme === user.theme}
		onclick={() => setTheme(theme)}
	>
		<div class="flex flex-col items-start justify-between gap-3">
			<p class="text-sm font-semibold">{info.name}</p>
			<p class="text-xs text-muted-foreground">{info.description}</p>
		</div>
		<div
			class={[
				'mt-3 rounded-lg border bg-background p-2',
				info.class ? info.class?.[mode.current || 'light'] : theme
			]}
			data-theme={theme}
		>
			<div
				class="flex items-center justify-between rounded-md bg-muted/25 px-2 py-1 text-foreground"
			>
				<span class="text-[11px] font-semibold">lp0 on fire</span>
			</div>
			<div class="mt-2 grid grid-cols-3 items-center gap-2">
				<Button size="sm" disabled class="text-[9px] font-semibold" variant="secondary" href="#"
					>Stop Container</Button
				>
				<Button size="sm" disabled class="text-[8px] font-semibold" href="#"
					>Restart Container</Button
				>
				<Button size="sm" disabled variant="destructive" class="text-[8px] font-semibold" href="#"
					>Delete Container</Button
				>
			</div>
		</div>
	</button>
{/snippet}

<div class="flex flex-1 flex-col gap-4">
	<h2 class="text-2xl font-bold tracking-tight">Themes (and maybe settings in the future)</h2>
	<p class="mt-1 text-muted-foreground">Get yourself some badly implemented themes.</p>
	<Separator class="my-4" />
	<div class="grid grid-cols-2 gap-4 md:grid-cols-3">
		{#each Object.values(Theme) as theme (theme)}
			{@render themeSnippet(theme)}
		{/each}
	</div>
</div>
