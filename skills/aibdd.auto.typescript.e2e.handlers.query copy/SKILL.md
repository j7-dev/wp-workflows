---
name: aibdd.auto.typescript.e2e.handlers.query
description: 當在前端 E2E Gherkin 中撰寫頁面導航步驟（goto, waitFor）時，務必參考此規範。
user-invocable: false
---

# Query-Handler (E2E Playwright + Cucumber Version)

## Trigger
When 語句執行**讀取操作**（Query）

**識別規則**：
- 動作不修改系統狀態，只讀取資料
- 描述「取得某些資訊」的動作
- 常見動詞（非窮舉）：「查詢」「取得」「列出」「檢視」「獲取」

**通用判斷**：如果 When 是讀取操作且需要頁面顯示結果供 Then 驗證，就使用此 Handler

## Task
使用 `page.goto()` 導航到頁面，等待資料載入完成

## 前端 E2E 特色（與後端的差異）

| 面向 | 後端 E2E | 前端 E2E |
|------|---------|---------|
| 操作方式 | HTTP GET | **page.goto() 頁面導航** |
| 工具 | TestRestTemplate | **Playwright page** |
| 結果呈現 | Response body JSON | **頁面 DOM 元素** |
| 等待方式 | 同步回應 | **waitForSelector / waitForLoadState** |

---

## 實作流程

1. **構建目標 URL**
2. **使用 `page.goto()` 導航**
3. **等待頁面載入完成**（waitForSelector, waitForLoadState）

---

## Pattern Examples

### Query 單一記錄

```gherkin
When 用戶 "Alice" 查詢課程 1 的進度
```

```typescript
// tests/steps/lesson/query.ts
import { When } from '@cucumber/cucumber';
import { CustomWorld } from '../../support/world';

When('用戶 {string} 查詢課程 {int} 的進度',
  async function (this: CustomWorld, userName: string, lessonId: number) {
    // 導航到課程進度頁面
    await this.page.goto(`/lessons/${lessonId}/progress`);

    // 等待頁面載入完成
    await this.page.waitForLoadState('networkidle');
  }
);
```

### Query 列表

```gherkin
When 用戶 "Alice" 查詢購物車中的所有商品
```

```typescript
When('用戶 {string} 查詢購物車中的所有商品',
  async function (this: CustomWorld, userName: string) {
    await this.page.goto('/cart');
    await this.page.waitForLoadState('networkidle');
  }
);
```

### Query 帶篩選條件

```gherkin
When 用戶 "Alice" 查詢類別為 "電子產品" 的商品列表
```

```typescript
When('用戶 {string} 查詢類別為 {string} 的商品列表',
  async function (this: CustomWorld, userName: string, category: string) {
    await this.page.goto(`/products?category=${encodeURIComponent(category)}`);
    await this.page.waitForLoadState('networkidle');
  }
);
```

### Query 訂單詳情

```gherkin
When 用戶 "Alice" 查詢訂單 "ORDER-123" 的詳情
```

```typescript
When('用戶 {string} 查詢訂單 {string} 的詳情',
  async function (this: CustomWorld, userName: string, orderId: string) {
    await this.page.goto(`/orders/${orderId}`);
    await this.page.waitForLoadState('networkidle');
  }
);
```

---

## 等待策略

### waitForLoadState

```typescript
// 等待所有網路請求完成
await this.page.waitForLoadState('networkidle');

// 等待 DOM 載入完成
await this.page.waitForLoadState('domcontentloaded');
```

### waitForSelector

```typescript
// 等待特定元素出現（表示資料已載入）
await this.page.waitForSelector('[data-testid="progress-display"]');
```

### waitForResponse

```typescript
// 等待特定 API 回應
await this.page.waitForResponse(resp =>
  resp.url().includes('/api/lessons') && resp.status() === 200
);
```

---

## URL 構建模式

### Path Parameters

```typescript
// 從 Gherkin 提取參數，構建 URL
const lessonId = 1;
await this.page.goto(`/lessons/${lessonId}/progress`);
```

### Query Parameters

```typescript
// 使用 URLSearchParams 構建查詢字串
const params = new URLSearchParams({ category, page: '1' });
await this.page.goto(`/products?${params.toString()}`);
```

---

## Critical Rules

### R1: Query 不驗證頁面內容
Query Handler 只負責導航和等待，不驗證頁面內容（交給 ReadModel-Then-Handler）。

```typescript
// ✅ 正確：只導航，不驗證
await this.page.goto('/lessons/1/progress');
await this.page.waitForLoadState('networkidle');

// ❌ 錯誤：在 Query Handler 中驗證
await this.page.goto('/lessons/1/progress');
await expect(this.page.getByText('80%')).toBeVisible(); // 應該在 Then 中驗證
```

### R2: 使用 `page.goto()` 導航
Query 操作對應頁面導航。

```typescript
// ✅ 正確：使用 goto
await this.page.goto('/lessons/1/progress');

// ❌ 錯誤：使用 click 導航（那是 Command 的行為）
await this.page.getByText('查看進度').click();
```

### R3: 等待頁面載入完成
導航後必須等待，避免競態條件。

```typescript
// ✅ 正確：等待載入完成
await this.page.goto(url);
await this.page.waitForLoadState('networkidle');

// ❌ 錯誤：沒有等待
await this.page.goto(url);
// 直接進入 Then 可能還沒載入完成
```

### R4: URL 使用正確的編碼
包含中文或特殊字元的 URL 需要編碼。

```typescript
// ✅ 正確：使用 encodeURIComponent
await this.page.goto(`/products?category=${encodeURIComponent('電子產品')}`);

// 或使用 URLSearchParams（自動編碼）
const params = new URLSearchParams({ category: '電子產品' });
await this.page.goto(`/products?${params.toString()}`);
```

### R5: 不使用固定等待
```typescript
// ✅ 正確：事件驅動等待
await this.page.waitForLoadState('networkidle');

// ❌ 錯誤：固定等待
await this.page.waitForTimeout(3000);
```

---

## 與 Command-Handler 的區別

| 面向 | Query-Handler | Command-Handler |
|------|--------------|----------------|
| UI 操作 | `page.goto()` 導航 | `page.click()` / `page.fill()` 互動 |
| 目的 | 瀏覽頁面 | 修改系統狀態 |
| 驗證方式 | ReadModel-Then（驗證頁面內容） | Success-Failure（驗證 UI 回饋） |
| HTTP 方法 | 對應 GET（頁面初始載入） | 對應 POST/PUT/DELETE（表單送出） |

---

**文件版本**：E2E Playwright + Cucumber BDD Version 1.0
**適用框架**：TypeScript 5.2+ + React 18 + Playwright + @cucumber/cucumber
