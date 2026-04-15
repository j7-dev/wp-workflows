# Red Variant: nodejs-it

## 測試框架

- **語言**：TypeScript 5+（Node.js 20+）
- **BDD 框架**：Cucumber.js 10+（Cucumber Expressions）
- **HTTP Client**：Supertest 7+
- **ORM**：Drizzle ORM 0.38+
- **資料庫**：PostgreSQL 16（透過 @testcontainers/postgresql 啟動）
- **認證**：JWT Token（自訂 JwtHelper）
- **測試執行**：`npx cucumber-js ${NODE_TEST_FEATURES_DIR}/{feature_file}`
- **紅燈失敗原因**：HTTP 404 Not Found（後端 API 尚未實作）

## 檔案結構

```
${NODE_APP_DIR}/
├── db/
│   ├── schema.ts                  # Drizzle ORM Schema（pgTable 定義）
│   ├── index.ts                   # DB connection factory
│   └── migrations/                # drizzle-kit 生成的 SQL migration
├── repositories/                  # Drizzle Repositories（生產環境）
│   ├── index.ts
│   └── {aggregate}-repository.ts
├── services/                      # Services（紅燈不實作）
├── routes/                        # Express routes（紅燈不實作）
├── middleware/
│   ├── jwt-auth.ts                # JWT 驗證 middleware
│   └── error-handler.ts           # 全域錯誤處理
├── schemas/                       # Zod validation schemas
├── errors.ts                      # BusinessError, NotFoundError
└── app.ts                         # Express app factory

${NODE_TEST_FEATURES_DIR}/
├── support/
│   ├── world.ts                   # Cucumber World class（TestWorld）
│   ├── hooks.ts                   # Testcontainers 生命週期 + 狀態初始化
│   └── jwt-helper.ts              # 測試用 JWT Token 產生器
├── steps/                         # Step Definitions
│   ├── {subdomain}/               # 按業務領域分
│   │   ├── aggregate_given/
│   │   ├── commands/
│   │   ├── query/
│   │   ├── aggregate_then/
│   │   └── readmodel_then/
│   └── common_then/               # 跨 subdomain 共用（操作成功/失敗）
└── *.feature                      # Feature files（symlink）
```

**一個 Step Pattern 對應一個 `.ts` 檔案**，檔案內只放一個 step function。

## 程式碼模式

### 依賴注入機制

所有依賴透過 Cucumber World 物件（`this`）傳遞，在 `hooks.ts` 的 `Before` hook 中初始化：

```typescript
// ${NODE_HOOKS_FILE}
Before(async function (this: TestWorld) {
  // 狀態
  this.lastResponse = null;
  this.lastError = null;
  this.queryResult = null;
  this.ids = {};
  this.memo = {};

  // 依賴
  this.db = db;                                    // Drizzle ORM instance
  this.app = createApp(db);                        // Express app
  this.jwtHelper = new JwtHelper('test-secret');   // JWT helper
});
```

### Step Definition 範例

函數使用 `this: TestWorld` 型別標註，後接 pattern 解析的參數。所有 step 函數必須是 `async`。

```typescript
import { Given } from '@cucumber/cucumber';
import { TestWorld } from '../../support/world';

Given('用戶 {string} 在課程 {int} 的進度為 {int}%，狀態為 {string}',
  async function (this: TestWorld, userName: string, lessonId: number, progress: number, status: string) {
    // ...
  }
);
```

Cucumber Expressions 參數類型：
- `{string}` — 字串（帶引號 "..."）
- `{int}` — 整數
- `{float}` — 浮點數
- `{word}` — 單字（不帶引號）

### Handler 實作範例

#### Aggregate-Given（建立前置資料 — 寫入 DB）

```typescript
import { Given } from '@cucumber/cucumber';
import { TestWorld } from '../../support/world';
import { cartItems } from '../../../src/db/schema';

Given('用戶 {string} 的購物車中商品 {string} 的數量為 {int}',
  async function (this: TestWorld, userName: string, productId: string, quantity: number) {
    const userId = this.ids[userName];
    if (!userId) throw new Error(`找不到用戶 '${userName}' 的 ID，請先建立用戶`);

    await this.db.insert(cartItems).values({
      userId: String(userId),
      productId,
      quantity,
    });
  }
);
```

