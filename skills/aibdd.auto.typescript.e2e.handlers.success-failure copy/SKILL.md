---
name: aibdd.auto.typescript.e2e.handlers.success-failure
description: 當在前端 E2E Gherkin 測試中驗證操作成功或失敗的 UI 回饋時，參考此規範。
user-invocable: false
---

# Success-Failure-Handler (E2E Playwright + Cucumber Version)

## Trigger
Then 語句描述**操作的成功或失敗結果**（UI 回饋驗證）

**識別規則**：
- 明確描述操作結果（成功/失敗）
- 常見句型：「操作成功」「操作失敗」「執行成功」「執行失敗」

**通用判斷**：如果 Then 只關注操作是否成功（UI 正面回饋）或失敗（錯誤訊息），就使用此 Handler

## Task
驗證頁面上的 UI 回饋：toast、alert、redirect、error message

## 前端 E2E 特色（與後端的差異）

| 面向 | 後端 E2E | 前端 E2E |
|------|---------|---------|
| 成功指標 | HTTP 2XX | **toast 成功訊息 / 頁面跳轉 / UI 更新** |
| 失敗指標 | HTTP 4XX | **error message / toast 錯誤 / alert** |
| 工具 | assertThat(statusCode) | **Playwright expect / getByText** |

---

## Pattern 1: 操作成功

```gherkin
When 用戶 "Alice" 更新課程 1 的影片進度為 80%
Then 操作成功
```

```typescript
// tests/steps/commonThen.ts
import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

Then('操作成功',
  async function (this: CustomWorld) {
    // 策略 1: 檢查成功 toast 訊息
    const successToast = this.page.getByText(/成功|完成|已更新|已儲存/);
    const hasToast = await successToast.isVisible().catch(() => false);

    if (hasToast) {
      await expect(successToast).toBeVisible();
      return;
    }

    // 策略 2: 檢查頁面沒有錯誤訊息
    const errorMessage = this.page.getByRole('alert');
    const hasError = await errorMessage.isVisible().catch(() => false);
    if (hasError) {
      const errorText = await errorMessage.textContent();
      throw new Error(`預期操作成功，但出現錯誤訊息：${errorText}`);
    }

    // 策略 3: 檢查沒有 error class 的元素
    const errorElements = this.page.locator('[class*="error"], [class*="Error"]');
    await expect(errorElements).toHaveCount(0);
  }
);
```

---

## Pattern 2: 操作失敗

```gherkin
When 用戶 "Alice" 更新課程 1 的影片進度為 60%
Then 操作失敗
```

```typescript
Then('操作失敗',
  async function (this: CustomWorld) {
    // 策略 1: 檢查錯誤 toast 或 alert
    const errorIndicator = this.page.getByText(/失敗|錯誤|無法|不允許|不可/);
    const hasError = await errorIndicator.isVisible().catch(() => false);

    if (hasError) {
      await expect(errorIndicator).toBeVisible();
      return;
    }

    // 策略 2: 檢查 role="alert" 元素
    const alert = this.page.getByRole('alert');
    await expect(alert).toBeVisible();
  }
);
```

---

## Error Message Verification

```gherkin
When 用戶 "Alice" 更新課程 1 的影片進度為 60%
Then 操作失敗
And 錯誤訊息應為 "進度不可倒退"
```

```typescript
Then('錯誤訊息應為 {string}',
  async function (this: CustomWorld, message: string) {
    // 在頁面上尋找錯誤訊息
    await expect(this.page.getByText(message)).toBeVisible();
  }
);
```

---

## 成功回饋類型

### Toast 訊息

```typescript
// 驗證成功 toast
await expect(this.page.getByText(/成功|已更新/)).toBeVisible();
```

### 頁面跳轉

```typescript
// 驗證跳轉到成功頁面
await expect(this.page).toHaveURL(/\/success|\/complete/);
```

### UI 狀態更新

```typescript
// 驗證按鈕狀態改變
await expect(this.page.getByRole('button', { name: /已送出/ })).toBeVisible();
```

---

## 失敗回饋類型

### 錯誤訊息

```typescript
// 驗證 inline 錯誤訊息
await expect(this.page.getByText('進度不可倒退')).toBeVisible();
```

### Error Toast

```typescript
// 驗證錯誤 toast
await expect(this.page.getByRole('alert')).toContainText(/失敗|錯誤/);
```

### 表單驗證錯誤

```typescript
// 驗證表單欄位錯誤
await expect(this.page.getByText(/此欄位為必填/)).toBeVisible();
```

---

## Complete Examples

### Example 1: 成功場景

```gherkin
Feature: 課程平台 - 增加影片進度

Rule: 影片進度必須單調遞增

  Example: 成功增加影片進度
    Given 用戶 "Alice" 在課程 1 的進度為 70%，狀態為 "進行中"
    When 用戶 "Alice" 更新課程 1 的影片進度為 80%
    Then 操作成功
    And 用戶 "Alice" 在課程 1 的進度應為 80%
```

### Example 2: 失敗場景

```gherkin
  Example: 進度不可倒退
    Given 用戶 "Alice" 在課程 1 的進度為 70%，狀態為 "進行中"
    When 用戶 "Alice" 更新課程 1 的影片進度為 60%
    Then 操作失敗
    And 錯誤訊息應為 "進度不可倒退"
    And 用戶 "Alice" 在課程 1 的進度應為 70%
```

---

## Critical Rules

### R1: 驗證 UI 回饋（不驗證 HTTP status code）
前端 E2E 驗證的是使用者可見的回饋，不是 HTTP 狀態碼。

```typescript
// ✅ 正確：驗證 UI 回饋
await expect(this.page.getByText(/成功/)).toBeVisible();

// ❌ 錯誤：驗證 HTTP status code
const response = await this.page.waitForResponse(...);
assert.strictEqual(response.status(), 200);
```

### R2: 不在 Success-Failure-Handler 中驗證頁面內容
只驗證成功/失敗回饋，不驗證具體的業務資料（那是 ReadModel-Then-Handler 的工作）。

```typescript
// ✅ 正確：只驗證成功回饋
await expect(this.page.getByText(/成功/)).toBeVisible();

// ❌ 錯誤：驗證業務資料
await expect(this.page.getByText('80%')).toBeVisible(); // ReadModel-Then 的工作
```

### R3: 使用 Playwright auto-waiting
Playwright 的 expect 自帶 auto-waiting，不需要手動等待。

```typescript
// ✅ 正確：Playwright 自動等待
await expect(this.page.getByText(/成功/)).toBeVisible();

// ❌ 錯誤：手動等待
await this.page.waitForTimeout(2000);
const text = await this.page.getByText(/成功/).textContent();
```

### R4: 失敗時資料狀態不應改變
失敗場景中，通常需要在另一個 Then 步驟驗證資料狀態未被修改。

```gherkin
Then 操作失敗
And 用戶 "Alice" 在課程 1 的進度應為 70%  # Aggregate-Then 驗證未改變
```

### R5: 錯誤訊息驗證是選填的
驗證錯誤訊息不是必須的，取決於 Gherkin 是否明確要求。

---

## File Organization

建議將 Success 和 Failure 的 step definitions 放在 `commonThen.ts`：

```
tests/steps/
└── commonThen.ts              # @Then("操作成功"), @Then("操作失敗"), @Then("錯誤訊息應為...")
```

---

**文件版本**：E2E Playwright + Cucumber BDD Version 1.0
**適用框架**：TypeScript 5.2+ + React 18 + Playwright + @cucumber/cucumber
