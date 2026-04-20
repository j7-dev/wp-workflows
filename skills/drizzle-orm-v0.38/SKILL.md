---
name: drizzle-orm-v0.38
description: >
  drizzle-orm v0.38 與 drizzle-kit v0.31 的完整技術參考（PostgreSQL 方言，postgres.js driver）。
  涵蓋所有 Schema 定義 API、Query Builder（select/insert/update/delete）、Relational Query API、
  Transactions、Migrations、Drizzle Kit CLI 與 TypeScript 型別推斷。
  當用戶的程式碼涉及 drizzle-orm、pgTable、drizzle、db.select、db.insert、db.update、db.delete、
  db.query、db.transaction、relations、drizzle-kit、drizzle.config.ts、migration、schema definition、
  InferSelectModel、InferInsertModel、$inferSelect、$inferInsert、eq、and、or、inArray、
  leftJoin、innerJoin、onConflictDoUpdate、findFirst、findMany 等任何關鍵字時，
  必須使用此 skill 而不是去搜尋 web。
  此 skill 對應 drizzle-orm v0.38.x 與 drizzle-kit v0.31.x，PostgreSQL 方言。
---

# drizzle-orm v0.38 + drizzle-kit v0.31

> **適用版本**: drizzle-orm ^0.38.4、drizzle-kit ^0.31.9
> **方言**: PostgreSQL（postgres.js driver）
> **文件來源**: https://orm.drizzle.team/docs/
> **最後更新**: 2025-03

Drizzle ORM 是一個 headless TypeScript ORM，同時提供 SQL-like Query Builder 與 Relational Query API。
核心設計理念：讓開發者以熟悉的 SQL 思維操作資料庫，並生成精確的單一 SQL 查詢。

---

## 連線設定（postgres.js driver）

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// 方式一：直接傳 URL
const db = drizzle(process.env.DATABASE_URL!);

// 方式二：傳已存在的 client（專案常用）
const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle({ client: queryClient, schema });

// 方式三：帶 schema 做 Relational Query
const db = drizzle({ connection: { url: process.env.DATABASE_URL! }, schema });
```

---

## 核心 API 速查

### Schema 定義

```typescript
import { pgTable, pgEnum, text, integer, boolean, timestamp, uuid, jsonb, serial, varchar } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

// 基本表格定義
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: text('role').$type<'admin' | 'user'>().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Enum 類型
export const statusEnum = pgEnum('status', ['active', 'inactive', 'pending']);
```

### 查詢（Select）

```typescript
import { eq, and, or, desc, asc, inArray, isNull, like, gt, lt, count, sql } from 'drizzle-orm';

// 基本查詢
const users = await db.select().from(usersTable);
const user = await db.select({ id: usersTable.id, name: usersTable.name })
  .from(usersTable)
  .where(eq(usersTable.id, userId))
  .limit(1);

// 複合條件
const result = await db.select()
  .from(usersTable)
  .where(and(eq(usersTable.status, 'active'), gt(usersTable.age, 18)))
  .orderBy(desc(usersTable.createdAt))
  .limit(10)
  .offset(20);
```

### 寫入（Insert）

```typescript
// 單筆
const [newUser] = await db.insert(usersTable)
  .values({ name: 'Alice', email: 'alice@example.com' })
  .returning();

// Upsert（衝突時更新）
await db.insert(usersTable)
  .values({ id: 'uuid-1', name: 'Bob' })
  .onConflictDoUpdate({
    target: usersTable.id,
    set: { name: 'Bob Updated', updatedAt: sql`NOW()` },
  });
```

### 更新（Update）

```typescript
const [updated] = await db.update(usersTable)
  .set({ name: 'New Name', updatedAt: sql`NOW()` })
  .where(eq(usersTable.id, userId))
  .returning();
```

### 刪除（Delete）

```typescript
const deleted = await db.delete(usersTable)
  .where(eq(usersTable.id, userId))
  .returning();
```

### 交易（Transactions）

```typescript
await db.transaction(async (tx) => {
  const [user] = await tx.insert(usersTable).values({ name: 'Alice' }).returning();
  await tx.insert(profilesTable).values({ userId: user.id });
});
```

---

## TypeScript 型別推斷

```typescript
// 從表格推斷型別（推薦）
type SelectUser = typeof usersTable.$inferSelect;
type InsertUser = typeof usersTable.$inferInsert;

// 使用工具型別
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
type SelectUser = InferSelectModel<typeof usersTable>;
type InsertUser = InferInsertModel<typeof usersTable>;
```

---

## Relational Query API（findFirst / findMany）

```typescript
// 需要在連線時傳入 schema
const db = drizzle({ client, schema });

// 查詢含關聯資料
const user = await db.query.users.findFirst({
  where: (users, { eq }) => eq(users.id, userId),
  with: {
    posts: {
      limit: 5,
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    },
  },
  columns: {
    id: true,
    name: true,
  },
});
```

---

## 常見陷阱與注意事項

| 陷阱 | 說明 |
|------|------|
| `db.query.*` 需要 schema | 初始化 `drizzle()` 時必須傳入 `schema` 參數，否則 `db.query` 不可用 |
| `returning()` 回傳陣列 | `.returning()` 永遠回傳陣列，解構第一個元素取得單筆：`const [row] = await ...` |
| `undefined` vs `null` | `.set({ field: undefined })` 不會更新該欄位；必須用 `null` |
| `bigint` 模式 | `bigint({ mode: 'number' })` 用 JS number；`mode: 'bigint'` 用 BigInt |
| 自參照 FK 需要型別標注 | `references((): AnyPgColumn => table.id)` 避免 TS 循環推斷 |
| `onConflictDoUpdate` set | 使用 sql 引用 excluded 值：set: { name: sql`excluded.name` } |
| postgres.js prepared statements | 在 AWS Lambda 等環境可能需要 { prepare: false } |

---

## References 導引

| 需求 | 參閱檔案 |
|------|---------|
| 完整 PostgreSQL 欄位型別（所有選項、API） | `references/schema-reference.md` |
| Schema 定義、relations、indexes、constraints | `references/schema-reference.md` |
| 完整 Query API（select/insert/update/delete/joins/operators） | `references/query-reference.md` |
| Relational Query API（findFirst/findMany/with/columns） | `references/query-reference.md` |
| drizzle-kit CLI、drizzle.config.ts、程式化 migrate() | `references/migrations-reference.md` |
| 完整可執行範例 | `references/examples.md` |
