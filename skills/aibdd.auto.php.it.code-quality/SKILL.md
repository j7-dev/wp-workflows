---
name: aibdd.auto.php.it.code-quality
description: >
  PHP WordPress 整合測試程式碼品質規範。涵蓋 SOLID、Test Class 組織、
  IntegrationTestCase 基類規範、Meta 清理、WordPress 特有安全實踐、3 層架構、程式碼品質。
  由 /aibdd.auto.php.it.refactor 載入作為重構依據。非 user-invocable。
---

# PHP IT Code Quality 規範

本 skill 定義 PHP WordPress 整合測試與生產程式碼的品質標準，作為 `/aibdd.auto.php.it.refactor` 的重構依據。

---

## 1. SOLID 設計原則

### S - 單一職責 (Single Responsibility)

一個 class 只做一件事。將 Service、Repository、NotificationService 分離。

```php
// ❌ 錯誤：一個 class 混合多種職責
class LessonService
{
    public function updateProgress(int $userId, int $lessonId, int $progress): void
    {
        // 直接操作 DB
        global $wpdb;
        $wpdb->update('lesson_progress', ...);

        // 直接寄 email
        wp_mail($email, '進度更新', '...');

        // 計算業務規則
        if ($progress >= 100) { ... }
    }
}

// ✅ 正確：職責分離
class LessonService
{
    public function __construct(
        private LessonProgressRepository $repo,
        private NotificationService $notifier
    ) {}

    public function updateProgress(int $userId, int $lessonId, int $progress): void
    {
        $this->validateProgress($progress);
        $this->repo->save($userId, $lessonId, $progress);
        if ($progress >= self::COMPLETION_THRESHOLD) {
            $this->notifier->notifyCompletion($userId, $lessonId);
        }
    }
}
```

### O - 開放封閉 (Open/Closed)

透過 interface 與 strategy pattern 擴展，不修改既有程式碼。

```php
interface PaymentGatewayInterface
{
    public function charge(int $amount, string $currency): PaymentResult;
}

class StripeGateway implements PaymentGatewayInterface { /* ... */ }
class PaypalGateway implements PaymentGatewayInterface { /* ... */ }

class OrderService
{
    public function __construct(private PaymentGatewayInterface $gateway) {}
}
```

### L - 里氏替換 (Liskov Substitution)

子類別必須能完全替換父類別，不破壞契約。

### I - 介面隔離 (Interface Segregation)

小而專一的 interface，優於肥大的 interface。

```php
// ✅ 正確
interface ReadableRepository { public function find(int $id); }
interface WritableRepository { public function save($entity): void; }

class LessonRepository implements ReadableRepository, WritableRepository { /* ... */ }
```

### D - 依賴反轉 (Dependency Inversion)

高層模組不依賴低層模組，皆依賴抽象。Service 以 constructor 注入 Repository。

```php
class LessonService
{
    public function __construct(
        private LessonProgressRepositoryInterface $progressRepo,
        private LessonRepositoryInterface $lessonRepo,
    ) {}
}
```

---

## 2. Test Class 組織規範

### 目錄結構

```
tests/integration/
├── IntegrationTestCase.php        # 基類
├── Lesson/
│   ├── UpdateVideoProgressTest.php
│   └── CompleteLessonTest.php
├── Order/
│   ├── CreateOrderTest.php
│   └── RefundOrderTest.php
├── Product/
│   └── ListProductsTest.php
└── Helpers/
    └── StatusMapper.php
```

### 命名規範

| 元件 | 風格 | 範例 |
|------|------|------|
| Test Class | PascalCase + `Test` 後綴 | `UpdateVideoProgressTest` |
| Test Method | `test_` 前綴 + snake_case/中文 | `test_成功增加影片進度` |
| Subdomain 目錄 | PascalCase | `Lesson/`, `Order/` |
| Helper Class | PascalCase | `StatusMapper` |

### 對應關係

- 一個 `.feature` 檔 → 一個 Test Class
- 一個 `Scenario` / `Example` → 一個 `test_*` method
- Gherkin 步驟 → `// Given / // When / // Then` 註解

---

## 3. IntegrationTestCase 基類規範

所有整合測試皆繼承此基類。**禁止**各 Test class 自行實作 set_up / tear_down 基礎邏輯。

