# WordPress 外掛整合測試方案

## 測試策略

| 層級 | 工具 | 用途 | 執行時機 |
|------|------|------|----------|
| 靜態分析 | PHPStan | 型別安全、邏輯一致性 | 每次 commit |
| 整合測試 | PHPUnit + wp-env | WP hooks、DB、API 邏輯驗證 | 本地開發 / CI |
| E2E 測試 | Playwright | 少量關鍵 UI 流程 | CI only |

---

## 所需套件與版本

> **環境需求：PHP 8.1、Node.js 18+、Docker Desktop**

| 套件 | 版本 | PHP 8.1 相容 | 用途 |
|------|------|:---:|------|
| `phpunit/phpunit` | `^9.6` | ✓ | 測試框架核心 |
| `yoast/phpunit-polyfills` | `^1.0` | ✓ | PHPUnit 跨版本相容層 |
| `wp-phpunit/wp-phpunit` | `^6.3` | ✓ | WP 測試環境（提供 `WP_UnitTestCase`） |
| `yoast/wp-test-utils` | `^1.0` | ✓ | WP 整合測試 bootstrap 工具 |
| `@wordpress/env` | latest（npm） | ✓ | Docker 容器，提供完整 WP + MySQL |

### 為什麼用 PHPUnit 9 而不是 10？

PHPUnit 10 最低需求雖然是 PHP 8.1，但 `yoast/phpunit-polyfills` 在 PHP 8.1 上會跳過 PHPUnit 10，回退到 PHPUnit 9。WordPress 生態系在 PHP 8.1 上全都跑 PHPUnit 9，直接用 `^9.6` 是最穩定的選擇。

---

## 安裝

```bash
# PHP 依賴
composer require --dev \
  phpunit/phpunit:^9.6 \
  yoast/phpunit-polyfills:^1.0 \
  wp-phpunit/wp-phpunit:^6.3 \
  yoast/wp-test-utils:^1.0

# WP 測試環境（Docker）
npm install --save-dev @wordpress/env
```

---

## 專案結構

```
my-plugin/
├── .wp-env.json                  # wp-env 設定
├── composer.json
├── package.json
├── phpunit.xml.dist              # PHPUnit 設定
├── src/                          # 外掛主要程式碼
│   └── ...
├── my-plugin.php                 # 外掛入口
└── tests/
    ├── bootstrap.php             # 測試啟動檔
    └── integration/              # 整合測試
        ├── ExampleTest.php
        └── ...
```

---

## 設定檔範例

### `.wp-env.json`

```json
{
  "core": null,
  "plugins": [
    "."
  ],
  "config": {
    "WP_DEBUG": true,
    "SCRIPT_DEBUG": true
  },
  "env": {
    "tests": {
      "config": {
        "WP_DEBUG": true
      }
    }
  }
}
```

### `phpunit.xml.dist`

```xml
<?xml version="1.0"?>
<phpunit
    bootstrap="tests/bootstrap.php"
    backupGlobals="false"
    colors="true"
    convertErrorsToExceptions="true"
    convertNoticesToExceptions="true"
    convertWarningsToExceptions="true"
>
    <testsuites>
        <testsuite name="integration">
            <directory suffix="Test.php">./tests/integration/</directory>
        </testsuite>
    </testsuites>

    <php>
        <env name="WP_PHPUNIT__TESTS_CONFIG" value="tests/wp-tests-config.php"/>
    </php>
</phpunit>
```

### `tests/bootstrap.php`

```php
<?php
/**
 * PHPUnit bootstrap file for integration tests.
 */

// Composer autoloader.
require_once dirname( __DIR__ ) . '/vendor/autoload.php';

// 取得 WP tests 路徑
$_tests_dir = getenv( 'WP_TESTS_DIR' );

if ( ! $_tests_dir ) {
    $_tests_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib';
}

// 確認 WP test suite 存在
if ( ! file_exists( "{$_tests_dir}/includes/functions.php" ) ) {
    echo "Could not find {$_tests_dir}/includes/functions.php\n";
    exit( 1 );
}

// 設定 Polyfills
define( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH', dirname( __DIR__ ) . '/vendor/yoast/phpunit-polyfills' );

// 載入 WP test functions
require_once "{$_tests_dir}/includes/functions.php";

/**
 * 在 WP 載入時啟用外掛
 */
function _manually_load_plugin() {
    require dirname( __DIR__ ) . '/my-plugin.php';
}
tests_add_filter( 'muplugins_loaded', '_manually_load_plugin' );

// 啟動 WP test suite
require "{$_tests_dir}/includes/bootstrap.php";
```

---

## 範例測試

### `tests/integration/ExampleTest.php`

