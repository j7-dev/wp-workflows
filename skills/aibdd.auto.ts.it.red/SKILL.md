---
name: aibdd.auto.ts.it.red
description: >
  React IT Stage 3：紅燈實作執行器。對單一 .feature 執行完整紅燈流程：
  Schema Analysis（環境就緒）→ Step Template（骨架生成）→ Red Implementation（載入 Handler 實作測試）。
  當 /aibdd.auto.ts.it.control-flow 呼叫紅燈階段，或使用者說「紅燈」「red」時觸發。
---

# 紅燈實作執行器（React IT）

寫出測試程式，確認有 Failing Test（Value Difference，非環境問題）。

## 紅燈定義

- **(a) 環境正常** — Vitest 能執行、imports 解析正確、MSW server 啟動、Component render 不 crash
- **(b) Value Difference** — 測試預期某個 UI 元素或文字存在，但元件尚未實作（或邏輯尚未實作），導致 `screen.getByText/getByRole` 找不到預期內容

環境的 Difference ≠ 紅燈。Value 的 Difference = 紅燈。兩者都符合，才算正式進入 Red。

---

## 三步驟流程

```
Step 1: Schema Analysis    → 呼叫 /aibdd.auto.ts.it.schema-analysis
Step 2: Step Template      → 呼叫 /aibdd.auto.ts.it.step-template
Step 3: Red Implementation → 對每個 TODO step:
                              → 讀 TODO 取得 handler type
                              → 讀 /aibdd.auto.ts.it.handlers.{type}/SKILL.md
                              → 實作測試程式碼
                              → 驗證紅燈（條件 b）
```

### Step 1: Schema Analysis

呼叫 `/aibdd.auto.ts.it.schema-analysis`。

核心任務：
1. 讀取 .feature + api.yml
2. 確認 Zod Schemas / API Client / MSW Handlers / Component Stubs 齊全
3. GO/NO-GO 決策；若缺失則委派 `/aibdd-auto-frontend-msw-api-layer` 補齊

### Step 2: Step Template Generation

呼叫 `/aibdd.auto.ts.it.step-template`。

核心任務：
1. 解析 .feature 中每個 Scenario 的 Given/When/Then steps
2. 用決策樹分類每個 step 為 handler type
3. 產生 Vitest `describe/it` 測試檔骨架，每個 step 含 TODO 標註

### Step 3: Red Implementation

對每個 `it()` 內的 TODO 註解：
1. 讀取 TODO 標註 → 取得 handler type
2. Read `/aibdd.auto.ts.it.handlers.{type}/SKILL.md`（若尚未載入）
3. 將 `expect.fail('TODO: ...')` 替換為完整測試程式碼
4. 處理下一個 step / scenario

同時產出基礎建設（若不存在）：
- Component stubs（置於 `src/app/` 或 `src/components/`，非 test 目錄）
- Test data factories（置於 `src/test/factories/`）
- Per-feature 的 MSW handler overrides

---

## 共用規則（跨 handler）

### R1: Command 不驗 UI Feedback
Command handler 只執行 user-event 互動，不做 assertion。驗證交給 Then handler。

### R2: 欄位名必須與 api.yml 一致
Request/Response 欄位名以 `api.yml` schemas 為唯一真相來源。Zod schemas 從 api.yml 推導。

### R3: 跨步驟 ID 儲存到 describe scope 變數
使用 `let` 宣告在 describe scope，例如 `let aliceId: string;`。

### R4: Component Stubs 置於 app 目錄
基礎建設放在 `src/app/` 或 `src/components/`（production code），非 `src/__tests__/`。

### R5: 不實作 Component 邏輯
Red 階段只定義介面。Component 只回傳 `<div>TODO</div>` 等最小 stub。

### R6: 測試將失敗（紅燈）
這是 TDD 紅燈階段的本質。失敗原因必須是 Value Difference（`screen.getByText` 找不到預期元素）。

### R7: 使用 jsdom + MSW（不需真實瀏覽器/後端）
Vitest 的 jsdom environment + MSW `setupServer`，無需 Docker、Playwright、真實 API server。

### R8: Data Table 逐欄對應
Feature 的 Data Table 欄位與 api.yml / Zod schema 欄位 1:1 對應。

### R9: API Endpoint Path = api.yml 定義
HTTP 路徑從 api.yml paths 讀取，MSW handler URL 與之一致。

---

## 測試執行命令

```bash
# 執行特定測試檔
npx vitest run src/__tests__/{feature-slug}.integration.test.tsx

# 執行特定 scenario
npx vitest run src/__tests__/{feature-slug}.integration.test.tsx -t "scenario name"

# 執行所有整合測試
npx vitest run
```

---

## 環境前置檢查

Red 執行前確認：
1. `package.json` 含 vitest, @testing-library/react, msw
2. `vitest.config.ts` 存在
3. `src/test/setup.ts` 存在且正確 import MSW server
4. `npx vitest run --passWithNoTests` 通過

若前置條件不滿足 → 委派 `/aibdd.auto.ts.it.starter` 補齊。

---

## 完成條件

- [ ] 環境正常（Vitest 能執行、MSW server 啟動、imports 解析）— 條件 (a)
- [ ] 測試執行後失敗，失敗原因是 Value Difference — 條件 (b)
      失敗訊息例：`TestingLibraryElementError: Unable to find an element with the text: /成功/i`
      **非環境錯誤**（非 `Cannot find module`、`ReferenceError`、MSW unhandled request）
- [ ] 所有 `it()` 已從 `expect.fail('TODO')` 替換為完整測試程式碼
- [ ] Component stubs 完整存在
- [ ] Test data factories 完整
- [ ] Zod schemas 與 api.yml 一致
