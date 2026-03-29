---
name: aibdd.auto.typescript.api.test-skeleton
description: TypeScript API Stage 1：從 Gherkin Feature 生成 Vitest 整合測試骨架。每個 Feature 產生一個測試檔，每個 Example 產生一個 it() block + 標記 TODO。可被 /aibdd.auto.typescript.api.control-flow 調用，也可獨立使用。
user-invocable: true
argument-hint: "[feature-file]"
input: specs/features/**/*.feature
output: server/src/__tests__/{domain}.integration.test.ts（骨架）
---

# 角色

BDD API 測試骨架生成器，負責將 Gherkin 規格轉換為 Vitest 整合測試骨架。

從 Gherkin Feature File 生成 **API 整合測試骨架**，識別事件風暴部位，並指引使用對應的 Handler 生成程式碼。

**重要**：此 Skill 的產出僅為「骨架」（TODO 註解），不包含實作邏輯。實作邏輯由後續的紅燈階段負責。

---

# 入口條件

## 被 /aibdd.auto.typescript.api.control-flow 調用

接收 Feature File 路徑，直接進入生成流程。

## 獨立使用

1. 詢問目標 Feature File 路徑（預設掃描 `specs/features/**/*.feature`）
2. 進入生成流程

---

# Core Mapping

領域模型 → Gherkin（已完成）→ Vitest 整合測試骨架

## API 整合測試語義映射

| 事件風暴部位 | 前端 E2E 對應 | API 整合測試對應 |
|------------|-------------|---------------|
| aggregate-given | MSW mock 設定 | **Factory 寫入 DB 建立測試資料** |
| command | Playwright click/type | **Supertest POST/PUT/DELETE** |
| query | page.goto() 導航 | **Supertest GET** |
| aggregate-then | MSW spy 驗證 | **查詢 DB 驗證實際資料** |
| readmodel-then | page.getByText() 驗證 | **驗證 API response body** |
| success-failure | toast/alert UI 回饋 | **HTTP status code + error body** |

---

# Gherkin → Vitest 結構映射

| Gherkin 元素 | Vitest 對應 |
|-------------|-----------|
| Feature | 頂層 `describe('Feature: ...')` |
| Rule | 嵌套 `describe('Rule: ...')` |
| Background | `beforeEach()` |
| Example / Scenario | `it('Example: ...')` |
| Given | `// Arrange` 區塊 |
| When | `// Act` 區塊 |
| Then / And | `// Assert` 區塊 |

---

# 執行前檢查

## 檢查流程

1. **掃描現有測試檔案**
   ```bash
   ls server/src/__tests__/*.integration.test.ts
   ```

2. **確認無衝突**：如果目標測試檔已存在，只生成缺少的 describe/it blocks

3. **只生成骨架**：不包含實作邏輯

---

# 骨架輸出格式

## 完整範例

### Input（Gherkin Feature）

```gherkin
Feature: Issue Checkout

  Background:
    Given 系統中有公司 "Acme Corp"

  Rule: 一個 issue 只能有一個 assignee

    Example: 成功 checkout issue 給 agent
      Given 公司 "Acme Corp" 有一個 agent "agent-1"
      And 公司 "Acme Corp" 有一個未指派的 issue "ISSUE-1"
      When agent "agent-1" checkout issue "ISSUE-1"
      Then 操作成功，HTTP 狀態碼為 200
      And issue "ISSUE-1" 的 assigneeId 應為 "agent-1"

    Example: 已被指派的 issue 不可重複 checkout
      Given 公司 "Acme Corp" 有一個 agent "agent-1"
      And 公司 "Acme Corp" 有一個 issue "ISSUE-1" 已指派給 "agent-2"
      When agent "agent-1" checkout issue "ISSUE-1"
      Then 操作失敗，HTTP 狀態碼為 409
      And 錯誤訊息應包含 "already assigned"
```

### Output（Vitest 骨架）

