---
name: aibdd.auto.typescript.e2e.handlers.command
description: 當在前端 E2E Gherkin 中撰寫使用者互動步驟（click, type, submit）時，務必參考此規範。
user-invocable: false
---

# Command-Handler (E2E Playwright + Cucumber Version)

## Trigger
Given/When 語句執行**寫入操作**（Command）

**識別規則**：
- 動作會修改系統狀態
- Given 常見過去式：「已訂閱」「已完成」「已建立」
- When 常見現在式：「更新」「提交」「建立」「刪除」「添加」

**通用判斷**：如果語句是修改系統狀態的操作，就使用此 Handler

## Task
使用 Playwright 執行使用者互動操作（click, type, submit）

## 前端 E2E 特色（與後端的差異）

| 面向 | 後端 E2E | 前端 E2E |
|------|---------|---------|
| 操作方式 | HTTP POST/PUT/DELETE | **Playwright 使用者互動** |
| 工具 | TestRestTemplate | **page.getByRole(), page.click()** |
| 認證 | JWT Token in Header | **已登入狀態（頁面 session）** |
| 結果儲存 | ScenarioContext.lastResponse | **等待頁面更新或 API 回應** |

---

## 實作流程

1. **找到 UI 元素**（使用語義化選擇器）
2. **執行互動操作**（click, type, fill, select）
3. **等待 API 回應或頁面更新**（waitForResponse, waitForSelector）

---

## Pattern Examples

### When + Command（使用者填表送出）

```gherkin
When 用戶 "Alice" 更新課程 1 的影片進度為 80%
```

```typescript
// tests/steps/lesson/commands.ts
import { When } from '@cucumber/cucumber';
import { CustomWorld } from '../../support/world';

When('用戶 {string} 更新課程 {int} 的影片進度為 {int}%',
  async function (this: CustomWorld, userName: string, lessonId: number, progress: number) {
    // 1. 找到進度輸入欄位
    const progressInput = this.page.getByRole('spinbutton', { name: /進度/ });
    await progressInput.fill(String(progress));

    // 2. 點擊送出按鈕
    const submitButton = this.page.getByRole('button', { name: /更新|送出/ });
    await submitButton.click();

    // 3. 等待 API 回應
    await this.page.waitForResponse(resp =>
      resp.url().includes('/api/progress') && resp.request().method() === 'POST'
    );
  }
);
```

### When + Command（點擊按鈕）

```gherkin
When 用戶 "Alice" 取消訂單 "ORDER-123"
```

```typescript
When('用戶 {string} 取消訂單 {string}',
  async function (this: CustomWorld, userName: string, orderId: string) {
    // 找到取消按鈕
    const cancelButton = this.page.getByRole('button', { name: /取消/ });
    await cancelButton.click();

    // 等待確認對話框並確認
    const confirmButton = this.page.getByRole('button', { name: /確認/ });
    await confirmButton.click();

    // 等待 API 回應
    await this.page.waitForResponse(resp =>
      resp.url().includes(`/api/orders/${orderId}`) && resp.request().method() === 'DELETE'
    );
  }
);
```

### When + Command（多欄位表單）

```gherkin
When 用戶 "Alice" 建立訂單，配送地址為 "台北市信義區"，付款方式為 "信用卡"
```

```typescript
When('用戶 {string} 建立訂單，配送地址為 {string}，付款方式為 {string}',
  async function (this: CustomWorld, userName: string, address: string, paymentMethod: string) {
    // 填寫表單
    await this.page.getByLabel(/配送地址/).fill(address);
    await this.page.getByLabel(/付款方式/).selectOption(paymentMethod);

    // 送出表單
    await this.page.getByRole('button', { name: /建立訂單|送出/ }).click();

    // 等待 API 回應
    await this.page.waitForResponse(resp =>
      resp.url().includes('/api/orders') && resp.request().method() === 'POST'
    );
  }
);
```

### Given + Command（已完成的動作）

```gherkin
Given 用戶 "Alice" 已訂閱旅程 1
```

```typescript
Given('用戶 {string} 已訂閱旅程 {int}',
  async function (this: CustomWorld, userName: string, journeyId: number) {
    // Given + Command：透過 MSW 設定已訂閱的狀態
    // 不需要實際操作 UI，直接設定 mock
    this.server.use(
      http.get(`/api/journeys/${journeyId}/subscription`, () => {
        return HttpResponse.json({
          userId: this.ids[userName],
          journeyId,
          subscribed: true,
        });
      })
    );
  }
);
```

---

## Playwright Selector 優先順序

```typescript
// 1. getByRole（最推薦）
this.page.getByRole('button', { name: /送出/ });
this.page.getByRole('textbox', { name: /搜尋/ });
this.page.getByRole('spinbutton', { name: /進度/ });

// 2. getByLabel（表單元素）
this.page.getByLabel(/電子郵件/);
this.page.getByLabel(/密碼/);

// 3. getByText（文字內容）
this.page.getByText('課程進度');

// 4. getByTestId（最後手段）
this.page.getByTestId('progress-form');
```

---

## Given vs When Command

### Given + Command（已完成的動作）
- 用於建立測試前置條件
- **通常透過 MSW mock 設定狀態**（不操作 UI）
- 常用過去式：「已訂閱」「已完成」「已建立」

### When + Command（現在執行的動作）
- 用於執行被測試的動作
- **使用 Playwright 操作 UI**
- 常用現在式：「更新」「提交」「建立」

---

## Critical Rules

### R1: Command 不驗證結果
在 Command Handler 中只執行操作，不驗證結果（交給 Then）。

```typescript
// ✅ 正確：不驗證，只操作
await submitButton.click();
await this.page.waitForResponse(...);

// ❌ 錯誤：在 Command 中驗證
await submitButton.click();
await expect(this.page.getByText('成功')).toBeVisible(); // 應該在 Then 中驗證
```

### R2: 使用語義化 Playwright Selectors
```typescript
// ✅ 正確：語義化選擇器
this.page.getByRole('button', { name: /送出/ });

// ❌ 錯誤：CSS 選擇器
this.page.locator('.btn-primary');
```

### R3: 等待 API 回應或頁面更新
操作完成後等待，避免競態條件。

```typescript
// ✅ 正確：等待 API 回應
await this.page.waitForResponse(resp => resp.url().includes('/api/...'));

// ❌ 錯誤：使用固定等待
await this.page.waitForTimeout(2000);
```

### R4: Given + Command 優先使用 MSW mock
Given 中的已完成動作，優先透過 MSW 設定狀態，而非操作 UI。

```typescript
// ✅ 正確：Given 用 MSW mock
Given('用戶 "Alice" 已訂閱旅程 1', async function (this: CustomWorld) {
  this.server.use(http.get('/api/subscriptions', () => HttpResponse.json({...})));
});

// ⚠️ 避免：Given 操作 UI（速度慢且脆弱）
```

### R5: 檢查 userId 是否存在
```typescript
const userId = this.ids[userName];
if (!userId) {
  throw new Error(`找不到用戶 '${userName}' 的 ID`);
}
```

---

**文件版本**：E2E Playwright + Cucumber BDD Version 1.0
**適用框架**：TypeScript 5.2+ + React 18 + Playwright + @cucumber/cucumber + MSW
