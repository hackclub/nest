import {
	bigint,
	date,
	doublePrecision,
	index,
	integer,
	pgTable,
	primaryKey,
	text,
	serial,
	timestamp
} from 'drizzle-orm/pg-core';
import * as auth from './auth-schema';

export const containersTable = pgTable('containers', {
	id: serial('id').primaryKey(),
	user_id: text('user_id')
		.unique()
		.references(() => auth.user.id, {
			onDelete: 'cascade'
		}),
	sub: text('sub').unique(),
	username: text('username').unique().notNull(),
	ssh_keys: text('ssh_keys').array().notNull(),
	vmid: integer('vmid'),
	ip: text('ip'),
	ipv6: text('ipv6'),
	node: text('node').default('nest-prox-2'),
	last_ssh_at: timestamp('last_ssh_at'),
	created_at: timestamp('created_at').defaultNow()
});

export const domainsTable = pgTable('domains', {
	id: serial('id').primaryKey(),
	container_id: integer('container_id')
		.notNull()
		.references(() => containersTable.id, {
			onDelete: 'cascade'
		}),
	domain: text('domain').unique().notNull(),
	proxy: integer('proxy').notNull(),
	created_at: timestamp('created_at').defaultNow()
});

export const projectsTable = pgTable('projects', {
	id: serial('id').primaryKey(),
	container_id: integer('container_id')
		.notNull()
		.references(() => containersTable.id, {
			onDelete: 'cascade'
		}),
	name: text('name').notNull(),
	demo: text('demo').notNull(),
	repo: text('repo').notNull(),
	created_at: timestamp('created_at').defaultNow(),
	updated_at: timestamp('updated_at').defaultNow()
});

export const applicationsTable = pgTable('applications', {
	id: serial('id').primaryKey(),
	user_id: text('user_id').references(() => auth.user.id, {
		onDelete: 'cascade'
	}),
	sub: text('sub'),
	email: text('email'),
	username: text('username').notNull(),
	ssh_key: text('ssh_key').notNull(),
	reason: text('reason').notNull(),
	template: text('template').notNull().default('Debian 13'),

	status: text('status').notNull().default('pending'),
	reviewed_by: text('reviewed_by'),
	reviewed_at: timestamp('reviewed_at'),
	created_at: timestamp('created_at').defaultNow()
});

export const certificatesTable = pgTable('certificates', {
	id: serial('id').primaryKey(),
	domain: text('domain').unique().notNull(),
	cert: text('cert').notNull(),
	key: text('key').notNull(),
	expires_at: timestamp('expires_at').notNull(),
	created_at: timestamp('created_at').defaultNow()
});

export const invitesTable = pgTable('invites', {
	code: text('code').primaryKey(),
	admin_email: text('admin_email').notNull(),
	max_uses: integer('max_uses'),
	uses: integer('uses').notNull().default(0),
	expires_at: timestamp('expires_at'),
	created_at: timestamp('created_at').defaultNow()
});

export const settingsTable = pgTable('settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull()
});

// from airbridge
export const unifiedShipsTable = pgTable(
	'unified_ships',
	{
		record_id: text('record_id').primaryKey(),
		email: text('email').notNull(),
		approved_at: date('approved_at', { mode: 'string' }),
		synced_at: timestamp('synced_at').defaultNow().notNull()
	},
	(table) => [index('unified_ships_email_idx').on(table.email)]
);

// one row per container per day with at least one authenticated bastion connection
export const sshActivityTable = pgTable(
	'ssh_activity',
	{
		container_id: integer('container_id')
			.notNull()
			.references(() => containersTable.id, {
				onDelete: 'cascade'
			}),
		day: date('day', { mode: 'string' }).notNull(),
		connections: integer('connections').notNull().default(1),
		first_at: timestamp('first_at').defaultNow().notNull(),
		last_at: timestamp('last_at').defaultNow().notNull()
	},
	(table) => [
		primaryKey({ columns: [table.container_id, table.day] }),
		index('ssh_activity_day_idx').on(table.day)
	]
);

// bastion connection failures for known users, counted per day and reason
export const sshFailuresTable = pgTable(
	'ssh_failures',
	{
		day: date('day', { mode: 'string' }).notNull(),
		reason: text('reason').notNull(),
		count: integer('count').notNull().default(1)
	},
	(table) => [primaryKey({ columns: [table.day, table.reason] })]
);

// one row per signed-in user per day they loaded the dashboard (any page that resolves a session)
export const webActivityTable = pgTable(
	'web_activity',
	{
		user_id: text('user_id')
			.notNull()
			.references(() => auth.user.id, {
				onDelete: 'cascade'
			}),
		day: date('day', { mode: 'string' }).notNull(),
		first_at: timestamp('first_at').defaultNow().notNull()
	},
	(table) => [
		primaryKey({ columns: [table.user_id, table.day] }),
		index('web_activity_day_idx').on(table.day)
	]
);

// periodically refreshed
export const hcaStatusTable = pgTable('hca_status', {
	container_id: integer('container_id')
		.primaryKey()
		.references(() => containersTable.id, {
			onDelete: 'cascade'
		}),
	result: text('result').notNull(),
	aged_out_at: timestamp('aged_out_at'),
	checked_at: timestamp('checked_at').defaultNow().notNull()
});

export const containerUsageTable = pgTable('container_usage', {
	container_id: integer('container_id')
		.primaryKey()
		.references(() => containersTable.id, {
			onDelete: 'cascade'
		}),
	status: text('status').notNull(),
	cpu: doublePrecision('cpu').notNull(),
	cpus: integer('cpus').notNull(),
	mem: bigint('mem', { mode: 'number' }).notNull(),
	maxmem: bigint('maxmem', { mode: 'number' }).notNull(),
	disk: bigint('disk', { mode: 'number' }).notNull(),
	maxdisk: bigint('maxdisk', { mode: 'number' }).notNull(),
	netin: bigint('netin', { mode: 'number' }).notNull(),
	netout: bigint('netout', { mode: 'number' }).notNull(),
	sampled_at: timestamp('sampled_at').notNull()
});

export const containerUsageDailyTable = pgTable(
	'container_usage_daily',
	{
		container_id: integer('container_id')
			.notNull()
			.references(() => containersTable.id, {
				onDelete: 'cascade'
			}),
		day: date('day', { mode: 'string' }).notNull(),
		samples: integer('samples').notNull(),
		cpu_sum: doublePrecision('cpu_sum').notNull(),
		cpu_max: doublePrecision('cpu_max').notNull(),
		mem_sum: doublePrecision('mem_sum').notNull(),
		mem_max: bigint('mem_max', { mode: 'number' }).notNull(),
		net_bytes: bigint('net_bytes', { mode: 'number' }).notNull()
	},
	(table) => [
		primaryKey({ columns: [table.container_id, table.day] }),
		index('container_usage_daily_day_idx').on(table.day)
	]
);

export * from './auth-schema';
