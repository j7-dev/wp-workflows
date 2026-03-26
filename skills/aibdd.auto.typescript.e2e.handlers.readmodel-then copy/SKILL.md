---
name: aibdd.auto.typescript.e2e.handlers.readmodel-then
description: 當在前端 E2E Gherkin 測試中驗證「頁面顯示內容」時，「只能」使用此指令。
user-invocable: false
---

# ReadModel-Then-Handler (E2E Playwright + Cucumber Version)

## Trigger
Then 語句驗證**Query 的頁面顯示結果**

**識別規則**：
- 前提：When 是 Query 操作（已導航到頁面）
- 驗證的是頁面上顯示的內容（而非 API 呼叫）
- 常見句型（非窮舉）：「查詢結果應」「回應應」「應返回」「結果包含」「頁面應顯示」

**通用判斷**：如果 Then 是驗證 Query 操作的頁面顯示結果，就使用此 Handler

## Task
使用 Playwright assertion 驗證頁面 DOM 元素的內容

## 前端 E2E 特色（與後端的差異）

| 面向 | 後端 E2E | 前端 E2E |
|------|---------|---------|
| 驗證對象 | API response body JSON | **頁面 DOM 元素** |
| 工具 | Jackson ObjectMapper | **Playwright expect / getByText** |
| 資料來源 | ScenarioContext.lastResponse | **`this.page`（當前頁面）** |

## Critical Rule
不重新導航頁面，使用 When 中已導航到的頁面

---

## Pattern Examples

### 驗證單一文字

```gherkin
When 用戶 "Alice" 查詢課程 1 的進度
Then 查詢結果應包含進度 80，狀態為 "進行中"
```

```typescript
// tests/steps/lesson/readmodelThen.ts
import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';

const STATUS_DISPLAY: Record<string, string> = {
  '進行中': '進行中',
  '已完成': '已完成',
  '未開始': '未開始',
};

Then('查詢結果應包含進度 {int}，狀態為 {string}',
  async function (this: CustomWorld, progress: number, status: string) {
    // 驗證進度顯示
    await expect(this.page.getByText(`${progress}%`)).toBeVisible();

    // 驗證狀態顯示
    const displayStatus = STATUS_DISPLAY[status] ?? status;
    await expect(this.page.getByText(displayStatus)).toBeVisible();
  }
);
```

### 驗證列表數量

```gherkin
When 用戶 "Alice" 查詢購物車中的所有商品
Then 查詢結果應包含 2 個商品
```

```typescript
Then('查詢結果應包含 {int} 個商品',
  async function (this: CustomWorld, count: number) {
    // 找到所有商品項目元素
    const items = this.page.getByTestId('cart-item');
    await expect(items).toHaveCount(count);
  }
);
```

### 驗證列表內容

```gherkin
And 第一個商品的 ID 應為 "PROD-001"，數量為 2
```

```typescript
Then('第一個商品的 ID 應為 {string}，數量為 {int}',
  async function (this: CustomWorld, productId: string, quantity: number) {
    const firstItem = this.page.getByTestId('cart-item').first();
    await expect(firstItem.getByText(productId)).toBeVisible();
    await expect(firstItem.getByText(String(quantity))).toBeVisible();
  }
);
```

### 驗證嵌套結構

```gherkin
And 查詢結果應包含用戶名稱為 "Alice"
And 查詢結果應包含訂單狀態為 "已付款"
And 查詢結果應包含金額 1000
```

```typescript
Then('查詢結果應包含用戶名稱為 {string}',
  async function (this: CustomWorld, userName: string) {
    await expect(this.page.getByText(userName)).toBeVisible();
  }
);

Then('查詢結果應包含訂單狀態為 {string}',
  async function (this: CustomWorld, status: string) {
    await expect(this.page.getByText(status)).toBeVisible();
  }
);

Then('查詢結果應包含金額 {int}',
  async function (this: CustomWorld, amount: number) {
    await expect(this.page.getByText(String(amount))).toBeVisible();
  }
);
```

### 驗證空結果

```gherkin
When 用戶 "Bob" 查詢購物車中的所有商品
Then 查詢結果應為空列表
```

```typescript
Then('查詢結果應為空列表',
  async function (this: CustomWorld) {
    // 驗證空狀態提示
    await expect(this.page.getByText(/沒有|空|無/)).toBeVisible();

    // 或驗證列表項目數量為 0
    const items = this.page.getByTestId('cart-item');
    await expect(items).toHaveCount(0);
  }
);
```

### 驗證 DataTable

```gherkin
And 查詢結果應包含以下課程進度：
  | lessonId | progress | status |
  | 1        | 80       | 進行中  |
  | 2        | 100      | 已完成  |
```

