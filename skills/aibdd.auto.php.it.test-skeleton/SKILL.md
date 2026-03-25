---
name: aibdd.auto.php.it.test-skeleton
description: PHP IT Stage 1：從 Gherkin Feature 生成 Integration Test 骨架。每個 Feature 產生一個 PHPUnit Test class，每個 Example 產生一個 test method + markTestIncomplete()。
user-invocable: true
argument-hint: "[feature-file]"
---

**Input**: tests/features/**/*.feature, tests/integration/**/*.php
**Output**: tests/integration/{Subdomain}/{Feature}Test.php（骨架）

# 角色

Integration Test 骨架生成器。從 Gherkin Feature File 生成可執行的 PHPUnit Test class 骨架（extends IntegrationTestCase + `$this->markTestIncomplete()`）。

**重要**：此 Skill 的產出僅為「骨架」，不包含實作邏輯。

---

# 入口條件（雙模式）

## 模式 A：獨立使用
1. 詢問目標 Feature File
2. 執行骨架生成流程

## 模式 B：被 /wp-workflows:aibdd.auto.php.it.control-flow 調用
接收參數：Feature File 路徑。直接執行。

---

# 執行前檢查

**永遠不要覆蓋已存在的 Test class。**

1. 掃描 `tests/integration/` 下所有 `.php` 檔案中的 `test_*` methods
2. 建立「已存在測試清單」
3. 對比找出「缺少的測試」
4. **只針對缺少的測試生成骨架**

---

# 骨架格式

每個 Feature file 產生**一個** Test class。每個 Gherkin `Example:` / `Scenario:` 產生**一個** `test_*` method。

```php
<?php
// tests/integration/Lesson/LessonProgressTest.php

namespace Tests\Integration\Lesson;

use Tests\Integration\IntegrationTestCase;

class LessonProgressTest extends IntegrationTestCase
{
    protected function configure_dependencies(): void
    {
        // TODO: 初始化 repositories 和 services
        // $this->repos->lessonProgress = new LessonProgressRepository();
        // $this->services->lesson = new LessonService($this->repos->lessonProgress);
    }

    /**
     * Feature: 課程進度更新
     * Scenario: 用戶更新課程影片進度
     *
     * TODO: [事件風暴部位: Command - UpdateVideoProgress]
     * TODO: 參考 /wp-workflows:aibdd.auto.php.it.handlers.command 實作 When
     * TODO: 參考 /wp-workflows:aibdd.auto.php.it.handlers.aggregate-given 實作 Given
     * TODO: 參考 /wp-workflows:aibdd.auto.php.it.handlers.aggregate-then 實作 Then
     */
    public function test_user_updates_video_progress(): void
    {
        // Given 用戶 Alice 在課程 101 的進度為 50%，狀態為 進行中

        // When 用戶 Alice 更新課程 101 的影片進度為 80%

        // Then 用戶 Alice 在課程 101 的進度應為 80%

        $this->markTestIncomplete('尚未實作');
    }

    /**
     * Feature: 課程進度更新
     * Scenario: 用戶完成課程
     *
     * TODO: [事件風暴部位: Command - UpdateVideoProgress]
     * TODO: 參考 /wp-workflows:aibdd.auto.php.it.handlers.command 實作 When
     * TODO: 參考 /wp-workflows:aibdd.auto.php.it.handlers.aggregate-then 實作 Then
     */
    public function test_user_completes_lesson(): void
    {
        // Given 用戶 Alice 在課程 101 的進度為 90%，狀態為 進行中

        // When 用戶 Alice 更新課程 101 的影片進度為 100%

        // Then 用戶 Alice 在課程 101 的狀態應為 已完成

        $this->markTestIncomplete('尚未實作');
    }
}
```

## 骨架規範

1. **檔案與目錄**：按 Subdomain 分（`Lesson/`, `Order/`），一個 Feature 一個 Test class
2. **一個 Scenario/Example 一個 test method**
3. **繼承 IntegrationTestCase**
4. **TODO DocBlock**：標註事件風暴部位與 Handler Skill
5. **空方法體**：`$this->markTestIncomplete('尚未實作')`
6. **Gherkin 步驟轉為註解**：用 `// Given` / `// When` / `// Then` 保留完整 Gherkin 語句

---

# Decision Tree

```
Given:
  建立初始資料狀態 → /wp-workflows:aibdd.auto.php.it.handlers.aggregate-given
  已完成的寫入操作 → /wp-workflows:aibdd.auto.php.it.handlers.command

When:
  讀取操作 → /wp-workflows:aibdd.auto.php.it.handlers.query
  寫入操作 → /wp-workflows:aibdd.auto.php.it.handlers.command

Then:
  只關注成功/失敗 → /wp-workflows:aibdd.auto.php.it.handlers.success-failure
  驗證 Aggregate 狀態 → /wp-workflows:aibdd.auto.php.it.handlers.aggregate-then
  驗證 Query 回傳值 → /wp-workflows:aibdd.auto.php.it.handlers.readmodel-then

And:
  繼承前一個判斷規則
```

---

# Handler Prompt 映射表

| 事件風暴部位 | 位置 | Handler Skill |
|------------|------|--------------|
| Aggregate | Given | /wp-workflows:aibdd.auto.php.it.handlers.aggregate-given |
| Command | Given/When | /wp-workflows:aibdd.auto.php.it.handlers.command |
| Query | When | /wp-workflows:aibdd.auto.php.it.handlers.query |
| 操作成功/失敗 | Then | /wp-workflows:aibdd.auto.php.it.handlers.success-failure |
| Aggregate | Then | /wp-workflows:aibdd.auto.php.it.handlers.aggregate-then |
| Read Model | Then | /wp-workflows:aibdd.auto.php.it.handlers.readmodel-then |

---

# Critical Rules

### R1: 永遠不覆蓋已存在的 Test class
### R2: 每個 Feature 一個 Test class，每個 Scenario 一個 test method
### R3: 繼承 IntegrationTestCase
### R4: 只輸出骨架（markTestIncomplete）
### R5: 保留完整 Gherkin 語句（作為 // Given / // When / // Then 註解）
### R6: 標註事件風暴部位
### R7: 指引正確的 Handler Skill

---

# 完成條件

- 所有缺少的 Scenario 都有對應的 test method
- 方法體為 `$this->markTestIncomplete('尚未實作')`
- 已存在的 Test class 未被覆蓋