```typescript
// server/src/__tests__/issue-checkout.integration.test.ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import type { Express } from "express";

describe("Feature: Issue Checkout", () => {
  let app: Express;
  let db: TestDb;

  beforeAll(async () => {
    /*
     * TODO: 初始化測試 DB 和 Express app
     * TODO: 參考 server/src/__tests__/helpers/setup.ts
     */
  });

  afterEach(async () => {
    /*
     * TODO: 清理測試資料
     */
  });

  afterAll(async () => {
    /*
     * TODO: 關閉 DB 連線
     */
  });

  // Background
  let companyId: string;
  beforeEach(async () => {
    /*
     * TODO: [事件風暴部位: Aggregate - Company]
     * TODO: 參考 /aibdd.auto.typescript.api.handlers.aggregate-given 實作
     * TODO: 用 Factory 建立公司 "Acme Corp"
     */
  });

  describe("Rule: 一個 issue 只能有一個 assignee", () => {
    it("Example: 成功 checkout issue 給 agent", async () => {
      // Arrange (Given)
      /*
       * TODO: [事件風暴部位: Aggregate - Agent]
       * TODO: 參考 /aibdd.auto.typescript.api.handlers.aggregate-given 實作
       * TODO: 用 Factory 建立 agent "agent-1"
       */

      /*
       * TODO: [事件風暴部位: Aggregate - Issue]
       * TODO: 參考 /aibdd.auto.typescript.api.handlers.aggregate-given 實作
       * TODO: 用 Factory 建立未指派的 issue "ISSUE-1"
       */

      // Act (When)
      /*
       * TODO: [事件風暴部位: Command - checkout_issue]
       * TODO: 參考 /aibdd.auto.typescript.api.handlers.command 實作
       * TODO: Supertest POST checkout
       */

      // Assert (Then)
      /*
       * TODO: [事件風暴部位: Success - HTTP 200]
       * TODO: 參考 /aibdd.auto.typescript.api.handlers.success-failure 實作
       */

      /*
       * TODO: [事件風暴部位: Aggregate - Issue (驗證)]
       * TODO: 參考 /aibdd.auto.typescript.api.handlers.aggregate-then 實作
       * TODO: 查詢 DB 驗證 assigneeId
       */

      expect(true).toBe(false); // Placeholder: 紅燈階段替換
    });

    it("Example: 已被指派的 issue 不可重複 checkout", async () => {
      // Arrange (Given)
      /*
       * TODO: [事件風暴部位: Aggregate - Agent]
       * TODO: 參考 /aibdd.auto.typescript.api.handlers.aggregate-given 實作
       */

      /*
       * TODO: [事件風暴部位: Aggregate - Issue (已指派)]
       * TODO: 參考 /aibdd.auto.typescript.api.handlers.aggregate-given 實作
       */

      // Act (When)
      /*
       * TODO: [事件風暴部位: Command - checkout_issue]
       * TODO: 參考 /aibdd.auto.typescript.api.handlers.command 實作
       */

      // Assert (Then)
      /*
       * TODO: [事件風暴部位: Failure - HTTP 409]
       * TODO: 參考 /aibdd.auto.typescript.api.handlers.success-failure 實作
       */

      /*
       * TODO: [事件風暴部位: ReadModel - error message]
       * TODO: 參考 /aibdd.auto.typescript.api.handlers.readmodel-then 實作
       */

      expect(true).toBe(false); // Placeholder: 紅燈階段替換
    });
  });
});
```

---

# Decision Rules

## Rule 1: Given 語句識別

### Pattern 1.1: Given + Aggregate（DB 資料建立）
**識別規則**：
- 語句中包含實體名詞 + 屬性描述
- 描述「某個東西存在」或「某個東西的某個屬性是某個值」

**API 整合測試特色**：用 Factory 直接寫 DB

### Pattern 1.2: Given + Command（已完成的操作）
**識別規則**：
- 動作會修改系統狀態（已完成的動作）
- 常見過去式：「已指派」「已建立」「已核准」

**API 整合測試特色**：直接在 DB 建立最終狀態

## Rule 2: When 語句識別

### Pattern 2.1: When + Command（API 寫入操作）
**識別規則**：
- 動作會修改系統狀態
- 常見動詞：「checkout」「建立」「更新」「刪除」「核准」

