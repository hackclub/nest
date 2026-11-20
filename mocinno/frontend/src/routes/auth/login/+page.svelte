<script lang="ts">
    import authClient from '#lib/auth.js';
    import { browser } from '$app/env';
    import { page } from '$app/state';

    if (browser) {
    authClient.signIn.social({
		provider: 'hackclub',
		callbackURL: page.url.searchParams.has('redirect_uri')
			? `/auth/consent?${page.url.searchParams.toString()}`
			: decodeURIComponent(page.url.searchParams.get('return_to') || '/user'),
		disableRedirect: true
	}).then((result) => {
        if (result.data?.url) {
            window.location.href = result.data.url;
        }
    });
}
</script>