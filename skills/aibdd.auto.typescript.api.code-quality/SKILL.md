---
name: aibdd.auto.typescript.api.code-quality
description: Express / Node.js API 整合測試程式碼品質規範合集。包含三層架構規範、SOLID 設計原則、Company Scoping、Error Handling、命名與型別、測試程式碼品質等規範。供 refactor 階段嚴格遵守。
user-invocable: false
---

# 三層架構規範

## 目的

確保後端程式碼遵守 Route → Service → DB 的分層架構，職責清晰。

---

## Route Handler 層

**職責**：HTTP 入口，接收 request、解析參數、呼叫 Service、回傳 response。

```typescript
// ✅ 正確：Route 只做接收和回傳
router.post("/companies/:companyId/issues/:issueId/checkout", async (req, res, next) => {
  try {
    const { companyId, issueId } = req.params;
    const { agentId } = req.body;
    const result = await issueService(db).checkout(companyId, issueId, agentId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ❌ 錯誤：Route 包含業務邏輯
router.post("/companies/:companyId/issues/:issueId/checkout", async (req, res) => {
  const [issue] = await db.select().from(issues).where(eq(issues.id, issueId));
  if (issue.assigneeId) return res.status(409).json({ error: "already assigned" });
  await db.update(issues).set({ assigneeId: req.body.agentId });
  res.json({ success: true });
});
```

## Service 層

**職責**：業務邏輯，存取 DB，拋出業務錯誤。

```typescript
// ✅ 正確：Service 封裝業務邏輯
export function issueService(db: Db) {
  return {
    async checkout(companyId: string, issueId: string, agentId: string) {
      const [issue] = await db.select().from(issues)
        .where(and(eq(issues.id, issueId), eq(issues.companyId, companyId)));
      if (!issue) throw new NotFoundError("Issue not found");
      if (issue.assigneeId) throw new ConflictError("Issue already assigned");
      const [updated] = await db.update(issues)
        .set({ assigneeId: agentId })
        .where(eq(issues.id, issueId))
        .returning();
      return updated;
    },
  };
}
```

## DB 層

**職責**：Schema 定義、Migration、Query 輔助函式。

---

## 檢查清單

- [ ] Route handler 不包含業務邏輯
- [ ] Service 封裝所有業務邏輯和 DB 存取
- [ ] Service 使用 factory pattern：`xxxService(db)` 回傳方法物件
- [ ] Route 錯誤透過 `next(err)` 傳遞給 errorHandler

---

# SOLID 設計原則

## S - Single Responsibility Principle

每個 Service 方法只負責一件事。

```typescript
// ❌ 方法做太多事
async checkout(companyId, issueId, agentId) {
  // 檢查公司存在
  // 檢查預算
  // 檢查 agent 存在
  // 檢查 issue 狀態
  // 執行 checkout
  // 寫入 activity log
  // 發送通知
}

// ✅ 職責分離
async checkout(companyId, issueId, agentId) {
  const issue = await this.findIssue(companyId, issueId);
  this.assertUnassigned(issue);
  return this.assignTo(issue, agentId);
}
```

## O - Open/Closed Principle

新增功能時透過擴展而非修改現有程式碼。

## I - Interface Segregation Principle

Service 方法按領域分離，不建立過大的 Service。

```typescript
// ❌ 過大的 Service
function issueService(db: Db) {
  return {
    checkout, checkin, create, update, delete,
    addComment, removeComment,
    addLabel, removeLabel,
    // ...30 個方法
  };
}

// ✅ 按領域分離
function issueCheckoutService(db: Db) { /* checkout 相關 */ }
function issueCommentService(db: Db) { /* comment 相關 */ }
function issueLabelService(db: Db) { /* label 相關 */ }
```

## D - Dependency Inversion Principle

Service 依賴 DB 抽象（Drizzle），不直接依賴具體的 SQL。

---

## 檢查清單

- [ ] 每個 Service 方法只負責一件事
- [ ] Service 按領域合理分離
- [ ] 高層模組不直接依賴低層實作

---

# Company Scoping 規範

## 目的

確保所有操作都在 company 範圍內，防止跨公司存取。

---

## 規則

### R1: 所有查詢必須包含 companyId 條件

```typescript
// ✅ 正確：Company scoped 查詢
const [issue] = await db.select().from(issues)
  .where(and(
    eq(issues.id, issueId),
    eq(issues.companyId, companyId),
  ));

// ❌ 錯誤：沒有 company scoping
const [issue] = await db.select().from(issues)
  .where(eq(issues.id, issueId));
```

### R2: Route 路徑必須包含 companyId

```typescript
// ✅ 正確
router.get("/companies/:companyId/issues/:issueId", handler);

// ❌ 錯誤
router.get("/issues/:issueId", handler);
```

### R3: Actor 必須屬於該 Company

```typescript
// ✅ 正確：檢查 actor 的 companyIds
if (!req.actor.companyIds.includes(companyId)) {
  throw new ForbiddenError("Not a member of this company");
}
```

---

## 檢查清單

- [ ] 所有 DB 查詢包含 companyId 條件
- [ ] Route 路徑包含 `/companies/:companyId/`
- [ ] Actor 的 companyIds 已驗證

---

# Error Handling 規範

## 目的

統一錯誤處理模式，讓 API 回應一致。

---

## 錯誤類型映射

