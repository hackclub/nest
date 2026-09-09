<script lang="ts">
	import CPU from '@lucide/svelte/icons/cpu';
	import Memory from '@lucide/svelte/icons/memory-stick';
	import Drive from '@lucide/svelte/icons/hard-drive';
	import Network from '@lucide/svelte/icons/network';
	import type { Snippet } from 'svelte';
	import type { RouterOutput } from '$lib/trpc';

	type TabType = 'Specs' | 'Linux' | 'Community';

	const tabContent: Record<TabType, Snippet> = {
		Specs: specsContent,
		Linux: linuxContent,
		Community: communityContent
	};

	const specsItems: Array<{ Icon: typeof CPU; title: string; desc: string }> = [
		{
			Icon: CPU,
			title: 'Processor',
			desc: 'AMD EPYC™ Genoa 9454P (48 cores, 96 threads)'
		},
		{
			Icon: Memory,
			title: 'Memory',
			desc: '256 GB DDR5 ECC RAM'
		},
		{
			Icon: Drive,
			title: 'Storage',
			desc: '2x 1.92 TB NVMe SSD'
		},
		{
			Icon: Network,
			title: 'Network',
			desc: '1 Gbps, IPv4 & IPv6'
		}
	];

	let activeTab = $state<TabType>('Specs');

	function switchTab(tab: TabType) {
		if (tab === activeTab) return;

		const doc = document as Document & {
			startViewTransition?: (update: () => void) => void;
		};

		if (!doc.startViewTransition) {
			activeTab = tab;
			return;
		}

		doc.startViewTransition(() => {
			activeTab = tab;
		});
	}

	let { stats }: { stats: RouterOutput['getStats'] | null } = $props();
</script>

