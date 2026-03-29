---
name: aibdd.auto.typescript.api.handlers.command
description: 當在 API 整合測試 Gherkin 中撰寫寫入操作步驟（POST/PUT/PATCH/DELETE），務必參考此規範。使用 Supertest 發送 HTTP 請求。
user-invocable: false
---

# Command-Handler (API Integration Test Version)

## Trigger
Given/When 語句執行**寫入操作**（Command）

**識別規則**：
- 動作會修改系統狀態
- Given 常見過去式：「已建立」「已指派」「已核准」
- When 常見現在式：「checkout」「建立」「更新」「刪除」「核准」「暫停」

**通用判斷**：如果語句是修改系統狀態的操作，就使用此 Handler

## Task
使用 Supertest 發送 HTTP 寫入請求（POST/PUT/PATCH/DELETE）

## 與前端 E2E 版本的差異

| 面向 | 前端 E2E | API 整合測試 |
|------|---------|------------|
| 操作方式 | Playwright click/type/submit | **Supertest POST/PUT/DELETE** |
| 工具 | `page.getByRole().click()` | **`request(app).post(url).send(body)`** |
| 認證 | 頁面 session | **Actor middleware mock** |
| 結果儲存 | 等待頁面更新 | **`res` 變數** |

---

## 實作流程

1. **構建 API URL**（含 companyId 和資源 ID）
2. **使用 Supertest 發送請求**（設定 method、body、headers）
3. **將 response 儲存到 `res` 變數**（供 Then 步驟驗證）

---

## Pattern Examples

### When + Command（POST）

```gherkin
When agent "agent-1" checkout issue "ISSUE-1"
```

```typescript
// Act (When) - Command: checkout_issue
const res = await request(app)
  .post(`/api/companies/${company.id}/issues/${issue.id}/checkout`)
  .send({ agentId: agent.id })
  .expect("Content-Type", /json/);
```

### When + Command（PUT）

```gherkin
When board 更新 agent "agent-1" 的預算上限為 1000
```

```typescript
const res = await request(app)
  .put(`/api/companies/${company.id}/agents/${agent.id}/budget`)
  .send({ hardLimit: 1000 })
  .expect("Content-Type", /json/);
```

### When + Command（PATCH）

```gherkin
When board 更新 issue "ISSUE-1" 的優先度為 "high"
```

```typescript
const res = await request(app)
  .patch(`/api/companies/${company.id}/issues/${issue.id}`)
  .send({ priority: "high" })
  .expect("Content-Type", /json/);
```

### When + Command（DELETE）

```gherkin
When board 刪除 agent "agent-1"
```

```typescript
const res = await request(app)
  .delete(`/api/companies/${company.id}/agents/${agent.id}`);
```

### Given + Command（已完成的動作）

```gherkin
Given agent "agent-1" 已 checkout issue "ISSUE-1"
```

```typescript
// Given + Command：直接在 DB 建立最終狀態（不走 API）
await db.update(issues)
  .set({ assigneeId: agent.id })
  .where(eq(issues.id, issue.id));
```

### 帶認證的請求

```gherkin
When agent "agent-1" 透過 API 提交工作報告
```

```typescript
// 使用 agent actor context
const agentApp = createTestApp(db, routes, {
  actorType: "agent",
  agentId: agent.id,
  companyIds: [company.id],
});

const res = await request(agentApp)
  .post(`/api/companies/${company.id}/heartbeat-runs`)
  .send({ issueId: issue.id, status: "succeeded" });
```

---

## HTTP Method 選擇

| 操作類型 | HTTP Method | 範例 |
|---------|------------|------|
| 建立資源 | POST | 建立 issue、建立 agent |
| 完整更新 | PUT | 更新整個 budget policy |
| 部分更新 | PATCH | 更新 issue 優先度 |
| 刪除資源 | DELETE | 刪除 agent |
| 狀態轉換 | POST | checkout issue、核准 approval |

---

## Given vs When Command

### Given + Command（已完成的動作）
- 用於建立測試前置條件
- **通常直接操作 DB**（不走 API，速度快）
- 常用過去式：「已 checkout」「已核准」「已建立」

### When + Command（現在執行的動作）
- 用於執行被測試的動作
- **使用 Supertest 呼叫 API**
- 常用現在式：「checkout」「核准」「建立」「刪除」

---

## Critical Rules

### R1: Command 只發送請求，不驗證結果
在 Command 中只發送請求並儲存 response，不驗證（交給 Then）。

```typescript
// ✅ 正確：只發送，不驗證
const res = await request(app)
  .post(`/api/companies/${company.id}/issues/${issue.id}/checkout`)
  .send({ agentId: agent.id });

// ❌ 錯誤：在 Command 中驗證
const res = await request(app)
  .post(`/api/companies/${company.id}/issues/${issue.id}/checkout`)
  .send({ agentId: agent.id });
expect(res.status).toBe(200); // 應該在 Then 中驗證
```

### R2: URL 包含 Company Scope
所有 API URL 必須包含 `/companies/:companyId/`。

```typescript
// ✅ 正確
`/api/companies/${company.id}/issues/${issue.id}/checkout`

// ❌ 錯誤
`/api/issues/${issue.id}/checkout`
```

### R3: Given + Command 直接操作 DB
Given 中的已完成動作，直接在 DB 建立最終狀態（不走 API）。

```typescript
// ✅ 正確：Given 直接操作 DB
await db.update(issues).set({ assigneeId: agent.id }).where(eq(issues.id, issue.id));

// ⚠️ 避免：Given 走 API（速度慢且可能引入其他測試依賴）
await request(app).post(`/api/.../checkout`).send({ agentId: agent.id });
```

### R4: 使用真實的 request body
Request body 使用和 API 規格一致的 camelCase 欄位。

```typescript
// ✅ 正確：camelCase
.send({ agentId: agent.id, hardLimit: 1000 })

// ❌ 錯誤：snake_case
.send({ agent_id: agent.id, hard_limit: 1000 })
```

### R5: 儲存 response 到 `res` 變數
供後續 Then 步驟使用。

```typescript
// ✅ 正確：儲存到 res
const res = await request(app).post(url).send(body);
// Then 步驟使用 res.status, res.body
```

---

**文件版本**：API Integration Test Version 1.0
**適用框架**：TypeScript 5.7+ + Vitest + Supertest + Express 5
