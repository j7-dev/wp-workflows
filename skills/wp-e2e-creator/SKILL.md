---
name: wp-e2e-creator
description: 根據 spec 規格文件，識別邊緣案例並生成 Playwright E2E 測試。涵蓋邊緣案例識別框架、測試生成模式，以及 wp-env + Playwright 技術實作。當使用者需要為 WordPress Plugin 建立 E2E 測試、識別測試邊緣案例、或設定 wp-env + Playwright 環境時，請啟用此技能。
---

# WordPress Plugin E2E 測試生成器

從 spec 規格到測試生成的完整流程：**讀取 spec 規格 → 識別邊緣案例 → 生成 Playwright E2E 測試**。

---

## 前置條件：讀取 spec 規格

> 若 `specs/` 目錄不存在或其中無任何檔案，立即中止任務。
> 提示使用者先執行需求訪談，產生 spec 規格文件後再繼續。

**spec 檔案為所有功能規格與使用者情境的唯一依據，必須優先完整閱讀。**

從 spec 中提取：
- **功能模組清單**（每個模組的主要功能）
- **使用者角色清單**（所有角色及其權限）
- **使用者情境清單**（所有 user story / 使用流程）
- **業務規則**（驗證規則、狀態機、限制條件）

---

## 核心工作流程

```
Step 1: 讀取 spec，建立情境清單
  └── 從 spec 提取使用者角色、功能情境、業務規則

Step 2: 識別邊緣案例
  └── 權限邊界、資料邊界、狀態邊界、整合邊界

Step 3: 規劃測試矩陣
  └── 情境 × 角色 × 邊緣案例 的交叉組合

Step 4: 生成 Playwright 測試
  └── 三階段測試（Admin / Frontend / Integration）
```

---

## Step 2：邊緣案例識別框架

### 2.1 權限邊界

每個功能都必須測試以下邊界：

```typescript
// 權限邊界測試矩陣
const permissionEdgeCases = [
  { role: 'guest',            expectation: 'redirect-to-login' },
  { role: 'subscriber',       expectation: 'show-purchase-prompt' },
  { role: 'purchased',        expectation: 'full-access' },
  { role: 'expired',          expectation: 'show-expired-message' },
  { role: 'admin',            expectation: 'full-access-plus-admin-bar' },
  { role: 'purchased-paused', expectation: 'show-paused-message' },   // 若有此狀態
]
```

### 2.2 資料邊界

```typescript
const dataEdgeCases = {
  empty:    { courses: 0,    chapters: 0    },  // 空狀態
  single:   { courses: 1,    chapters: 1    },  // 最小資料集
  large:    { courses: 100,  chapters: 500  },  // 大量資料（分頁測試）
  special:  { title: '中文 & <script> "title"' },  // XSS、特殊字元
  unicode:  { title: '課程 título' },                // 多語言
  boundary: { price: 0, price_max: 999999 },        // 金額邊界值
}
```

### 2.3 狀態邊界

```typescript
const stateEdgeCases = [
  // 課程狀態
  'draft', 'published', 'private',
  // 存取狀態
  'not-purchased', 'pending', 'active', 'expired', 'refunded', 'revoked',
  // 訂單狀態
  'pending-payment', 'processing', 'completed', 'cancelled', 'refunded', 'failed',
]
```

### 2.4 整合邊界

```typescript
const integrationEdgeCases = [
  'wc-product-deleted-after-purchase',    // 商品刪除後仍有存取權
  'plugin-deactivated-reactivated',       // Plugin 停用/重新啟用後資料完整性
  'multiple-purchases-same-course',       // 重複購買同一課程
  'purchase-during-checkout',             // 同一課程兩個 tab 同時結帳
  'expired-coupon-at-checkout',           // 結帳時優惠券已過期
]
```

---

## Step 3：測試矩陣規劃

### 優先級排序

```typescript
const testPriority = {
  P0: '核心流程 × 正常路徑',     // 絕對要測試
  P1: '核心流程 × 權限邊界',     // 安全性相關
  P2: '次要流程 × 正常路徑',     // 重要功能
  P3: '邊緣案例 × 罕見情境',     // 品質提升
}
```

### 測試矩陣範例

```
功能: 課程教室存取
                  | guest | subscriber | purchased | expired | admin
------------------+-------+------------+-----------+---------+------
前往課程 URL      |  302  |    403     |    200    |   403   |  200
觀看影片          |  N/A  |    N/A     |    ✓      |   N/A   |   ✓
標記章節完成      |  N/A  |    N/A     |    ✓      |   N/A   |   ✓
查看進度          |  N/A  |    N/A     |    ✓      |   N/A   |   ✓
```

---

## Step 4：測試生成

生成測試時，依照 `references/test-templates.md` 中的三種模板：

1. **使用者情境模板** — 以角色矩陣驅動，用 `for...of` 迴圈測試所有角色
2. **邊緣案例模板** — AAA 模式（Arrange/Act/Assert），每個邊緣案例一個獨立 test
3. **API 邊界模板** — 測試 401、404、SQL injection 防護等

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

---

## 最佳實踐

1. **情境先行** — 先從 spec 分析找出所有情境，再決定要測試哪些
2. **角色矩陣** — 每個功能都測試所有相關角色（不只 happy path）
3. **邊緣案例分類** — 用「權限 / 資料 / 狀態 / 整合」四個維度系統化識別
4. **獨立測試資料** — 每個測試用 API 建立自己的資料，執行後清除
5. **REST API 建立資料** — 絕不在測試程式碼中使用 WP CLI 或 execSync
6. **強制刪除** — 建立新資料前刪除所有狀態（publish、draft、trash）
7. **單一 worker** — WordPress 無法處理平行 session

---

## 參考文件

依需要載入對應的詳細內容：

- **測試程式碼模板**：`references/test-templates.md` — 使用者情境、邊緣案例、API 邊界的完整 Playwright 測試範例
- **wp-env 環境設定**：`references/wp-env-setup.md` — 目錄結構、Global Setup、REST API Client、License Check Bypass
