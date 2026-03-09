# 撰寫測試
> 來源：https://pestphp.com/docs/writing-tests
> 最後更新：2026-02-23

---

## 專案結構

```
├── 📂 tests
│   ├── 📂 Unit
│   │   └── ExampleTest.php
│   └── 📂 Feature
│   │   └── ExampleTest.php
│   └── TestCase.php
│   └── Pest.php
├── phpunit.xml
```

- `tests/` — 所有測試檔案
- `TestCase.php` — 共用設定
- `Pest.php` — 測試套件設定
- `phpunit.xml` — PHPUnit / Pest 設定

## 第一個測試

測試檔名慣例以 `Test.php` 結尾，例如 `ExampleTest.php`。

### `test()` 函式

```php
test('sum', function () {
   $result = sum(1, 2);
   expect($result)->toBe(3);
});
```

### `it()` 函式

描述自動加上 "it" 前綴，使測試更可讀：

```php
it('performs sums', function () {
   $result = sum(1, 2);
   expect($result)->toBe(3);
});
// 輸出：it performs sums ✓
```

### `describe()` 函式

分組相關測試：

```php
describe('sum', function () {
   it('may sum integers', function () {
       $result = sum(1, 2);
       expect($result)->toBe(3);
    });

    it('may sum floats', function () {
       $result = sum(1.5, 2.5);
       expect($result)->toBe(4.0);
    });
});
```

## Expectation API

使用 `expect()` 進行斷言：

```php
expect($result)->toBe(3);
```

可鏈式呼叫：

```php
expect($value)
    ->toBeInt()
    ->toBe(3);
```

使用 `not` 修飾符：

```php
expect($value)
    ->toBe(3)
    ->not->toBeString();
```

## PHPUnit Assertion API

也可使用 PHPUnit 的 assertion API：

```php
test('sum', function () {
   $result = sum(1, 2);
   $this->assertSame(3, $result); // 等同於 expect($result)->toBe(3)
});
```

詳見：[PHPUnit Assertions](https://docs.phpunit.de/en/11.4/assertions.html)
