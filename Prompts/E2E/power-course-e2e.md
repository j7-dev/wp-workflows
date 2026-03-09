````
# Role & Goal
你是資深 WordPress 外掛測試工程師，專精 Playwright E2E 測試與 GitHub Actions CI/CD。
任務：為 **Power Course**（WordPress 課程外掛，PHP 8.1+ / React Admin SPA / WooCommerce 整合）
生成完整、全面的 E2E 測試套件，並整合至 GitHub Actions CI/CD pipeline。

自動執行所有步驟，除非遇到 [需人工確認] 標記，否則不需等待使用者確認。

---

# Context

## 專案背景

Power Course 是一個 WordPress LMS 外掛，位於 `powerrepo` monorepo 的 `apps/power-course/` 子目錄（Git submodule）。

- **PHP Namespace:** `J7\PowerCourse\` → `inc/classes/` 和 `inc/src/`
- **React Admin SPA 入口:** `js/src/main.tsx` → 建置至 `js/dist/`
- **Admin SPA 框架:** Refine.dev + Ant Design，使用 **HashRouter**（路由格式 `#/courses`、`#/students`）
- **前台頁面:** PHP 模板渲染（課程銷售頁、教室頁、WC My Account）
- **套件管理器:** pnpm（monorepo workspace）
- **Text Domain:** `power-course`
- **依賴外掛:** WooCommerce >= 7.6.0, Powerhouse >= 3.3.41
- **REST API Base:** `/wp-json/power-course/`

### Admin SPA 路由（HashRouter）

| 路由 | 說明 |
|------|------|
| `#/courses` | 課程列表（ProTable） |
| `#/courses/edit/:id` | 課程編輯（tabs: 價格/章節/學員/銷售方案/說明/Q&A/分析/其他） |
| `#/teachers` | 講師管理 |
| `#/students` | 學員管理 + CSV 匯出 |
| `#/products` | 課程-商品綁定 |
| `#/emails` | Email 模板列表 |
| `#/emails/edit/:id` | Email 模板編輯器 |
| `#/settings` | 外掛設定 |
| `#/analytics` | 營收分析 |
| `#/media-library` | WordPress 媒體庫 |
| `#/bunny-media-library` | Bunny CDN 媒體庫 |

### 前台頁面（PHP 模板）

| 頁面 | 模板路徑 | 說明 |
|------|----------|------|
| 課程銷售頁 | `inc/templates/pages/course-product/` | 課程商品頁（header/body/sider/tabs/footer） |
| 教室 | `inc/templates/pages/classroom/` | 學習教室（影片播放器/章節導航/完成按鈕） |
| My Account | `inc/templates/pages/my-account/` | WC 我的帳戶課程列表 |
| 存取拒絕 | `inc/templates/pages/404/` | buy/expired/not-ready 三種錯誤頁 |

### REST API 端點

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET/POST/DELETE | `courses` | 課程 CRUD |
| GET | `courses/{id}` | 取得課程 + 章節 |
| POST | `courses/add-students` | 開通學員權限 |
| POST | `courses/remove-students` | 移除學員權限 |
| POST | `courses/update-students` | 更新到期日 |
| GET/POST/DELETE | `chapters` | 章節 CRUD |
| POST | `chapters/sort` | 章節排序 |
| POST | `toggle-finish-chapters/{id}` | 切換章節完成狀態 |
| GET/POST | `users` | 用戶管理 |
| GET/POST | `options` | 外掛設定 |
| GET | `reports/revenue` | 營收報表 |

### 核心業務邏輯

- **課程 = WooCommerce 商品** + `_is_course = 'yes'` meta
- **購買流程:** WC 訂單完成 → `do_action('power_course_add_student_to_course')` → 開通權限
- **到期日類型:** `0`（永久）、timestamp（固定日期）、`'subscription_123'`（跟隨訂閱）
- **銷售方案（Bundle Product）:** `bundle_type` meta 的商品，連結課程 → 購買時授權
- **章節完成:** POST `toggle-finish-chapters/{id}` → 更新 `pc_avl_chaptermeta` → 計算進度 → 100% 觸發 `course_finished`
- **CSS:** Power Course 無自有 CSS，樣式在 Powerhouse 外掛中，前台用 DaisyUI `pc-` 前綴 class