| 錯誤類型 | HTTP Status | 使用場景 |
|---------|-------------|---------|
| `BadRequestError` | 400 | 輸入驗證失敗 |
| `UnauthorizedError` | 401 | 未認證 |
| `ForbiddenError` | 403 | 無權限 |
| `NotFoundError` | 404 | 資源不存在 |
| `ConflictError` | 409 | 狀態衝突（如重複 checkout） |

## 規則

### R1: Service 拋出業務錯誤

```typescript
// ✅ 正確：Service 拋出具名錯誤
if (!issue) throw new NotFoundError("Issue not found");
if (issue.assigneeId) throw new ConflictError("Issue already assigned");

// ❌ 錯誤：Service 回傳 HTTP status
if (!issue) return { status: 404, error: "not found" };
```

### R2: Route 透過 next(err) 傳遞

```typescript
// ✅ 正確：try/catch + next(err)
try {
  const result = await service.checkout(...);
  res.json(result);
} catch (err) {
  next(err);
}
```

### R3: 錯誤訊息使用英文

```typescript
// ✅ 正確：英文錯誤訊息
throw new ConflictError("Issue already assigned");

// ❌ 錯誤：中文錯誤訊息（API 回應用英文）
throw new ConflictError("Issue 已被指派");
```

---

## 檢查清單

- [ ] Service 拋出具名業務錯誤
- [ ] Route 使用 try/catch + next(err)
- [ ] 錯誤訊息使用英文
- [ ] 不在 Service 中處理 HTTP response

---

# 命名與型別規範

## 目的

統一命名和型別慣例。

---

## 命名規則

```typescript
// 檔案名稱：kebab-case
// issue-checkout-routes.ts, issue-checkout-service.ts

// 函式名稱：camelCase
// issueCheckoutRoutes(), issueService()

// 型別名稱：PascalCase
// type IssueCheckoutInput = { ... }

// DB column 對應：snake_case（Drizzle schema 定義）
// assignee_id → TypeScript 中自動映射為 assigneeId

// API JSON 欄位：camelCase
// { agentId, companyId, issueId }
```

## 型別安全

```typescript
// ❌ 使用 any
const data: any = req.body;

// ✅ 使用 Zod 驗證
import { z } from "zod";
const CheckoutInput = z.object({
  agentId: z.string().uuid(),
});
const data = CheckoutInput.parse(req.body);
```

---

## 檢查清單

- [ ] 檔案名稱使用 kebab-case
- [ ] 函式名稱使用 camelCase
- [ ] 型別使用 PascalCase
- [ ] API JSON 欄位使用 camelCase
- [ ] 不使用 `any`，使用 Zod 驗證輸入

---

# 測試程式碼品質規範

## 目的

確保測試程式碼本身的品質。

---

## Arrange-Act-Assert 結構

```typescript
it("Example: 成功 checkout issue", async () => {
  // Arrange (Given)
  const company = await factory.company.create(db);
  const agent = await factory.agent.create(db, { companyId: company.id });
  const issue = await factory.issue.create(db, { companyId: company.id });

  // Act (When)
  const res = await request(app)
    .post(`/api/companies/${company.id}/issues/${issue.id}/checkout`)
    .send({ agentId: agent.id });

  // Assert (Then)
  expect(res.status).toBe(200);
  expect(res.body.assigneeId).toBe(agent.id);
});
```

## Factory Pattern

```typescript
// ✅ 正確：Factory 產生獨立的測試資料
const company = await factory.company.create(db);
const agent = await factory.agent.create(db, { companyId: company.id });

// ❌ 錯誤：硬編碼 ID
const companyId = "company-1"; // 可能和其他測試衝突
```

## 測試隔離

```typescript
// ✅ 正確：每個測試獨立
afterEach(async () => {
  await cleanAllTables(db);
});

// ❌ 錯誤：測試之間共享狀態
let sharedCompanyId: string; // 其他測試可能修改
```

## Only Assert What Gherkin Says

```typescript
// Gherkin: Then issue "ISSUE-1" 的 assigneeId 應為 "agent-1"

// ✅ 正確：只驗證 Gherkin 提到的欄位
expect(updated.assigneeId).toBe(agent.id);

// ❌ 錯誤：驗證額外欄位
expect(updated.assigneeId).toBe(agent.id);
expect(updated.updatedAt).toBeDefined(); // Gherkin 沒提到
```

## 清晰的錯誤訊息

```typescript
// ✅ 提供上下文
expect(res.status).toBe(200);
expect(res.body).toHaveProperty("assigneeId", agent.id);

// ✅ 自訂訊息
expect(updated.assigneeId).toBe(agent.id);
```

---

## 檢查清單

- [ ] 測試遵守 Arrange-Act-Assert 結構
- [ ] 使用 Factory 產生測試資料（不硬編碼）
- [ ] 每個測試互相隔離（afterEach 清理）
- [ ] 只驗證 Gherkin 提到的欄位
- [ ] 使用清晰的 assertion

---

## Meta 註記清理規範

### 刪除的內容

- `// TODO: [事件風暴部位: ...]`
- `// TODO: 參考 xxx-Handler 實作`
- `// Arrange (Given)` / `// Act (When)` / `// Assert (Then)` 區塊註解
- 其他開發過程中的臨時標記

### 保留的內容

- 必要的業務邏輯註解
- 必要的技術註解（如解釋複雜邏輯）
- JSDoc / TSDoc 文檔註解

---

**文件版本**：API Integration Test Version 1.0
**適用框架**：TypeScript 5.7+ + Express 5 + Vitest + Supertest + Drizzle ORM
