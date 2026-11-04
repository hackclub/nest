import { join } from 'path';

import { drizzle } from 'drizzle-orm/bun-sql';
import { migrate } from 'drizzle-orm/bun-sql/migrator';
import { sql } from 'bun';
import * as schema from './schema';
import { relations } from './relations';

export const db = drizzle({ client: sql, relations: { ...relations, ...schema.authRelations } });

// if you need to regenerate auth schema you'll have to comment this out - Laura
await migrate(db, { migrationsFolder: join(import.meta.dir, '../../drizzle') });

export { schema };
