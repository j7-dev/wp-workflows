# Mock/Spy/Fake
> 來源：https://pestphp.com/docs/mocking
> 最後更新：2026-02-23

---

## 需求

推薦使用 [Mockery](https://github.com/mockery/mockery/)：

```bash
composer require mockery/mockery --dev
```

---

## Method Expectations

使用 `Mockery::mock()` 建立 mock 物件，`shouldReceive()` 指定預期被呼叫的方法：

```php
use App\Repositories\BookRepository;
use Mockery;

it('may buy a book', function () {
    $client = Mockery::mock(PaymentClient::class);
    $client->shouldReceive('post');

    $books = new BookRepository($client);
    $books->buy(); // 實際不會呼叫 API
});
```

Mock 多個方法：

```php
$client->shouldReceive('post');
$client->shouldReceive('delete');
```

---

## Argument Expectations

使用 `with()` 限制期望的參數：

```php
$client->shouldReceive('post')
    ->with($firstArgument, $secondArgument);
```

使用 Mockery 內建 matchers：

```php
$client->shouldReceive('post')
    ->with($firstArgument, Mockery::any());
```

使用 closure 匹配參數：

```php
$client->shouldReceive('post')->withArgs(function ($arg) {
    return $arg === 1;
});

$client->post(1); // passes
$client->post(2); // fails: NoMatchingExpectationException
```

---

## Return Values

使用 `andReturn()` 指定回傳值：

```php
$client->shouldReceive('post')->andReturn('post response');
```

回傳序列（多次呼叫依序回傳）：

```php
$client->shouldReceive('post')->andReturn(1, 2);
$client->post(); // int(1)
$client->post(); // int(2)
```

使用 closure 動態計算回傳值：

```php
$mock->shouldReceive('post')
    ->andReturnUsing(
        fn () => 1,
        fn () => 2,
    );
```

拋出例外：

```php
$client->shouldReceive('post')->andThrow(new Exception);
```

---

## Method Call Count Expectations

限制方法被呼叫的次數：

```php
$mock->shouldReceive('post')->once();
$mock->shouldReceive('put')->twice();
$mock->shouldReceive('delete')->times(3);
```

最少次數：

```php
$mock->shouldReceive('delete')->atLeast()->times(3);
```

最多次數：

```php
$mock->shouldReceive('delete')->atMost()->times(3);
```

---

## 注意事項

- Mock 物件中，`shouldReceive()` 與 `with()` 的期望只在參數完全符合時才適用
- 參數不符時，Mockery 會拋出 `NoMatchingExpectationException`
- 詳細文件請參考 [Mockery 官方文件](https://docs.mockery.io)
