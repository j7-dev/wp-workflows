---
name: aibdd.auto.php.it.code-quality
description: PHP Integration Test 程式碼品質規範合集。包含 SOLID 設計原則、Test Class 組織規範、Meta 註記清理、WordPress 特定品質規範、程式架構、程式碼品質等規範。供 refactor 階段嚴格遵守。
user-invocable: false
---

# SOLID 設計原則

## S - Single Responsibility Principle（單一職責原則）

```php
// ❌ Service 做太多事
class AssignmentService {
    public function submit(string $userId, string $content): void {
        if (!$this->checkPermission($userId)) throw new \UnauthorizedError();
        if (strlen($content) < 10) throw new \InvalidArgumentException();
        $this->repo->save(new Assignment($userId, $content));
        $this->sendEmail($userId);
    }
}

// ✅ 職責分離
class AssignmentService {
    public function __construct(
        private readonly AssignmentRepository $assignmentRepo,
        private readonly PermissionValidator $permissionValidator,
        private readonly NotificationService $notificationService,
    ) {}

    public function submit(string $userId, string $content): void {
        $this->permissionValidator->validate($userId);
        $this->assignmentRepo->save(new Assignment($userId, $content));
        $this->notificationService->notify($userId);
    }
}
```

## D - Dependency Inversion Principle（依賴反轉原則）

```php
// ✅ Service 透過建構子注入 Repository
class LessonService {
    public function __construct(
        private readonly LessonProgressRepository $lessonProgressRepo,
    ) {}

    public function updateProgress(string $userId, int $lessonId, int $progress): void {
        $current = $this->lessonProgressRepo->find($userId, $lessonId);
        // 業務邏輯...
    }
}
```

---

## 檢查清單
- [ ] 每個類別/方法只負責一件事
- [ ] Service 透過建構子注入 Repository
- [ ] 高層模組不直接依賴低層模組

---

# Test Class 組織規範

## 組織原則

- 使用 PHPUnit Test Class 組織
- 按 Subdomain 和功能模組組織
- IntegrationTestCase 作為共用基礎類別

## 目錄結構

```
tests/
├── bootstrap.php                    # WP 測試引導
├── integration/
│   ├── IntegrationTestCase.php      # 共用基礎類別
│   ├── Lesson/                      # {Subdomain}
│   │   └── LessonProgressTest.php   # 一個 Feature 一個 Test class
│   └── Order/
│       └── OrderCreationTest.php
phpunit.xml.dist
.wp-env.json
```

## IntegrationTestCase 基礎類別

```php
abstract class IntegrationTestCase extends \Yoast\WPTestUtils\WPIntegration\TestCase
{
    protected ?\Throwable $lastError = null;
    protected mixed $queryResult = null;
    protected array $ids = [];
    protected object $repos;
    protected object $services;

    protected function set_up(): void {
        parent::set_up();
        $this->lastError = null;
        $this->queryResult = null;
        $this->ids = [];
        $this->repos = new \stdClass();
        $this->services = new \stdClass();
        $this->configure_dependencies();
    }

    abstract protected function configure_dependencies(): void;

    protected function assert_operation_succeeded(): void {
        $this->assertNull($this->lastError,
            sprintf('預期操作成功，但發生錯誤：%s', $this->lastError));
    }

    protected function assert_operation_failed(): void {
        $this->assertNotNull($this->lastError, '預期操作失敗，但沒有發生錯誤');
    }

    protected function assert_operation_failed_with_type(string $type): void {
        $this->assertNotNull($this->lastError, '預期操作失敗');
        $actualType = (new \ReflectionClass($this->lastError))->getShortName();
        $this->assertSame($type, $actualType);
    }

    protected function assert_operation_failed_with_message(string $msg): void {
        $this->assertNotNull($this->lastError, '預期操作失敗');
        $this->assertStringContainsString($msg, $this->lastError->getMessage());
    }
}
```

---

# Meta 註記清理規範

## 刪除的內容
- `// TODO: [事件風暴部位: ...]`
- `// TODO: 參考 xxx 實作`
- 其他臨時標記

## 保留的內容
- 必要的業務邏輯註解
- PHPDoc 文檔註解

---

# 程式架構規範（Integration Test 3 層）

```
src/
├── Models/          # Plain PHP class
├── Repositories/    # WP DB Repository（真實 WordPress 資料庫操作）
├── Services/        # Service（業務邏輯）
└── Exceptions/      # 自定義例外
```

---

# WordPress 特定品質規範

## 資料庫操作

```php
// ❌ 直接字串拼接 SQL
$wpdb->query("SELECT * FROM {$wpdb->posts} WHERE post_title = '$title'");

// ✅ 使用 prepared statements
$wpdb->get_results(
    $wpdb->prepare("SELECT * FROM {$wpdb->posts} WHERE post_title = %s", $title)
);
```

## 資料清理

```php
// ✅ 輸入清理
$clean_title = sanitize_text_field($raw_title);
$clean_email = sanitize_email($raw_email);
$clean_url = esc_url_raw($raw_url);

// ✅ 輸出轉義
echo esc_html($user_input);
echo esc_attr($attribute_value);
```

## Nonce 檢查

```php
// ✅ REST API 中不需要 nonce（使用 permission_callback）
// ✅ Admin AJAX / Form POST 需要 nonce
if (!wp_verify_nonce($_POST['_wpnonce'], 'my_action')) {
    wp_die('Security check failed');
}
```

---

# 程式碼品質規範

## Early Return

```php
// ❌ 深層巢狀
function process(?Data $data): void {
    if ($data !== null) {
        if ($data->isValid()) {
            processData($data);
        } else { throw new ValidationException(); }
    } else { throw new DataException(); }
}

// ✅ Early return
function process(?Data $data): void {
    if ($data === null) throw new DataException();
    if (!$data->isValid()) throw new ValidationException();
    processData($data);
}
```

## 命名規範
- PascalCase：類別名稱
- camelCase：方法、屬性、變數
- snake_case：WordPress 函式（遵循 WordPress 慣例時）

## DRY 原則
消除重複邏輯，提取共用方法。

---

## 檢查清單
- [ ] 使用 Early Return
- [ ] 命名遵循 PHP/WordPress 慣例
- [ ] 消除重複邏輯
- [ ] SQL 使用 prepared statements
- [ ] 輸入清理 / 輸出轉義
- [ ] 權限檢查到位

---

**文件版本**：Integration Test PHPUnit Version 1.0
**適用框架**：PHP 8.2+ + PHPUnit 9.x + wp-env + WordPress
