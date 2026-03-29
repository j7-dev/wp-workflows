---
name: aibdd.auto.typescript.api.handlers.aggregate-then
description: 當在 API 整合測試 Gherkin 中驗證「Aggregate 最終狀態」時，務必參考此規範。使用 Drizzle ORM 直接查詢 DB 驗證資料。
user-invocable: false
---

# Aggregate-Then-Handler (API Integration Test Version)

## Trigger
Then 語句驗證**Aggregate 的屬性狀態**（DB 資料驗證）

**識別規則**：
- 驗證實體的屬性值（驗證 DB 中的實際資料）
- 描述「某個東西的某個屬性應該是某個值」
- 常見句型（非窮舉）：「應為」「的...應為」「應包含」「應存在」

**通用判斷**：如果 Then 是驗證 Command 操作後的 DB 資料狀態，就使用此 Handler

## Task
使用 Drizzle ORM → 直接查詢 DB → 驗證欄位值

## 與前端 E2E 版本的差異

| 面向 | 前端 E2E | API 整合測試 |
|------|---------|------------|
| 驗證對象 | MSW 攔截的 API 呼叫 | **DB 中的實際資料** |
| 資料來源 | `this.apiCalls` | **`db.select().from(table)`** |
| 工具 | `assert.strictEqual()` | **`expect().toBe()`** |
| 使用時機 | Command 後驗證 API 請求 | **Command 後驗證 DB 狀態** |

---

## Steps

1. 使用 Drizzle ORM 查詢 DB
2. 驗證欄位值是否符合預期

---

## Pattern Examples

### 驗證單一欄位

```gherkin
Then issue "ISSUE-1" 的 assigneeId 應為 "agent-1"
```

```typescript
// Assert (Then) - Aggregate: 驗證 DB 狀態
const [updated] = await db
  .select()
  .from(issues)
  .where(eq(issues.id, issue.id));

expect(updated.assigneeId).toBe(agent.id);
```

### 驗證多個欄位

```gherkin
And issue "ISSUE-1" 的狀態應為 "in_progress"，優先度應為 "high"
```

```typescript
const [updated] = await db
  .select()
  .from(issues)
  .where(eq(issues.id, issue.id));

expect(updated.status).toBe("in_progress");
expect(updated.priority).toBe("high");
```

### 驗證 Aggregate 存在

```gherkin
Then 應存在一筆 activity log 記錄
```

```typescript
const logs = await db
  .select()
  .from(activityLogs)
  .where(and(
    eq(activityLogs.companyId, company.id),
    eq(activityLogs.entityType, "issue"),
    eq(activityLogs.entityId, issue.id),
  ));

expect(logs).toHaveLength(1);
expect(logs[0].action).toBe("checkout");
```

### 驗證 Aggregate 不存在

```gherkin
Then agent "agent-1" 應已被刪除
```

```typescript
const result = await db
  .select()
  .from(agents)
  .where(eq(agents.id, agent.id));

expect(result).toHaveLength(0);
```

### 驗證關聯資料

```gherkin
And budget policy 的 spent 應增加 50
```

```typescript
const [budget] = await db
  .select()
  .from(budgetPolicies)
  .where(eq(budgetPolicies.agentId, agent.id));

expect(budget.spent).toBe(previousSpent + 50);
```

### 驗證 DataTable

```gherkin
Then 以下 issues 的 assigneeId 應為 null：
  | issueId |
  | ISSUE-1 |
  | ISSUE-2 |
```

```typescript
for (const row of expectedIssues) {
  const [result] = await db
    .select()
    .from(issues)
    .where(eq(issues.id, row.id));
  expect(result.assigneeId).toBeNull();
}
```

---

## Drizzle ORM 查詢模式

### 查詢單一記錄

```typescript
const [record] = await db
  .select()
  .from(table)
  .where(eq(table.id, id));
```

### 查詢多筆記錄

```typescript
const records = await db
  .select()
  .from(table)
  .where(eq(table.companyId, companyId));
```

### 條件查詢

```typescript
import { eq, and, isNull } from "drizzle-orm";

const records = await db
  .select()
  .from(issues)
  .where(and(
    eq(issues.companyId, companyId),
    isNull(issues.assigneeId),
  ));
```

### 計數查詢

```typescript
import { count } from "drizzle-orm";

const [{ count: total }] = await db
  .select({ count: count() })
  .from(issues)
  .where(eq(issues.companyId, companyId));
```

---

## Critical Rules

### R1: 直接查詢 DB（不依賴 API response）
Aggregate-Then 驗證的是 DB 中的實際資料，不是 API response。

```typescript
// ✅ 正確：查詢 DB
const [updated] = await db.select().from(issues).where(eq(issues.id, issue.id));
expect(updated.assigneeId).toBe(agent.id);

// ❌ 錯誤：依賴 API response
expect(res.body.assigneeId).toBe(agent.id); // 那是 ReadModel-Then 的工作
```

### R2: 只驗證 Gherkin 提到的欄位
只 assert Gherkin 中明確提到的屬性。

```typescript
// Gherkin: Then issue 的 assigneeId 應為 "agent-1"

// ✅ 正確：只驗證 assigneeId
expect(updated.assigneeId).toBe(agent.id);

// ❌ 錯誤：驗證額外欄位
expect(updated.assigneeId).toBe(agent.id);
expect(updated.updatedAt).toBeDefined(); // Gherkin 沒提到
```

### R3: 查詢必須包含 Company Scope
DB 查詢應盡可能包含 companyId 條件。

### R4: 驗證前確認記錄存在

```typescript
// ✅ 正確：先確認存在
const [updated] = await db.select().from(issues).where(eq(issues.id, issue.id));
expect(updated).toBeDefined();
expect(updated.assigneeId).toBe(agent.id);

// ❌ 錯誤：不檢查直接存取
const [updated] = await db.select().from(issues).where(eq(issues.id, issue.id));
expect(updated!.assigneeId).toBe(agent.id); // updated 可能是 undefined
```

---

## 與 ReadModel-Then-Handler 的區別

| 面向 | Aggregate-Then-Handler | ReadModel-Then-Handler |
|------|----------------------|----------------------|
| 驗證對象 | DB 中的實際資料 | API response body |
| 資料來源 | `db.select().from(table)` | `res.body` |
| 使用時機 | Command 後驗證 DB 狀態 | Query 後驗證 response |
| 範例 | And issue 的 assigneeId 應為... | And response 應包含 issue... |

---

**文件版本**：API Integration Test Version 1.0
**適用框架**：TypeScript 5.7+ + Vitest + Drizzle ORM (PostgreSQL)
