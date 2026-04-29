---
name: aibdd.auto.php.it.control-flow
description: >
  PHP IT 全自動批次迴圈。掃描 features 目錄，為每個 .feature 展開完整的 4 phase TODO 清單
  （test-skeleton → red → green → refactor），然後逐一執行直到全數完成。
  專注 WordPress plugin 整合測試。
  當 /aibdd-specformula 的 Phase 02 觸發，或使用者說「php it control-flow」「批次執行」時觸發。
---

# PHP IT Control Flow — 4-Phase 批次執行器

## 角色定位

本 skill 為 **WordPress PHP 整合測試自動化流程** 的 **主控調度器**。

職責：
1. 掃描 `specs/features/` 中所有 `.feature` 檔案
2. 為每個 feature 展開 4 個 phase 的 TodoWrite 任務
3. 依序呼叫對應 skill 執行每個 phase
4. 所有任務完成後執行最終回歸測試

**觸發條件**：
- `/zenbu-powers:aibdd-specformula` 的 Phase 02 自動調用
- 使用者輸入「php it control-flow」、「批次執行」、「PHP 整合測試自動化」
- 使用者直接呼叫 `/zenbu-powers:aibdd.auto.php.it.control-flow`

---

## 4-Phase 循環說明

```
對每個 Feature 檔案：
  Phase 1: /zenbu-powers:aibdd.auto.php.it.test-skeleton  （PHPUnit 測試骨架 + TODO 註解）
    ↓
  Phase 2: /zenbu-powers:aibdd.auto.php.it.red            （紅燈：Stub + Test 實作）
    ↓
  Phase 3: /zenbu-powers:aibdd.auto.php.it.green          （綠燈：WP DB Repository + Service 邏輯）
    ↓
  Phase 4: /zenbu-powers:aibdd.auto.php.it.refactor       （重構：消除重複、改名、抽 helper）
```

**必須依序執行，不可跳過、不可顛倒。**

---

## Phase 0: 環境前置檢查

在展開 TodoWrite 之前，檢查下列檔案 / 設定：

| 檢查項 | 路徑 | 若缺失 |
|-------|------|--------|
| wp-env 設定 | `.wp-env.json` | 提示使用者建立，說明 plugin 路徑 |
| PHPUnit 設定 | `phpunit.xml.dist` | 須有 `<testsuite name="integration">` 節 |
| 測試 bootstrap | `tests/bootstrap.php` | 須載入 Yoast WPTestUtils |
| Composer 依賴 | `composer.json` | 須含 `yoast/wp-test-utils` |
| IntegrationTestCase | `tests/integration/IntegrationTestCase.php` | 告知將由 red 階段自動建立 |

### 範例 `phpunit.xml.dist` 片段