```php
<?php

declare(strict_types=1);

namespace Tests\Integration;

abstract class IntegrationTestCase extends \Yoast\WPTestUtils\WPIntegration\TestCase
{
    protected ?\Throwable $lastError = null;
    protected mixed $queryResult = null;
    protected array $ids = [];
    protected object $repos;
    protected object $services;

    abstract protected function configure_dependencies(): void;

    public function set_up(): void
    {
        parent::set_up();
        $this->lastError = null;
        $this->queryResult = null;
        $this->ids = [];
        $this->repos = new \stdClass();
        $this->services = new \stdClass();
        $this->configure_dependencies();
    }

    protected function assert_operation_succeeded(): void
    {
        $this->assertNull(
            $this->lastError,
            '預期操作成功，但發生錯誤: ' . ($this->lastError?->getMessage() ?? '')
        );
    }

    protected function assert_operation_failed(): void
    {
        $this->assertNotNull($this->lastError, '預期操作失敗，但成功執行');
    }

    protected function assert_operation_failed_with_type(string $type): void
    {
        $this->assert_operation_failed();
        $this->assertInstanceOf($type, $this->lastError);
    }

    protected function assert_operation_failed_with_message(string $msg): void
    {
        $this->assert_operation_failed();
        $this->assertStringContainsString($msg, $this->lastError->getMessage());
    }
}
```

### 使用規則

- `$this->ids` 儲存 Gherkin 中的人/物識別（如 `$this->ids['Alice'] = 123`）
- `$this->repos` 與 `$this->services` 為依賴容器
- `configure_dependencies()` 僅做 DI wiring，不做資料準備
- 借 WP 自動 rollback（transactional tests），**不要**手動 `TRUNCATE`

---

## 4. Meta 註記清理

重構階段（Phase A）**必須刪除**：

- `// TODO: ...`
- `// [Handler: aggregate-given]` 等 Handler 標註
- `// 參考 /aibdd.auto.php.it.handlers.xxx` 連結提示
- `$this->markTestIncomplete(...)` 佔位呼叫

**必須保留**：

- `// Given / // When / // Then` 業務語意註解
- PHPDoc (`@test`, `@testdox`, `@dataProvider`, `@group`)
- 必要的業務邏輯說明註解

---

## 5. WordPress 特有品質規範（重點）

### 5.1 SQL Injection 防護

所有 `$wpdb` 查詢**必須**使用 `prepare()`。

```php
global $wpdb;

// ❌ 錯誤：直接字串插值
$row = $wpdb->get_row("SELECT * FROM {$table} WHERE id = $id");

// ✅ 正確：使用 prepare + placeholder
$row = $wpdb->get_row(
    $wpdb->prepare("SELECT * FROM {$table} WHERE id = %d", $id)
);

// ✅ 多參數
$wpdb->prepare(
    "SELECT * FROM {$table} WHERE user_id = %d AND status = %s",
    $userId,
    $status
);
```

Placeholder 速查：`%d` 整數、`%f` 浮點、`%s` 字串、`%i` 識別符（欄位名）。

### 5.2 輸入清理（Sanitization）

| 情境 | 函數 |
|------|------|
| 一般文字輸入 | `sanitize_text_field()` |
| 整數 ID | `absint()` |
| Email | `sanitize_email()` |
| URL | `esc_url_raw()` |
| HTML 內容（受限標籤） | `wp_kses_post()` |
| 檔名 | `sanitize_file_name()` |

### 5.3 輸出跳脫（Escaping）

| 情境 | 函數 |
|------|------|
| HTML 內文 | `esc_html()` |
| HTML 屬性 | `esc_attr()` |
| URL 輸出 | `esc_url()` |
| JavaScript 內嵌 | `esc_js()` |
| 允許部分 HTML | `wp_kses()` |

### 5.4 Nonce 驗證

```php
// 表單端
wp_nonce_field('myplugin_update_lesson', '_myplugin_nonce');

// 處理端
if (!wp_verify_nonce($_POST['_myplugin_nonce'] ?? '', 'myplugin_update_lesson')) {
    wp_die('Security check failed');
}

// Admin page
check_admin_referer('myplugin_update_lesson');
```

### 5.5 權限檢查

任何寫入/刪除/敏感動作前，**必須**檢查：

```php
if (!current_user_can('edit_lesson', $lessonId)) {
    throw new PermissionDeniedException('無權編輯此課程');
}
```

### 5.6 WPCS 命名慣例

| 元件 | 慣例 | 範例 |
|------|------|------|
| Plugin 全域函數 | `{prefix}_{action}` | `myplugin_update_lesson()` |
| Class（傳統） | `{Prefix}_{Name}` | `MyPlugin_LessonService` |
| Class（PSR-4 推薦） | Namespace | `App\Services\LessonService` |
| Hook 名稱 | `{prefix}_{event}` | `myplugin_lesson_updated` |
| Option key | `{prefix}_{name}` | `myplugin_settings` |
| DB table 前綴 | `{$wpdb->prefix}{plugin}_{name}` | `wp_myplugin_lessons` |

---

## 6. 3 層架構

