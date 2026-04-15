---
name: aibdd.auto.ts.it.handlers.success-failure
description: >
  當在 React IT Gherkin 測試中驗證操作成功或失敗的 UI 回饋時，「只能」使用此指令。
  驗證 toast 通知、alert 訊息、disabled 狀態、error 訊息等。
---

# Handler: success-failure（Operation Result Verifier — 成敗）

## Trigger 辨識

Then 語句描述**操作的成功或失敗結果**。

**識別規則**：
- 明確描述操作結果（成功/失敗）
- 常見句型：「操作成功」「操作失敗」「執行成功」「執行失敗」
- 可附帶錯誤訊息驗證：「錯誤訊息應為 "..."」

**通用判斷**：如果 Then 只關注操作是否成功或失敗（不關注回傳資料內容），就使用此 Handler。

## 任務

從 UI 上尋找成功/失敗的視覺回饋 → Assert 其存在或內容。

## 與其他 Then Handler 的區別

| | success-failure | aggregate-then | readmodel-then |
|---|---|---|---|
| 驗證對象 | UI 回饋（toast / alert / error message） | MSW request payload | rendered content |
| 資料來源 | DOM 元素 | 攔截的 HTTP request | DOM 元素 |
| 前提操作 | Command | Command | Query |
| 驗證深度 | 只看成敗 | 看發送的資料 | 看顯示的資料 |

## 實作流程

### 成功
1. 使用 `waitFor` 等待成功指標出現
2. 常見成功指標：
   - Toast 通知：`screen.getByText(/成功|完成/i)`
   - Alert role：`screen.getByRole('alert')` with success content
   - 頁面導航：URL 變更
   - 表單重置：輸入欄位清空
   - 按鈕狀態變更：disabled → enabled

### 失敗
1. 使用 `waitFor` 等待失敗指標出現
2. 常見失敗指標：
   - Error message：`screen.getByText(/失敗|錯誤/i)`
   - Alert role：`screen.getByRole('alert')` with error content
   - 表單驗證錯誤：`screen.getByText(errorMessage)`
   - 按鈕仍可點擊（未被 disabled）

## 程式碼範例

### 操作成功

```gherkin
Then 操作成功
```

```typescript
import { screen, waitFor } from '@testing-library/react';

await waitFor(() => {
  // 方式 1：Toast 通知
  expect(screen.getByText(/成功|已更新|已建立/i)).toBeInTheDocument();

  // 方式 2：Alert role
  // const alert = screen.getByRole('alert');
  // expect(alert).toHaveTextContent(/成功/i);

  // 方式 3：Success status
  // expect(screen.getByRole('status')).toHaveTextContent(/成功/i);
});
```

### 操作失敗

```gherkin
Then 操作失敗
```

```typescript
await waitFor(() => {
  expect(screen.getByRole('alert')).toBeInTheDocument();
  // 或
  // expect(screen.getByText(/失敗|錯誤|無法/i)).toBeInTheDocument();
});
```

### 失敗 + 錯誤訊息

```gherkin
Then 操作失敗
And 錯誤訊息應為 "進度不可倒退"
```

```typescript
await waitFor(() => {
  expect(screen.getByRole('alert')).toBeInTheDocument();
});
expect(screen.getByText('進度不可倒退')).toBeInTheDocument();
```

### 表單驗證失敗

```gherkin
Then 顯示驗證錯誤 "名稱不可為空"
```

```typescript
await waitFor(() => {
  expect(screen.getByText('名稱不可為空')).toBeInTheDocument();
});
// 確認表單仍可編輯
expect(screen.getByRole('button', { name: /送出/i })).toBeEnabled();
```

## MSW 錯誤回應設定

成功/失敗的 UI 回饋通常取決於 API 回傳的 status code。需要在 aggregate-given 或 test 內設定對應的 MSW handler：

```typescript
import { overrideMswError } from '@/test/helpers/msw-utils';

// 設定 API 回傳失敗
overrideMswError('post', '/api/v1/lessons/:lessonId/progress', {
  message: '進度不可倒退',
}, 400);
```

## 共用規則

1. **R1: 只驗成功/失敗** — 不驗資料內容（那是 readmodel-then 的事）
2. **R2: 使用 waitFor** — 成功/失敗回饋通常是非同步出現
3. **R3: 通用步驟可跨 Feature 共用** — 「操作成功」「操作失敗」是 common assertions
4. **R4: 錯誤訊息完全匹配** — 使用 `getByText(exactString)` 不用 regex
5. **R5: Alert role 優先** — 若有 role="alert"，優先使用 `getByRole('alert')`
