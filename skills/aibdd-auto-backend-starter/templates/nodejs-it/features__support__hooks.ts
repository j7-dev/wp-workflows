import { Before, After, BeforeAll, AfterAll, setWorldConstructor } from '@cucumber/cucumber';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';
import { createApp } from '../../${NODE_APP_DIR}/app';
import { JwtHelper } from './jwt-helper';
import { TestWorld } from './world';

let container: StartedPostgreSqlContainer;
let pool: Pool;
let db: NodePgDatabase;

setWorldConstructor(TestWorld);

BeforeAll({ timeout: 60_000 }, async function () {
  container = await new PostgreSqlContainer('postgres:16')
    .withExposedPorts(5432)
    .start();

  const connectionString = container.getConnectionUri();
  pool = new Pool({ connectionString });
  db = drizzle(pool);

  await migrate(db, { migrationsFolder: './${NODE_DRIZZLE_MIGRATIONS}' });
});

Before(async function (this: TestWorld) {
  this.db = db;
  this.app = createApp(db);
  this.jwtHelper = new JwtHelper(process.env.JWT_SECRET || 'test-secret');

  this.ids = {};
  this.memo = {};
  this.lastResponse = null;
  this.lastError = null;
  this.queryResult = null;
});

After(async function (this: TestWorld) {
  const tables = await db.execute(sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT LIKE 'drizzle_%'
    AND tablename NOT LIKE '__drizzle_%'
  `);

  for (const row of tables.rows) {
    const tableName = (row as { tablename: string }).tablename;
    await db.execute(sql.raw(`TRUNCATE TABLE "${tableName}" CASCADE`));
  }
});

AfterAll(async function () {
  if (pool) await pool.end();
  if (container) await container.stop();
});
