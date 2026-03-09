# Assertions（斷言）
> 來源：https://pestphp.com/docs/expectations, https://pestphp.com/docs/custom-expectations
> 最後更新：2026-02-23

---

## Expectation API

使用 `expect($value)` 開始斷言，可鏈式呼叫：

```php
expect($value)->toBe(3);

expect($value)
    ->toBeInt()
    ->toBe(3);

// not 修飾符
expect($value)
    ->not->toBeString()
    ->not->toBe(4);
```

---

## 完整 Expectation 清單

### 值比較

| 方法 | 說明 |
|------|------|
| `toBe($expected)` | 同型別同值（物件需同一實例） |
| `toEqual($expected)` | 相同值（寬鬆，例如 `'1'` 等於 `1`） |
| `toEqualCanonicalizing($expected)` | 無視順序的相等比較 |
| `toEqualWithDelta($expected, $delta)` | 在允許誤差範圍內相等 |
| `toBeBetween($min, $max)` | 在指定範圍內（支援 int/float/DateTime） |
| `toBeIn(array $values)` | 值為指定清單之一 |

```php
expect(1)->toBe(1);
expect('1')->not->toBe(1);
expect(2)->toBeBetween(1, 3);
expect($newUser->status)->toBeIn(['pending', 'new', 'active']);
expect(14)->toEqualWithDelta(10, 5); // Pass
```

### 型別斷言

| 方法 | 說明 |
|------|------|
| `toBeArray()` | 是陣列 |
| `toBeBool()` | 是布林值 |
| `toBeCallable()` | 是可呼叫的 |
| `toBeFile()` | 是存在的檔案路徑 |
| `toBeFloat()` | 是浮點數 |
| `toBeInt()` | 是整數 |
| `toBeIterable()` | 是可迭代的 |
| `toBeNumeric()` | 是數字（含字串數字） |
| `toBeDigits()` | 只含數字字元 |
| `toBeObject()` | 是物件 |
| `toBeResource()` | 是資源 |
| `toBeScalar()` | 是純量（int/float/string/bool） |
| `toBeString()` | 是字串 |
| `toBeJson()` | 是有效 JSON 字串 |
| `toBeNull()` | 是 null |
| `toBeNan()` | 是 NaN |
| `toBeInfinite()` | 是無限大 |
| `toBeInstanceOf($class)` | 是指定類別的實例 |

```php
expect(['Pest','PHP'])->toBeArray();
expect($count)->toBeInt();
expect(null)->toBeNull();
expect(sqrt(-1))->toBeNan();
expect($user)->toBeInstanceOf(User::class);
```

### 布林斷言

| 方法 | 說明 |
|------|------|
| `toBeTrue()` | 嚴格是 `true` |
| `toBeTruthy()` | truthy 值 |
| `toBeFalse()` | 嚴格是 `false` |
| `toBeFalsy()` | falsy 值 |

```php
expect($isPublished)->toBeTrue();
expect(1)->toBeTruthy();
expect('')->toBeFalsy();
```

### 數值比較

| 方法 | 說明 |
|------|------|
| `toBeGreaterThan($expected)` | 大於 |
| `toBeGreaterThanOrEqual($expected)` | 大於等於 |
| `toBeLessThan($expected)` | 小於 |
| `toBeLessThanOrEqual($expected)` | 小於等於 |

```php
expect($count)->toBeGreaterThan(20);
expect($count)->toBeLessThanOrEqual(2);
```

### 字串斷言

| 方法 | 說明 |
|------|------|
| `toStartWith($expected)` | 以指定字串開頭 |
| `toEndWith($expected)` | 以指定字串結尾 |
| `toMatch($regex)` | 符合正規表達式 |
| `toContain(...$needles)` | 包含所有指定值 |
| `toHaveLength(int $n)` | 長度為 n |
| `toBeUppercase()` | 全大寫 |
| `toBeLowercase()` | 全小寫 |
| `toBeAlpha()` | 只含英文字母 |
| `toBeAlphaNumeric()` | 只含英數字 |
| `toBeSnakeCase()` | snake_case 格式 |
| `toBeKebabCase()` | kebab-case 格式 |
| `toBeCamelCase()` | camelCase 格式 |
| `toBeStudlyCase()` | StudlyCase 格式 |
| `toBeUrl()` | 是有效 URL |
| `toBeUuid()` | 是有效 UUID |

```php
expect('Hello World')->toStartWith('Hello');
expect('Hello World')->toEndWith('World');
expect('Hello World')->toMatch('/^hello wo.*$/i');
expect('PESTPHP')->toBeUppercase();
expect('snake_case')->toBeSnakeCase();
```

### 陣列斷言

| 方法 | 說明 |
|------|------|
| `toContain(...$needles)` | 包含所有元素 |
| `toContainEqual(...$needles)` | 包含所有元素（寬鬆比較） |
| `toContainOnlyInstancesOf($class)` | 只含指定類別的實例 |
| `toHaveCount(int $count)` | 元素數量 |
| `toHaveKey($key, $value = null)` | 包含指定鍵（可選驗證值，支援點記法） |
| `toHaveKeys(array $keys)` | 包含所有指定鍵 |
| `toMatchArray($array)` | 包含指定 subset |
| `toHaveSameSize($iterable)` | 與指定 iterable 大小相同 |
| `toHaveSnakeCaseKeys()` | 所有 key 為 snake_case |
| `toHaveKebabCaseKeys()` | 所有 key 為 kebab-case |
| `toHaveCamelCaseKeys()` | 所有 key 為 camelCase |
| `toHaveStudlyCaseKeys()` | 所有 key 為 StudlyCase |

