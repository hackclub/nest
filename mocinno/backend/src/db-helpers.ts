import { eq, like, or, and, asc, desc, lte, count, isNotNull, sql } from 'drizzle-orm';
import { db } from './db/index.ts';
import {
	containersTable,
	domainsTable,
	applicationsTable,
	certificatesTable,
	settingsTable,
	invitesTable,
	user
} from './db/schema.ts';
import { exec } from 'child_process';
import * as env from './env.ts';
import { promisify } from 'util';

// A lot of this file has been lazily converted to typescript, please don't expect quality

const execAsync = promisify(exec);

const ADMIN_EMAILS = (env.ADMIN_EMAILS || '')
	.split(',')
	.map((e) => e.trim().toLowerCase())
	.filter(Boolean);

const RESERVED_IPS = new Set(['10.60.0.1', '10.60.0.2', '10.60.0.3']);

function parseCIDR(cidr: string) {
	const [base, prefixStr] = cidr.split('/');
	const prefix = parseInt(prefixStr!, 10);
	const parts = base!.split('.').map(Number);
	const baseInt = (parts[0]! << 24) | (parts[1]! << 16) | (parts[2]! << 8) | parts[3]!;
	const mask = ~((1 << (32 - prefix)) - 1) >>> 0;
	const network = (baseInt & mask) >>> 0;
	const broadcast = (network | ~mask) >>> 0;
	return { network, broadcast, prefix };
}

function intToIP(n: number) {
	return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join('.');
}

export async function allocateIP(cidr: string, gateway: string) {
	const { network, broadcast, prefix } = parseCIDR(cidr);
	const startHost = network + 2;
	const endHost = broadcast - 1;

	const usedRows = await db
		.select({ ip: containersTable.ip })
		.from(containersTable)
		.where(isNotNull(containersTable.ip));
	const usedIPs = new Set(usedRows.map((r) => r.ip));

	for (let i = startHost; i <= endHost; i++) {
		const candidate = intToIP(i >>> 0);
		if (RESERVED_IPS.has(candidate)) continue;

		if (!usedIPs.has(candidate)) {
			try {
				await execAsync(`ping -c 1 -W 1 ${candidate}`);
			} catch {
				return {
					ip: candidate,
					prefix,
					gateway: gateway || intToIP(network + 1)
				};
			}
		}
	}
	throw new Error('No available IPs in CIDR range');
}

export function isAdmin(email: string) {
	return ADMIN_EMAILS.includes(email?.toLowerCase());
}

export async function findContainerBySub(sub: string) {
	const [user] = await db.select().from(containersTable).where(eq(containersTable.sub, sub));
	return user ?? null;
}

export async function findContainerByUsername(username: string) {
	const [user] = await db
		.select()
		.from(containersTable)
		.where(eq(containersTable.username, username));
	return user ?? null;
}

export async function findContainerByVmid(vmid: number) {
	const [user] = await db.select().from(containersTable).where(eq(containersTable.vmid, vmid));
	return user ?? null;
}

export async function isUsernameTaken(username: string) {
	const [user] = await db
		.select({ id: containersTable.id })
		.from(containersTable)
		.where(eq(containersTable.username, username));
	if (user) return true;
	const [app] = await db
		.select({ id: applicationsTable.id })
		.from(applicationsTable)
		.where(and(eq(applicationsTable.username, username), eq(applicationsTable.status, 'pending')));
	return !!app;
}

export async function createContainer({
	sub,
	user_id,
	username,
	sshKeys,
	vmid,
	ip,
	ipv6,
	node
}: {
	sub: string | null;
	user_id: string | null;
	username: string;
	sshKeys: string[];
	vmid?: number;
	ip: string | null;
	ipv6: string | null;
	node: string | null;
}) {
	const [user] = await db
		.insert(containersTable)
		.values({
			sub,
			user_id,
			username,
			ssh_keys: sshKeys,
			vmid,
			ip: ip || null,
			ipv6: ipv6 || null,
			node
		})
		.returning();
	return user;
}

export async function updateUserSSHKeys(sub: string, keys: string[]) {
	const [user] = await db
		.update(containersTable)
		.set({ ssh_keys: keys })
		.where(eq(containersTable.sub, sub))
		.returning();
	return user ?? null;
}

