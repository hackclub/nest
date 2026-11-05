import { defineRelations } from 'drizzle-orm';
import * as schema from './schema';

export const relations = defineRelations(schema, (r) => ({
	containersTable: {
		user: r.one.user({
			from: r.containersTable.user_id,
			to: r.user.id
		}),
		domains: r.many.domainsTable(),
		projects: r.many.projectsTable()
	},
	domainsTable: {
		container: r.one.containersTable({
			from: r.domainsTable.container_id,
			to: r.containersTable.id
		})
	},
	projectsTable: {
		container: r.one.containersTable({
			from: r.projectsTable.container_id,
			to: r.containersTable.id
		})
	},
	applicationsTable: {
		user: r.one.user({
			from: r.applicationsTable.user_id,
			to: r.user.id
		}),
		reviewer: r.one.user({
			from: r.applicationsTable.reviewed_by,
			to: r.user.id
		})
	}
}));