## 專案結構假設
在開始前，先掃描專案根目錄，識別：
- 外掛主檔案：`plugin.php`（含 `Plugin Name:` header）
- React 前端入口：`js/src/main.tsx`
- PHP 類別：`inc/classes/`（PSR-4 → `J7\PowerCourse\`）
- PHP 模板：`inc/templates/`
- 現有 `package.json`（pnpm workspace，已有 Node 環境）
- 現有測試目錄：目前**無任何測試基礎設施**

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
   - 安裝並啟用 Power Course、Powerhouse、WooCommerce 三個外掛
   - 停用 Query Monitor 等 Debug 外掛（避免額外 DOM 元素干擾選擇器）

---

# Task Steps

## Phase 0 — 專案深度理解（禁止跳過）

> ⚠️ **這是最重要的階段。嚴禁跳過任何檔案。必須完整閱讀每一個 PHP / JS / TSX 檔案，
> 徹底理解所有核心使用者情境後，才能進入後續 Phase。**

### 0-A 專案結構全面分析
依序執行以下操作（不可省略）：
1. 掃描 `inc/classes/` 下所有 PHP 類別檔案，完整讀取內容，理解：
   - API 端點定義（`inc/classes/Api/`）
   - 資源模型（`inc/classes/Resources/`）
   - 工具類（`inc/classes/Utils/`）
   - Shortcode 定義（`inc/classes/Shortcodes/`）
   - 模板系統（`inc/classes/Templates/`）
2. 掃描 `js/src/` 下所有 React 元件（`.tsx` / `.ts`），完整讀取內容，理解：
   - 頁面路由定義（`js/src/resources/index.tsx`）
   - Admin 頁面組件（`js/src/pages/admin/`）
   - 自定義 Hooks（`js/src/hooks/`）
   - 共用元件（`js/src/components/`）
3. 掃描 `inc/templates/` 下所有 PHP 模板，完整讀取內容，理解前台渲染邏輯
4. 搜尋以下關鍵字，識別業務邏輯邊界：
   - `register_rest_route`、`rest_api_init`（REST 端點）
   - `add_shortcode`（Shortcode 輸出點）
   - `add_menu_page`、`add_submenu_page`（後台頁面）
   - `current_user_can`、`capability`（權限邊界）
   - `do_action('power_course_`（核心業務 hook）
   - `woocommerce_`（WC 整合點）

### 0-B 建立使用者情境清單
閱讀完所有檔案後，輸出一份 **使用者情境清單**（Markdown 表格），格式如下：

| #   | 情境名稱 | 角色 | 前置條件 | 操作步驟摘要 | 預期結果 |
| --- | -------- | ---- | -------- | ------------ | -------- |

> 此清單將作為 Phase 1–3 測試腳本的唯一依據。
> 情境必須來自實際程式碼，禁止憑空假設功能。

情境至少應涵蓋以下類別（依實際程式碼為準）：

**Admin SPA（HashRouter）：**
- 課程 CRUD（列表/建立/編輯各 tab/刪除）
- 章節管理（CRUD + 拖曳排序）
- 學員管理（新增/移除/更新到期日/CSV 匯出）
- 銷售方案管理（Bundle Product）
- Email 模板 CRUD
- 外掛設定（儲存/載入）
- 講師管理
- 營收分析報表

**前台頁面（PHP 模板）：**
- 課程銷售頁渲染（價格/章節列表/講師資訊/評論）
- 教室頁面（影片播放器/章節導航/完成章節按鈕）
- WC My Account 課程列表
- 存取拒絕頁面（未購買/已過期/未開課）

**整合流程：**
- 完整購買 → 開通 → 上課流程
- 到期日各類型驗證
- 權限控制（不同角色存取）

### 0-C 環境初始化
1. 安裝依賴（使用 pnpm，已有 package.json）：
````
   pnpm add -D @playwright/test @wordpress/e2e-test-utils-playwright
   pnpm exec playwright install chromium
````
2. 生成 `playwright.config.ts`（見 Output Format）
3. **套用授權繞過修改**（`'lc' => false`）至 `/plugin.php`
4. 確認 `git diff plugin.php` 顯示修改已套用但**未暫存**
5. 寫入進度：`{ "phase": 0, "status": "done", "lc_bypass_applied": true }` → `.e2e-progress.json`

---

## Phase 1 — 後台 Admin SPA 測試（HashRouter）
**依據 Phase 0 情境清單中後台相關情境生成測試。**
**每批完成後驗證：`pnpm exec playwright test tests/e2e/01-admin/`，通過才繼續。**

掃描 Admin SPA 的 HashRouter 路由（`/wp-admin/admin.php?page=power-course#/path`），為每個頁面/功能生成測試。

### Admin SPA 測試注意事項
- **導航方式：** 所有 admin 路由在 `#/` 之後，例如 `#/courses`、`#/courses/edit/123`
- **SPA 載入等待：** 等待 `#power_course` 容器出現 + Ant Design Spin 消失
- **ProTable 載入等待：** 等待 `.ant-table-tbody tr` 出現 + `.ant-spin` 消失
- **表單組件：** Ant Design ProForm，使用 `getByRole` 優先，fallback 用 `data-testid`
- **訊息提示：** 操作成功/失敗使用 Ant Design Message（`.ant-message-success` / `.ant-message-error`）
- **選擇器優先級：** `getByRole` > `getByTestId` > `getByLabel` > `locator('.ant-*')`（最後才用 Ant Design class）

範例測試項目（依實際情境清單為準）：
- `course-list.spec.ts`：課程列表頁載入 → ProTable 顯示資料 → 無 console error
- `course-create.spec.ts`：建立新課程 → 填寫表單 → 儲存 → 驗證出現在列表
- `course-edit-tabs.spec.ts`：進入課程編輯 → 切換各 tab → 各 tab 內容正確渲染
- `chapter-manage.spec.ts`：新增/編輯/刪除/排序章節
- `student-manage.spec.ts`：新增/移除/更新學員到期日
- `settings-save.spec.ts`：修改設定 → 儲存 → 重新載入 → 驗證值持久化
- `email-template.spec.ts`：Email 模板 CRUD

---

## Phase 2 — 前台使用者情境測試

> ⚠️ **嚴禁跳過任何檔案。進入此 Phase 前，必須已完成 Phase 0-A 的完整檔案閱讀。**
> **每一個使用者情境都必須對應一個獨立的 spec 檔案，不得合併或省略。**

### Step 2-A — 前台情境萃取（再次確認，不可省略）
從 Phase 0-B 的情境清單中，篩選出所有前台相關情境。
若發現有任何前台功能在 Phase 0 掃描中可能遺漏，**立即重新讀取補讀對應檔案**，再更新情境清單。

確認涵蓋以下面向（依實際程式碼為準）：
- 課程銷售頁各組件渲染（價格卡、章節折疊、講師資訊、評論）
- 教室頁面完整流程（影片載入、章節導航、完成/取消完成章節）
- WooCommerce 購買流程（加入購物車 → 結帳 → 訂單完成）
- My Account 課程列表顯示
- 不同角色的操作差異（管理員/已購買學員/未購買訪客/未登入訪客）
- 存取控制頁面（未購買 → buy / 已過期 → expired / 未開課 → not-ready）

### Step 2-B — 逐一生成 E2E 測試腳本

針對 Step 2-A 確認的**每一個情境**，在 `tests/e2e/02-frontend/` 下生成對應 spec 檔案：

命名規則：`[序號]-[情境slug].spec.ts`，例如：
````
tests/e2e/02-frontend/
├── 001-course-product-page-render.spec.ts
├── 002-course-product-pricing.spec.ts
├── 003-classroom-video-player.spec.ts
├── 004-classroom-chapter-navigation.spec.ts
├── 005-classroom-finish-chapter.spec.ts
├── 006-course-progress-tracking.spec.ts
├── 007-my-account-course-list.spec.ts
├── 008-access-denied-not-purchased.spec.ts
├── 009-access-denied-expired.spec.ts
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

### 前台測試注意事項
- **CSS 選擇器：** 前台使用 DaisyUI 的 `pc-` 前綴（`.pc-btn`、`.pc-modal`、`.pc-badge`、`.pc-collapse` 等）
- **影片播放器：** 依 `chapter_video.type` 有不同實作（bunny → VidStack + HLS.js、youtube/vimeo → iframe、code → raw HTML）
- **WC 結帳頁：** 使用 WooCommerce 原生表單，選擇器參考 WC 標準
- **Shortcode 渲染：** 課程列表、購買按鈕等透過 `inc/classes/Shortcodes/General.php` 註冊
- **選擇器優先級：** `getByRole` > `getByTestId` > `getByLabel` > `locator('.pc-*')`（最後才用 DaisyUI class）

**每批（每 10 個 spec）完成後：**
1. 執行 `pnpm exec playwright test tests/e2e/02-frontend/` 驗證
2. 寫入進度至 `.e2e-progress.json`
3. 通過才繼續下一批；失敗則輸出失敗摘要後停止

---

## Phase 3 — 跨模組整合與邊界測試
**依據 Phase 0 情境清單中權限、衝突、錯誤邊界相關情境生成測試。**
**每批完成後驗證：`pnpm exec playwright test tests/e2e/03-integration/`**

- `purchase-flow.spec.ts`：完整購買 → 開通 → 上課 → 完成課程流程
- `expire-date.spec.ts`：到期日各類型（unlimited / fixed / assigned / follow_subscription）驗證
- `course-access-control.spec.ts`：未購買/已過期/未開課的存取控制頁面
- `plugin-dependency.spec.ts`：Power Course + Powerhouse + WooCommerce 三外掛共存無衝突
- `permission.spec.ts`：以不同角色登入 → 驗證 Admin SPA 存取權限
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
- `on: push` + `on: pull_request`（target: `master`）
- 啟動 WordPress 環境（wp-env 或 docker-compose）
- 安裝並啟用 Power Course、Powerhouse、WooCommerce 三個外掛
- CI 環境中透過 `global-setup.ts` 動態套用 `'lc' => false`，測試結束後自動還原
- 執行 `pnpm exec playwright test`
- `if: always()` 上傳 `playwright-report/` 為 artifact（保留 30 天）
- **CI job 結束時**（無論成功/失敗）執行還原腳本，確保 `plugin.php` 乾淨

---

# Error Handling

- **Retry Logic**：每個測試失敗自動重試 1 次（`retries: 1` in playwright.config）
- **Phase 失敗阻斷**：某 Phase 的驗證指令失敗 → 停止，輸出失敗摘要，不進入下一 Phase
- **中途中斷恢復**：讀取 `.e2e-progress.json`，若 `lc_bypass_applied: true` 但測試未完成 → 先確認 `/plugin.php` 狀態再繼續
- **選擇器脆弱性**：禁止使用純 CSS class 作為主要選擇器；優先使用 `getByRole`、`getByTestId`、`getByLabel`
- **Ant Design 選擇器例外**：Admin SPA 中可使用 `.ant-*` class 作為 fallback（如 `.ant-table`、`.ant-spin`），但需加註釋說明
- **DaisyUI 選擇器例外**：前台中可使用 `.pc-*` class 作為 fallback（如 `.pc-btn`、`.pc-collapse`），但需加註釋說明
- **逾時設定**：全域 timeout `30000ms`；expect timeout `5000ms`
- **SPA 載入逾時**：Admin SPA 初始化等待最多 `15000ms`（React + Refine.dev + TanStack Query 首次載入較慢）
- **Auth 快取**：登入狀態儲存至 `.auth/admin.json`（storageState），每個 Phase 共用，避免重複登入

---

# Output Format

## 檔案結構
````
tests/
└── e2e/
    ├── helpers/
    │   ├── admin-page.ts         # Admin SPA HashRouter 導航 helper
    │   ├── api-client.ts         # REST API 請求 helper（/wp-json/power-course/）
    │   └── wc-checkout.ts        # WooCommerce 結帳流程 helper
    ├── fixtures/
    │   └── test-data.ts          # 測試資料常數（課程名稱、價格、用戶等）
    ├── 01-admin/
    ├── 02-frontend/              # 依情境數量動態生成，不設上限
    ├── 03-integration/
    └── global-setup.ts           # WP 登入 + lc bypass 注入/還原
playwright.config.ts
.github/workflows/e2e.yml
.e2e-progress.json                # 斷點續傳進度追蹤
````

## playwright.config.ts 關鍵設定
```ts
{
  workers: 1,          // WordPress 共享 session，禁止平行
  retries: 1,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: process.env.WP_BASE_URL || 'http://localhost:8889',
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    storageState: '.auth/admin.json',
    locale: 'zh-TW',
    timezoneId: 'Asia/Taipei',
  }
}
```

## 斷點續傳格式（.e2e-progress.json）
```json
{
  "phase": 2,
  "batch": 3,
  "completed_phases": [0, 1],
  "completed_scenarios": ["001-course-product-page-render", "002-course-product-pricing"],
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
- **禁止** 使用 `npm` → 本專案使用 `pnpm`（monorepo workspace）
- **禁止** 使用 `waitForTimeout` 做硬等待 → 改用 `waitForSelector` / `waitForURL` / `expect().toBeVisible()`
- 所有測試必須 **冪等**（可重複執行、不依賴上次執行的副作用）
````
