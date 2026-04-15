---
name: aibdd.auto.php.it.refactor
description: >
  PHP IT Stage 4：重構階段。在測試保護下，小步驟改善程式碼品質。
  兩階段工作流：Phase A 重構測試程式碼 → 跑測試 → Phase B 重構生產程式碼 → 跑測試。
  嚴格遵守 /aibdd.auto.php.it.code-quality 規範。
  可被 /aibdd.auto.php.it.control-flow 調用，也可獨立使用。
---

# PHP IT Refactor（Stage 4）

## 1. 角色定位

本 skill 為 AI-BDD 4 階段流程中的 **Stage 4 重構協調者**：

```
Stage 1: test-skeleton
Stage 2: red
Stage 3: green
Stage 4: refactor  ← 本 skill
```

在全綠燈保護下，以**小步驟、連續測試**的方式改善程式碼品質。

**嚴格遵守** `/aibdd.auto.php.it.code-quality` 規範（透過 skill 載入）。

---

## 2. 前置條件

重構啟動前**必須**確認：

1. 目標 Test class 所有測試為**綠燈**
2. 工作目錄乾淨或變更可追蹤（建議先 commit Stage 3 的成果）
3. 已載入 `/aibdd.auto.php.it.code-quality` 規範

若有紅燈 → **拒絕執行**，提示先回到 Stage 3 修復。

---

## 3. 兩階段工作流

```
┌─────────────────────────────────┐
│    執行測試（確認全綠）         │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│ 【Phase A】重構測試程式碼       │
│   tests/integration/            │
│   - 刪除 TODO 註解              │
│   - 刪除 [Handler: xxx] 標註    │
│   - 改善變數命名                │
│   - 簡化重複邏輯                │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│    執行測試（仍全綠）           │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│ 【Phase B】重構生產程式碼       │
│   src/                          │
│   - 套用 SOLID                  │
│   - Early Return                │
│   - 抽取常數                    │
│   - 改善命名 / 型別宣告         │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│    執行測試（仍全綠）           │
└──────────────┬──────────────────┘
               ↓
            完成
```

> **階段順序不可顛倒！**
> Why：必須先清除測試中的 Handler 標註與 TODO，使測試成為純粹的業務意圖表達；
> 之後重構產品程式碼時，才能以「清楚的業務語意」作為重構方向的依據。

---

## 4. Phase A：測試程式碼重構

### 範圍

`tests/integration/**/*.php`

### 任務

1. 刪除所有 `// TODO:` 註解
2. 刪除所有 `// [Handler: xxx] 參考 /aibdd.auto.php.it.handlers.xxx` 標註
3. **保留** `// Given / // When / // Then` 業務語意註解
4. 改善變數命名（縮寫 → 語意化）
5. 簡化重複的準備邏輯（謹慎抽取，三次以上才抽）
6. 加入缺漏的型別宣告

### 範例對照

**Before**

```php
public function test_成功增加影片進度(): void
{
    // Given 用戶 "Alice" 在課程 1 的進度為 50%
    // [Handler: aggregate-given] 參考 /aibdd.auto.php.it.handlers.aggregate-given
    // TODO: 實作測試程式碼
    $u = $this->factory()->user->create(['display_name' => 'Alice']);
    $this->ids['Alice'] = $u;

    $p = new LessonProgress($u, 1, 50, 'in_progress');
    $this->repos->lessonProgress->save($p);

    // When 用戶 "Alice" 更新課程 1 的影片進度為 80%
    // [Handler: command] 參考 /aibdd.auto.php.it.handlers.command
    try {
        $this->services->lesson->updateVideoProgress($u, 1, 80);
    } catch (\Throwable $e) {
        $this->lastError = $e;
    }

    // Then 操作成功
    // [Handler: success-failure] 參考 /aibdd.auto.php.it.handlers.success-failure
    $this->assert_operation_succeeded();

    // And 用戶 "Alice" 在課程 1 的進度應為 80%
    // [Handler: aggregate-then] 參考 /aibdd.auto.php.it.handlers.aggregate-then
    $r = $this->repos->lessonProgress->find($u, 1);
    $this->assertSame(80, $r->getProgress());
}
```

**After**

```php
public function test_成功增加影片進度(): void
{
    // Given 用戶 "Alice" 在課程 1 的進度為 50%
    $userId = $this->factory()->user->create(['display_name' => 'Alice']);
    $this->ids['Alice'] = $userId;

    $initialProgress = new LessonProgress($userId, 1, 50, 'in_progress');
    $this->repos->lessonProgress->save($initialProgress);

    // When 用戶 "Alice" 更新課程 1 的影片進度為 80%
    try {
        $this->services->lesson->updateVideoProgress($userId, 1, 80);
    } catch (\Throwable $e) {
        $this->lastError = $e;
    }

    // Then 操作成功
    $this->assert_operation_succeeded();

    // And 用戶 "Alice" 在課程 1 的進度應為 80%
    $updated = $this->repos->lessonProgress->find($userId, 1);
    $this->assertSame(80, $updated->getProgress());
}
```

### Phase A 結束條件

- [ ] 無 `// TODO:` 殘留
- [ ] 無 `// [Handler:` 標註殘留
- [ ] `// Given/When/Then` 業務註解完整保留
- [ ] 變數命名具語意
- [ ] 所有測試仍為綠燈

---

## 5. Phase B：生產程式碼重構

### 範圍

```
src/Models/
src/Repositories/
src/Services/
src/Exceptions/
```

### 任務

1. 套用 SOLID（單一職責、依賴反轉為主）
2. Early Return / Guard Clause 取代深層巢狀
3. 抽取 magic number 為 `private const`
4. 改善 method / class 命名（表達意圖）
5. 加入 `declare(strict_types=1);`
6. 補齊參數與回傳型別宣告
7. Nullable 使用 `?Type` 明確化
8. SQL：確認所有 `$wpdb` 呼叫使用 `prepare()`

