<script lang="ts">
	import Head from '$lib/components/head.svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';

	let { data } = $props();
</script>

<Head title="Admin" />

<div class="flex flex-1 flex-col gap-4">
	<h2 class="text-2xl font-bold tracking-tight">Node stats</h2>
	<p class="mt-1 text-muted-foreground">
		Statistics for each node in the cluster.<br />Place to check if shit's fucked
	</p>
	<Separator class="my-4" />
	{#if data.stats}
		{#each data.stats as node (node.name)}
			<div>
				<h4 class="mb-4 text-xl font-medium">{node.name}</h4>

				{#if node.stats}
					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div class="rounded-md border border-border p-4">
							<h4 class="text-sm font-medium text-muted-foreground">Total containers</h4>
							<p class="text-xl font-bold">{node.stats.container_count}</p>
						</div>
						<div class="rounded-md border border-border p-4">
							<h4 class="text-sm font-medium text-muted-foreground">CPU Usage</h4>
							<p class="text-xl font-bold">{node.stats.cpu_percent}%</p>
						</div>
						<div class="rounded-md border border-border p-4">
							<h4 class="text-sm font-medium text-muted-foreground">Ram Usage</h4>
							<p class="text-xl font-bold">
								{node.stats.ram_used_gb} GB / {node.stats.ram_total_gb} GB (
								{node.stats.ram_percent}% )
							</p>
						</div>
						<div class="rounded-md border border-border p-4">
							<h4 class="text-sm font-medium text-muted-foreground">Storage Usage</h4>
							<p class="text-xl font-bold">
								{node.stats.rootfs_used_gb} GB / {node.stats.rootfs_total_gb} GB (
								{node.stats.rootfs_percent}% )
							</p>
						</div>
						<div class="rounded-md border border-border p-4">
							<h4 class="text-sm font-medium text-muted-foreground">
								Load Avg. (&gt; {node.stats.core_count} is bad)
							</h4>
							<p class="text-xl font-bold">{node.stats.load_avg}</p>
						</div>
						<div class="rounded-md border border-border p-4">
							<h4 class="text-sm font-medium text-muted-foreground">Uptime</h4>
							<p class="text-xl font-bold">{node.stats.uptime}</p>
						</div>
					</div>
				{:else}
					<p>No stats found for this node.</p>
				{/if}
			</div>
		{/each}
	{:else}
		<p>No nodes found.</p>
	{/if}
</div>
