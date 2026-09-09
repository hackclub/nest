import { router } from '@/modules/trpc';
import { authedProcedure } from '@/modules/trpc';

import { db, schema } from '@/db';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import * as dbHelpers from '@/db-helpers';
import {
	getContainerIP,
	getContainerStatus,
	getContainerBackups,
	isContainerSuspended,
	pveFetch,
	waitForTask,
	getBackupAttrs,
	getContainerPending
} from '@/pve-utils';
import { utils as sshutils } from 'ssh2';
import { BASTION_PROXY_PUB_KEY } from '@/env';

import type {
	Backup,
	NodeLXCDelete,
	NodeLXCPost,
	NodeLXCStatusReboot,
	NodeLXCStatusStart,
	NodeLXCStatusStop
} from '@/types/pve';
import { checkDNSVerification, isWhitelisted } from '@/utils';
import { createEmailAccount, getEmailAccount, resetEmailPassword } from '@/stalwart';

const domainString = z.stringFormat('domain', z.regexes.domain);

const userRouter = router({
	pending: authedProcedure.query(async ({ ctx }) => {
		const container = await db.query.containersTable.findFirst({
			where: (container, { eq }) => eq(container.user_id, ctx.user.id)
		});

		if (!container) {
			return null;
		}

		const pending = await getContainerPending(container);

		return pending;
	}),
	container: authedProcedure.query(async ({ ctx }) => {
		const container = await db.query.containersTable.findFirst({
			where: (container, { eq }) => eq(container.user_id, ctx.user.id)
		});

		if (!container) {
			return null;
		}

		const status = await getContainerStatus(container);

		const suspended = await isContainerSuspended(container);

		return { ...container, status, suspended };
	}),
	exitSudo: authedProcedure.mutation(async ({ ctx }) => {
		const result = await db
			.update(schema.session)
			.set({
				sudo: false
			})
			.where(eq(schema.session.id, ctx.session.id))
			.returning();

		return !!result[0];
	}),
	domains: authedProcedure.query(async ({ ctx }) => {
		const container = await db.query.containersTable.findFirst({
			where: (container, { eq }) => eq(container.user_id, ctx.user.id),
			with: {
				domains: true
			}
		});

		if (!container) {
			return null;
		}

		return container.domains;
	}),
	backups: authedProcedure.query(async ({ ctx }) => {
		const container = await db.query.containersTable.findFirst({
			where: (container, { eq }) => eq(container.user_id, ctx.user.id),
			with: {
				domains: true
			}
		});

		if (!container) {
			return null;
		}

		return await getContainerBackups(container);
	}),
	start: authedProcedure.mutation(async ({ ctx }) => {
		const container = await db.query.containersTable.findFirst({
			where: (container, { eq }) => eq(container.user_id, ctx.user.id)
		});

		if (!container) {
			return {
				success: false,
				message: 'No container found'
			};
		}

		if (await isContainerSuspended(container)) {
			return {
				success: false,
				message: 'Your container is suspended. Contact an admin.'
			};
		}

		const result = await pveFetch<{ data: NodeLXCStatusStart }>(
			`/nodes/${container.node}/lxc/${container.vmid}/status/start`,
			'POST'
		);
		await waitForTask(container.node, result.data);

		return {
			success: true,
			message: 'Container started'
		};
	}),
	stop: authedProcedure.mutation(async ({ ctx }) => {
		const container = await db.query.containersTable.findFirst({
			where: (container, { eq }) => eq(container.user_id, ctx.user.id)
		});

		if (!container) {
			return {
				success: false,
				message: 'No container found'
			};
		}

		if (await isContainerSuspended(container)) {
			return {
				success: false,
				message: 'Your container is suspended. Contact an admin.'
			};
		}

		const result = await pveFetch<{ data: NodeLXCStatusStop }>(
			`/nodes/${container.node}/lxc/${container.vmid}/status/stop`,
			'POST'
		);
		await waitForTask(container.node, result.data);

		return {
			success: true,
			message: 'Container stopped'
		};
	}),
	reboot: authedProcedure.mutation(async ({ ctx }) => {
		const container = await db.query.containersTable.findFirst({
			where: (container, { eq }) => eq(container.user_id, ctx.user.id)
		});

		if (!container) {
			return {
				success: false,
				message: 'No container found'
			};
		}

		if (await isContainerSuspended(container)) {
			return {
				success: false,
				message: 'Your container is suspended. Contact an admin.'
			};
		}

		const result = await pveFetch<{ data: NodeLXCStatusReboot }>(
			`/nodes/${container.node}/lxc/${container.vmid}/status/reboot`,
			'POST'
		);
		await waitForTask(container.node, result.data);

		return {
			success: true,
			message: 'Container rebooted'
		};
	}),
	delete: authedProcedure.mutation(async ({ ctx }) => {
		const container = await db.query.containersTable.findFirst({
			where: (container, { eq }) => eq(container.user_id, ctx.user.id)
		});

		if (!container) {
			return {
				success: false,
				message: 'No container found'
			};
		}

		if (await isContainerSuspended(container)) {
			return {
				success: false,
				message: 'Your container is suspended. Contact an admin.'
			};
		}

		if (!ctx.session.sudo) {
			return {
				success: false,
				message: 'Sudo mode required'
			};
		}

		const status = await getContainerStatus(container);

		if (status?.status === 'running') {
			const stopResult = await pveFetch<{ data: NodeLXCStatusStop }>(
				`/nodes/${container.node}/lxc/${container.vmid}/status/stop`,
				'POST'
			);
			await waitForTask(container.node, stopResult.data);
		}

		const backups = await pveFetch<{ data: Backup[] }>(
			`/nodes/${container.node}/storage/pbs/content?vmid=${container.vmid}`,
			'GET'
		);

		await Promise.all(
			backups.data
				.filter((b) => b.content === 'backup')
				.map((b) =>
					pveFetch(
						`/nodes/${container.node}/storage/pbs/content/${encodeURIComponent(b.volid)}`,
						'DELETE'
					)
				)
		);

		const deleteResult = await pveFetch<{ data: NodeLXCDelete }>(
			`/nodes/${container.node}/lxc/${container.vmid}`,
			'DELETE'
		);

		await waitForTask(container.node, deleteResult.data);

		if (container.sub) {
			await dbHelpers.deleteUser(container.sub);
		} else {
			await db
				.delete(schema.containersTable)
				.where(eq(schema.containersTable.user_id, container.user_id!));
			await db
				.delete(schema.applicationsTable)
				.where(eq(schema.applicationsTable.user_id, ctx.user.id));
		}

		await db
			.update(schema.session)
			.set({
				sudo: false
			})
			.where(eq(schema.session.id, ctx.session.id));

		return {
			success: true,
			message: 'Container deleted'
		};
	}),
	addDomain: authedProcedure
		.input(
			z.object({
				domain: domainString.trim().toLowerCase(),
				proxy: z.uint32().max(65535).optional().default(80)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const container = await db.query.containersTable.findFirst({
				where: (container, { eq }) => eq(container.user_id, ctx.user.id)
			});

			if (!container) {
				return {
					success: false,
					message: 'No container found'
				};
			}

			if (await isContainerSuspended(container)) {
				return {
					success: false,
					message: 'Your container is suspended. Contact an admin.'
				};
			}

			if (await dbHelpers.domainExists(input.domain)) {
				return {
					success: false,
					message: 'Domain already exists'
				};
			}

			const ip = await getContainerIP(container, container.ip);

			if (!ip) {
				return {
					success: false,
					message: 'Could not get container IP'
				};
			}

			const whitelisted = isWhitelisted(input.domain, container.username);

			if (!whitelisted) {
				const userDomains = await dbHelpers.getDomainsForUser(container.id);
				const isSubOfOwned = userDomains.some((d) => input.domain.endsWith('.' + d.domain));

				if (!isSubOfOwned) {
					const verified = await checkDNSVerification(input.domain, container.username);
					if (!verified) {
						return {
							success: false,
							message: `Domain not verified. Either add a TXT record "${input.domain}" → "domain-verification=${container.username}" or set a CNAME to "${container.username}.hackclub.app". Then try again.`
						};
					}
				}
			}

			const row = await dbHelpers.addDomain({
				containerId: container.id,
				domain: input.domain,
				proxy: input.proxy
			});

			return { success: true, message: `${input.domain} added`, domain: row };
		}),
	removeDomain: authedProcedure
		.input(z.object({ domain: domainString.trim().toLowerCase() }))
		.mutation(async ({ ctx, input }) => {
			const container = await db.query.containersTable.findFirst({
				where: (container, { eq }) => eq(container.user_id, ctx.user.id),
				with: {
					domains: true
				}
			});

			if (!container) {
				return {
					success: false,
					message: 'No container found'
				};
			}

			if (await isContainerSuspended(container)) {
				return {
					success: false,
					message: 'Your container is suspended. Contact an admin.'
				};
			}

			if (!container.domains.some((d) => d.domain === input.domain)) {
				return {
					success: false,
					message: 'Domain not found'
				};
			}

			await dbHelpers.removeDomain(container.id, input.domain);

			return { success: true, message: `${input.domain} removed` };
		}),
	addKey: authedProcedure
		.input(z.object({ key: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const container = await db.query.containersTable.findFirst({
				where: (container, { eq }) => eq(container.user_id, ctx.user.id)
			});

			if (!container) {
				return {
					success: false,
					message: 'No container found'
				};
			}

			if (await isContainerSuspended(container)) {
				return {
					success: false,
					message: 'Your container is suspended. Contact an admin.'
				};
			}

			if (input.key && input.key.includes('PRIVATE KEY')) {
				return {
					success: false,
					message: 'Please use your public key, not your private key'
				};
			}

			try {
				const parsed = sshutils.parseKey(input.key);

				if (parsed instanceof Error) {
					return {
						success: false,
						message: 'Invalid SSH public key format.'
					};
				}
			} catch (e) {
				if (e instanceof Error) {
					console.error('SSH key parsing error:', e.message);
				} else {
					console.error('Unexpected error during SSH key parsing:', e);
				}

				return {
					success: false,
					message: 'Invalid SSH public key format.'
				};
			}

			const currentKeys = container.ssh_keys || [];
			if (currentKeys.includes(input.key)) {
				return {
					success: false,
					message: 'This key is already added'
				};
			}
			if (currentKeys.length >= 10) {
				return {
					success: false,
					message: 'Maximum of 10 SSH keys allowed'
				};
			}

			const keys = [...container.ssh_keys, input.key];

			await db
				.update(schema.containersTable)
				.set({ ssh_keys: keys })
				.where(eq(schema.containersTable.id, container.id));

			if (container.vmid) {
				try {
					await pveFetch(`/nodes/${container.node}/lxc/${container.vmid}/config`, 'PUT', {
						'ssh-public-keys': `${BASTION_PROXY_PUB_KEY}\n${keys.join('\n')}`
					});
				} catch (e) {
					if (e instanceof Error) {
						console.error(
							`Failed to update container SSH keys for ${container.username}:`,
							e.message
						);
					} else {
						console.error(
							`Failed to update container SSH keys for ${container.username}, error unknown:`,
							e
						);
					}
				}
			}

			return { success: true, message: 'Key added', keys };
		}),
	removeKey: authedProcedure
		.input(z.object({ key: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const container = await db.query.containersTable.findFirst({
				where: (container, { eq }) => eq(container.user_id, ctx.user.id)
			});

			if (!container) {
				return {
					success: false,
					message: 'No container found'
				};
			}

			if (await isContainerSuspended(container)) {
				return {
					success: false,
					message: 'Your container is suspended. Contact an admin.'
				};
			}

			const currentKeys = container.ssh_keys || [];

			if (currentKeys.length <= 1) {
				return {
					success: false,
					message: 'You must have at least one SSH key'
				};
			}

			if (!currentKeys.includes(input.key)) {
				return {
					success: false,
					message: 'Key not found'
				};
			}

			const keys = currentKeys.filter((k) => k !== input.key);

			await db
				.update(schema.containersTable)
				.set({ ssh_keys: keys })
				.where(eq(schema.containersTable.id, container.id));

			if (container.vmid) {
				try {
					await pveFetch(`/nodes/${container.node}/lxc/${container.vmid}/config`, 'PUT', {
						'ssh-public-keys': `${BASTION_PROXY_PUB_KEY}\n${keys.join('\n')}`
					});
				} catch (e) {
					if (e instanceof Error) {
						console.error(
							`Failed to update container SSH keys for ${container.username}:`,
							e.message
						);
					} else {
						console.error(
							`Failed to update container SSH keys for ${container.username}, error unknown:`,
							e
						);
					}
				}
			}

			return { success: true, message: 'Key removed', keys };
		}),
	restoreBackup: authedProcedure
		.input(z.object({ volId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const container = await db.query.containersTable.findFirst({
				where: (container, { eq }) => eq(container.user_id, ctx.user.id)
			});

			if (!container || !container.vmid) {
				return {
					success: false,
					message: 'No container found'
				};
			}

			if (await isContainerSuspended(container)) {
				return {
					success: false,
					message: 'Your container is suspended. Contact an admin.'
				};
			}

			const backupAttrs = await getBackupAttrs(container.node, input.volId);

			if (!backupAttrs || backupAttrs.notes !== container.username) {
				return {
					success: false,
					message: 'Backup not found'
				};
			}

			const isRunning = (await getContainerStatus(container))?.status === 'running';

			if (isRunning) {
				const stopResult = await pveFetch<{ data: NodeLXCStatusStop }>(
					`/nodes/${container.node}/lxc/${container.vmid}/status/stop`,
					'POST'
				);
				await waitForTask(container.node, stopResult.data);
			}

			try {
				const restoreResult = await pveFetch<{ data: NodeLXCPost }>(
					`/nodes/${container.node}/lxc`,
					'POST',
					{
						ostemplate: input.volId,
						vmid: container.vmid,
						force: 1,
						restore: 1,
						storage: 'local-zfs'
					}
				);

				await waitForTask(container.node, restoreResult.data, 900000);
			} catch (e) {
				if (e instanceof Error) {
					console.error(
						`Failed to restore backup ${input.volId} for ${container.username}:`,
						e.message
					);
				} else {
					console.error(
						`Failed to restore backup ${input.volId} for ${container.username}, error unknown:`,
						e
					);
				}
				return {
					success: false,
					message: 'Failed to restore backup'
				};
			}

			return {
				success: true,
				message: 'Backup restored.'
			};
		}),

	email: authedProcedure.query(async ({ ctx }) => {
		const container = await db.query.containersTable.findFirst({
			where: (container, { eq }) => eq(container.user_id, ctx.user.id)
		});

		if (!container) {
			return null;
		}

		return await getEmailAccount(container.username);
	}),

  createEmail: authedProcedure.mutation(async ({ ctx }) => {
    const container = await db.query.containersTable.findFirst({
      where: (container, { eq }) => eq(container.user_id, ctx.user.id)
    });

    if (!container) {
      return {
        success: false,
        message: 'No container found'
      };
    }

    if (await isContainerSuspended(container)) {
      return {
        success: false,
        message: 'Your container is suspended. Contact an admin.'
      };
    }

    if (await getEmailAccount(container.username)) {
      return { success: false, message: 'You already have a mailbox' };
    }

    try {
			const account = await createEmailAccount(container.username);
			return { success: true, message: `${account.address} created`, account };
		} catch (e) {
			console.error(`Failed to create mailbox for ${container.username}:`, e);
			return { success: false, message: 'Failed to create mailbox' };
		}
  }),

  resetEmailPassword: authedProcedure.mutation(async ({ ctx }) => {
		const container = await db.query.containersTable.findFirst({
			where: (container, { eq }) => eq(container.user_id, ctx.user.id)
		});

		if (!container) return { success: false, message: 'No container found' };
		if (await isContainerSuspended(container)) {
			return { success: false, message: 'Your container is suspended. Contact an admin.' };
		}

		const account = await getEmailAccount(container.username);
		if (!account) return { success: false, message: 'No mailbox found' };

		try {
			const password = await resetEmailPassword(account.id);
			return { success: true, message: 'Password reset', password };
		} catch (e) {
			console.error(`Failed to reset password for ${container.username}:`, e);
			return { success: false, message: 'Failed to reset password' };
		}
	}),
});

export default userRouter;
