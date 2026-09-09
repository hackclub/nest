import { join } from 'path';

import { drizzle } from 'drizzle-orm/bun-sql';
import { migrate } from 'drizzle-orm/bun-sql/migrator';
//import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'bun';
import * as schema from './schema';

//export const db = drizzle({ schema });

export const db = drizzle({ client: sql, schema });

await migrate(db, { migrationsFolder: join(import.meta.dir, '../../drizzle') });

export { schema };
