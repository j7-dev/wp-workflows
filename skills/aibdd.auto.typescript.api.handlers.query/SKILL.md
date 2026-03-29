---
name: aibdd.auto.typescript.api.handlers.query
description: 當在 API 整合測試 Gherkin 中撰寫讀取操作步驟（GET），務必參考此規範。使用 Supertest GET 發送查詢請求。
user-invocable: false
---

# Query-Handler (API Integration Test Version)

## Trigger
When 語句執行**讀取操作**（Query）

**識別規則**：
- 動作不修改系統狀態，只讀取資料
- 描述「取得某些資訊」的動作
- 常見動詞（非窮舉）：「查詢」「取得」「列出」「檢視」「獲取」

**通用判斷**：如果 When 是讀取操作且需要 response 供 Then 驗證，就使用此 Handler

## Task
使用 Supertest 發送 GET 請求，儲存 response

## 與前端 E2E 版本的差異

| 面向 | 前端 E2E | API 整合測試 |
|------|---------|------------|
| 操作方式 | `page.goto()` 頁面導航 | **`request(app).get(url)`** |
| 工具 | Playwright page | **Supertest** |
| 結果呈現 | 頁面 DOM 元素 | **response body JSON** |
| 等待方式 | waitForSelector | **同步回應** |

---

## 實作流程

1. **構建 API URL**（含 companyId 和資源 ID / query params）
2. **使用 Supertest 發送 GET 請求**
3. **將 response 儲存到 `res` 變數**（供 Then 步驟驗證）

---

## Pattern Examples

### Query 單一資源

```gherkin
When board 查詢 issue "ISSUE-1" 的詳情
```

```typescript
// Act (When) - Query: get_issue
const res = await request(app)
  .get(`/api/companies/${company.id}/issues/${issue.id}`)
  .expect("Content-Type", /json/);
```

### Query 列表

```gherkin
When board 查詢公司 "Acme Corp" 的所有 agents
```

```typescript
const res = await request(app)
  .get(`/api/companies/${company.id}/agents`)
  .expect("Content-Type", /json/);
```

### Query 帶分頁

```gherkin
When board 查詢公司 "Acme Corp" 的 issues，每頁 10 筆，第 1 頁
```

```typescript
const res = await request(app)
  .get(`/api/companies/${company.id}/issues`)
  .query({ limit: 10, offset: 0 })
  .expect("Content-Type", /json/);
```

### Query 帶篩選

```gherkin
When board 查詢公司 "Acme Corp" 中狀態為 "open" 的 issues
```

```typescript
const res = await request(app)
  .get(`/api/companies/${company.id}/issues`)
  .query({ status: "open" })
  .expect("Content-Type", /json/);
```

### Query 帶搜尋

```gherkin
When board 搜尋包含 "auth" 的 issues
```

```typescript
const res = await request(app)
  .get(`/api/companies/${company.id}/issues`)
  .query({ q: "auth" })
  .expect("Content-Type", /json/);
```

### Agent Actor 查詢

```gherkin
When agent "agent-1" 查詢自己被指派的 issues
```

```typescript
const agentApp = createTestApp(db, routes, {
  actorType: "agent",
  agentId: agent.id,
  companyIds: [company.id],
});

const res = await request(agentApp)
  .get(`/api/companies/${company.id}/agents/${agent.id}/issues`)
  .expect("Content-Type", /json/);
```

---

## Query Parameters

### 使用 `.query()` 方法

```typescript
// ✅ 正確：使用 .query()
const res = await request(app)
  .get(`/api/companies/${company.id}/issues`)
  .query({ status: "open", limit: 10 });

// ❌ 錯誤：手動拼接 query string
const res = await request(app)
  .get(`/api/companies/${company.id}/issues?status=open&limit=10`);
```

### 常見 query parameters

| 參數 | 用途 | 範例 |
|------|------|------|
| `limit` | 分頁大小 | `10` |
| `offset` | 分頁偏移 | `0` |
| `status` | 狀態篩選 | `"open"` |
| `q` | 搜尋關鍵字 | `"auth"` |
| `sort` | 排序欄位 | `"createdAt"` |
| `order` | 排序方向 | `"desc"` |

---

## Critical Rules

### R1: Query 只發送請求，不驗證 response
Query Handler 只負責發送 GET 請求，不驗證 response body（交給 ReadModel-Then-Handler）。

```typescript
// ✅ 正確：只發送，不驗證
const res = await request(app)
  .get(`/api/companies/${company.id}/issues/${issue.id}`);

// ❌ 錯誤：在 Query 中驗證
const res = await request(app)
  .get(`/api/companies/${company.id}/issues/${issue.id}`);
expect(res.body.title).toBe("ISSUE-1"); // 應該在 Then 中驗證
```

### R2: URL 包含 Company Scope
所有 API URL 必須包含 `/companies/:companyId/`。

### R3: 使用 `.query()` 設定 query parameters
不手動拼接 URL query string。

### R4: 儲存 response 到 `res` 變數
供後續 ReadModel-Then-Handler 使用。

### R5: 可以設定 `.expect("Content-Type", /json/)`
作為基本的格式驗證（非業務驗證）。

---

## 與 Command-Handler 的區別

| 面向 | Query-Handler | Command-Handler |
|------|--------------|----------------|
| HTTP Method | GET | POST/PUT/PATCH/DELETE |
| 目的 | 讀取資料 | 修改系統狀態 |
| 驗證方式 | ReadModel-Then（驗證 response body） | Success-Failure（驗證 HTTP status） |
| Request body | 無（使用 query params） | 有（JSON body） |

---

**文件版本**：API Integration Test Version 1.0
**適用框架**：TypeScript 5.7+ + Vitest + Supertest + Express 5
