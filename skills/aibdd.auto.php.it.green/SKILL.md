---
name: aibdd.auto.php.it.green
description: PHP IT Stage 3：綠燈階段。實作 WP DB Repository（真實 WordPress 資料庫操作）+ Service 業務邏輯。Trial-and-error 循環直到測試通過。
user-invocable: true
argument-hint: "[feature-file]"
---

**Input**: tests/features/**/*.feature, src/Repositories/*.php, src/Services/*.php
**Output**: src/Repositories/*.php（完整實作）, src/Services/*.php（完整實作）

# 角色

Integration Test 綠燈階段協調器。

**核心任務**：實作最簡單的業務邏輯，讓測試從紅燈變成綠燈。

---

# 入口條件（雙模式）

## 模式 A：獨立使用
## 模式 B：被 /aibdd.auto.php.it.control-flow 調用

---

# 綠燈階段的核心原則

## 可以做的事
- 實作 WP DB Repository（真實 WordPress 資料庫操作）
- 實作 Service 業務邏輯
- 建立自定義例外類別
- 讓測試通過

## 不可以做的事
- 不要過度設計
- 不要加入測試沒有要求的功能
- 不要優化程式碼

---

# WP Storage Decision Guide

根據 Entity 特性選擇正確的 WordPress 儲存機制：

```
Entity 有 title/body/author lifecycle → Custom Post Type
  save() → wp_insert_post() / wp_update_post()
  find() → get_post() + get_post_meta()

User-specific data → User Meta
  save() → update_user_meta()
  find() → get_user_meta()

Simple key-value config → Options API
  save() → update_option()
  find() → get_option()

Categorization → Custom Taxonomy
  save() → wp_set_object_terms()
  find() → wp_get_object_terms()

Complex queries / performance → Custom DB table ($wpdb)
  save() → $wpdb->insert() / $wpdb->update()
  find() → $wpdb->get_row() / $wpdb->get_results()

Default fallback → Post Meta
  save() → update_post_meta()
  find() → get_post_meta()
```

---

# WP DB Repository 範例（Post Meta 儲存）

```php
// src/Repositories/LessonProgressRepository.php（綠燈 - Post Meta）
class LessonProgressRepository
{
    private const META_PREFIX = '_lesson_progress_';

    public function save(LessonProgress $entity): void
    {
        $metaKey = self::META_PREFIX . $entity->lessonId;
        $data = [
            'progress' => $entity->progress,
            'status' => $entity->status,
        ];
        update_user_meta((int) $entity->userId, $metaKey, $data);
    }

    public function find(string $userId, int $lessonId): ?LessonProgress
    {
        $metaKey = self::META_PREFIX . $lessonId;
        $data = get_user_meta((int) $userId, $metaKey, true);

        if (empty($data)) {
            return null;
        }

        $entity = new LessonProgress();
        $entity->userId = $userId;
        $entity->lessonId = $lessonId;
        $entity->progress = $data['progress'];
        $entity->status = $data['status'];
        return $entity;
    }

    /** @return LessonProgress[] */
    public function findAll(): array
    {
        // 根據需要實作
        throw new \BadMethodCallException('尚未實作');
    }

    // 不需要 clear() method — WP_UnitTestCase 自動 rollback
}
```

---

# WP DB Repository 範例（Custom Post Type 儲存）

```php
// src/Repositories/CourseRepository.php（綠燈 - CPT）
class CourseRepository
{
    public function save(Course $entity): int
    {
        $postData = [
            'post_type' => 'course',
            'post_title' => $entity->title,
            'post_content' => $entity->description,
            'post_status' => 'publish',
        ];

        if ($entity->id) {
            $postData['ID'] = $entity->id;
            wp_update_post($postData);
            $postId = $entity->id;
        } else {
            $postId = wp_insert_post($postData);
        }

        update_post_meta($postId, '_course_price', $entity->price);
        update_post_meta($postId, '_course_duration', $entity->duration);

        return $postId;
    }

