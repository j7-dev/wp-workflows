---
name: aibdd.auto.php.it.red
description: >
  PHP IT Stage 2：紅燈生成器。對單一 .feature 的測試骨架執行完整紅燈流程：
  建立 IntegrationTestCase 基類（若不存在）→ 建立 Model/Repository/Service stubs（BadMethodCallException）
  → 逐一實作 test method 的 Given/When/Then 邏輯（參考對應 handler skill）。
  預期結果：測試執行後失敗於 BadMethodCallException（Service 方法未實作）。
  可被 /aibdd.auto.php.it.control-flow 調用，也可獨立使用。
---

# PHP IT Stage 2 — Red Phase（紅燈生成器）

## 角色定位

本 skill 為 **WordPress PHP 整合測試 4-Phase TDD 流程** 中的 **Stage 2 紅燈生成器**。

接手 Stage 1（`/aibdd.auto.php.it.test-skeleton`）產出的 PHPUnit 測試骨架（含 `markTestIncomplete` 與 Gherkin TODO 註解），完成下列三件事：

1. 建立 `IntegrationTestCase` 基類（若尚未存在）
2. 建立 Model / Repository / Service **stub**（方法體拋 `BadMethodCallException`）
3. 實作每個 `test_*` method 的 Given/When/Then 邏輯（呼叫 6 個 handler skills 的模式）

**產出的測試必須「紅燈」**：執行 PHPUnit 時失敗於 `BadMethodCallException: 尚未實作`（Service 方法未實作），而非 Type error 或 Autoload error。

---

## 雙模式入口

### 模式 A：被 control-flow 調用

由 `/aibdd.auto.php.it.control-flow` 批次呼叫，接收 **feature file 絕對路徑** 作為參數：

```
/aibdd.auto.php.it.red specs/features/01-lesson-progress.feature
```

直接進入 Step 1，不詢問使用者。

### 模式 B：獨立使用

使用者直接呼叫此 skill 時：

1. 列出 `specs/features/*.feature` 清單
2. 詢問「要對哪個 feature 執行紅燈階段？」
3. 確認後進入 Step 1

---

## 紅燈定義（兩條件同時滿足）

### (a) 環境正常

- `npx wp-env status` → running
- `composer install` 已完成，`vendor/` 存在
- `tests/integration/IntegrationTestCase.php` 可正常載入
- `vendor/yoast/wp-test-utils/` 存在

### (b) Value Difference（值差異）

測試執行後必須因 **`BadMethodCallException: 尚未實作`** 而失敗。

失敗位置應為 Service 方法被 When 呼叫時、或 Repository 方法被 Given 呼叫時。**不可** 為：

- ❌ `Error: Class App\Services\XxxService not found`（autoload 設定錯誤）
- ❌ `TypeError: ... must be of type int`（型別宣告錯誤）
- ❌ `Error: Call to undefined method`（stub 方法未建立）

---

## 三步流程總覽

```
Step 1: IntegrationTestCase 基類確認（若不存在則建立）
    ↓
Step 2: Model / Repository / Service Stub 建立
        （方法體一律拋 BadMethodCallException）
    ↓
Step 3: Test Method 實作
        （讀 TODO 標註 → 載入 handler → 替換 markTestIncomplete）
    ↓
驗證：執行 PHPUnit → 預期失敗於 BadMethodCallException
```

---

## Step 1: IntegrationTestCase 基類

### 檢查路徑

```
tests/integration/IntegrationTestCase.php
```

