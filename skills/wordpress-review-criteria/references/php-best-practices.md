# PHP 8.1+ 最佳實踐審查 Checklist

## 一、PHP 8.1+ 型別安全

- [ ] **`declare(strict_types=1)`** 是否在每個 PHP 檔案開頭宣告（🟠）
- [ ] 方法參數與回傳值是否完整標註型別（🟠）
- [ ] 是否使用 union types、nullable types（`?Type`）正確表達型別（🟡）
- [ ] 有限狀態值是否改用 PHP 8.1 原生 `enum`，**禁止魔術字串**（🟠）
- [ ] `readonly` 屬性是否正確應用於不可變資料（🟡）
- [ ] 是否使用 `match` 表達式取代複雜 `switch`（🟡）

### enum 範例

```php
// ❌ 魔術字串
if ( $status === 'active' ) { /* ... */ }

// ✅ PHP 8.1 Enum
enum StatusEnum: string {
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';
    case PENDING = 'pending';

    public function label(): string {
        return match ( $this ) {
            self::ACTIVE   => \__( '啟用', 'my-plugin' ),
            self::INACTIVE => \__( '停用', 'my-plugin' ),
            self::PENDING  => \__( '待審核', 'my-plugin' ),
        };
    }
}

if ( $status === StatusEnum::ACTIVE ) { /* ... */ }
```

### readonly 屬性

```php
// ✅ 不可變 DTO
class ProductDTO {
    public function __construct(
        public readonly int $product_id,
        public readonly string $name,
        public readonly int $price,
    ) {}
}
```

---

## 二、PHPDoc 與命名規範

- [ ] 所有類別、方法是否有 **PHPDoc 繁體中文**說明（🟡）
- [ ] `@param`、`@return`、`@throws` 標籤是否完整標註（🟠）
- [ ] **Class**：是否使用 `CamelCase`（如 `ProductService`）（🟡）
- [ ] **Method / 函式**：是否使用 `snake_case`（如 `get_product`）（🟡）
- [ ] **變數**：是否使用 `snake_case`（如 `$product_id`）（🟡）
- [ ] **常數 / Enum Case**：是否使用 `UPPER_SNAKE_CASE`（如 `DAY_IN_SECONDS`）（🟡）
- [ ] **全域函式**：在命名空間下是否加上反斜線 `\`（如 `\get_post()`、`\add_action()`）（🟠）

### PHPDoc 範例

```php
/**
 * 根據 ID 取得商品詳細資料
 *
 * @param int $product_id 商品 ID
 *
 * @return ProductDTO 商品資料
 * @throws \RuntimeException 當商品不存在時拋出異常
 */
public function get_product( int $product_id ): ProductDTO {
    $post = \get_post( $product_id );

    if ( ! $post instanceof \WP_Post ) {
        throw new \RuntimeException( "商品 ID {$product_id} 不存在" );
    }

    return ProductDTO::from_post( $post );
}
```

### 全域函式反斜線

```php
// ✅ 正確
$result = \get_posts( [ 'post_type' => 'post' ] );
\add_action( 'init', [ __CLASS__, 'init' ] );

// ❌ 錯誤
$result = get_posts( [ 'post_type' => 'post' ] );
add_action( 'init', [ __CLASS__, 'init' ] );
```

---

## 三、架構與設計原則

- [ ] 是否使用 **DTO** 封裝資料，避免直接操作裸 `array`（🟠）
- [ ] 是否遵循 **SRP**（單一職責），一個類別不超過一個職責（🟠）
- [ ] 是否依賴 **Interface** 而非具體實作（DIP 原則）（🟡）
- [ ] 是否使用 **heredoc** 輸出多行 HTML，禁止 `.` 字串拼接（🟠）
- [ ] 字串插值是否優先使用雙引號 `"` 或 `sprintf`，避免 `.` 拼接（🟡）
- [ ] 陣列是否使用短語法 `[]`，禁止 `array()`（🟡）

### Heredoc 輸出 HTML

```php
// ✅ 正確
function render_notice( string $message, string $type ): string {
    return <<<HTML
    <div class="notice notice-{$type}">
        <p>{$message}</p>
    </div>
    HTML;
}

// ❌ 錯誤：字串拼接
function render_notice( string $message, string $type ): string {
    return '<div class="notice notice-' . $type . '">'
         . '<p>' . $message . '</p>'
         . '</div>';
}
```

### 字串插值

```php
// ✅ 優先使用雙引號插值
$text = "這是 {$variable} 的文字";

// ✅ 其次使用 sprintf
$text = \sprintf( '這是 %1$s 的文字 %2$s', $variable1, $variable2 );

// ❌ 避免使用 . 拼接
$text = '這是 ' . $variable . ' 的文字';

// ✅ 短語法陣列
$items = [ 'a', 'b', 'c' ];

// ❌ 避免 array()
$items = array( 'a', 'b', 'c' );
```

---

## 四、程式碼異味

- [ ] 函式是否過長（> 50 行建議拆分）（🟡）
- [ ] 巢狀深度是否過深（> 4 層改用 early return）（🟠）
- [ ] 是否有 magic number / magic string（改用命名常數或 enum）（🟡）
- [ ] 是否有重複程式碼（DRY 原則）（🟡）
- [ ] 是否有直接操作 postmeta 而非使用 WooCommerce / CPT 物件方法（🟠）
- [ ] **生產環境**是否有未清除的 `error_log`、`var_dump`、`print_r`（🟡）
- [ ] 是否有未使用的死碼、被注解掉的程式碼（🟡）

### Early Return 降低巢狀

```php
// ❌ 過深巢狀
public function process( $data ) {
    if ( $data ) {
        if ( \is_array( $data ) ) {
            if ( ! empty( $data['id'] ) ) {
                if ( \current_user_can( 'edit_posts' ) ) {
                    // 核心邏輯
                }
            }
        }
    }
}

// ✅ Early return
public function process( $data ) {
    if ( ! $data || ! \is_array( $data ) ) {
        return;
    }

    if ( empty( $data['id'] ) ) {
        return;
    }

    if ( ! \current_user_can( 'edit_posts' ) ) {
        return;
    }

    // 核心邏輯
}
```