```
src/
├── Models/              # Plain PHP objects（不依賴 WordPress）
│   └── LessonProgress.php
├── Repositories/        # WordPress DB 抽象層
│   └── LessonProgressRepository.php
├── Services/            # 業務邏輯層
│   └── LessonService.php
└── Exceptions/          # 自訂例外
    ├── InvalidStateException.php
    └── NotFoundException.php
```

### 各層職責

| 層 | 職責 | 允許使用 | 禁止 |
|----|------|---------|------|
| Models | 資料容器 + 純行為 | PHP 標準庫 | WordPress 全域函數、`$wpdb` |
| Repositories | DB / WP API 封裝 | `$wpdb`、WP function | 業務規則、拋業務例外 |
| Services | 業務規則、協調 Repo | Repositories、Models | `$wpdb` 直接呼叫 |
| Exceptions | 業務錯誤訊息 | - | 包含邏輯 |

### 違規範例

```php
// ❌ Service 直接操作 $wpdb
class LessonService
{
    public function update(int $id): void
    {
        global $wpdb;
        $wpdb->update(...); // 應透過 Repository
    }
}

// ❌ Model 依賴 WordPress
class LessonProgress
{
    public function save(): void
    {
        update_post_meta(...); // Model 不該知道 WP
    }
}

// ❌ Repository 含業務邏輯
class LessonProgressRepository
{
    public function save($progress): void
    {
        if ($progress->value < 0) {
            throw new InvalidStateException(...); // 應在 Service
        }
    }
}
```

---

## 7. 程式碼品質

### 7.1 Early Return / Guard Clause

```php
// ❌ 深層巢狀
public function updateProgress(int $userId, int $lessonId, int $progress): void
{
    if ($this->userExists($userId)) {
        if ($this->lessonExists($lessonId)) {
            if ($progress >= 0 && $progress <= 100) {
                // 實際邏輯
            }
        }
    }
}

// ✅ Early Return
public function updateProgress(int $userId, int $lessonId, int $progress): void
{
    if (!$this->userExists($userId)) {
        throw new NotFoundException('用戶不存在');
    }
    if (!$this->lessonExists($lessonId)) {
        throw new NotFoundException('課程不存在');
    }
    if ($progress < 0 || $progress > 100) {
        throw new InvalidStateException('進度必須在 0-100 之間');
    }

    // 實際邏輯
}
```

### 7.2 Class Constants

```php
class LessonService
{
    private const COMPLETION_THRESHOLD = 100;
    private const STATUS_MAPPING = [
        'not_started' => '未開始',
        'in_progress' => '進行中',
        'completed'   => '已完成',
    ];
}
```

### 7.3 Nullable / Optional 處理

```php
// ✅ 明確 nullable 型別
public function find(int $id): ?LessonProgress
{
    // ...
}

// ✅ 呼叫端 null coalescing throw (PHP 8+)
$progress = $this->repo->find($id)
    ?? throw new NotFoundException("進度 {$id} 不存在");
```

### 7.4 DRY 原則

三次以上重複才抽取共用方法。**勿過早抽象**。

### 7.5 命名表達意圖

| ❌ 模糊 | ✅ 清晰 |
|---------|---------|
| `process($data)` | `updateVideoProgress(int $userId, int $lessonId, int $progress)` |
| `handle()` | `refundOrder()` |
| `$d` | `$lessonId` |
| `$flag` | `$isCompleted` |

### 7.6 布林方法命名

以 `is`, `has`, `can`, `should` 開頭：

```php
public function isCompleted(): bool
public function hasPermission(int $userId): bool
public function canEdit(User $user): bool
public function shouldNotify(): bool
```

---

## 8. 檢查清單

重構完成前逐項確認：

### 結構
- [ ] 無 `// TODO:` 殘留
- [ ] 無 `// [Handler: xxx]` 標註
- [ ] 所有檔頭有 `declare(strict_types=1);`
- [ ] 所有 class 置於正確 namespace

### 型別
- [ ] 所有方法參數有型別宣告
- [ ] 所有方法有回傳型別
- [ ] Nullable 型別使用 `?Type` 明確標註

### SOLID
- [ ] 每個 class 單一職責
- [ ] Service 透過 constructor 注入 Repository
- [ ] 無跨層違規（Service 直接用 $wpdb 等）

### WordPress 安全
- [ ] 所有 $wpdb 查詢使用 `prepare()`
- [ ] 輸入經 sanitize_*
- [ ] 輸出經 esc_*
- [ ] 敏感動作前檢查 nonce + capability

### 品質
- [ ] Early Return 取代深層 if 巢狀
- [ ] Magic number 已抽為 constants
- [ ] 方法命名表達意圖
- [ ] 布林方法以 is/has/can 開頭

### 測試
- [ ] Phase A 後所有測試仍全綠
- [ ] Phase B 後所有測試仍全綠
- [ ] 無新增跳過的測試
