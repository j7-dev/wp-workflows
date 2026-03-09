# 架構測試
> 來源：https://pestphp.com/docs/arch-testing, https://pestphp.com/docs/test-dependencies
> 最後更新：2026-02-23

---

## Architecture Testing（架構測試）

架構測試用來驗證應用程式是否遵循架構規則。期望以命名空間、完整類別名稱或函式名稱指定。

```php
arch()
    ->expect('App')
    ->toUseStrictTypes()
    ->not->toUse(['die', 'dd', 'dump']);

arch()
    ->expect('App\Models')
    ->toBeClasses()
    ->toExtend('Illuminate\Database\Eloquent\Model')
    ->toOnlyBeUsedIn('App\Repositories')
    ->ignoring('App\Models\User');

arch()->preset()->php();
arch()->preset()->security()->ignoring('md5');
```

---

## Expectations（期望）

### 類別類型

| 方法 | 說明 |
|------|------|
| `toBeAbstract()` | 所有類別為 abstract |
| `toBeClasses()` | 所有檔案為 class |
| `toBeEnums()` | 所有檔案為 enum |
| `toBeIntBackedEnums()` | 所有 enum 為 int backed |
| `toBeStringBackedEnums()` | 所有 enum 為 string backed |
| `toBeInterfaces()` | 所有檔案為 interface |
| `toBeTraits()` | 所有檔案為 trait |
| `toBeInvokable()` | 所有類別可 invoke |
| `toBeFinal()` | 所有類別為 final |
| `toBeReadonly()` | 所有類別為 readonly |

```php
arch('app')->expect('App\Models')->toBeClasses();
arch('app')->expect('App\Enums')->toBeEnums();
arch('app')->expect('App\Contracts')->toBeInterfaces();
arch('app')->expect('App\Concerns')->toBeTraits();
arch('app')->expect('App\ValueObjects')->toBeFinal();
```

### 繼承與介面

| 方法 | 說明 |
|------|------|
| `toExtend($class)` | 繼承指定類別 |
| `toExtendNothing()` | 不繼承任何類別 |
| `toImplement($interface)` | 實作指定介面 |
| `toImplementNothing()` | 不實作任何介面 |
| `toOnlyImplement($interface)` | 只實作指定介面 |

```php
arch()->expect('App\Models')->toExtend('Illuminate\Database\Eloquent\Model');
arch()->expect('App\Jobs')->toImplement('Illuminate\Contracts\Queue\ShouldQueue');
```

### 依賴控制

| 方法 | 說明 |
|------|------|
| `toUse($class)` | 使用指定類別/函式（配合 `not` 使用） |
| `toUseNothing()` | 沒有任何依賴 |
| `toOnlyUse($namespace)` | 只使用指定命名空間 |
| `toBeUsed()` | 被使用（配合 `not` 確認未被使用） |
| `toBeUsedIn($namespace)` | 被用於指定命名空間（配合 `not`） |
| `toOnlyBeUsedIn($namespace)` | 只被指定命名空間使用 |
| `toUseStrictTypes()` | 使用 strict types |
| `toUseStrictEquality()` | 使用 `===` 嚴格比較 |
| `toUseTrait($trait)` | 使用指定 trait |
| `toUseTraits(array)` | 使用多個指定 traits |

```php
arch()->expect(['dd', 'dump'])->not->toBeUsed();
arch()->expect('App\Models')->toOnlyUse('Illuminate\Database');
arch()->expect('App\Models')->toOnlyBeUsedIn('App\Repositories');
arch()->expect('App')->toUseStrictTypes();
```

### 方法與屬性

| 方法 | 說明 |
|------|------|
| `toHaveMethod($name)` | 有指定方法 |
| `toHaveMethods(array)` | 有指定的多個方法 |
| `toHavePublicMethods()` | 有公開方法（配合 `not` 確認無公開方法） |
| `toHavePublicMethodsBesides(array)` | 除了指定方法外沒有公開方法 |
| `toHaveProtectedMethods()` | 有保護方法（配合 `not`） |
| `toHaveProtectedMethodsBesides(array)` | 除了指定方法外沒有保護方法 |
| `toHavePrivateMethods()` | 有私有方法（配合 `not`） |
| `toHavePrivateMethodsBesides(array)` | 除了指定方法外沒有私有方法 |
| `toHaveConstructor()` | 有 `__construct` 方法 |
| `toHaveDestructor()` | 有 `__destruct` 方法 |
| `toHaveMethodsDocumented()` | 所有方法已記錄 |
| `toHavePropertiesDocumented()` | 所有屬性已記錄 |

