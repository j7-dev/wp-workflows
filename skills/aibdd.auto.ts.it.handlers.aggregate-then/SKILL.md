---
name: aibdd.auto.ts.it.handlers.aggregate-then
description: >
  當在 React IT Gherkin 測試中驗證「API 被正確呼叫」時，「只能」使用此指令。
  驗證 MSW 攔截到的 request payload 是否正確（相當於後端的 Repository 查詢驗證）。
---

# Handler: aggregate-then（States Verify）

## Trigger 辨識

Then 語句驗證 **Command 操作後的系統狀態變更**。

**識別規則**：
- 驗證 Command 操作產生的副作用
- 描述「某個東西的某個屬性應該是某個值」
- 常見句型：「在...的...應為」「的...應為」「應包含」
- 需要額外查詢系統內部狀態（不是從 UI 顯示的內容）

**通用判斷**：如果 Then 是驗證 Command 操作後的系統狀態（需要確認 API 被正確呼叫），就使用此 Handler。

## 任務

從 MSW 攔截的 request 中取得送出的 payload → Assert payload 欄位值。

### 為什麼要驗 Request Payload？

在前端整合測試中，「系統狀態」的改變發生在後端。前端能驗證的是：**它送出了正確的資料給 API**。這等同於後端測試中的「從 Repository 查詢 DB 狀態」。

## 與其他 Then Handler 的區別

| | aggregate-then | readmodel-then | success-failure |
|---|---|---|---|
| 抽象角色 | States Verify | Result Verifier (資料) | Result Verifier (成敗) |
| 驗證對象 | MSW 攔截的 request payload | 畫面顯示的內容 | 成功/失敗 UI 回饋 |
| 前提操作 | Command（寫入操作） | Query（讀取操作） | Command（寫入操作） |
| 用途 | 驗證「前端送出正確資料」 | 驗證「前端顯示正確資料」 | 驗證「操作成功或失敗」 |

## 實作流程

1. 在 Command 執行前，使用 `captureMswRequest()` 設定 MSW spy handler
2. Command handler 執行 user-event 互動 → 觸發 API call
3. MSW spy handler 攔截 request，將 payload 存入 ref
4. Assert `ref.current` 不為 null（確認 API 被呼叫）
5. Assert `ref.current` 的欄位值

## 程式碼範例

### 驗證單一屬性

```gherkin
When 用戶 "Alice" 更新課程 1 的影片進度為 80%
Then 用戶 "Alice" 在課程 1 的進度應為 80%
```

```typescript
import { captureMswRequest } from '@/test/helpers/msw-utils';
import { screen, waitFor } from '@testing-library/react';
import { createUser } from '@/test/helpers/user-event';

// Setup MSW spy (before the Command interaction)
const requestRef = captureMswRequest('post', '/api/v1/lessons/:lessonId/progress');

// Command: user interaction
const user = createUser();
await user.clear(screen.getByRole('spinbutton', { name: /進度/i }));
await user.type(screen.getByRole('spinbutton', { name: /進度/i }), '80');
await user.click(screen.getByRole('button', { name: /更新/i }));

// Wait for API call to complete
await waitFor(() => {
  expect(requestRef.current).not.toBeNull();
});

// aggregate-then: Verify request payload
expect(requestRef.current).toMatchObject({
  progress: 80,
});
```

### 驗證多個屬性

```gherkin
Then 用戶 "Alice" 在課程 1 的進度應為 80%，狀態應為 "進行中"
```

```typescript
await waitFor(() => {
  expect(requestRef.current).not.toBeNull();
});

expect(requestRef.current).toMatchObject({
  progress: 80,
  status: 'IN_PROGRESS',
});
```

### 驗證 DELETE 請求被發送

```gherkin
Then 課程 1 應被刪除
```

```typescript
const deleteRef = captureMswRequest('delete', '/api/v1/lessons/:lessonId');

// ... (Command interaction: click delete button)

await waitFor(() => {
  expect(deleteRef.current).not.toBeNull();
});
// DELETE request usually has no body — verifying it was called is enough
```

### DataTable 驗證

```gherkin
Then 批量更新應包含以下變更：
  | productId | quantity |
  | PROD-001  | 3        |
  | PROD-002  | 1        |
```

```typescript
await waitFor(() => {
  expect(requestRef.current).not.toBeNull();
});

const items = (requestRef.current as { items: Array<{ productId: string; quantity: number }> }).items;
expect(items).toHaveLength(2);
expect(items).toContainEqual({ productId: 'PROD-001', quantity: 3 });
expect(items).toContainEqual({ productId: 'PROD-002', quantity: 1 });
```

## captureMswRequest 工具

此 handler 依賴 `src/test/helpers/msw-utils.ts` 中的 `captureMswRequest()` 工具：

```typescript
// captureMswRequest 回傳 ref object
const ref = captureMswRequest('post', '/api/v1/endpoint');
// ref.current 初始為 null
// API 被呼叫後，ref.current 為 request body (JSON parsed)
```

**重要**：`captureMswRequest` 必須在 Command 互動**之前**呼叫，否則無法攔截。

## 中文狀態映射

同 aggregate-given handler：`"進行中" → "IN_PROGRESS"` 等。

## 共用規則

1. **R1: captureMswRequest 必須在 Command 之前設定** — 否則錯過攔截
2. **R2: 先 assert not null** — 確認 API 確實被呼叫，再驗 payload
3. **R3: 欄位名 = api.yml request schema** — 前端送出的 key 與 api.yml 一致
4. **R4: 中文狀態映射** — 與 aggregate-given 相同的映射規則
5. **R5: 不修改資料** — Then 只驗證，不觸發額外操作
6. **R6: waitFor 包裹 assert** — API call 是非同步的
