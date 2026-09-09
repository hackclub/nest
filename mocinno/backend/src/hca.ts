import * as env from './env';

interface UserProfile {
	iss: string;
	sub: string;
	aud: string;
	exp: number;
	iat: number;
	name: string;
	given_name: string;
	family_name: string;
	email: string;
	email_verified: boolean;
	slack_id: string;
	verification_status: 'verified' | 'pending' | 'ineligible' | 'needs_submission';
}

export async function exchangeCodeForProfile(
	code: string,
	redirectUri: string
): Promise<UserProfile | null> {
	const tokenResponse = await fetch('https://auth.hackclub.com/oauth/token', {
		headers: {
			'User-Agent': 'Nest/1.0 (+https://hackclub.app)',
			'Content-Type': 'application/json'
		},
		method: 'POST',
		body: JSON.stringify({
			client_id: env.OAUTH_CLIENT_ID,
			client_secret: env.OAUTH_CLIENT_SECRET,
			redirect_uri: redirectUri,
			code,
			grant_type: 'authorization_code'
		})
	});

	if (!tokenResponse.ok) return null;
	const { access_token } = (await tokenResponse.json()) as {
		access_token: string;
	};
	if (!access_token) return null;

	const profileResponse = await fetch('https://auth.hackclub.com/oauth/userinfo', {
		headers: {
			'User-Agent': 'Nest/1.0 (+https://hackclub.app)',
			Authorization: `Bearer ${access_token}`
		}
	});

	return profileResponse.ok ? ((await profileResponse.json()) as UserProfile) : null;
}
