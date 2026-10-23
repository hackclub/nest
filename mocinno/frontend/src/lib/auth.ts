import { createAuthClient } from 'better-auth/svelte';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import type { Auth } from '@mocinno/backend/auth';

const authClient = createAuthClient({
	plugins: [inferAdditionalFields<Auth>()]
});

export default authClient;
