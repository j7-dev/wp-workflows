---
name: aibdd.auto.typescript.api.handlers.success-failure
description: 當在 API 整合測試 Gherkin 中驗證操作成功或失敗時，參考此規範。驗證 HTTP status code + error response body。
user-invocable: false
---

# Success-Failure-Handler (API Integration Test Version)

## Trigger
Then 語句描述**操作的成功或失敗結果**（HTTP status 驗證）

**識別規則**：
- 明確描述操作結果（成功/失敗）
- 常見句型：「操作成功」「操作失敗」「HTTP 狀態碼為」「錯誤訊息應包含」

**通用判斷**：如果 Then 只關注操作是否成功（HTTP 2XX）或失敗（HTTP 4XX/5XX），就使用此 Handler

## Task
驗證 HTTP status code 和 error response body

## 與前端 E2E 版本的差異

| 面向 | 前端 E2E | API 整合測試 |
|------|---------|------------|
| 成功指標 | toast 成功訊息 / 頁面跳轉 | **HTTP 2XX status code** |
| 失敗指標 | error message / toast 錯誤 | **HTTP 4XX status code + error body** |
| 工具 | Playwright `expect(page.getByText(...))` | **`expect(res.status).toBe(...)`** |

---

## Pattern 1: 操作成功

```gherkin
When agent "agent-1" checkout issue "ISSUE-1"
Then 操作成功，HTTP 狀態碼為 200
```

```typescript
// Assert (Then) - Success: HTTP 200
expect(res.status).toBe(200);
```

### 其他成功狀態碼

```gherkin
Then 操作成功，HTTP 狀態碼為 201
```

```typescript
// 201 Created（建立資源）
expect(res.status).toBe(201);
```

```gherkin
Then 操作成功，HTTP 狀態碼為 204
```

```typescript
// 204 No Content（刪除資源）
expect(res.status).toBe(204);
```

---

## Pattern 2: 操作失敗

```gherkin
When agent "agent-1" checkout issue "ISSUE-1"
Then 操作失敗，HTTP 狀態碼為 409
```

```typescript
// Assert (Then) - Failure: HTTP 409
expect(res.status).toBe(409);
```

### 常見失敗狀態碼

| HTTP Status | 語義 | 使用場景 |
|-------------|------|---------|
| 400 | Bad Request | 輸入驗證失敗 |
| 401 | Unauthorized | 未認證 |
| 403 | Forbidden | 無權限 |
| 404 | Not Found | 資源不存在 |
| 409 | Conflict | 狀態衝突 |
| 422 | Unprocessable Entity | 業務規則違反 |

---

## Error Message Verification

```gherkin
Then 操作失敗，HTTP 狀態碼為 409
And 錯誤訊息應包含 "already assigned"
```

```typescript
// Assert (Then) - Failure: HTTP 409
expect(res.status).toBe(409);

// Assert (Then) - Error message
expect(res.body.error).toContain("already assigned");
// 或根據專案的 error response 格式
expect(res.body.message).toContain("already assigned");
```

---

## Complete Examples

### Example 1: 成功場景

```gherkin
Feature: Issue Checkout

Rule: 一個 issue 只能有一個 assignee

  Example: 成功 checkout issue 給 agent
    Given 公司 "Acme Corp" 有一個 agent "agent-1"
    And 公司 "Acme Corp" 有一個未指派的 issue "ISSUE-1"
    When agent "agent-1" checkout issue "ISSUE-1"
    Then 操作成功，HTTP 狀態碼為 200
    And issue "ISSUE-1" 的 assigneeId 應為 "agent-1"
```

```typescript
it("Example: 成功 checkout issue 給 agent", async () => {
  // Arrange
  const company = await factory.company.create(db);
  const agent = await factory.agent.create(db, { companyId: company.id });
  const issue = await factory.issue.create(db, { companyId: company.id, assigneeId: null });

  // Act
  const res = await request(app)
    .post(`/api/companies/${company.id}/issues/${issue.id}/checkout`)
    .send({ agentId: agent.id });

  // Assert - Success-Failure
  expect(res.status).toBe(200);

  // Assert - Aggregate-Then
  const [updated] = await db.select().from(issues).where(eq(issues.id, issue.id));
  expect(updated.assigneeId).toBe(agent.id);
});
```

### Example 2: 失敗場景

