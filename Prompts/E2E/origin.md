````
# Role & Goal
你是資深 WordPress 外掛測試工程師，專精 Playwright E2E 測試與 GitHub Actions CI/CD。
任務：為一個 **WordPress 付費授權外掛（PHP 8.1+ / React Admin UI）** 生成完整、全面的 E2E 測試套件，
並整合至 GitHub Actions CI/CD pipeline，讓 AI 完成開發後可自動執行測試驗證。

自動執行所有步驟，除非遇到 [需人工確認] 標記，否則不需等待使用者確認。

---

# Context

## 專案結構假設
在開始前，先掃描專案根目錄，識別：
- 外掛主檔案（`*.php` 含 `Plugin Name:` header）
- React 前端入口（`src/` 或 `assets/`）
- 現有 `package.json`（判斷是否已有 Node 環境）
- 現有測試目錄（`tests/`）

## 授權繞過機制（僅測試期間使用）

> ⚠️ **以下操作有嚴格的生命週期限制，違反規則視為嚴重錯誤。**

測試期間，在 `/plugin.php` 的主類別 `__construct()` 中，找到 `$this->init($args)` 這行，
將 `$args` 添加 `'lc' => false`，使外掛在無授權碼的情況下正常運作：
```php
// 修改前
$this->init($args);

// 修改後（僅測試期間）
$args['lc'] = false;
$this->init($args);
```

**強制生命週期規則（缺一不可）：**
1. **Phase 0-C 環境初始化時**：自動套用此修改，再啟動測試環境
2. **所有測試執行完畢後**：立即還原 `/plugin.php`，移除 `'lc' => false` 相關行
3. **還原後執行**：`git diff plugin.php` 確認檔案已完全還原至原始狀態（無任何 diff 輸出）
4. **禁止**將此修改 commit（`git status` 不可出現 `plugin.php` 為已暫存狀態）
5. **禁止**以任何形式保留此修改（不可下註解、不可用 `#if` 包裹、不可寫入任何設定檔）

若測試過程中途中斷（crash / timeout），**斷點續傳恢復前必須先檢查並還原 `/plugin.php`**。

## 測試環境策略（依優先順序）
1. **優先**：若 `@wordpress/env` 已安裝或可安裝 → 使用 `wp-env + Docker`
2. **Fallback**：若 CI 環境無法使用 Docker → 使用 `docker-compose` 自行定義 WordPress + MySQL 容器
3. 測試環境需預先：
   - 安裝並啟用本外掛
   - 停用 Query Monitor 等 Debug 外掛（避免額外 DOM 元素干擾選擇器）

---

# Task Steps

## Phase 0 — 專案深度理解（禁止跳過）

> ⚠️ **這是最重要的階段。嚴禁跳過任何檔案。必須完整閱讀每一個 PHP / JS / TSX 檔案，
> 徹底理解所有核心使用者情境後，才能進入後續 Phase。**

### 0-A 使用 Serena MCP 分析專案結構
使用 Serena MCP 執行以下操作（依序執行，不可省略）：
1. `get_symbols_overview` — 取得整體專案符號總覽
2. 針對每個 PHP 類別檔案執行 `read_file`，完整讀取內容
3. 針對每個 React 元件（`.tsx` / `.jsx`）執行 `read_file`，完整讀取內容
4. 針對 Router / Page 定義檔執行 `read_file`，識別所有 Admin 頁面與前台路由
5. 使用 `search_for_pattern` 搜尋以下關鍵字，識別業務邏輯邊界：
   - `shortcode`、`block`、`widget`（前台輸出點）
   - `add_menu_page`、`add_submenu_page`（後台頁面清單）
   - `wp_ajax_`、`rest_api_init`（AJAX / REST 端點）
   - `current_user_can`、`capability`（權限邊界）

### 0-B 建立使用者情境清單
閱讀完所有檔案後，輸出一份 **使用者情境清單**（Markdown 表格），格式如下：

| #   | 情境名稱 | 角色 | 前置條件 | 操作步驟摘要 | 預期結果 |
| --- | -------- | ---- | -------- | ------------ | -------- |

> 此清單將作為 Phase 1–3 測試腳本的唯一依據。
> 情境必須來自實際程式碼，禁止憑空假設功能。

