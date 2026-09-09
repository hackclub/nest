<script lang="ts">
	interface HeadProps {
		title: string;
		noSuffix?: boolean;
		suffix?: string;
		ogDescription?: string;
		ogTitle?: string;
		ogImage?: string;
		ogUrl?: string;
		articleAuthor?: string;
	}

	let {
		title,
		noSuffix,
		suffix,
		ogDescription,
		ogTitle,
		ogImage,
		ogUrl,
		articleAuthor
	}: HeadProps = $props();

	let titleDerived = $derived(noSuffix ? title : `${title} | ${suffix || 'Nest'}`);
</script>

<svelte:head>
	{#if ogTitle}
		<meta property="og:title" content={ogTitle} />
	{:else}
		<meta property="og:title" content={titleDerived} />
	{/if}
	{#if ogDescription}
		<meta property="og:description" content={ogDescription} />
	{/if}
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
	{/if}
	{#if ogUrl}
		<meta property="og:url" content={ogUrl} />
	{/if}
	{#if articleAuthor}
		<meta property="article:author" content={articleAuthor} />
	{/if}
	<title>{titleDerived}</title>
</svelte:head>
