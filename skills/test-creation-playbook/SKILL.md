---
name: test-creation-playbook
description: 通用測試工程師 playbook：邊緣案例目錄、測試指令參考、E2E / IT / UT 覆蓋策略。供 test-creator agent 載入。
---

# 測試工程師 Playbook

通用測試產出的策略 + 參考手冊。test-creator agent 啟動時必載，用來決定「測什麼、用什麼層級測、怎麼跑」。

---

## 三個核心決策

### 1. 要不要寫測試？

並非所有變更都需要新增測試。參考下面「不寫測試的判斷」再決定動手。

若此次變更**沒有產出任何測試檔案**，必須在回覆中明確說明原因：

- 此次變更為樣式/文案調整，不涉及邏輯變更
- 此次變更不改變業務流程，風險極低
- 已有既存測試覆蓋此場景
- 測試需求本身不合理（例如測試實作細節而非行為、測試語言特性）

**不得**在沒有說明的情況下跳過測試產出。

### 2. 測什麼層級？

| 層級 | 關注點 | 典型情境 |
|---|---|---|
| 單元測試（UT） | 邊緣案例 | 負數、null、邊界值、異常輸入、型別錯誤 |
| 整合測試（IT） | 邊緣案例 | Hook/Filter 交互、REST API 驗證、DB 約束、Service 例外、權限邊界 |
| E2E 測試 | 核心業務流程 | 使用者最關鍵操作路徑（購買、註冊、登入），不追求邊緣覆蓋 |

詳細策略見 `references/coverage-strategy.md`。

### 3. 邊緣案例從哪裡找？

掃過 `references/edge-case-catalog.md`，依照「資料型別 / 並發 / 時間 / 安全 / 國際化」五大類別逐項對照當前功能，篩出適用的案例。

---

## 工作流程

1. 讀取 `specs/` 所有文件，提取角色、情境、業務規則
2. **建立情境清單 + 邊緣案例矩陣**（對照 `references/edge-case-catalog.md`）
3. 依情境特性分類測試類型：
   - IT / UT → 展開矩陣覆蓋邊緣案例
   - E2E → 只取核心路徑
4. 依優先級（P0 → P3）呼叫對應測試 skill 生成測試

---

## 測試分組規範

測試案例必須依性質分組，分組標籤（建議用 `@tag` 或 `@group`）：

- 冒煙測試（Smoke）：驗證最核心路徑，跑 1 分鐘內，全過代表環境沒炸
- 快樂路徑（Happy）：標準使用者正常操作流程
- 錯誤處理（Error）：無效輸入、權限不足、資源不存在
- 邊緣案例（Edge）：邊界值、並發、極端輸入
- 安全性（Security）：XSS、SQL injection、權限越界

---

## Timeout 設定規範（E2E 測試）

本地 WordPress 環境（如 LocalWP）比 CI 慢很多，cold start 時 API 回應可能超過 10s。**Timeout 設得太短是 flaky test 的頭號元兇。**

### 強制規則

1. **test.setTimeout(60_000)**：每個 E2E test file 開頭設 60s 以上
2. **API context timeout**：`browser.newContext()` 建立的 context 必須明確 `context.setDefaultTimeout(60_000)`，不可依賴 Playwright config 的 `actionTimeout`（通常只有 10s）
3. **page.goto timeout**：導航到 wp-admin 頁面使用 `{ timeout: 30_000 }` 以上
4. **waitForSelector / waitForFunction**：等待 React SPA 渲染、Ant Design Spin 消失等操作，建議 15_000 ~ 30_000ms
5. **toBeVisible assertions**：`expect(locator).toBeVisible({ timeout: 10_000 })` 作為最低標準

### 已知地雷

- `setupApiFromBrowser()` 繼承 Playwright config 的 `actionTimeout: 10s`，在 beforeAll 建立測試資料時很容易超時 → **改用獨立的 `setupApiWithLongTimeout()` 模式**
- 第一個測試案例可能遇到 cold start，需要更寬鬆的 timeout
- 多個測試重複導航到同一頁面時，合併測試案例以減少導航開銷

### 參考模式

```typescript
// 正確：獨立 context + 明確 timeout
async function setupApiWithLongTimeout(browser: Browser) {
  const context = await browser.newContext({
    storageState: STORAGE_STATE_PATH,
    ignoreHTTPSErrors: true,
    serviceWorkers: 'block',
  })
  context.setDefaultTimeout(60_000)
  // ...
}

// 錯誤：繼承 config 的 10s actionTimeout
const { api } = await setupApiFromBrowser(browser)
```

---

## References 索引

| 檔案 | 內容 | 何時讀 |
|---|---|---|
| `references/edge-case-catalog.md` | 邊緣案例目錄（五大類別） | 建立邊緣案例矩陣時 |
| `references/test-command-reference.md` | 各技術棧測試指令範例 | 撰寫 README / SKILL 測試章節時 |
| `references/coverage-strategy.md` | E2E / IT / UT 分工策略 | 決定測試層級分配時 |
