---
name: wordpress-review-criteria
description: WordPress Plugin/Theme 程式碼審查完整 checklist，涵蓋安全性、Hook 系統、REST API、HPOS、PHP 8.1+ 最佳實踐。
---

# WordPress 程式碼審查 Criteria

本 skill 為 `@zenbu-powers:wordpress-reviewer` agent 專用的審查 checklist 與輸出模板。agent body 保持薄殼，具體審查項目、程式碼範例、輸出格式皆載入自此處。

---

## 審查嚴重性等級

| 等級 | 符號 | 說明 | 合併建議 |
|------|------|------|---------|
| 嚴重 | 🔴 | 安全漏洞（XSS / SQL 注入 / CSRF）、資料毀損、導致 Fatal Error 的邏輯錯誤 | **阻擋合併** |
| 重要 | 🟠 | 違反核心規則、影響可維護性或效能的問題、HPOS 不相容 | **阻擋合併** |
| 建議 | 🟡 | 命名不一致、可讀性問題、可優化之處 | 可合併，建議後續處理 |
| 備註 | 🔵 | 風格偏好、未來可考慮的優化方向 | 可合併 |

---

## 強制執行測試

在開始代碼審查之前，**必須**執行以下所有測試指令。即使開發者聲稱已通過測試，reviewer 仍須獨立驗證。

```bash
# 1. 靜態分析
composer phpstan
composer psalm

# 2. 代碼風格檢查
composer phpcs

# 3. 格式化檢查（如果專案有配置 php-cs-fixer）
composer cs-check
# 或
./vendor/bin/php-cs-fixer fix --dry-run --diff

# 4. 單元測試 / 整合測試（排除 e2e）
composer test
# 或
./vendor/bin/phpunit --exclude-group=e2e

# 5. 其他專案自訂的 lint/test 指令（查閱 composer.json scripts 區塊）
```

> ⚠️ **不可跳過任何測試**。若指令不存在（如專案未配置 phpstan），在審查報告中註明「該工具未配置」即可，但已配置的工具必須全部執行。
> ⚠️ 若任何測試失敗，**直接判定審查不通過**，無需繼續代碼審查，立即將失敗結果退回給開發者。
> ⚠️ 若無法讀取相關檔案，應明確告知使用者缺少哪些資訊，再開始審查。

---

## 取得審查對象

```bash
# 取得 PHP 相關檔案的變更
git diff -- '*.php'
```

---

## 參考文件索引

依審查情境載入對應的詳細 checklist：

- **安全性**：`references/security-checklist.md` — Nonce / capability / sanitization / escaping / SQL 注入 / 競爭條件
- **Hook 與 API**：`references/hooks-and-api.md` — Hook 系統命名、優先順序、REST API 端點檢查
- **效能與 HPOS**：`references/performance-and-hpos.md` — HPOS 相容、快取、N+1、WooCommerce 物件 API
- **PHP 最佳實踐**：`references/php-best-practices.md` — PHP 8.1+ 型別、enum、PHPDoc、命名、架構、程式碼異味
- **輸出模板**：`references/review-output-template.md` — 審查報告格式、WordPress 特殊情境對照表

---

## WordPress 特殊情境快速對照表

| 情境 | 必查重點 |
|------|---------|
| **REST API 端點** | `permission_callback` 是否驗證能力、`args` 是否清洗輸入 |
| **AJAX 處理器** | `check_ajax_referer`、`current_user_can`、`wp_send_json_*` |
| **表單儲存** | `check_admin_referer`、`sanitize_*()`、`update_option` / `update_post_meta` |
| **資料輸出** | `esc_html`、`esc_attr`、`esc_url`、`wp_kses_post` |
| **WooCommerce 訂單** | 使用 `wc_get_order()`、物件方法讀寫 meta、`$order->save()` |
| **WooCommerce 結帳** | 同時支援傳統與區塊結帳 hook |
| **排程任務** | `wp_schedule_event` 是否有 deregister，避免重複排程 |
| **多站台** | `switch_to_blog()` 與 `restore_current_blog()` 是否成對使用 |
| **並發/競爭條件** | TOCTOU 模式、Cron lock、庫存原子扣減、`update_option` 並發安全 |

---

## 核心審查原則

- **只審查，不主動修改**：除非明確被要求，否則只提供意見
- **具體而非籠統**：每個問題都需指出確切位置與改善方案（附程式碼對比）
- **尊重現有風格**：若專案有既定慣例，優先依照專案規範而非外部標準
- **平衡品質與務實**：明確區分「必須修改」與「建議優化」
- **符合規範就不改**：若程式碼已符合規範，不需要為了修改而修改
- **正向反饋**：審查中也要指出寫得好的地方
- **測試必須通過**：所有非 e2e 測試必須通過，否則直接判定審查不通過
