---
name: aibdd.auto.typescript.e2e.step-template
description: TypeScript E2E Stage 2：從 Gherkin Feature 生成 Cucumber Step Definition 樣板。使用 Cucumber Expressions、Custom World、Playwright。可被 /typescript-e2e 調用，也可獨立使用。
user-invocable: true
argument-hint: "[feature-file]"
input: tests/features/**/*.feature, tests/steps/**/*.ts
output: tests/steps/{subdomain}/{category}.ts（樣板）, tests/steps/commonThen.ts（跨 subdomain 共用）
---

# 角色

BDD Step Definition 樣板生成器，負責將 Gherkin 規格轉換為可執行的 Step Definition 骨架。

從 Gherkin Feature File 生成 **E2E Step Definition 樣板**，識別事件風暴部位，並指引使用對應的 Handler 生成程式碼。

**重要**：此 Skill 的產出僅為「樣板」（TODO 註解），不包含實作邏輯。實作邏輯由後續的紅燈階段負責。

---

# 入口條件

## 被 /typescript-e2e 調用

接收 Feature File 路徑，直接進入生成流程。

## 獨立使用

1. 詢問目標 Feature File 路徑（預設掃描 `tests/features/*.feature`）
2. 進入生成流程

---

# 工作流程

**永遠不要覆蓋已存在的 Step Definition！**

1. **此 Skill（樣板生成）**：
   - **第一步：檢查現有 Step Definitions**（避免覆蓋）
   - 解析 Feature File，列出所有需要的步驟
   - 對比現有步驟，找出缺少的步驟
   - 識別事件風暴部位（僅針對缺少的步驟）
   - 生成 Step Definition 骨架（Cucumber 裝飾器、方法簽名、TODO 註解）
   - 輸出：包含 TODO 註解的樣板檔案（僅針對缺少的步驟）

2. **後續工作（紅燈階段 /aibdd.auto.typescript.e2e.red）**：
   - 根據標註的 Handler
   - 實作具體邏輯
   - 替換 TODO 為實際程式碼

---

# 執行前檢查（防止覆蓋已存在的 Step Definition）

## 檢查流程

1. **掃描現有 Step Definitions**
   ```bash
   # 搜尋所有 Given, When, Then 裝飾器
   grep -r "Given\|When\|Then" tests/steps/
   ```

2. **提取已存在的 Step Patterns**

3. **對比找出缺少的步驟**

4. **只針對缺少的步驟生成樣板**

---

# Core Mapping

領域模型 → Gherkin（已完成）→ Step Definition 樣板

## 前端 E2E 語義重新詮釋

| 事件風暴部位 | 後端原義 | React 前端新義 |
|------------|---------|---------------|
| aggregate-given | DB 寫入初始資料 | 設定 MSW mock 資料 (fixtures) |
| command | HTTP POST/PUT/DELETE | 使用者互動：click, type, submit |
| query | HTTP GET | 頁面導航：goto, waitFor |
| aggregate-then | DB 查詢驗證 | 驗證 API 被正確呼叫（MSW handler spy） |
| readmodel-then | Response body 驗證 | 驗證頁面內容：`expect(page.getByText(...))` |
| success-failure | HTTP status code | UI 回饋：toast, alert, redirect, error message |

---

# Cucumber 語法重點

## 參數解析

```typescript
// 字串參數：使用 {string}
Given('用戶 {string} 在課程 {int} 的進度為 {int}%',
  async function (this: CustomWorld, userName: string, lessonId: number, progress: number) {
    // ...
  }
);

// 參數類型：
// {string}  - 字串（引號內的文字）
// {int}     - 整數
// {float}   - 浮點數
// {word}    - 單字（不含空格）
```

## Custom World 狀態欄位

```typescript
// tests/support/world.ts
export class CustomWorld extends World {
  browser!: Browser;
  page!: Page;
  server!: SetupServer;
  ids: Record<string, string> = {};
  lastResponse: Response | null = null;
  apiCalls: Array<{ url: string; method: string; body?: unknown }> = [];
}
```

