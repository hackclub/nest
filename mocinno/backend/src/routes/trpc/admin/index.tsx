import { router } from '@/modules/trpc';
import { adminProcedure } from '@/modules/trpc';

import { z } from 'zod';
import { db, schema } from '@/db';
import { desc, eq, or, inArray, sql, ilike, count } from 'drizzle-orm';
import { CONFIG, ROOTFS, OS_TEMPLATE, BASTION_PROXY_PUB_KEY, SMTP_FROM, APP_DOMAIN } from '@/env';
import {
	disableStartOnBoot,
	enableStartOnBoot,
	getContainerStatus,
	getNextNode,
	getNextVmid,
	getNodeStats,
	isContainerSuspended,
	pveFetch,
	setContainerDescription,
	waitForTask
} from '@/pve-utils';
import * as dbHelpers from '@/db-helpers';
import type { NodeLXCPost, NodeLXCStatusStop } from '@/types';
import transporter from '@/mail';
import { render } from 'react-email';
import ApprovedEmail from '@email/approved';
import RejectedEmail from '@email/rejected';
const { randomBytes } = await import('node:crypto');

let nodeStats:
	| {
			name: string;
			stats: Awaited<ReturnType<typeof getNodeStats>>;
	  }[]
	| null = null;

async function requestNodeStats() {
	try {
		const nodes = CONFIG.servers.map((s) => s.node);

		const stats = await Promise.all(
			nodes.map(async (node) => {
				const stats = await getNodeStats(node);
				return { name: node, stats };
			})
		);

		nodeStats = stats;
	} catch (err) {
		if (err instanceof Error) {
			console.error('Failed to update admin node stats:', err.message);
			return;
		}
		console.error('Failed to update admin node stats:', err);
	}
}

// Every min
Bun.cron('* * * * *', requestNodeStats);

