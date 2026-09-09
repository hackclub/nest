<script lang="ts">
	import Head from '$lib/components/head.svelte';
	import NestLogo from '$lib/assets/nest.webp';
	import CodeXml from '@lucide/svelte/icons/code-xml';
	import Book from '@lucide/svelte/icons/book';
	import ButtonLink from '$lib/components/button-link.svelte';
	import { page } from '$app/state';
	import authClient from '$lib/auth';
	import { type SystemInfo, getSystemInfo, getProjects } from './data.remote';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Info from '$lib/components/info.svelte';
	import Showcase from '$lib/components/showcase.svelte';

	interface Node {
		x: number;
		y: number;
		vx: number;
		vy: number;
	}

	let canvas = $state<HTMLCanvasElement | null>(null);
	let isExpanded = $state(false);
	let sysInfo = $state<SystemInfo>(await getSystemInfo());
	let loading = $state(false);

	$effect(() => {
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const rootStyles = getComputedStyle(document.documentElement);

		let animationFrameId: number;
		let nodes: Node[] = [];
		const nodeCount = 100;
		const connectionDistance = 150;

		const resizeCanvas = () => {
			canvas!.width = window.innerWidth;
			canvas!.height = window.innerHeight;
			initNodes();
		};

		const initNodes = () => {
			nodes = Array.from({ length: nodeCount }, () => ({
				x: Math.random() * canvas!.width,
				y: Math.random() * canvas!.height,
				vx: (Math.random() - 0.5) * 0.5,
				vy: (Math.random() - 0.5) * 0.5
			}));
		};

		const drawNode = (x: number, y: number) => {
			ctx.beginPath();
			ctx.arc(x, y, 2, 0, Math.PI * 2);
			ctx.fill();
		};

		const drawConnection = (x1: number, y1: number, x2: number, y2: number, opacity: number) => {
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.strokeStyle = `color-mix(in oklab, ${rootStyles.getPropertyValue('--chart-3').trim()} ${opacity * 100}%, transparent)`;
			ctx.stroke();
		};

		(function animate() {
			ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
			ctx!.fillStyle = rootStyles.getPropertyValue('--primary').trim();
			ctx!.strokeStyle = rootStyles.getPropertyValue('--chart-3').trim();
			ctx!.lineWidth = 0.5;

			nodes.forEach((node, i) => {
				node.x += node.vx;
				node.y += node.vy;

				if (node.x < 0 || node.x > canvas!.width) node.vx *= -1;
				if (node.y < 0 || node.y > canvas!.height) node.vy *= -1;

				drawNode(node.x, node.y);

				for (let j = i + 1; j < nodes.length; j++) {
					const otherNode = nodes[j];
					const dx = otherNode.x - node.x;
					const dy = otherNode.y - node.y;
					const distance = Math.sqrt(dx * dx + dy * dy);

					if (distance < connectionDistance) {
						const opacity = 1 - distance / connectionDistance;
						drawConnection(node.x, node.y, otherNode.x, otherNode.y, opacity);
					}
				}
			});

			animationFrameId = requestAnimationFrame(animate);
		})();

		resizeCanvas();

		window.addEventListener('resize', resizeCanvas);

		return () => {
			cancelAnimationFrame(animationFrameId);
			window.removeEventListener('resize', resizeCanvas);
		};
	});

	let { data } = $props();
</script>

<Head
	title="Nest"
	ogTitle="Nest - a free Linux server from Hack Club"
	ogDescription="Nest is a free Linux server for high-schoolers to host their projects on, from Hack Club."
	ogImage={NestLogo}
	noSuffix={true}
/>

<div class="absolute inset-0 -z-1 flex-1 overflow-hidden">
	<canvas bind:this={canvas}></canvas>
