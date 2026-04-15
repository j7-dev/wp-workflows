---
name: aibdd.auto.ts.it.handlers.query
description: >
  當在 React IT Gherkin 中撰寫資料讀取步驟（render component, waitFor data）時，
  「只能」使用此指令。Component render 觸發 API fetch，MSW 攔截並返回 mock data。
---

# Handler: query（Operation Invocation — Query）

## Trigger 辨識

When 語句執行**讀取操作**（Query）。

**識別規則**：
- 動作不修改系統狀態，只讀取/顯示資料
- 描述「取得某些資訊」的動作
- 常見動詞：「查詢」「取得」「列出」「檢視」「獲取」「搜尋」「瀏覽」

**通用判斷**：如果 When 是讀取操作且需要 Component render + 資料載入供 Then 驗證，就使用此 Handler。

## 任務

Render React Component → Component 觸發 API fetch → MSW 攔截並回傳 mock data → 等待載入完成。

## 與 Command Handler 的區別

| | Query | Command |
|---|---|---|
| 觸發方式 | Component render (renderWithProviders) | user-event interaction |
| 系統狀態 | 不修改（GET request） | 修改（POST/PUT/DELETE） |
| Then 搭配 | readmodel-then（驗證顯示內容） | success-failure / aggregate-then |

## 實作流程

1. 確認 MSW handler 已設定（由 aggregate-given 步驟完成）
2. 使用 `renderWithProviders()` render 目標 Component
3. 傳入必要的 props（route params, query params 等）
4. 使用 `waitFor` 等待資料載入完成（loading indicator 消失 or 目標內容出現）
5. **不驗證結果** — 驗證交給 readmodel-then handler

## 程式碼範例

### 基本查詢

```gherkin
When 用戶 "Alice" 查詢課程 1 的進度
```

```typescript
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/helpers/render';
import LessonProgressPage from '@/app/lessons/[id]/progress/page';

renderWithProviders(<LessonProgressPage params={{ id: '1' }} />);

// 等待資料載入完成
await waitFor(() => {
  expect(screen.queryByText(/loading|載入中/i)).not.toBeInTheDocument();
});
```

### 列表查詢

```gherkin
When 用戶 "Alice" 查詢購物車中的所有商品
```

```typescript
import CartPage from '@/app/cart/page';

renderWithProviders(<CartPage />);

await waitFor(() => {
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});
```

### 帶篩選條件的查詢

```gherkin
When 用戶 "Alice" 查詢第 1 章的所有課程
```

```typescript
import ChapterLessonsPage from '@/app/chapters/[id]/lessons/page';

renderWithProviders(<ChapterLessonsPage params={{ id: '1' }} />);

await waitFor(() => {
  expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
});
```

### 導航後查詢（Component 已 render，需要頁面導航）

```gherkin
When 用戶 "Alice" 進入課程 1 的頁面
```

```typescript
// 如果 Component 已在畫面上，使用 user-event 點擊導航
const user = createUser();
await user.click(screen.getByRole('link', { name: /課程 1/i }));

await waitFor(() => {
  expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
});
```

## 載入等待策略

### 策略 1：Loading indicator 消失
```typescript
await waitFor(() => {
  expect(screen.queryByText(/loading|載入中/i)).not.toBeInTheDocument();
});
```

### 策略 2：目標內容出現
```typescript
await screen.findByRole('heading', { name: /課程進度/i });
```

### 策略 3：Skeleton 消失
```typescript
await waitFor(() => {
  expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
});
```

**優先使用策略 2**（findBy 語意最清晰），策略 1 為通用備選。

## 共用規則

1. **R1: Query 不修改狀態** — 只 render 和載入資料
2. **R2: MSW handler 必須已設定** — 由 aggregate-given 步驟完成
3. **R3: 使用 renderWithProviders** — 確保 React Context（QueryClient, Router 等）正確包裝
4. **R4: 等待載入完成** — 用 `waitFor` 或 `findBy*`
5. **R5: 不驗證結果** — 驗證交給 readmodel-then handler
6. **R6: Props 從 Gherkin 語意推斷** — route params、query params 等
