---
name: wp-e2e-creator
description: 根據 `./specs` 規格文件，為 WordPress Plugin 的「最核心業務流程」生成 Playwright E2E 測試。此技能僅覆蓋核心使用者旅程（冒煙與快樂路徑），邊緣案例與權限矩陣請改用 wp-integration-testing。當使用者需要為 WordPress Plugin 建立 E2E 測試、識別核心業務流程、或設定 wp-env + Playwright 環境時，請啟用此技能。
---

# WordPress Plugin E2E 測試生成器（核心業務流程）

從 `./specs` 規格到測試生成的完整流程：**讀取 `./specs` → 識別核心業務流程 → 生成 Playwright E2E 測試**。

---

## 核心原則：E2E 只測核心業務流程

E2E 測試成本高、執行慢、維護負擔重，**只應覆蓋使用者最關鍵的操作路徑**。其他類型的測試請交給整合測試：

| 測試層級 | 關注點 | 對應 Skill |
|---------|--------|-----------|
| **E2E 測試** | **核心業務流程** — 使用者最關鍵的操作路徑（購買、註冊、登入、發布等） | `wp-e2e-creator`（本 skill） |
| **整合測試** | **邊緣案例** — Hook/Filter 交互、REST API 參數驗證、權限矩陣、資料庫約束、Service 異常處理 | `wp-integration-testing` |

> 如果你正在思考「要不要用 E2E 多測一個權限角色 / 一個錯誤輸入 / 一個並發情境」——
> **答案是：不要。** 那些是整合測試的工作。

---

## 前置條件：讀取 `./specs` 規格

> 若 `./specs/` 目錄不存在或其中無任何檔案，立即中止任務。
> 提示使用者先執行需求訪談（`@wp-workflows:clarifier`），產生 `./specs/` 規格文件後再繼續。

**`./specs/` 檔案為所有功能規格與使用者情境的唯一依據，必須優先完整閱讀。**

從 `./specs/` 中提取：
- **使用者角色清單**（所有角色及其權限）
- **使用者情境清單**（user story / 使用流程）
- **業務規則**（驗證規則、狀態機）
- **商業價值產生點**（哪些操作直接創造或交付價值）

---

## 核心工作流程

```
Step 1: 讀取 `./specs/`，列出所有使用者情境
  └── 完整提取，不過濾

Step 2: 識別「核心業務流程」
  └── 用「核心業務流程篩選器」過濾出 E2E 候選

Step 3: 分組規劃（冒煙 / 快樂路徑）
  └── 不展開角色矩陣、不展開邊緣案例

Step 4: 生成 Playwright 測試
  └── 每個流程一個獨立 spec 檔案
```

---

## Step 2：核心業務流程篩選器

### 收錄規則（屬於 E2E）

符合**任一**條件即為核心業務流程：

1. **收入直接相關** — 購買、訂閱、續費、退款
2. **認證授權主流程** — 註冊、登入、登出、密碼重設
3. **產品核心價值交付** — 使用者完成「為什麼要用這個產品」的關鍵動作（如：觀看已購買課程、下單、發布內容、上傳檔案）
4. **跨系統整合的 happy path** — 涉及多個 plugin / 第三方服務的串接結果（如：WooCommerce → 課程授權）

### 排除規則（屬於整合測試）

下列情境**一律不寫 E2E**，請交給 `wp-integration-testing`：

- 權限矩陣覆蓋（guest / subscriber / admin / expired ...）
- 資料邊界（空狀態、大量資料、特殊字元、Unicode、邊界值）
- 狀態邊界（draft / pending / cancelled / refunded ...）
- API 參數驗證（401、404、SQL injection、XSS）
- Hook / Filter 交互邏輯
- 並發情境（同時兩個 tab 結帳、race condition）
- 資源刪除後的殘留行為
- 業務規則的所有分支組合

> **判斷準則**：若這個情境失敗時，**不會直接讓使用者拿不到產品價值或公司收不到錢**，那它就不是 E2E 該測的東西。

