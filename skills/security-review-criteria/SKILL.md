---
name: security-review-criteria
description: WordPress Plugin 資安審查完整 checklist 與決策邏輯，涵蓋 OWASP Top 10、WordPress 特有漏洞（XSS / SQLi / CSRF / 能力檢查 / 路徑穿越 / SSRF / REST API）、依賴套件漏洞、敏感資訊洩漏、競爭條件、LLM 輸出信任邊界，並定義審查報告輸出格式與嚴重度分級。供 @zenbu-powers:security-reviewer agent 於審查時參考，也可於開發階段作為自我檢查清單。當審查 PHP 程式碼、評估 WordPress Plugin 安全性、撰寫資安報告、判斷漏洞嚴重度，或需要 before/after 修補範例時，請啟用此技能。
---

# WordPress Plugin 資安審查 Criteria

供 `@zenbu-powers:security-reviewer` agent 使用的完整審查依據。包含 13 個審查維度、常見誤判排除、輸出模板與高風險情境對照表。

## 適用時機

- 以攻擊者視角審查 WordPress Plugin / Theme 的 PHP 程式碼
- 判斷漏洞嚴重度與合併建議
- 撰寫結構化的資安審查報告（含 before/after diff）
- 建立開發階段的自我檢查清單

---

## 審查嚴重性等級

| 等級 | 符號 | 說明 | 合併建議 |
|------|------|------|---------|
| 嚴重 | 🔴 | 可直接被利用的漏洞：遠端代碼執行、未授權資料存取、認證繞過 | **立即阻擋，通知專案負責人** |
| 重要 | 🟠 | 需要特定條件才能利用：CSRF、存取控制缺失、資料洩漏風險 | **阻擋合併** |
| 建議 | 🟡 | 安全最佳實踐不符、防禦縱深不足 | 可合併，建議後續處理 |
| 備註 | 🔵 | 安全性偏好建議、未來強化方向 | 可合併 |

---

## 審查流程建議順序

1. **依賴盤點**：先跑 `composer audit` / `npm audit`，排除高 CVE 依賴
2. **高風險搜尋**：用 grep 快速定位危險函式（`eval`、`$_GET`、`wpdb->query` 等）
3. **維度逐一審查**：按照 OWASP + WordPress 特有清單逐項核對
4. **誤判排除**：比對「常見誤判」表，過濾已知非問題
5. **報告產出**：依輸出模板呈現，標註嚴重度與修補程式碼對比

---

## References 索引

根據審查維度載入對應參考：

- **OWASP 對應檢查**：[`references/owasp-checklist.md`](references/owasp-checklist.md)
  輸入驗證、SQL 注入、XSS、敏感資訊洩漏、遠端請求 SSRF、REST API 安全等 OWASP Top 10 對應維度

- **WordPress 特有漏洞**：[`references/wordpress-vulnerabilities.md`](references/wordpress-vulnerabilities.md)
  CSRF Nonce、能力檢查與存取控制、檔案系統安全、WordPress 特有模式（eval / shortcode / cron / multisite）、競爭條件、LLM 輸出信任邊界

- **依賴與敏感資訊**：[`references/dependency-and-secrets.md`](references/dependency-and-secrets.md)
  依賴套件漏洞掃描指令、常見誤判排除、秘鑰管理實務

- **報告輸出模板**：[`references/review-output-template.md`](references/review-output-template.md)
  審查報告格式、漏洞描述模板、高風險情境快速對照表

---

## 快速啟動檢查

開始審查前，先執行以下指令取得變更範圍：

```bash
# 取得所有 PHP 變更
git diff -- '*.php'

# 搜尋高風險模式
grep -rn "eval\|base64_decode\|system\|exec\|shell_exec\|passthru" --include="*.php" .
grep -rn "\$_GET\|\$_POST\|\$_REQUEST\|\$_COOKIE\|\$_SERVER" --include="*.php" .
grep -rn "wpdb->query\|wpdb->get_results\|wpdb->get_var" --include="*.php" .

# 靜態分析（如果專案有配置）
composer phpstan
composer phpcs
```

---

## 核心審查原則

- **攻擊者視角**：以「如何利用這段程式碼」的思維審查，而非「這段程式碼是否正確」
- **具體而非籠統**：每個漏洞都需指出確切位置、攻擊情境與修補方案（附程式碼對比）
- **符合規範就不改**：若程式碼已符合安全規範，不需要為了修改而修改
- **避免誤報**：充分理解程式碼上下文後再判定，並說明誤判的排除依據
- **正向反饋**：審查中也要指出已正確處理的安全措施
