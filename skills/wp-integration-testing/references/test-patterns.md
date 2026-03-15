# Test Patterns — WordPress Plugin Integration Testing

> Complete test examples for common WordPress plugin testing scenarios.
> All examples extend `WP_UnitTestCase`. DB is auto-rolled-back after each test.

## Table of Contents

- [Plugin Activation](#plugin-activation)
- [Custom Post Type](#custom-post-type)
- [Post CRUD & Factory](#post-crud--factory)
- [Post Meta](#post-meta)
- [Hooks — Actions](#hooks--actions)
- [Hooks — Filters](#hooks--filters)
- [Shortcodes](#shortcodes)
- [REST API Endpoints](#rest-api-endpoints)
- [User Capabilities](#user-capabilities)
- [Taxonomy & Terms](#taxonomy--terms)
- [Options API](#options-api)
- [Transients](#transients)
- [WP_UnitTestCase Full API Reference](#wp_unittestcase-full-api-reference)

---

## Plugin Activation

```php
public function test_plugin_is_active(): void {
    $this->assertTrue( is_plugin_active( 'my-plugin/my-plugin.php' ) );
}
```

---

## Custom Post Type

```php
public function test_custom_post_type_exists(): void {
    $this->assertTrue( post_type_exists( 'my_custom_type' ) );
}

public function test_post_type_supports(): void {
    $this->assertTrue( post_type_supports( 'my_custom_type', 'title' ) );
    $this->assertTrue( post_type_supports( 'my_custom_type', 'editor' ) );
    $this->assertFalse( post_type_supports( 'my_custom_type', 'comments' ) );
}
```

---

## Post CRUD & Factory

```php
// Create single post
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

// Create multiple posts
public function test_bulk_create(): void {
    $post_ids = $this->factory()->post->create_many( 5, [
        'post_status' => 'publish',
    ] );

    $this->assertCount( 5, $post_ids );
}

// Create and get object directly
public function test_create_and_get(): void {
    $post = $this->factory()->post->create_and_get( [
        'post_title' => 'Direct Object',
    ] );

    $this->assertInstanceOf( WP_Post::class, $post );
    $this->assertSame( 'Direct Object', $post->post_title );
}
```

---

## Post Meta

```php
public function test_post_meta_crud(): void {
    $post_id = $this->factory()->post->create();

    // Create
    update_post_meta( $post_id, '_my_plugin_key', 'test_value' );

    // Read
    $value = get_post_meta( $post_id, '_my_plugin_key', true );
    $this->assertSame( 'test_value', $value );

    // Update
    update_post_meta( $post_id, '_my_plugin_key', 'new_value' );
    $this->assertSame( 'new_value', get_post_meta( $post_id, '_my_plugin_key', true ) );

    // Delete
    delete_post_meta( $post_id, '_my_plugin_key' );
    $this->assertEmpty( get_post_meta( $post_id, '_my_plugin_key', true ) );
}

public function test_serialized_meta(): void {
    $post_id = $this->factory()->post->create();
    $data    = [ 'key1' => 'value1', 'key2' => 42 ];

    update_post_meta( $post_id, '_my_array', $data );
    $result = get_post_meta( $post_id, '_my_array', true );

    $this->assertIsArray( $result );
    $this->assertSame( 'value1', $result['key1'] );
    $this->assertSame( 42, $result['key2'] );
}
```

---

## Hooks — Actions

```php
// Verify action is registered
public function test_action_registered(): void {
    $this->assertNotFalse(
        has_action( 'init', 'my_plugin_register_post_type' )
    );
}

// Verify action priority
public function test_action_priority(): void {
    $priority = has_action( 'init', 'my_plugin_register_post_type' );
    $this->assertSame( 10, $priority ); // default priority
}

// Verify action was fired
public function test_action_fired(): void {
    do_action( 'my_plugin_custom_action' );
    $this->assertGreaterThan( 0, did_action( 'my_plugin_custom_action' ) );
}

// Count action executions
public function test_action_count(): void {
    do_action( 'my_action' );
    do_action( 'my_action' );
    $this->assertSame( 2, did_action( 'my_action' ) );
}
```

---

## Hooks — Filters

```php
// Verify filter is registered
public function test_filter_registered(): void {
    $this->assertNotFalse(
        has_filter( 'the_content', 'my_plugin_filter_content' )
    );
}

// Test filter output
public function test_filter_modifies_content(): void {
    $input  = 'Original content';
    $output = apply_filters( 'my_plugin_filter', $input );

    $this->assertNotSame( $input, $output );
    $this->assertStringContainsString( 'expected', $output );
}

// Test filter with multiple args
public function test_filter_with_args(): void {
    $result = apply_filters( 'my_filter', 'value', 'arg2', 'arg3' );
    $this->assertSame( 'expected_result', $result );
}
```

---

## Shortcodes

```php
public function test_shortcode_registered(): void {
    $this->assertTrue( shortcode_exists( 'my_shortcode' ) );
}

public function test_shortcode_output(): void {
    $output = do_shortcode( '[my_shortcode]' );

    $this->assertStringContainsString( '<div', $output );
    // Verify shortcode was processed (not returned raw)
    $this->assertStringNotContainsString( '[my_shortcode]', $output );
}

public function test_shortcode_with_attributes(): void {
    $output = do_shortcode( '[my_shortcode color="red" size="large"]' );

    $this->assertStringContainsString( 'red', $output );
    $this->assertStringContainsString( 'large', $output );
}

public function test_shortcode_with_content(): void {
    $output = do_shortcode( '[my_shortcode]Inner content[/my_shortcode]' );

    $this->assertStringContainsString( 'Inner content', $output );
}
```

---

## REST API Endpoints

```php
public function test_rest_endpoint_registered(): void {
    $routes = rest_get_server()->get_routes();
    $this->assertArrayHasKey( '/my-plugin/v1/items', $routes );
}

public function test_rest_get_items(): void {
    $request  = new WP_REST_Request( 'GET', '/my-plugin/v1/items' );
    $response = rest_do_request( $request );

    $this->assertSame( 200, $response->get_status() );
    $this->assertIsArray( $response->get_data() );
}

public function test_rest_create_item(): void {
    // Authenticate as admin
    wp_set_current_user( $this->factory()->user->create( [ 'role' => 'administrator' ] ) );

    $request = new WP_REST_Request( 'POST', '/my-plugin/v1/items' );
    $request->set_body_params( [
        'title' => 'New Item',
        'status' => 'active',
    ] );

    $response = rest_do_request( $request );
    $this->assertSame( 201, $response->get_status() );
}

public function test_rest_unauthorized(): void {
    // No user set — should fail auth
    $request  = new WP_REST_Request( 'POST', '/my-plugin/v1/items' );
    $response = rest_do_request( $request );

    $this->assertSame( 401, $response->get_status() );
}

public function test_rest_with_query_params(): void {
    $request = new WP_REST_Request( 'GET', '/my-plugin/v1/items' );
    $request->set_query_params( [
        'per_page' => 5,
        'page'     => 1,
        'status'   => 'active',
    ] );

    $response = rest_do_request( $request );
    $data     = $response->get_data();

    $this->assertSame( 200, $response->get_status() );
    $this->assertLessThanOrEqual( 5, count( $data ) );
}
```

---

## User Capabilities

```php
public function test_editor_capabilities(): void {
    $user_id = $this->factory()->user->create( [ 'role' => 'editor' ] );
    wp_set_current_user( $user_id );

    $this->assertTrue( current_user_can( 'edit_posts' ) );
    $this->assertTrue( current_user_can( 'edit_others_posts' ) );
    $this->assertFalse( current_user_can( 'manage_options' ) );
}

public function test_custom_capability(): void {
    $role = get_role( 'administrator' );
    $role->add_cap( 'my_plugin_manage' );

    $admin_id = $this->factory()->user->create( [ 'role' => 'administrator' ] );
    wp_set_current_user( $admin_id );

    $this->assertTrue( current_user_can( 'my_plugin_manage' ) );

    // Cleanup
    $role->remove_cap( 'my_plugin_manage' );
}

public function test_subscriber_restrictions(): void {
    $user_id = $this->factory()->user->create( [ 'role' => 'subscriber' ] );
    wp_set_current_user( $user_id );

    $this->assertTrue( current_user_can( 'read' ) );
    $this->assertFalse( current_user_can( 'edit_posts' ) );
    $this->assertFalse( current_user_can( 'publish_posts' ) );
}
```

---

## Taxonomy & Terms

```php
public function test_custom_taxonomy_exists(): void {
    $this->assertTrue( taxonomy_exists( 'my_taxonomy' ) );
}

public function test_term_creation(): void {
    $term_id = $this->factory()->term->create( [
        'taxonomy' => 'category',
        'name'     => 'Test Category',
    ] );

    $term = get_term( $term_id );
    $this->assertSame( 'Test Category', $term->name );
}

public function test_post_term_relationship(): void {
    $post_id = $this->factory()->post->create();
    $term_id = $this->factory()->term->create( [ 'taxonomy' => 'category' ] );

    wp_set_post_terms( $post_id, [ $term_id ], 'category' );

    $terms = wp_get_post_terms( $post_id, 'category', [ 'fields' => 'ids' ] );
    $this->assertContains( $term_id, $terms );
}
```

---

## Options API

```php
public function test_option_crud(): void {
    // Create
    add_option( 'my_plugin_setting', 'default_value' );
    $this->assertSame( 'default_value', get_option( 'my_plugin_setting' ) );

    // Update
    update_option( 'my_plugin_setting', 'new_value' );
    $this->assertSame( 'new_value', get_option( 'my_plugin_setting' ) );

    // Delete
    delete_option( 'my_plugin_setting' );
    $this->assertFalse( get_option( 'my_plugin_setting' ) );
}

public function test_option_default_value(): void {
    $this->assertSame(
        'fallback',
        get_option( 'nonexistent_option', 'fallback' )
    );
}
```

---

## Transients

```php
public function test_transient_crud(): void {
    set_transient( 'my_cache', 'cached_data', HOUR_IN_SECONDS );

    $this->assertSame( 'cached_data', get_transient( 'my_cache' ) );

    delete_transient( 'my_cache' );
    $this->assertFalse( get_transient( 'my_cache' ) );
}
```

---

## WP_UnitTestCase Full API Reference

### Factory Methods

| Factory | `create( $args )` | `create_many( $count, $args )` | `create_and_get( $args )` |
|---------|----|----|----|
| `$this->factory()->post` | Returns post ID | Returns array of IDs | Returns `WP_Post` |
| `$this->factory()->user` | Returns user ID | Returns array of IDs | Returns `WP_User` |
| `$this->factory()->term` | Returns term ID | Returns array of IDs | Returns `WP_Term` |
| `$this->factory()->comment` | Returns comment ID | Returns array of IDs | Returns comment object |
| `$this->factory()->attachment` | Returns attachment ID | Returns array of IDs | Returns `WP_Post` |
| `$this->factory()->category` | Returns term ID | Returns array of IDs | Returns `WP_Term` |
| `$this->factory()->tag` | Returns term ID | Returns array of IDs | Returns `WP_Term` |

### Useful WP Test Functions

| Function | Purpose |
|----------|---------|
| `wp_set_current_user( $id )` | Switch current user |
| `do_shortcode( '[tag]' )` | Test shortcode output |
| `rest_do_request( $request )` | Test REST API |
| `apply_filters( 'hook', $value )` | Test filter result |
| `did_action( 'hook' )` | Check if action was fired |
| `has_action( 'hook', 'callback' )` | Check if action is registered |
| `has_filter( 'hook', 'callback' )` | Check if filter is registered |
| `is_plugin_active( 'dir/file.php' )` | Check plugin active status |
| `post_type_exists( 'type' )` | Check CPT registration |
| `taxonomy_exists( 'taxonomy' )` | Check taxonomy registration |
| `shortcode_exists( 'tag' )` | Check shortcode registration |

### DB Auto-Rollback

`WP_UnitTestCase` wraps each test in a database transaction and rolls back after completion. No manual cleanup of test data is needed.
