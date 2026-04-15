---
name: aibdd.auto.ts.it.handlers.readmodel-then
description: >
  當在 React IT Gherkin 測試中驗證「頁面顯示內容」時，「只能」使用此指令。
  使用 screen.getByText/getByRole 等 Testing Library queries 驗證 rendered content。
---

# Handler: readmodel-then（Operation Result Verifier — 資料）

## Trigger 辨識

Then 語句驗證 **Query 操作後頁面顯示的內容**。

**識別規則**：
- 前提：When 是 Query 操作（Component 已 render + 資料已載入）
- 驗證的是 UI 上顯示的資料（而非 API request payload）
- 常見句型：「查詢結果應」「應顯示」「結果包含」「頁面應顯示」

**通用判斷**：如果 Then 是驗證 Query 操作後頁面顯示的資料內容，就使用此 Handler。

## 任務

使用 Testing Library 的 screen queries → Assert DOM 上的文字、數值、元素。

## 與 aggregate-then 的區別

| | readmodel-then | aggregate-then |
|---|---|---|
| 抽象角色 | Result Verifier (資料) | States Verify |
| 資料來源 | 畫面 DOM（screen queries） | MSW 攔截的 request payload |
| 前提操作 | Query（render + 資料載入） | Command（user interaction + API call） |
| 驗證層級 | 表示層（使用者看到什麼） | 資料層（前端送出什麼） |

## 關鍵原則

**不重新 render** — 使用 Query handler 步驟中已 render 的 Component 畫面。

## 實作流程

1. 畫面已由 Query handler render 並載入完成
2. 使用 `screen.getByText()`, `screen.getByRole()` 等查詢 DOM
3. 根據 Gherkin 語意 assert 對應的文字或元素
4. 列表驗證要同時驗筆數和內容

## 程式碼範例

### 驗證單一記錄

```gherkin
When 用戶 "Alice" 查詢課程 1 的進度
Then 操作成功
And 查詢結果應包含進度 80，狀態為 "進行中"
```

```typescript
import { screen } from '@testing-library/react';

// 畫面已由 query handler render 完成
expect(screen.getByText('80%')).toBeInTheDocument();
expect(screen.getByText('進行中')).toBeInTheDocument();
// 或更精確地限定範圍：
// const progressSection = screen.getByTestId('progress-info');
// expect(within(progressSection).getByText('80%')).toBeInTheDocument();
```

### 驗證列表筆數

```gherkin
Then 查詢結果應包含 2 個商品
```

```typescript
import { screen, within } from '@testing-library/react';

const list = screen.getByRole('list');
const items = within(list).getAllByRole('listitem');
expect(items).toHaveLength(2);
```

### 驗證列表內容

```gherkin
And 第一個商品的 ID 應為 "PROD-001"，數量為 2
```

```typescript
const list = screen.getByRole('list');
const items = within(list).getAllByRole('listitem');
expect(within(items[0]).getByText('PROD-001')).toBeInTheDocument();
expect(within(items[0]).getByText('2')).toBeInTheDocument();
```

### DataTable 驗證

```gherkin
Then 查詢結果應包含以下課程：
  | lessonId | name        | progress |
  | 1        | 物件導向基礎 | 80       |
  | 2        | 設計模式     | 50       |
```

```typescript
const table = screen.getByRole('table');
const rows = within(table).getAllByRole('row');
// rows[0] is header, data starts at rows[1]
expect(rows).toHaveLength(3); // header + 2 data rows

expect(within(rows[1]).getByText('物件導向基礎')).toBeInTheDocument();
expect(within(rows[1]).getByText('80')).toBeInTheDocument();

expect(within(rows[2]).getByText('設計模式')).toBeInTheDocument();
expect(within(rows[2]).getByText('50')).toBeInTheDocument();
```

### 空結果驗證

```gherkin
Then 查詢結果應為空
```

```typescript
expect(screen.getByText(/沒有資料|暫無|找不到/i)).toBeInTheDocument();
// 或
const list = screen.queryByRole('list');
if (list) {
  expect(within(list).queryAllByRole('listitem')).toHaveLength(0);
}
```

### 使用 within() 限定範圍

```typescript
// 驗證特定區塊內的內容
const card = screen.getByTestId('lesson-progress-card');
expect(within(card).getByText('80%')).toBeInTheDocument();
expect(within(card).getByText('進行中')).toBeInTheDocument();
```

## 中文顯示 vs Enum 值

UI 上顯示的是中文（如「進行中」），不需要做 enum 反向映射。直接用 `screen.getByText('進行中')` 驗證。

只有在 Gherkin 使用引號包裝的值（如 `"進行中"`）需要確認 UI 確實顯示該中文文字。

## Query 優先級

```
getByRole      → 語意化查詢（table, list, listitem, heading, button）
getByText      → 文字內容查詢
within()       → 限定搜尋範圍
getAllByRole   → 批量查詢（列表、表格行）
queryByText    → 預期可能不存在時使用（回傳 null 而非拋錯）
```

## 共用規則

1. **R1: 不重新 render** — 使用 Query handler 已 render 的畫面
2. **R2: 優先語意化查詢** — `getByRole` > `getByText` > `getByTestId`
3. **R3: 使用 within() 限定範圍** — 避免全域搜尋匹配到錯誤元素
4. **R4: 中文直接驗** — UI 顯示什麼就驗什麼，不做 enum 映射
5. **R5: 列表驗證要同時驗筆數和內容** — 不只驗 length，也驗每列資料
6. **R6: DataTable 考慮 header row** — table 的 row[0] 通常是 header