    public function find(int $id): ?Course
    {
        $post = get_post($id);
        if (!$post || $post->post_type !== 'course') {
            return null;
        }

        $entity = new Course();
        $entity->id = $post->ID;
        $entity->title = $post->post_title;
        $entity->description = $post->post_content;
        $entity->price = (float) get_post_meta($post->ID, '_course_price', true);
        $entity->duration = (int) get_post_meta($post->ID, '_course_duration', true);
        return $entity;
    }
}
```

---

# WP DB Repository 範例（Custom Table 儲存）

```php
// src/Repositories/EnrollmentRepository.php（綠燈 - Custom Table）
class EnrollmentRepository
{
    private function table_name(): string
    {
        global $wpdb;
        return $wpdb->prefix . 'enrollments';
    }

    public function save(Enrollment $entity): void
    {
        global $wpdb;

        $existing = $this->find($entity->userId, $entity->courseId);
        if ($existing) {
            $wpdb->update(
                $this->table_name(),
                ['status' => $entity->status, 'enrolled_at' => $entity->enrolledAt],
                ['user_id' => $entity->userId, 'course_id' => $entity->courseId],
                ['%s', '%s'],
                ['%d', '%d']
            );
        } else {
            $wpdb->insert(
                $this->table_name(),
                [
                    'user_id' => $entity->userId,
                    'course_id' => $entity->courseId,
                    'status' => $entity->status,
                    'enrolled_at' => $entity->enrolledAt,
                ],
                ['%d', '%d', '%s', '%s']
            );
        }
    }

    public function find(int $userId, int $courseId): ?Enrollment
    {
        global $wpdb;
        $row = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_name()} WHERE user_id = %d AND course_id = %d",
                $userId,
                $courseId
            )
        );

        if (!$row) {
            return null;
        }

        $entity = new Enrollment();
        $entity->userId = (int) $row->user_id;
        $entity->courseId = (int) $row->course_id;
        $entity->status = $row->status;
        $entity->enrolledAt = $row->enrolled_at;
        return $entity;
    }
}
```

---

# Service 範例

```php
// src/Services/LessonService.php（綠燈）
class LessonService
{
    public function __construct(private readonly LessonProgressRepository $repo) {}

    public function updateVideoProgress(string $userId, int $lessonId, int $progress): void
    {
        $current = $this->repo->find($userId, $lessonId);

        if ($current === null) {
            $entity = new LessonProgress();
            $entity->userId = $userId;
            $entity->lessonId = $lessonId;
            $entity->progress = $progress;
            $entity->status = 'IN_PROGRESS';
            $this->repo->save($entity);
            return;
        }

        if ($progress < $current->progress) {
            throw new InvalidStateException('進度不可倒退');
        }

        $current->progress = $progress;
        if ($progress >= 100) {
            $current->status = 'COMPLETED';
        }
        $this->repo->save($current);
    }
}
```

---

# 自定義例外

```php
// src/Exceptions/InvalidStateException.php
class InvalidStateException extends \RuntimeException {}

// src/Exceptions/NotFoundException.php
class NotFoundException extends \RuntimeException {}
```

---

# 工作流程

1. 執行 PHPUnit 確認紅燈
2. 確定 Entity-to-WP-Storage 映射
3. 實作 WP DB Repository（真實 WordPress 資料庫操作）
4. 實作 Service 業務邏輯
5. 執行 PHPUnit 確認綠燈
6. 回歸測試

```bash
npx wp-env run cli --env-cwd=wp-content/plugins/{plugin-name} vendor/bin/phpunit
```

---

# Critical Rules

### R1: 只寫能讓測試通過的最簡單邏輯
### R2: Repository 使用真實 WordPress DB（不用 array/FakeRepository）
### R3: 依賴透過 IntegrationTestCase configure_dependencies() 初始化
### R4: 共用 Repository 實例
### R5: 不要重構
### R6: 必須執行完整回歸測試
### R7: 不需要 clear() method（WP_UnitTestCase 自動 rollback DB）

---

# 完成條件

- WP DB Repository 完整實作（使用真實 WordPress 資料庫）
- Service 實作最簡單的業務邏輯
- PHPUnit 所有測試通過
