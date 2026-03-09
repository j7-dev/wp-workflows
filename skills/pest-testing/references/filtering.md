# 篩選與跳過測試
> 來源：https://pestphp.com/docs/skipping-tests, https://pestphp.com/docs/grouping-tests, https://pestphp.com/docs/filtering-tests
> 最後更新：2026-02-23

---

## 跳過測試 (Skipping Tests)

### `skip()` — 暫時停用測試

```php
it('has home', function () {
    //
})->skip();
```

提供跳過原因：

```php
it('has home', function () {
    //
})->skip('temporarily unavailable');
```

### 條件跳過

```php
it('has home', function () {
    //
})->skip($condition == true, 'temporarily unavailable');
```

使用 closure 延遲求值（在 `beforeEach()` 後才評估）：

```php
it('has home', function () {
    //
})->skip(fn () => DB::getDriverName() !== 'mysql', 'db driver not supported');
```

### 環境跳過

```php
it('has home', function () {
    //
})->skipLocally();   // 本機執行時跳過
})->skipOnCi();      // CI 環境時跳過
```

### 作業系統跳過

```php
it('has home', function () {
    //
})->skipOnWindows();
})->skipOnMac();
})->skipOnLinux();

// 只在特定 OS 執行
})->onlyOnWindows();
})->onlyOnMac();
})->onlyOnLinux();
```

### PHP 版本跳過

```php
it('has home', function () {
    //
})->skipOnPhp('>=8.0.0'); // 支援 >, >=, <, <=
```

### 跳過整個測試檔案

在 `beforeEach()` 中呼叫：

```php
beforeEach()->skip(); // 或 skipOnCi() 等
```

---

## Todo 測試

標記測試為 todo（不忘記要寫）：

```php
it('has home', function () {
    //
})->todo();
```

---

## 分組測試 (Grouping Tests)

### 在 `Pest.php` 設定分組

```php
pest()->extend(TestCase::class)
    ->group('feature')
    ->in('Feature');
```

### 測試個別設定分組

```php
it('has home', function () {
    //
})->group('feature');

// 多個群組
it('has home', function () {
    //
})->group('feature', 'browser');
```

### describe 區塊設定分組

```php
describe('home', function () {
    test('main page', function () {
        //
    });
})->group('feature');
```

### 整個檔案設定分組

```php
pest()->group('feature');

it('has home', function () {
    //
});
```

### 執行特定群組

```bash
./vendor/bin/pest --group=feature
./vendor/bin/pest --group=integration --group=browser
```

---

## 篩選測試 (Filtering Tests)

### 執行單一測試檔案

```bash
./vendor/bin/pest tests/Unit/TestExample.php
```

### `--bail` — 遇到第一個失敗就停止

```bash
./vendor/bin/pest --bail
```

### `--dirty` — 只執行有未提交變更的測試

```bash
./vendor/bin/pest --dirty
```

> 注意：使用 PHPUnit 語法撰寫的測試案例始終被視為 dirty。

### `--filter` — 依描述過濾測試

```bash
./vendor/bin/pest --filter "test description"
```

### `--group` / `--exclude-group`

```bash
./vendor/bin/pest --group=integration
./vendor/bin/pest --exclude-group=integration
./vendor/bin/pest --exclude-group=integration --exclude-group=browser
```

### `--retry` — 優先執行之前失敗的測試

```bash
./vendor/bin/pest --retry
```

### `only()` — 只執行特定測試

#### 整個測試檔案只執行

```php
<?php

pest()->only();

test('first test', function () {
    // 會執行
});

test('second test', function () {
    // 也會執行
});
```

#### 只執行單一測試

```php
test('sum', function () {
    expect(sum(1, 2))->toBe(3);
})->only();

test('another test', function () {
    // 此測試會被跳過
});
```