</div>
<div>
	<section
		class="relative grid grid-cols-1 place-items-center px-8 py-16 transition-all duration-200 ease-in-out lg:grid-cols-3 lg:gap-x-16 lg:px-16 lg:py-24 2xl:px-32 2xl:py-32"
	>
		<div
			class="relative z-10 mb-6 flex flex-col items-start justify-start gap-y-5 font-dm-mono 2xl:mb-32"
		>
			<h1 class="text-3xl font-medium 2xl:text-4xl">
				<span class="text-primary">Nest</span>, a free Linux server from
				<a href="https://hackclub.com" class="text-destructive underline"> Hack Club </a>
			</h1>
			<p class="text-lg 2xl:text-xl">
				Host Discord bots, apps, websites, try out basic computer networking, chat with others and
				more!
			</p>
			<div
				class="flex justify-start gap-x-5 lg:max-tabletxx:w-full lg:max-tabletxx:flex-col lg:max-tabletxx:space-y-3"
			>
				<ButtonLink
					onclick={() => {
						if (data.user && !page.url.searchParams.get('invite')) {
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
					class="cursor-pointer bg-primary/90 px-2 text-sm text-primary-foreground hover:bg-primary"
				>
					<CodeXml class="text-xl" />
					<span>Join Nest!</span>
				</ButtonLink>

				<ButtonLink
					href="https://guides.hackclub.app/index.php/Main_Page"
					class="px-2 text-sm hover:bg-primary hover:text-primary-foreground"
				>
					<Book class="text-xl" />
					<span>Read the Docs</span>
				</ButtonLink>
			</div>
		</div>
		<div
			class={[
				'relative z-10 col-span-2 hidden w-full flex-col gap-x-10 rounded-lg py-10 font-dm-mono sm:flex',
				isExpanded ? 'bg-muted/50 px-5' : 'self-start'
			]}
		>
			<div class={['gap-x-5 sm:flex']}>
				<button
					class={[
						'self-start font-medium sm:text-xl md:text-2xl 2xl:text-4xl',
						!isExpanded && 'cursor-pointer'
					]}
					disabled={isExpanded}
					onclick={() => (isExpanded = true)}
					aria-expanded={isExpanded}
				>
					$ <span class="text-primary">ssh</span> hackclub.app
				</button>
				{#if !isExpanded}
					<div class="flex gap-x-3 self-start transition-all duration-300">
						<svg width="126" height="29" viewBox="0 0 126 29" xmlns="http://www.w3.org/2000/svg">
							<path
								d="M0.248928 17.0342C-0.284508 18.0014 0.0671454 19.218 1.03437 19.7514L16.7962 28.4442C17.7634 28.9777 18.9799 28.626 19.5134 27.6588C20.0468 26.6916 19.6951 25.4751 18.7279 24.9416L4.71742 17.2146L12.4444 3.20416C12.9778 2.23694 12.6262 1.02041 11.659 0.486975C10.6917 -0.0464612 9.47521 0.305192 8.94178 1.27241L0.248928 17.0342ZM123.834 13.1143C108.229 18.6279 96.9277 20.3835 87.7797 20.2676C78.6338 20.1517 71.5179 18.168 64.1668 16C56.8214 13.8336 49.2124 11.4722 39.3961 10.8638C29.5658 10.2546 17.6186 11.4035 1.44485 16.0788L2.55563 19.9214C18.3819 15.3466 29.8641 14.2808 39.1487 14.8562C48.4474 15.4325 55.6388 17.6552 63.0353 19.8366C70.4263 22.0164 77.9938 24.144 87.729 24.2673C97.462 24.3906 109.239 22.5132 125.167 16.8858L123.834 13.1143Z"
								class="text-foreground"
								fill="currentColor"
							/>
						</svg>
						<p class="font-medium sm:text-xl md:text-2xl">click me!</p>
					</div>
				{/if}
			</div>
			{#if isExpanded}
				<pre
					class="hidden text-xs whitespace-pre-wrap transition-all duration-300 sm:block xl:text-sm">
{loading
						? 'Loading system info...'
						: `
 __________________    ${sysInfo.hostname}
< Welcome to Nest! >   -----------
 ------------------    OS: ${sysInfo.os}
          \\            Host: ${sysInfo.host}
           \\           Kernel: ${sysInfo.kernel}
            \\  __      Uptime: ${sysInfo.uptime}
              / _)     Packages: ${sysInfo.packages}
     _.----._/ /       Shell: ${sysInfo.shell}
    /         /        Resolution: ${sysInfo.resolution}
 __/ (| | (  |         Terminal: ${sysInfo.terminal}
/__.-'|_|--|_|         CPU: ${sysInfo.cpu}
                       GPU: ${sysInfo.gpu}
                       Memory: ${sysInfo.memory}
`}
          </pre>
			{/if}
		</div>
	</section>
	<Info stats={data.stats} />
	<Showcase stats={data.stats} user={data.user} projects={await getProjects(true)} />
</div>
