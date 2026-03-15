# CI Workflow — WordPress Plugin Integration Testing

> wp-env commands, package.json scripts, and GitHub Actions CI configuration.

## Table of Contents

- [wp-env Commands](#wp-env-commands)
- [package.json Scripts](#packagejson-scripts)
- [First-Time Setup (wp-env)](#first-time-setup-wp-env)
- [GitHub Actions CI](#github-actions-ci)

---

## wp-env Commands

### Environment Management

```bash
npx wp-env start                    # Start Docker environment
npx wp-env stop                     # Stop environment
npx wp-env destroy                  # Remove containers and data
npx wp-env clean all                # Reset to fresh state
```

### Running Tests

```bash
# Run all integration tests
npx wp-env run cli --env-cwd=wp-content/plugins/my-plugin \
  vendor/bin/phpunit

# Run specific test file
npx wp-env run cli --env-cwd=wp-content/plugins/my-plugin \
  vendor/bin/phpunit --filter=ExampleTest

# Run specific test method
npx wp-env run cli --env-cwd=wp-content/plugins/my-plugin \
  vendor/bin/phpunit --filter=test_plugin_is_active

# Run with verbose output
npx wp-env run cli --env-cwd=wp-content/plugins/my-plugin \
  vendor/bin/phpunit --verbose
```

### WP-CLI Inside Container

```bash
# Run WP-CLI commands inside the container
npx wp-env run cli wp plugin list
npx wp-env run cli wp option get siteurl
npx wp-env run cli wp user list
```

**Important:** `--env-cwd=wp-content/plugins/my-plugin` must match the actual plugin directory name inside the container.

---

## package.json Scripts

```json
{
  "scripts": {
    "wp-env": "wp-env",
    "env:start": "wp-env start",
    "env:stop": "wp-env stop",
    "test:integration": "wp-env run cli --env-cwd=wp-content/plugins/my-plugin vendor/bin/phpunit",
    "test:filter": "wp-env run cli --env-cwd=wp-content/plugins/my-plugin vendor/bin/phpunit --filter"
  }
}
```

Usage:

```bash
npm run env:start
npm run test:integration
npm run test:filter -- ExampleTest
npm run env:stop
```

---

## First-Time Setup (wp-env)

Run these commands once after initial `wp-env start`:

```bash
# 1. Start environment
npx wp-env start

# 2. Scaffold test files
npx wp-env run cli --env-cwd=wp-content/plugins/my-plugin \
  wp scaffold plugin-tests my-plugin

# 3. Install test database
npx wp-env run cli --env-cwd=wp-content/plugins/my-plugin \
  bash bin/install-wp-tests.sh wordpress_test root password mysql

# 4. Run tests
npx wp-env run cli --env-cwd=wp-content/plugins/my-plugin \
  vendor/bin/phpunit
```

**`install-wp-tests.sh` arguments:**

| Arg | Value | Description |
|-----|-------|-------------|
| 1 | `wordpress_test` | Test database name |
| 2 | `root` | MySQL user |
| 3 | `password` | MySQL password |
| 4 | `mysql` | MySQL host (container name) |

---

## GitHub Actions CI

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

### CI Notes

- **MySQL service**: Runs alongside the test runner, not inside Docker like wp-env
- **`install-wp-tests.sh`**: Downloads WP test suite to `/tmp/wordpress-tests-lib`
- **MySQL host**: Use `127.0.0.1` (not `localhost` or `mysql`) in GitHub Actions
- **PHP extensions**: `mysqli` is required for database connection, `intl` for i18n functions
- **No wp-env in CI**: GitHub Actions uses direct MySQL service instead of Docker-in-Docker

### Adding PHP Version Matrix

```yaml
    strategy:
      matrix:
        php-version: ['8.1', '8.2', '8.3']

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php-version }}
          extensions: mysqli, intl
          tools: composer
      # ... rest of steps
```