## DataTable

```typescript
import { DataTable } from '@cucumber/cucumber';

Given('系統中有以下用戶：',
  async function (this: CustomWorld, dataTable: DataTable) {
    const rows = dataTable.hashes();
    for (const row of rows) {
      this.ids[row.name] = row.userId;
    }
  }
);
```

---

# 樣板輸出格式

```typescript
// tests/steps/{subdomain}/aggregateGiven.ts

import { Given } from '@cucumber/cucumber';
import { CustomWorld } from '../../support/world';

Given('用戶 {string} 在課程 {int} 的進度為 {int}%，狀態為 {string}',
  async function (this: CustomWorld, userName: string, lessonId: number, progress: number, status: string) {
    /*
     * TODO: [事件風暴部位: Aggregate - LessonProgress]
     * TODO: 參考 /aibdd.auto.typescript.e2e.handlers.aggregate-given 實作
     * TODO: 設定 MSW mock 回應，包含此 fixture 資料
     */
    throw new Error('PendingStep');
  }
);
```

**樣板規範**：
1. **檔案與目錄**：先按 subdomain 分目錄（例：`lesson/`, `order/`），再按分類命名。`commonThen.ts` 為跨 subdomain 共用
2. **函式簽名**：使用 `async function (this: CustomWorld, ...)`
3. **TODO 註解**：標註事件風暴部位與對應的 Handler
4. **PendingStep**：使用 `throw new Error('PendingStep')` 作為佔位符
5. **Custom World**：所有 step 使用 `this: CustomWorld` 型別標註

---

# Decision Rules

## Rule 1: Given 語句識別

### Pattern 1.1: Given + Aggregate（MSW Mock 設定）
**識別規則**：
- 語句中包含實體名詞 + 屬性描述
- 描述「某個東西的某個屬性是某個值」

**前端 E2E 特色**：設定 MSW handler 回傳此 fixture 資料

**輸出**：
```typescript
Given('用戶 {string} 在課程 {int} 的進度為 {int}%，狀態為 {string}',
  async function (this: CustomWorld, userName: string, lessonId: number, progress: number, status: string) {
    /*
     * TODO: [事件風暴部位: Aggregate - LessonProgress]
     * TODO: 參考 /aibdd.auto.typescript.e2e.handlers.aggregate-given 實作
     * TODO: 設定 MSW mock fixture
     */
    throw new Error('PendingStep');
  }
);
```

### Pattern 1.2: Given + Command（已完成的使用者操作）
**識別規則**：
- 動作會修改系統狀態（已完成的動作）
- 常見過去式：「已訂閱」「已完成」「已建立」

**前端 E2E 特色**：透過 MSW mock 或頁面操作建立前置條件

## Rule 2: When 語句識別

### Pattern 2.1: When + Command（使用者互動）
**識別規則**：
- 動作會修改系統狀態
- 常見現在式：「更新」「提交」「建立」「刪除」

**前端 E2E 特色**：使用 Playwright 執行 click, type, submit 等操作

**輸出**：
```typescript
When('用戶 {string} 更新課程 {int} 的影片進度為 {int}%',
  async function (this: CustomWorld, userName: string, lessonId: number, progress: number) {
    /*
     * TODO: [事件風暴部位: Command - update_video_progress]
     * TODO: 參考 /aibdd.auto.typescript.e2e.handlers.command 實作
     * TODO: 使用 Playwright 執行使用者互動操作
     */
    throw new Error('PendingStep');
  }
);
```

### Pattern 2.2: When + Query（頁面導航）
**識別規則**：
- 動作不修改系統狀態，只讀取資料
- 常見動詞：「查詢」「取得」「列出」「檢視」

**前端 E2E 特色**：使用 `page.goto()` 導航到頁面

## Rule 3: Then 語句識別