```gherkin
  Example: 已被指派的 issue 不可重複 checkout
    Given 公司 "Acme Corp" 有一個 agent "agent-1"
    And 公司 "Acme Corp" 有一個 issue "ISSUE-1" 已指派給 "agent-2"
    When agent "agent-1" checkout issue "ISSUE-1"
    Then 操作失敗，HTTP 狀態碼為 409
    And 錯誤訊息應包含 "already assigned"
    And issue "ISSUE-1" 的 assigneeId 應為 "agent-2"
```

```typescript
it("Example: 已被指派的 issue 不可重複 checkout", async () => {
  // Arrange
  const company = await factory.company.create(db);
  const agent1 = await factory.agent.create(db, { companyId: company.id });
  const agent2 = await factory.agent.create(db, { companyId: company.id });
  const issue = await factory.issue.create(db, {
    companyId: company.id,
    assigneeId: agent2.id,
  });

  // Act
  const res = await request(app)
    .post(`/api/companies/${company.id}/issues/${issue.id}/checkout`)
    .send({ agentId: agent1.id });

  // Assert - Success-Failure
  expect(res.status).toBe(409);
  expect(res.body.message).toContain("already assigned");

  // Assert - Aggregate-Then（狀態未改變）
  const [unchanged] = await db.select().from(issues).where(eq(issues.id, issue.id));
  expect(unchanged.assigneeId).toBe(agent2.id);
});
```

### Example 3: 404 場景

```gherkin
  Example: Checkout 不存在的 issue
    Given 公司 "Acme Corp" 有一個 agent "agent-1"
    When agent "agent-1" checkout issue "non-existent-id"
    Then 操作失敗，HTTP 狀態碼為 404
```

```typescript
it("Example: Checkout 不存在的 issue", async () => {
  const company = await factory.company.create(db);
  const agent = await factory.agent.create(db, { companyId: company.id });

  const res = await request(app)
    .post(`/api/companies/${company.id}/issues/non-existent-id/checkout`)
    .send({ agentId: agent.id });

  expect(res.status).toBe(404);
});
```

### Example 4: 403 場景

```gherkin
  Example: Agent 不可 checkout 其他公司的 issue
    Given 公司 "Acme Corp" 有一個 agent "agent-1"
    And 公司 "Other Corp" 有一個 issue "ISSUE-1"
    When agent "agent-1" checkout issue "ISSUE-1"
    Then 操作失敗，HTTP 狀態碼為 403
```

---

## Critical Rules

### R1: 驗證 HTTP status code（不驗證 UI 回饋）
API 整合測試驗證的是 HTTP status，不是 toast 或 alert。

```typescript
// ✅ 正確：驗證 HTTP status
expect(res.status).toBe(200);
expect(res.status).toBe(409);

// ❌ 錯誤：驗證 UI 回饋
expect(page.getByText("成功")).toBeVisible();
```

### R2: 失敗場景需驗證資料未改變
失敗後，通常需要在另一個 Then 步驟用 Aggregate-Then-Handler 驗證 DB 資料未被修改。

```gherkin
Then 操作失敗，HTTP 狀態碼為 409
And issue "ISSUE-1" 的 assigneeId 應為 "agent-2"  # Aggregate-Then 驗證未改變
```

### R3: 錯誤訊息驗證是選填的
驗證錯誤訊息不是必須的，取決於 Gherkin 是否明確要求。

### R4: 不在 Success-Failure-Handler 中驗證 response body 業務欄位
只驗證 HTTP status 和 error message，不驗證具體的業務資料。

```typescript
// ✅ 正確：只驗證 status 和 error
expect(res.status).toBe(200);

// ❌ 錯誤：驗證業務資料（那是 ReadModel-Then 或 Aggregate-Then 的工作）
expect(res.body.assigneeId).toBe(agent.id);
```

### R5: Error Response 格式
根據專案的 errorHandler middleware，錯誤回應通常是：

```json
{
  "error": "ConflictError",
  "message": "Issue already assigned",
  "statusCode": 409
}
```

驗證時使用 `res.body.message` 或 `res.body.error`。

---

## File Organization

Success-Failure 的 assertion 直接寫在 `it()` block 中，不需要額外的檔案：

```typescript
it("Example: ...", async () => {
  // ... Arrange + Act

  // Then - Success/Failure
  expect(res.status).toBe(200); // 或 409, 404, 403...

  // Then - Error message（選填）
  expect(res.body.message).toContain("already assigned");
});
```

---

**文件版本**：API Integration Test Version 1.0
**適用框架**：TypeScript 5.7+ + Vitest + Supertest + Express 5
