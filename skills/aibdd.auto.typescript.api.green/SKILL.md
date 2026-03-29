---
name: aibdd.auto.typescript.api.green
description: TypeScript API Stage 3：綠燈階段。Trial-and-error 循環讓測試通過，實作 Service 業務邏輯 + Route handler。可被 /aibdd.auto.typescript.api.control-flow 調用，也可獨立使用。
user-invocable: true
argument-hint: "[feature-file]"
input: server/src/__tests__/{domain}.integration.test.ts, server/src/routes/{domain}.ts, server/src/services/{domain}.ts
output: server/src/services/{domain}.ts（完整實作）, server/src/routes/{domain}.ts（完整實作）
---

# 角色

TDD 綠燈實作者。在紅燈階段已經寫好整合測試並確認失敗後，進入綠燈階段：

**寫最少的程式碼讓測試通過，實作 Service 業務邏輯，不斷 trial-and-error 直到所有測試變綠。**

---

# 入口條件

## 被 /aibdd.auto.typescript.api.control-flow 調用

接收 Feature 相關的測試檔路徑，直接進入 trial-and-error 流程。

## 獨立使用

1. 詢問目標測試檔路徑（預設掃描 `server/src/__tests__/*.integration.test.ts`）
2. 確認目前是紅燈狀態（Service 拋出 NotImplementedError）
3. 進入 trial-and-error 流程

---

# 核心原則

## 0. 測試驅動開發的鐵律

**必須透過執行自動化測試來驗證實作是否完成，絕不猜測。**

- 每完成一個步驟，立即執行測試
- 無需詢問使用者，直接下達測試指令
- 根據測試結果決定下一步行動
- 絕不假設測試會通過
- 絕不詢問「測試通過了嗎？」

## 測試執行策略

1. **開發階段：先跑目標測試檔**
2. **完成階段：執行所有整合測試回歸**

**測試指令**：

```bash
# 1. 開發階段：執行特定測試檔
pnpm vitest run server/src/__tests__/{domain}.integration.test.ts

# 2. 開發階段：執行特定測試
pnpm vitest run server/src/__tests__/{domain}.integration.test.ts -t "Example: 具體名稱"

# 3. 完成階段：執行所有整合測試（回歸測試）
pnpm vitest run server/src/__tests__/*.integration.test.ts
```

## 1. 最小增量開發原則

只寫讓測試通過所需的最少程式碼，不要多做。

```typescript
// 做太多了（測試沒要求）
async function checkout(companyId, issueId, agentId) {
  await validateCompanyAccess(companyId);  // 沒測試
  await checkBudget(agentId);              // 沒測試
  await sendNotification(agentId);         // 沒測試
  await logActivity(companyId, "checkout"); // 沒測試
  return result;
}

// 剛好夠（只實作測試要求的）
async function checkout(companyId, issueId, agentId) {
  const [issue] = await db.select().from(issues).where(eq(issues.id, issueId));
  if (issue.assigneeId) throw new ConflictError("already assigned");
  const [updated] = await db.update(issues)
    .set({ assigneeId: agentId })
    .where(eq(issues.id, issueId))
    .returning();
  return updated;
}
```

## 2. Trial-and-Error 流程

**核心流程**：測試 → 看錯誤 → 修正 → 再測試（循環直到通過）

```
開發循環（快速迭代）：
1. 執行特定測試 → pnpm vitest run server/src/__tests__/{domain}.integration.test.ts
2. 看錯誤訊息 → 理解失敗原因
3. 寫最少的程式碼修正這個錯誤
4. 再次執行特定測試
5. 還有錯誤？回到步驟 2
6. 特定測試通過？進入完成驗證

完成驗證（回歸測試）：
7. 執行所有整合測試 → pnpm vitest run server/src/__tests__/*.integration.test.ts
8. 所有測試通過？完成綠燈！
9. 有測試失敗？回到步驟 2
```

---

# 實作流程

按照測試錯誤訊息逐步實作：

**基本流程**：
1. 執行測試 → `pnpm vitest run server/src/__tests__/{domain}.integration.test.ts`
2. 看錯誤訊息（NotImplementedError? 500? assertion failed?）
3. 根據錯誤實作最少的程式碼（Service 方法 → Route handler → 錯誤處理）
4. 再次執行測試
5. 循環直到特定測試通過
6. 執行回歸測試 → `pnpm vitest run server/src/__tests__/*.integration.test.ts`

---

# 遵守專案架構

## 三層架構

```
Route handler → Service → DB (Drizzle ORM)
```

- **Route**：接收 request，解析參數，呼叫 Service，回傳 response
- **Service**：業務邏輯，存取 DB，拋出業務錯誤
- **DB**：Drizzle ORM schema + query

## Company Scoping

所有操作必須在 company 範圍內：

```typescript
// Service 方法必須檢查 company scoping
async function checkout(companyId: string, issueId: string, agentId: string) {
  const [issue] = await db.select().from(issues)
    .where(and(
      eq(issues.id, issueId),
      eq(issues.companyId, companyId), // Company scoping
    ));
  if (!issue) throw new NotFoundError("Issue not found");
  // ...
}
```

## Error Handling

使用專案的 error handler middleware：

```typescript
// 業務錯誤拋出後由 errorHandler 統一處理
throw new NotFoundError("Issue not found");     // → 404
throw new ConflictError("Already assigned");    // → 409
throw new ForbiddenError("Insufficient permissions"); // → 403
throw new BadRequestError("Invalid input");     // → 400
```

---

# 常見錯誤修復

## NotImplementedError
**原因**：Service 方法尚未實作
**修復**：替換 `throw new Error("NotImplemented: ...")` 為實際業務邏輯

## 500 Internal Server Error
**原因**：Service 或 Route 中有未預期的錯誤
**修復**：查看錯誤堆疊，修正邏輯錯誤

## 404 Not Found
**原因**：Route 不存在或資源找不到
**修復**：確認 Route 已註冊、確認 DB 查詢正確

## Assertion Failed（response body 不符）
**原因**：Service 回傳的資料格式不正確
**修復**：修正 Service 回傳值或 Route response 格式

## DB Error（constraint violation）
**原因**：Factory 建立的資料不滿足 DB 約束
**修復**：修正 Factory 或測試資料

---

# 完成條件

## 開發階段
- 執行特定測試 `pnpm vitest run server/src/__tests__/{domain}.integration.test.ts`
- 確認目標功能測試通過

## 完成驗證（必須）
- **執行所有整合測試 `pnpm vitest run server/src/__tests__/*.integration.test.ts`**
- **所有整合測試通過**
- 沒有破壞既有功能
- 程式碼簡單直接

**只有當所有整合測試顯示 PASSED 時，才算完成綠燈階段。**

**不需要**：
- 程式碼優雅（留給重構階段）
- 效能優化（留給重構階段）
- 完整錯誤處理（測試沒要求就不做）
- 額外的 API 功能（測試沒要求就不做）

---

# 記住

1. **測試驅動你** - 看測試錯誤決定下一步要實作什麼
2. **最小實作** - 只寫通過測試需要的程式碼
3. **Trial-and-Error** - 執行測試 → 看錯誤 → 修正 → 再執行
4. **自動執行測試** - 每次修改後立即執行測試
5. **根據實際結果行動** - 依據 vitest 的輸出決定下一步
6. **遵守三層架構** - Route → Service → DB
7. **Company scoping** - 所有操作必須在 company 範圍內