export async function updateVerificationStatus(userId: string, status: string) {
	const [updated] = await db
		.update(user)
		.set({ verification_status: status })
		.where(eq(user.id, userId))
		.returning();
	return updated ?? null;
}

export async function deleteUser(sub: string) {
	await db.delete(applicationsTable).where(eq(applicationsTable.sub, sub));
	await db.delete(containersTable).where(eq(containersTable.sub, sub));
}

export async function getDomainsForUser(userId: number) {
	return db
		.select()
		.from(domainsTable)
		.where(eq(domainsTable.container_id, userId))
		.orderBy(asc(domainsTable.created_at));
}

export async function addDomain({
	containerId,
	domain,
	proxy
}: {
	containerId: number;
	domain: string;
	proxy: number;
}) {
	const [row] = await db
		.insert(domainsTable)
		.values({ container_id: containerId, domain, proxy })
		.returning();
	return row;
}

export async function removeDomain(containerId: number, domain: string) {
	const [row] = await db
		.delete(domainsTable)
		.where(and(eq(domainsTable.container_id, containerId), eq(domainsTable.domain, domain)))
		.returning();
	return row ?? null;
}

export async function domainExists(domain: string) {
	const [row] = await db
		.select({ id: domainsTable.id })
		.from(domainsTable)
		.where(eq(domainsTable.domain, domain));
	return !!row;
}

export async function domainOwnedBy(domain: string, containerId: number) {
	const [row] = await db
		.select({ id: domainsTable.id })
		.from(domainsTable)
		.where(and(eq(domainsTable.domain, domain), eq(domainsTable.container_id, containerId)));
	return !!row;
}

export async function getAllDomains() {
	return db
		.select({
			domain: domainsTable.domain,
			proxy: domainsTable.proxy,
			ip: containersTable.ip,
			username: containersTable.username
		})
		.from(domainsTable)
		.innerJoin(containersTable, eq(domainsTable.container_id, containersTable.id))
		.orderBy(asc(domainsTable.domain));
}

export async function createApplication({
	user_id,
	sub,
	email,
	username,
	sshKey,
	reason,
	template
}: {
	user_id?: string;
	sub?: string;
	email?: string;
	username: string;
	sshKey: string;
	reason: string;
	template: string;
}) {
	const [app] = await db
		.insert(applicationsTable)
		.values({ user_id, sub, email, username, ssh_key: sshKey, reason, template })
		.returning();
	return app;
}

export async function getPendingApplications() {
	return db
		.select()
		.from(applicationsTable)
		.where(eq(applicationsTable.status, 'pending'))
		.orderBy(asc(applicationsTable.created_at));
}

export async function getAllApplications() {
	return db.select().from(applicationsTable).orderBy(desc(applicationsTable.created_at));
}

export async function getApplicationById(id: number) {
	const app = await db.query.applicationsTable.findFirst({
		where: eq(applicationsTable.id, id),
		with: {
			user: true
		}
	});
	return app ?? null;
}

export async function getApplicationBySub(sub: string) {
	const [app] = await db
		.select()
		.from(applicationsTable)
		.where(eq(applicationsTable.sub, sub))
		.orderBy(desc(applicationsTable.created_at))
		.limit(1);
	return app ?? null;
}

export async function getApplicationByUserId(user_id: string) {
	const [app] = await db
		.select()
		.from(applicationsTable)
		.where(eq(applicationsTable.user_id, user_id))
		.orderBy(desc(applicationsTable.created_at))
		.limit(1);
	return app ?? null;
}

export async function updateApplicationStatus(id: number, status: string, reviewedBy: string) {
	const [app] = await db
		.update(applicationsTable)
		.set({ status, reviewed_by: reviewedBy, reviewed_at: new Date() })
		.where(eq(applicationsTable.id, id))
		.returning();
	return app ?? null;
}

export async function getAllUsers() {
	return db.select().from(containersTable).orderBy(desc(containersTable.created_at));
}