### Pattern 3.1: Then 操作成功（UI 回饋）
**前端 E2E 特色**：驗證 toast、alert、redirect 等 UI 回饋

### Pattern 3.2: Then 操作失敗（錯誤訊息）
**前端 E2E 特色**：驗證 error message 顯示

### Pattern 3.3: Then + Aggregate（API 呼叫驗證）
**前端 E2E 特色**：驗證 MSW handler 被正確呼叫

### Pattern 3.4: Then + Read Model（頁面內容驗證）
**前端 E2E 特色**：使用 `expect(page.getByText(...))` 驗證頁面內容

---

# Decision Tree

```
讀取 Gherkin 語句
|
v
判斷位置（Given/When/Then/And）

Given:
  建立測試的初始資料狀態（實體屬性值）？
    → /aibdd.auto.typescript.e2e.handlers.aggregate-given（設定 MSW mock）
  已完成的寫入操作（建立前置條件）？
    → /aibdd.auto.typescript.e2e.handlers.command（MSW mock 或頁面操作）

When:
  讀取操作（頁面導航）？
    → /aibdd.auto.typescript.e2e.handlers.query
  寫入操作（使用者互動）？
    → /aibdd.auto.typescript.e2e.handlers.command

Then:
  只關注操作成功或失敗（UI 回饋）？
    → /aibdd.auto.typescript.e2e.handlers.success-failure
  驗證 API 被正確呼叫（MSW spy）？
    → /aibdd.auto.typescript.e2e.handlers.aggregate-then
  驗證頁面內容（DOM 元素）？
    → /aibdd.auto.typescript.e2e.handlers.readmodel-then

And:
  繼承前一個 Then 的判斷規則
```

---

# Handler Skill 映射表（E2E 前端版本）

| 事件風暴部位 | 位置 | 識別規則 | Handler | 前端 E2E 特色 |
|------------|------|---------|---------|-------------|
| Aggregate | Given | 建立初始資料狀態 | /aibdd.auto.typescript.e2e.handlers.aggregate-given | 設定 MSW mock fixture |
| Command | Given/When | 寫入操作 | /aibdd.auto.typescript.e2e.handlers.command | 使用者互動 click/type/submit |
| Query | When | 讀取操作 | /aibdd.auto.typescript.e2e.handlers.query | 頁面導航 goto/waitFor |
| 操作成功/失敗 | Then | 只驗證成功或失敗 | /aibdd.auto.typescript.e2e.handlers.success-failure | UI 回饋 toast/alert/redirect |
| Aggregate | Then | 驗證 API 呼叫 | /aibdd.auto.typescript.e2e.handlers.aggregate-then | MSW handler spy |
| Read Model | Then | 驗證頁面內容 | /aibdd.auto.typescript.e2e.handlers.readmodel-then | `expect(page.getByText(...))` |

---

# Critical Rules

### R1: 永遠不覆蓋已存在的 Step Definition
執行前必須先掃描 `tests/steps/`，只生成缺少的步驟。

### R2: 使用 Cucumber 原生語法
使用 `@cucumber/cucumber` 的 `Given`, `When`, `Then`。

### R3: 使用 Custom World
所有 step 使用 `this: CustomWorld` 型別標註。

### R4: 只輸出樣板
不生成任何實作邏輯，只生成函式簽名、TODO 註解和 `throw new Error('PendingStep')`。

### R5: 明確標註事件風暴部位（前端語義）
每個語句都要識別出對應的前端 E2E 事件風暴部位。

### R6: 處理 And 語句
And 語句繼承前一個 Given/When/Then 的判斷邏輯。

---

# 完成條件

- 已掃描現有 Step Definitions，列出已存在與缺少的步驟
- 所有缺少的步驟已生成樣板
- 每個樣板包含正確的 Cucumber Expression、Custom World 型別、TODO 註解與 PendingStep
- 每個樣板標註了正確的事件風暴部位（前端語義）與對應 Handler
- 樣板按目錄分類放置
