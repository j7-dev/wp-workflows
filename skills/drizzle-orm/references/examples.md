# Drizzle ORM v0.38 Examples

> Sources: https://orm.drizzle.team/docs/select | https://orm.drizzle.team/docs/insert | https://orm.drizzle.team/docs/update | https://orm.drizzle.team/docs/delete | https://orm.drizzle.team/docs/transactions | https://orm.drizzle.team/docs/dynamic-query-building

## TOC

1. [Basic CRUD](#basic-crud)
2. [Pagination](#pagination)
3. [Upsert (Insert or Update)](#upsert-insert-or-update)
4. [Batch Insert](#batch-insert)
5. [Transactions](#transactions)
6. [Dynamic WHERE (Search API)](#dynamic-where-search-api)
7. [Multi-Table JOIN with RQB](#multi-table-join-with-rqb)
8. [Aggregate Stats Query](#aggregate-stats-query)

---

## Shared Schema (used in all examples)

```ts
// schema.ts
import { pgTable, pgEnum, serial, integer, text, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["admin", "user", "guest"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: roleEnum("role").default("user").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body"),
  authorId: integer("author_id").notNull().references(() => users.id),
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  postId: integer("post_id").notNull().references(() => posts.id),
  authorId: integer("author_id").notNull().references(() => users.id),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
```

---

## Basic CRUD

```ts
import { db } from "./db.js";
import { users, posts } from "./schema.js";
import { eq } from "drizzle-orm";

// CREATE: insert with returning
const [newUser] = await db.insert(users).values({
  name: "Alice",
  email: "alice@example.com",
  role: "user",
}).returning();
// newUser.id is populated from the serial sequence

// READ: select by id
const [user] = await db.select().from(users).where(eq(users.id, newUser.id));
// undefined if not found

// READ: get specific columns
const names = await db
  .select({ id: users.id, name: users.name, email: users.email })
  .from(users)
  .where(eq(users.role, "user"));

// UPDATE: with returning
const [updated] = await db
  .update(users)
  .set({ name: "Alice Smith" })
  .where(eq(users.id, newUser.id))
  .returning();

// DELETE: with returning
const [deleted] = await db
  .delete(users)
  .where(eq(users.id, newUser.id))
  .returning({ id: users.id });
```

---

## Pagination

```ts
import { db } from "./db.js";
import { users } from "./schema.js";
import { count, asc } from "drizzle-orm";

async function getUsers(page: number, pageSize: number = 20) {
  const offset = page * pageSize;

  const [items, [{ total }]] = await Promise.all([
    db.select()
      .from(users)
      .orderBy(asc(users.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ total: count() }).from(users),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    hasNext: offset + pageSize < total,
    hasPrev: page > 0,
  };
}

// Usage
const page0 = await getUsers(0, 20);
// { items: User[], total: number, page: 0, totalPages: number, ... }
```

---

## Upsert (Insert or Update)

```ts
import { db } from "./db.js";
import { users } from "./schema.js";
import { sql } from "drizzle-orm";

// Upsert by email: update name if email already exists
const [upserted] = await db
  .insert(users)
  .values({ name: "Bob", email: "bob@example.com", role: "user" })
  .onConflictDoUpdate({
    target: users.email,           // conflict target (unique column)
    set: {
      name: sql`excluded.name`,    // use the incoming (excluded) value
    },
  })
  .returning();

// Upsert with explicit set values
await db
  .insert(users)
  .values({ name: "Carol", email: "carol@example.com", role: "user" })
  .onConflictDoUpdate({
    target: users.email,
    set: { name: "Carol Updated", isActive: true },
  });

// Do nothing on conflict (ignore duplicates)
await db
  .insert(users)
  .values({ name: "Dave", email: "existing@example.com", role: "user" })
  .onConflictDoNothing();
```

---

## Batch Insert

```ts
import { db } from "./db.js";
import { users } from "./schema.js";
import type { NewUser } from "./schema.js";

// Batch insert multiple rows in one statement
const newUsers: NewUser[] = [
  { name: "Alice", email: "alice@example.com", role: "user" },
  { name: "Bob",   email: "bob@example.com",   role: "user" },
  { name: "Carol", email: "carol@example.com",  role: "admin" },
];

const inserted = await db.insert(users).values(newUsers).returning();
// inserted: User[]  -- one entry per row

// Batch insert with chunking (for very large arrays)
async function batchInsert<T extends Record<string, unknown>>(
  table: any,
  rows: T[],
  chunkSize = 500,
): Promise<void> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await db.insert(table).values(chunk);
  }
}

await batchInsert(users, newUsers, 100);
```

---

## Transactions

```ts
import { db } from "./db.js";
import { users, posts } from "./schema.js";
import { eq } from "drizzle-orm";

// Example: create user + initial post in one atomic operation
async function createUserWithPost(
  userName: string,
  userEmail: string,
  postTitle: string,
) {
  return await db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values({
      name: userName,
      email: userEmail,
    }).returning();

    const [post] = await tx.insert(posts).values({
      title: postTitle,
      authorId: user.id,
    }).returning();

    return { user, post };
  });
}

// Transfer example: atomic debit + credit
async function transferCredits(fromId: number, toId: number, amount: number) {
  await db.transaction(async (tx) => {
    const [fromUser] = await tx.select().from(users).where(eq(users.id, fromId));
    if (!fromUser) tx.rollback();

    await tx.update(users).set({ credits: sql`credits - ${amount}` }).where(eq(users.id, fromId));
    await tx.update(users).set({ credits: sql`credits + ${amount}` }).where(eq(users.id, toId));
  }, { isolationLevel: "serializable" });
}
```

---

## Dynamic WHERE (Search API)

```ts
import { db } from "./db.js";
import { users } from "./schema.js";
import { SQL, and, eq, like, ilike, gte, lte, asc, desc, count } from "drizzle-orm";
import type { User } from "./schema.js";

interface SearchUsersParams {
  name?: string;
  email?: string;
  role?: "admin" | "user" | "guest";
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "createdAt";
  sortOrder?: "asc" | "desc";
}

async function searchUsers(params: SearchUsersParams) {
  const {
    name, email, role, isActive,
    page = 0, pageSize = 20,
    sortBy = "createdAt", sortOrder = "desc",
  } = params;

  // Build filter conditions dynamically
  const conditions: SQL[] = [];
  if (name)     conditions.push(ilike(users.name, `%${name}%`));
  if (email)    conditions.push(ilike(users.email, `%${email}%`));
  if (role)     conditions.push(eq(users.role, role));
  if (isActive !== undefined) conditions.push(eq(users.isActive, isActive));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const orderCol = sortBy === "name" ? users.name : users.createdAt;
  const orderDir = sortOrder === "asc" ? asc(orderCol) : desc(orderCol);

  const [items, [{ total }]] = await Promise.all([
    db.select()
      .from(users)
      .where(where)
      .orderBy(orderDir)
      .limit(pageSize)
      .offset(page * pageSize),
    db.select({ total: count() }).from(users).where(where),
  ]);

  return { items, total, page, pageSize };
}

// Usage
const results = await searchUsers({
  role: "user",
  isActive: true,
  name: "alice",
  page: 0,
  pageSize: 10,
  sortBy: "name",
  sortOrder: "asc",
});
```

---

## Multi-Table JOIN with RQB

```ts
import { db } from "./db.js";

// Load users with their posts (only published) and each post comments with author info
const usersWithContent = await db.query.users.findMany({
  where: (users, { eq }) => eq(users.isActive, true),
  orderBy: (users, { asc }) => [asc(users.name)],
  columns: {
    id: true,
    name: true,
    email: true,
  },
  with: {
    posts: {
      where: (posts, { eq }) => eq(posts.published, true),
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
      columns: { id: true, title: true, createdAt: true },
      with: {
        comments: {
          columns: { id: true, text: true },
          with: {
            author: { columns: { id: true, name: true } },
          },
        },
      },
    },
  },
});

// type of usersWithContent:
// {
//   id: number;
//   name: string;
//   email: string;
//   posts: {
//     id: number;
//     title: string;
//     createdAt: Date;
//     comments: {
//       id: number;
//       text: string;
//       author: { id: number; name: string };
//     }[];
//   }[];
// }[]

// Alternative: Core JOIN (for complex custom queries)
import { eq, desc } from "drizzle-orm";
import { users, posts, comments } from "./schema.js";

const joinResult = await db
  .select({
    userId: users.id,
    userName: users.name,
    postTitle: posts.title,
    commentText: comments.text,
  })
  .from(users)
  .innerJoin(posts, eq(posts.authorId, users.id))
  .leftJoin(comments, eq(comments.postId, posts.id))
  .where(eq(posts.published, true))
  .orderBy(desc(posts.createdAt));
```

---

## Aggregate Stats Query

```ts
import { db } from "./db.js";
import { users, posts } from "./schema.js";
import { count, countDistinct, avg, sum, min, max, eq, and } from "drizzle-orm";

// Dashboard stats: users total + active + roles breakdown
async function getDashboardStats() {
  const [stats] = await db.select({
    totalUsers: count(),
    activeUsers: count(users.isActive),   // counts non-null values
    distinctRoles: countDistinct(users.role),
  }).from(users);

  // Posts per author with avg
  const postStats = await db
    .select({
      authorId: posts.authorId,
      postCount: count(),
    })
    .from(posts)
    .where(eq(posts.published, true))
    .groupBy(posts.authorId)
    .orderBy(count());

  return { stats, postStats };
}

// Role distribution
const roleStats = await db
  .select({ role: users.role, count: count() })
  .from(users)
  .groupBy(users.role);
// [{ role: "admin", count: 5 }, { role: "user", count: 100 }, ...]
```
