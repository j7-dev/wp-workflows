---
name: aibdd.auto.typescript.api.red
description: TypeScript API Stage 2：紅燈生成器。建立 Route stub（回傳 501）+ Service interface（拋 NotImplementedError）+ 完整測試實作。預期失敗：Service 未實作。可被 /aibdd.auto.typescript.api.control-flow 調用，也可獨立使用。
user-invocable: true
argument-hint: "[feature-file]"
input: server/src/__tests__/{domain}.integration.test.ts（骨架）, specs/features/**/*.feature
output: server/src/__tests__/{domain}.integration.test.ts（完整）, server/src/routes/{domain}.ts（stub）, server/src/services/{domain}.ts（interface）
---

# 角色

API 紅燈生成器。將測試骨架（TODO 註解）轉換為可執行的整合測試程式碼，建立 Route stub 和 Service interface，生成紅燈測試。

---

# 入口條件

## 被 /aibdd.auto.typescript.api.control-flow 調用

接收測試骨架路徑，直接進入生成流程。

## 獨立使用

1. 詢問目標測試骨架路徑（預設掃描 `server/src/__tests__/*.integration.test.ts`）
2. 進入生成流程

---

# Core Task

測試骨架（TODO 註解）→ 可執行整合測試 + Route stub + Service interface（紅燈）

---

# 紅燈階段的核心原則

## API 整合測試的紅燈特色

| 面向 | 前端 E2E 紅燈 | API 整合測試紅燈 |
|------|-------------|----------------|
| 測試失敗原因 | 元件未實作（Playwright timeout） | **Service 拋 NotImplementedError** |
| 需要定義的東西 | MSW handlers, fixtures | **Route stub, Service interface, 測試 helpers** |
| 不需要定義的東西 | React 元件 | **Service 業務邏輯** |
| 測試框架 | Playwright + Cucumber | **Vitest + Supertest** |

## 要做的事
1. **完整實作測試程式碼**：Supertest 呼叫和 assertion 必須完整
2. **建立 Route stub**：正確的路由定義，呼叫 Service 方法
3. **建立 Service interface**：方法簽名正確，但拋出 NotImplementedError
4. **建立測試 helpers**：DB setup/teardown、Factory functions

## 不要做的事
1. **不要實作 Service 業務邏輯**：Service 在綠燈階段實作
2. **不要讓測試通過**：測試應該因為 Service 未實作而失敗
3. **不要跳過 DB setup**：測試需要的資料必須透過 Factory 建立

## 為什麼要這樣？

TDD 核心流程：
1. **紅燈**：寫測試 + Route stub + Service interface（測試失敗：Service 未實作）← 我們現在在這
2. **綠燈**：實作 Service 業務邏輯（測試通過）
3. **重構**：優化程式碼品質（測試持續通過）

---

# Output

## 1. 完整測試程式碼

依照 TODO 中的 Handler 指引生成對應的程式碼：

**Given 區塊（/aibdd.auto.typescript.api.handlers.aggregate-given）**：
- 使用 Factory 在 DB 建立測試資料
- 儲存 ID 到局部變數

**When + Command（/aibdd.auto.typescript.api.handlers.command）**：
- 使用 Supertest 發送 POST/PUT/PATCH/DELETE 請求
- 設定正確的 headers（Authorization, Content-Type）

**When + Query（/aibdd.auto.typescript.api.handlers.query）**：
- 使用 Supertest 發送 GET 請求
- 設定正確的 query parameters

**Then + Success/Failure（/aibdd.auto.typescript.api.handlers.success-failure）**：
- 驗證 `res.status` 和 error body

**Then + Aggregate（/aibdd.auto.typescript.api.handlers.aggregate-then）**：
- 使用 Drizzle ORM 查詢 DB 驗證資料狀態

**Then + ReadModel（/aibdd.auto.typescript.api.handlers.readmodel-then）**：
- 驗證 `res.body` 的欄位

## 2. Route Stub

```typescript
// server/src/routes/{domain}.ts
import { Router } from "express";
import type { Db } from "@paperclipai/db";

export function issueCheckoutRoutes(db: Db) {
  const router = Router();

  // Route stub：正確的路由定義，呼叫 Service
  router.post(
    "/companies/:companyId/issues/:issueId/checkout",
    async (req, res, next) => {
      try {
        const result = await issueService(db).checkout(
          req.params.companyId,
          req.params.issueId,
          req.body.agentId,
        );
        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
```

## 3. Service Interface

```typescript
// server/src/services/{domain}.ts
export function issueService(db: Db) {
  return {
    async checkout(companyId: string, issueId: string, agentId: string) {
      // 紅燈階段：拋出 NotImplementedError
      throw new Error("NotImplemented: issueService.checkout");
    },
  };
}
```

## 4. 測試 Helpers（如尚未存在）

```typescript
// server/src/__tests__/helpers/setup.ts
import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import express from "express";
import { errorHandler } from "../../middleware/error-handler.js";

export async function createTestDb() {
  const client = new PGlite();
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "../../packages/db/src/migrations" });
  return { db, client };
}

export function createTestApp(db: Db, routes: (db: Db) => Router) {
  const app = express();
  app.use(express.json());
  // 模擬 actor middleware（board user）
  app.use((req, _res, next) => {
    (req as any).actor = {
      type: "board",
      userId: "test-user-1",
      companyIds: ["test-company-1"],
      source: "session",
      isInstanceAdmin: false,
    };
    next();
  });
  app.use("/api", routes(db));
  app.use(errorHandler);
  return app;
}

export async function cleanAllTables(db: Db) {
  // 按照 FK 依賴順序清理
  // 使用 TRUNCATE ... CASCADE
}
```