---

## Step 3：測試分組

E2E 測試只寫**兩個分組**，其餘交給整合測試：

| 分組 | 標籤 | 說明 |
|------|------|------|
| 🔥 **冒煙測試** | `@smoke` | 1 分鐘內跑完，全過代表環境沒炸。只放最關鍵的 3~5 條路徑 |
| ✅ **快樂路徑** | `@happy` | 標準使用者的完整正常流程，每個核心業務流程一條 |

**禁止在 E2E 中寫的分組**（請改寫整合測試）：

- ❌ 錯誤處理（Error Handling）
- 🔀 邊緣案例（Edge Cases）
- 🔒 安全性（Security）

---

## Step 4：測試生成

依照 `references/test-templates.md` 的核心業務流程模板生成測試。

每個核心業務流程一個 spec 檔案，每個檔案聚焦在「使用者從進入到拿到價值」的最短路徑。

---

## 繁體中文輸出規範

所有 `test()` 描述、`describe()` 標題、註解、錯誤訊息一律使用**繁體中文**，方便管理員閱讀與維護。英文僅保留技術識別碼、函式名稱與程式碼本身。

```typescript
// ✅ 正確
test('@smoke 使用者可以完成課程購買並進入教室', async ({ page }) => { ... })

// ❌ 錯誤
test('user can purchase course and access classroom', async ({ page }) => { ... })
```

---

## 不寫測試的義務

若此次變更**沒有產出任何 E2E 測試檔案**，必須在回覆中明確說明原因，例如：

- 此次變更不涉及核心業務流程，已交由整合測試覆蓋
- 此次變更為樣式 / 文案調整，不影響使用者旅程
- 已有既存 E2E 覆蓋此核心流程，無需新增

**不得**在沒有說明的情況下跳過測試產出。

---

## Timeout 設定規範

本地 WordPress 環境（如 LocalWP、wp-env）比 CI 慢很多，cold start 時 API 回應時間可能超過 10s。**Timeout 設得太短是 flaky test 的頭號元兇。**

### 強制規則

1. **`test.setTimeout(60_000)`**：每個 E2E test file 開頭必須設定足夠的測試超時時間（建議 60s 以上）
2. **API context timeout**：若使用 `browser.newContext()` 建立 API 請求用的 context，**必須**明確設定 `context.setDefaultTimeout(60_000)`，不可依賴 Playwright config 的 `actionTimeout`（通常只有 10s）
3. **`page.goto` timeout**：導航到 wp-admin 頁面時，使用 `{ timeout: 30_000 }` 以上
4. **`waitForSelector` / `waitForFunction`**：等待 React SPA 渲染、Ant Design Spin 消失等操作，建議 15_000 ~ 30_000ms
5. **`toBeVisible` assertions**：`expect(locator).toBeVisible({ timeout: 10_000 })` 作為最低標準

### 已知地雷

- `setupApiFromBrowser()` 繼承 Playwright config 的 `actionTimeout: 10s`，在 `beforeAll` 中做課程 / 章節建立時很容易超時 → **改用獨立的 `setupApiWithLongTimeout()` 模式**
- 第一個測試案例可能遇到 cold start（WordPress 載入快取尚未建立），需要更寬鬆的 timeout
- 多個測試重複導航到同一頁面時，合併測試案例以減少導航開銷

### 參考模式

```typescript
// ✅ 正確：獨立 context + 明確 timeout
async function setupApiWithLongTimeout(browser: Browser) {
  const context = await browser.newContext({
    storageState: STORAGE_STATE_PATH,
    ignoreHTTPSErrors: true,
    serviceWorkers: 'block',
  })
  context.setDefaultTimeout(60_000)
  // ...
}

// ❌ 錯誤：繼承 config 的 10s actionTimeout
const { api } = await setupApiFromBrowser(browser)
```

---

## 關鍵技術注意事項

