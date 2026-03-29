---
name: aibdd.auto.typescript.api.handlers.readmodel-then
description: 當在 API 整合測試 Gherkin 中驗證「API Response Body」時，「只能」使用此指令。驗證 res.body 的欄位值。
user-invocable: false
---

# ReadModel-Then-Handler (API Integration Test Version)

## Trigger
Then 語句驗證**Query 的 response body**

**識別規則**：
- 前提：When 是 Query 操作（已發送 GET 請求）
- 驗證的是 API 回傳的 response body（而非 DB 資料）
- 常見句型（非窮舉）：「查詢結果應」「回應應包含」「應返回」「結果包含」

**通用判斷**：如果 Then 是驗證 Query 操作的 API response body，就使用此 Handler

## Task
驗證 `res.body` 的欄位值

## 與前端 E2E 版本的差異

| 面向 | 前端 E2E | API 整合測試 |
|------|---------|------------|
| 驗證對象 | 頁面 DOM 元素 | **response body JSON** |
| 工具 | `expect(page.getByText(...))` | **`expect(res.body).toEqual(...)`** |
| 資料來源 | `this.page`（當前頁面） | **`res.body`** |

## Critical Rule
不重新發送請求，使用 When 中已取得的 `res` 變數

---

## Pattern Examples

### 驗證單一欄位

```gherkin
When board 查詢 issue "ISSUE-1" 的詳情
Then response 應包含 title 為 "ISSUE-1"
```

```typescript
// Assert (Then) - ReadModel: 驗證 response body
expect(res.body.title).toBe("ISSUE-1");
```

### 驗證多個欄位

```gherkin
And response 應包含 status 為 "open"，priority 為 "high"
```

```typescript
expect(res.body.status).toBe("open");
expect(res.body.priority).toBe("high");
```

### 驗證列表數量

```gherkin
When board 查詢公司 "Acme Corp" 的所有 agents
Then 查詢結果應包含 3 個 agents
```

```typescript
expect(res.body).toHaveLength(3);
// 或如果 response 是 { data: [...], total: N } 格式
expect(res.body.data).toHaveLength(3);
expect(res.body.total).toBe(3);
```

### 驗證列表內容

```gherkin
And 第一個 agent 的 shortName 應為 "agent-1"
```

```typescript
expect(res.body.data[0].shortName).toBe("agent-1");
```

### 驗證列表包含特定項目

```gherkin
And 查詢結果應包含 shortName 為 "agent-1" 的 agent
```

```typescript
expect(res.body.data).toEqual(
  expect.arrayContaining([
    expect.objectContaining({ shortName: "agent-1" }),
  ])
);
```

### 驗證嵌套結構

```gherkin
And response 應包含 agent 資訊，shortName 為 "agent-1"
And response 應包含 company 資訊，name 為 "Acme Corp"
```

```typescript
expect(res.body.agent.shortName).toBe("agent-1");
expect(res.body.company.name).toBe("Acme Corp");
```

### 驗證空結果

```gherkin
When board 查詢公司 "Acme Corp" 的所有 agents
Then 查詢結果應為空列表
```

```typescript
expect(res.body.data).toHaveLength(0);
// 或
expect(res.body).toEqual([]);
```

### 驗證 DataTable

```gherkin
Then 查詢結果應包含以下 issues：
  | title   | status | priority |
  | ISSUE-1 | open   | high     |
  | ISSUE-2 | closed | low      |
```

```typescript
const expectedIssues = [
  { title: "ISSUE-1", status: "open", priority: "high" },
  { title: "ISSUE-2", status: "closed", priority: "low" },
];

for (const expected of expectedIssues) {
  expect(res.body.data).toEqual(
    expect.arrayContaining([
      expect.objectContaining(expected),
    ])
  );
}
```

### 驗證分頁資訊

```gherkin
Then response 應包含 total 為 25，limit 為 10，offset 為 0
```

```typescript
expect(res.body.total).toBe(25);
expect(res.body.limit).toBe(10);
expect(res.body.offset).toBe(0);
```

---

## Vitest Assertion 模式

### 精確匹配

```typescript
expect(res.body.title).toBe("ISSUE-1");
expect(res.body.status).toBe("open");
```

### 物件部分匹配

```typescript
expect(res.body).toEqual(expect.objectContaining({
  title: "ISSUE-1",
  status: "open",
}));
```

### 陣列包含

```typescript
expect(res.body.data).toEqual(
  expect.arrayContaining([
    expect.objectContaining({ shortName: "agent-1" }),
  ])
);
```

### 陣列長度

```typescript
expect(res.body.data).toHaveLength(3);
```

### 型別驗證

```typescript
expect(res.body.id).toEqual(expect.any(String));
expect(res.body.createdAt).toEqual(expect.any(String));
```

### Null 驗證

```typescript
expect(res.body.assigneeId).toBeNull();
```

---

## Critical Rules

### R1: 使用已有的 `res` 變數（不重新發送請求）

```typescript
// ✅ 正確：使用 When 中的 res
expect(res.body.title).toBe("ISSUE-1");

// ❌ 錯誤：重新發送請求
const newRes = await request(app).get(`/api/...`);
expect(newRes.body.title).toBe("ISSUE-1");
```

### R2: 只驗證 Gherkin 提到的欄位

```typescript
// Gherkin: Then response 應包含 title 為 "ISSUE-1"

// ✅ 正確：只驗證 title
expect(res.body.title).toBe("ISSUE-1");

// ❌ 錯誤：驗證額外欄位
expect(res.body.title).toBe("ISSUE-1");
expect(res.body.createdAt).toBeDefined(); // Gherkin 沒提到
```

### R3: 驗證 response body，不查詢 DB

```typescript
// ✅ 正確：驗證 response body
expect(res.body.assigneeId).toBe(agent.id);

// ❌ 錯誤：查詢 DB（那是 Aggregate-Then 的工作）
const [issue] = await db.select().from(issues).where(eq(issues.id, issueId));
expect(issue.assigneeId).toBe(agent.id);
```

### R4: 列表驗證先確認數量

```typescript
// ✅ 正確：先驗證數量
expect(res.body.data).toHaveLength(2);
expect(res.body.data[0].shortName).toBe("agent-1");

// ❌ 錯誤：不確認數量
expect(res.body.data[0].shortName).toBe("agent-1"); // data 可能是空陣列
```

### R5: 使用 camelCase 欄位名稱

```typescript
// ✅ 正確：camelCase
expect(res.body.assigneeId).toBe(agent.id);
expect(res.body.companyId).toBe(company.id);

// ❌ 錯誤：snake_case
expect(res.body.assignee_id).toBe(agent.id);
```

---

## 與 Aggregate-Then-Handler 的區別

| 面向 | ReadModel-Then-Handler | Aggregate-Then-Handler |
|------|----------------------|----------------------|
| 驗證對象 | API response body | DB 中的實際資料 |
| 資料來源 | `res.body` | `db.select().from(table)` |
| 使用時機 | Query 後驗證 response | Command 後驗證 DB 狀態 |
| 範例 | And response 應包含 title... | And issue 的 assigneeId 應為... |

---

**文件版本**：API Integration Test Version 1.0
**適用框架**：TypeScript 5.7+ + Vitest + Supertest
