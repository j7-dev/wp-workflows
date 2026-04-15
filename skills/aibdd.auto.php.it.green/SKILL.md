---
name: aibdd.auto.php.it.green
description: >
  PHP IT Stage 3：綠燈階段。以 Red 階段產出的失敗測試為驅動，用最小增量迭代實作：
  WordPress DB Repository（真實 WP 操作）+ Service 業務邏輯 + 自訂例外類別。
  Trial-and-error 循環：執行 PHPUnit → 讀失敗 → 寫最小增量 → 重跑 → 直到綠燈。
  可被 /aibdd.auto.php.it.control-flow 調用，也可獨立使用。
---

# PHP IT Stage 3 — Green Phase（綠燈實作者）

## 角色定位

本 skill 為 **WordPress PHP 整合測試 4-Phase TDD 流程** 中的 **Stage 3 綠燈實作者**。

接手 Stage 2（`/aibdd.auto.php.it.red`）產出的失敗測試（`BadMethodCallException: 尚未實作`），以 **trial-and-error 最小增量迭代** 的方式，完成：

1. Repository 的真實 WordPress DB 操作（user_meta / post_meta / options / custom table / CPT / taxonomy）
2. Service 的業務邏輯（含輸入驗證、狀態檢查、例外拋出）
3. Custom Exception 類別（`InvalidStateException`、`NotFoundException`、`PermissionDeniedException` 等）

**目標**：執行 `vendor/bin/phpunit --testsuite integration` 時，所有 test method 綠燈通過。

---

## 核心循環

```
while 測試未全部通過:
    1. 執行 PHPUnit → 讀取第一個失敗
    2. 分析失敗原因（BadMethodCallException? Assertion? Type error? Autoload?）
    3. 寫最小增量程式碼修復（Repository 或 Service 或 Exception）
    4. 重新執行 PHPUnit
    5. 若新失敗 → 回到 2
    6. 若全部通過 → 結束 → 進入 Stage 4 Refactor
```

**核心原則**：
- 每次只修一個失敗
- 不預先實作測試未要求的功能
- 不做「順便」的重構（留給 Refactor 階段）

---

## 失敗模式對照表

| 失敗訊息 | 原因 | 修復方向 |
|---------|------|---------|
| `BadMethodCallException: 尚未實作` | Stub 方法體未實作 | 實作該 Repository / Service 方法（最小版本） |
| `AssertionFailedError: Failed asserting ...` | 回傳值不符預期 | 修正業務邏輯或 Repository 查詢條件 |
| `TypeError: Argument #N must be of type ...` | 型別宣告與實際傳入值不符 | 檢查參數 / 回傳型別宣告、修正呼叫端 |
| `Error: Class ... not found` | 命名空間錯誤或 autoload 未重載 | 檢查 `use`、執行 `composer dump-autoload` |
| `InvalidArgumentException` | 參數驗證失敗 | 補齊輸入驗證 / 檢查測試資料 |
| `Error: Call to undefined method` | 方法名稱拼錯或未宣告 | 對齊測試端與實作端的方法名 |
| `wpdb::prepare was called incorrectly` | `$wpdb->prepare` 缺少 placeholder | 補 `%d` / `%s` placeholder |

---

## 實作順序

依下列順序實作，避免反覆切換：

```
Repository（WP DB 操作）
    ↓
Service（業務邏輯 + 拋業務例外）
    ↓
Custom Exceptions（InvalidStateException, NotFoundException 等）
```

- 測試失敗在 `$this->repos->xxx->...` → 實作 Repository
- 測試失敗在 `$this->services->xxx->...` → 實作 Service
- Service 需拋出某例外但類別未定義 → 建立 Custom Exception

---

## WP DB Repository 實作範例（5 種儲存模式）

### a) User Meta Pattern

適用 LessonProgress、UserPreference 等「與特定 User 綁定的屬性」。

