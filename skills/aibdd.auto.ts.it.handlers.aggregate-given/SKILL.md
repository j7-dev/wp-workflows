---
name: aibdd.auto.ts.it.handlers.aggregate-given
description: >
  當在 React IT Gherkin 測試中進行「系統初始狀態設定」時，「只能」使用此指令。
  使用 MSW server.use() 設定 mock API responses 作為測試的前置條件。
---

# Handler: aggregate-given（States Prepare）

## Trigger 辨識

Given 語句描述 **Aggregate 的存在狀態**，即定義系統中某些資料的初始值。

**識別規則**：
- 語句中包含實體名詞 + 屬性描述
- 描述「某個東西的某個屬性是某個值」
- 常見句型：「在...的...為」「的...為」「包含」「存在」「有」「系統中有」

**通用判斷**：如果 Given 是在建立測試的初始資料狀態（而非執行動作），就使用此 Handler。

## 任務

建立 Factory Test Data → 透過 `server.use()` 設定 MSW Handler → 使 Component fetch 到預設資料。

## 與 Command Handler（Given 用法）的區別

| | aggregate-given | command（Given 用法） |
|---|---|---|
| 目的 | 設定 MSW mock 回傳預設資料（繞過 UI 操作） | 透過 user-event 執行 UI 操作 |
| 層級 | MSW Handler 層 | UI 互動層 |
| 適用時機 | 純前置資料設定（「系統中有某些資料」） | 測試需要經過完整 UI 流程（「用戶已完成某操作」） |
| 語態 | 現在式/存在式（「有」「為」「包含」） | 過去式/完成式（「已訂閱」「已建立」） |

## 實作流程

1. 識別 Aggregate 名稱（從 TODO 標註或 Gherkin 語意）
2. 從 api.yml 找到對應的 API endpoint 和 response schema
3. 使用 Factory 函數建立 type-safe test data
4. 從 Gherkin 提取：屬性值、Key 值
5. 使用 `server.use()` 註冊 MSW handler，回傳 factory data
6. 若後續步驟需要引用此實體的 ID，將 ID 儲存到 describe scope 的 `let` 變數

## 程式碼範例

### 單一 Aggregate

```gherkin
Given 用戶 "Alice" 在課程 1 的進度為 70%，狀態為 "進行中"
```

```typescript
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { mockLessonProgress } from '@/test/factories';

// In beforeEach or at the start of it() block:
const lessonProgress = mockLessonProgress({
  userId: 'alice-id',
  lessonId: 1,
  progress: 70,
  status: 'IN_PROGRESS',
});

server.use(
  http.get('/api/v1/lessons/:lessonId/progress', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: lessonProgress,
    });
  })
);
```

### DataTable 批量建立

```gherkin
Given 系統中有以下用戶：
  | userId | name  | email           |
  | 1      | Alice | alice@test.com  |
  | 2      | Bob   | bob@test.com    |
```

```typescript
const users = [
  mockUser({ id: '1', name: 'Alice', email: 'alice@test.com' }),
  mockUser({ id: '2', name: 'Bob', email: 'bob@test.com' }),
];

server.use(
  http.get('/api/v1/users', () => {
    return HttpResponse.json({ success: true, data: users });
  })
);
```

### 多 Endpoint 前置

```gherkin
Given 用戶 "Alice" 已登入
And 課程 1 的名稱為 "物件導向基礎"
```

```typescript
server.use(
  http.get('/api/v1/auth/me', () => {
    return HttpResponse.json({ success: true, data: mockUser({ name: 'Alice' }) });
  }),
  http.get('/api/v1/lessons/:lessonId', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: mockLesson({ id: Number(params.lessonId), name: '物件導向基礎' }),
    });
  })
);
```

## 中文狀態映射

| 中文 | Enum Value | 情境 |
|-----|-----------|------|
| 進行中 | IN_PROGRESS | 進度、狀態 |
| 已完成 | COMPLETED | 進度、狀態 |
| 未開始 | NOT_STARTED | 進度、狀態 |
| 已付款 | PAID | 訂單 |
| 待付款 | PENDING | 訂單 |

## 共用規則

1. **R1: 使用 Factory 函數建立 test data** — 不手動拼 JSON，確保型別安全
2. **R2: MSW handler 透過 server.use() 註冊** — 每個 test 的 afterEach 會 resetHandlers
3. **R3: 資料值來自 Gherkin Feature** — 不自行編造
4. **R4: 中文狀態映射** — 中文 → enum 值（與 api.yml 一致）
5. **R5: 回應結構符合 api.yml response schema** — 含 envelope 如 `{ success: true, data: ... }`
6. **R6: 需要跨步驟引用的 ID 存入 describe scope 變數** — `let userId: string;`
7. **R7: DataTable 每列對應一筆 factory 資料**
8. **R8: 多 Aggregate 可在同一個 server.use() 中註冊多個 handler**
