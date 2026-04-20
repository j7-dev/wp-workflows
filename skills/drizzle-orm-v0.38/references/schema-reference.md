# Drizzle ORM v0.38 Schema Reference

> Sources: https://orm.drizzle.team/docs/sql-schema-declaration | https://orm.drizzle.team/docs/column-types/pg | https://orm.drizzle.team/docs/indexes-constraints | https://orm.drizzle.team/docs/relations

## TOC

1. [pgTable Syntax](#pgtable-syntax)
2. [Column Types](#column-types)
3. [Column Methods](#column-methods)
4. [pgEnum](#pgenum)
5. [pgSchema](#pgschema)
6. [Indexes](#indexes)
7. [Constraints](#constraints)
8. [Relations API](#relations-api)
9. [Type Inference](#type-inference)

---

## pgTable Syntax

Three declaration styles:

### Style 1: Inline (simple tables)

```ts
import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age"),
});
```

### Style 2: Third argument for indexes/constraints

```ts
import { pgTable, text, integer, index, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: integer("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
}, (table) => [
  uniqueIndex("email_idx").on(table.email),
  index("name_idx").on(table.name),
]);
```

### Style 3: With pgSchema prefix

```ts
import { pgSchema, integer, text } from "drizzle-orm/pg-core";

const mySchema = pgSchema("myschema");

export const users = mySchema.table("users", {
  id: integer("id").primaryKey(),
  name: text("name"),
});
```

---

## Column Types

All column type imports are from `drizzle-orm/pg-core`.

### Integer Types

| Column | SQL Type | JS Type | Notes |
|--------|----------|---------|-------|
| `integer(name)` | `integer` / `int4` | `number` | -2^31 to 2^31-1 |
| `smallint(name)` | `smallint` / `int2` | `number` | -32768 to 32767 |
| `bigint(name, { mode })` | `bigint` / `int8` | `bigint`|`string`|`number` | mode: "bigint"|"number" |
| `serial(name)` | `serial` | `number` | Auto-increment, implies notNull |
| `smallserial(name)` | `smallserial` | `number` | Small auto-increment |
| `bigserial(name, { mode })` | `bigserial` | `bigint`|`number` | Large auto-increment |

```ts
import { integer, smallint, bigint, serial, smallserial, bigserial, pgTable } from "drizzle-orm/pg-core";

export const t = pgTable("t", {
  id: serial("id").primaryKey(),
  small: smallint("small"),
  big: bigint("big", { mode: "number" }),
  bigAsBigInt: bigint("big_as_bigint", { mode: "bigint" }),
  autoSmall: smallserial("auto_small"),
  autoBig: bigserial("auto_big", { mode: "number" }),
});
```

### Numeric / Decimal Types

| Column | SQL Type | JS Type | Notes |
|--------|----------|---------|-------|
| `numeric(name, { precision?, scale? })` | `numeric` | `string` | Arbitrary precision |
| `decimal(name, { precision?, scale? })` | `decimal` | `string` | Alias for numeric |
| `real(name)` | `real` / `float4` | `number` | 6 decimal digits precision |
| `doublePrecision(name)` | `double precision` / `float8` | `number` | 15 decimal digits precision |

```ts
import { numeric, decimal, real, doublePrecision, pgTable } from "drizzle-orm/pg-core";

export const t = pgTable("t", {
  price: numeric("price", { precision: 10, scale: 2 }),
  amount: decimal("amount", { precision: 15, scale: 4 }),
  rating: real("rating"),
  score: doublePrecision("score"),
});
```

### Text / String Types

| Column | SQL Type | JS Type | Notes |
|--------|----------|---------|-------|
| `text(name)` | `text` | `string` | Unlimited length |
| `varchar(name, { length? })` | `varchar(n)` | `string` | Variable, optional max length |
| `char(name, { length? })` | `char(n)` | `string` | Fixed length, space-padded |

```ts
import { text, varchar, char, pgTable } from "drizzle-orm/pg-core";

export const t = pgTable("t", {
  bio: text("bio"),
  email: varchar("email", { length: 255 }),
  code: char("code", { length: 4 }),
});
```

### Boolean

```ts
import { boolean, pgTable } from "drizzle-orm/pg-core";

export const t = pgTable("t", {
  isActive: boolean("is_active").default(false).notNull(),
});
```

### Binary

```ts
import { bytea, pgTable } from "drizzle-orm/pg-core";

export const t = pgTable("t", {
  data: bytea("data"),  // JS type: Buffer
});
```

### JSON Types

| Column | SQL Type | JS Type | Notes |
|--------|----------|---------|-------|
| `json(name)` | `json` | `unknown` | Raw JSON text stored as-is |
| `jsonb(name)` | `jsonb` | `unknown` | Binary JSON, supports GIN index |

```ts
import { json, jsonb, pgTable } from "drizzle-orm/pg-core";

export const t = pgTable("t", {
  // Use .$type<T>() to narrow the TypeScript type
  metadata: json("metadata").$type<{ key: string; value: number }>(),
  tags: jsonb("tags").$type<string[]>().default([]),
});
```

### UUID

```ts
import { uuid, pgTable } from "drizzle-orm/pg-core";

export const t = pgTable("t", {
  id: uuid("id").primaryKey().defaultRandom(),  // uses gen_random_uuid()
});
```

### Date / Time Types

| Column | SQL Type | JS Type | Notes |
|--------|----------|---------|-------|
| `date(name, { mode? })` | `date` | `string`|`Date` | mode: "string" (default)|"date" |
| `time(name, { precision?, withTimezone? })` | `time` | `string` | |
| `timestamp(name, { precision?, withTimezone?, mode? })` | `timestamp` | `Date`|`string` | mode: "date" (default)|"string" |
| `interval(name, { fields?, precision? })` | `interval` | `string` | PostgreSQL interval |

```ts
import { date, time, timestamp, interval, pgTable } from "drizzle-orm/pg-core";

export const t = pgTable("t", {
  birthDate: date("birth_date"),
  birthDateObj: date("birth_date_obj", { mode: "date" }),
  startTime: time("start_time", { precision: 3 }),
  tzTime: time("tz_time", { withTimezone: true }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true }),
  duration: interval("duration"),
  yearInterval: interval("year_interval", { fields: "year" }),
});
```

### Geometric Types

```ts
import { point, line, pgTable } from "drizzle-orm/pg-core";

export const t = pgTable("t", {
  // point: { x: number, y: number } in "xy" mode
  location: point("location", { mode: "xy" }),
  // line: { a: number, b: number, c: number } in "abc" mode
  boundary: line("boundary", { mode: "abc" }),
});
```

### Custom Type

```ts
import { customType, pgTable } from "drizzle-orm/pg-core";

const myBytea = customType<{ data: Uint8Array; driverData: string }>({
  dataType() {
    return "bytea";
  },
  toDriver(value: Uint8Array): string {
    return Buffer.from(value).toString("hex");
  },
  fromDriver(value: string): Uint8Array {
    return new Uint8Array(Buffer.from(value, "hex"));
  },
});

export const t = pgTable("t", {
  data: myBytea("data"),
});
```

### Array Columns

```ts
import { integer, text, pgTable } from "drizzle-orm/pg-core";

export const t = pgTable("t", {
  scores: integer("scores").array(),            // integer[]
  tags: text("tags").array(),                   // text[]
  matrix: integer("matrix").array().array(),    // integer[][]
});
```

---

## Column Methods

Chainable methods available on all column builders.

### Nullability

```ts
text("name").notNull()   // NOT NULL constraint
text("name")             // nullable by default (null | string)
```

### Default Values

```ts
// DB-level static default
integer("count").default(0)
text("status").default("active")
boolean("active").default(true)

// DB-level function default
timestamp("created_at").defaultNow()          // uses now()
uuid("id").defaultRandom()                    // uses gen_random_uuid()

// JS-level default (Drizzle applies at insert time, not persisted in DB DDL)
text("slug").$defaultFn(() => generateSlug())
uuid("id").$defaultFn(() => crypto.randomUUID())

// JS-level update fn (Drizzle applies at update time)
timestamp("updated_at").$onUpdateFn(() => new Date())
```

### Primary Key

```ts
serial("id").primaryKey()
uuid("id").primaryKey().defaultRandom()
integer("id").generatedAlwaysAsIdentity()      // GENERATED ALWAYS AS IDENTITY (PG 10+)
integer("id").generatedByDefaultAsIdentity()   // GENERATED BY DEFAULT AS IDENTITY
integer("id").generatedAlwaysAsIdentity({ startWith: 1000, increment: 5 })
```

### Unique

```ts
text("email").unique()
text("email").unique("custom_constraint_name")
```

### Foreign Key (inline)

```ts
integer("user_id").references(() => users.id)

integer("user_id").references(() => users.id, {
  onDelete: "cascade",    // "no action" | "restrict" | "cascade" | "set null" | "set default"
  onUpdate: "no action",
})
```

### Type Narrowing

```ts
// Narrows TypeScript type without affecting SQL type
json("metadata").$type<{ version: number; tags: string[] }>()
text("role").$type<"admin" | "user" | "guest">()
```

---

## pgEnum

Defines a PostgreSQL `CREATE TYPE ... AS ENUM` type.

```ts
import { pgTable, pgEnum, serial, text } from "drizzle-orm/pg-core";

// Must be exported so drizzle-kit includes it in migrations
export const roleEnum = pgEnum("role", ["admin", "user", "guest"]);
export const statusEnum = pgEnum("status", ["active", "inactive", "pending"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  role: roleEnum("role").default("user").notNull(),
  status: statusEnum("status").default("active"),
});

// Extract union type from enum
type Role = typeof roleEnum.enumValues[number];  // "admin" | "user" | "guest"
```

---

## pgSchema

Organizes tables into a named PostgreSQL schema (namespace). Separate from the `public` schema.

```ts
import { pgSchema, integer, text, jsonb } from "drizzle-orm/pg-core";

export const analyticsSchema = pgSchema("analytics");

export const events = analyticsSchema.table("events", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  payload: jsonb("payload"),
});
```

In `drizzle.config.ts`, set `schemaFilter` to include non-public schemas:

```ts
export default defineConfig({
  schemaFilter: ["public", "analytics"],
});
```

---

## Indexes

Defined in the third argument (callback returning array) of `pgTable`.

```ts
import {
  pgTable, text, integer, boolean,
  index, uniqueIndex
} from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

export const users = pgTable("users", {
  id: integer("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  isActive: boolean("is_active").default(true),
  score: integer("score"),
}, (table) => [
  // Simple index
  index("name_idx").on(table.name),

  // Unique index
  uniqueIndex("email_unique_idx").on(table.email),

  // Composite index (multiple columns)
  index("name_score_idx").on(table.name, table.score),

  // Partial index with WHERE clause
  index("active_users_idx").on(table.name).where(eq(table.isActive, true)),

  // Descending sort order
  index("score_desc_idx").on(table.score.desc()),

  // Concurrent build (avoids table lock)
  index("name_concurrent_idx").on(table.name).concurrently(),

  // Nulls not distinct (PG 15+)
  uniqueIndex("email_nulls_idx").on(table.email).nullsNotDistinct(),
]);
```

---

## Constraints

```ts
import {
  pgTable, text, integer,
  primaryKey, foreignKey, unique, check
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

declare const posts: any; // assume defined elsewhere

export const postTags = pgTable("post_tags", {
  postId: integer("post_id").notNull(),
  tagId: integer("tag_id").notNull(),
  score: integer("score"),
}, (table) => [
  // Composite primary key
  primaryKey({ columns: [table.postId, table.tagId] }),

  // Named composite primary key
  primaryKey({ name: "post_tags_pk", columns: [table.postId, table.tagId] }),

  // Named foreign key with ON DELETE / ON UPDATE actions
  foreignKey({
    columns: [table.postId],
    foreignColumns: [posts.id],
    name: "post_tags_post_fk",
  }).onDelete("cascade").onUpdate("no action"),

  // Composite unique constraint
  unique("post_tag_unique").on(table.postId, table.tagId),

  // Check constraint using sql template tag
  check("positive_ids", sql`${table.postId} > 0 AND ${table.tagId} > 0`),
  check("positive_score", sql`${table.score} > 0`),
]);
```

---

## Relations API

Relations are **application-layer only** -- they do NOT create foreign keys or modify the database schema. They power the Relational Query Builder (RQB).

`relations` is imported from `drizzle-orm` (not `drizzle-orm/pg-core`).

### One-to-Many

```ts
import { relations } from "drizzle-orm";
import { pgTable, integer, text, serial } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  authorId: integer("author_id").notNull().references(() => users.id),
});

// "users" side: has many posts
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

// "posts" side: belongs to one user
export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],    // FK column(s) on this table
    references: [users.id],      // Referenced column(s) on the other table
  }),
}));
```

### Many-to-Many (via junction table)

```ts
import { relations } from "drizzle-orm";
import { pgTable, integer, serial, primaryKey } from "drizzle-orm/pg-core";

export const posts = pgTable("posts", { id: serial("id").primaryKey() });
export const tags = pgTable("tags", { id: serial("id").primaryKey() });

export const postsTags = pgTable("posts_tags", {
  postId: integer("post_id").notNull().references(() => posts.id),
  tagId: integer("tag_id").notNull().references(() => tags.id),
}, (table) => [
  primaryKey({ columns: [table.postId, table.tagId] }),
]);

export const postsRelations = relations(posts, ({ many }) => ({
  postsTags: many(postsTags),
}));
export const tagsRelations = relations(tags, ({ many }) => ({
  postsTags: many(postsTags),
}));
export const postsTagsRelations = relations(postsTags, ({ one }) => ({
  post: one(posts, { fields: [postsTags.postId], references: [posts.id] }),
  tag: one(tags, { fields: [postsTags.tagId], references: [tags.id] }),
}));
```

### Self-Referential Relations

```ts
import { relations } from "drizzle-orm";
import { pgTable, integer, text, serial } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  parentId: integer("parent_id"),  // nullable self-reference
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "parent_child",   // disambiguate self-ref
  }),
  children: many(categories, { relationName: "parent_child" }),
}));
```

### Ambiguous Relations (multiple FK to same table)

```ts
// Assume users pgTable is defined above
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id),
  receiverId: integer("receiver_id").references(() => users.id),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",       // must match both sides
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
}));
```

---

## Type Inference

```ts
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Style 1: table property (preferred)
type User    = typeof users.$inferSelect;
// { id: number; name: string; age: number | null; createdAt: Date }

type NewUser = typeof users.$inferInsert;
// { id?: number; name: string; age?: number | null; createdAt?: Date }

// Style 2: utility type
type User2    = InferSelectModel<typeof users>;
type NewUser2 = InferInsertModel<typeof users>;

// Partial for PATCH-style updates
type UserPatch = Partial<typeof users.$inferInsert>;
```
