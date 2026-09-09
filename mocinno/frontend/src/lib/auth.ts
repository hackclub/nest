import { createAuthClient } from 'better-auth/svelte';
import { genericOAuthClient } from 'better-auth/client/plugins';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import type { Auth } from '@mocinno/backend/auth';

const authClient = createAuthClient({
	plugins: [inferAdditionalFields<Auth>(), genericOAuthClient()]
});

export default authClient;
