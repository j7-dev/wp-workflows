---
name: wp-integration-testing
user-invocable: false
description: >
  WordPress plugin integration testing complete technical reference.
  Covers PHPUnit 9 + wp-env + WP_UnitTestCase setup, configuration templates,
  test patterns, factory methods, and CI workflow.
  Use this skill whenever the user's task involves writing WordPress plugin tests,
  setting up PHPUnit for WordPress, configuring wp-env, creating integration tests,
  testing WP hooks/filters/REST API/shortcodes/post types/user capabilities,
  or setting up GitHub Actions CI for WordPress plugins.
  Also use when code involves WP_UnitTestCase, phpunit.xml.dist for WordPress,
  tests/bootstrap.php, wp scaffold plugin-tests, wp-phpunit, yoast/phpunit-polyfills,
  yoast/wp-test-utils, or any PHPUnit test extending WP_UnitTestCase.
  This skill replaces the need to search the web for WordPress testing documentation.
---

# WordPress Plugin Integration Testing

> **PHP 8.1** | **PHPUnit ^9.6** | **wp-env (Docker)** | **WP_UnitTestCase**

## Testing Strategy

| Layer | Tool | Purpose | When |
|-------|------|---------|------|
| Static Analysis | PHPStan | Type safety, logic consistency | Every commit |
| Integration Test | PHPUnit + wp-env | WP hooks, DB, API logic | Local dev / CI |
| E2E Test | Playwright | Critical UI flows only | CI only |

## Required Packages

```bash
composer require --dev \
  phpunit/phpunit:^9.6 \
  yoast/phpunit-polyfills:^1.0 \
  wp-phpunit/wp-phpunit:^6.3 \
  yoast/wp-test-utils:^1.0

npm install --save-dev @wordpress/env
```

**Why PHPUnit 9, not 10?** `yoast/phpunit-polyfills` on PHP 8.1 falls back to PHPUnit 9. The entire WP ecosystem on PHP 8.1 runs PHPUnit 9 — using `^9.6` is the stable choice.

## Project Structure (Quick Reference)

```
my-plugin/
├── .wp-env.json
├── composer.json
├── package.json
├── phpunit.xml.dist
├── src/
├── my-plugin.php
└── tests/
    ├── bootstrap.php
    └── integration/
        └── ExampleTest.php
```

> Full config file templates: see `references/setup-guide.md`

## WP_UnitTestCase API Cheat Sheet

### Factory Methods

| Method | Purpose |
|--------|---------|
| `$this->factory()->post->create( $args )` | Create test post |
| `$this->factory()->user->create( $args )` | Create test user |
| `$this->factory()->term->create( $args )` | Create test term |
| `$this->factory()->comment->create( $args )` | Create test comment |
| `$this->factory()->attachment->create( $args )` | Create test attachment |
| `$this->factory()->post->create_many( $count, $args )` | Create N posts |

### Testing Hooks

```php
// Check action registered
$this->assertNotFalse( has_action( 'init', 'my_callback' ) );

// Check filter registered
$this->assertNotFalse( has_filter( 'the_content', 'my_filter' ) );

// Check action fired
$this->assertGreaterThan( 0, did_action( 'my_custom_action' ) );

// Test filter output
$result = apply_filters( 'my_filter', 'input_value' );
$this->assertSame( 'expected_output', $result );
```

### Testing REST API

```php
$request  = new WP_REST_Request( 'GET', '/my-plugin/v1/items' );
$response = rest_do_request( $request );

$this->assertSame( 200, $response->get_status() );
$this->assertIsArray( $response->get_data() );
```

### Testing Post Meta

```php
$post_id = $this->factory()->post->create();
update_post_meta( $post_id, '_my_key', 'test_value' );
$value = get_post_meta( $post_id, '_my_key', true );
$this->assertSame( 'test_value', $value );
```

### Testing User Capabilities

```php
$user_id = $this->factory()->user->create( [ 'role' => 'editor' ] );
wp_set_current_user( $user_id );
$this->assertTrue( current_user_can( 'edit_posts' ) );
$this->assertFalse( current_user_can( 'manage_options' ) );
```

### Testing Shortcodes

```php
$output = do_shortcode( '[my_shortcode]' );
$this->assertStringContainsString( '<div', $output );
$this->assertStringNotContainsString( '[my_shortcode]', $output );
```

## wp-env Quick Commands

```bash
npx wp-env start                    # Start Docker environment
npx wp-env stop                     # Stop environment
npx wp-env run cli --env-cwd=wp-content/plugins/my-plugin \
  vendor/bin/phpunit                # Run all tests
npx wp-env run cli --env-cwd=wp-content/plugins/my-plugin \
  vendor/bin/phpunit --filter=Test  # Run filtered tests
```

## Key Gotchas

1. **DB auto-rollback**: `WP_UnitTestCase` rolls back DB transactions after each test — no manual cleanup needed
2. **Bootstrap order matters**: Load composer autoloader → set polyfills path → load WP test functions → register plugin → load WP test bootstrap
3. **PHPUnit 9 config attributes**: Use `convertErrorsToExceptions`, `convertNoticesToExceptions`, `convertWarningsToExceptions` (removed in PHPUnit 10)
4. **wp-env plugin path**: `--env-cwd=wp-content/plugins/my-plugin` must match the actual plugin directory name inside the container
5. **First-time setup**: Run `wp scaffold plugin-tests` and `bash bin/install-wp-tests.sh` before first test run

## References Guide

| Need | File |
|------|------|
| Full config file templates (.wp-env.json, phpunit.xml.dist, bootstrap.php) | `references/setup-guide.md` |
| All test patterns with complete examples | `references/test-patterns.md` |
| wp-env commands, package.json scripts, GitHub Actions CI YAML | `references/ci-workflow.md` |
