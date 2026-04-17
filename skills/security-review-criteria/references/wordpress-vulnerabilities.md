# WordPress 特有安全漏洞審查清單

針對 WordPress Plugin / Theme 架構下的特殊安全模式，包含 Nonce、能力檢查、檔案包含、WordPress 特有函式、競爭條件、LLM 信任邊界等。

---

## 一、CSRF 防護（Nonce）

- [ ] 所有後台表單是否包含 `wp_nonce_field()`（🔴）
- [ ] 所有 `admin-post.php` 處理器是否呼叫 `check_admin_referer()`（🔴）
- [ ] 所有 AJAX 處理器是否呼叫 `check_ajax_referer()`（🔴）
- [ ] REST API 路由是否依需求驗證 nonce（`X-WP-Nonce`）或改用 Application Passwords（🔴）
- [ ] Nonce action 字串是否足夠具體（避免使用過於通用的名稱）（🟡）

```php
// ❌ 缺少 nonce 驗證
add_action( 'wp_ajax_my_action', function () {
    $data = sanitize_text_field( $_POST['data'] );
    // 直接處理，任何已登入使用者都可觸發
} );

// ✅ 正確做法
add_action( 'wp_ajax_my_action', function () {
    \check_ajax_referer( 'my_plugin_ajax_nonce', 'nonce' );
    $data = \sanitize_text_field( $_POST['data'] ?? '' );
} );
```

---

## 二、能力檢查與存取控制

- [ ] 每個 AJAX handler、REST endpoint、admin action 是否有 `current_user_can()` 驗證（🔴）
- [ ] 能力（capability）是否足夠精確（不使用 `manage_options` 處理一般操作）（🟠）
- [ ] 資源存取是否驗證擁有者（避免水平權限提升，如使用者 A 存取 B 的資料）（🔴）
- [ ] `is_admin()` 是否被誤用於能力檢查（該函式只判斷頁面位置，不驗證權限）（🟠）

```php
// ❌ 誤用 is_admin()
if ( is_admin() ) {
    // 這不是能力檢查！前台 AJAX 也在 admin context 中執行
}

// ✅ 正確做法：能力 + 資源擁有者雙重驗證
if ( ! \current_user_can( 'edit_post', $post_id ) ) {
    \wp_die( \__( '您沒有權限執行此操作', 'my-plugin' ), 403 );
}
```

---

## 三、檔案系統安全

- [ ] 檔案路徑是否使用 `realpath()` 驗證並限制在允許的目錄內（路徑穿越防護）（🔴）
- [ ] 檔案上傳是否使用 `wp_handle_upload()` 並驗證 MIME Type（🔴）
- [ ] 是否有 `include`、`require` 使用使用者提供的路徑（🔴）
- [ ] 上傳目錄是否防止直接執行 PHP（`.htaccess` 或 Nginx 規則）（🟠）

```php
// ❌ 路徑穿越漏洞
$file = $_GET['file'];
include PLUGIN_DIR . '/templates/' . $file;

// ✅ 白名單驗證
$allowed = [ 'header', 'footer', 'sidebar' ];
$template = sanitize_key( $_GET['template'] ?? '' );

if ( ! in_array( $template, $allowed, true ) ) {
    wp_die( '無效的模板' );
}

include PLUGIN_DIR . '/templates/' . $template . '.php';
```

---

## 四、WordPress 特有安全模式

- [ ] 是否有 `eval()` 使用（🔴）
- [ ] 是否使用 `base64_decode()` 執行動態代碼（🔴）
- [ ] `add_shortcode` 的 callback 是否對使用者輸入做充分驗證（🟠）
- [ ] Cron job 是否有能力驗證（防止未授權觸發）（🟠）
- [ ] Multisite 環境：`switch_to_blog()` 後是否正確 `restore_current_blog()`（🟠）

---

## 五、競爭條件與並發安全

- [ ] TOCTOU（先讀再檢查再寫入）是否改用原子操作（`INSERT ... ON DUPLICATE KEY UPDATE` 或加鎖查詢）（🔴）
- [ ] WordPress Cron 是否防止重疊執行（使用 transient lock 確保單一實例）（🟠）
- [ ] WooCommerce 庫存扣減是否防止超賣（`WHERE stock >= quantity` 原子更新）（🔴）
- [ ] 並發 AJAX 是否可能同時修改共享狀態（`update_option` 覆蓋彼此結果）（🟠）
- [ ] 「查找或建立」模式是否有唯一約束保護（無 unique index 時並發可建立重複記錄）（🟠）

---

## 六、LLM 輸出信任邊界

- [ ] AI 生成的值寫入 DB 前是否經過格式驗證（`is_email()`、`esc_url_raw()`）（🔴）
- [ ] AI 生成的內容顯示於前端時是否 escape（`esc_html()`、`wp_kses_post()`）（🔴）
- [ ] AI 建議的 URL 或檔案路徑是否經過白名單或 `realpath()` 驗證（🔴）
- [ ] 使用者輸入流向 LLM Prompt 時是否防範 Prompt Injection（隔離系統指令與使用者輸入）（🟠）
- [ ] LLM 工具呼叫的輸出是否在執行前驗證型別與結構（🟠）