### 若不存在 → 建立完整檔案

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
            'Expected success but got: ' . ($this->lastError?->getMessage() ?? '')
        );
    }

    protected function assert_operation_failed(): void
    {
        $this->assertNotNull($this->lastError, 'Expected failure but operation succeeded');
    }

    protected function assert_operation_failed_with_type(string $type): void
    {
        $this->assertNotNull($this->lastError);
        $this->assertInstanceOf($type, $this->lastError);
    }

    protected function assert_operation_failed_with_message(string $msg): void
    {
        $this->assertNotNull($this->lastError);
        $this->assertStringContainsString($msg, $this->lastError->getMessage());
    }
}
```

### 若存在 → 驗證結構

必須包含：
- protected `$lastError`, `$queryResult`, `$ids`, `$repos`, `$services`
- abstract `configure_dependencies()`
- `set_up()` 重置狀態並呼叫 `configure_dependencies()`
- 4 個 `assert_operation_*` helper

若缺少任一項 → 補齊後繼續。

---

## Step 2: WP 儲存模式決策 + Stub 建立

### WP 儲存模式決策指南

根據 Feature 中 Entity 的特性，選擇對應的 WordPress 儲存方式：

| 儲存模式 | 適用場景 | WP API | 範例 Entity |
|---------|---------|--------|------------|
| Custom Post Type | 內容型實體（有標題/內容/中繼） | `register_post_type`, `wp_insert_post` | Course, Article |
| Post Meta | 文章自訂屬性 | `update_post_meta`, `get_post_meta` | CourseMetadata |
| User Meta | 使用者相關屬性 | `update_user_meta`, `get_user_meta` | LessonProgress, UserPreference |
| Options API | 全域設定 | `update_option`, `get_option` | SiteSettings |
| Custom Taxonomy | 分類/標籤 | `register_taxonomy`, `wp_set_object_terms` | CourseCategory |
| Custom Table | 高效能/複雜查詢 | `$wpdb->insert`, `$wpdb->get_results` | Order, OrderItem, CartItem |

**紅燈階段不需要實作實際 WP 操作**，只需要把 Model / Repository / Service 的 class 骨架建立起來，方法體一律 `throw new \BadMethodCallException('尚未實作');`。

### Stub 建立範例（Model）

Plain PHP，使用 constructor property promotion，**不依賴 WordPress**：

```php
<?php
declare(strict_types=1);

namespace App\Models;

class LessonProgress
{
    public function __construct(
        private int $userId,
        private int $lessonId,
        private int $progress,
        private string $status,
    ) {}

    public function getUserId(): int { return $this->userId; }
    public function getLessonId(): int { return $this->lessonId; }
    public function getProgress(): int { return $this->progress; }
    public function getStatus(): string { return $this->status; }
}
```

### Stub 建立範例（Repository）

僅宣告方法簽章，方法體一律拋 `BadMethodCallException`：

```php
<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Models\LessonProgress;

class LessonProgressRepository
{
    public function save(LessonProgress $progress): void
    {
        throw new \BadMethodCallException('尚未實作');
    }

    public function findByUserAndLesson(int $userId, int $lessonId): ?LessonProgress
    {
        throw new \BadMethodCallException('尚未實作');
    }
}
```

### Stub 建立範例（Service）

透過 constructor 注入 Repository，業務方法拋 `BadMethodCallException`：

```php
<?php
declare(strict_types=1);

namespace App\Services;

use App\Models\LessonProgress;
use App\Repositories\LessonProgressRepository;

class LessonService
{
    public function __construct(
        private LessonProgressRepository $lessonProgressRepo,
    ) {}

    public function updateVideoProgress(int $userId, int $lessonId, int $progress): void
    {
        throw new \BadMethodCallException('尚未實作');
    }

