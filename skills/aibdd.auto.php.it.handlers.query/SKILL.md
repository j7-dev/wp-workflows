---
name: aibdd.auto.php.it.handlers.query
description: 當在 Gherkin 中撰寫 Query 操作步驟時，務必參考此規範。直接呼叫 Service 方法，結果存入 $this->queryResult。
user-invocable: false
---

# Query-Handler (Integration Test Version)

## Role

負責實作 `When` 步驟中的 Query（查詢）操作。

**核心任務**：呼叫 Service 方法執行讀取操作，將結果儲存到 `$this->queryResult`。

---

## ⚠️ 與 Behat 版本的差異

| 項目 | Behat 版本 | Integration Test 版本 |
|------|-----------|----------------------|
| 結果存取 | `$this->feature->queryResult` | **`$this->queryResult`** |
| 錯誤存取 | `$this->feature->lastError` | **`$this->lastError`** |
| Service 存取 | `$this->feature->services->*` | **`$this->services->*`** |
| ID 映射 | `$this->feature->ids[$userName]` | **`$this->ids[$userName]`** |
| 注入方式 | 建構子注入 FeatureContext | **繼承 IntegrationTestCase** |

---

## ⚠️ 與 Command 的差異

| 項目 | Command | Query |
|------|---------|-------|
| 目的 | 修改系統狀態 | 讀取資料 |
| 回傳值 | 通常無回傳 | **有回傳值** |
| 結果處理 | 捕獲錯誤 | **儲存查詢結果** |

---

## 實作範例

```php
class LessonProgressTest extends IntegrationTestCase
{
    public function test_query_progress(): void
    {
        // Given ...

        // When 用戶 Alice 查詢課程 101 的進度
        $userId = $this->ids['Alice'];
        try {
            $result = $this->services->lesson->getLessonProgress((string) $userId, 101);
            $this->queryResult = $result;
            $this->lastError = null;
        } catch (\Throwable $e) {
            $this->queryResult = null;
            $this->lastError = $e;
        }

        // Then ...
    }
}
```

---

## 查詢列表

```php
public function test_query_all_progress(): void
{
    // Given ...

    // When 用戶 Alice 查詢所有課程進度
    $userId = $this->ids['Alice'];
    try {
        $this->queryResult = $this->services->lesson->getAllProgress((string) $userId);
        $this->lastError = null;
    } catch (\Throwable $e) {
        $this->queryResult = null;
        $this->lastError = $e;
    }

    // Then ...
}
```

---

## Critical Rules

### R1: Query 必須儲存結果到 $this->queryResult
### R2: Query 也需要捕獲錯誤
### R3: 從 $this->services 取得 Service（不需要 FeatureContext）
### R4: userName → userId 轉換透過 $this->ids
### R5: queryResult 是 IntegrationTestCase 的 protected 屬性

---

**文件版本**：Integration Test PHPUnit Version 1.0
**適用框架**：PHP 8.2+ + PHPUnit 9.x + wp-env + WordPress