export async function searchUsers({
	query,
	limit = 50,
	offset = 0
}: {
	query?: string;
	limit?: number;
	offset?: number;
}) {
	if (query) {
		const likePattern = `%${query}%`;
		const whereClause = or(
			like(containersTable.username, likePattern),
			like(containersTable.ip, likePattern),
			like(sql`CAST(${containersTable.vmid} AS TEXT)`, likePattern)
		);
		const rows = await db
			.select()
			.from(containersTable)
			.where(whereClause)
			.orderBy(desc(containersTable.created_at))
			.limit(limit)
			.offset(offset);
		const rowCount = await db.select({ total: count() }).from(containersTable).where(whereClause);

		if (!rowCount[0]?.total) {
			return { users: rows, total: 0 };
		}

		return { users: rows, total: Number(rowCount[0].total) };
	}
	const rows = await db
		.select()
		.from(containersTable)
		.orderBy(desc(containersTable.created_at))
		.limit(limit)
		.offset(offset);
	const rowCount = await db.select({ total: count() }).from(containersTable);
	if (!rowCount[0]?.total) {
		return { users: rows, total: 0 };
	}

	return { users: rows, total: Number(rowCount[0].total) };
}

export async function updateUsername(vmid: number, newUsername: string) {
	const [user] = await db
		.update(containersTable)
		.set({ username: newUsername })
		.where(eq(containersTable.vmid, vmid))
		.returning();
	return user ?? null;
}

export async function getDomainByName(domain: string) {
	const [row] = await db
		.select({
			id: domainsTable.id,
			user_id: domainsTable.container_id,
			domain: domainsTable.domain,
			proxy: domainsTable.proxy,
			ip: containersTable.ip,
			created_at: domainsTable.created_at
		})
		.from(domainsTable)
		.innerJoin(containersTable, eq(domainsTable.container_id, containersTable.id))
		.where(eq(domainsTable.domain, domain));

	return row ?? null;
}

export async function getSetting(key: string) {
	const [row] = await db
		.select({ value: settingsTable.value })
		.from(settingsTable)
		.where(eq(settingsTable.key, key));
	return row?.value ?? null;
}

export async function setSetting(key: string, value: string) {
	await db
		.insert(settingsTable)
		.values({ key, value })
		.onConflictDoUpdate({ target: settingsTable.key, set: { value } });
}

export async function saveCertificate({
	domain,
	cert,
	key,
	expiresAt
}: {
	domain: string;
	cert: string;
	key: string;
	expiresAt: string;
}) {
	const [row] = await db
		.insert(certificatesTable)
		.values({ domain, cert, key, expires_at: new Date(expiresAt) })
		.onConflictDoUpdate({
			target: certificatesTable.domain,
			set: {
				cert,
				key,
				expires_at: new Date(expiresAt),
				created_at: new Date()
			}
		})
		.returning();
	return row;
}

export async function getCertificate(domain: string) {
	const [row] = await db
		.select()
		.from(certificatesTable)
		.where(eq(certificatesTable.domain, domain));
	return row ?? null;
}

export async function deleteCertificate(domain: string) {
	await db.delete(certificatesTable).where(eq(certificatesTable.domain, domain));
}

export async function getAllCertificates() {
	return db.select().from(certificatesTable).orderBy(asc(certificatesTable.domain));
}

export async function getExpiringCertificates(withinDays = 30) {
	const cutoff = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000);
	return db
		.select()
		.from(certificatesTable)
		.where(lte(certificatesTable.expires_at, cutoff))
		.orderBy(asc(certificatesTable.expires_at));
}

export async function createInvite({
	code,
	adminEmail,
	maxUses,
	expiresAt
}: {
	code: string;
	adminEmail: string;
	maxUses: number | null;
	expiresAt: Date | null;
}) {
	const [invite] = await db
		.insert(invitesTable)
		.values({
			code,
			admin_email: adminEmail,
			max_uses: maxUses || null,
			expires_at: expiresAt || null
		})
		.returning();
	return invite;
}

export async function getInvite(code: string) {
	const [invite] = await db.select().from(invitesTable).where(eq(invitesTable.code, code));
	return invite ?? null;
}

export async function incrementInvite(code: string) {
	await db
		.update(invitesTable)
		.set({ uses: sql`${invitesTable.uses} + 1` })
		.where(eq(invitesTable.code, code));
}

export async function getAllInvites() {
	return db.select().from(invitesTable).orderBy(desc(invitesTable.created_at));
}

export async function deleteInvite(code: string) {
	await db.delete(invitesTable).where(eq(invitesTable.code, code));
}

export { sql };
