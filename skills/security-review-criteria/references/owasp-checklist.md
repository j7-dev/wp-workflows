# OWASP Top 10 對應審查清單

WordPress Plugin 中對應 OWASP 常見風險的審查維度，著重 A03（Injection）、A01（Broken Access Control）、A07（Identification & Authentication Failures）、A10（SSRF）。

---

## 一、輸入驗證與資料清洗（A03: Injection / A04: Insecure Design）

- [ ] **所有使用者輸入**（`$_GET`、`$_POST`、`$_REQUEST`、`$_COOKIE`、REST body）是否在使用前清洗（🔴）
- [ ] `sanitize_text_field()`、`absint()`、`sanitize_email()` 等是否依據資料類型選用正確函式（🔴）
- [ ] 是否有直接將 `$_SERVER['HTTP_HOST']`、`$_SERVER['REQUEST_URI']` 等輸出至 HTML（🔴）
- [ ] 上傳檔案是否驗證 MIME Type 與副檔名（禁止信任 `$_FILES['type']`）（🔴）
- [ ] 是否有未驗證的序列化資料（`unserialize()` 搭配使用者輸入）（🔴）

---

## 二、SQL 注入（A03: Injection）

- [ ] 所有 `$wpdb->query()`、`$wpdb->get_results()` 是否使用 `$wpdb->prepare()`（🔴）
- [ ] `prepare()` 的 placeholder 是否使用正確（`%d`、`%s`、`%f`，禁止字串拼接）（🔴）
- [ ] `IN ()` 子句是否使用 `implode()` + `prepare()` 正確處理（🔴）
- [ ] 表格名稱、欄位名稱是否未經 `$wpdb->prefix` 或白名單驗證就直接拼接（🔴）

```php
// ❌ 嚴重漏洞：SQL 注入
$id = $_GET['id'];
$wpdb->get_results( "SELECT * FROM {$wpdb->posts} WHERE ID = $id" );

// ✅ 安全做法
$id = absint( $_GET['id'] ?? 0 );
$wpdb->get_results(
    $wpdb->prepare( "SELECT * FROM {$wpdb->posts} WHERE ID = %d", $id )
);
```

---

## 三、XSS 跨站腳本（A03: Injection）

- [ ] 所有輸出至 HTML 的資料是否使用適當的 escape 函式（🔴）
- [ ] `echo`、`print` 是否直接輸出未處理的使用者資料（🔴）
- [ ] JavaScript 變數是否使用 `wp_json_encode()` 輸出（🔴）
- [ ] 允許 HTML 的欄位是否使用 `wp_kses()` 或 `wp_kses_post()` 過濾（🔴）

```php
// escape 函式選用對照
echo \esc_html( $title );           // 純文字輸出
echo \esc_attr( $class );           // HTML 屬性值
echo \esc_url( $link );             // URL（href、src）
echo \esc_js( $string );            // inline JS 字串（少用，prefer wp_json_encode）
echo \wp_json_encode( $data );      // JS 變數物件
echo \wp_kses_post( $content );     // 允許部分 HTML 標籤
```

---

## 四、遠端請求 SSRF（A10: Server-Side Request Forgery）

- [ ] 是否使用使用者提供的 URL 進行 `wp_remote_get()` 或 `wp_remote_post()`（🔴）
- [ ] 外部 URL 是否有白名單或 domain 驗證（🔴）
- [ ] 是否允許請求到 `localhost`、`127.0.0.1`、內網 IP（🔴）

```php
// ✅ 驗證外部 URL 不指向內網
$url = esc_url_raw( $_POST['webhook_url'] ?? '' );
$parsed = parse_url( $url );

$blocked_hosts = [ 'localhost', '127.0.0.1', '::1' ];
if ( in_array( $parsed['host'] ?? '', $blocked_hosts, true ) ) {
    wp_die( '不允許的 URL' );
}
```

---

## 五、REST API 安全（A01: Broken Access Control）

- [ ] `permission_callback` 是否明確定義（禁止 `'__return_true'` 用於敏感路由）（🔴）
- [ ] `args` 是否定義 `sanitize_callback` 與 `validate_callback`（🟠）
- [ ] 是否有未認證的端點可存取或修改私人資料（🔴）
- [ ] REST 端點是否有適當的速率限制考量（🟡）

```php
// ❌ 危險：任何人都可存取
\register_rest_route( 'my-plugin/v1', '/secret-data', [
    'methods'             => 'GET',
    'callback'            => [ $this, 'get_secret_data' ],
    'permission_callback' => '__return_true',
] );

// ✅ 正確：驗證能力
\register_rest_route( 'my-plugin/v1', '/secret-data', [
    'methods'             => 'GET',
    'callback'            => [ $this, 'get_secret_data' ],
    'permission_callback' => fn() => \current_user_can( 'manage_options' ),
] );
```
