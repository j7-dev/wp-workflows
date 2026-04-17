# 效能與 HPOS 審查 Checklist

## 一、資料存取

- [ ] WooCommerce 訂單是否使用物件方法（`$order->get_meta()`）而非 `get_post_meta()`（HPOS 相容）（🟠）
- [ ] **直接存取 `$wpdb`** 是否應改用 Repository 模式（🟡）
- [ ] 查詢是否有適當的快取（`wp_cache_get` / `transient`）（🟡）
- [ ] `WP_Query` 是否設定 `no_found_rows` 等效能參數（🟡）
- [ ] 迴圈中是否有 N+1 查詢問題（🟠）
- [ ] **條件式副作用**：分支邏輯是否有遺漏副作用（如某條件下促銷但未附加 URL，early return 跳過清理邏輯）（🟠）

### N+1 查詢修正範例

```php
// ❌ N+1 查詢：每次迴圈都發一次 meta 查詢
$posts = \get_posts( [ 'post_type' => 'product', 'numberposts' => 100 ] );
foreach ( $posts as $post ) {
    $price = \get_post_meta( $post->ID, '_price', true );  // N 次查詢
}

// ✅ 批次載入：一次查詢預熱快取
$posts = \get_posts( [ 'post_type' => 'product', 'numberposts' => 100 ] );
\update_meta_cache( 'post', wp_list_pluck( $posts, 'ID' ) );
foreach ( $posts as $post ) {
    $price = \get_post_meta( $post->ID, '_price', true );  // 從快取讀取
}
```

### WP_Query 效能參數

```php
// ✅ 設定效能參數
$query = new \WP_Query( [
    'post_type'              => 'product',
    'no_found_rows'          => true,   // 不計算總數
    'update_post_meta_cache' => false,  // 不需要 meta 時關閉
    'update_post_term_cache' => false,  // 不需要 term 時關閉
    'fields'                 => 'ids',  // 只取 ID
] );
```

---

## 二、WooCommerce 相容性

- [ ] 是否同時支援**傳統結帳**（`woocommerce_checkout_order_processed`）與**區塊結帳**（`woocommerce_store_api_checkout_order_processed`）（🟠）
- [ ] 是否宣告 HPOS 相容性（`FeaturesUtil::declare_compatibility`）（🟠）
- [ ] WooCommerce 物件（`WC_Order`、`WC_Product`）是否有型別提示（🟡）
- [ ] 是否使用 `wc_get_order()` 而非 `get_post()`（🟠）

### HPOS 相容訂單操作

```php
// ❌ HPOS 不相容：直接操作 postmeta
$order_total = \get_post_meta( $order_id, '_order_total', true );
\update_post_meta( $order_id, '_custom_field', $value );

// ✅ HPOS 相容：使用 WC_Order 物件方法
$order = \wc_get_order( $order_id );
$order_total = $order->get_total();
$order->update_meta_data( '_custom_field', $value );
$order->save();
```

### 宣告 HPOS 相容

```php
\add_action( 'before_woocommerce_init', function () {
    if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
            'custom_order_tables',
            __FILE__,
            true
        );
    }
} );
```

### 同時支援兩種結帳流程

```php
// 傳統結帳
\add_action( 'woocommerce_checkout_order_processed', [ $this, 'on_order_created' ], 10, 3 );

// 區塊結帳（WooCommerce Blocks / Store API）
\add_action( 'woocommerce_store_api_checkout_order_processed', [ $this, 'on_order_created_block' ], 10, 1 );
```

---

## 三、資源載入與排程

- [ ] 是否在 `admin_enqueue_scripts` 的正確頁面才載入資源（🟠）
- [ ] 是否避免在每次頁面載入時執行昂貴的計算或查詢（🟠）
- [ ] 大量資料處理是否考慮分批（batch）處理（🟡）
- [ ] 是否適當使用 `wp_schedule_event` 處理背景任務（🟡）

### 條件式載入資源

```php
// ✅ 只在特定頁面載入
\add_action( 'admin_enqueue_scripts', function ( $hook ) {
    if ( 'toplevel_page_my-plugin' !== $hook ) {
        return;
    }
    \wp_enqueue_script( 'my-plugin-admin', ... );
} );
```