{#snippet specsContent()}
	<div class="flex flex-col items-start gap-6">
		<pre
			class="mb-4 w-full scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900 overflow-x-auto text-xs text-primary sm:w-1/3">
      {`
                 _
 _ __   ___  ___| |_
| '_ \\ / _ / __| __|
| | | |  __/\\__ \\ |_
|_| |_|\\___||___/\\__|
`}
    </pre>
		<div class="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
			{#each specsItems as spec (spec.title)}
				<div class="flex items-center">
					<spec.Icon class="mr-3 text-3xl text-primary sm:text-4xl" />
					<div>
						<div class="text-sm font-medium">{spec.title}</div>
						<div class="text-xs text-muted-foreground">{spec.desc}</div>
					</div>
				</div>
			{/each}
		</div>
		<div class="mt-4 text-sm">
			<p>
				Nest runs on two
				<a
					href="https://www.hetzner.com/dedicated-rootserver/ax162-r/"
					class="text-primary hover:underline"
				>
					Hetzner AX162-R
				</a>
				dedicated servers, located in Helsinki, Finland. It uses Proxmox VE 9 and is hosting the LXC containers
				for all users, nest infra stuff is running on another dedi.
			</p>
			<p class="mt-2">
				<a
					href="https://github.com/hackclub/nest/blob/main/SETUP.md"
					class="text-primary hover:underline"
				>
					Read more about Nest&apos;s technical setup on GitHub
				</a>
			</p>
		</div>
	</div>
{/snippet}

{#snippet linuxContent()}
	<p>
		Every computer that you use has an operating system. An operating system manages your
		computer&apos;s resources and makes sure that everything running on your computer, from the
		internal system tools to the web browser you&apos;re using to read this, has time to run.
		<br />
		<br />
		Popular operating systems include Windows, MacOS, and Linux! Linux isn&apos;t used as much as Windows
		and MacOS for personal computers, but it&apos;s still popular among developers and enthusiasts. However,
		Linux is the standard for servers! That&apos;s why we use Linux for Nest. It&apos;s a little different
		from what you might be used to, but you&apos;ll be working with Linux in no time!
		<br />
		<br />
		<a href="https://guides.hackclub.app/index.php/Linux" class="text-primary hover:underline">
			Learn more about Linux on Nest Guides
		</a>
	</p>
{/snippet}

{#snippet communityContent()}
	<p>
		As part of Hack Club, Nest has a community of {stats?.stats?.users} users and others in the
		<a href="https://hackclub.com/slack" class="text-primary hover:underline"> Hack Club Slack </a>
		who are happy to help you with any issues you might encounter. The
		<a href="https://hackclub.slack.com/archives/C097AL5AUH0" class="text-primary hover:underline">
			#nest-help
		</a>
		channel on Slack is the best place to ask any questions related to Nest, and you can also ask in other
		channels like
		<a href="https://hackclub.slack.com/archives/C0EA9S0A0" class="text-primary hover:underline">
			#code
		</a>
		if you have a question related to your project.
		<br />
		<br />
		Nest also has a team of 9 active admins who are able to assist you with any requests you might have.
		For *urgent* issues you can ping the @nestadmins group on Slack.
	</p>
{/snippet}

<section
	class="flex flex-col items-center justify-start gap-y-8 px-4 py-8 font-dm-mono lg:px-16 lg:py-12 2xl:px-32 2xl:py-16"
>
	<h2 class="px-2 text-center text-3xl font-medium sm:text-3xl md:text-4xl 2xl:text-5xl">
		What makes up <span class="text-primary">Nest</span>?
	</h2>
	<p class="mb-8 max-w-4xl text-center text-lg 2xl:text-xl">
		Nest is two
		<a
			href="https://www.hetzner.com/dedicated-rootserver/ax162-r/"
			class="text-primary hover:underline"
		>
			Hetzner AX162-R
		</a>
		dedicated servers, located in Helsinki, Finland. Users each get a
		<span class="italic">LXC container</span> on one of the server.
	</p>
	<div class="w-11/12 overflow-hidden rounded-lg bg-muted/80 shadow-lg 2xl:max-w-7xl">
		<div class="flex flex-wrap border-b border-chart-3/40">
			{#each Object.keys(tabContent) as tab (tab)}
				<button
					class={`grow px-4 py-2 text-sm transition-colors sm:px-6 sm:py-3 sm:text-base ${
						activeTab === tab
							? 'bg-opacity-50 bg-primary text-primary-foreground'
							: 'bg-opacity-30 hover:bg-opacity-40 bg-muted hover:bg-accent/40'
					}`}
					onclick={() => switchTab(tab as TabType)}
				>
					{tab}
				</button>
			{/each}
		</div>
		<div
			class="relative h-100 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900 overflow-hidden p-4 sm:h-125 sm:p-6"
		>
			<div class="shellText mb-4 font-mono text-green-400">
				<span class="text-blue-400">nest@hackclub:~$</span> cat
				{activeTab?.toLowerCase()}.txt
			</div>
			<div class="tabContent">
				{@render tabContent[activeTab]?.()}
			</div>
		</div>
	</div>
</section>

<style>
	.tabContent {
		view-transition-name: tab-content;
	}

	.shellText {
		view-transition-name: shell-text;
	}

	::view-transition-old(tab-content) {
		animation-name: tab-slide-out, tab-fade-out;
		animation-duration: 300ms, 300ms;
		animation-timing-function: ease-in-out, ease-in-out;
		animation-fill-mode: forwards, forwards;
	}

	::view-transition-old(shell-text) {
		animation-name: tab-slide-out, tab-fade-out;
		animation-duration: 300ms, 300ms;
		animation-timing-function: ease-in-out, ease-in-out;
		animation-fill-mode: forwards, forwards;
	}

	::view-transition-new(tab-content) {
		animation-name: tab-fade-in;
		animation-duration: 300ms;
		animation-timing-function: ease-in-out;
		animation-delay: 600ms;
		animation-fill-mode: both;
	}

	::view-transition-new(shell-text) {
		animation-name: shelltext-slide-in, tab-fade-in;
		animation-duration: 300ms, 300ms;
		animation-timing-function: ease-in-out, ease-in-out;
		animation-delay: 300ms, 300ms;
		animation-fill-mode: both, both;
	}

	@keyframes tab-fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes tab-fade-out {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	@keyframes tab-slide-out {
		from {
			transform: translateY(0);
		}
		to {
			transform: translateY(-30px);
		}
	}

	@keyframes shelltext-slide-in {
		from {
			transform: translateY(20px);
		}
		to {
			transform: translateY(0);
		}
	}
</style>