```php
<?php

class ExampleTest extends WP_UnitTestCase {

    /**
     * 測試外掛是否成功啟用
     */
    public function test_plugin_is_active(): void {
        $this->assertTrue( is_plugin_active( 'my-plugin/my-plugin.php' ) );
    }

    /**
     * 測試自訂 post type 是否正確註冊
     */
    public function test_custom_post_type_exists(): void {
        $this->assertTrue( post_type_exists( 'my_custom_type' ) );
    }

    /**
     * 測試文章建立與資料庫交互
     */
    public function test_can_create_post(): void {
        $post_id = $this->factory()->post->create( [
            'post_title'  => 'Test Post',
            'post_status' => 'publish',
            'post_type'   => 'post',
        ] );

        $post = get_post( $post_id );

        $this->assertInstanceOf( WP_Post::class, $post );
        $this->assertSame( 'Test Post', $post->post_title );
    }

    /**
     * 測試 hook 是否正確註冊
     */
    public function test_hooks_are_registered(): void {
        // 確認 action 有被註冊
        $this->assertNotFalse(
            has_action( 'init', 'my_plugin_register_post_type' )
        );
    }

    /**
     * 測試 shortcode 輸出
     */
    public function test_shortcode_output(): void {
        $output = do_shortcode( '[my_shortcode]' );

        $this->assertStringContainsString( '<div', $output );
        $this->assertStringNotContainsString( '[my_shortcode]', $output );
    }

    /**
     * 測試 REST API endpoint
     */
    public function test_rest_api_endpoint(): void {
        // 建立 REST request
        $request  = new WP_REST_Request( 'GET', '/my-plugin/v1/items' );
        $response = rest_do_request( $request );

        $this->assertSame( 200, $response->get_status() );
        $this->assertIsArray( $response->get_data() );
    }

    /**
     * 測試 post meta 存取
     */
    public function test_post_meta(): void {
        $post_id = $this->factory()->post->create();

        update_post_meta( $post_id, '_my_plugin_key', 'test_value' );
        $value = get_post_meta( $post_id, '_my_plugin_key', true );

        $this->assertSame( 'test_value', $value );
    }

    /**
     * 測試使用者權限
     */
    public function test_user_capability(): void {
        $user_id = $this->factory()->user->create( [
            'role' => 'editor',
        ] );

        wp_set_current_user( $user_id );

        $this->assertTrue( current_user_can( 'edit_posts' ) );
        $this->assertFalse( current_user_can( 'manage_options' ) );
    }
}
```

---

## 執行測試

### 使用 wp-env（推薦）

```bash
# 啟動 Docker 環境
npx wp-env start

# Scaffold 測試檔案（首次設定）
npx wp-env run cli --env-cwd=wp-content/plugins/my-plugin \
  wp scaffold plugin-tests my-plugin

# 安裝測試用資料庫
npx wp-env run cli --env-cwd=wp-content/plugins/my-plugin \
  bash bin/install-wp-tests.sh wordpress_test root password mysql

# 執行測試
npx wp-env run cli --env-cwd=wp-content/plugins/my-plugin \
  vendor/bin/phpunit

# 執行單一測試檔案
npx wp-env run cli --env-cwd=wp-content/plugins/my-plugin \
  vendor/bin/phpunit --filter=ExampleTest

# 停止環境
npx wp-env stop
```

### 在 `package.json` 加入快捷指令

```json
{
  "scripts": {
    "wp-env": "wp-env",
    "test:integration": "wp-env run cli --env-cwd=wp-content/plugins/my-plugin vendor/bin/phpunit",
    "test:filter": "wp-env run cli --env-cwd=wp-content/plugins/my-plugin vendor/bin/phpunit --filter"
  }
}
```

使用方式：

```bash
npm run test:integration
npm run test:filter -- ExampleTest
```

---

## GitHub Actions CI 範例

```yaml
name: Integration Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: wordpress_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.1'
          extensions: mysqli, intl
          tools: composer

      - name: Install Composer dependencies
        run: composer install --no-progress --prefer-dist

      - name: Install WP Test Suite
        run: bash bin/install-wp-tests.sh wordpress_test root root 127.0.0.1 latest
        env:
          WP_TESTS_DIR: /tmp/wordpress-tests-lib

      - name: Run integration tests
        run: vendor/bin/phpunit
        env:
          WP_TESTS_DIR: /tmp/wordpress-tests-lib
```

---

## 常用 WP_UnitTestCase 功能速查

| 方法 | 用途 |
|------|------|
| `$this->factory()->post->create()` | 建立測試用文章 |
| `$this->factory()->user->create()` | 建立測試用使用者 |
| `$this->factory()->term->create()` | 建立測試用分類/標籤 |
| `$this->factory()->comment->create()` | 建立測試用留言 |
| `wp_set_current_user( $id )` | 切換當前使用者 |
| `do_shortcode( '[tag]' )` | 測試 shortcode 輸出 |
| `rest_do_request( $request )` | 測試 REST API |
| `apply_filters( 'hook', $value )` | 測試 filter 結果 |
| `did_action( 'hook' )` | 檢查 action 是否觸發過 |
| `has_action( 'hook', 'callback' )` | 檢查 action 是否已註冊 |

> **注意：** `WP_UnitTestCase` 會在每個測試後自動回滾資料庫交易，不需要手動清除測試資料。

---

## 參考資源

- [WordPress 官方教學（2025/12）](https://developer.wordpress.org/news/2025/12/how-to-add-automated-unit-tests-to-your-wordpress-plugin/)
- [完整 Unit + Integration 測試設定教學](https://juanma.codes/2025/08/12/setting-up-unit-and-integration-testing-for-wordpress-plugins/)
- [用 wp-env 跑測試教學](https://blog.nateweller.com/2025/05/09/unit-testing-wordpress-plugins-in-2025-with-wordpress-env-and-phpunit/)
- [WP-CLI 整合測試 Handbook](https://make.wordpress.org/cli/handbook/how-to/plugin-unit-tests/)
- [PHPUnit 與 WP 版本對照表](https://make.wordpress.org/core/handbook/references/phpunit-compatibility-and-wordpress-versions/)
- [yoast/wp-test-utils GitHub](https://github.com/Yoast/wp-test-utils)
- [yoast/phpunit-polyfills GitHub](https://github.com/Yoast/PHPUnit-Polyfills)
