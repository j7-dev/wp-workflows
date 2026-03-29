---
name: aibdd.auto.typescript.api.handlers.aggregate-given
description: 當在 API 整合測試 Gherkin 中進行「Aggregate 初始狀態建立」，「只能」使用此指令。使用 Factory + Drizzle ORM 直接寫入 DB 建立測試資料。
user-invocable: false
---

# Aggregate-Given-Handler (API Integration Test Version)

## Trigger
Given 語句描述**Aggregate 的存在狀態**，即定義 Aggregate 的屬性值

**識別規則**：
- 語句中包含實體名詞 + 屬性描述
- 描述「某個東西存在」或「某個東西的某個屬性是某個值」
- 常見句型（非窮舉）：「系統中有」「存在」「有一個」「已建立」

**通用判斷**：如果 Given 是在建立測試的初始資料狀態（而非執行動作），就使用此 Handler

## Task
使用 Factory + Drizzle ORM → 直接寫入 DB → 儲存 ID 到局部變數

## 與前端 E2E 版本的差異

| 面向 | 前端 E2E | API 整合測試 |
|------|---------|------------|
| 資料來源 | MSW mock handler | **直接寫入 DB（Drizzle ORM）** |
| 工具 | `this.server.use(http.get(...))` | **`db.insert(table).values(...).returning()`** |
| 持久化 | 記憶體中的 fixture | **PostgreSQL（PGlite）** |
| ID 儲存 | `this.ids` | **局部變數** |

---

## Steps

1. 從 Gherkin 提取實體屬性值
2. 使用 Factory 建立 DB 記錄
3. 將回傳的 ID 儲存到局部變數

---

## Pattern Examples

### 建立公司

```gherkin
Given 系統中有公司 "Acme Corp"
```

```typescript
// Arrange
const company = await factory.company.create(db, {
  name: "Acme Corp",
});
```

### 建立 Agent

```gherkin
Given 公司 "Acme Corp" 有一個 agent "agent-1"
```

```typescript
const agent = await factory.agent.create(db, {
  companyId: company.id,
  shortName: "agent-1",
  adapterType: "claude-local",
});
```

### 建立未指派的 Issue

```gherkin
Given 公司 "Acme Corp" 有一個未指派的 issue "ISSUE-1"
```

```typescript
const issue = await factory.issue.create(db, {
  companyId: company.id,
  title: "ISSUE-1",
  assigneeId: null,
});
```

### 建立已指派的 Issue

```gherkin
Given 公司 "Acme Corp" 有一個 issue "ISSUE-1" 已指派給 "agent-2"
```

```typescript
const agent2 = await factory.agent.create(db, {
  companyId: company.id,
  shortName: "agent-2",
});
const issue = await factory.issue.create(db, {
  companyId: company.id,
  title: "ISSUE-1",
  assigneeId: agent2.id,
});
```

### 建立多筆資料（DataTable）

```gherkin
Given 系統中有以下 agents：
  | shortName | adapterType  |
  | agent-1   | claude-local |
  | agent-2   | codex-local  |
```

```typescript
const agents = [];
for (const row of dataTable) {
  const agent = await factory.agent.create(db, {
    companyId: company.id,
    shortName: row.shortName,
    adapterType: row.adapterType,
  });
  agents.push(agent);
}
```

### Background → beforeEach

```gherkin
Background:
  Given 系統中有公司 "Acme Corp"
  And 公司 "Acme Corp" 有一個 project "Default Project"
```

```typescript
let company: typeof companies.$inferSelect;
let project: typeof projects.$inferSelect;

beforeEach(async () => {
  company = await factory.company.create(db, { name: "Acme Corp" });
  project = await factory.project.create(db, {
    companyId: company.id,
    name: "Default Project",
  });
});
```

---

## Factory Pattern

### Factory 結構

