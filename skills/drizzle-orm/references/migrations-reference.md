# Drizzle ORM v0.38 Migrations Reference

> Sources: https://orm.drizzle.team/docs/drizzle-config-file | https://orm.drizzle.team/docs/migrations | https://orm.drizzle.team/docs/kit-overview

## TOC

1. [drizzle.config.ts -- defineConfig](#drizzconfigts--defineconfig)
2. [drizzle-kit CLI Commands](#drizzle-kit-cli-commands)
3. [Programmatic migrate()](#programmatic-migrate)
4. [Transactions in Migrations](#transactions-in-migrations)

---

## drizzle.config.ts -- defineConfig

The configuration file consumed by drizzle-kit. Must export a `defineConfig` call as the default export.

```ts
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // ---------- Required ----------
  dialect: "postgresql",          // "postgresql" | "mysql" | "sqlite" | "turso" | "singlestore"
  schema: "./src/db/schema.ts",   // Path to schema file(s). Glob or array supported.

  // ---------- Migration output ----------
  out: "./drizzle",               // Directory for generated SQL migrations. Default: "./drizzle"

  // ---------- Database connection ----------
  // Option 1: connection string
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Option 2: individual fields (alternative)
  // dbCredentials: {
  //   host: "localhost",
  //   port: 5432,
  //   database: "mydb",
  //   user: "postgres",
  //   password: "secret",
  //   ssl: false,
  // },

  // ---------- Optional ----------
  // Include only tables matching these schemas (PostgreSQL)
  schemaFilter: ["public"],       // default: ["public"]

  // Glob patterns for tables to include
  tablesFilter: ["*"],            // default: all

  // Migration naming strategy
  migrations: {
    table: "__drizzle_migrations",  // custom migration history table name
    schema: "public",               // schema for migration table
    prefix: "timestamp",            // "timestamp" | "supabase" | "unix" | "none" | "index"
  },

  // Introspection settings (for push/pull)
  introspect: {
    casing: "camel",               // "camel" | "preserve" (column name casing in generated schema)
  },

  // Verbose logging
  verbose: true,

  // Strict mode: no interactive prompts (fail instead)
  strict: true,
});
```

### Multiple schema files (glob or array)

```ts
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/*.ts",         // glob
  // schema: ["./src/db/schema/users.ts", "./src/db/schema/posts.ts"],  // array
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL },
});
```

---

## drizzle-kit CLI Commands

All commands use the config at `drizzle.config.ts` by default. Override with `--config`.

### generate

Generate SQL migration files from schema diff (does NOT touch the database).

```bash
npx drizzle-kit generate
npx drizzle-kit generate --name add_users_table   # custom migration name
npx drizzle-kit generate --config ./custom.config.ts
```

Output: creates files in `out/` directory:
- `{timestamp}_{name}.sql` -- SQL migration file
- `meta/_journal.json` -- migration journal (tracks applied migrations)

### migrate

Apply all pending SQL migrations to the database.

```bash
npx drizzle-kit migrate
npx drizzle-kit migrate --config ./custom.config.ts
```

Reads from `out/` and the migration history table in the database to determine which migrations to apply.

### push

Sync schema directly to the database without generating migration files (development only).

```bash
npx drizzle-kit push
npx drizzle-kit push --verbose    # show SQL statements
npx drizzle-kit push --strict     # fail on data loss risk instead of prompting
```

**Warning**: `push` is destructive and not recommended for production. It does not create migration files.

### pull (introspect)

Generate schema.ts from an existing database (reverse engineering).

```bash
npx drizzle-kit pull
npx drizzle-kit pull --config ./custom.config.ts
```

Output: creates `schema.ts` and `relations.ts` in `out/` directory.

### studio

Launch Drizzle Studio web UI to browse and edit database data.

```bash
npx drizzle-kit studio
npx drizzle-kit studio --port 4983   # custom port (default: 4983)
```

### check

Validate that migration files are consistent with the current schema (no drift).

```bash
npx drizzle-kit check
```

### up

Upgrade snapshot format from older drizzle-kit versions.

```bash
npx drizzle-kit up
```

---

## Programmatic migrate()

Run migrations from application code at startup. Useful for embedded or containerized deployments.

### postgres.js driver

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Use a separate connection for migrations (not the pooled one)
const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(migrationClient);

await migrate(db, {
  migrationsFolder: "./drizzle",           // path to the generated SQL migrations
  migrationsTable: "__drizzle_migrations",  // optional: custom table name
  migrationsSchema: "public",               // optional: schema for migration table
});

await migrationClient.end();
```

### node-postgres (pg) driver

```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

await migrate(db, { migrationsFolder: "./drizzle" });
await pool.end();
```

### Neon (serverless) driver

```ts
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

await migrate(db, { migrationsFolder: "./drizzle" });
```

---

## Transactions in Migrations

Each migration SQL file is automatically wrapped in a transaction by drizzle-kit. If any statement fails, the entire migration rolls back.

For custom transactional logic in application code:

```ts
import { db } from "./db.js";
import { users, posts } from "./schema.js";
import { eq } from "drizzle-orm";

// Basic transaction
await db.transaction(async (tx) => {
  await tx.insert(users).values({ name: "Alice" });
  await tx.insert(posts).values({ title: "Hello", authorId: 1 });
  // Any thrown error causes full rollback
});

// Transaction with isolation level and access mode
await db.transaction(async (tx) => {
  const result = await tx.select().from(users);
  // do work
}, {
  isolationLevel: "serializable",  // "read uncommitted" | "read committed" | "repeatable read" | "serializable"
  accessMode: "read write",         // "read only" | "read write"
  deferrable: true,                 // only for "serializable" + "read only"
});

// Nested transactions (savepoints)
await db.transaction(async (tx) => {
  await tx.insert(users).values({ name: "Alice" });

  try {
    await tx.transaction(async (nestedTx) => {
      await nestedTx.insert(posts).values({ title: "May fail" });
      throw new Error("rollback nested only");
    });
  } catch {
    // Outer tx continues; only nested savepoint rolled back
  }

  await tx.insert(posts).values({ title: "This still commits" });
});

// Manual rollback via tx.rollback()
await db.transaction(async (tx) => {
  const result = await tx.select().from(users).where(eq(users.id, 1));
  if (!result.length) {
    tx.rollback();  // throws TransactionRollbackError, caught by drizzle
    return;
  }
  await tx.update(users).set({ name: "Updated" }).where(eq(users.id, 1));
});
```
