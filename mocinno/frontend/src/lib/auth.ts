import { createAuthClient } from 'better-auth/svelte';
import { oauthProviderClient } from '@better-auth/oauth-provider/client';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import type { Auth } from '@mocinno/backend/auth';

const authClient = createAuthClient({
	plugins: [oauthProviderClient(), inferAdditionalFields<Auth>()]
});

export default authClient;
