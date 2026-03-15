---
name: aibdd.auto.php.it.red
description: PHP IT Stage 2：紅燈生成器。建立 WP DB Repository（BadMethodCallException）+ Service 介面（BadMethodCallException）+ 完整 test method 實作 + IntegrationTestCase 基礎類別。
user-invocable: true
argument-hint: "[feature-file]"
---

**Input**: tests/integration/**/*.php（骨架）, handler skills
**Output**: tests/integration/**/*.php（完整）, tests/integration/IntegrationTestCase.php, src/Models/*.php, src/Repositories/*.php, src/Services/*.php

# 角色

Integration Test 協調器，負責紅燈階段。讀取骨架中的 TODO 註解，調用對應的 Handler Skill 來實作。

---

# 入口條件（雙模式）

## 模式 A：獨立使用
## 模式 B：被 /aibdd.auto.php.it.control-flow 調用

---

# Phase 0：確認整合測試基礎設施

在開始紅燈階段前，確認以下基礎設施存在（不存在則生成）：

### IntegrationTestCase 基礎類別

```php
<?php
// tests/integration/IntegrationTestCase.php

namespace Tests\Integration;

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

### 檢查清單

- [ ] `.wp-env.json` 存在
- [ ] `phpunit.xml.dist` 存在
- [ ] `tests/bootstrap.php` 存在
- [ ] `tests/integration/IntegrationTestCase.php` 存在（不存在則生成上述內容）

---

# 紅燈階段的核心原則

## 可以做的事
- 實作 test method 的 Given/When/Then 邏輯
- 建立 Model 類別（plain PHP class）
- 建立 WP DB Repository（方法拋出 `\BadMethodCallException`）
- 建立 Service 類別（方法拋出 `\BadMethodCallException`）
- 在 `configure_dependencies()` 中初始化 repos/services

## 不可以做的事
- **不實作 Repository 的方法體**
- **不實作 Service 的業務邏輯**
- **不讓測試通過**

---

# Entity-to-WP-Storage 映射決策

建立 Repository 時，先確定 Entity 對應的 WP 儲存機制：

```
Entity 有 title/body/author lifecycle → Custom Post Type
User-specific data                    → User Meta
Simple key-value config               → Options API
Categorization                        → Custom Taxonomy
Complex queries / performance         → Custom DB table ($wpdb)
Default fallback                      → Post Meta
```

在紅燈階段只需定義 Repository 介面（方法簽章），不需要實作儲存邏輯。

---

# 範例產出

```php
// src/Models/LessonProgress.php
class LessonProgress
{
    public string $userId = '';
    public int $lessonId = 0;
    public int $progress = 0;
    public string $status = '';
}
```

```php
// src/Repositories/LessonProgressRepository.php
class LessonProgressRepository
{
    public function save(LessonProgress $entity): void
    {
        throw new \BadMethodCallException('紅燈階段：尚未實作');
    }

    public function find(string $userId, int $lessonId): ?LessonProgress
    {
        throw new \BadMethodCallException('紅燈階段：尚未實作');
    }
}
```

```php
// src/Services/LessonService.php
class LessonService
{
    public function __construct(private readonly LessonProgressRepository $repo) {}

    public function updateVideoProgress(string $userId, int $lessonId, int $progress): void
    {
        throw new \BadMethodCallException('紅燈階段：尚未實作');
    }
}
```

---

# 執行測試確認紅燈

```bash
npx wp-env run cli --env-cwd=wp-content/plugins/{plugin-name} vendor/bin/phpunit
```

**預期結果**：測試失敗（BadMethodCallException）

---

# 路牌對照表

| TODO 中的 Handler | Handler Skill |
|-------------------|--------------|
| aggregate-given | /aibdd.auto.php.it.handlers.aggregate-given |
| aggregate-then | /aibdd.auto.php.it.handlers.aggregate-then |
| command | /aibdd.auto.php.it.handlers.command |
| query | /aibdd.auto.php.it.handlers.query |
| readmodel-then | /aibdd.auto.php.it.handlers.readmodel-then |
| success-failure | /aibdd.auto.php.it.handlers.success-failure |

---

# Critical Rules

### R1: test method 必須完整（不能只有 markTestIncomplete）
### R2: 介面定義完整，但不實作業務邏輯
### R3: configure_dependencies() 必須初始化所有 repos/services
### R4: 測試會失敗（紅燈）
### R5: 依賴透過 IntegrationTestCase 的 protected 屬性取得
### R6: lastError 和 queryResult 是 IntegrationTestCase 的 protected 屬性
### R7: 若 IntegrationTestCase 不存在則生成

---

# 完成條件

- IntegrationTestCase 基礎類別存在
- 所有 test method 有完整的 Given/When/Then 實作
- Model 類別定義完整
- Repository 所有方法拋出 `BadMethodCallException`
- Service 所有方法拋出 `BadMethodCallException`
- `configure_dependencies()` 正確初始化
- PHPUnit 測試失敗（紅燈）
- Feature File 的 `@ignore` tag 已移除
