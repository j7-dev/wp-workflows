---
name: aibdd.auto.typescript.e2e.handlers.aggregate-then
description: 當在前端 E2E Gherkin 測試中驗證「API 被正確呼叫」時，務必參考此規範。
user-invocable: false
---

# Aggregate-Then-Handler (E2E Playwright + Cucumber Version)

## Trigger
Then 語句驗證**Aggregate 的屬性狀態**（API 呼叫驗證）

**識別規則**：
- 驗證實體的屬性值（驗證 API 是否被正確呼叫）
- 描述「某個東西的某個屬性應該是某個值」
- 常見句型（非窮舉）：「在...的...應為」「的...應為」「應包含」

**通用判斷**：如果 Then 是驗證 Command 操作後的資料狀態（需要確認 API 被正確呼叫），就使用此 Handler

## Task
檢查 `this.apiCalls` 記錄 → 驗證 API 被呼叫且參數正確

## 前端 E2E 特色（與後端的差異）

| 面向 | 後端 E2E | 前端 E2E |
|------|---------|---------|
| 驗證對象 | 資料庫中的 Aggregate | **MSW 攔截的 API 呼叫** |
| 資料來源 | JPA Repository | **`this.apiCalls` 或 MSW spy** |
| 工具 | AssertJ | **Node.js assert / expect** |
| 使用時機 | Command 後驗證 DB 狀態 | **Command 後驗證 API 請求** |

---

## Steps

1. 從 `this.apiCalls` 取得 API 呼叫記錄
2. 找到對應的 API 呼叫
3. 驗證請求參數

---

## Pattern Examples

### 驗證 API 被呼叫且參數正確

```gherkin
When 用戶 "Alice" 更新課程 1 的影片進度為 80%
Then 用戶 "Alice" 在課程 1 的進度應為 80%
```

```typescript
// tests/steps/lesson/aggregateThen.ts
import { Then } from '@cucumber/cucumber';
import { CustomWorld } from '../../support/world';
import assert from 'node:assert';

Then('用戶 {string} 在課程 {int} 的進度應為 {int}%',
  async function (this: CustomWorld, userName: string, lessonId: number, progress: number) {
    // 找到對應的 API 呼叫
    const apiCall = this.apiCalls.find(call =>
      call.url.includes('/api/progress') &&
      call.method === 'POST'
    );

    assert.ok(apiCall, '找不到更新進度的 API 呼叫');

    // 驗證請求參數
    const body = apiCall.body as Record<string, unknown>;
    assert.strictEqual(body.lessonId, lessonId,
      `預期 lessonId ${lessonId}，實際 ${body.lessonId}`);
    assert.strictEqual(body.progress, progress,
      `預期 progress ${progress}，實際 ${body.progress}`);
  }
);
```

### 驗證多個屬性

```gherkin
And 用戶 "Alice" 在課程 1 的進度應為 80%，狀態應為 "進行中"
```

```typescript
const STATUS_MAP: Record<string, string> = {
  '進行中': 'IN_PROGRESS',
  '已完成': 'COMPLETED',
  '未開始': 'NOT_STARTED',
};

Then('用戶 {string} 在課程 {int} 的進度應為 {int}%，狀態應為 {string}',
  async function (this: CustomWorld, userName: string, lessonId: number, progress: number, status: string) {
    const expectedStatus = STATUS_MAP[status] ?? status;

    const apiCall = this.apiCalls.find(call =>
      call.url.includes('/api/progress') && call.method === 'POST'
    );

    assert.ok(apiCall, '找不到更新進度的 API 呼叫');

    const body = apiCall.body as Record<string, unknown>;
    assert.strictEqual(body.progress, progress);
    assert.strictEqual(body.status, expectedStatus);
  }
);
```

### 驗證 Aggregate 存在（頁面上顯示）

```gherkin
And 訂單 "ORDER-123" 應存在
```

```typescript
Then('訂單 {string} 應存在',
  async function (this: CustomWorld, orderId: string) {
    // 在前端 E2E 中，「存在」通常指頁面上可見
    const orderElement = this.page.getByText(orderId);
    await expect(orderElement).toBeVisible();
  }
);
```

