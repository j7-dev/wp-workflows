---
name: aibdd.auto.php.it.handlers.success-failure
description: 當在 Gherkin 測試中驗證操作成功或失敗時，參考此規範。使用 IntegrationTestCase 的 helper methods。
user-invocable: false
---

# Success-Failure-Handler (Integration Test Version)

## Role

負責實作 `Then` 步驟中驗證操作成功或失敗的邏輯。

**核心任務**：檢查 `$this->lastError` 來判斷操作結果。

---

## ⚠️ 與 Behat 版本的差異

| 項目 | Behat 版本 | Integration Test 版本 |
|------|-----------|----------------------|
| 容器 | `CommonThenContext` class | `IntegrationTestCase` helper methods |
| 存取 | `$this->feature->lastError` | **`$this->lastError`** |
| Assert | `Assert::assertNull()`（靜態） | **`$this->assertNull()`**（實例方法） |
| 注入 | 建構子注入 FeatureContext | **繼承 IntegrationTestCase** |

---

## 已實作步驟（IntegrationTestCase 基礎類別）

這些 helper methods 應在 `IntegrationTestCase` 中預先實作：

```php
abstract class IntegrationTestCase extends \Yoast\WPTestUtils\WPIntegration\TestCase
{
    protected ?\Throwable $lastError = null;

    protected function assert_operation_succeeded(): void
    {
        $this->assertNull($this->lastError,
            sprintf('預期操作成功，但發生錯誤：%s', $this->lastError));
    }

    protected function assert_operation_failed(): void
    {
        $this->assertNotNull($this->lastError, '預期操作失敗，但沒有發生錯誤');
    }
}
```

---

## 在測試方法中使用

```php
class LessonProgressTest extends IntegrationTestCase
{
    public function test_update_progress_succeeds(): void
    {
        // Given ...
        // When ...

        // Then 操作成功
        $this->assert_operation_succeeded();
    }

    public function test_update_progress_fails_when_invalid(): void
    {
        // Given ...
        // When ...

        // Then 操作失敗
        $this->assert_operation_failed();
    }
}
```

---

## 擴展：驗證特定錯誤類型

```php
// IntegrationTestCase 中已提供
protected function assert_operation_failed_with_type(string $type): void
{
    $this->assertNotNull($this->lastError, '預期操作失敗');
    $actualType = (new \ReflectionClass($this->lastError))->getShortName();
    $this->assertSame($type, $actualType);
}

// 在測試方法中使用
// Then 操作失敗，錯誤類型為 InvalidStateException
$this->assert_operation_failed_with_type('InvalidStateException');
```

---

## 擴展：驗證錯誤訊息

```php
// IntegrationTestCase 中已提供
protected function assert_operation_failed_with_message(string $msg): void
{
    $this->assertNotNull($this->lastError, '預期操作失敗');
    $this->assertStringContainsString($msg, $this->lastError->getMessage());
}

// 在測試方法中使用
// Then 操作失敗，錯誤訊息包含「進度不可倒退」
$this->assert_operation_failed_with_message('進度不可倒退');
```

---

## Critical Rules

### R1: 使用 $this->lastError（IntegrationTestCase 的 protected 屬性）
### R2: 成功時 lastError 為 null
### R3: 失敗時 lastError 包含 Throwable 物件
### R4: helper methods 定義在 IntegrationTestCase 基礎類別中
### R5: 使用實例方法 $this->assertXxx()，不用靜態 Assert::assertXxx()

---

**文件版本**：Integration Test PHPUnit Version 1.0
**適用框架**：PHP 8.2+ + PHPUnit 9.x + wp-env + WordPress
