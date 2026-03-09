# 資料驅動測試
> 來源：https://pestphp.com/docs/datasets
> 最後更新：2026-02-23

---

## 基本使用

使用 `->with()` 提供資料集，Pest 會自動對每筆資料執行一次測試：

```php
it('has emails', function (string $email) {
    expect($email)->not->toBeEmpty();
})->with(['enunomaduro@gmail.com', 'other@example.com']);
```

### 多參數

```php
it('has emails', function (string $name, string $email) {
    expect($email)->not->toBeEmpty();
})->with([
    ['Nuno', 'enunomaduro@gmail.com'],
    ['Other', 'other@example.com']
]);
```

### 自訂描述（命名 key）

```php
it('has emails', function (string $email) {
    expect($email)->not->toBeEmpty();
})->with([
    'james' => 'james@laravel.com',
    'taylor' => 'taylor@laravel.com',
]);
```

測試名稱包含 `:dataset` 時，描述會內插到該位置。

### 使用 Closure

```php
it('can sum', function (int $a, int $b, int $result) {
    expect(sum($a, $b))->toBe($result);
})->with([
    'positive numbers' => [1, 2, 3],
    'negative numbers' => [-1, -2, -3],
    'using closure' => [fn () => 1, 2, 3],
]);
```

**重要：** 在 dataset 中使用 closure 時，測試函式的對應參數必須宣告型別。

### 使用函式/Generator 回傳資料

```php
// 回傳陣列
test('The array contains only integers', function ($i) {
    expect($i)->toBeInt();
})->with(fn (): array => range(1, 99));

// 使用 Generator
test('The generator produces only integers', function ($i) {
    expect($i)->toBeInt();
})->with(function (): Generator {
    for ($i = 1 ; $i < 100_000_000_000 ; $i++) {
        yield $i;
    }
});
```

---

## Bound Datasets（綁定資料集）

在 `beforeEach()` 執行後才解析的資料集，適用於需要資料庫的情境（如 Laravel）：

```php
it('can generate the full name of a user', function (User $user) {
    expect($user->full_name)->toBe("{$user->first_name} {$user->last_name}");
})->with([
    fn() => User::factory()->create(['first_name' => 'Nuno', 'last_name' => 'Maduro']),
    fn() => User::factory()->create(['first_name' => 'Luke', 'last_name' => 'Downing']),
]);
```

若要綁定單一參數，測試函式的該參數必須完整型別標註：

```php
it('can generate the full name of a user', function (User $user, $fullName) {
    expect($user->full_name)->toBe($fullName);
})->with([
    [fn() => User::factory()->create(['first_name' => 'Nuno', 'last_name' => 'Maduro']), 'Nuno Maduro'],
]);
```

---

## 共享資料集

將資料集存放在 `tests/Datasets/` 目錄，可在多個測試中重用：

```php
// tests/Datasets/Emails.php
dataset('emails', [
    'enunomaduro@gmail.com',
    'other@example.com'
]);

// tests/Unit/ExampleTest.php
it('has emails', function (string $email) {
    expect($email)->not->toBeEmpty();
})->with('emails');
```

### Scoped Datasets（範圍限定的資料集）

在特定目錄建立 `Datasets.php`，資料集只對該目錄有效：

```php
// tests/Feature/Products/Datasets.php
dataset('products', ['egg', 'milk']);

// tests/Feature/Products/ExampleTest.php
it('has products', function (string $product) {
    expect($product)->not->toBeEmpty();
})->with('products');
```

---

## 組合資料集（Cartesian Product）

結合多個 dataset，產生笛卡爾積所有組合：

```php
dataset('days_of_the_week', ['Saturday', 'Sunday']);

test('business is closed on day', function(string $business, string $day) {
    expect(new $business)->isClosed($day)->toBeTrue();
})->with([
    Office::class,
    Bank::class,
    School::class
])->with('days_of_the_week');
// 結果：3 × 2 = 6 個測試
```

---

## 重複測試 `repeat()`

重複執行測試多次（適用於測試穩定性）：

```php
it('can repeat a test', function () {
    $result = /** Some unstable code */;
    expect($result)->toBeTrue();
})->repeat(100); // 重複 100 次
```
