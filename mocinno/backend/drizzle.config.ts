import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	out: './drizzle',
	schema: './src/db/schema.ts',
	dialect: 'postgresql',
	dbCredentials: process.env.DATABASE_URL!
		? {
				url: process.env.DATABASE_URL!
			}
		: {
				host: process.env.PGHOST!,
				port: parseInt(process.env.PGPORT!, 10) || 5432,
				user: process.env.PGUSER!,
				password: process.env.PGPASSWORD!,
				database: process.env.PGDATABASE!,
				ssl: false
			},
	strict: true
});
