---
name: aibdd.auto.ts.it.handlers.command
description: >
  當在 React IT Gherkin 中撰寫使用者互動步驟（click, type, submit）時，
  「只能」使用此指令。使用 @testing-library/user-event 模擬使用者操作。
---

# Handler: command（Operation Invocation — Mutation）

## Trigger 辨識

Given/When 語句執行**寫入操作**（Command）。

**識別規則**：
- 動作會修改系統狀態
- 描述「執行某個動作」或「已完成某個動作」
- Given 常見過去式：「已訂閱」「已完成」「已建立」「已添加」「已註冊」
- When 常見現在式：「更新」「提交」「建立」「刪除」「添加」「移除」

**通用判斷**：如果語句是修改系統狀態的操作且需要透過 UI 互動完成，就使用此 Handler。

## 任務

- **When + Mutation**：使用 user-event 模擬使用者 click/type/submit → 觸發 API call
- **Given + Mutation**：使用 user-event 完成前置操作，不預期失敗

## 與 Query Handler 的區別

| | Command | Query |
|---|---|---|
| 觸發方式 | user-event click/type/submit | Component render + data fetch |
| 系統狀態 | 修改（POST/PUT/DELETE 被觸發） | 不修改（GET 被觸發） |
| Response 驗證 | 不驗證（交給 Then） | 不驗證（交給 Then） |

## Given vs When 的 Command 差異

| | Given + Command | When + Command |
|---|---|---|
| 目的 | 建立前置條件（透過 UI 完成某操作） | 測試目標操作 |
| 失敗處理 | 不預期失敗（前置操作必須成功） | 可能成功或失敗 |
| 等待策略 | `await waitFor()` 確認操作完成 | 執行後不立即驗證 |

## 實作流程

1. 取得 `userEvent` instance（`userEvent.setup()` 或 `createUser()`）
2. 找到目標 UI 元素（優先用 `getByRole`）
3. 執行互動（`user.click()`, `user.type()`, `user.clear()`, `user.selectOptions()`）
4. 若為表單提交：`user.click(submitButton)` 或 `user.keyboard('{Enter}')`
5. 等待 API 呼叫完成（可用 `waitFor` 等待 loading 狀態消失）
6. **不做 assertion** — 驗證交給 Then handler

## 程式碼範例

### 基本寫入

```gherkin
When 用戶 "Alice" 更新課程 1 的影片進度為 80%
```

```typescript
import { screen, waitFor } from '@testing-library/react';
import { createUser } from '@/test/helpers/user-event';

const user = createUser();

// 找到輸入欄位並填寫
const progressInput = screen.getByRole('spinbutton', { name: /進度/i });
await user.clear(progressInput);
await user.type(progressInput, '80');

// 點擊提交
const submitButton = screen.getByRole('button', { name: /更新|送出/i });
await user.click(submitButton);

// 等待 API 呼叫完成（loading 狀態消失）
await waitFor(() => {
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});
// 不做 assertion — 驗證交給 Then handler
```

### 表單填寫（多欄位）

```gherkin
When 用戶 "Alice" 建立新課程：名稱 "React 進階"，價格 2000
```

```typescript
const user = createUser();

await user.type(screen.getByRole('textbox', { name: /名稱/i }), 'React 進階');
await user.type(screen.getByRole('spinbutton', { name: /價格/i }), '2000');
await user.click(screen.getByRole('button', { name: /建立/i }));
```

### 選擇操作

```gherkin
When 用戶 "Alice" 將訂單狀態改為 "已付款"
```

```typescript
const user = createUser();

const select = screen.getByRole('combobox', { name: /狀態/i });
await user.selectOptions(select, 'PAID');
await user.click(screen.getByRole('button', { name: /確認/i }));
```

### 刪除操作

```gherkin
When 用戶 "Alice" 刪除課程 1
```

```typescript
const user = createUser();

const deleteButton = screen.getByRole('button', { name: /刪除/i });
await user.click(deleteButton);

// 如果有確認對話框
const confirmButton = screen.getByRole('button', { name: /確認刪除/i });
await user.click(confirmButton);
```

### DataTable + Command

```gherkin
When 用戶 "Alice" 批量更新以下商品數量：
  | productId | quantity |
  | PROD-001  | 3        |
  | PROD-002  | 1        |
```

```typescript
const user = createUser();

// 找到第一個商品的數量輸入
const rows = screen.getAllByRole('row');
const firstRow = rows[1]; // skip header
const firstInput = within(firstRow).getByRole('spinbutton');
await user.clear(firstInput);
await user.type(firstInput, '3');

const secondRow = rows[2];
const secondInput = within(secondRow).getByRole('spinbutton');
await user.clear(secondInput);
await user.type(secondInput, '1');

await user.click(screen.getByRole('button', { name: /批量更新|儲存/i }));
```

## Element 查找優先級

```
getByRole      → 語意化（button, textbox, combobox, spinbutton, heading）
getByLabelText → 表單欄位有 label
getByPlaceholderText → 有 placeholder
getByText      → 按鈕文字、連結文字
getByTestId    → 最後手段
```

## 共用規則

1. **R1: Command 不驗 Response** — 只執行互動，assertion 交給 Then
2. **R2: 使用 userEvent（非 fireEvent）** — 更接近真實使用者行為
3. **R3: 優先 getByRole 找元素** — 語意化查詢，不依賴 CSS class 或 ID
4. **R4: Given + Command 不預期失敗** — 前置操作必須成功完成
5. **R5: 等待 API 呼叫完成** — 用 waitFor 確認 loading 狀態消失，但不驗證結果
6. **R6: 每個 user.type() 前先 user.clear()** — 避免在既有文字後面追加