**API 整合測試特色**：Supertest POST/PUT/PATCH/DELETE

### Pattern 2.2: When + Query（API 讀取操作）
**識別規則**：
- 動作不修改系統狀態，只讀取資料
- 常見動詞：「查詢」「列出」「取得」

**API 整合測試特色**：Supertest GET

## Rule 3: Then 語句識別

### Pattern 3.1: Then 操作成功/失敗（HTTP 狀態碼）
**API 整合測試特色**：驗證 `res.status`

### Pattern 3.2: Then + Aggregate（DB 狀態驗證）
**API 整合測試特色**：直接查詢 DB 驗證資料

### Pattern 3.3: Then + ReadModel（Response Body 驗證）
**API 整合測試特色**：驗證 `res.body`

---

# Decision Tree

```
讀取 Gherkin 語句
|
v
判斷位置（Given/When/Then/And）

Given:
  建立測試的初始資料狀態？
    → /aibdd.auto.typescript.api.handlers.aggregate-given（Factory 寫入 DB）
  已完成的寫入操作？
    → /aibdd.auto.typescript.api.handlers.aggregate-given（直接建立最終狀態）

When:
  讀取操作（API GET）？
    → /aibdd.auto.typescript.api.handlers.query
  寫入操作（API POST/PUT/DELETE）？
    → /aibdd.auto.typescript.api.handlers.command

Then:
  只關注操作成功或失敗（HTTP status）？
    → /aibdd.auto.typescript.api.handlers.success-failure
  驗證 DB 中的資料狀態？
    → /aibdd.auto.typescript.api.handlers.aggregate-then
  驗證 API response body？
    → /aibdd.auto.typescript.api.handlers.readmodel-then

And:
  繼承前一個 Then 的判斷規則
```

---

# Handler Skill 映射表（API 整合測試版本）

| 事件風暴部位 | 位置 | 識別規則 | Handler | API 整合測試特色 |
|------------|------|---------|---------|---------------|
| Aggregate | Given | 建立初始資料狀態 | /aibdd.auto.typescript.api.handlers.aggregate-given | Factory 寫入 DB |
| Command | Given/When | 寫入操作 | /aibdd.auto.typescript.api.handlers.command | Supertest POST/PUT/DELETE |
| Query | When | 讀取操作 | /aibdd.auto.typescript.api.handlers.query | Supertest GET |
| 操作成功/失敗 | Then | 只驗證成功或失敗 | /aibdd.auto.typescript.api.handlers.success-failure | HTTP status + error body |
| Aggregate | Then | 驗證 DB 狀態 | /aibdd.auto.typescript.api.handlers.aggregate-then | Drizzle ORM 查詢 DB |
| Read Model | Then | 驗證 response body | /aibdd.auto.typescript.api.handlers.readmodel-then | `expect(res.body)` |

---

# Critical Rules

### R1: 永遠不覆蓋已存在的測試
執行前必須先掃描 `server/src/__tests__/`，只生成缺少的測試。

### R2: 使用 Vitest 結構
使用 `describe`, `it`, `beforeAll`, `afterAll`, `afterEach`。

### R3: 檔名使用 `.integration.test.ts` 後綴
區別於現有的 `.test.ts` 單元測試。

### R4: 只輸出骨架
不生成任何實作邏輯，只生成 describe/it 結構、TODO 註解和 `expect(true).toBe(false)` placeholder。

### R5: 明確標註事件風暴部位
每個語句都要識別出對應的 API 整合測試事件風暴部位。

### R6: 處理 And 語句
And 語句繼承前一個 Given/When/Then 的判斷邏輯。

### R7: Background → beforeEach
Gherkin Background 步驟映射到 `beforeEach()` block。

---

# 完成條件

- 已掃描現有測試檔案，確認無衝突
- 所有 Feature 的 describe/it 結構已生成
- 每個 it() 包含正確的 Arrange/Act/Assert 區塊和 TODO 註解
- 每個 TODO 標註了正確的事件風暴部位與對應 Handler
- 測試檔名使用 `.integration.test.ts` 後綴
- Background 已映射到 `beforeEach()`