    public function getProgress(int $userId, int $lessonId): ?LessonProgress
    {
        throw new \BadMethodCallException('尚未實作');
    }
}
```

### 檔案放置位置

```
src/Models/LessonProgress.php
src/Repositories/LessonProgressRepository.php
src/Services/LessonService.php
```

`composer.json` 需有對應 PSR-4 autoload 設定：

```json
"autoload": {
    "psr-4": { "App\\": "src/" }
}
```

若缺少，建立後執行 `composer dump-autoload`。

---

## Step 3: Test Method 實作

### 流程

對 test-skeleton 產出的每個 `test_*` method：

1. 讀取方法體內的 TODO 註解（Stage 1 產生），例如：
   ```php
   // TODO [Handler: aggregate-given] Given 用戶 "Alice" 在課程 1 的進度為 50%
   // TODO [Handler: command] When 用戶 "Alice" 更新課程 1 的影片進度為 80%
   // TODO [Handler: success-failure] Then 操作成功
   // TODO [Handler: aggregate-then] And 用戶 "Alice" 在課程 1 的進度應為 80%
   $this->markTestIncomplete('尚未實作');
   ```

2. 根據 `[Handler: xxx]` 標註，**載入對應 handler skill**（透過 Skill 工具），取得該句型的 PHP 模板。

3. 替換 `$this->markTestIncomplete(...)` 為 handler 定義的 PHP 程式碼。

### Handler 路由對照表

| Gherkin 句型 | Handler Skill |
|-------------|---------------|
| Given 狀態描述（Aggregate 初始狀態） | `/aibdd.auto.php.it.handlers.aggregate-given` |
| Given 已完成動作 / When 寫入操作 | `/aibdd.auto.php.it.handlers.command` |
| When 讀取操作 | `/aibdd.auto.php.it.handlers.query` |
| Then DB 狀態驗證 | `/aibdd.auto.php.it.handlers.aggregate-then` |
| Then Response / ReadModel 驗證 | `/aibdd.auto.php.it.handlers.readmodel-then` |
| Then 操作成功/失敗 | `/aibdd.auto.php.it.handlers.success-failure` |

### 更新 `configure_dependencies()`

根據 test 中使用到的 Service / Repository，在測試類的 `configure_dependencies()` 建立依賴圖：

```php
protected function configure_dependencies(): void
{
    $this->repos->lessonProgress = new LessonProgressRepository();
    $this->services->lesson = new LessonService($this->repos->lessonProgress);
}
```

### 完整 Test Method 範例（實作後）

```php
public function test_成功增加影片進度(): void
{
    // Given 用戶 "Alice" 在課程 1 的進度為 50%，狀態為 "進行中"
    $userId = $this->factory()->user->create(['display_name' => 'Alice']);
    $this->ids['Alice'] = $userId;
    $this->repos->lessonProgress->save(
        new LessonProgress($userId, 1, 50, 'IN_PROGRESS')
    );
    // ↑ 此行將拋 BadMethodCallException → 紅燈

    // When 用戶 "Alice" 更新課程 1 的影片進度為 80%
    try {
        $this->services->lesson->updateVideoProgress($userId, 1, 80);
    } catch (\Throwable $e) {
        $this->lastError = $e;
    }

    // Then 操作成功
    $this->assert_operation_succeeded();

    // And 用戶 "Alice" 在課程 1 的進度應為 80%
    $progress = $this->repos->lessonProgress->findByUserAndLesson($userId, 1);
    $this->assertNotNull($progress);
    $this->assertSame(80, $progress->getProgress());
}
```

---

## 測試執行驗證

完成 Step 1–3 後執行：

```bash
vendor/bin/phpunit --testsuite integration --filter={FeatureName}Test
```

或透過 wp-env：

```bash
npx wp-env run tests-cli --env-cwd=wp-content/plugins/{plugin} \
    vendor/bin/phpunit --testsuite integration --filter={FeatureName}Test
```

### 預期輸出（紅燈）

```
There was 1 error:

1) Tests\Integration\LessonProgressTest::test_成功增加影片進度
BadMethodCallException: 尚未實作

/app/src/Repositories/LessonProgressRepository.php:12
/app/tests/integration/LessonProgressTest.php:28

ERRORS!
Tests: 1, Assertions: 0, Errors: 1.
```

✅ 這就是標準紅燈 — Value Difference 於 `BadMethodCallException`。

---

## 規則 R1–R7

| 規則 | 說明 |
|------|------|
| **R1** | 不實作業務邏輯。Service / Repository 方法體必須一律 `throw new \BadMethodCallException('尚未實作');` |
| **R2** | Models / Repositories / Services 置於 `src/` 目錄（非 `tests/`）。遵循 PSR-4 autoload。 |
| **R3** | 測試必須失敗（紅燈本質）。失敗原因為 `BadMethodCallException`，非 Type error 或 Autoload error。 |
| **R4** | Stub 使用 PHP 8 constructor property promotion（`public function __construct(private int $x)`）。 |
| **R5** | 所有 src/ 與 tests/ 檔案第一行 `declare(strict_types=1);`。 |
| **R6** | Repository 與 Service 透過 constructor DI，不使用 static / global。 |
| **R7** | 中文狀態欄位（「進行中」「已完成」）以 string constant 或 Enum 處理，DB 內存英文代碼（如 `IN_PROGRESS`, `COMPLETED`）。 |

---

## 完成條件 Checklist

- [ ] `tests/integration/IntegrationTestCase.php` 存在且結構完整
- [ ] 對應 Feature 的 `src/Models/*.php` 已建立（plain PHP + getter）
- [ ] 對應 Feature 的 `src/Repositories/*.php` 已建立（方法拋 `BadMethodCallException`）
- [ ] 對應 Feature 的 `src/Services/*.php` 已建立（方法拋 `BadMethodCallException`）
- [ ] 測試類的 `configure_dependencies()` 已組裝所有依賴
- [ ] 每個 `test_*` method 的 `markTestIncomplete` 已被 Given/When/Then 實作取代
- [ ] `composer dump-autoload` 已執行（若有新增 PSR-4 entry）
- [ ] 執行 PHPUnit 看到 `BadMethodCallException: 尚未實作` 錯誤 → 紅燈確認
- [ ] 無 Type error、Autoload error、Syntax error

完成後告知使用者「紅燈完成，可進入 Stage 3 綠燈階段（`/aibdd.auto.php.it.green`）」。
