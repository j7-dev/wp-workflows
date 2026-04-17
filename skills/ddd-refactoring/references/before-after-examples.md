# DDD Before / After Examples

PHP 重構前後對照 + 目標架構。診斷與規劃時參考「目標架構」,執行時參考對應 pattern 的前後對照。

## 目標架構

```
inc/src/
├── Application/              # 應用層:用例編排
│   └── Services/             #   應用服務(呼叫 Domain 完成用例)
├── Domain/                   # 領域層:核心業務邏輯(零外部依賴)
│   ├── {BoundedContext}/     #   限界上下文
│   │   ├── DTOs/             #     資料傳輸物件
│   │   ├── Entities/         #     實體(含業務邏輯)
│   │   ├── Enums/            #     枚舉
│   │   ├── Events/           #     領域事件
│   │   ├── Repositories/     #     Repository 介面
│   │   └── ValueObjects/     #     值物件
│   └── Shared/               #   跨 Context 共享
├── Infrastructure/           # 基礎設施層:外部依賴實作
│   ├── Hooks/                #   WordPress Hook 註冊
│   ├── Repositories/         #   Repository 實作($wpdb、WP API)
│   ├── REST/                 #   REST API Controller
│   └── ExternalServices/     #   第三方 API
└── Shared/                   # 跨層工具
```

**依賴方向**:Infrastructure → Application → Domain(Domain 層不依賴任何外部)

---

## 策略 A:提取 DTO 範例

### Before

```php
class OrderController {
    public function create_order( array $data ) {
        $this->validate( $data );
        $order_id = $this->wpdb->insert( 'orders', [
            'customer_email' => $data['email'],
            'amount'         => $data['amount'],
            'currency'       => $data['currency'] ?? 'USD',
        ] );
        do_action( 'order_created', $data );
        return $order_id;
    }
}
```

### After

```php
// Domain/Order/DTOs/CreateOrderDTO.php
final class CreateOrderDTO {
    public function __construct(
        public readonly string $customer_email,
        public readonly int    $amount,
        public readonly string $currency = 'USD',
    ) {}

    public static function from_array( array $data ): self {
        return new self(
            customer_email: $data['email'],
            amount:         (int) $data['amount'],
            currency:       $data['currency'] ?? 'USD',
        );
    }
}

// Infrastructure/REST/OrderController.php
class OrderController {
    public function create_order( array $data ) {
        $dto = CreateOrderDTO::from_array( $data );
        return $this->service->create( $dto );
    }
}
```

---

## 策略 B:提取 Enum 範例

### Before

```php
if ( $order->status === 'pending' ) {
    // ...
} elseif ( $order->status === 'paid' ) {
    // ...
}
```

### After

```php
// Domain/Order/Enums/OrderStatus.php
enum OrderStatus: string {
    case Pending   = 'pending';
    case Paid      = 'paid';
    case Cancelled = 'cancelled';
}

// usage
match ( $order->status ) {
    OrderStatus::Pending => /* ... */,
    OrderStatus::Paid    => /* ... */,
};
```

---

## 策略 D:提取 Repository 範例

### Before(散落的 $wpdb)

```php
// OrderController
$results = $wpdb->get_results( $wpdb->prepare(
    "SELECT * FROM {$wpdb->prefix}orders WHERE customer_id = %d",
    $customer_id
) );

// AdminPage(重複)
$orders = $wpdb->get_results( $wpdb->prepare(
    "SELECT * FROM {$wpdb->prefix}orders WHERE customer_id = %d",
    $customer_id
) );
```

### After

```php
// Domain/Order/Repositories/OrderRepositoryInterface.php
interface OrderRepositoryInterface {
    /** @return Order[] */
    public function find_by_customer( int $customer_id ): array;
}

// Infrastructure/Repositories/OrderRepository.php
final class OrderRepository implements OrderRepositoryInterface {
    public function find_by_customer( int $customer_id ): array {
        global $wpdb;
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}orders WHERE customer_id = %d",
            $customer_id
        ) );
        return array_map( [ Order::class, 'from_row' ], $rows );
    }
}

// usage 處只剩
$orders = $this->order_repo->find_by_customer( $customer_id );
```

---

## 策略 E:建立 Entity 範例

### Before

```php
// 多處散落的 status 判斷
if ( $order['status'] === 'paid' && $order['amount'] > 0 ) {
    $order['refundable_until'] = strtotime( '+7 days', $order['paid_at'] );
}
```

### After

```php
// Domain/Order/Entities/Order.php
final class Order {
    public function __construct(
        public readonly int         $id,
        private OrderStatus         $status,
        private int                 $amount,
        private ?DateTimeImmutable  $paid_at,
    ) {}

    public function is_refundable( DateTimeImmutable $now ): bool {
        if ( $this->status !== OrderStatus::Paid )        return false;
        if ( $this->amount <= 0 )                          return false;
        if ( $this->paid_at === null )                     return false;
        return $now < $this->paid_at->modify( '+7 days' );
    }
}

// usage
if ( $order->is_refundable( new DateTimeImmutable() ) ) { /* ... */ }
```

業務規則集中、可測試、意圖清楚。

---

## 參考

- Code Smell → `code-smell-catalog.md`
- Pattern 詳細步驟 → `refactoring-patterns.md`
- 順序策略 → `refactoring-sequence.md`
