# wp-pest：WordPress PestPHP 整合
> 來源：https://raw.githubusercontent.com/dingo-d/wp-pest/main/README.md
> 最後更新：2026-02-23

---

## 概述

`wp-pest`（原名 `wp-pest-integration-test-setup`）為 WordPress 主題/外掛加入 PestPHP 整合與單元測試套件。

## 需求

- PHP > 7.4
- Composer

## 安裝

```bash
composer require dingo-d/wp-pest-integration-test-setup --dev
```

## 初始化設定

### 基本設定

```bash
vendor/bin/wp-pest setup theme    # 主題
vendor/bin/wp-pest setup plugin   # 外掛
```

這會：
- 建立 `tests/` 目錄及範例測試
- 下載最新 [WordPress develop](https://github.com/WordPress/wordpress-develop/) 到 `wp/` 資料夾
- 設定整合與單元測試套件

### 選項說明

```
Usage:
  setup [options] [--] <project-type>

Arguments:
  project-type                     theme 或 plugin

Options:
  --wp-version[=WP-VERSION]        WordPress 版本（預設：latest）
  --plugin-slug[=PLUGIN-SLUG]      外掛 slug（plugin 類型必填）
  --skip-delete                    跳過刪除步驟（CI 環境用）
```

---

## 底層機制

此套件組合：
- **[wordpress-develop](https://github.com/WordPress/wordpress-develop)** — WordPress 測試框架
- **[aaemnnosttv/wp-sqlite-db](https://github.com/aaemnnosttv/wp-sqlite-db)** — 記憶體 SQLite 資料庫（不需安裝 MySQL）
- **[Yoast/wp-test-utils](https://github.com/Yoast/wp-test-utils)** — 基底測試類別

---

## 同時執行單元與整合測試

由於 Pest 的 [file loading 限制](https://github.com/pestphp/pest/issues/649)，需要特殊處理。

### 在 `Pest.php` 或 `Helpers.php` 加入

```php
function isUnitTest() {
    return !empty($GLOBALS['argv']) && $GLOBALS['argv'][1] === '--group=unit';
}
```

### 在整合測試檔案頂部加入

```php
<?php

use Yoast\WPTestUtils\WPIntegration\TestCase;

if (isUnitTest()) {
    return;
}

uses(TestCase::class);

// 其餘測試...
```

---

## 執行測試

### 單元測試

```bash
vendor/bin/pest --group=unit
```

輸出：

```
   PASS  Tests\Unit\ExampleTest
  ✓ example

  Tests:  1 passed
  Time:   0.02s
```

### 整合測試

```bash
vendor/bin/pest --group=integration
```

輸出：

```
Installing...
Running as single site...
...
   PASS  Tests\Integration\ExampleTest
  ✓ Rest API endpoints work
  ✓ Creating terms in category works

  Tests:  2 passed
  Time:   0.14s
```

---

## CI 設定

在 CI 環境加上 `--skip-delete` 參數：

```bash
vendor/bin/wp-pest setup theme --skip-delete
```

---

## 1.6.0 版本升級（重要）

若從舊版升級，需修改以下檔案：

### `phpunit.xml`

在 `<php>` 區段加入：

```xml
<env name="WP_TESTS_DIR" value="wp/tests/phpunit"/>
```

### `bootstrap.php`

移除：

```php
require_once dirname(__FILE__, 2) . '/wp/tests/phpunit/includes/bootstrap.php';
```

改為：

```php
use Yoast\WPTestUtils\WPIntegration;

require_once dirname(__DIR__) . '/vendor/yoast/wp-test-utils/src/WPIntegration/bootstrap-functions.php';

WPIntegration\bootstrap_it();
```

### `Pest.php`

移除舊的設定：

```php
uses(TestCase::class)->in('Unit', 'Integration');
```

在每個整合測試頂部改用：

```php
use Yoast\WPTestUtils\WPIntegration\TestCase;

uses(TestCase::class);
```

---

## 常見問題

**Q: 為何 PHP 版本要求高？**  
A: 目的是促進 WordPress 開發者使用現代 PHP，雖然 WordPress 支援 PHP 5.6，但作者建議更新。

**Q: 下載 WordPress 卡住了？**  
A: 通常是 WSL 的網路問題，參考[此解法](https://github.com/microsoft/WSL/issues/4901#issuecomment-1192517363)停用部分網路介面卡。

**Q: Windows 原生環境能用嗎？**  
A: 尚未在 Windows 原生環境測試，建議使用 WSL。
