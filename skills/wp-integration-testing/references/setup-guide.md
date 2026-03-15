# Setup Guide — WordPress Plugin Integration Testing

> Full configuration file templates, ready to copy into your project.

## Table of Contents

- [Required Packages](#required-packages)
- [.wp-env.json](#wp-envjson)
- [phpunit.xml.dist](#phpunitxmldist)
- [tests/bootstrap.php](#testsbootstrapphp)
- [Project Structure](#project-structure)

---

## Required Packages

**Environment**: PHP 8.1, Node.js 18+, Docker Desktop

| Package | Version | Purpose |
|---------|---------|---------|
| `phpunit/phpunit` | `^9.6` | Test framework |
| `yoast/phpunit-polyfills` | `^1.0` | PHPUnit cross-version compat |
| `wp-phpunit/wp-phpunit` | `^6.3` | WP test env (`WP_UnitTestCase`) |
| `yoast/wp-test-utils` | `^1.0` | WP integration test bootstrap |
| `@wordpress/env` | latest (npm) | Docker container with WP + MySQL |

```bash
# PHP dependencies
composer require --dev \
  phpunit/phpunit:^9.6 \
  yoast/phpunit-polyfills:^1.0 \
  wp-phpunit/wp-phpunit:^6.3 \
  yoast/wp-test-utils:^1.0

# WP test environment (Docker)
npm install --save-dev @wordpress/env
```

### Why PHPUnit 9 and not 10?

PHPUnit 10 requires PHP 8.1 minimum, but `yoast/phpunit-polyfills` on PHP 8.1 skips PHPUnit 10 and falls back to PHPUnit 9. The entire WordPress ecosystem on PHP 8.1 runs PHPUnit 9. Using `^9.6` is the most stable choice.

---

## .wp-env.json

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

**Key fields:**

| Field | Description |
|-------|-------------|
| `"core": null` | Use latest WP core |
| `"plugins": ["."]` | Mount current directory as plugin |
| `"env.tests"` | Separate config for test environment |

---

## phpunit.xml.dist

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

**Notes:**
- `convertErrorsToExceptions`, `convertNoticesToExceptions`, `convertWarningsToExceptions` are PHPUnit 9 attributes (removed in PHPUnit 10)
- Test files must end with `Test.php` suffix
- `bootstrap` points to the test bootstrap file

---

## tests/bootstrap.php

```php
<?php
/**
 * PHPUnit bootstrap file for integration tests.
 */

// Composer autoloader.
require_once dirname( __DIR__ ) . '/vendor/autoload.php';

// Get WP tests path.
$_tests_dir = getenv( 'WP_TESTS_DIR' );

if ( ! $_tests_dir ) {
    $_tests_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib';
}

// Verify WP test suite exists.
if ( ! file_exists( "{$_tests_dir}/includes/functions.php" ) ) {
    echo "Could not find {$_tests_dir}/includes/functions.php\n";
    exit( 1 );
}

// Set Polyfills path.
define( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH', dirname( __DIR__ ) . '/vendor/yoast/phpunit-polyfills' );

// Load WP test functions.
require_once "{$_tests_dir}/includes/functions.php";

/**
 * Activate plugin during WP load.
 */
function _manually_load_plugin() {
    require dirname( __DIR__ ) . '/my-plugin.php';
}
tests_add_filter( 'muplugins_loaded', '_manually_load_plugin' );

// Start WP test suite.
require "{$_tests_dir}/includes/bootstrap.php";
```

**Bootstrap load order (critical):**
1. Composer autoloader
2. Resolve `WP_TESTS_DIR` path
3. Verify WP test suite files exist
4. Define `WP_TESTS_PHPUNIT_POLYFILLS_PATH`
5. Load WP test functions (`functions.php`)
6. Register plugin via `muplugins_loaded` hook
7. Load WP test bootstrap (`bootstrap.php`)

> Changing this order will cause cryptic failures.

---

## Project Structure

```
my-plugin/
├── .wp-env.json                  # wp-env config
├── composer.json
├── package.json
├── phpunit.xml.dist              # PHPUnit config
├── src/                          # Plugin source code
│   └── ...
├── my-plugin.php                 # Plugin entry file
└── tests/
    ├── bootstrap.php             # Test bootstrap
    └── integration/              # Integration tests
        ├── ExampleTest.php
        └── ...
```