```typescript
// server/src/__tests__/helpers/factories.ts
import type { Db } from "@paperclipai/db";
import { companies, agents, issues } from "@paperclipai/db/schema";

export const factory = {
  company: {
    async create(db: Db, overrides: Partial<typeof companies.$inferInsert> = {}) {
      const [record] = await db.insert(companies).values({
        name: "Test Company",
        slug: `test-${Date.now()}`,
        ...overrides,
      }).returning();
      return record;
    },
  },
  agent: {
    async create(db: Db, overrides: Partial<typeof agents.$inferInsert> = {}) {
      const [record] = await db.insert(agents).values({
        shortName: `agent-${Date.now()}`,
        adapterType: "claude-local",
        ...overrides,
      }).returning();
      return record;
    },
  },
  // ... 更多 factory
};
```

---

# Complete Example

## Input（測試骨架）

```typescript
it("Example: 成功 checkout issue 給 agent", async () => {
  // Arrange (Given)
  /*
   * TODO: [事件風暴部位: Aggregate - Agent]
   * TODO: 參考 /aibdd.auto.typescript.api.handlers.aggregate-given 實作
   */
  /*
   * TODO: [事件風暴部位: Command - checkout_issue]
   * TODO: 參考 /aibdd.auto.typescript.api.handlers.command 實作
   */
  // Assert (Then)
  /*
   * TODO: [事件風暴部位: Success - HTTP 200]
   * TODO: 參考 /aibdd.auto.typescript.api.handlers.success-failure 實作
   */
  expect(true).toBe(false);
});
```

## Output（完整測試）

```typescript
it("Example: 成功 checkout issue 給 agent", async () => {
  // Arrange (Given)
  const company = await factory.company.create(db);
  const agent = await factory.agent.create(db, { companyId: company.id });
  const issue = await factory.issue.create(db, {
    companyId: company.id,
    assigneeId: null,
  });

  // Act (When) - Command: checkout_issue
  const res = await request(app)
    .post(`/api/companies/${company.id}/issues/${issue.id}/checkout`)
    .send({ agentId: agent.id })
    .expect("Content-Type", /json/);

  // Assert (Then) - Success: HTTP 200
  expect(res.status).toBe(200);

  // Assert (Then) - Aggregate: 驗證 DB 狀態
  const [updated] = await db
    .select()
    .from(issues)
    .where(eq(issues.id, issue.id));
  expect(updated.assigneeId).toBe(agent.id);
});
```

## 預期結果：測試執行會失敗（紅燈）

```bash
$ pnpm vitest run server/src/__tests__/issue-checkout.integration.test.ts

 FAIL  server/src/__tests__/issue-checkout.integration.test.ts
  Feature: Issue Checkout
    Rule: 一個 issue 只能有一個 assignee
      ✗ Example: 成功 checkout issue 給 agent
        Error: NotImplemented: issueService.checkout
```

**這就是紅燈**：
- 測試程式碼完整且正確
- Route stub 已建立
- Service interface 拋出 NotImplementedError
- Factory 資料建立成功
- 測試失敗原因明確：Service 未實作

---

# JSON 欄位命名規則

所有 API Request/Response 的 JSON 欄位使用 **camelCase**（TypeScript 慣例）。

```typescript
// 正確
{ agentId: "agent-1", companyId: "company-1", issueId: "issue-1" }

// 錯誤
{ agent_id: "agent-1", company_id: "company-1", issue_id: "issue-1" }
```

---

# Critical Rules

### R1: 測試程式碼必須完整
測試邏輯必須完整實作，不能有 `expect(true).toBe(false)` 或空函式。

### R2: Route stub 必須存在
如果目標 route 尚未存在，必須建立 stub（呼叫 Service 方法）。

### R3: Service 必須拋出 NotImplementedError
Service 方法的 body 必須是 `throw new Error("NotImplemented: ...")`。

### R4: 不實作 Service 業務邏輯
紅燈階段不撰寫業務邏輯。

### R5: 測試會失敗（紅燈）
紅燈階段的測試執行後應該失敗（Service 未實作），這是預期的結果。

### R6: 使用 Company Scoping
所有 API 路徑必須包含 `/companies/:companyId/`，遵守專案的 company-scoped 架構。

### R7: 使用 Actor Context
測試必須設定正確的 actor context（board / agent），透過 middleware mock。

### R8: Factory 使用真實 DB
透過 Drizzle ORM 的 `db.insert()` 建立測試資料，不使用 mock。

---

# 完成條件

- 所有測試 it() 的 TODO 已替換為完整的測試邏輯
- Route stub 已建立（若尚未存在）
- Service interface 已建立（拋出 NotImplementedError）
- 測試 helpers（setup, factories）已建立（若尚未存在）
- 測試執行達到紅燈狀態（Service 未實作，拋出 NotImplementedError）
- `expect(true).toBe(false)` placeholder 已全部移除