```php
expect([1, 2, 3, 4])->toContain(2, 4);
expect(['Nuno', 'Luke', 'Alex'])->toHaveCount(3);
expect(['name' => 'Nuno'])->toHaveKey('name', 'Nuno');
expect(['user' => ['name' => 'Nuno']])->toHaveKey('user.name', 'Nuno');
expect(['id' => 1, 'name' => 'Nuno'])->toMatchArray(['name' => 'Nuno']);
```

### 物件斷言

| 方法 | 說明 |
|------|------|
| `toHaveProperty($name, $value = null)` | 有指定屬性（可驗證值） |
| `toHaveProperties(iterable $names)` | 有所有指定屬性 |
| `toMatchObject($object)` | 符合物件 subset |

```php
expect($user)->toHaveProperty('name', 'Nuno');
expect($user)->toHaveProperties(['name', 'email']);
expect($user)->toHaveProperties(['name' => 'Nuno', 'email' => 'nuno@example.com']);
```

### 例外斷言

```php
expect(fn() => throw new Exception('Something happened.'))->toThrow(Exception::class);
expect(fn() => throw new Exception('Something happened.'))->toThrow('Something happened.');
expect(fn() => throw new Exception('Something happened.'))->toThrow(Exception::class, 'Something happened.');
```

### 檔案/目錄斷言

| 方法 | 說明 |
|------|------|
| `toBeFile()` | 是存在的檔案 |
| `toBeReadableFile()` | 是可讀檔案 |
| `toBeWritableFile()` | 是可寫檔案 |
| `toBeReadableDirectory()` | 是可讀目錄 |
| `toBeWritableDirectory()` | 是可寫目錄 |

### PHPUnit Constraint

```php
use PHPUnit\Framework\Constraint\IsTrue;
expect(true)->toMatchConstraint(new IsTrue());
```

---

## Modifiers（修飾符）

| 修飾符 | 說明 |
|--------|------|
| `not` | 反轉斷言 |
| `and($value)` | 切換到新值繼續鏈式斷言 |
| `each()` | 對 iterable 的每個元素斷言 |
| `json()` | 解析 JSON 字串後斷言 |
| `sequence(fn, fn, ...)` | 依序斷言每個元素 |
| `dd()` | 傾印目前值並停止執行 |
| `ddWhen($condition)` | 條件成立時傾印並停止 |
| `ddUnless($condition)` | 條件不成立時傾印並停止 |
| `ray()` | 使用 Ray 傾印值 |
| `when($condition, fn)` | 條件成立時執行斷言 |
| `unless($condition, fn)` | 條件不成立時執行斷言 |
| `match($array)` | 依鍵值對進行條件斷言 |

```php
// and()
expect($id)->toBe(14)
    ->and($name)->toBe('Nuno');

// each()
expect([1, 2, 3])->each->toBeInt();

// sequence()
expect([1, 2])->sequence(
    fn ($n) => $n->toBe(1),
    fn ($n) => $n->toBe(2),
);
```

---

## 自訂 Expectations

在 `tests/Pest.php` 或 `tests/Expectations.php` 中定義：

```php
expect()->extend('toBeWithinRange', function (int $min, int $max) {
    return $this->toBeGreaterThanOrEqual($min)
                ->toBeLessThanOrEqual($max);
});

// 使用
test('numeric ranges', function () {
    expect(100)->toBeWithinRange(90, 110);
});
```

存取期望值：
```php
expect()->extend('toBeWithinRange', function (int $min, int $max) {
    echo $this->value; // 100
    return $this; // 支援鏈式呼叫
});
```

觸發測試失敗：
```php
expect()->extend('toBeDivisibleBy', function (int $divisor) {
    if ($divisor === 0) {
        test()->fail('The divisor cannot be 0.');
    }
    return expect($this->value % $divisor)->toBe(0);
});
```

## Intercept Expectations

覆寫既有 expectation：
```php
use Illuminate\Database\Eloquent\Model;

expect()->intercept('toBe', Model::class, function(Model $expected) {
    expect($this->value->id)->toBe($expected->id);
});

// 使用 closure 判斷是否要覆寫
expect()->intercept('toBe', fn (mixed $value) => is_string($value), function (string $expected, bool $ignoreCase = false) {
    if ($ignoreCase) {
        assertEqualsIgnoringCase($expected, $this->value);
    } else {
        assertSame($expected, $this->value);
    }
});
```

## Pipe Expectations

在特定條件下插入自訂邏輯：
```php
use Illuminate\Database\Eloquent\Model;

expect()->pipe('toBe', function (Closure $next, mixed $expected) {
    if ($this->value instanceof Model) {
        return expect($this->value->id)->toBe($expected->id);
    }
    return $next(); // 繼續執行原始 expectation
});
```