```typescript
// server/src/__tests__/helpers/factories.ts
import type { Db } from "@paperclipai/db";
import { companies, agents, issues, projects } from "@paperclipai/db/schema";
import { randomUUID } from "node:crypto";

export const factory = {
  company: {
    async create(db: Db, overrides: Partial<typeof companies.$inferInsert> = {}) {
      const [record] = await db.insert(companies).values({
        id: randomUUID(),
        name: `Company ${Date.now()}`,
        slug: `company-${Date.now()}`,
        ...overrides,
      }).returning();
      return record;
    },
  },

  agent: {
    async create(db: Db, overrides: Partial<typeof agents.$inferInsert> = {}) {
      const [record] = await db.insert(agents).values({
        id: randomUUID(),
        shortName: `agent-${Date.now()}`,
        adapterType: "claude-local",
        ...overrides,
      }).returning();
      return record;
    },
  },

  issue: {
    async create(db: Db, overrides: Partial<typeof issues.$inferInsert> = {}) {
      const [record] = await db.insert(issues).values({
        id: randomUUID(),
        title: `Issue ${Date.now()}`,
        assigneeId: null,
        ...overrides,
      }).returning();
      return record;
    },
  },

  // 新增更多 factory...
};
```

### Factory 設計原則

```typescript
// ✅ 正確：Factory 有合理預設值，可透過 overrides 覆蓋
const issue = await factory.issue.create(db, { assigneeId: null });

// ✅ 正確：Factory 回傳完整的 DB 記錄（含 generated ID）
const company = await factory.company.create(db);
console.log(company.id); // UUID

// ❌ 錯誤：硬編碼 ID
const companyId = "company-1";

// ❌ 錯誤：不使用 Factory，直接 insert
await db.insert(companies).values({ id: "company-1", name: "Test" });
```

---

## State Mapping

| 中文狀態 | 英文 Enum | 適用情境 |
|---------|----------|---------|
| 未指派 | `null` (assigneeId) | Issue |
| 已指派 | agent.id (assigneeId) | Issue |
| 進行中 | `running` | Heartbeat Run |
| 已完成 | `succeeded` | Heartbeat Run |
| 失敗 | `failed` | Heartbeat Run |
| 待核准 | `pending` | Approval |
| 已核准 | `approved` | Approval |

---

## Critical Rules

### R1: 使用 Factory 寫入真實 DB（不使用 mock）
API 整合測試必須寫入真實資料庫。

```typescript
// ✅ 正確：Factory + Drizzle ORM
const company = await factory.company.create(db);

// ❌ 錯誤：Mock DB
const mockDb = { select: vi.fn() };
```

### R2: Factory 回傳完整的 DB 記錄
Factory 必須使用 `.returning()` 回傳完整記錄。

```typescript
// ✅ 正確
const [record] = await db.insert(table).values(data).returning();

// ❌ 錯誤：不回傳記錄
await db.insert(table).values(data);
```

### R3: 使用局部變數儲存 ID
每個測試使用局部變數，不共享全域狀態。

```typescript
// ✅ 正確：局部變數
it("Example: ...", async () => {
  const company = await factory.company.create(db);
  const agent = await factory.agent.create(db, { companyId: company.id });
});

// ❌ 錯誤：共享全域狀態
let globalCompanyId: string;
```

### R4: 遵守 FK 關聯順序
建立資料時必須遵守外鍵關聯順序（先 parent，後 child）。

```typescript
// ✅ 正確：先建公司，後建 agent
const company = await factory.company.create(db);
const agent = await factory.agent.create(db, { companyId: company.id });

// ❌ 錯誤：agent 沒有 companyId
const agent = await factory.agent.create(db);
```

### R5: afterEach 清理資料
每個測試結束後清理資料，確保隔離。

```typescript
afterEach(async () => {
  await cleanAllTables(db);
});
```

---

**文件版本**：API Integration Test Version 1.0
**適用框架**：TypeScript 5.7+ + Vitest + Supertest + Drizzle ORM (PostgreSQL)
