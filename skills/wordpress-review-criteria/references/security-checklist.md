# 安全性審查 Checklist

對照 `/wordpress-coding-standards` 中的安全性規範，逐項檢查。

## 一、SQL 注入（🔴）

- [ ] 所有 SQL 查詢是否使用 `$wpdb->prepare()` 或 placeholder

```php
// ❌ 危險：SQL 注入漏洞
$results = $wpdb->get_results(
    "SELECT * FROM {$wpdb->posts} WHERE post_author = {$user_id}"
);

// ✅ 安全：使用 prepare()
$results = $wpdb->get_results(
    $wpdb->prepare(
        "SELECT * FROM {$wpdb->posts} WHERE post_author = %d",
        $user_id
    )
);
```

## 二、XSS 輸出（🔴）

- [ ] 輸出至 HTML 是否使用 `esc_html()`、`esc_attr()`、`esc_url()`、`wp_kses()`

```php
// ❌ 危險：直接輸出未處理的使用者資料
echo $_GET['message'];

// ✅ 安全：依據上下文使用對應的 escape 函式
echo \esc_html( $message );          // 一般文字
echo \esc_attr( $attribute );        // HTML 屬性
echo \esc_url( $url );               // URL
echo \wp_kses_post( $html_content ); // 允許部分 HTML 標籤
```

## 三、CSRF 保護（🔴）

- [ ] 表單提交是否包含 nonce（`wp_nonce_field` / `check_admin_referer` / `check_ajax_referer`）

```php
// ✅ 表單加入 nonce
\wp_nonce_field( 'my_plugin_save_settings', 'my_plugin_nonce' );

// ✅ 驗證 nonce
\check_admin_referer( 'my_plugin_save_settings', 'my_plugin_nonce' );

// ✅ AJAX nonce 驗證
\check_ajax_referer( 'my_plugin_ajax_nonce', 'nonce' );
```

## 四、能力檢查（🔴）

- [ ] 變更資料的操作是否有 `current_user_can()` 驗證

```php
// ✅ 操作前驗證能力
if ( ! \current_user_can( 'manage_options' ) ) {
    \wp_die( \__( '您沒有權限執行此操作', 'my-plugin' ) );
}
```

## 五、資料驗證（🔴）

- [ ] 使用者輸入是否先 `sanitize_*()` 再儲存

```php
// ✅ 儲存前清洗輸入
$title   = \sanitize_text_field( $_POST['title'] ?? '' );
$content = \wp_kses_post( $_POST['content'] ?? '' );
$id      = \absint( $_POST['id'] ?? 0 );
$email   = \sanitize_email( $_POST['email'] ?? '' );
$url     = \esc_url_raw( $_POST['url'] ?? '' );
```

## 六、直接存取防護（🟠）

- [ ] 非入口 PHP 檔案是否有 `defined('ABSPATH') || exit;`

```php
// ✅ 正確
<?php
defined( 'ABSPATH' ) || exit;
```

## 七、敏感資訊（🔴）

- [ ] 是否在前端或日誌中暴露 API 金鑰、密碼、Token

## 八、競爭條件（🟠）

- [ ] 並發操作是否使用原子查詢（TOCTOU、Cron 重疊、WooCommerce 庫存需 `WHERE stock >= qty`）

## 九、並發安全（🟠）

- [ ] `update_option` / `update_post_meta` 在高並發場景是否有覆蓋風險

## 十、LLM 信任邊界（🟠）

若專案使用 AI 功能：

- [ ] AI 生成值是否在寫入 DB 前驗證
- [ ] AI 生成值是否在顯示前 escape
