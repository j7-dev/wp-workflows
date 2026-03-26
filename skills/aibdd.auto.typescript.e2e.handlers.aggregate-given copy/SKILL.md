---
name: aibdd.auto.typescript.e2e.handlers.aggregate-given
description: 當在前端 E2E Gherkin 測試中進行「MSW mock 資料設定（for 測試情境的前置系統狀態設立）」，「只能」使用此指令。
user-invocable: false
---

# Aggregate-Given-Handler (E2E Playwright + Cucumber Version)

## Trigger
Given 語句描述**Aggregate 的存在狀態**，即定義 Aggregate 的屬性值

**識別規則**：
- 語句中包含實體名詞 + 屬性描述
- 描述「某個東西的某個屬性是某個值」
- 常見句型（非窮舉）：「在...的...為」「的...為」「包含」「存在」「有」

**通用判斷**：如果 Given 是在建立測試的初始資料狀態（而非執行動作），就使用此 Handler

## Task
設定 MSW handler → 回傳 fixture 資料 → 儲存 ID 到 `this.ids`

## 前端 E2E 特色（與後端的差異）

| 面向 | 後端 E2E | 前端 E2E |
|------|---------|---------|
| 資料來源 | 寫入真實 DB | **設定 MSW mock** |
| 工具 | JPA Repository | **MSW `http.get()` / `http.post()`** |
| 持久化 | PostgreSQL | **記憶體中的 fixture** |
| ID 儲存 | ScenarioContext | **`this.ids`** |

---

## Steps

1. 從 Gherkin 提取 fixture 資料（屬性值）
2. 建立 fixture 物件
3. 設定 MSW handler 回傳此 fixture
4. 將 ID 儲存到 `this.ids`

---

## Pattern Examples

### 單一 Aggregate

```gherkin
Given 用戶 "Alice" 在課程 1 的進度為 70%，狀態為 "進行中"
```

```typescript
// tests/steps/lesson/aggregateGiven.ts
import { Given } from '@cucumber/cucumber';
import { http, HttpResponse } from 'msw';
import { CustomWorld } from '../../support/world';

const STATUS_MAP: Record<string, string> = {
  '進行中': 'IN_PROGRESS',
  '已完成': 'COMPLETED',
  '未開始': 'NOT_STARTED',
};

Given('用戶 {string} 在課程 {int} 的進度為 {int}%，狀態為 {string}',
  async function (this: CustomWorld, userName: string, lessonId: number, progress: number, status: string) {
    const userId = this.ids[userName];
    if (!userId) {
      throw new Error(`找不到用戶 '${userName}' 的 ID，請先在 Given 步驟中建立用戶`);
    }

    const dbStatus = STATUS_MAP[status] ?? status;

    // 設定 MSW handler 回傳此 fixture
    this.server.use(
      http.get(`/api/lessons/${lessonId}/progress`, () => {
        return HttpResponse.json({
          userId,
          lessonId,
          progress,
          status: dbStatus,
        });
      })
    );
  }
);
```

### 建立用戶（DataTable）

```gherkin
Given 系統中有以下用戶：
  | userId | name  | email           |
  | 1      | Alice | alice@test.com  |
  | 2      | Bob   | bob@test.com    |
```

```typescript
import { Given } from '@cucumber/cucumber';
import { DataTable } from '@cucumber/cucumber';
import { CustomWorld } from '../../support/world';

Given('系統中有以下用戶：',
  async function (this: CustomWorld, dataTable: DataTable) {
    const rows = dataTable.hashes();

    for (const row of rows) {
      // 儲存 ID 到 this.ids（用名稱作為 key）
      this.ids[row.name] = row.userId;
    }
  }
);
```

### 設定列表回應

```gherkin
Given 用戶 "Alice" 的購物車中有以下商品：
  | productId | name    | quantity |
  | PROD-001  | MacBook | 1        |
  | PROD-002  | iPad    | 2        |
```

```typescript
Given('用戶 {string} 的購物車中有以下商品：',
  async function (this: CustomWorld, userName: string, dataTable: DataTable) {
    const items = dataTable.hashes();

    this.server.use(
      http.get('/api/cart/items', () => {
        return HttpResponse.json({ items });
      })
    );
  }
);
```

---

## MSW Handler 設定模式

### 回傳單一物件

```typescript
this.server.use(
  http.get('/api/resource/:id', ({ params }) => {
    return HttpResponse.json({ id: params.id, ...fixtureData });
  })
);
```

### 回傳列表

```typescript
this.server.use(
  http.get('/api/resources', () => {
    return HttpResponse.json({ items: fixtureList });
  })
);
```

### 動態回應（根據 request 參數）

```typescript
this.server.use(
  http.get('/api/lessons/:lessonId/progress', ({ params }) => {
    const fixture = fixtures.find(f => f.lessonId === Number(params.lessonId));
    if (!fixture) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(fixture);
  })
);
```

---

## State Mapping

| 中文範例 | 英文範例 | 適用情境 |
|---------|---------|---------|
| 進行中 | IN_PROGRESS | 進度、狀態 |
| 已完成 | COMPLETED | 進度、狀態 |
| 未開始 | NOT_STARTED | 進度、狀態 |
| 已付款 | PAID | 訂單、付款 |
| 待付款 | PENDING | 訂單、付款 |

---

## Critical Rules

### R1: 使用 MSW 設定 mock（不操作真實 DB）
前端 E2E 不連接後端資料庫，使用 MSW mock API 回應。

```typescript
// ✅ 正確：使用 MSW
this.server.use(
  http.get('/api/progress', () => HttpResponse.json(fixture))
);

// ❌ 錯誤：嘗試操作資料庫
await db.insert(progressTable).values(fixture);
```

### R2: 儲存 ID 到 this.ids
每個 Given 中建立的 Aggregate 都要將其 natural key 儲存到 `this.ids`。

```typescript
// ✅ 正確：儲存到 this.ids
this.ids['Alice'] = '1';

// ❌ 錯誤：沒有儲存
// 後續步驟無法取得用戶 ID
```

### R3: Fixture 資料使用 camelCase
```typescript
// ✅ { lessonId: 1, userId: '1', progress: 80 }
// ❌ { lesson_id: 1, user_id: '1', progress: 80 }
```

### R4: 中文狀態映射到英文
```typescript
// ✅ STATUS_MAP['進行中'] → 'IN_PROGRESS'
// ❌ 直接使用 '進行中' 作為 fixture 資料
```

### R5: 檢查依賴的 ID 是否存在
```typescript
const userId = this.ids[userName];
if (!userId) {
  throw new Error(`找不到用戶 '${userName}' 的 ID，請先建立用戶`);
}
```

### R6: MSW handler 使用 `this.server.use()` 覆蓋
使用 `this.server.use()` 設定 scenario-specific 的 handler，它會覆蓋預設的 handler。

---

**文件版本**：E2E Playwright + Cucumber BDD Version 1.0
**適用框架**：TypeScript 5.2+ + React 18 + Playwright + @cucumber/cucumber + MSW