DataTable 版本：

```typescript
import { Given, DataTable } from '@cucumber/cucumber';
import { TestWorld } from '../../support/world';
import { users } from '../../../src/db/schema';

Given('系統中有以下用戶：',
  async function (this: TestWorld, dataTable: DataTable) {
    const rows = dataTable.hashes();
    for (const row of rows) {
      const [inserted] = await this.db.insert(users).values({
        id: parseInt(row['userId']),
        name: row['name'],
        email: row['email'],
      }).returning();
      this.ids[row['name']] = inserted.id;
    }
  }
);
```

#### Command（執行 HTTP API）

```typescript
import { When } from '@cucumber/cucumber';
import supertest from 'supertest';
import { TestWorld } from '../../support/world';

When('用戶 {string} 更新課程 {int} 的影片進度為 {int}%',
  async function (this: TestWorld, userName: string, lessonId: number, progress: number) {
    const userId = this.ids[userName];
    if (!userId) throw new Error(`找不到用戶 '${userName}' 的 ID`);

    const token = this.jwtHelper.generateToken(String(userId));

    this.lastResponse = await supertest(this.app)
      .post('/api/v1/lesson-progress/update-video-progress')
      .set('Authorization', `Bearer ${token}`)
      .send({ lessonId, progress });
  }
);
```

#### Query（執行 HTTP GET API）

```typescript
import { When } from '@cucumber/cucumber';
import supertest from 'supertest';
import { TestWorld } from '../../support/world';

When('用戶 {string} 查詢課程 {int} 的進度',
  async function (this: TestWorld, userName: string, lessonId: number) {
    const userId = this.ids[userName];
    if (!userId) throw new Error(`找不到用戶 '${userName}' 的 ID`);

    const token = this.jwtHelper.generateToken(String(userId));

    this.lastResponse = await supertest(this.app)
      .get(`/api/v1/lessons/${lessonId}/progress`)
      .set('Authorization', `Bearer ${token}`);
  }
);
```

有 Query Parameters 時：

```typescript
this.lastResponse = await supertest(this.app)
  .get('/api/v1/journeys/1/lessons')
  .query({ chapter_id: 2 })
  .set('Authorization', `Bearer ${token}`);
```

#### Aggregate-Then（驗證 DB 狀態）

```typescript
import { Then } from '@cucumber/cucumber';
import assert from 'assert/strict';
import { eq, and } from 'drizzle-orm';
import { TestWorld } from '../../support/world';
import { lessonProgress } from '../../../src/db/schema';

Then('用戶 {string} 在課程 {int} 的進度應為 {int}%',
  async function (this: TestWorld, userName: string, lessonId: number, expectedProgress: number) {
    const userId = this.ids[userName];
    if (!userId) throw new Error(`找不到用戶 '${userName}' 的 ID`);

    const [row] = await this.db.select().from(lessonProgress)
      .where(and(
        eq(lessonProgress.userId, String(userId)),
        eq(lessonProgress.lessonId, lessonId)
      ));

    assert.ok(row, '找不到課程進度');
    assert.strictEqual(row.progress, expectedProgress,
      `預期進度 ${expectedProgress}%，實際 ${row.progress}%`);
  }
);
```

#### ReadModel-Then（驗證 HTTP Response）

```typescript
import { Then } from '@cucumber/cucumber';
import assert from 'assert/strict';
import { TestWorld } from '../../support/world';

const STATUS_MAP: Record<string, string> = {
  '進行中': 'IN_PROGRESS',
  '已完成': 'COMPLETED',
  '未開始': 'NOT_STARTED',
};

Then('查詢結果應包含進度 {int}，狀態為 {string}',
  async function (this: TestWorld, progress: number, status: string) {
    assert.ok(this.lastResponse, '沒有 HTTP response');
    const data = this.lastResponse.body;

    const expectedStatus = STATUS_MAP[status] ?? status;

    assert.strictEqual(data.progress, progress,
      `預期進度 ${progress}，實際 ${data.progress}`);
    assert.strictEqual(data.status, expectedStatus,
      `預期狀態 ${expectedStatus}，實際 ${data.status}`);
  }
);
```