### 0-C 環境初始化
1. 若無 `package.json` → 執行 `npm init -y`
2. 安裝依賴：
````
   npm install --save-dev @playwright/test @wordpress/e2e-test-utils-playwright
   npx playwright install chromium
````
3. 生成 `playwright.config.ts`（見 Output Format）
4. **套用授權繞過修改**（`'lc' => false`）至 `/plugin.php`
5. 確認 `git diff plugin.php` 顯示修改已套用但**未暫存**
6. 寫入進度：`{ "phase": 0, "status": "done", "lc_bypass_applied": true }` → `.e2e-progress.json`

---

## Phase 1 — 後台 Admin React UI 測試
**依據 Phase 0 情境清單中後台相關情境生成測試。**
**每批完成後驗證：`npx playwright test tests/e2e/01-admin/`，通過才繼續。**

掃描外掛的 Admin 頁面路由（`admin.php?page=YOUR_PLUGIN_SLUG*`），為每個頁面生成：
- `settings-page.spec.ts`：頁面載入 → 無 Fatal Error / PHP Warning → 主要 heading 可見
- `settings-save.spec.ts`：修改設定 → 儲存 → 重新載入 → 驗證值持久化
- `react-components.spec.ts`：React 元件渲染 → 無 console error → 互動元素（按鈕/表單）可操作

> 使用 `page.getByRole('heading', { name: /設定名稱/i })` 而非 `page.locator('h1')`（避免 Query Monitor 多 h1 衝突）

---

## Phase 2 — 前台使用者情境測試

> ⚠️ **嚴禁跳過任何檔案。進入此 Phase 前，必須已完成 Phase 0-A 的完整檔案閱讀。**
> **每一個使用者情境都必須對應一個獨立的 spec 檔案，不得合併或省略。**

### Step 2-A — 前台情境萃取（再次確認，不可省略）
從 Phase 0-B 的情境清單中，篩選出所有前台相關情境。
若發現有任何前台功能在 Phase 0 掃描中可能遺漏，**立即重新 `read_file` 補讀對應檔案**，再更新情境清單。

確認涵蓋以下面向（依實際程式碼為準）：
- 每個 shortcode / block / widget 的渲染情境
- 每個使用者互動流程（表單提交、按鈕點擊、AJAX 回應）
- 不同角色（管理員 / 一般訪客 / 登入會員）的操作差異
- 邊界條件（空資料、無效輸入、網路錯誤降級）

### Step 2-B — 逐一生成 E2E 測試腳本
針對 Step 2-A 確認的**每一個情境**，在 `tests/e2e/02-frontend/` 下生成對應 spec 檔案：

命名規則：`[序號]-[情境slug].spec.ts`，例如：
````
tests/e2e/02-frontend/
├── 001-shortcode-render.spec.ts
├── 002-form-submit-success.spec.ts
├── 003-form-submit-validation-error.spec.ts
├── 004-ajax-response-display.spec.ts
└── ...（依實際情境數量產生，不設上限）
````

每個 spec 檔案頂部必須加註：
```ts
/**
 * 測試目標：[來自情境清單的情境名稱]
 * 對應原始碼：[觸發此情境的 PHP / JS 檔案路徑]
 * 前置條件：[環境狀態說明]
 * 預期結果：[斷言依據]
 */
```

**每批（每 10 個 spec）完成後：**
1. 執行 `npx playwright test tests/e2e/02-frontend/` 驗證
2. 寫入進度至 `.e2e-progress.json`
3. 通過才繼續下一批；失敗則輸出失敗摘要後停止

---

## Phase 3 — 跨模組整合與邊界測試
**依據 Phase 0 情境清單中權限、衝突、錯誤邊界相關情境生成測試。**
**每批完成後驗證：`npx playwright test tests/e2e/03-integration/`**

- `plugin-conflict.spec.ts`：與 WooCommerce / ACF 共存時無衝突（若專案有相依）
- `permission.spec.ts`：以 Editor / Subscriber 角色登入 → 無法存取 Admin 頁面
- `php-errors.spec.ts`：所有頁面掃描，確認不含 `Fatal error`、`Warning:`、`Deprecated:`

---

## Phase 4 — 測試還原與 CI 整合

