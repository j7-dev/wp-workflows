---
name: aibdd.auto.php.it.handlers.readmodel-then
description: 當在 Gherkin 測試中驗證「Query 回傳結果」時，「只能」使用此指令。讀取 $this->queryResult 驗證。
user-invocable: false
---

# ReadModel-Then-Handler (Integration Test Version)

## Role

負責實作 `Then` 步驟中驗證 Query 查詢結果的邏輯。

**核心任務**：從 `$this->queryResult` 取得查詢結果並驗證內容。

---

## ⚠️ 與 Behat 版本的差異

| 項目 | Behat 版本 | Integration Test 版本 |
|------|-----------|----------------------|
| 結果存取 | `$this->feature->queryResult` | **`$this->queryResult`** |
| Assert 方式 | `Assert::assertSame()`（靜態） | **`$this->assertSame()`**（實例方法） |
| 注入方式 | 建構子注入 FeatureContext | **繼承 IntegrationTestCase** |
| DataTable | `TableNode $table` | **PHP array** |

---

## ⚠️ 與 Aggregate-Then 的差異

| 項目 | Aggregate Then | ReadModel Then |
|------|---------------|---------------|
| 資料來源 | Repository 查詢 | **$this->queryResult** |
| 操作 | 執行 Repository 查詢 | **只讀取 queryResult** |

**關鍵規則**：ReadModel Then **不能重新執行 Query**。

---

## 實作範例

```php
class LessonProgressTest extends IntegrationTestCase
{
    public function test_query_returns_progress(): void
    {
        // Given ...
        // When 查詢課程進度（結果已存入 $this->queryResult）

        // Then 查詢結果應包含進度 80，狀態為 進行中
        $result = $this->queryResult;
        $this->assertNotNull($result, '查詢結果為空');

        $statusMap = ['進行中' => 'IN_PROGRESS', '已完成' => 'COMPLETED', '未開始' => 'NOT_STARTED'];

        $this->assertSame(80, $result->progress);
        $this->assertSame($statusMap['進行中'], $result->status);
    }
}
```

---

## 驗證列表結果

```php
// Then 查詢結果應包含 3 筆課程進度
$result = $this->queryResult;
$this->assertNotNull($result);
$this->assertCount(3, $result);
```

---

## 驗證列表內容（轉為 PHP array）

```php
// Then 查詢結果應包含以下課程進度
$result = $this->queryResult;
$this->assertNotNull($result);

$expected = [
    ['lessonId' => 101, 'progress' => 80],
    ['lessonId' => 102, 'progress' => 50],
];

$this->assertCount(count($expected), $result);

foreach ($expected as $i => $row) {
    $this->assertSame($row['lessonId'], $result[$i]->lessonId);
    $this->assertSame($row['progress'], $result[$i]->progress);
}
```

---

## 驗證空結果

```php
// Then 查詢結果應為空
$result = $this->queryResult;
if (is_array($result)) {
    $this->assertEmpty($result);
} else {
    $this->assertNull($result);
}
```

---

## Critical Rules

### R1: 使用 $this->queryResult（不重新查詢）
### R2: Then 不得重新執行 Query
### R3: 驗證前檢查結果不為 null
### R4: 狀態映射（中文 → 英文）
### R5: 使用實例方法 $this->assertXxx()，不用靜態 Assert::assertXxx()

---

**文件版本**：Integration Test PHPUnit Version 1.0
**適用框架**：PHP 8.2+ + PHPUnit 9.x + wp-env + WordPress
