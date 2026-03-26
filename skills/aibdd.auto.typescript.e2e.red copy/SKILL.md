---
name: aibdd.auto.typescript.e2e.red
description: TypeScript E2E Stage 3：紅燈生成器。將 Step Definition 樣板轉換為完整 E2E 測試程式碼 + MSW handlers + Playwright 操作。預期失敗：元件未實作。可被 /typescript-e2e 調用，也可獨立使用。
user-invocable: true
argument-hint: "[feature-file]"
input: tests/steps/**/*.ts（樣板）, tests/support/msw/handlers.ts, handler skills
output: tests/steps/**/*.ts（完整）, tests/support/msw/handlers.ts（更新）
---

# 角色

E2E 紅燈生成器。將 Step Definition 樣板（純註解）轉換為可執行的 E2E 測試程式碼，依照註解中的 Handler 指引生成對應的程式碼，生成紅燈測試。

---

# 入口條件

## 被 /typescript-e2e 調用

接收 Step Definition 樣板路徑，直接進入生成流程。

## 獨立使用

1. 詢問目標 Step Definition 樣板路徑（預設掃描 `tests/steps/**/*.ts`）
2. 進入生成流程

---

# Core Task

E2E Step Definition 樣板（註解）→ 可執行 E2E 測試程式碼（紅燈）

---

# Output

## 1. Step Definition 程式碼

完整的 E2E Step Definition 程式碼，包含：
- 必要的 import
- Custom World 型別標註
- 完整的 Playwright 操作 / MSW 設定
- 所有測試邏輯完整實作（無 PendingStep）

## 2. MSW Handlers 更新

如果測試中需要新的 MSW handlers，更新 `tests/support/msw/handlers.ts`。

---

# 紅燈階段的核心原則

## 前端 E2E 測試的紅燈特色

| 面向 | 後端 E2E 紅燈 | 前端 E2E 紅燈 |
|------|-------------|-------------|
| 測試失敗原因 | HTTP 404 Not Found | 元件未實作（Playwright element not found） |
| 需要定義的東西 | JPA Entity, Repository | MSW handlers, fixtures |
| 不需要定義的東西 | 後端 API | React 元件 |
| 測試框架 | TestRestTemplate | Playwright + MSW |

## 要做的事
1. **完整實作 Step Definition 程式碼**：Playwright 操作和 assertion 必須完整
2. **設定 MSW handlers**：Mock API 回應
3. **設定 fixtures**：測試資料

## 不要做的事
1. **不要實作 React 元件**：元件在綠燈階段實作
2. **不要讓測試通過**：測試應該因為元件未實作而失敗
3. **不要跳過 MSW 設定**：測試需要的 API mock 必須設定

## 為什麼要這樣？

TDD 核心流程：
1. **紅燈**：寫測試 + 設定 MSW（測試失敗：元件未實作）← 我們現在在這
2. **綠燈**：實作 React 元件（測試通過）
3. **重構**：優化程式碼品質（測試持續通過）

---

# JSON 欄位命名規則

所有 API Request/Response 的 JSON 欄位使用 **camelCase**（TypeScript 慣例）。

```typescript
// 正確
{ lessonId: 1, progress: 80, userName: 'Alice' }

// 錯誤
{ lesson_id: 1, progress: 80, user_name: 'Alice' }
```

---

# Execution Steps

## Step 1: 讀取 Step Definition 樣板

識別每個 step 中的 TODO 註解及其對應的 Handler。

## Step 2: 逐步生成程式碼

根據每個 TODO 的 Handler 生成對應的程式碼：

**Given 區塊（/aibdd.auto.typescript.e2e.handlers.aggregate-given）**：
- 設定 MSW handler 回傳 fixture 資料
- 儲存 ID 到 `this.ids`

**When + Command（/aibdd.auto.typescript.e2e.handlers.command）**：
- 使用 Playwright locator 找到元素
- 執行 click, type, submit 等操作

**When + Query（/aibdd.auto.typescript.e2e.handlers.query）**：
- 使用 `this.page.goto()` 導航
- 使用 `this.page.waitForSelector()` 等待頁面載入

