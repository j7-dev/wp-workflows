# 外掛與擴充
> 來源：https://pestphp.com/docs/plugins, https://pestphp.com/docs/creating-plugins
> 最後更新：2026-02-23

---

## 官方外掛

### Faker 外掛

產生假資料：

```bash
composer require pestphp/pest-plugin-faker --dev
```

```php
use function Pest\Faker\fake;

it('generates a name', function () {
    $name = fake()->name;
});

// 指定語系
it('generates a portuguese name', function () {
    $name = fake('pt_PT')->name; // Nuno Maduro
});
```

> 注意：Pest 4 已移除此外掛（已封存）。

---

### Laravel 外掛

```bash
composer require pestphp/pest-plugin-laravel --dev
```

Artisan 命令：

```bash
php artisan pest:test UsersTest          # 建立 Feature 測試
php artisan pest:test UsersTest --unit   # 建立 Unit 測試
php artisan pest:dataset Emails          # 建立 Dataset
```

使用命名空間函式（取代 `$this->`）：

```php
use function Pest\Laravel\{get, actingAs, post, delete};

it('has a welcome page', function () {
    get('/')->assertStatus(200);
    // 等同 $this->get('/')
});

test('authenticated user can access the dashboard', function () {
    $user = User::factory()->create();
    actingAs($user)->get('/dashboard')->assertStatus(200);
});
```

詳細文件：[Laravel Testing](https://laravel.com/docs/12.x/testing)

---

### Livewire 外掛

```bash
composer require pestphp/pest-plugin-livewire --dev
```

```php
use function Pest\Livewire\livewire;

it('can be incremented', function () {
    livewire(Counter::class)
        ->call('increment')
        ->assertSee(1);
});
```

---

## 建立外掛

### 使用範本

以 [pest-plugin-template](https://github.com/pestphp/pest-plugin-template) 為起點，倉庫名稱命名為 `pest-plugin-*`。

修改 `composer.json` 的 `name` 和 `description` 欄位。

---

### 新增 Trait 方法（透過 `$this`）

定義 PHP trait：

```php
namespace YourGitHubUsername\PestPluginName;

trait MyPluginTrait
{
    public function myPluginMethod()
    {
        //
    }
}
```

在 `src/Autoload.php` 中註冊：

```php
use YourGitHubUsername\PestPluginName\MyPluginTrait;

Pest\Plugin::uses(MyPluginTrait::class);
```

更新 `composer.json` 自動載入：

```json
"autoload": {
    "psr-4": {
        "YourGitHubUsername\\PestPluginName\\": "src/"
    },
    "files": ["src/Autoload.php"]
}
```

使用方式：

```php
test('plugin example', function () {
    $this->myPluginMethod();
});
```

---

### 新增命名空間函式

在 `Autoload.php` 中定義：

```php
namespace YourGitHubUsername\PestPluginName;

function myPluginFunction(): void
{
    //
}

// 存取 $this
function myPluginFunction(): TestCase
{
    return test(); // 等同 $this
}
```

使用方式：

```php
use function YourGitHubUsername\PestPluginName\{myPluginFunction};

test('plugin example', function () {
    myPluginFunction();
});
```

---

### 新增自訂 Expectations

在 `Autoload.php` 中使用 `expect()->extend()` 或 `expect()->pipe()`，詳見 [Custom Expectations](./assertions.md)。

---

### 新增 Arch Presets

在 `Autoload.php` 中定義：

```php
pest()->preset('ddd', function () {
    return [
        expect('Infrastructure')->toOnlyBeUsedIn('Application'),
        expect('Domain')->toOnlyBeUsedIn('Application'),
    ];
});

// 存取應用程式命名空間
pest()->preset('silex', function (array $userNamespaces) {
    dump($userNamespaces); // ['App\\']
});
```

使用方式：

```php
arch()->preset()->ddd();
arch()->preset()->silex();
```
