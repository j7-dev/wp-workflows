---
name: aibdd.auto.php.it.test-skeleton
description: >
  PHP IT Stage 1：從 Gherkin .feature 檔案生成 PHPUnit 測試類別骨架。
  一個 Feature 對應一個 Test class，一個 Scenario/Example 對應一個 test method。
  每個 test method 標註 Gherkin 步驟為註解 + Handler 類型 TODO，方法體為 markTestIncomplete。
  可被 /aibdd.auto.php.it.control-flow 調用，也可獨立使用。
---

# PHP IT Test Skeleton 生成器

## 1. 角色定位

本 skill 為 AI-BDD 4 階段流程中的 **Stage 1 骨架生成器**：

```
Stage 1: test-skeleton  ← 本 skill
Stage 2: red (BadMethodCallException)
Stage 3: green (實作通過)
Stage 4: refactor
```

目的是將 `.feature` 檔中的 Gherkin 設計，翻譯為 PHPUnit 測試骨架。**不實作任何測試邏輯**，僅產生空殼 + Handler 提示。

---

## 2. 雙模式入口

### 模式 A：被 control-flow 呼叫

上游 skill（`/aibdd.auto.php.it.control-flow`）會傳入：
- `feature_file_path`: 絕對路徑
- `target_subdomain`: 子領域名稱（如 `Lesson`）

直接進入骨架生成流程。

### 模式 B：獨立呼叫

使用者直接呼叫本 skill 時：
1. 詢問 `.feature` 檔案絕對路徑
2. 詢問目標 Subdomain 目錄（或從 Feature 描述推斷）
3. 確認後進入骨架生成流程

---

## 3. 前置檢查

執行前必須確認：

1. `tests/integration/` 目錄存在
   - 不存在 → 提示使用者執行 setup
2. `tests/integration/IntegrationTestCase.php` 基類存在
3. 掃描 `tests/integration/{Subdomain}/` 下既有 Test class
   - **永不覆蓋**已存在檔案
   - 若 `{Feature}Test.php` 已存在 → 跳過並回報

---

## 4. 骨架格式（完整範例）

```php
<?php

declare(strict_types=1);

namespace Tests\Integration\Lesson;

use Tests\Integration\IntegrationTestCase;

/**
 * @group integration
 * @group lesson-video-progress
 */
class UpdateVideoProgressTest extends IntegrationTestCase
{
    protected function configure_dependencies(): void
    {
        // TODO: 初始化 $this->repos 和 $this->services
        // $this->repos->lessonProgress = new LessonProgressRepository();
        // $this->services->lesson = new LessonService($this->repos->lessonProgress);
    }

    /**
     * @test
     * @testdox 成功增加影片進度
     */
    public function test_成功增加影片進度(): void
    {
        // Given 用戶 "Alice" 在課程 1 的進度為 50%，狀態為 "進行中"
        // [Handler: aggregate-given] 參考 /aibdd.auto.php.it.handlers.aggregate-given

        // When 用戶 "Alice" 更新課程 1 的影片進度為 80%
        // [Handler: command] 參考 /aibdd.auto.php.it.handlers.command

        // Then 操作成功
        // [Handler: success-failure] 參考 /aibdd.auto.php.it.handlers.success-failure

        // And 用戶 "Alice" 在課程 1 的進度應為 80%
        // [Handler: aggregate-then] 參考 /aibdd.auto.php.it.handlers.aggregate-then

        $this->markTestIncomplete('尚未實作');
    }

    /**
     * @test
     * @testdox 進度倒退時應拋出例外
     */
    public function test_進度倒退時應拋出例外(): void
    {
        // Given 用戶 "Bob" 在課程 2 的進度為 80%
        // [Handler: aggregate-given] 參考 /aibdd.auto.php.it.handlers.aggregate-given

        // When 用戶 "Bob" 更新課程 2 的影片進度為 50%
        // [Handler: command] 參考 /aibdd.auto.php.it.handlers.command

        // Then 操作失敗，錯誤類型為 "InvalidStateException"
        // [Handler: success-failure] 參考 /aibdd.auto.php.it.handlers.success-failure

        $this->markTestIncomplete('尚未實作');
    }
}
```

---

## 5. Handler 判定決策樹（核心）

讀取每個 Gherkin 步驟後，依下表標註 Handler 類型：

```
Given → 狀態描述（「的...為」「包含」「有」）        → aggregate-given
Given → 已完成動作（「已訂閱」「已建立」「已註冊」）  → command
When  → 寫入操作（「更新」「建立」「刪除」「提交」）  → command
When  → 讀取操作（「查詢」「取得」「列出」「搜尋」）  → query
Then  → 操作成功/失敗（「操作成功」「錯誤訊息」）    → success-failure
Then  → DB 狀態驗證（「應為」+ 實體屬性）           → aggregate-then
Then  → Query 結果驗證（「查詢結果應」「列表應包含」）→ readmodel-then
And   → 繼承前一個 Then 的分類
But   → 繼承前一個步驟的分類
```

### 判定範例

| Gherkin 步驟 | Handler |
|--------------|---------|
| `Given 用戶 "Alice" 在課程 1 的進度為 50%` | aggregate-given |
| `Given 系統已建立訂單 #100` | command |
| `When 用戶 "Alice" 更新課程 1 的影片進度為 80%` | command |
| `When 查詢用戶 "Alice" 的課程列表` | query |
| `Then 操作成功` | success-failure |
| `Then 操作失敗，錯誤訊息為 "進度不可倒退"` | success-failure |
| `Then 用戶 "Alice" 在課程 1 的進度應為 80%` | aggregate-then |
| `Then 查詢結果應包含 3 筆記錄` | readmodel-then |