### Workers 必須設為 1

```typescript
export default defineConfig({
  workers: 1,          // WordPress 共用 DB session，不能平行
  fullyParallel: false,
})
```

### 使用獨立 npm（非 pnpm）

Windows NTFS junction 在 pnpm 中會造成「untrusted mount point」錯誤。E2E 相依套件必須使用 npm。

### 不使用 WP CLI — 改用 REST API

```typescript
// ✅ 使用 REST API（跨平台，無 Docker PATH 問題）
const res = await request.get(`${BASE}/wp-json/wp/v2/posts`)

// ❌ 不要用 execSync（Windows 上 Docker PATH 問題）
execSync('npx wp-env run cli wp post list')
```

### wp-env 必須從專案根目錄執行

```bash
# ✅ 正確
./tests/e2e/node_modules/.bin/wp-env start

# ❌ 錯誤（找不到 .wp-env.json）
cd tests/e2e && npx wp-env start
```

---

## 測試執行指令範例

撰寫測試說明文件（README）時，必須列出以下情境的完整指令範例，讓開發者一眼就能複製貼上：

```bash
# 預設（無頭模式，CI 用）
npx playwright test

# 有頭模式（本機除錯，看瀏覽器跑）
npx playwright test --headed

# 指定瀏覽器
npx playwright test --project=chromium
npx playwright test --project=firefox

# 只跑冒煙測試
npx playwright test --grep "@smoke"

# 只跑快樂路徑
npx playwright test --grep "@happy"

# 跑單一測試檔
npx playwright test tests/e2e/checkout.spec.ts

# 跑單一測試（依名稱）
npx playwright test -g "使用者可以完成結帳流程"

# 顯示測試報告
npx playwright show-report

# 互動式 UI 模式（最好用的除錯方式）
npx playwright test --ui
```

---

## 疑難排解

| 症狀 | 原因 | 解法 |
|------|------|------|
| `Cannot connect to Docker` | Docker 未啟動 | 啟動 Docker Desktop |
| `wp-env: command not found` | wp-env 未安裝 | 在 `tests/e2e/` 執行 `npm install` |
| global-setup 中 `spawn UNKNOWN` | execSync 呼叫 Docker | 改用 REST API |
| 章節 URL 404 | Rewrite rules 未刷新 | setup 中造訪永久連結設定頁 |
| 重複資料 slug 加 `-2` | 未強制刪除舊資料 | 清除時加 `?force=true` |
| CI 測試不穩定 | 缺少等待 | 補充 `waitForLoadState('networkidle')` |
| Windows pnpm junction 錯誤 | NTFS mount | E2E 相依套件改用 npm |
| 第一個測試 timeout | Cold start | 套用 `setupApiWithLongTimeout()` 模式 |

---

## 最佳實踐

1. **核心流程先行** — 先從 `./specs/` 識別出哪些是「核心業務流程」，其他通通不寫 E2E
2. **單一路徑深入** — 每個流程只測 happy path，不展開角色矩陣或錯誤分支
3. **冒煙測試極簡** — `@smoke` 群組總執行時間控制在 1 分鐘內
4. **獨立測試資料** — 每個測試用 REST API 建立自己的資料，執行後清除
5. **REST API 建立資料** — 絕不在測試程式碼中使用 WP CLI 或 execSync
6. **強制刪除** — 建立新資料前刪除所有狀態（publish、draft、trash）
7. **單一 worker** — WordPress 無法處理平行 session
8. **繁體中文** — 測試名稱與註解一律繁體中文
9. **明確 timeout** — 所有 E2E 設定 60s 以上的 test timeout，避免 flaky

---

## 參考文件

依需要載入對應的詳細內容：

- **核心業務流程模板**：`references/test-templates.md` — Playwright 核心流程測試範例（冒煙 + 快樂路徑）
- **wp-env 環境設定**：`references/wp-env-setup.md` — 目錄結構、Global Setup、REST API Client、License Check Bypass
