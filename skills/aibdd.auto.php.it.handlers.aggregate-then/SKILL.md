---
name: aibdd.auto.php.it.handlers.aggregate-then
description: 當在 Gherkin 測試中驗證「Aggregate 最終狀態」，務必參考此規範。使用 $this->repos 查詢並驗證。
user-invocable: false
---

# Aggregate-Then-Handler (Integration Test Version)

## Role

負責實作 `Then` 步驟中驗證 Aggregate 最終狀態的邏輯。

**核心任務**：透過 Repository（從 `$this->repos` 取得）查詢 Aggregate 狀態並驗證。

---

## ⚠️ 與 Behat 版本的差異

| 項目 | Behat 版本 | Integration Test 版本 |
|------|-----------|----------------------|
| Repository 存取 | `$this->feature->repos->*` | **`$this->repos->*`** |
| Assert 方式 | `Assert::assertSame()`（靜態） | **`$this->assertSame()`**（實例方法） |
| ID 映射 | `$this->feature->ids[$userName]` | **`$this->ids[$userName]`** |
| 注入方式 | 建構子注入 FeatureContext | **繼承 IntegrationTestCase** |
| DataTable | `TableNode $table` | **PHP array** |

---

## 實作範例

```php
class LessonProgressTest extends IntegrationTestCase
{
    public function test_progress_updated(): void
    {
        // Given ...
        // When ...

        // Then 用戶 Alice 在課程 101 的進度應為 80%
        $userId = $this->ids['Alice'];
        $entity = $this->repos->lessonProgress->find((string) $userId, 101);

        $this->assertNotNull($entity, '找不到用戶 Alice 在課程 101 的進度');
        $this->assertSame(80, $entity->progress, '預期進度 80%，實際為 ' . $entity->progress . '%');
    }
}
```

---

## 驗證多個屬性

```php
// Then 用戶 Alice 在課程 101 的進度應為 80%，狀態為 進行中
$userId = $this->ids['Alice'];
$statusMap = ['進行中' => 'IN_PROGRESS', '已完成' => 'COMPLETED', '未開始' => 'NOT_STARTED'];

$entity = $this->repos->lessonProgress->find((string) $userId, 101);
$this->assertNotNull($entity);
$this->assertSame(80, $entity->progress);
$this->assertSame($statusMap['進行中'], $entity->status);
```

---

## 驗證 DataTable（轉為 PHP array）

```php
// Then 系統中應有以下課程進度
$expected = [
    ['userName' => 'Alice', 'lessonId' => 101, 'progress' => 80],
    ['userName' => 'Bob', 'lessonId' => 102, 'progress' => 50],
];

foreach ($expected as $row) {
    $userId = $this->ids[$row['userName']];
    $entity = $this->repos->lessonProgress->find((string) $userId, $row['lessonId']);
    $this->assertNotNull($entity);
    $this->assertSame($row['progress'], $entity->progress);
}
```

---

## 驗證不存在

```php
// Then 用戶 Alice 在課程 101 的進度記錄不存在
$userId = $this->ids['Alice'];
$entity = $this->repos->lessonProgress->find((string) $userId, 101);
$this->assertNull($entity, '預期不存在，但找到了記錄');
```

---

## Critical Rules

### R1: 透過 Repository 查詢（不透過 Service）
### R2: 從 $this->repos 取得 Repository（不需要 FeatureContext）
### R3: userName → userId 轉換（必須已在 $this->ids 中）
### R4: 狀態映射（中文 → 英文）
### R5: 驗證前檢查不為 null
### R6: DataTable 轉為 PHP array（不使用 TableNode）
### R7: 使用實例方法 $this->assertXxx()，不用靜態 Assert::assertXxx()

---

**文件版本**：Integration Test PHPUnit Version 1.0
**適用框架**：PHP 8.2+ + PHPUnit 9.x + wp-env + WordPress
