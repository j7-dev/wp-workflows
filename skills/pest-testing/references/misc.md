# 其他
> 來源：https://pestphp.com/docs/upgrade-guide, https://pestphp.com/docs/migrating-from-phpunit-guide
> 最後更新：2026-02-23

---

## 升級指南（Upgrade Guide）

### Pest 4.x（從 3.x 升級）

> **預計升級時間：** 2 分鐘

**需求：** PHP 8.3+

#### 更新依賴

```json
// composer.json
-    "pestphp/pest": "^3.0",
+    "pestphp/pest": "^4.0",
-    "pestphp/pest-plugin-laravel": "^3.0",
+    "pestphp/pest-plugin-laravel": "^4.0",
```

#### 快照測試（Breaking Change）

快照名稱產生方式改變，需重建所有快照：

```bash
./vendor/bin/pest --update-snapshots
```

#### PHPUnit 12

Pest 4 基於 PHPUnit 12，請檢查 [PHPUnit 12 changelog](https://github.com/sebastianbergmann/phpunit/blob/12.0.0/ChangeLog-12.0.md)。

#### 已移除的外掛

- `pestphp/pest-plugin-watch` — 已封存移除
- `pestphp/pest-plugin-faker` — 已封存移除

---

### Pest 3.x（從 2.x 升級）

> **預計升級時間：** 2 分鐘

**需求：** PHP 8.2+

#### 更新依賴

```json
-    "pestphp/pest": "^2.0",
+    "pestphp/pest": "^3.0",
-    "nunomaduro/collision": "^7.0",   // Laravel 使用者
+    "nunomaduro/collision": "^8.0",   // 需要 Laravel 11
```

#### PHPUnit 11

Pest 3 基於 PHPUnit 11，請檢查 [PHPUnit 11 changelog](https://github.com/sebastianbergmann/phpunit/blob/11.0.0/ChangeLog-11.0.md)。

#### Arch Expectations 變更

`toHaveMethod` 和 `toHaveMethods` 不再接受物件實例：

```php
-expect($object)->toHaveMethod('method');
+expect($object::class)->toHaveMethod('method');
```

#### `tap()` 移除

```php
it('creates admins')
-    ->tap(fn () => $this->artisan('user:create --admin'))
+    ->defer(fn () => $this->artisan('user:create --admin'))
     ->assertDatabaseHas('users', ['id' => 1]);
```

---

### Pest 2.x（從 1.x 升級）

> **預計升級時間：** 2 分鐘

**需求：** PHP 8.1+

#### 更新依賴

```json
-    "pestphp/pest": "^1.22",
+    "pestphp/pest": "^2.0",
-    "phpunit/phpunit": "^9.5.10",     // 移除，現已內建
-    "brianium/paratest": "^6.8.1",    // 移除，平行測試已內建
-    "pestphp/pest-plugin-parallel": "^1.2.1",  // 移除
-    "pestphp/pest-plugin-global-assertions": "^1.0.0",  // 已封存
-    "nunomaduro/collision": "^6.0",   // Laravel 使用者
+    "nunomaduro/collision": "^7.0",   // 需要 Laravel 10
```

#### PHPUnit 10 設定遷移

若看到 XML 設定警告：

```bash
./vendor/bin/pest --migrate-configuration
```

#### Faker 重命名

```php
- use function Pest\Faker\faker;
+ use function Pest\Faker\fake;

-   expect(faker()->name())->toBeString();
+   expect(fake()->name())->toBeString();
```

#### Bound Datasets 需型別標註

```php
-it('...', function ($user, $fullName) {
+it('...', function (User $user, $fullName) {
```

#### Global Assertions 替代方案

```php
-   assertSame(3, $result);
+   $this->assertSame(3, $result); // 或 expect($result)->toBe(3)
```

#### `tap()` 廢棄（改用 `defer()`）

```php
it('creates admins')
-    ->tap(fn () => ...)
+    ->defer(fn () => ...)
     ->assertDatabaseHas(...);
```

---

## 從 PHPUnit 遷移（Migrating from PHPUnit）

Pest 建構於 PHPUnit 之上，遷移非常簡單。

### 使用 Drift 自動轉換

安裝 Drift 外掛：

```bash
composer require pestphp/pest-plugin-drift --dev
```

執行自動轉換：

```bash
./vendor/bin/pest --drift
```

### 轉換範例

**PHPUnit 原始碼：**

```php
<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class ExampleTest extends TestCase
{
    public function test_that_true_is_true(): void
    {
        $this->assertTrue(true);
    }
}
```

**Pest 轉換後：**

```php
test('true is true', function () {
    expect(true)->toBeTrue();
});
```

### 只轉換特定目錄

```bash
./vendor/bin/pest --drift tests/Helpers
```

輸出：

```
✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔

INFO  The [tests/Helpers] directory has been migrated to PEST with XY files changed.
```

大多數測試會自動轉換，少數情況可能需要手動調整。