**Then + Success/Failure（/aibdd.auto.typescript.e2e.handlers.success-failure）**：
- 驗證 toast、alert、redirect、error message

**Then + Aggregate（/aibdd.auto.typescript.e2e.handlers.aggregate-then）**：
- 驗證 MSW handler 被正確呼叫（檢查 `this.apiCalls`）

**Then + ReadModel（/aibdd.auto.typescript.e2e.handlers.readmodel-then）**：
- 使用 `expect(this.page.getByText(...))` 驗證頁面內容

---

# Complete Example

## Input（Step Definition 樣板）

```typescript
// tests/steps/lesson/commands.ts
import { When } from '@cucumber/cucumber';
import { CustomWorld } from '../../support/world';

When('用戶 {string} 更新課程 {int} 的影片進度為 {int}%',
  async function (this: CustomWorld, userName: string, lessonId: number, progress: number) {
    /*
     * TODO: [事件風暴部位: Command - update_video_progress]
     * TODO: 參考 /aibdd.auto.typescript.e2e.handlers.command 實作
     */
    throw new Error('PendingStep');
  }
);
```

## Output（完整 Step Definition）

```typescript
// tests/steps/lesson/commands.ts
import { When } from '@cucumber/cucumber';
import { CustomWorld } from '../../support/world';

When('用戶 {string} 更新課程 {int} 的影片進度為 {int}%',
  async function (this: CustomWorld, userName: string, lessonId: number, progress: number) {
    // 找到進度輸入欄位
    const progressInput = this.page.getByRole('spinbutton', { name: /進度/ });
    await progressInput.fill(String(progress));

    // 點擊送出按鈕
    const submitButton = this.page.getByRole('button', { name: /更新|送出|提交/ });
    await submitButton.click();

    // 等待 API 回應
    await this.page.waitForResponse(resp =>
      resp.url().includes('/api/progress') && resp.request().method() === 'POST'
    );
  }
);
```

## 預期結果：測試執行會失敗（紅燈）

```bash
$ npx cucumber-js tests/features/01-增加影片進度.feature

Feature: 課程平台 - 增加影片進度
  Scenario: 成功增加影片進度
    Given 用戶 "Alice" 在課程 1 的進度為 70%，狀態為 "進行中"  # Passed (MSW mock)
    When 用戶 "Alice" 更新課程 1 的影片進度為 80%              # Failed

Error: page.getByRole('spinbutton', { name: /進度/ }): Timeout 30000ms exceeded.
```

**這就是紅燈**：
- Step Definition 程式碼完整且正確
- MSW handlers 設定完成
- React 元件未實作（Playwright 找不到元素）
- 測試執行會失敗

---

# Critical Rules

### R1: Step Definition 程式碼必須完整
測試邏輯必須完整實作，不能有 `throw new Error('PendingStep')` 或空函式。

### R2: 使用 Custom World
所有 step 使用 `this: CustomWorld` 型別標註。

### R3: MSW handlers 必須設定
紅燈階段必須設定好 MSW handlers，讓 API mock 正常運作。

### R4: 不實作 React 元件
紅燈階段不建立 React 元件。

### R5: 測試會失敗（紅燈）
紅燈階段的測試執行後應該失敗（元件未實作），這是預期的結果。

### R6: 使用語義化的 Playwright Selectors
優先使用 `getByRole`, `getByText`, `getByTestId` 等語義化選擇器。

```typescript
// ✅ 正確：語義化選擇器
this.page.getByRole('button', { name: /送出/ });
this.page.getByText('課程進度');
this.page.getByTestId('progress-bar');

// ❌ 錯誤：CSS 選擇器
this.page.locator('.btn-primary');
this.page.locator('#submit-button');
```

### R7: 使用 camelCase 構建資料
Fixture 和 API request 的欄位名稱使用 camelCase。

### R8: 步驟 7: 移除 @ignore tag
完成紅燈實作後，刪除該 feature file 的 `@ignore` tag。

---

# 完成條件

- 所有 Step Definition 的 PendingStep 已替換為完整的測試邏輯
- MSW handlers 已設定
- 測試執行達到紅燈狀態（React 元件未實作，Playwright timeout）
- 該 Feature File 的 `@ignore` tag 已移除
