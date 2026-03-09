# 安裝與設定
> 來源：https://pestphp.com/docs/installation, https://pestphp.com/docs/configuring-tests
> 最後更新：2026-02-23

---

## 安裝 (Installation)

**系統需求：** PHP 8.3+

### 安裝步驟

**Step 1：** 透過 Composer 安裝 Pest（dev 依賴）：
```bash
composer remove phpunit/phpunit
composer require pestphp/pest --dev --with-all-dependencies
```

**Step 2：** 初始化 Pest，會在 `tests/` 目錄建立 `Pest.php` 設定檔：
```bash
./vendor/bin/pest --init
```

**Step 3：** 執行測試：
```bash
./vendor/bin/pest
```

**選用：** 瀏覽器測試可安裝 `pest-plugin-browser`；從 PHPUnit 遷移可使用 `pest-plugin-drift`。

---

## 設定測試 (Configuring Tests)

`tests/Pest.php` 是主要設定檔，在執行測試時自動載入。主要用途是指定測試使用的基底測試類別。

### `$this` 變數綁定

預設 `$this` 綁定到 `PHPUnit\Framework\TestCase`：
```php
it('has home', function () {
    echo get_class($this); // \PHPUnit\Framework\TestCase
    $this->assertTrue(true);
});
```

### 指定測試類別 `pest()->extend()`

將特定目錄的測試與指定類別關聯：
```php
// tests/Pest.php
pest()->extend(Tests\TestCase::class)->in('Feature');

// tests/Feature/ExampleTest.php
it('has home', function () {
    echo get_class($this); // \Tests\TestCase
});
```

支援 Glob 模式：
```php
pest()->extend(Tests\TestCase::class)->in('Feature/*Job*.php');
```

複雜範例（多目錄 + 多 trait）：
```php
pest()
    ->extend(DuskTestCase::class)
    ->use(DatabaseMigrations::class)
    ->in('../Modules/*/Tests/Browser');
```

### 使用 Trait `pest()->use()`

```php
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

pest()->extend(TestCase::class)->use(RefreshDatabase::class)->in('Feature');
```

### 針對單一檔案設定

在測試檔案中省略 `in()` 方法：
```php
pest()->extend(Tests\MySpecificTestCase::class);

it('has home', function () {
    echo get_class($this); // \Tests\MySpecificTestCase
});
```

### 可用方法

- `pest()->extend(ClassName::class)` — 指定基底類別
- `pest()->use(TraitName::class)` — 套用 Trait
- `pest()->group('name')` — 指定群組
- `pest()->in('folder')` — 套用到目錄（支援 Glob）
