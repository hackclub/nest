<script lang="ts">
	import CodeXml from '@lucide/svelte/icons/code-xml';
	import FooterPattern from '$lib/assets/footer-pattern.svg?no-inline';
	import { page } from '$app/state';
	import authClient from '$lib/auth';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let { user }: { user: typeof authClient.$Infer.Session.user | null } = $props();
</script>

<footer
	style={`background-image: url(${FooterPattern});`}
	class={['relative mt-auto px-4 py-12 font-dm-mono lg:px-10 lg:py-16']}
>
	<div class="absolute inset-0 opacity-5"></div>
	<div class="relative z-10 mx-auto w-11/12">
		<div class="flex flex-col items-center justify-between gap-y-8 lg:flex-row lg:items-start">
			<div class="flex flex-col items-center lg:items-start">
				<h2 class="mb-4 text-2xl font-medium lg:text-3xl">Ready to get started?</h2>
				<button
					onclick={() => {
						if (user && !page.url.searchParams.get('invite')) {
							goto(resolve('/dashboard'));
						} else {
							authClient.signIn.oauth2({
								providerId: 'hackclub',
								callbackURL: '/dashboard',
								additionalData: {
									invite_code: page.url.searchParams.get('invite')
								}
							});
						}
					}}
					class="flex cursor-pointer items-center gap-x-2 rounded-lg border-2 border-primary bg-primary px-4 py-2 text-base font-medium text-primary-foreground transition-all duration-300 hover:scale-105 active:scale-95 2xl:text-xl"
				>
					<CodeXml class="text-xl" />
					<span>Join Nest!</span>
				</button>
			</div>
			<div class="flex flex-col items-center gap-y-4 lg:items-end">
				<p class="max-w-md text-center text-base lg:text-right lg:text-lg">
					Nest is a project by
					<a href="https://hackclub.com" class="text-destructive hover:underline">Hack Club</a>
					. All code and configuration is open-source.
				</p>
				<div class="flex gap-x-6">
					<a
						href="https://github.com/hackclub/nest"
						class="text-lg font-medium text-primary/80 transition-colors hover:text-foreground"
						>GitHub</a
					>
					<span class="text-gray-500">|</span>
					<a
						href="https://hcb.hackclub.com/nest"
						class="text-lg font-medium text-primary/80 transition-colors hover:text-foreground"
						>Finances</a
					>
				</div>
			</div>
		</div>
	</div>
</footer>