### 命名與結構

| 方法 | 說明 |
|------|------|
| `toHavePrefix($prefix)` | 有指定前綴（配合 `not` 確認無前綴） |
| `toHaveSuffix($suffix)` | 有指定後綴 |
| `toHaveAttribute($class)` | 有指定 PHP attribute |
| `toHaveLineCountLessThan($n)` | 行數少於 n |
| `toHaveFileSystemPermissions($perm)` | 檔案權限（配合 `not`） |
| `toHaveSuspiciousCharacters()` | 含可疑字元（配合 `not`） |

```php
arch()->expect('App\Http\Controllers')->toHaveSuffix('Controller');
arch()->expect('App\Models')->toHaveLineCountLessThan(100);
arch()->expect('App\Http\Controllers')->not->toHaveSuspiciousCharacters();
```

### Wildcards 萬用字元（Pest 3.8+）

```php
arch()
    ->expect('App\*\Traits') // 匹配所有 App\*\Traits 命名空間
    ->toBeTraits();
```

---

## Presets（預設集）

### `php` — 通用 PHP 規則

避免使用 `die`、`var_dump` 等函式，不使用已廢棄的 PHP 函式：

```php
arch()->preset()->php(); // 需要 intl PHP 擴充
```

### `security` — 安全性規則

避免使用可能導致安全漏洞的程式碼（`eval`、`md5` 等）：

```php
arch()->preset()->security();
arch()->preset()->security()->ignoring('md5');
```

### `laravel` — Laravel 規則

遵循 Laravel 慣例（Controller 方法、命名等）：

```php
arch()->preset()->laravel();
```

### `strict` — 嚴格規則

使用 strict types、所有類別為 final 等：

```php
arch()->preset()->strict();
```

### `relaxed` — 寬鬆規則（strict 的反面）

```php
arch()->preset()->relaxed();
```

### 自訂 Preset

```php
pest()->presets()->custom('ddd', function () {
    return [
        expect('Infrastructure')->toOnlyBeUsedIn('Application'),
        expect('Domain')->toOnlyBeUsedIn('Application'),
    ];
});

// 使用
arch()->preset()->ddd();
```

存取應用程式命名空間：

```php
pest()->presets()->custom('silex', function (array $userNamespaces) {
    // $userNamespaces 為應用程式的 PSR-4 命名空間
    return [
        expect($userNamespaces)->toBeArray(),
    ];
});
```

---

## Modifiers（修飾符）

| 修飾符 | 說明 |
|--------|------|
| `not` | 反轉期望 |
| `ignoring($class)` | 忽略指定類別/命名空間 |
| `classes()` | 只對類別套用期望 |
| `interfaces()` | 只對介面套用期望 |
| `traits()` | 只對 trait 套用期望 |
| `enums()` | 只對 enum 套用期望 |

```php
arch()->expect('App')
    ->classes()
    ->toBeFinal();
```

---

## Test Dependencies（測試依賴）

### `depends()` 方法

指定測試依賴另一個測試，只有父測試通過才執行：

```php
test('parent', function () {
    expect(true)->toBeTrue();
});

test('child', function () {
    expect(false)->toBeFalse();
})->depends('parent');
```

父測試失敗時，子測試會被略過並顯示訊息。

### `it()` 函式的名稱前綴

使用 `it()` 時需包含 "it " 前綴：

```php
it('is the parent', function () {
    expect(true)->toBeTrue();
});

test('child', function () {
    expect(false)->toBeFalse();
})->depends('it is the parent');
```

### 傳遞回傳值

父測試的回傳值可作為子測試的參數：

```php
test('parent', function () {
    expect(true)->toBeTrue();
    return 'from parent';
});

test('child', function ($parentValue) {
    expect($parentValue)->toBe('from parent');
})->depends('parent');
```

### 多重依賴

```php
test('a', function () { return 'a'; });
test('b', function () { return 'b'; });
test('c', function () { return 'c'; });

test('d', function ($testA, $testC, $testB) {
    // 參數依 depends() 順序傳入
})->depends('a', 'b', 'c');
```