```xml
<?xml version="1.0"?>
<phpunit bootstrap="tests/bootstrap.php" colors="true">
    <testsuites>
        <testsuite name="integration">
            <directory suffix="Test.php">./tests/integration</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

### 範例 `tests/bootstrap.php` 片段

```php
<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../vendor/yoast/wp-test-utils/src/WPIntegration/bootstrap-functions.php';
\Yoast\WPTestUtils\WPIntegration\bootstrap_it();
```

### 範例 `composer.json` require-dev 片段

```json
"require-dev": {
    "phpunit/phpunit": "^9.6",
    "yoast/wp-test-utils": "^1.2"
}
```

若任一必要項缺失，停下並提示使用者補齊。`IntegrationTestCase.php` 例外 — 告知「將由 `/zenbu-powers:aibdd.auto.php.it.red` 自動建立」即可繼續。

---

## Step 1: 掃描 Feature 檔案

### 來源目錄

- 預設：`${FEATURES_DIR}` 環境變數，fallback 到 `specs/features/`
- 使用 `Glob` 工具搜尋 `**/*.feature`

### 排序策略

1. 若 `${FEATURES_DIR}/句型.md` 存在 → 依其中列出的 feature 順序
2. 否則 → 依檔名字母排序
   - 建議使用者為 feature 加數字前綴（`01-lesson-progress.feature`、`02-course-enrollment.feature`）以控制順序

### 展示確認

將排序後清單呈現給使用者：

```
偵測到 3 個 feature 檔案，將依下列順序執行：
  1. specs/features/01-lesson-progress.feature
  2. specs/features/02-course-enrollment.feature
  3. specs/features/03-order-checkout.feature

按順序執行？(y/n)
```

---

## Step 2: 建立 TodoWrite 任務清單

對每個 feature 展開 **4 個任務**，依 phase 順序排列：

```
TodoWrite([
  { content: "01-lesson-progress — Test Skeleton",  status: "pending" },
  { content: "01-lesson-progress — Red",            status: "pending" },
  { content: "01-lesson-progress — Green",          status: "pending" },
  { content: "01-lesson-progress — Refactor",       status: "pending" },
  { content: "02-course-enrollment — Test Skeleton", status: "pending" },
  { content: "02-course-enrollment — Red",           status: "pending" },
  { content: "02-course-enrollment — Green",         status: "pending" },
  { content: "02-course-enrollment — Refactor",      status: "pending" },
  ...
])
```

**展開規則**：先橫向展開單一 feature 的 4 phase，再進入下一個 feature。確保同一 feature 的 4 phase 連續執行。

---

## Step 3: 逐一執行

### 執行循環

```
取下一個 pending 任務
    ↓
標記 → in_progress
    ↓
使用 Skill 工具呼叫對應 skill（傳入 feature file 絕對路徑）
    ↓
等待完成
    ↓
標記 → completed
    ↓
前進到下一個 pending（若有）
```

### Phase → Skill 對照表

| 任務 Phase | 呼叫的 Skill | 傳入參數 |
|-----------|-------------|---------|
| Test Skeleton | `/zenbu-powers:aibdd.auto.php.it.test-skeleton` | feature file 絕對路徑 |
| Red | `/zenbu-powers:aibdd.auto.php.it.red` | feature file 絕對路徑 |
| Green | `/zenbu-powers:aibdd.auto.php.it.green` | feature file 絕對路徑 |
| Refactor | `/zenbu-powers:aibdd.auto.php.it.refactor` | feature file 絕對路徑 |

### 範例

```
// 目前: 01-lesson-progress — Test Skeleton [in_progress]
Skill /zenbu-powers:aibdd.auto.php.it.test-skeleton specs/features/01-lesson-progress.feature
→ 完成：LessonProgressTest.php 建立 + TODO 註解
→ 標記 completed

// 前進到: 01-lesson-progress — Red [pending → in_progress]
Skill /zenbu-powers:aibdd.auto.php.it.red specs/features/01-lesson-progress.feature
→ 完成：Stub 建立 + Test 實作 + 紅燈驗證
→ 標記 completed

// 前進到: 01-lesson-progress — Green [pending → in_progress]
...
```

---

## Step 4: 最終回歸測試

所有 TodoWrite 任務皆 completed 後執行：

```bash
vendor/bin/phpunit --testsuite integration
```

或透過 wp-env：

```bash
npx wp-env run tests-cli --env-cwd=wp-content/plugins/{plugin} \
    vendor/bin/phpunit --testsuite integration
```

### 結果處理

- ✅ **全綠** → 顯示完整成果報告（features 數量、test method 數量、耗時）並結束
- ❌ **任何失敗** → 定位失敗的 feature / test method → 回到對應 phase（通常是 green）修正 → 重新執行回歸

---

## 規則

1. **不停下來問問題**：遇到可自行判斷的問題（缺少某個 class、autoload 未更新、測試資料缺失）→ 自己修。僅在環境層級不可恢復時（wp-env 未啟動、composer 未安裝）才中斷。
2. **不跳過任何任務**：每個 feature 的 4 phase 都必須完成，即使看起來某 phase 「沒東西要做」也要走過一遍並標 completed。
3. **一次只有一個 in_progress**：TodoWrite 同時間僅允許一個任務在 in_progress 狀態。
4. **Skill 是 lazy loading**：每次呼叫完整載入該 skill 的指令，不受 context compaction 影響。不要試圖「記住」上一個 phase 的 skill 內容。
5. **Phase 順序不可顛倒**：skeleton → red → green → refactor。例如不可未完成 red 就跳 green。
6. **跨 feature 不共用狀態**：每個 feature 獨立執行 4 phase，不假設前一個 feature 的產出對下一個有用。

---

## 與 Java / Python 版差異

| 面向 | PHP IT | Java / Python |
|------|--------|--------------|
| Phase 數量 | **4 phase**（多 test-skeleton） | 3 phase（red / green / refactor） |
| 骨架來源 | 需額外 `/zenbu-powers:aibdd.auto.php.it.test-skeleton` 產生 PHPUnit 骨架 | BDD 框架（Cucumber / Behave）自動對映 .feature |
| Variant routing | **無** arguments.yml 路由（PHP IT 獨立運作） | 有 IT / API / E2E 分流 |
| 測試命令 | `vendor/bin/phpunit` | Maven `mvn verify` / `behave` |
| DB rollback | `WP_UnitTestCase` 自動處理 | Testcontainers 手動管理 / Python fixture |
| 基類 | `Yoast\WPTestUtils\WPIntegration\TestCase` | JUnit 5 / pytest |

---

## Troubleshooting 常見問題

| 症狀 | 原因 | 解法 |
|------|------|------|
| `wp-env: command not found` | wp-env 未安裝 | `npm install -g @wordpress/env` |
| `Error: Could not start wp-env` | Docker 未啟動 / port 衝突 | 啟動 Docker Desktop；檢查 8888 / 8889 port |
| `Fatal error: Class 'Yoast\WPTestUtils\...'` | Yoast WPTestUtils 未安裝 | `composer require --dev yoast/wp-test-utils` |
| `No tests executed` | phpunit.xml.dist 的 testsuite 路徑錯誤 | 檢查 `<directory suffix="Test.php">` 指向 `tests/integration` |
| `Error establishing a database connection` | wp-env 未啟動 | `npx wp-env start` |
| `Class App\... not found` | autoload 未更新 | `composer dump-autoload` |
| Test 卡在 BadMethodCallException | Green phase 未完成 | 檢查 TodoWrite 是否漏標 completed |

---

## 執行起始訊息範本

開始時輸出：

```
=== PHP IT Control Flow 啟動 ===
偵測到 N 個 feature 檔案：
  1. ...
  2. ...
將展開 (N × 4) 個任務，依序執行 test-skeleton → red → green → refactor。
環境檢查：✅ wp-env / ✅ phpunit.xml.dist / ✅ bootstrap.php / ✅ composer deps
開始執行 Phase 1 of (N × 4)...
```

結束時輸出：

```
=== PHP IT Control Flow 完成 ===
處理 N 個 feature，共 M 個 test method，全部綠燈。
最終回歸：vendor/bin/phpunit --testsuite integration → PASS
```
