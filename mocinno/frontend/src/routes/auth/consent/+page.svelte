<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import authClient from '#lib/auth.js';
</script>

<div class="flex flex-col items-center gap-6 text-center">
	<Button onclick={async () => await authClient.oauth2.consent({ accept: false })}>Deny</Button>
	<Button onclick={async () => await authClient.oauth2.consent({ accept: true })}>Authorize</Button>
</div>
