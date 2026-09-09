import { STALWART_API_KEY, STALWART_DOMAIN, STALWART_MAIL_DOMAIN } from "./env";
import { randomBytes } from "crypto";

type JmapCall = [string, Record<string, unknown>, string];

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
export function generatePassword(): string {
	const bytes = randomBytes(20);
	const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]);
	return [0, 5, 10, 15].map((i) => chars.slice(i, i + 5).join('')).join('-');
}


let domainId: string | null = null;
async function getDomainId(): Promise<string> {
  if (domainId) return domainId;

	const [[, res]] = await jmap([
		['x:Domain/query', { filter: { name: STALWART_MAIL_DOMAIN } }, 'c1']
  ]);

	const { ids } = res as { ids: string[] };
	if (!ids?.length) throw new Error(`Mail domain not found: ${STALWART_MAIL_DOMAIN}`);

	domainId = ids[0] ?? null;
	return domainId;
}

async function jmap(methodCalls: JmapCall[]): Promise<JmapCall[]> {
  const res = await fetch(`${STALWART_DOMAIN}/jmap`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STALWART_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      using: ["urn:ietf:params:jmap:core", "urn:stalwart:jmap"],
      methodCalls,
    }),
  });

  if (!res.ok) throw new Error(`Stalwart ${res.status}: ${await res.text()}`);

  const body = await res.json();
  const err = body.methodResponses?.find((r: JmapCall) => r[0] === "error");

  if (err) {
    throw new Error(`Stalwart API error: ${err[1].type} - ${err[1].description}`);
  }

  return body.methodResponses as JmapCall[];
}

export async function getEmailAccount(username: string) {
	const [[, res]] = await jmap([
		['x:Account/query', { filter: { name: username, domainId: await getDomainId() } }, 'c1']
	]);

	const { ids } = res as { ids: string[] };
	if (!ids?.length) return null;

	return { id: ids[0], address: `${username}@${STALWART_MAIL_DOMAIN}` };
}

export async function createEmailAccount(
  username: string,
) {
	const password = generatePassword();

  const [[, res]] = await jmap([
    ["x:Account/set", {
      create: {
        new1: {
          "@type": "User",
          name: username,
          domainId: await getDomainId(),
          roles: { "@type": "User" },
          permissions: { "@type": "Inherit" },
          quotas: {
            maxDiskQuota: 1073741824,
            maxAppPasswords: 10,
          },
          aliases: {},
          credentials: {
						'0': { '@type': 'Password', secret: password, allowedIps: {} }
					},
          memberGroupIds: {},
          encryptionAtRest: { "@type": "Disabled" },
        }
      }
    }, "c1"]
  ]);

  const r = res as { created?: Record<string, { id: string }>; notCreated?: Record<string, unknown> };
  if (r.notCreated?.new1) throw new Error(JSON.stringify(r.notCreated.new1));

  return { id: r.created!.new1.id, address: `${username}@${STALWART_MAIL_DOMAIN}` };
}

export async function resetEmailPassword(accountId: string) {
	const password = generatePassword();

	await jmap([
		['x:Account/set', {
			update: {
				[accountId]: {
					credentials: { '0': { '@type': 'Password', secret: password, allowedIps: {} } }
				}
			}
		}, 'c1']
	]);

	return password;
}