---

## 6. Scenario Outline 處理

Gherkin `Scenario Outline` + `Examples` 對應 PHPUnit `@dataProvider`。

### Gherkin 原始

```gherkin
Scenario Outline: 各狀態下更新進度
  Given 用戶 "<user>" 在課程 <course_id> 的進度為 <initial>%
  When 用戶 "<user>" 更新課程 <course_id> 的影片進度為 <target>%
  Then 結果應為 "<result>"

  Examples:
    | user  | course_id | initial | target | result |
    | Alice | 1         | 50      | 80     | 成功   |
    | Bob   | 2         | 80      | 50     | 失敗   |
```

### 生成骨架

```php
/**
 * @test
 * @testdox 各狀態下更新進度
 * @dataProvider 各狀態下更新進度Provider
 */
public function test_各狀態下更新進度(
    string $user,
    int $courseId,
    int $initial,
    int $target,
    string $result
): void {
    // Given 用戶 "<user>" 在課程 <course_id> 的進度為 <initial>%
    // [Handler: aggregate-given] 參考 /aibdd.auto.php.it.handlers.aggregate-given

    // When 用戶 "<user>" 更新課程 <course_id> 的影片進度為 <target>%
    // [Handler: command] 參考 /aibdd.auto.php.it.handlers.command

    // Then 結果應為 "<result>"
    // [Handler: success-failure] 參考 /aibdd.auto.php.it.handlers.success-failure

    $this->markTestIncomplete('尚未實作');
}

public static function 各狀態下更新進度Provider(): array
{
    return [
        ['Alice', 1, 50, 80, '成功'],
        ['Bob', 2, 80, 50, '失敗'],
    ];
}
```

### 型別推斷原則

| Examples 欄位樣式 | PHP 型別 |
|-------------------|----------|
| 純數字（如 `1`, `50`） | `int` |
| 小數（如 `99.9`） | `float` |
| 引號文字（如 `"Alice"`） | `string` |
| `true` / `false` | `bool` |
| 其他文字 | `string` |

---

## 7. 命名規則

| 項目 | 規則 | 範例 |
|------|------|------|
| Feature file | kebab-case | `update-video-progress.feature` |
| Test Class | PascalCase + `Test` | `UpdateVideoProgressTest` |
| Test Method | `test_` + 中文 scenario 名稱 | `test_成功增加影片進度` |
| 目錄 | `tests/integration/{Subdomain}/` | `tests/integration/Lesson/` |
| Namespace | `Tests\Integration\{Subdomain}` | `Tests\Integration\Lesson` |
| `@group` annotation | Feature slug (kebab-case) | `@group lesson-video-progress` |

### Subdomain 判定

依 Feature 檔所屬業務領域分類：

| 業務主題 | Subdomain |
|----------|-----------|
| 課程、章節、進度、影片 | `Lesson` |
| 訂單、付款、退款 | `Order` |
| 商品、庫存、價格 | `Product` |
| 用戶、註冊、登入 | `User` |
| 購物車、結帳 | `Cart` |

不明確時 → 詢問使用者確認。

---

## 8. 規則 R1–R7

| 規則 | 說明 |
|------|------|
| R1 | **永不覆蓋**：若 `{Feature}Test.php` 已存在，跳過並回報 |
| R2 | **一對一對應**：一個 `.feature` 檔 ⇒ 一個 Test class |
| R3 | **Scenario 對應**：一個 `Scenario` / `Example` ⇒ 一個 `test_*` method |
| R4 | **步驟保留**：Gherkin 步驟必須以 `// Given / // When / // Then` 註解保留 |
| R5 | **Handler 標註**：每個步驟下一行標註 `// [Handler: xxx] 參考 /...` |
| R6 | **空殼方法體**：方法最後一行為 `$this->markTestIncomplete('尚未實作');` |
| R7 | **Outline 轉 Provider**：`Scenario Outline` ⇒ `@dataProvider` + `Examples` ⇒ static provider method |

---

## 9. 完成條件 Checklist

骨架生成完成前確認：

- [ ] Test class 檔案建立於 `tests/integration/{Subdomain}/{Feature}Test.php`
- [ ] 檔頭有 `declare(strict_types=1);`
- [ ] Namespace 正確（`Tests\Integration\{Subdomain}`）
- [ ] 繼承 `IntegrationTestCase`
- [ ] 實作 `configure_dependencies()`（可含 TODO）
- [ ] 每個 Scenario 對應一個 `test_*` method
- [ ] 每個 method 有 `@test` + `@testdox` PHPDoc
- [ ] 每個步驟有 `// Given/When/Then` 註解保留原文
- [ ] 每個步驟有 `// [Handler: xxx]` 標註
- [ ] 每個 method 以 `markTestIncomplete` 結尾
- [ ] `Scenario Outline` 轉為 `@dataProvider` 模式
- [ ] 既有檔案未被覆蓋

完成後回報：
- 生成的 Test class 路徑
- test method 數量
- 跳過（已存在）的檔案清單
- 下一步：建議執行 `/aibdd.auto.php.it.red`（Stage 2）