```typescript
import { DataTable } from '@cucumber/cucumber';

Then('查詢結果應包含以下課程進度：',
  async function (this: CustomWorld, dataTable: DataTable) {
    const rows = dataTable.hashes();

    for (const row of rows) {
      await expect(this.page.getByText(`${row.progress}%`)).toBeVisible();
      await expect(this.page.getByText(row.status)).toBeVisible();
    }
  }
);
```

---

## Playwright Assertion 模式

### 元素可見性

```typescript
// 驗證元素存在且可見
await expect(this.page.getByText('課程進度')).toBeVisible();

// 驗證元素不可見
await expect(this.page.getByText('錯誤')).not.toBeVisible();
```

### 元素文字內容

```typescript
// 驗證精確文字
await expect(this.page.getByTestId('progress')).toHaveText('80%');

// 驗證包含文字
await expect(this.page.getByTestId('status')).toContainText('進行中');
```

### 元素數量

```typescript
// 驗證列表項目數量
await expect(this.page.getByTestId('item')).toHaveCount(3);
```

### 元素屬性

```typescript
// 驗證 input 值
await expect(this.page.getByLabel('進度')).toHaveValue('80');
```

---

## Selector 優先順序

```typescript
// 1. getByText（驗證顯示文字）
await expect(this.page.getByText('80%')).toBeVisible();

// 2. getByRole（驗證特定角色的元素）
await expect(this.page.getByRole('heading', { name: '課程進度' })).toBeVisible();

// 3. getByTestId（複雜結構需要精確定位）
await expect(this.page.getByTestId('progress-bar')).toBeVisible();

// 4. locator（最後手段）
await expect(this.page.locator('.progress-value')).toHaveText('80%');
```

---

## Critical Rules

### R1: 使用當前頁面驗證（不重新導航）
不重新導航頁面，使用 When 中已導航到的頁面。

```typescript
// ✅ 正確：直接驗證當前頁面
await expect(this.page.getByText('80%')).toBeVisible();

// ❌ 錯誤：重新導航
await this.page.goto('/lessons/1/progress'); // 不應該重新導航
```

### R2: 只驗證 Gherkin 提到的欄位
只 assert Gherkin 中明確提到的屬性。

```typescript
// Gherkin: And 查詢結果應包含進度 80

// ✅ 正確：只驗證 progress
await expect(this.page.getByText('80%')).toBeVisible();

// ❌ 錯誤：驗證額外的欄位
await expect(this.page.getByText('80%')).toBeVisible();
await expect(this.page.getByText(/更新時間/)).toBeVisible(); // Gherkin 沒提到
```

### R3: 使用 Playwright 的 auto-waiting
Playwright 的 `expect` 自帶 auto-waiting，不需要手動等待。

```typescript
// ✅ 正確：Playwright 自動等待
await expect(this.page.getByText('80%')).toBeVisible();

// ❌ 錯誤：手動等待
await this.page.waitForTimeout(2000);
const text = await this.page.getByText('80%').textContent();
assert.ok(text);
```

### R4: 列表驗證先確認數量
在驗證列表元素之前，先驗證數量。

```typescript
// ✅ 正確：先驗證數量
const items = this.page.getByTestId('item');
await expect(items).toHaveCount(2);
await expect(items.first().getByText('PROD-001')).toBeVisible();

// ❌ 錯誤：不確認數量
await expect(this.page.getByTestId('item').first().getByText('PROD-001')).toBeVisible();
```

### R5: 從頁面驗證，不驗證 API 回應
ReadModel-Then-Handler 驗證的是頁面顯示內容，不是 API 回應。

```typescript
// ✅ 正確：驗證頁面內容
await expect(this.page.getByText('80%')).toBeVisible();

// ❌ 錯誤：驗證 API 回應（那是 Aggregate-Then-Handler 的工作）
const apiCall = this.apiCalls.find(...);
assert.strictEqual(apiCall.body.progress, 80);
```

---

## 與 Aggregate-Then-Handler 的區別

| 面向 | ReadModel-Then-Handler | Aggregate-Then-Handler |
|------|----------------------|----------------------|
| 驗證對象 | 頁面 DOM 元素 | API 呼叫（MSW spy） |
| 資料來源 | `this.page.getByText(...)` | `this.apiCalls` |
| 使用時機 | Query 後驗證頁面顯示 | Command 後驗證 API 請求 |
| 範例 | And 查詢結果應包含進度 80% | And 用戶的進度應為 80% |

---

**文件版本**：E2E Playwright + Cucumber BDD Version 1.0
**適用框架**：TypeScript 5.2+ + React 18 + Playwright + @cucumber/cucumber