```php
<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Models\LessonProgress;

class LessonProgressRepository
{
    private const META_KEY_PREFIX = '_lesson_progress_';

    public function save(LessonProgress $progress): void
    {
        update_user_meta(
            $progress->getUserId(),
            self::META_KEY_PREFIX . $progress->getLessonId(),
            [
                'progress' => $progress->getProgress(),
                'status'   => $progress->getStatus(),
            ]
        );
    }

    public function findByUserAndLesson(int $userId, int $lessonId): ?LessonProgress
    {
        $data = get_user_meta($userId, self::META_KEY_PREFIX . $lessonId, true);
        if (empty($data) || !is_array($data)) {
            return null;
        }
        return new LessonProgress(
            $userId,
            $lessonId,
            (int) $data['progress'],
            (string) $data['status'],
        );
    }
}
```

### b) Custom Table Pattern

適用 Order、CartItem 等「高效能 / 複雜查詢 / 大量資料」。

```php
<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Models\Order;

class OrderRepository
{
    public function save(Order $order): int
    {
        global $wpdb;
        $table = $wpdb->prefix . 'orders';

        if ($order->getId() === null) {
            $wpdb->insert(
                $table,
                [
                    'user_id' => $order->getUserId(),
                    'total'   => $order->getTotal(),
                    'status'  => $order->getStatus(),
                ],
                ['%d', '%d', '%s']
            );
            return (int) $wpdb->insert_id;
        }

        $wpdb->update(
            $table,
            [
                'total'  => $order->getTotal(),
                'status' => $order->getStatus(),
            ],
            ['id' => $order->getId()],
            ['%d', '%s'],
            ['%d']
        );
        return $order->getId();
    }

    public function findById(int $id): ?Order
    {
        global $wpdb;
        $table = $wpdb->prefix . 'orders';
        $row = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$table} WHERE id = %d", $id)
        );
        return $row ? Order::fromRow($row) : null;
    }
}
```

### c) Custom Post Type Pattern

適用 Course、Article 等「有標題 / 內容 / 中繼」的內容型實體。

```php
<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Models\Course;

class CourseRepository
{
    public function save(Course $course): int
    {
        $postId = wp_insert_post([
            'post_type'    => 'course',
            'post_title'   => $course->getTitle(),
            'post_content' => $course->getDescription(),
            'post_status'  => 'publish',
        ]);
        if (is_wp_error($postId)) {
            throw new \RuntimeException(
                '課程建立失敗: ' . $postId->get_error_message()
            );
        }
        update_post_meta($postId, '_instructor_id', $course->getInstructorId());
        return $postId;
    }

    public function findById(int $courseId): ?Course
    {
        $post = get_post($courseId);
        if (!$post || $post->post_type !== 'course') {
            return null;
        }
        return new Course(
            $courseId,
            $post->post_title,
            $post->post_content,
            (int) get_post_meta($courseId, '_instructor_id', true),
        );
    }
}
```

### d) Options API Pattern

適用 SiteSettings 等「全域 / 單一 / 少量寫入」的設定資料。

```php
public function saveSettings(array $settings): void
{
    update_option('myplugin_settings', $settings);
}

public function getSettings(): array
{
    return get_option('myplugin_settings', []);
}
```

### e) Taxonomy Pattern

適用 CourseCategory 等「分類 / 標籤」結構。

```php
public function assignCategory(int $courseId, int $categoryId): void
{
    wp_set_object_terms($courseId, $categoryId, 'course_category', true);
}

public function getCategories(int $courseId): array
{
    return wp_get_object_terms($courseId, 'course_category', ['fields' => 'ids']);
}
```

---

## Service 業務邏輯實作範例

Service 透過 constructor 注入 Repository，負責：

1. 輸入驗證
2. 狀態檢查（可能呼叫 Repository 查詢現況）
3. 業務規則計算
4. 成功 → Repository 寫入；失敗 → 拋自訂業務例外

```php
<?php
declare(strict_types=1);

namespace App\Services;

use App\Exceptions\InvalidStateException;
use App\Models\LessonProgress;
use App\Repositories\LessonProgressRepository;

class LessonService
{
    public function __construct(
        private LessonProgressRepository $lessonProgressRepo,
    ) {}

    public function updateVideoProgress(int $userId, int $lessonId, int $progress): void
    {
        if ($progress < 0 || $progress > 100) {
            throw new \InvalidArgumentException('進度必須介於 0–100');
        }

        $existing = $this->lessonProgressRepo->findByUserAndLesson($userId, $lessonId);
        if ($existing !== null && $progress < $existing->getProgress()) {
            throw new InvalidStateException('進度不可倒退');
        }

        $status = $progress >= 100 ? 'COMPLETED' : 'IN_PROGRESS';
        $this->lessonProgressRepo->save(
            new LessonProgress($userId, $lessonId, $progress, $status)
        );
    }

    public function getProgress(int $userId, int $lessonId): ?LessonProgress
    {
        return $this->lessonProgressRepo->findByUserAndLesson($userId, $lessonId);
    }
}
```

