# 生命週期 Hooks
> 來源：https://pestphp.com/docs/hooks, https://pestphp.com/docs/global-hooks
> 最後更新：2026-02-23

---

## Hooks 概覽

Hooks 讓你在測試前後執行特定動作，例如準備測試資料、初始化環境、清理資源。

可用的 hooks：
- `beforeEach()` — 每個測試前執行
- `afterEach()` — 每個測試後執行
- `beforeAll()` — 整個測試檔案執行前執行（只執行一次）
- `afterAll()` — 整個測試檔案執行後執行（只執行一次）

可在 `describe()` 區塊內限制 hook 的作用範圍：

```php
beforeEach(function () {
    // 全域 beforeEach
});

describe('something', function () {
    beforeEach(function () {
        // 只在此 describe 區塊內執行
    });

    describe('something else', function () {
        beforeEach(function () {
            // 只在巢狀 describe 內執行
        });
    });
});
```

---

## `beforeEach()`

每個測試前執行，`$this` 可用：

```php
beforeEach(function () {
    $this->userRepository = new UserRepository();
});

it('may be created', function () {
    $user = $this->userRepository->create();
    expect($user)->toBeInstanceOf(User::class);
});
```

---

## `afterEach()`

每個測試後執行，可做清理：

```php
afterEach(function () {
    $this->userRepository->reset();
});
```

針對特定測試的清理用 `->after()`：

```php
it('may be created', function () {
    $this->userRepository->create();
    expect($user)->toBeInstanceOf(User::class);
})->after(function () {
    $this->userRepository->reset();
});
```

---

## `beforeAll()`

整個測試檔案執行前執行一次。**注意：`$this` 不可用**（因為尚未建立測試實例）：

```php
beforeAll(function () {
    // 在此檔案的所有測試執行前，執行一次
});
```

---

## `afterAll()`

整個測試檔案執行後執行一次。**注意：`$this` 不可用**：

```php
afterAll(function () {
    // 在此檔案的所有測試執行後，執行一次
});
```

---

## Global Hooks（全域 Hooks）

在 `tests/Pest.php` 定義全域 hooks，避免重複：

### 套用到特定目錄

```php
pest()->extend(TestCase::class)->beforeEach(function () {
    // Interact with your database...
})->group('integration')->in('Feature');
```

### 套用到整個測試套件

```php
pest()->beforeEach(function () {
    // Interact with your database...
});
```

### 所有 Hooks 一次設定

```php
pest()->extend(TestCase::class)
    ->beforeAll(function () {
        // 每個檔案執行前...
    })->beforeEach(function () {
        // 每個測試前...
    })->afterEach(function () {
        // 每個測試後...
    })->afterAll(function () {
        // 每個檔案執行後...
    })->group('integration')->in('Feature');
```

**執行順序：**
- `Pest.php` 中的 `before*` hooks 先於測試檔案中的 hooks 執行
- `Pest.php` 中的 `after*` hooks 後於測試檔案中的 hooks 執行
