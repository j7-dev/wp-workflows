# 進階語法
> 來源：https://pestphp.com/docs/higher-order-testing, https://pestphp.com/docs/custom-helpers, https://pestphp.com/docs/snapshot-testing
> 最後更新：2026-02-23

---

## Higher Order Testing（高階測試）

### 基本概念

當測試主體只是一連串鏈式呼叫 `$this` 的方法時，可省略 closure：

```php
// 原本
it('works', function () {
    $this->get('/')
        ->assertStatus(200);
});

// 高階測試寫法
it('works')
    ->get('/')
    ->assertStatus(200);
```

### 結合 Expectation API

測試只有一個 expectation 時：

```php
// 原本
it('has a name', function () {
    $user = User::create(['name' => 'Nuno Maduro']);
    expect($user->name)->toBe('Nuno Maduro');
});

// 高階測試（lazy evaluation 要用 closure）
it('has a name')
    ->expect(fn () => User::create(['name' => 'Nuno Maduro'])->name)
    ->toBe('Nuno Maduro');
```

> **重要：** `expect()` 中的值必須用 closure 包裝，確保在測試執行時才求值。

### `defer()` — 延遲執行

對需要 lazy evaluation 的斷言：

```php
it('creates admins')
    ->defer(fn () => $this->artisan('user:create --admin'))
    ->assertDatabaseHas('users', ['id' => 1]);
```

### Hooks 的高階寫法

```php
// 原本
beforeEach(function () {
    $this->withoutMiddleware();
});

// 高階寫法
beforeEach()->withoutMiddleware();
```

### 與 Datasets 結合

```php
it('validates emails')
    ->with(['taylor@laravel.com', 'enunomaduro@gmail.com'])
    ->expect(fn (string $email) => Validator::isValid($email))
    ->toBeTrue();
```

---

## Higher Order Expectations（高階期望）

直接對物件的屬性或方法進行鏈式斷言：

```php
// 原本
expect($user->name)->toBe('Nuno');
expect($user->surname)->toBe('Maduro');
expect($user->addTitle('Mr.'))->toBe('Mr. Nuno Maduro');

// 高階期望
expect($user)
    ->name->toBe('Nuno')
    ->surname->toBe('Maduro')
    ->addTitle('Mr.')->toBe('Mr. Nuno Maduro');
```

### 陣列存取

```php
expect(['name' => 'Nuno', 'projects' => ['Pest', 'OpenAI', 'Laravel Zero']])
    ->name->toBe('Nuno')
    ->projects->toHaveCount(3)
    ->each->toBeString();

// 數字索引
expect(['Dan', 'Luke', 'Nuno'])
    ->{0}->toBe('Dan');
```

### 在 closure 內繼續使用高階期望

```php
expect(['name' => 'Nuno', 'projects' => ['Pest', 'OpenAI', 'Laravel Zero']])
    ->name->toBe('Nuno')
    ->projects->toHaveCount(3)
    ->sequence(
        fn ($project) => $project->toBe('Pest'),
        fn ($project) => $project->toBe('OpenAI'),
        fn ($project) => $project->toBe('Laravel Zero'),
    );
```

### `scoped()` — 鎖定在某個層級

```php
expect($user)
    ->name->toBe('Nuno')
    ->email->toBe('enunomaduro@gmail.com')
    ->address()->scoped(fn ($address) => $address
        ->line1->toBe('1 Pest Street')
        ->city->toBe('Lisbon')
        ->country->toBe('Portugal')
    );
```

---

## Custom Helpers（自訂輔助函式）

### 在測試檔案內定義（只限該檔案）

```php
use App\Models\User;
use Tests\TestCase;

function asAdmin(): TestCase
{
    $user = User::factory()->create(['admin' => true]);
    return test()->actingAs($user);
}

it('can manage users', function () {
    asAdmin()->get('/users')->assertOk();
});
```

> 在 helper 中可用 `test()` 取得目前測試實例（等同 `$this`）。

### 全域 Helpers（在 `Pest.php` 或 `Helpers.php` 中定義）

```php
// tests/Pest.php 或 tests/Helpers.php
use App\Clients\PaymentClient;
use Mockery;

function mockPayments(): object
{
    $client = Mockery::mock(PaymentClient::class);
    // ...
    return $client;
}

// tests/Feature/PaymentsTest.php
it('may buy a book', function () {
    $client = mockPayments();
    // ...
});
```

Pest 自動載入以下位置的 helpers：
- `tests/Pest.php`
- `tests/Helpers.php`
- `tests/Helpers/` 目錄下的所有檔案

### 在基底類別定義 protected 方法

```php
// tests/TestCase.php
class TestCase extends BaseTestCase
{
    protected function mockPayments(): void
    {
        $client = Mockery::mock(PaymentClient::class);
        // ...
        return $client;
    }
}

// tests/Pest.php
pest()->extend(TestCase::class)->in('Feature');

// tests/Feature/PaymentsTest.php
it('may buy a book', function () {
    $client = $this->mockPayments();
    // ...
});
```

---

## Snapshot Testing（快照測試）

### 基本使用

第一次執行時建立快照檔案（存於 `tests/.pest/snapshots/`），後續執行時比對：

```php
it('has a contact page', function () {
    $response = $this->get('/contact');
    expect($response)->toMatchSnapshot();
});
```

可快照任何值：

```php
$array = /** Fetch array somewhere */;
expect($array)->toMatchSnapshot();
```

### 重建快照

```bash
./vendor/bin/pest --update-snapshots
```

### 處理動態資料

使用 Expectation Pipe 替換動態內容（如 CSRF token）：

```php
expect()->pipe('toMatchSnapshot', function (Closure $next) {
    if (is_string($this->value)) {
        $this->value = preg_replace(
            '/name="_token" value=".*"/',
            'name="_token" value="my_test"',
            $this->value
        );
    }
    return $next();
});
```
