# 依賴套件與敏感資訊審查清單

涵蓋第三方依賴 CVE 掃描、敏感資訊洩漏、常見誤判排除。

---

## 一、敏感資訊洩漏

- [ ] 是否有 API 金鑰、密碼、Token、Secret 硬寫在程式碼中（🔴）
- [ ] 錯誤訊息是否洩漏內部架構、SQL 查詢、檔案路徑（🟠）
- [ ] `WP_DEBUG` 模式下才顯示的除錯資訊，是否在正式環境被條件性關閉（🟠）
- [ ] `error_log()`、`var_dump()`、`print_r()` 是否遺留在生產環境程式碼（🟡）
- [ ] REST API 錯誤回應是否洩漏過多內部資訊（🟡）

```php
// ❌ 硬寫 API 金鑰
$api_key = 'sk-1234567890abcdef';

// ✅ 從設定或環境變數讀取
$api_key = \get_option( 'my_plugin_api_key', '' );
// 或
$api_key = defined( 'MY_PLUGIN_API_KEY' ) ? MY_PLUGIN_API_KEY : '';
```

---

## 二、依賴套件安全

- [ ] `composer.json` 的依賴是否有已知 CVE（🔴）
- [ ] `package.json` 的 npm 依賴是否有安全漏洞（🟠）
- [ ] 是否使用過時的第三方函式庫（🟡）
- [ ] 是否有不必要的依賴增加攻擊面（🟡）

```bash
# 檢查 Composer 依賴漏洞
composer audit

# 檢查 npm 依賴漏洞
npm audit --audit-level=high
```

---

## 三、常見誤判（False Positives）

審查前先確認以下情況，**避免誤報**：

| 情況 | 判斷方式 |
|------|---------|
| `.env.example` 中的範例金鑰 | 確認是範本而非實際值 |
| 測試檔案中的測試帳號 | 確認僅存在於 test/ 目錄且有明確標記 |
| 公開 API Key（如 Google Maps） | 確認是設計上公開的 Key |
| `base64_encode()` 用於資料傳輸 | 非用於混淆代碼即為正常用途 |
| MD5 / SHA1 用於非密碼用途 | 用於 checksum、cache key 等為可接受用途 |
