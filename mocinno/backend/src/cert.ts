import acme from 'acme-client';
import * as db from './db-helpers';
import * as env from './env';

const ZEROSSL_DIRECTORY = 'https://acme.zerossl.com/v2/DV90';

const NON_PUBLIC_TLDS = /(\.localhost|\.local|\.internal|\.home\.arpa)$/i;

export function isPublicDomain(domain: string) {
	if (!domain || domain === 'localhost') return false;
	if (NON_PUBLIC_TLDS.test(domain)) return false;
	if (/^(\d{1,3}\.){3}\d{1,3}$/.test(domain)) return false;
	if (/^[0-9a-fA-F:]+$/.test(domain)) return false;
	return true;
}

const challenges = new Map<string, string>();

let _client: acme.Client | null = null;

async function getClient() {
	if (_client) return _client;

	let accountKeyPem = await db.getSetting('acme_account_key');
	if (!accountKeyPem) {
		const key = await acme.crypto.createPrivateKey();
		accountKeyPem = key.toString();
		await db.setSetting('acme_account_key', accountKeyPem);
	}

	_client = new acme.Client({
		directoryUrl: ZEROSSL_DIRECTORY,
		accountKey: accountKeyPem,
		externalAccountBinding: {
			kid: env.ZEROSSL_EAB_KID,
			hmacKey: env.ZEROSSL_EAB_HMAC_KEY
		}
	});

	return _client;
}

export function getChallengeResponse(token: string | undefined) {
	return token ? challenges.get(token) : null;
}

export async function issueCertificate(domain: string) {
	if (!isPublicDomain(domain)) return null;
	const client = await getClient();
	const [key, csr] = await acme.crypto.createCsr({ commonName: domain });

	const certPem = await client.auto({
		csr,
		email: process.env.ACME_EMAIL,
		termsOfServiceAgreed: true,
		challengePriority: ['http-01'],
		challengeCreateFn: async (_authz, challenge, keyAuthorization) => {
			challenges.set(challenge.token, keyAuthorization);
		},
		challengeRemoveFn: async (_authz, challenge) => {
			challenges.delete(challenge.token);
		}
	});

	const expiresAt = new Date(Date.now() + 89 * 24 * 60 * 60 * 1000).toISOString();
	await db.saveCertificate({
		domain,
		cert: certPem.toString(),
		key: key.toString(),
		expiresAt
	});

	return { cert: certPem.toString(), key: key.toString() };
}

export async function getOrIssueCertificate(domain: string) {
	if (!isPublicDomain(domain)) return null;
	const existing = await db.getCertificate(domain);
	if (existing) {
		const daysLeft = (new Date(existing.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
		if (daysLeft > 30) return existing;
	}
	return await issueCertificate(domain);
}

export async function renewExpiringCertificates() {
	const expiring = await db.getExpiringCertificates(30);
	for (const cert of expiring) {
		try {
			await issueCertificate(cert.domain);
			console.log(`Renewed certificate for ${cert.domain}`);
		} catch (err) {
			if (err instanceof Error) {
				console.error(`Failed to renew certificate for ${cert.domain}:`, err.message);
			} else {
				console.error(`Failed to renew certificate for ${cert.domain}:`, err);
			}
		}
	}
}