### Step 4-A — 強制還原 plugin.php ⚠️
1. 移除 `/plugin.php` 中的 `$args['lc'] = false;` 行
2. 執行 `git diff plugin.php` — **必須無任何 diff 輸出**，否則重新還原直到乾淨
3. 執行 `git status` — 確認 `plugin.php` 不在已暫存或已修改清單中
4. 更新進度：`"lc_bypass_applied": false` → `.e2e-progress.json`

> 若 Step 4-A 任一檢查未通過，**立即停止後續所有操作**，輸出還原失敗警告，[需人工確認] 後才繼續。

### Step 4-B — GitHub Actions CI 整合
生成 `.github/workflows/e2e.yml`，包含：
- `on: push` + `on: pull_request`（target: `main`）
- 啟動 WordPress 環境（wp-env 或 docker-compose）
- CI 環境中透過 `global-setup.ts` 動態套用 `'lc' => false`，測試結束後自動還原
- 執行 `npx playwright test`
- `if: always()` 上傳 `playwright-report/` 為 artifact（保留 30 天）
- **CI job 結束時**（無論成功/失敗）執行還原腳本，確保 `plugin.php` 乾淨

---

# Error Handling

- **Retry Logic**：每個測試失敗自動重試 1 次（`retries: 1` in playwright.config）
- **Phase 失敗阻斷**：某 Phase 的驗證指令失敗 → 停止，輸出失敗摘要，不進入下一 Phase
- **中途中斷恢復**：讀取 `.e2e-progress.json`，若 `lc_bypass_applied: true` 但測試未完成 → 先確認 `/plugin.php` 狀態再繼續
- **選擇器脆弱性**：禁止使用 CSS class 作為主要選擇器；優先使用 `getByRole`、`getByTestId`、`getByLabel`
- **逾時設定**：全域 timeout `30000ms`；expect timeout `5000ms`
- **Auth 快取**：登入狀態儲存至 `.auth/admin.json`（storageState），每個 Phase 共用，避免重複登入

---

# Output Format

## 檔案結構
````
tests/
└── e2e/
    ├── 01-admin/
    ├── 02-frontend/             # 依情境數量動態生成，不設上限
    ├── 03-integration/
    └── global-setup.ts          # WP 登入 + lc bypass 注入/還原
playwright.config.ts
.github/workflows/e2e.yml
.e2e-progress.json               # 斷點續傳進度追蹤
````

## playwright.config.ts 關鍵設定
```ts
{
  workers: 1,          // WordPress 共享 session，禁止平行
  retries: 1,
  timeout: 30_000,
  use: {
    baseURL: process.env.WP_BASE_URL || 'http://localhost:8889',
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    storageState: '.auth/admin.json',
  }
}
```

## 斷點續傳格式（.e2e-progress.json）
```json
{
  "phase": 2,
  "batch": 3,
  "completed_phases": [0, 1],
  "completed_scenarios": ["001-shortcode-render", "002-form-submit-success"],
  "lc_bypass_applied": true,
  "last_updated": "2025-01-01T00:00:00Z"
}
```
若檔案已存在，從 `phase` + `batch` 繼續，已完成的 spec 跳過重新生成。
`lc_bypass_applied: true` 代表 `/plugin.php` 目前處於修改狀態，需在還原 Phase 清除。

---

# Constraints

- **禁止** 在未完整閱讀所有程式碼前就開始生成測試腳本
- **禁止** 憑空假設外掛功能；所有測試情境必須有對應的原始碼依據
- **禁止** 將多個情境合併至同一個 spec 檔案（每個情境獨立一個檔案）
- **禁止** 省略或跳過任何情境，即使情境數量很多
- **禁止** commit `plugin.php` 含有 `'lc' => false` 的版本
- **禁止** 以任何形式永久保留 `'lc' => false`（不可下註解、不可條件編譯、不可寫入設定檔）
- **禁止** hardcode 任何密碼、API Key → 一律從 `process.env` 或 GitHub Secrets 讀取
- **禁止** 使用已棄用的 `@wordpress/e2e-test-utils`（Puppeteer 版本）
- **禁止** 透過瀏覽器 UI 觸發 WordPress 安裝流程 → 使用 `wp-env` 或 WP-CLI 完成
- **禁止** `workers` > 1（WordPress 共享 transients/session 會導致競態條件）
- 所有測試必須 **冪等**（可重複執行、不依賴上次執行的副作用）
````