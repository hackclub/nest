import { eq, sql } from 'drizzle-orm';

import { db, schema } from '@/db';

export type SshFailureReason =
	| 'no_keys'
	| 'key_rejected'
	| 'lookup_error'
	| 'suspended'
	| 'start_failed'
	| 'no_ip'
	| 'config_error';

// yyyy-mm-dd in server time, matching how unified stats bucket days
export const localDay = (d: Date) =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export async function recordSshLogin(containerId: number, at = new Date()) {
	await Promise.all([
		db
			.insert(schema.sshActivityTable)
			.values({ container_id: containerId, day: localDay(at), first_at: at, last_at: at })
			.onConflictDoUpdate({
				target: [schema.sshActivityTable.container_id, schema.sshActivityTable.day],
				set: {
					connections: sql`${schema.sshActivityTable.connections} + 1`,
					last_at: at
				}
			}),
		db
			.update(schema.containersTable)
			.set({ last_ssh_at: at })
			.where(eq(schema.containersTable.id, containerId))
	]);
}

export async function recordSshFailure(reason: SshFailureReason, at = new Date()) {
	await db
		.insert(schema.sshFailuresTable)
		.values({ day: localDay(at), reason })
		.onConflictDoUpdate({
			target: [schema.sshFailuresTable.day, schema.sshFailuresTable.reason],
			set: { count: sql`${schema.sshFailuresTable.count} + 1` }
		});
}
