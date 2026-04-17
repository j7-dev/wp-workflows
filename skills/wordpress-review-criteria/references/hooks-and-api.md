# Hook 系統與 REST API 審查 Checklist

## 一、WordPress Hook 系統

- [ ] Hook callback 優先順序（priority）是否合理且有說明（🟡）
- [ ] 是否有未使用的 `add_action` / `add_filter`（🟡）
- [ ] `remove_action` / `remove_filter` 的優先順序是否與註冊時一致（🟠）
- [ ] `apply_filters` 的 hook 名稱是否遵循 `{plugin_prefix}_{context}` 命名慣例（🟡）
- [ ] 公開 API 是否提供 `do_action` / `apply_filters` 擴展點（🟡）
- [ ] hook 是否在正確時機點（如 `plugins_loaded`、`init`、`admin_init`）呼叫（🟠）

### Hook 命名範例

```php
// ✅ 正確：遵循 {plugin_prefix}_{context} 命名
\do_action( 'my_plugin_before_save', $data );
\apply_filters( 'my_plugin_product_price', $price, $product_id );

// ❌ 錯誤：命名空間不清楚
\do_action( 'before_save', $data );
\apply_filters( 'price', $price );
```

### 正確時機點範例

```php
// ✅ 在 plugins_loaded 執行國際化
\add_action( 'plugins_loaded', [ $this, 'load_textdomain' ] );

// ✅ 在 init 註冊 CPT
\add_action( 'init', [ $this, 'register_post_type' ] );

// ✅ 在 admin_init 註冊設定
\add_action( 'admin_init', [ $this, 'register_settings' ] );
```

---

## 二、REST API 審查

- [ ] REST 路由是否有 `permission_callback` 檢查權限（🔴）
- [ ] `register_rest_route` 的 `args` 是否定義 `sanitize_callback` 與 `validate_callback`（🟠）
- [ ] REST 回應是否使用 `WP_REST_Response` 或 `WP_Error`（🟡）
- [ ] API namespace 是否遵循 `{plugin-slug}/v{N}` 格式（🟡）

### permission_callback 範例

```php
// ❌ 危險：永遠允許
\register_rest_route( 'my-plugin/v1', '/items', [
    'methods'             => 'POST',
    'callback'            => [ $this, 'create_item' ],
    'permission_callback' => '__return_true',  // 危險！
] );

// ✅ 安全：驗證能力
\register_rest_route( 'my-plugin/v1', '/items', [
    'methods'             => 'POST',
    'callback'            => [ $this, 'create_item' ],
    'permission_callback' => function () {
        return \current_user_can( 'edit_posts' );
    },
    'args' => [
        'title' => [
            'required'          => true,
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'validate_callback' => function ( $value ) {
                return strlen( $value ) > 0;
            },
        ],
    ],
] );
```

### WP_REST_Response / WP_Error

```php
// ✅ 成功回應
return new \WP_REST_Response( $data, 200 );

// ✅ 錯誤回應
return new \WP_Error(
    'rest_not_found',
    \__( '找不到資源', 'my-plugin' ),
    [ 'status' => 404 ]
);
```
