# Drizzle ORM v0.38 Query Reference

> Sources: https://orm.drizzle.team/docs/select | https://orm.drizzle.team/docs/insert | https://orm.drizzle.team/docs/update | https://orm.drizzle.team/docs/delete | https://orm.drizzle.team/docs/joins | https://orm.drizzle.team/docs/rqb | https://orm.drizzle.team/docs/dynamic-query-building | https://orm.drizzle.team/docs/prepared-statements

## TOC

1. [Setup / db instance](#setup--db-instance)
2. [SELECT](#select)
3. [INSERT](#insert)
4. [UPDATE](#update)
5. [DELETE](#delete)
6. [JOINs](#joins)
7. [Operators & Filters](#operators--filters)
8. [Aggregation](#aggregation)
9. [sql Template Tag](#sql-template-tag)
10. [Relational Query Builder (RQB)](#relational-query-builder-rqb)
11. [.$dynamic() Query Builder](#dynamic-query-builder)
12. [Prepared Statements](#prepared-statements)

---

## Setup / db instance

```ts
// postgres.js (recommended for this project)
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const queryClient = postgres(process.env.DATABASE_URL!);
export const db = drizzle(queryClient, { schema });
// schema is needed only for RQB (db.query.*)
```

---

## SELECT

### Basic select

```ts
import { db } from "./db.js";
import { users } from "./schema.js";

// Select all columns
const allUsers = await db.select().from(users);
// type: { id: number; name: string; age: number | null }[]

// Select specific columns
const names = await db.select({ id: users.id, name: users.name }).from(users);
```

### WHERE

```ts
import { eq, ne, gt, gte, lt, lte, isNull, isNotNull, like, ilike, inArray, notInArray, between, and, or, not } from "drizzle-orm";

await db.select().from(users).where(eq(users.id, 1));
await db.select().from(users).where(ne(users.role, "admin"));
await db.select().from(users).where(gt(users.age, 18));
await db.select().from(users).where(isNull(users.age));
await db.select().from(users).where(like(users.name, "%John%"));
await db.select().from(users).where(ilike(users.email, "%@example.com"));
await db.select().from(users).where(inArray(users.id, [1, 2, 3]));
await db.select().from(users).where(between(users.age, 18, 65));

// Compound conditions
await db.select().from(users).where(
  and(eq(users.role, "user"), gt(users.age, 18))
);
await db.select().from(users).where(
  or(eq(users.role, "admin"), eq(users.role, "superadmin"))
);
```

### ORDER BY, LIMIT, OFFSET

```ts
import { asc, desc } from "drizzle-orm";

await db.select().from(users)
  .orderBy(asc(users.name))
  .limit(20)
  .offset(0);

// Multiple sort columns
await db.select().from(users)
  .orderBy(desc(users.createdAt), asc(users.name));
```

### Distinct

```ts
await db.selectDistinct({ role: users.role }).from(users);
await db.selectDistinctOn([users.role], { role: users.role, id: users.id }).from(users);
```

### Subquery

```ts
// Subquery as column
const postCount = db.$count(posts, eq(posts.authorId, users.id));
await db.select({ id: users.id, name: users.name, postCount }).from(users);

// Subquery in WHERE
const activeUserIds = db.select({ id: users.id }).from(users).where(eq(users.isActive, true));
await db.select().from(posts).where(inArray(posts.authorId, activeUserIds));

// Named subquery (sq)
const sq = db.select({ authorId: posts.authorId, count: count() }).from(posts).groupBy(posts.authorId).as("sq");
await db.select().from(sq).where(gt(sq.count, 5));
```

---

## INSERT

### Single row

```ts
import { db } from "./db.js";
import { users } from "./schema.js";

const inserted = await db.insert(users).values({
  name: "Alice",
  age: 30,
}).returning();
// type: { id: number; name: string; age: number | null }[]

// Without returning (fire and forget)
await db.insert(users).values({ name: "Bob" });
```

### Batch insert (multiple rows)

```ts
await db.insert(users).values([
  { name: "Alice", age: 30 },
  { name: "Bob", age: 25 },
  { name: "Charlie", age: 35 },
]);
```

### ON CONFLICT

```ts
import { sql } from "drizzle-orm";

// Upsert: update on conflict
await db.insert(users)
  .values({ id: 1, name: "Alice", age: 30 })
  .onConflictDoUpdate({
    target: users.id,          // conflict target column(s)
    set: { name: "Alice Updated", age: 31 },
  });

// Upsert using excluded (incoming) values
await db.insert(users)
  .values({ id: 1, name: "Alice", age: 30 })
  .onConflictDoUpdate({
    target: users.id,
    set: {
      name: sql`excluded.name`,
      age: sql`excluded.age`,
    },
  });

// Do nothing on conflict
await db.insert(users).values({ name: "Alice" }).onConflictDoNothing();
await db.insert(users).values({ name: "Alice" }).onConflictDoNothing({ target: users.email });
```

---

## UPDATE

```ts
import { db } from "./db.js";
import { users } from "./schema.js";
import { eq } from "drizzle-orm";

// Basic update
await db.update(users)
  .set({ name: "Alice Updated", age: 31 })
  .where(eq(users.id, 1));

// Update with returning
const updated = await db.update(users)
  .set({ name: "Alice Updated" })
  .where(eq(users.id, 1))
  .returning();

// Increment using sql template
import { sql } from "drizzle-orm";
await db.update(users)
  .set({ age: sql`${users.age} + 1` })
  .where(eq(users.id, 1));
```

---

## DELETE

```ts
import { db } from "./db.js";
import { users } from "./schema.js";
import { eq, lt } from "drizzle-orm";

// Delete with condition
await db.delete(users).where(eq(users.id, 1));

// Delete with returning
const deleted = await db.delete(users)
  .where(eq(users.id, 1))
  .returning({ id: users.id });

// Delete all rows (no WHERE = truncate equivalent)
await db.delete(users);
```

---

## JOINs

All join methods are on the select query builder. Import tables from schema.

```ts
import { db } from "./db.js";
import { users, posts, comments } from "./schema.js";
import { eq } from "drizzle-orm";

// INNER JOIN
const result = await db.select({
  userId: users.id,
  userName: users.name,
  postTitle: posts.title,
}).from(users)
  .innerJoin(posts, eq(posts.authorId, users.id));

// LEFT JOIN (nullable right side)
await db.select().from(users)
  .leftJoin(posts, eq(posts.authorId, users.id));

// RIGHT JOIN
await db.select().from(users)
  .rightJoin(posts, eq(posts.authorId, users.id));

// FULL JOIN
await db.select().from(users)
  .fullJoin(posts, eq(posts.authorId, users.id));

// CROSS JOIN
await db.select().from(users).crossJoin(posts);

// Multiple joins
await db.select({
  userId: users.id,
  postTitle: posts.title,
  commentText: comments.text,
}).from(users)
  .innerJoin(posts, eq(posts.authorId, users.id))
  .leftJoin(comments, eq(comments.postId, posts.id));
```

---

## Operators & Filters

All imported from `drizzle-orm`.

| Operator | SQL equivalent | Notes |
|----------|---------------|-------|
| `eq(col, val)` | `col = val` | |
| `ne(col, val)` | `col != val` | |
| `gt(col, val)` | `col > val` | |
| `gte(col, val)` | `col >= val` | |
| `lt(col, val)` | `col < val` | |
| `lte(col, val)` | `col <= val` | |
| `isNull(col)` | `col IS NULL` | |
| `isNotNull(col)` | `col IS NOT NULL` | |
| `like(col, pattern)` | `col LIKE pattern` | case-sensitive |
| `ilike(col, pattern)` | `col ILIKE pattern` | case-insensitive (PG) |
| `notIlike(col, pattern)` | `col NOT ILIKE pattern` | |
| `inArray(col, arr)` | `col IN (...)` | arr: value[] or subquery |
| `notInArray(col, arr)` | `col NOT IN (...)` | |
| `between(col, min, max)` | `col BETWEEN min AND max` | inclusive |
| `notBetween(col, min, max)` | `col NOT BETWEEN min AND max` | |
| `and(...conditions)` | `cond1 AND cond2 ...` | variadic |
| `or(...conditions)` | `cond1 OR cond2 ...` | variadic |
| `not(condition)` | `NOT condition` | |
| `exists(subquery)` | `EXISTS (subquery)` | |
| `notExists(subquery)` | `NOT EXISTS (subquery)` | |

```ts
import { eq, and, or, like, inArray, isNull, not, exists } from "drizzle-orm";

// Dynamic nullable filter
const nameFilter = name ? like(users.name, `%${name}%`) : undefined;
await db.select().from(users).where(and(eq(users.role, "user"), nameFilter));

// EXISTS
const usersWithPosts = await db.select().from(users).where(
  exists(db.select().from(posts).where(eq(posts.authorId, users.id)))
);
```

---

## Aggregation

Import aggregation functions from `drizzle-orm`.

```ts
import { count, sum, avg, min, max, countDistinct } from "drizzle-orm";
import { db } from "./db.js";
import { users, posts } from "./schema.js";
import { eq, gt } from "drizzle-orm";

// COUNT
const [{ total }] = await db.select({ total: count() }).from(users);
const [{ byCol }] = await db.select({ byCol: count(users.age) }).from(users);
const [{ distinct }] = await db.select({ distinct: countDistinct(users.role) }).from(users);

// SUM / AVG / MIN / MAX
const [stats] = await db.select({
  totalAge: sum(users.age),   // returns string | null
  avgAge: avg(users.age),     // returns string | null
  minAge: min(users.age),
  maxAge: max(users.age),
}).from(users);

// GROUP BY
const postsByAuthor = await db
  .select({ authorId: posts.authorId, count: count() })
  .from(posts)
  .groupBy(posts.authorId);

// GROUP BY + HAVING
const prolificAuthors = await db
  .select({ authorId: posts.authorId, count: count() })
  .from(posts)
  .groupBy(posts.authorId)
  .having(gt(count(), 5));
```

---

## sql Template Tag

`sql` is a tagged template function for injecting raw SQL safely (values are parameterized). Imported from `drizzle-orm`.

```ts
import { sql } from "drizzle-orm";

// Raw SQL in WHERE
await db.select().from(users).where(sql`${users.age} > 18`);

// Raw SQL as column expression
await db.select({
  id: users.id,
  nameUpper: sql<string>`upper(${users.name})`,
}).from(users);

// Raw SQL in SET clause (UPDATE)
await db.update(users).set({ age: sql`${users.age} + 1` }).where(eq(users.id, 1));

// Arbitrary raw query
const result = await db.execute(sql`SELECT version()`);

// sql.raw: inject raw SQL without parameterization (DANGER: only for trusted strings)
const tableName = "users";
await db.execute(sql`SELECT * FROM ${sql.raw(tableName)}`);
```

---

## Relational Query Builder (RQB)

RQB uses `db.query.*` API. Requires:
1. Relations defined via `relations()` in schema
2. `drizzle(client, { schema })` — schema passed at db creation

### findMany

```ts
import { db } from "./db.js";

// Basic findMany
const allUsers = await db.query.users.findMany();

// With columns (partial selection)
const users = await db.query.users.findMany({
  columns: { id: true, name: true },   // include these
});

// With: eager load relations
const usersWithPosts = await db.query.users.findMany({
  with: {
    posts: true,                        // load all posts
  },
});

// Nested with
const usersWithPostsAndTags = await db.query.users.findMany({
  with: {
    posts: {
      with: {
        postsTags: {
          with: { tag: true },
        },
      },
    },
  },
});

// WHERE + ORDER + LIMIT in RQB
const activeUsers = await db.query.users.findMany({
  where: (users, { eq }) => eq(users.isActive, true),
  orderBy: (users, { desc }) => [desc(users.createdAt)],
  limit: 10,
  offset: 0,
});

// columns: false to exclude a column
const usersNoPassword = await db.query.users.findMany({
  columns: { passwordHash: false },    // exclude one column
});

// extras: computed columns
const usersWithFullName = await db.query.users.findMany({
  extras: {
    fullName: sql<string>`${users.firstName} || " " || ${users.lastName}`.as("full_name"),
  },
});
```

### findFirst

```ts
// Returns first matching row or undefined
const user = await db.query.users.findFirst({
  where: (users, { eq }) => eq(users.id, 1),
  with: { posts: true },
});
// type: { id: number; name: string; posts: Post[] } | undefined
```

---

## .$dynamic() Query Builder

Enables conditional/dynamic composition of queries. Useful for building search/filter APIs.

```ts
import { db } from "./db.js";
import { users } from "./schema.js";
import { SQL, and, eq, like, gt, PgSelect } from "drizzle-orm";

// Helper to narrow dynamic query type
function withPagination<T extends PgSelect>(
  qb: T,
  page: number,
  pageSize: number = 20,
): T {
  return qb.limit(pageSize).offset(page * pageSize) as T;
}

// Build query dynamically
async function searchUsers(params: {
  name?: string;
  role?: string;
  minAge?: number;
  page?: number;
}) {
  const filters: SQL[] = [];
  if (params.name)   filters.push(like(users.name, `%${params.name}%`));
  if (params.role)   filters.push(eq(users.role, params.role));
  if (params.minAge) filters.push(gt(users.age, params.minAge));

  const qb = db.select().from(users).$dynamic();
  return withPagination(
    qb.where(and(...filters)),
    params.page ?? 0,
  );
}

// Usage
const results = await searchUsers({ name: "Alice", minAge: 18, page: 0 });
```

---

## Prepared Statements

Prepared statements parse the query once and cache the plan. Use `placeholder()` from `drizzle-orm` for parameters.

```ts
import { db } from "./db.js";
import { users } from "./schema.js";
import { eq, placeholder } from "drizzle-orm";

// Define prepared statement
const getUserById = db
  .select()
  .from(users)
  .where(eq(users.id, placeholder("userId")))
  .prepare("get_user_by_id");

// Execute with parameters
const user = await getUserById.execute({ userId: 1 });
const user2 = await getUserById.execute({ userId: 2 });

// Prepared INSERT
const insertUser = db
  .insert(users)
  .values({ name: placeholder("name"), age: placeholder("age") })
  .returning()
  .prepare("insert_user");

const newUser = await insertUser.execute({ name: "Alice", age: 30 });

// Prepared UPDATE
const deactivateUser = db
  .update(users)
  .set({ isActive: false })
  .where(eq(users.id, placeholder("id")))
  .prepare("deactivate_user");

await deactivateUser.execute({ id: 5 });
```
