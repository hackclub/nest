import { date, index, integer, pgTable, text, serial, timestamp } from 'drizzle-orm/pg-core';
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

export * from './auth-schema';
