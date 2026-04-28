---
name: powerhouse-v3.3
description: |
  Powerhouse WordPress plugin (v3.3.x) complete technical reference. Core infrastructure plugin
  providing unified REST API, license code management, access control (Limit), subscription
  lifecycle, theme system, CAPTCHA, email domain validation, API booster, and mu-plugin services
  for all power-* child plugins. Use this skill whenever working with code that imports from
  J7\Powerhouse namespace, references the v2/powerhouse REST API, uses ph_access_itemmeta table,
  powerhouse_settings option, powerhouse_subscription_at_* hooks, powerhouse/limit/* hooks,
  powerhouse/option/* filters, or any power-* plugin that depends on Powerhouse.
---

# Powerhouse v3.3 Technical Reference

Powerhouse is the core infrastructure WordPress plugin for the power-* ecosystem. It provides
unified REST APIs, license code management, access control, WooCommerce subscription lifecycle
hooks, theme/color system, CAPTCHA protection, email domain validation, API acceleration, and
mu-plugin services.

- **Namespace**: `J7\Powerhouse`
- **REST API Base**: `/wp-json/v2/powerhouse`
- **Requires**: PHP 8.1+, WordPress 5.7+
- **Optional**: WooCommerce (for Product, Order, Subscription, Limit, Report domains)
- **Optional**: WooCommerce Subscriptions (for subscription lifecycle hooks)

## Architecture Overview

Powerhouse uses a domain-driven structure under `inc/classes/Domains/`. Each domain has:
- `Core/V2Api.php` -- REST API endpoints (extends `ApiBase`)
- `Model/` -- Data models and DTOs
- `Utils/` -- CRUD helpers and utilities
- `Shared/Enums/` -- PHP 8.1 enums

### Domain Loading

`Domains\Loader` initializes all domain APIs. WooCommerce-dependent domains load conditionally:

```
Always loaded: Comment, Post, Term, User, Option, Shortcode, Upload, LC, Plugin, Register
WooCommerce required: Woocommerce, Product, ProductAttribute, Copy, Limit, Order, Report, Subscription
WC Subscriptions required: Subscription\LifeCycle, Subscription\RetryPayment
```

### Plugin Bootstrap Flow

1. `Plugin::instance()` -- Singleton init, calls `Bootstrap::instance()`
2. `Bootstrap` -- Admin entry, API base, domain loader, theme, captcha
3. `Admin\Entry` -- Admin menu, Vite asset enqueue
4. `Domains\Loader` -- All REST API registrations
5. `Compatibility\Services\Scheduler` -- mu-plugin file deployment via Action Scheduler

## REST API Reference

Base URL: `/wp-json/v2/powerhouse`
All endpoints require `manage_options` capability (WordPress nonce auth).
Pagination headers: `X-WP-Total`, `X-WP-TotalPages`, `X-WP-CurrentPage`, `X-WP-PageSize`.

For the full OpenAPI 3.0 spec with all request/response schemas, see
[references/api-reference.md](references/api-reference.md).

### Endpoint Summary

| Tag | Method | Path | Description |
|-----|--------|------|-------------|
| Settings | GET | `/options` | Get all settings |
| Settings | POST | `/options` | Partial update settings |
| Settings | GET | `/options/upload` | Get allowed MIME types (deprecated) |
| LicenseCode | GET | `/lc` | Query license code statuses |
| LicenseCode | POST | `/lc/activate` | Activate license code via CloudAPI |
| LicenseCode | POST | `/lc/deactivate` | Deactivate license code |
| LicenseCode | POST | `/lc/invalidate` | Clear license code cache (public callback) |
| Limit | POST | `/limit/grant-users` | Grant users access to items |
| Limit | POST | `/limit/update-users` | Update user access expiration |
| Limit | POST | `/limit/revoke-users` | Revoke user access |
| Post | GET | `/posts` | List posts (any post_type) |
| Post | POST | `/posts` | Create post(s) (qty for batch) |
| Post | DELETE | `/posts` | Batch delete posts |
| Post | POST | `/posts/sort` | Sort posts (menu_order + parent) |
| Post | GET | `/posts/{id}` | Get single post |
| Post | POST | `/posts/{id}` | Update post |
| Post | DELETE | `/posts/{id}` | Delete single post |
| Post | GET | `/posts/{id}/field/{fieldName}` | Get specific post field |
| Post | POST | `/copy/{id}` | Copy post with children |
| Product | GET | `/products` | List products |
| Product | POST | `/products` | Create product or batch update (action=update-many) |
| Product | DELETE | `/products` | Batch delete products |
| Product | GET | `/products/select` | Lightweight product selector |
| Product | GET | `/products/options` | Product categories, tags, top sales |
| Product | POST | `/products/bind-items` | Bind access items to products |
| Product | POST | `/products/unbind-items` | Unbind access items |
| Product | POST | `/products/update-bound-items` | Update bound item limits |
| Product | GET | `/products/{id}` | Get single product |
| Product | POST | `/products/{id}` | Update product |
| Product | DELETE | `/products/{id}` | Delete product (force_delete option) |
| Product | POST | `/products/attributes/{id}` | Update product attributes |
| Product | POST | `/products/create-variations/{id}` | Auto-generate variations |
| Product | POST | `/products/update-variations/{id}` | Update variations + defaults |
| Order | GET | `/orders` | List orders |
| Order | POST | `/orders` | Create order (status=pending) |
| Order | DELETE | `/orders` | Batch delete orders |
| Order | GET | `/orders/options` | Get order status options |
| Order | GET | `/orders/{id}` | Get single order with notes |
| Order | POST | `/orders/{id}` | Update order |
| Order | DELETE | `/orders/{id}` | Delete single order |
| Order | POST | `/order-notes` | Create order note |
| Order | DELETE | `/order-notes/{id}` | Delete order note |
| User | GET | `/users` | List users |
| User | POST | `/users` | Create user(s) or batch update (with ids) |
| User | DELETE | `/users` | Batch delete users |
| User | GET | `/users/options` | Get editable roles |
| User | POST | `/users/resetpassword` | Batch send reset password emails |
| User | GET | `/users/{id}` | Get single user |
| User | POST | `/users/{id}` | Update user |
| User | DELETE | `/users/{id}` | Delete single user |
| Term | GET | `/terms/{taxonomy}` | List terms (sorted by order meta ASC) |
| Term | POST | `/terms/{taxonomy}` | Create term(s) |
| Term | DELETE | `/terms/{taxonomy}` | Batch delete terms |
| Term | POST | `/terms/{taxonomy}/sort` | Sort terms (termmeta order) |
| Term | GET | `/terms/{taxonomy}/{id}` | Get single term |
| Term | POST | `/terms/{taxonomy}/{id}` | Update term |
| Term | DELETE | `/terms/{taxonomy}/{id}` | Delete single term |
| Comment | POST | `/comments` | Create comment (current user) |
| Comment | DELETE | `/comments/{id}` | Delete comment |
| Upload | GET | `/upload/options` | Get allowed MIME types (object format) |
| Upload | POST | `/upload` | Upload file(s), upload_only option |
| ProductAttr | GET | `/product-attributes` | List global product attributes |
| ProductAttr | POST | `/product-attributes` | Create global product attribute |
| ProductAttr | POST | `/product-attributes/{id}` | Update product attribute |
| ProductAttr | DELETE | `/product-attributes/{id}` | Delete product attribute |
| Report | GET | `/reports/revenue/stats` | Revenue statistics (WC Analytics) |
| Misc | GET | `/shortcode` | Execute shortcode, return HTML |
| Misc | GET | `/plugins` | List installed plugins with status |
| Misc | GET | `/woocommerce` | Get WooCommerce global settings |

## Data Model

### Custom Table: `{prefix}ph_access_itemmeta`

Created on plugin activation. Stores per-user, per-item access grants.

| Column | Type | Description |
|--------|------|-------------|
| meta_id | int PK AUTO | Primary key |
| post_id | int NOT NULL | Content item ID (e.g., course ID) |
| user_id | int NOT NULL | Granted user ID |
| meta_key | varchar(255) | Fixed: `expire_date` |
| meta_value | longtext | `"0"` (unlimited), Unix timestamp string, or `"subscription_{id}"` |

Unique index on `(user_id, post_id, meta_key)`.

### Settings: `wp_options.powerhouse_settings`

JSON object. See [references/settings-model.md](references/settings-model.md) for all fields.

Key fields: `enable_captcha_login`, `enable_captcha_register`, `captcha_role_list`,
`enable_email_domain_check_register`, `enable_email_domain_check_wp_mail`,
`email_domain_check_white_list`, `delay_email`, `last_name_optional`, `theme`,
`enable_theme`, `enable_theme_changer`, `theme_css`, `api_booster_rules`,
`bunny_library_id`, `bunny_cdn_hostname`, `bunny_stream_api_key`.

### License Codes: `wp_options.powerhouse_license_codes`

JSON object mapping `{product_slug: saved_code}`.
Status cached in transient `lc_{product_slug}` (AES encrypted, 24h TTL).
Verified against CloudAPI at `cloud.luke.cafe`.

### BoundItemData (Product Access Binding)

Stored in `wp_postmeta` under configurable `meta_key` (e.g., `_course_ids`).
Each entry: `{id, name, limit_type, limit_value, limit_unit}`.
- `limit_type`: `unlimited` | `fixed_date` | `fixed_duration`
- `limit_unit`: `day` | `month` | `year` (for fixed_duration)

### MessageTemplate CPT: `ph_message_tpl`

Custom post type for message templates used by child plugins.
Supports: title, custom-fields. DTO fields: id, name, subject (meta), content, content_type (meta).
`EContentType` enum: `HTML`, `PLAIN_TEXT`, `JSON`, `XML`.

## WordPress Hooks

### Actions (Limit Domain)

```php
// Trigger to grant user access
do_action('powerhouse/limit/grant_user_to_item', int $user_id, int $post_id, int|string $expire_date, ?WC_Order $order);

// After grant completes (always fires, even on failure)
do_action('powerhouse/limit/after_grant_user_to_item', int $user_id, int $post_id, int|string $expire_date, ?WC_Order $order);

// After update user expiration
do_action('powerhouse/limit/after_update_user_from_item', int $user_id, int $post_id, int $timestamp);

// After revoke user access
do_action('powerhouse/limit/after_revoke_user_from_item', int $user_id, int $post_id);

// BoundItemData grant/revoke callbacks
do_action('powerhouse/limit/grant_user_success', int $user_id, ?WC_Order $order, BoundItemData $item, string $meta_key);
do_action('powerhouse/limit/grant_user_failed', int $user_id, ?WC_Order $order, BoundItemData $item, string $meta_key);
do_action('powerhouse/limit/revoke_user_success', int $user_id, ?WC_Order $order, BoundItemData $item, string $meta_key);
do_action('powerhouse/limit/revoke_user_failed', int $user_id, ?WC_Order $order, BoundItemData $item, string $meta_key);
```

### Actions (Subscription Domain)

All subscription hooks follow the pattern `powerhouse_subscription_at_{action_value}`.
Parameters: `(WC_Subscription $subscription, array $context)`.

```php
// Subscription created
do_action('powerhouse_subscription_at_date_created', $subscription, []);

// First payment complete (only fires when exactly 1 related order = parent order)
do_action('powerhouse_subscription_at_initial_payment_complete', $subscription, []);

// Subscription status: active -> cancelled/expired
do_action('powerhouse_subscription_at_subscription_failed', $subscription, ['from_status' => Status, 'to_status' => Status]);

// Subscription status: cancelled/expired -> active
do_action('powerhouse_subscription_at_subscription_success', $subscription, ['from_status' => Status, 'to_status' => Status]);

// Payment retry triggered
do_action('powerhouse_subscription_at_payment_retry', $subscription, ['order' => WC_Order]);

// Scheduled events
do_action('powerhouse_subscription_at_trial_end', $subscription, []);
do_action('powerhouse_subscription_at_next_payment', $subscription, []);
do_action('powerhouse_subscription_at_end', $subscription, []);
do_action('powerhouse_subscription_at_end_of_prepaid_term', $subscription, []);

// Renewal order created
do_action('powerhouse_subscription_at_renewal_order_created', $subscription, ['renewal_order' => WC_Order]);

// Watch date changes (fires when subscription dates are updated)
do_action('powerhouse_subscription_at_watch_trial_end', $subscription, ['datetime' => string]);
do_action('powerhouse_subscription_at_watch_end', $subscription, ['datetime' => string]);
do_action('powerhouse_subscription_at_watch_next_payment', $subscription, ['datetime' => string]);
```

### Actions (Compatibility)

```php
// Fires once per version upgrade via Action Scheduler (async)
do_action('powerhouse_compatibility_action_scheduler');
```

### Filters

```php
// Extend allowed settings fields for POST /options
// Default: ['powerhouse_settings' => []]
// Child plugins add their own option keys here
apply_filters('powerhouse/option/allowed_fields', array $fields);

// Keys to skip sanitization during settings update
apply_filters('powerhouse/option/skip_sanitize_keys', array $keys);

// Modify GET /options response data
apply_filters('powerhouse/options/get_options', array $options, WP_REST_Request $request);

// Register child plugin product info for license code management
// Return: [{product_slug, product_name, ...}, ...]
apply_filters('powerhouse_product_infos', array $product_infos);
```

## Infrastructure Services

### API Booster (mu-plugin)

Deployed to `wp-content/mu-plugins/powerhouse-api-booster.php` via Action Scheduler.
Intercepts REST API requests and filters `active_plugins` to load only required plugins
for matching URL patterns. Configured via `powerhouse_settings.api_booster_rules`.

Rule structure: `{name, enabled (yes/no), rules (newline-separated URL patterns), plugins (array)}`.
URL patterns support `*` wildcard for `[0-9a-zA-Z/]` segments.

### Email Domain Validator (mu-plugin)

Deployed to `wp-content/mu-plugins/powerhouse-email-validator.php`.
Validates email domains have valid MX records before registration or sending.
Controlled by `enable_email_domain_check_register` and `enable_email_domain_check_wp_mail`.
White-listed domains in `email_domain_check_white_list` skip validation.

### Disable Features (mu-plugin)

Deployed to `wp-content/mu-plugins/powerhouse-disable-features.php`.
Disables unnecessary WordPress features for security/performance.

### Powerhouse Loader (mu-plugin)

Deployed to `wp-content/mu-plugins/powerhouse-loader.php`.
Ensures Powerhouse loads at mu-plugin priority.

### Auto Update

`Compatibility\Services\AutoUpdate` -- Handles plugin auto-update from GitHub releases.

### CAPTCHA

Login and registration CAPTCHA protection.
Controlled by `enable_captcha_login`, `enable_captcha_register`, `captcha_role_list`.

### Theme / Color System

DaisyUI-based theming with OKLCH color space. Preset theme: `power`.
Custom themes stored in `powerhouse_settings.theme_css` as CSS custom properties.
Applied via `#tw[data-theme='{theme}']` selector. Supports `color-scheme: light/dark`.

Properties: `--p` (primary), `--s` (secondary), `--a` (accent), `--n` (neutral),
`--b1/b2/b3` (base), `--in/su/wa/er` (status colors), plus content variants and radii.

### Subscription Retry Payment

Overrides WooCommerce Subscriptions default retry rules.
3 retries at 1-hour intervals (instead of default 5 retries over 7 days).
After max retries exceeded, subscription transitions to cancelled (not on-hold).

### Subscription Times DTO

```php
$times = Times::instance($subscription);
// Properties: trial_end, next_payment, last_order_date_created, end, end_of_prepaid_term
// All integer Unix timestamps
```

## Cloud API Integration

`Api\Base` communicates with `cloud.luke.cafe` (production) for license code verification.
Environment-aware: local/staging/production with different credentials.
Uses WordPress Basic Auth over `wp_remote_get/post/request`.
Endpoint base: `{base_url}/wp-json/power-partner-server`.

## Key PHP Classes

| Class | Responsibility |
|-------|----------------|
| `Plugin` | Singleton entry point, version, paths, template loading |
| `Bootstrap` | Wires admin, APIs, domains, theme, captcha |
| `Domains\Loader` | Initializes all domain V2Api instances |
| `Settings\Model\Settings` | DTO for `powerhouse_settings`, partial_update support |
| `Theme\Model\Theme` | OKLCH color system, CSS variable generation |
| `Domains\Limit\Models\BoundItemData` | Single bound item with limit config, grant/revoke |
| `Domains\Limit\Models\LifeCycle` | Limit action hook handlers |
| `Domains\Limit\Utils\MetaCRUD` | Direct CRUD on ph_access_itemmeta table |
| `Domains\Subscription\Core\LifeCycle` | WC Subscription hook registration |
| `Domains\Subscription\Core\RetryPayment` | Custom retry rules |
| `Domains\Subscription\DTOs\Times` | Subscription date timestamps |
| `Domains\Subscription\Shared\Enums\Action` | Subscription lifecycle action enum |
| `Domains\Subscription\Shared\Enums\Status` | Subscription status enum |
| `Api\Base` | CloudAPI HTTP client |
| `Compatibility\Shared\MuPluginsLoader` | Abstract mu-plugin file deployer |
| `Compatibility\Services\Scheduler` | Action Scheduler-based compatibility runner |
| `Contracts\DTOs\MessageTemplateDTO` | Message template data transfer object |
| `Shared\Enums\EContentType` | HTML/PLAIN_TEXT/JSON/XML enum |

## Frontend Stack

- React 18 + TypeScript + Vite (via `@kucrut/vite-for-wp`)
- Ant Design 5 + antd-toolkit
- Refine.dev v4 (CRUD framework) + @refinedev/simple-rest
- TanStack Query v4
- React Router v7
- Jotai (state management)
- Zod v3 (validation)
- BlockNote v0.30 (rich text editor)
- Tailwind CSS v3 + DaisyUI
- Admin SPA mounts on `admin.php?page=powerhouse`

## Reference Files

- [references/api-reference.md](references/api-reference.md) -- Full OpenAPI endpoint details with schemas
- [references/settings-model.md](references/settings-model.md) -- Settings fields, defaults, and filter extension
- [references/hooks-reference.md](references/hooks-reference.md) -- Complete hooks catalog with signatures