---

## Custom Exceptions

集中在 `src/Exceptions/` 目錄，建立繼承樹：

```php
<?php
declare(strict_types=1);

namespace App\Exceptions;

class BusinessException extends \RuntimeException {}

class InvalidStateException extends BusinessException {}

class NotFoundException extends BusinessException {}

class PermissionDeniedException extends BusinessException {}
```

測試端驗證範例：

```php
// Then 操作失敗，錯誤類型為 "InvalidStateException"
$this->assert_operation_failed_with_type(InvalidStateException::class);
// And 錯誤訊息包含 "進度不可倒退"
$this->assert_operation_failed_with_message('進度不可倒退');
```

---

## 測試命令

### 執行單一 Feature

```bash
vendor/bin/phpunit --testsuite integration --filter={FeatureName}Test
```

### 執行全部 Integration 測試

```bash
vendor/bin/phpunit --testsuite integration
```

### 透過 wp-env 執行（推薦）

```bash
npx wp-env run tests-cli --env-cwd=wp-content/plugins/{plugin} \
    vendor/bin/phpunit --testsuite integration
```

### 單一 test method

```bash
vendor/bin/phpunit --testsuite integration \
    --filter='LessonProgressTest::test_成功增加影片進度'
```

---

## 最小增量原則

1. **每次只修一個失敗**：從第一個失敗的 test method 開始，解決後再重跑。
2. **不預先實作測試未要求的功能**：例如測試只要求 `findByUserAndLesson`，就不要多寫一個 `findAll`。
3. **不做順便的重構**：看到舊程式碼風格不一致先忍住，留給 `/aibdd.auto.php.it.refactor`。
4. **不加註解超過必要**：只有演算法難懂處需註解，`// 儲存進度` 這類廢話註解不寫。
5. **不新增 library**：能用 WP 內建 API（`$wpdb`、`wp_insert_post` 等）就不引入第三方套件。

---

## 規則 R1–R7

| 規則 | 說明 |
|------|------|
| **R1** | 使用真實 WordPress DB（透過 wp-env）。**禁止** 建立 FakeRepository / InMemoryRepository / dict-based stub。 |
| **R2** | `WP_UnitTestCase` 自動 DB rollback（每個 test method 結束回滾），**不需** 手動 `DELETE FROM` 或 `tearDown` 清理。 |
| **R3** | 所有 `$wpdb` 查詢必須使用 `$wpdb->prepare()` + placeholder（`%d` / `%s` / `%f`）避免 SQL injection。 |
| **R4** | Repository 僅操作 WP API / DB，**不含** 業務邏輯。Service 處理業務邏輯，**不直接** 呼叫 `$wpdb`。 |
| **R5** | Service 對業務錯誤拋 **自訂業務例外**（`InvalidStateException` 等），對參數錯誤拋 `\InvalidArgumentException`。 |
| **R6** | Model 為 Plain PHP，**無 WordPress 依賴**（不 `use` WP function、不繼承 WP class）。 |
| **R7** | 最小增量。一次只修一個失敗。不預先實作、不順便重構、不加無用註解。 |

---

## 完成條件 Checklist

- [ ] 執行 `vendor/bin/phpunit --testsuite integration --filter={FeatureName}Test` 全綠
- [ ] 所有 Repository 使用真實 WP API（無 FakeRepository）
- [ ] 所有 `$wpdb` 查詢使用 `prepare()`
- [ ] Service 拋出自訂業務例外（而非通用 `\Exception`）
- [ ] Model 無 WordPress 依賴（可被單元測試）
- [ ] 無多餘程式碼（未被任何測試覆蓋的 method 應刪除）
- [ ] `composer dump-autoload` 已執行

完成後告知使用者「綠燈完成，可進入 Stage 4 重構階段（`/aibdd.auto.php.it.refactor`）」。
