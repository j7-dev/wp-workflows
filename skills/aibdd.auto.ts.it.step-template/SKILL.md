---
name: aibdd.auto.ts.it.step-template
description: >
  React IT Stage 2：從 Gherkin Feature 生成 Vitest 整合測試骨架。
  每個 Feature 產生一個測試檔，每個 Example 產生一個 it() block + 標記 TODO。
---

# Step Template 產生器（React IT）

## 目的

從 Gherkin Feature File 生成 Vitest `describe/it` 測試骨架，識別事件風暴部位，
標註對應的 Handler 類型，供 Red Implementation 階段逐一實作。

**產出僅為「樣板」** — `describe/it` 結構 + 共用 state 宣告 + TODO 註解 + `expect.fail('TODO: ...')` placeholder。

## 流程

### Step 0: 掃描現有測試檔案
**永遠不覆蓋已存在的測試！**
1. 掃描 `src/__tests__/` 所有已存在的 `.integration.test.tsx` 檔案
2. 解析目標 .feature 需要的所有 Scenarios
3. 對比找出「缺少的 it() blocks 清單」
4. 只為缺少的 scenarios 產生 it() block

### Step 1: 句型分類（Handler Type 判定）

對每個 Gherkin step 用決策樹判定 handler type。

**精簡版決策樹**（快速分類用）：

```
Given → 狀態描述（「有」「為」「包含」） → aggregate-given (MSW setup)
Given → 已完成動作（「已訂閱」「已建立」）  → command (user-event prep)
When  → 寫入操作（「更新」「建立」「刪除」）→ command (user interaction)
When  → 讀取操作（「查詢」「取得」「列出」）→ query (render + waitFor)
Then  → 成功/失敗                         → success-failure (UI feedback)
Then  → 資料狀態驗證（副作用）              → aggregate-then (MSW request capture)
Then  → 顯示內容驗證（用已 render 的畫面）  → readmodel-then (screen queries)
And   → 繼承前一個 Then 的判斷
```

### Step 2: 產生測試檔骨架

File naming：`src/__tests__/{feature-slug}.integration.test.tsx`

**對應規則**：
- `Feature:` → 最外層 `describe()`
- `Background:` → `beforeEach()`
- `Rule:` → 巢狀 `describe()`
- `Scenario / Example:` → `it()`
- `Scenario Outline + Examples:` → `it.each()` 或逐個展開為 `it()`

### Step 3: TODO 標註

每個 Gherkin step 在 it() 內產生對應 TODO 註解：

```
// TODO: [States Prepare: aggregate-given] MSW handler setup for {Aggregate}
// TODO: [Operation Invocation: command] user-event for {Action}
// TODO: [Operation Invocation: query] render + waitFor for {Page}
// TODO: [Result Verifier: success-failure] UI feedback check
// TODO: [Result Verifier: readmodel-then] screen assertion for {Data}
// TODO: [States Verify: aggregate-then] MSW request verification for {Aggregate}
```

---

## 測試檔骨架範例

從以下 Feature：

```gherkin
Feature: 用戶課程進度

  Background:
    Given 用戶 "Alice" 已登入

  Rule: 成功更新進度

    Example: 進度從 70% 更新到 80%
      Given 用戶 "Alice" 在課程 1 的進度為 70%，狀態為 "進行中"
      When 用戶 "Alice" 更新課程 1 的影片進度為 80%
      Then 操作成功
      And 用戶 "Alice" 在課程 1 的進度應為 80%

  Rule: 進度不可倒退

    Example: 從 70% 降到 60% 應該失敗
      Given 用戶 "Alice" 在課程 1 的進度為 70%，狀態為 "進行中"
      When 用戶 "Alice" 更新課程 1 的影片進度為 60%
      Then 操作失敗
      And 錯誤訊息應為 "進度不可倒退"
```

產生以下測試檔骨架：

```typescript
// src/__tests__/用戶課程進度.integration.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { renderWithProviders } from '@/test/helpers/render';
import { createUser } from '@/test/helpers/user-event';
import { captureMswRequest } from '@/test/helpers/msw-utils';
// import { mockLessonProgress, mockUser } from '@/test/factories';
// import LessonProgressPage from '@/app/lessons/[id]/progress/page';

describe('用戶課程進度', () => {
  // Shared state across describe scope
  let requestRef: { current: Record<string, unknown> | null };

  beforeEach(() => {
    // TODO: [States Prepare: aggregate-given] MSW handler setup for User (Alice 登入狀態)
    expect.fail('TODO: Implement Background: Alice 已登入');
  });

  describe('成功更新進度', () => {
    it('進度從 70% 更新到 80%', async () => {
      // TODO: [States Prepare: aggregate-given] MSW handler for LessonProgress (user=Alice, lesson=1, progress=70, status=IN_PROGRESS)
      // TODO: [Operation Invocation: command] user-event: 填寫進度 80, 點擊更新
      // TODO: [Result Verifier: success-failure] 驗證 UI 顯示成功訊息
      // TODO: [States Verify: aggregate-then] 驗證 MSW 攔截到 progress=80 的 request
      expect.fail('TODO: Implement test');
    });
  });

  describe('進度不可倒退', () => {
    it('從 70% 降到 60% 應該失敗', async () => {
      // TODO: [States Prepare: aggregate-given] MSW handler for LessonProgress (progress=70)
      // TODO: [States Prepare: aggregate-given] MSW override: POST /api/.../progress returns 400 with message "進度不可倒退"
      // TODO: [Operation Invocation: command] user-event: 填寫進度 60, 點擊更新
      // TODO: [Result Verifier: success-failure] 驗證 UI 顯示失敗訊息
      // TODO: [Result Verifier: success-failure] 驗證錯誤訊息 "進度不可倒退"
      expect.fail('TODO: Implement test');
    });
  });
});
```

---

## 命名規則

- **測試檔案**：`{feature-slug}.integration.test.tsx`（feature-slug 可為原 .feature 檔名去除副檔名，中文保留）
- **describe 標題**：直接使用 Gherkin Feature / Rule 名稱
- **it 標題**：直接使用 Example 名稱

## Handler 路由對照表

Step Template 在 TODO 中標註 handler 類型，供 Red Implementation 階段載入對應的 handler SKILL.md。

| 事件風暴部位 | 抽象角色 | Handler SKILL |
|------------|---------|--------------|
| Aggregate（初始狀態）| States Prepare | `/aibdd.auto.ts.it.handlers.aggregate-given` |
| Command（寫入操作）| Operation Invocation | `/aibdd.auto.ts.it.handlers.command` |
| Query（讀取操作）| Operation Invocation | `/aibdd.auto.ts.it.handlers.query` |
| 操作成功/失敗 | Operation Result Verifier | `/aibdd.auto.ts.it.handlers.success-failure` |
| Aggregate（狀態驗證）| States Verify | `/aibdd.auto.ts.it.handlers.aggregate-then` |
| Read Model（顯示驗證）| Operation Result Verifier | `/aibdd.auto.ts.it.handlers.readmodel-then` |

## 完成條件

- [ ] 已掃描現有測試檔，避免覆蓋
- [ ] 每個 Feature 產生一個 `.integration.test.tsx` 檔案
- [ ] 每個 Example 產生一個 `it()` block
- [ ] 每個 step 有正確的 Handler 類型 TODO 標註
- [ ] `describe/it` 結構正確對應 Feature/Rule/Example
- [ ] 所有 `it()` 內有 `expect.fail('TODO: Implement test')` placeholder
- [ ] `npx tsc --noEmit` 通過（import 路徑正確）
