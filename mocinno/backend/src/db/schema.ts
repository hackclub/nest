import { integer, pgTable, text, serial, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
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

export const containersRelations = relations(containersTable, ({ one, many }) => ({
	user: one(auth.user, {
		fields: [containersTable.user_id],
		references: [auth.user.id]
	}),
	domains: many(domainsTable)
}));

export const domainsRelations = relations(domainsTable, ({ one }) => ({
	container: one(containersTable, {
		fields: [domainsTable.container_id],
		references: [containersTable.id]
	})
}));

export const applicationsRelations = relations(applicationsTable, ({ one }) => ({
	user: one(auth.user, {
		fields: [applicationsTable.user_id],
		references: [auth.user.id]
	}),
	reviewer: one(auth.user, {
		fields: [applicationsTable.reviewed_by],
		references: [auth.user.id]
	})
}));

export * from './auth-schema';
