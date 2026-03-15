---
name: aibdd.auto.php.it.handlers.command
description: 當在 Gherkin 中撰寫寫入操作步驟（Given 已完成 / When 執行中），務必參考此規範。直接呼叫 Service 方法。
user-invocable: false
---

# Command-Handler (Integration Test Version)

## Role

負責實作 `Given`（已完成的動作）和 `When`（執行中的動作）步驟中的 Command 操作。

**核心任務**：直接呼叫 Service 方法執行寫入操作。

---

## ⚠️ 與 Behat 版本的差異

| 項目 | Behat 版本 | Integration Test 版本 |
|------|-----------|----------------------|
| Service 存取 | `$this->feature->services->*` | **`$this->services->*`** |
| 錯誤存取 | `$this->feature->lastError` | **`$this->lastError`** |
| ID 映射 | `$this->feature->ids[$userName]` | **`$this->ids[$userName]`** |
| 注入方式 | 建構子注入 FeatureContext | **繼承 IntegrationTestCase** |
| DataTable | `TableNode $table` | **PHP array** |
| DocString | `PyStringNode $content` | **PHP string literal** |

---

## ⚠️ 呼叫方式：直接呼叫 Service

| 項目 | E2E 版本 | Integration Test 版本 |
|------|---------|----------------------|
| 執行方式 | HTTP POST | **直接呼叫 Service 方法** |
| 認證 | Cookie/Session | **不需認證** |
| 結果處理 | HTTP Response | **捕獲 Throwable** |
| 依賴注入 | WordPress hooks | **IntegrationTestCase set_up()** |

---

## Given vs When

### Given（已完成的動作）

```php
public function test_scenario(): void
{
    // Given 用戶 Alice 已訂閱旅程 101
    $userId = $this->ids['Alice'];
    // Given 假設成功，不需要 try-catch
    $this->services->journey->subscribe((string) $userId, 101);

    // When ...
    // Then ...
}
```

### When（執行中的動作）

```php
public function test_update_progress(): void
{
    // Given ...

    // When 用戶 Alice 更新課程 101 的影片進度為 80%
    $userId = $this->ids['Alice'];
    try {
        $this->services->lesson->updateVideoProgress((string) $userId, 101, 80);
        $this->lastError = null;
    } catch (\Throwable $e) {
        $this->lastError = $e;
    }

    // Then ...
}
```

---

## 處理 DataTable（轉為 PHP array）

```php
public function test_batch_create_users(): void
{
    // When 管理員批次建立以下用戶
    $users = [
        ['name' => 'Alice', 'email' => 'alice@example.com'],
        ['name' => 'Bob', 'email' => 'bob@example.com'],
    ];

    try {
        foreach ($users as $row) {
            $this->services->user->register($row['name'], $row['email']);
        }
        $this->lastError = null;
    } catch (\Throwable $e) {
        $this->lastError = $e;
    }

    // Then ...
}
```

---

## 處理 DocString（轉為 PHP string）

```php
public function test_submit_assignment(): void
{
    // Given ...

    // When 用戶 Alice 提交作業
    $userId = $this->ids['Alice'];
    $content = "這是作業內容\n包含多行文字";

    try {
        $this->services->assignment->submit((string) $userId, $content);
        $this->lastError = null;
    } catch (\Throwable $e) {
        $this->lastError = $e;
    }

    // Then ...
}
```

---

## Critical Rules

### R1: 所有 When 步驟必須捕獲錯誤（try-catch）
### R2: Given 通常不需要捕獲錯誤
### R3: 從 $this->services 取得 Service（不需要 FeatureContext）
### R4: userName → userId 轉換透過 $this->ids
### R5: DataTable 轉為 PHP array（不使用 TableNode）
### R6: DocString 轉為 PHP string literal（不使用 PyStringNode）
### R7: lastError 是 IntegrationTestCase 的 protected 屬性

---

**文件版本**：Integration Test PHPUnit Version 1.0
**適用框架**：PHP 8.2+ + PHPUnit 9.x + wp-env + WordPress
