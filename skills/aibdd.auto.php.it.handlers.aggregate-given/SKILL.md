---
name: aibdd.auto.php.it.handlers.aggregate-given
description: 當在 Gherkin 測試中進行「Aggregate 初始狀態建立」，「只能」使用此指令。使用 WP Factory Methods + WP APIs 建立測試資料。
user-invocable: false
---

# Aggregate-Given-Handler (Integration Test Version)

## Role

負責實作 `Given` 步驟中建立 Aggregate 初始狀態的邏輯。

**核心任務**：透過 WP Factory Methods + Repository（使用真實 WordPress DB）建立 Aggregate 初始資料。

---

## ⚠️ 與 Behat 版本的關鍵差異

| 項目 | Behat 版本 | Integration Test 版本 |
|------|-----------|----------------------|
| 資料建立 | FakeRepository `save()` | **WP Factory + WP APIs** |
| 存取 | `$this->feature->repos->*` | **`$this->repos->*`** |
| 程式碼位置 | 獨立 Context class | **test method 內的 inline code** |
| DataTable | `TableNode $table` + `$table->getHash()` | **PHP array** |
| DocString | `PyStringNode $bio` + `$bio->getRaw()` | **PHP string literal** |
| ID 管理 | `$this->feature->ids[$userName]` | **`$this->ids[$userName]`** |

---

## WP Factory Methods（建立基礎 WP 物件）

```php
// 建立用戶
$userId = $this->factory()->user->create([
    'user_login' => 'alice',
    'display_name' => 'Alice',
    'role' => 'subscriber',
]);
$this->ids['Alice'] = $userId;

// 建立文章（CPT 或 post）
$postId = $this->factory()->post->create([
    'post_title' => 'Test Lesson',
    'post_type' => 'lesson',
    'post_status' => 'publish',
    'post_author' => $userId,
]);

// 建立分類
$termId = $this->factory()->term->create([
    'taxonomy' => 'lesson_category',
    'name' => 'PHP',
]);
```

---

## 透過 Repository 建立 Aggregate（使用真實 WP DB）

```php
class LessonProgressTest extends IntegrationTestCase
{
    protected function configure_dependencies(): void
    {
        $this->repos->lessonProgress = new LessonProgressRepository();
        $this->services->lesson = new LessonService($this->repos->lessonProgress);
    }

    public function test_update_progress(): void
    {
        // Given 用戶 Alice 在課程 101 的進度為 50%，狀態為 進行中

        // 1. 取得或建立用戶 ID
        $userId = $this->factory()->user->create(['user_login' => 'alice']);
        $this->ids['Alice'] = $userId;

        // 2. 狀態映射
        $statusMap = [
            '進行中' => 'IN_PROGRESS',
            '已完成' => 'COMPLETED',
            '未開始' => 'NOT_STARTED',
        ];

        // 3. 建立 Aggregate 並儲存到 Repository（真實 WP DB）
        $entity = new LessonProgress();
        $entity->userId = (string) $userId;
        $entity->lessonId = 101;
        $entity->progress = 50;
        $entity->status = $statusMap['進行中'];

        $this->repos->lessonProgress->save($entity);

        // When ...
        // Then ...
    }
}
```

---

## 處理 DataTable（轉為 PHP array）

```php
// Gherkin:
// Given 系統中有以下課程：
//   | lessonId | name       |
//   | 101      | PHP 基礎    |
//   | 102      | WordPress  |

public function test_with_multiple_lessons(): void
{
    // Given 系統中有以下課程
    $lessons = [
        ['lessonId' => 101, 'name' => 'PHP 基礎'],
        ['lessonId' => 102, 'name' => 'WordPress'],
    ];

    foreach ($lessons as $row) {
        $this->factory()->post->create([
            'post_type' => 'lesson',
            'post_title' => $row['name'],
            'meta_input' => ['lesson_id' => $row['lessonId']],
        ]);
    }

    // When ...
    // Then ...
}
```

---

## 處理 DocString（轉為 PHP string）

```php
// Gherkin:
// Given 用戶 Alice 的個人簡介為：
//   """
//   這是一段個人簡介
//   包含多行文字
//   """

public function test_user_with_bio(): void
{
    // Given 用戶 Alice 的個人簡介
    $userId = $this->factory()->user->create(['user_login' => 'alice']);
    $this->ids['Alice'] = $userId;

    $bio = "這是一段個人簡介\n包含多行文字";
    update_user_meta($userId, 'bio', $bio);

    // When ...
    // Then ...
}
```

---

## WP Storage Decision Guide

建立 Aggregate 初始資料時，根據 Entity 特性選擇正確的 WP 儲存機制：

```
Entity 有 title/body/author lifecycle → Custom Post Type + $this->factory()->post->create()
User-specific data                    → User Meta + $this->factory()->user->create()
Simple key-value config               → Options API + update_option()
Categorization                        → Custom Taxonomy + $this->factory()->term->create()
Complex queries / performance         → Custom DB table + $wpdb->insert()
Default fallback                      → Post Meta + update_post_meta()
```

---

## Critical Rules

### R1: 不透過 Service（直接使用 Repository 或 WP APIs）
### R2: 從 $this->repos 取得 Repository（不需要 FeatureContext）
### R3: userName → userId 映射存入 $this->ids
### R4: 狀態映射（中文 → 英文 enum）
### R5: DataTable 轉為 PHP array（不使用 TableNode）
### R6: DocString 轉為 PHP string literal（不使用 PyStringNode）
### R7: 使用 WP Factory Methods 建立基礎 WP 物件

---

**文件版本**：Integration Test PHPUnit Version 1.0
**適用框架**：PHP 8.2+ + PHPUnit 9.x + wp-env + WordPress