---

## MSW API Call Spy 設定

### 在 hooks.ts 中設定 spy

```typescript
// tests/support/hooks.ts
import { Before } from '@cucumber/cucumber';
import { CustomWorld } from './world';

Before(async function (this: CustomWorld) {
  this.apiCalls = [];

  // 設定 MSW event listener 記錄所有 API 呼叫
  this.server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      this.apiCalls.push({
        url: url.pathname,
        method: request.method,
        body: request.body ? JSON.parse(request.body as string) : undefined,
      });
    }
  });
});
```

### 查詢 API 呼叫記錄

```typescript
// 找到所有 POST 請求
const postCalls = this.apiCalls.filter(call => call.method === 'POST');

// 找到特定 URL 的請求
const progressCalls = this.apiCalls.filter(call =>
  call.url.includes('/api/progress')
);
```

---

## 與後端 Aggregate-Then 的差異

| 面向 | 後端 Aggregate-Then | 前端 Aggregate-Then |
|------|-------------------|-------------------|
| 資料來源 | JPA Repository（DB） | `this.apiCalls`（MSW spy） |
| 驗證方式 | `assertThat(entity.getField())` | `assert.strictEqual(body.field)` |
| 查詢方式 | `repository.findByXxx()` | `apiCalls.find(call => ...)` |
| 前提 | 需要 DB 連線 | 只需 MSW spy 設定 |

---

## Critical Rules

### R1: 使用 API 呼叫記錄驗證（不查詢 DB）
前端 E2E 不連接後端 DB，使用 MSW spy 驗證 API 呼叫。

```typescript
// ✅ 正確：使用 this.apiCalls
const apiCall = this.apiCalls.find(call => call.url.includes('/api/progress'));
assert.ok(apiCall);

// ❌ 錯誤：查詢資料庫
const entity = await db.query('SELECT * FROM progress WHERE ...');
```

### R2: 只驗證 Gherkin 提到的欄位
只 assert Gherkin 中明確提到的屬性。

```typescript
// Gherkin: And 用戶 "Alice" 在課程 1 的進度應為 80%

// ✅ 正確：只驗證 progress
assert.strictEqual(body.progress, 80);

// ❌ 錯誤：驗證額外欄位
assert.strictEqual(body.progress, 80);
assert.ok(body.updatedAt); // Gherkin 沒提到
```

### R3: 中文狀態映射到英文
```typescript
// ✅ STATUS_MAP['進行中'] → 'IN_PROGRESS'
// ❌ assert.strictEqual(body.status, '進行中');
```

### R4: 提供清晰的錯誤訊息
```typescript
assert.ok(apiCall, '找不到更新進度的 API 呼叫');
assert.strictEqual(body.progress, progress,
  `預期 progress ${progress}，實際 ${body.progress}`);
```

### R5: 驗證前確認 API 呼叫存在
```typescript
// ✅ 正確：先確認存在
const apiCall = this.apiCalls.find(...);
assert.ok(apiCall, '找不到對應的 API 呼叫');
assert.strictEqual(apiCall.body.progress, 80);

// ❌ 錯誤：不檢查直接存取
const apiCall = this.apiCalls.find(...);
assert.strictEqual(apiCall!.body.progress, 80); // apiCall 可能是 undefined
```

---

## 與 ReadModel-Then-Handler 的區別

| 面向 | Aggregate-Then-Handler | ReadModel-Then-Handler |
|------|----------------------|----------------------|
| 驗證對象 | API 呼叫（MSW spy） | 頁面內容（DOM 元素） |
| 資料來源 | `this.apiCalls` | `this.page.getByText(...)` |
| 使用時機 | Command 後驗證 API 請求 | Query 後驗證頁面顯示 |
| 範例 | And 用戶的進度應為 80% | And 查詢結果應包含進度 80% |

---

**文件版本**：E2E Playwright + Cucumber BDD Version 1.0
**適用框架**：TypeScript 5.2+ + React 18 + Playwright + @cucumber/cucumber + MSW
