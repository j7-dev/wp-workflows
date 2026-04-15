import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export function createDb(connectionString: string) {
  const pool = new Pool({ connectionString });
  return drizzle(pool);
}

export type { NodePgDatabase } from 'drizzle-orm/node-postgres';
