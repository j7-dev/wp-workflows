# CI/CD 持續整合
> 來源：https://pestphp.com/docs/continuous-integration
> 最後更新：2026-02-23

---

## 基本執行

在 CI 環境中執行：

```bash
./vendor/bin/pest --ci
```

`--ci` 選項會忽略 `->only()` 並執行完整測試套件。

---

## GitHub Actions

建立 `.github/workflows/tests.yml`：

```yaml
name: Tests

on: ['push', 'pull_request']

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: 8.3
          tools: composer:v2
          coverage: xdebug

      - name: Install Dependencies
        run: composer install --no-interaction --prefer-dist --optimize-autoloader

      - name: Tests
        run: ./vendor/bin/pest --ci
```

### 搭配 Browser Testing

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: lts/*

- name: Install dependencies
  run: npm ci

- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run Browser Tests
  run: ./vendor/bin/pest --ci --parallel
```

---

## GitLab CI/CD

在 `.gitlab-ci.yml` 中設定：

```yaml
stages:
  - build
  - test

build:vendors:
  stage: build
  only:
    refs:
      - merge_requests
      - push
  cache:
    key:
      files:
        - composer.lock
    policy: pull-push
  image: composer:2
  script:
    - composer install --no-interaction --prefer-dist --optimize-autoloader

tests:
  stage: test
  only:
    refs:
      - merge_requests
      - push
  cache:
    key:
      files:
        - composer.lock
    policy: pull
  image: php:8.2
  script:
    - ./vendor/bin/pest --ci
```

---

## Bitbucket Pipelines

在 `bitbucket-pipelines.yml` 中設定：

```yaml
image: composer:2

pipelines:
  default:
  - parallel:
      - step:
          name: Test
          script:
            - composer install --no-interaction --prefer-dist --optimize-autoloader
            - ./vendor/bin/pest
          caches:
            - composer
```

---

## Chipper CI

在 `.chipperci.yml` 中設定：

```yaml
version: 1

environment:
  php: 8.3
  node: 16

on:
   push:
      branches: .*

pipeline:
  - name: Setup
    cmd: |
      cp -v .env.example .env
      composer install --no-interaction --prefer-dist --optimize-autoloader
      php artisan key:generate

  - name: Compile Assets
    cmd: |
      npm ci --no-audit
      npm run build

  - name: Test
    cmd: pest
```

Chipper CI 會自動加入 `vendor/bin` 到 PATH，直接執行 `pest --ci` 即可。

---

## 測試分片（Sharding）

將大型測試套件分割成多個 CI Job 平行執行：

```bash
./vendor/bin/pest --shard=1/5  # 第 1 片，共 5 片
```

### GitHub Actions 分片範例

```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4, 5]

name: Tests (Shard ${{ matrix.shard }}/5)

steps:
  - name: Run tests
    run: pest --parallel --shard ${{ matrix.shard }}/5
```