#### Success-Failure（驗證 HTTP Status Code）

```typescript
import { Then } from '@cucumber/cucumber';
import assert from 'assert/strict';
import { TestWorld } from '../../support/world';

Then('操作成功', function (this: TestWorld) {
  assert.ok(this.lastResponse, '沒有 HTTP response');
  const status = this.lastResponse.status;
  assert.ok(status >= 200 && status < 300,
    `預期成功（2XX），實際 ${status}`);
});

Then('操作失敗', function (this: TestWorld) {
  assert.ok(this.lastResponse, '沒有 HTTP response');
  const status = this.lastResponse.status;
  assert.ok(status >= 400 && status < 500,
    `預期失敗（4XX），實際 ${status}`);
});
```

## API 呼叫模式

- **HTTP Client**：`supertest(this.app)`（Supertest wrapping Express app）
- **認證**：`this.jwtHelper.generateToken(userId)` 產生 JWT，放在 `.set('Authorization', ...)` header
- **Command**：`supertest(this.app).post()` / `.put()` / `.patch()` / `.delete()`，response 存入 `this.lastResponse`
- **Query**：`supertest(this.app).get()`，response 存入 `this.lastResponse`
- **Path Parameters**：使用 template literal（`` `/api/v1/lessons/${lessonId}/progress` ``）
- **Query Parameters**：使用 `.query({ key: value })`

## 基礎設施定義

### Drizzle Schema（pgTable）

```typescript
// ${NODE_DB_SCHEMA}
import { pgTable, serial, varchar, integer, pgEnum, timestamp } from 'drizzle-orm/pg-core';

export const progressStatusEnum = pgEnum('progress_status', ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']);

export const lessonProgress = pgTable('lesson_progress', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  lessonId: integer('lesson_id').notNull(),
  progress: integer('progress').notNull().default(0),
  status: progressStatusEnum('status').notNull().default('NOT_STARTED'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### Repository

```typescript
// ${NODE_REPOSITORIES_DIR}/lesson-progress-repository.ts
import { eq, and } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { lessonProgress } from '../db/schema';

export class LessonProgressRepository {
  constructor(private db: NodePgDatabase) {}

  async save(data: typeof lessonProgress.$inferInsert) {
    const [result] = await this.db.insert(lessonProgress).values(data).returning();
    return result;
  }

  async findByUserAndLesson(userId: string, lessonId: number) {
    const [row] = await this.db.select().from(lessonProgress)
      .where(and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.lessonId, lessonId)
      ));
    return row ?? null;
  }
}
```

## 特殊規則

1. **API JSON 欄位命名**：必須與 `api.yml` schema 定義一致（api.yml 是 SSOT）。使用 camelCase（JavaScript 慣例）。
2. **API Endpoint Path**：必須嚴格遵循 `specs/api.yml`，透過 `summary` 欄位與 Gherkin 語句對應找到正確的 path 和 HTTP method。
3. **Drizzle 使用 `onConflictDoUpdate` 支援 upsert**：Repository save 方法若需要 upsert 語意，使用 `onConflictDoUpdate`。
4. **中文狀態映射**：Gherkin 中的中文狀態（如「進行中」）必須映射為英文 enum（如 `IN_PROGRESS`）。使用 `Record<string, string>` const 定義映射表。
5. **ID 儲存**：Given 建立的實體 ID 必須存入 `this.ids[naturalKey]`，後續 Command/Query 透過 `this.ids` 取得。
6. **不驗證 Response（Command）**：Command Handler 只儲存 response，不做 assert，驗證交給 Then。
7. **不重新呼叫 API（ReadModel-Then）**：使用 When 中儲存的 `this.lastResponse`，不重新發請求。
8. **Testcontainers 環境**：執行前需確認 Docker Desktop 已啟動。
9. **紅燈完成後移除 `@ignore` tag**：讓 feature file 可被回歸測試涵蓋。
10. **所有 step 函數必須是 async**：Cucumber.js 原生支援 async/await。
11. **TypeScript 嚴格模式**：所有變數需型別標註，避免 `any`，使用 Drizzle `$inferInsert` / `$inferSelect` 推導型別。