const adminRouter = router({
	getStats: adminProcedure.query(async () => {
		if (!nodeStats) {
			await requestNodeStats();
		}

		return nodeStats;
	}),
	getContainers: adminProcedure
		.input(
			z.object({
				query: z.string().optional(),
				page: z.number().min(1).optional().default(1),
				limit: z.number().optional().default(10)
			})
		)
		.query(async ({ input }) => {
			const offset = (input.page - 1) * input.limit;

			const queryLike = `%${input.query || ''}%`;

			const containers = await db.query.containersTable.findMany({
				limit: input.limit,
				offset,
				where: or(
					ilike(schema.containersTable.username, queryLike),
					ilike(schema.containersTable.ip, queryLike),
					ilike(sql`CAST(${schema.containersTable.vmid} AS TEXT)`, queryLike),
					inArray(
						schema.containersTable.user_id,
						db
							.select({ id: schema.user.id })
							.from(schema.user)
							.where(ilike(schema.user.email, queryLike))
					)
				),
				orderBy: [desc(schema.containersTable.created_at)]
			});

			const usersWithStatus: Array<
				(typeof containers)[number] & {
					status: Awaited<ReturnType<typeof getContainerStatus>>;
					suspended: boolean;
				}
			> = [];

			for (const container of containers) {
				let status = null;
				let suspended = false;
				if (container.vmid) {
					status = await getContainerStatus(container);
					suspended = await isContainerSuspended(container);
				}
				usersWithStatus.push({ ...container, status, suspended });
			}

			const rowQuery = await db
				.select({ value: count() })
				.from(schema.containersTable)
				.where(
					or(
						ilike(schema.containersTable.username, queryLike),
						ilike(schema.containersTable.ip, queryLike),
						ilike(sql`CAST(${schema.containersTable.vmid} AS TEXT)`, queryLike),
						inArray(
							schema.containersTable.user_id,
							db
								.select({ id: schema.user.id })
								.from(schema.user)
								.where(ilike(schema.user.email, queryLike))
						)
					)
				);

			let totalContainers = 0;

			if (rowQuery[0]) {
				totalContainers = Number(rowQuery[0].value);
			}

			const pageCount = Math.max(1, Math.ceil(totalContainers / input.limit));

			if (input.page > pageCount) {
				input.page = pageCount;
			}

			return { data: usersWithStatus, count: totalContainers, pageCount };
		}),
	getApplications: adminProcedure
		.input(
			z.object({
				query: z.string().optional(),
				page: z.number().min(1).optional().default(1),
				limit: z.number().optional().default(10)
			})
		)
		.query(async ({ input }) => {
			const offset = (input.page - 1) * input.limit;

			const queryLike = `%${input.query || ''}%`;

			const applications = await db.query.applicationsTable.findMany({
				limit: input.limit,
				where: or(
					ilike(schema.applicationsTable.username, queryLike),
					inArray(
						schema.applicationsTable.user_id,
						db
							.select({ id: schema.user.id })
							.from(schema.user)
							.where(ilike(schema.user.email, queryLike))
					)
				),
				offset,
				orderBy: [desc(schema.applicationsTable.created_at)],
				with: {
					user: true,
					reviewer: true
				}
			});

			const rowQuery = await db
				.select({ value: count() })
				.from(schema.applicationsTable)
				.where(
					or(
						ilike(schema.applicationsTable.username, queryLike),
						inArray(
							schema.applicationsTable.user_id,
							db
								.select({ id: schema.user.id })
								.from(schema.user)
								.where(ilike(schema.user.email, queryLike))
						)
					)
				);

			let totalApplications = 0;

			if (rowQuery[0]) {
				totalApplications = Number(rowQuery[0].value);
			}

			const pageCount = Math.max(1, Math.ceil(totalApplications / input.limit));

			if (input.page > pageCount) {
				input.page = pageCount;
			}

			const pendingApplications = await db.query.applicationsTable.findMany({
				where: eq(schema.applicationsTable.status, 'pending'),
				orderBy: [desc(schema.applicationsTable.created_at)],
				with: {
					user: true,
					reviewer: true
				}
			});

			return {
				all: applications,
				pending: pendingApplications,
				pageCount,
				count: totalApplications
			};
		}),
	getInvites: adminProcedure
		.input(
			z.object({
				query: z.string().optional(),
				page: z.number().min(1).optional().default(1),
				limit: z.number().optional().default(10)
			})
		)
		.query(async ({ input }) => {
			const offset = (input.page - 1) * input.limit;
			const queryLike = `%${input.query || ''}%`;

			const invites = await db.query.invitesTable.findMany({
				limit: input.limit,
				offset,
				orderBy: [desc(schema.invitesTable.code)]
			});

			const rowQuery = await db
				.select({ value: count() })
				.from(schema.invitesTable)
				.where(
					or(
						ilike(schema.invitesTable.code, queryLike),
						ilike(schema.invitesTable.admin_email, queryLike)
					)
				);

			let totalInvites = 0;

			if (rowQuery[0]) {
				totalInvites = Number(rowQuery[0].value);
			}

			const pageCount = Math.max(1, Math.ceil(totalInvites / input.limit));

			if (input.page > pageCount) {
				input.page = pageCount;
			}

			return { data: invites, count: totalInvites, pageCount };
		}),
	getProjectStats: adminProcedure.query(async () => {
		const [projectRows, containerRows] = await Promise.all([
			db
				.select({
					container_id: schema.projectsTable.container_id,
					repo: schema.projectsTable.repo,
					created_at: schema.projectsTable.created_at
				})
				.from(schema.projectsTable),
			db.select({ value: count() }).from(schema.containersTable)
		]);

		const containersTotal = Number(containerRows[0]?.value ?? 0);
		const containersWithProjects = new Set(projectRows.map((p) => p.container_id)).size;

		const hostCounts = new Map<string, number>();
		for (const project of projectRows) {
			let host = 'unknown';
			try {
				host = new URL(project.repo).hostname.replace(/^www\./, '');
			} catch {
				// Leave as unknown, the repo url was not parseable
			}
			hostCounts.set(host, (hostCounts.get(host) ?? 0) + 1);
		}

		const topHosts = [...hostCounts.entries()]
			.map(([host, total]) => ({ host, total }))
			.sort((a, b) => b.total - a.total)
			.slice(0, 6);

		const now = Date.now();
		const DAY = 24 * 60 * 60 * 1000;
		const addedSince = (days: number) =>
			projectRows.filter((p) => p.created_at && p.created_at.getTime() >= now - days * DAY).length;

		return {
			totalProjects: projectRows.length,
			containersTotal,
			containersWithProjects,
			containersWithoutProjects: Math.max(0, containersTotal - containersWithProjects),
			addedLast7Days: addedSince(7),
			addedLast30Days: addedSince(30),
			topHosts
		};
	}),
	getProjects: adminProcedure
		.input(
			z.object({
				query: z.string().optional(),
				page: z.number().min(1).optional().default(1),
				limit: z.number().optional().default(10)
			})
		)
		.query(async ({ input }) => {
			const offset = (input.page - 1) * input.limit;

			const queryLike = `%${input.query || ''}%`;

			const where = or(
				ilike(schema.projectsTable.name, queryLike),
				ilike(schema.projectsTable.demo, queryLike),
				ilike(schema.projectsTable.repo, queryLike),
				inArray(
					schema.projectsTable.container_id,
					db
						.select({ id: schema.containersTable.id })
						.from(schema.containersTable)
						.where(ilike(schema.containersTable.username, queryLike))
				)
			);

			const projects = await db.query.projectsTable.findMany({
				limit: input.limit,
				offset,
				where,
				orderBy: [desc(schema.projectsTable.created_at)],
				with: {
					container: true
				}
			});

			const rowQuery = await db.select({ value: count() }).from(schema.projectsTable).where(where);

			let totalProjects = 0;

			if (rowQuery[0]) {
				totalProjects = Number(rowQuery[0].value);
			}

			const pageCount = Math.max(1, Math.ceil(totalProjects / input.limit));

			if (input.page > pageCount) {
				input.page = pageCount;
			}

			return { data: projects, count: totalProjects, pageCount };
		}),
	deleteProject: adminProcedure.input(z.object({ id: z.int() })).mutation(async ({ input }) => {
		const [row] = await db
			.delete(schema.projectsTable)
			.where(eq(schema.projectsTable.id, input.id))
			.returning();

		if (!row) {
			return { success: false, message: 'Project not found' };
		}

		return { success: true, message: `${row.name} deleted` };
	}),
	toggleSuspend: adminProcedure
		.input(z.object({ id: z.int(), reason: z.string().optional().default('Suspended by admin') }))
		.mutation(async ({ input }) => {
			const container = await db.query.containersTable.findFirst({
				where: eq(schema.containersTable.id, input.id)
			});

			if (!container || !container.vmid) {
				return { success: false, message: 'Container not found' };
			}

			const suspended = await isContainerSuspended(container);

			setTimeout(requestNodeStats, 0);
			if (!suspended) {
				await setContainerDescription(container, `suspend: ${input.reason}`);
				await disableStartOnBoot(container);

				try {
					const status = await getContainerStatus(container);
					if (status?.status === 'running') {
						const stopResult = await pveFetch<{ data: NodeLXCStatusStop }>(
							`/nodes/${container.node}/lxc/${container.vmid}/status/stop`,
							'POST'
						);
						await waitForTask(container.node, stopResult.data);
					}
				} catch {
					// Ignore
				}

				return { success: true, message: `Container ${container.vmid} suspended` };
			} else {
				await setContainerDescription(container, '');
				await enableStartOnBoot(container);

				return { success: true, message: `Container ${container.vmid} unsuspended` };
			}
		}),
	processApplication: adminProcedure
		.input(
			z.object({
				id: z.int(),
				action: z.enum(['approve', 'reject'])
			})
		)
		.mutation(async ({ ctx, input }) => {
			const application = await db.query.applicationsTable.findFirst({
				where: eq(schema.applicationsTable.id, input.id),
				with: {
					user: true
				}
			});

			if (!application) {
				return { success: false, message: 'Application not found' };
			}

			if (application.status !== 'pending') {
				return { success: false, message: 'Application has already been processed' };
			}

			switch (input.action) {
				case 'approve': {
					const vmid = await getNextVmid();
					const node = await getNextNode();

					const serverConfig = CONFIG.servers.find((s) => s.node === node);

					if (!serverConfig) {
						return {
							success: false,
							message: "Something has gone terribly wrong, the server configuration can't be found"
						};
					}

					setTimeout(requestNodeStats, 0);

					const templateConfig = Array.isArray(serverConfig.templates)
						? serverConfig.templates.find((t) => t.name === application.template) ||
							serverConfig.templates[0]
						: serverConfig.templates;

					const password = randomBytes(12).toString('hex');
					const allocated = await dbHelpers.allocateIP(
						serverConfig.ipv4.cidr,
						serverConfig.ipv4.gateway
					);

					let net0 = `name=eth0,bridge=vmbr4030,firewall=0,ip=${allocated.ip}/${allocated.prefix},gw=${serverConfig.ipv4?.gateway || allocated.gateway}`;

					if (serverConfig.ipv6) {
						net0 += `,ip6=${serverConfig.ipv6.prefix}${vmid}/${serverConfig.ipv6.cidr},gw6=${serverConfig.ipv6.gateway}`;
					}

					console.log('net0: ', net0);
					console.log('ipv6 config: ', serverConfig.ipv6);

					const container = await dbHelpers.createContainer({
						user_id: application.user_id,
						sub: application.sub,
						username: application.username,
						sshKeys: [application.ssh_key],
						ip: allocated.ip,
						ipv6: serverConfig.ipv6 ? `${serverConfig.ipv6.prefix}${vmid}` : null,
						node
					});

					if (!container) {
						return { success: false, message: 'Failed to create database entry' };
					}

					await db
						.update(schema.applicationsTable)
						.set({ status: 'approved', reviewed_by: ctx.user.id, reviewed_at: new Date() })
						.where(eq(schema.applicationsTable.id, application.id));

					pveFetch<{ data: NodeLXCPost }>(`/nodes/${node}/lxc`, 'POST', {
						vmid,
						ostemplate: templateConfig?.template || OS_TEMPLATE,
						rootfs: serverConfig.rootfs || ROOTFS,
						unprivileged: 1,
						features: 'nesting=1',
						cores: 2,
						cpulimit: 2,
						memory: 2048,
						swap: 512,
						net0,
						hostname: application.username,
						'ssh-public-keys': `${BASTION_PROXY_PUB_KEY}\n${application.ssh_key}`,
						password,
						start: 1,
						onboot: 1
					})
						.then(async (result) => {
							await waitForTask(node, result.data);
							await fetch(`http://${serverConfig.hostIP}:9191/add/${vmid}`, {
								headers: { Authorization: `Bearer ${process.env.NDP_API_KEY}` }
							});

							await db
								.update(schema.containersTable)
								.set({ vmid })
								.where(eq(schema.containersTable.id, container.id));

							await transporter.sendMail({
								from: SMTP_FROM,
								to: application.user?.email ?? application.email!, // This situation might happen in-between migrations but not in the near future
								subject: 'Nest account approved!',
								html: await render(
									<ApprovedEmail
										username={application.username}
										domain={APP_DOMAIN || 'hackclub.app'}
										url={APP_DOMAIN || 'https://dashboard.hackclub.app'}
									/>
								)
							});
						})
						.catch(async (err) => {
							console.error('Failed to create container:', err);
							await db
								.update(schema.applicationsTable)
								.set({ status: 'pending', reviewed_by: null, reviewed_at: null })
								.where(eq(schema.applicationsTable.id, application.id));

							await db
								.delete(schema.containersTable)
								.where(eq(schema.containersTable.id, container.id));
						});

					return {
						success: true,
						message: `Application approved and container ${vmid} created with password ${password}`
					};
				}
				case 'reject': {
					await db
						.update(schema.applicationsTable)
						.set({ status: 'rejected', reviewed_by: ctx.user.id, reviewed_at: new Date() })
						.where(eq(schema.applicationsTable.id, application.id));

					await transporter.sendMail({
						from: SMTP_FROM,
						to: application.user?.email ?? application.email!,
						subject: 'Nest account rejected',
						html: await render(<RejectedEmail username={application.username} />)
					});

					return { success: true, message: 'Application rejected' };
				}
				default: {
					return { success: false, message: 'Invalid action' };
				}
			}
		}),
	createInvite: adminProcedure
		.input(z.object({ uses: z.int().optional(), expires: z.date().optional() }))
		.mutation(async ({ ctx, input }) => {
			const code = randomBytes(8).toString('hex');

			await dbHelpers.createInvite({
				code,
				adminEmail: ctx.user.email,
				maxUses: input.uses || null,
				expiresAt: input.expires || null
			});

			return { success: true, message: 'Invite created' };
		}),
	deleteInvite: adminProcedure.input(z.object({ code: z.string() })).mutation(async ({ input }) => {
		await db.delete(schema.invitesTable).where(eq(schema.invitesTable.code, input.code));

		return { success: true, message: 'Invite deleted' };
	})
});

export default adminRouter;