> 詳細規範請載入 `/aibdd.auto.php.it.code-quality`。

### Service 重構範例

**Before**

```php
<?php

class LessonService
{
    private $repo;

    public function __construct($repo)
    {
        $this->repo = $repo;
    }

    public function updateVideoProgress($userId, $lessonId, $progress)
    {
        $existing = $this->repo->find($userId, $lessonId);
        if ($existing) {
            if ($progress <= $existing->getProgress()) {
                throw new \Exception("進度不可倒退");
            }
        }
        if ($progress < 0 || $progress > 100) {
            throw new \Exception("進度超出範圍");
        }
        $p = new LessonProgress($userId, $lessonId, $progress,
            $progress >= 100 ? 'completed' : 'in_progress');
        $this->repo->save($p);
    }
}
```

**After**

```php
<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\LessonProgress;
use App\Repositories\LessonProgressRepositoryInterface;
use App\Exceptions\InvalidStateException;

class LessonService
{
    private const PROGRESS_MIN = 0;
    private const PROGRESS_MAX = 100;
    private const COMPLETION_THRESHOLD = 100;

    public function __construct(
        private LessonProgressRepositoryInterface $progressRepo,
    ) {}

    public function updateVideoProgress(int $userId, int $lessonId, int $progress): void
    {
        $this->assertProgressInRange($progress);

        $existing = $this->progressRepo->findByUserAndLesson($userId, $lessonId);
        if ($existing !== null && $progress <= $existing->getProgress()) {
            throw new InvalidStateException('進度不可倒退');
        }

        $status = $this->resolveStatus($progress);
        $this->progressRepo->save(
            new LessonProgress($userId, $lessonId, $progress, $status)
        );
    }

    private function assertProgressInRange(int $progress): void
    {
        if ($progress < self::PROGRESS_MIN || $progress > self::PROGRESS_MAX) {
            throw new InvalidStateException('進度必須在 0-100 之間');
        }
    }

    private function resolveStatus(int $progress): string
    {
        return $progress >= self::COMPLETION_THRESHOLD ? 'completed' : 'in_progress';
    }
}
```

### Phase B 結束條件

- [ ] 檔頭有 `declare(strict_types=1);`
- [ ] 所有方法有完整型別宣告
- [ ] Magic number 已抽為常數
- [ ] 無深層 `if` 巢狀（Early Return）
- [ ] Service 不直接使用 `$wpdb`
- [ ] 所有 `$wpdb` 查詢使用 `prepare()`
- [ ] 所有測試仍為綠燈

---

## 6. 測試命令

### 本機 PHPUnit

```bash
vendor/bin/phpunit --testsuite integration
```

### wp-env Docker 環境

```bash
npx wp-env run tests-cli --env-cwd=wp-content/plugins/{plugin} \
    vendor/bin/phpunit --testsuite integration
```

### 單一 Test Class

```bash
vendor/bin/phpunit tests/integration/Lesson/UpdateVideoProgressTest.php
```

### 單一 Test Method

```bash
vendor/bin/phpunit --filter test_成功增加影片進度 \
    tests/integration/Lesson/UpdateVideoProgressTest.php
```

---

## 7. 安全規則 R1–R7

| 規則 | 說明 |
|------|------|
| R1 | **每步測試**：每次修改後立即跑測試，紅燈立即還原該次修改 |
| R2 | **一次一件事**：不同時改多處（一個命名 / 一次抽取 / 一個 Early Return） |
| R3 | **不改外部行為**：公開 API 契約、資料庫 schema、WP Hook 名稱保持不變 |
| R4 | **不強行重構**：已足夠清晰的程式碼保持原樣 |
| R5 | **禁止自動抽共用 helpers**：除非使用者明確要求或三次以上重複 |
| R6 | **禁止跨檔搬動**：優先於原檔內改善，避免一次性大規模檔案移動 |
| R7 | **DRY 三次法則**：重複出現三次以上才抽取 |

---

## 8. 重構邊界

**禁止**在本階段做的事：

- ❌ 新增功能（欄位、方法、endpoint）
- ❌ 修改測試行為（Phase A 不能把紅燈改綠，也不能改 assertion）
- ❌ 修改 DB schema / migration
- ❌ 修改 WordPress Hook 訂閱名稱或時機
- ❌ 效能優化（除非明顯 N+1 等重大問題）
- ❌ 跨 Feature 的大規模重構（僅限本次 Feature 涉及的檔案）

若發現需要上述變更 → **停止重構**，回報使用者並建議另開新 Feature。

---

## 9. 完成條件 Checklist

### 整體
- [ ] Phase A 與 Phase B 皆完成
- [ ] 最終測試全綠
- [ ] 無新增跳過（skipped / incomplete）測試
- [ ] Git diff 僅包含本 Feature 相關檔案

### Phase A（測試碼）
- [ ] TODO 註解清除完畢
- [ ] Handler 標註清除完畢
- [ ] Gherkin 語意註解完整保留
- [ ] 變數命名具語意

### Phase B（生產碼）
- [ ] 符合 `/aibdd.auto.php.it.code-quality` 所有檢查項
- [ ] SOLID 合規
- [ ] 型別宣告完整
- [ ] WordPress 安全實踐（prepare、sanitize、escape）
- [ ] 3 層架構未被破壞

### 回報內容

完成後輸出：
1. 修改檔案清單（tests/ 與 src/ 分別列出）
2. 每個檔案的重構重點（1-2 句話）
3. 測試結果（通過 / 總數）
4. 是否有延後處理的重構建議（未納入本次但值得記錄）
