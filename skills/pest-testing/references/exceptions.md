# 例外測試
> 來源：https://pestphp.com/docs/exceptions
> 最後更新：2026-02-23

---

## `throws()` 方法

使用 `->throws()` 驗證測試拋出例外：

```php
it('throws exception', function () {
    throw new Exception('Something happened.');
})->throws(Exception::class);
```

驗證例外訊息：

```php
it('throws exception', function () {
    throw new Exception('Something happened.');
})->throws(Exception::class, 'Something happened.');
```

只驗證訊息（不指定例外類別）：

```php
it('throws exception', function () {
    throw new Exception('Something happened.');
})->throws('Something happened.');
```

---

## 條件驗證例外

### `throwsIf()`

當條件為 true 時驗證例外：

```php
it('throws exception', function () {
    //
})->throwsIf(fn() => DB::getDriverName() === 'mysql', Exception::class, 'MySQL is not supported.');
```

### `throwsUnless()`

當條件為 false 時驗證例外：

```php
it('throws exception', function () {
    //
})->throwsUnless(fn() => DB::getDriverName() === 'mysql', Exception::class, 'Only MySQL is supported.');
```

---

## 使用 Expectation API 驗證例外

```php
it('throws exception', function () {
    expect(fn() => throw new Exception('Something happened.'))->toThrow(Exception::class);
});
```

---

## `throwsNoExceptions()` — 驗證不拋出例外

```php
it('throws no exceptions', function () {
    $result = 1 + 1;
})->throwsNoExceptions();
```

---

## `fail()` — 強制測試失敗

```php
it('fails', function () {
    $this->fail();
});

it('fails with message', function () {
    $this->fail('Something went wrong.');
});
```

---

## `fails()` — 驗證測試會失敗

```php
it('fails', function () {
    $this->fail('Something happened.');
})->fails();
```

驗證失敗原因：

```php
it('fails as expected', function () {
    $this->fail('Something happened.');
})->fails('Something happened.'); // Pass

it('fails in an unexpected way', function () {
    $this->fail('Something unexpected happened.');
})->fails('Something happened.'); // Fail（訊息不符）
```
