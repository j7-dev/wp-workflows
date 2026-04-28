# Powerhouse Hooks Reference

Complete catalog of WordPress actions and filters provided by Powerhouse.

## Table of Contents

1. [Limit Domain Actions](#limit-domain-actions)
2. [Subscription Domain Actions](#subscription-domain-actions)
3. [Compatibility Actions](#compatibility-actions)
4. [Settings Filters](#settings-filters)
5. [License Code Filters](#license-code-filters)
6. [WooCommerce Modifications](#woocommerce-modifications)

---

## Limit Domain Actions

These actions operate on the `ph_access_itemmeta` table for content access control.

### powerhouse/limit/grant_user_to_item

Trigger point for granting user access. The handler writes to `ph_access_itemmeta`.

```php
do_action(
    'powerhouse/limit/grant_user_to_item',
    int $user_id,       // User to grant access
    int $post_id,       // Content item ID
    int|string $expire_date, // Unix timestamp, "0" (unlimited), or "subscription_{id}"
    ?WC_Order $order    // Associated order (nullable)
);
```

**Where fired:** `Limit\Core\V2Api::post_limit_grant_users_callback()` (REST API),
`BoundItemData::grant_user()` (programmatic).

### powerhouse/limit/after_grant_user_to_item

Fires after the grant operation (regardless of success/failure).

```php
do_action(
    'powerhouse/limit/after_grant_user_to_item',
    int $user_id,
    int $post_id,
    int|string $expire_date,
    ?WC_Order $order
);
```

### powerhouse/limit/after_update_user_from_item

Fires when updating user's access expiration timestamp.

```php
do_action(
    'powerhouse/limit/after_update_user_from_item',
    int $user_id,
    int $post_id,
    int $timestamp  // New expiration; 0 = unlimited
);
```

### powerhouse/limit/after_revoke_user_from_item

Fires when revoking user's access to an item.

```php
do_action(
    'powerhouse/limit/after_revoke_user_from_item',
    int $user_id,
    int $post_id
);
```

### powerhouse/limit/grant_user_success

Fires when `BoundItemData::grant_user()` succeeds.

```php
do_action(
    'powerhouse/limit/grant_user_success',
    int $user_id,
    ?WC_Order $order,
    BoundItemData $bound_item_data,
    string $meta_key  // Usually "expire_date"
);
```

### powerhouse/limit/grant_user_failed

Fires when `BoundItemData::grant_user()` fails (before exception is thrown).

```php
do_action(
    'powerhouse/limit/grant_user_failed',
    int $user_id,
    ?WC_Order $order,
    BoundItemData $bound_item_data,
    string $meta_key
);
```

### powerhouse/limit/revoke_user_success

Fires when `BoundItemData::revoke_user()` succeeds.

```php
do_action(
    'powerhouse/limit/revoke_user_success',
    int $user_id,
    ?WC_Order $order,
    BoundItemData $bound_item_data,
    string $meta_key
);
```

### powerhouse/limit/revoke_user_failed

Fires when `BoundItemData::revoke_user()` fails (before exception is thrown).

```php
do_action(
    'powerhouse/limit/revoke_user_failed',
    int $user_id,
    ?WC_Order $order,
    BoundItemData $bound_item_data,
    string $meta_key
);
```

---

## Subscription Domain Actions

Requires WooCommerce + WooCommerce Subscriptions.
All hooks follow the pattern: `powerhouse_subscription_at_{action_value}`.
All callbacks receive: `(WC_Subscription $subscription, array $context)`.

### powerhouse_subscription_at_date_created

Fires when a new subscription is created.

```php
do_action('powerhouse_subscription_at_date_created', WC_Subscription $subscription, []);
```

Source: `wcs_create_subscription` hook.

### powerhouse_subscription_at_initial_payment_complete

Fires when the first payment on a subscription completes.
Only triggers when the subscription has exactly 1 related order (the parent order).

```php
do_action('powerhouse_subscription_at_initial_payment_complete', WC_Subscription $subscription, []);
```

Source: `woocommerce_subscription_payment_complete` hook.
Guard: `count(related_order_ids) === 1 && related_order === parent_order`.

### powerhouse_subscription_at_subscription_failed

Fires when subscription transitions from a non-failed status to a failed status.
Failed statuses: `cancelled`, `expired`.
Non-failed statuses: `active`, `on-hold`, `pending-cancel`.

```php
do_action('powerhouse_subscription_at_subscription_failed', WC_Subscription $subscription, [
    'from_status' => Status $from,  // e.g., Status::ACTIVE
    'to_status'   => Status $to,    // e.g., Status::CANCELLED
]);
```

Source: `woocommerce_subscription_pre_update_status` hook.

### powerhouse_subscription_at_subscription_success

Fires when subscription transitions from a failed status to `active`.
Only fires when `from_status->is_failed()` is true AND `to_status === Status::ACTIVE`.

```php
do_action('powerhouse_subscription_at_subscription_success', WC_Subscription $subscription, [
    'from_status' => Status $from,  // e.g., Status::EXPIRED
    'to_status'   => Status $to,    // Status::ACTIVE
]);
```

### powerhouse_subscription_at_payment_retry

Fires when a payment retry is triggered.

```php
do_action('powerhouse_subscription_at_payment_retry', WC_Subscription $subscription, [
    'order' => WC_Order $retry_order,
]);
```

Source: `woocommerce_scheduled_subscription_payment_retry`.

### powerhouse_subscription_at_trial_end

Fires when a subscription's trial period ends.

```php
do_action('powerhouse_subscription_at_trial_end', WC_Subscription $subscription, []);
```

Source: `woocommerce_scheduled_subscription_trial_end`.

### powerhouse_subscription_at_next_payment

Fires at the next payment date.

```php
do_action('powerhouse_subscription_at_next_payment', WC_Subscription $subscription, []);
```

Source: `woocommerce_scheduled_subscription_next_payment`.

### powerhouse_subscription_at_end

Fires when subscription reaches its end date.

```php
do_action('powerhouse_subscription_at_end', WC_Subscription $subscription, []);
```

Source: `woocommerce_scheduled_subscription_end`.

### powerhouse_subscription_at_end_of_prepaid_term

Fires at the end of a prepaid term (for cancelled/pending-cancel subscriptions).

```php
do_action('powerhouse_subscription_at_end_of_prepaid_term', WC_Subscription $subscription, []);
```

Source: `woocommerce_scheduled_subscription_end_of_prepaid_term`.

### powerhouse_subscription_at_renewal_order_created

Fires when a renewal order is created for a subscription.

```php
do_action('powerhouse_subscription_at_renewal_order_created', WC_Subscription $subscription, [
    'renewal_order' => WC_Order $renewal_order,
]);
```

Source: `wcs_renewal_order_created` filter (used as action).

### powerhouse_subscription_at_watch_trial_end

Fires when a subscription's trial_end date is updated.

```php
do_action('powerhouse_subscription_at_watch_trial_end', WC_Subscription $subscription, [
    'datetime' => string $new_datetime,
]);
```

Source: `woocommerce_subscription_date_updated` hook.

### powerhouse_subscription_at_watch_end

Fires when a subscription's end date is updated.

```php
do_action('powerhouse_subscription_at_watch_end', WC_Subscription $subscription, [
    'datetime' => string $new_datetime,
]);
```

### powerhouse_subscription_at_watch_next_payment

Fires when a subscription's next_payment date is updated.

```php
do_action('powerhouse_subscription_at_watch_next_payment', WC_Subscription $subscription, [
    'datetime' => string $new_datetime,
]);
```

### Subscription Status Enum

```php
namespace J7\Powerhouse\Domains\Subscription\Shared\Enums;

enum Status: string {
    case ACTIVE = 'active';
    case ON_HOLD = 'on-hold';
    case PENDING_CANCEL = 'pending-cancel';
    case CANCELLED = 'cancelled';
    case EXPIRED = 'expired';

    public function is_failed(): bool; // true for CANCELLED, EXPIRED
}
```

### Subscription Action Enum

```php
enum Action: string {
    case DATE_CREATED = 'date_created';
    case INITIAL_PAYMENT_COMPLETE = 'initial_payment_complete';
    case SUBSCRIPTION_FAILED = 'subscription_failed';
    case SUBSCRIPTION_SUCCESS = 'subscription_success';
    case PAYMENT_RETRY = 'payment_retry';
    case TRIAL_END = 'trial_end';
    case WATCH_TRIAL_END = 'watch_trial_end';
    case NEXT_PAYMENT = 'next_payment';
    case WATCH_NEXT_PAYMENT = 'watch_next_payment';
    case RENEWAL_ORDER_CREATED = 'renewal_order_created';
    case END = 'end';
    case WATCH_END = 'watch_end';
    case END_OF_PREPAID_TERM = 'end_of_prepaid_term';

    public function get_action_hook(): string; // "powerhouse_subscription_at_{value}"
}
```

---

## Compatibility Actions

### powerhouse_compatibility_action_scheduler

Fires once per plugin version via Action Scheduler (async).
Handles mu-plugin deployment, table creation, schema migrations.

```php
do_action('powerhouse_compatibility_action_scheduler');
```

Registered handlers:
- `CreateTable::create_itemmeta_table()` -- Ensure `ph_access_itemmeta` exists
- `EmailValidator::instance()` -- Deploy email validator mu-plugin
- `Loader::instance()` -- Deploy powerhouse loader mu-plugin
- `ApiBooster::instance()` -- Deploy API booster mu-plugin
- `Scheduler::modify_action_scheduler_table_schema()` -- Migrate `args` column to longtext

---

## Settings Filters

### powerhouse/option/allowed_fields

Extends the set of option keys that `POST /options` accepts.

```php
// Default: ['powerhouse_settings' => []]
apply_filters('powerhouse/option/allowed_fields', array $fields): array;
```

Usage by child plugins:
```php
add_filter('powerhouse/option/allowed_fields', function (array $fields): array {
    $fields['my_plugin_settings'] = [];
    return $fields;
});
```

### powerhouse/option/skip_sanitize_keys

Keys listed here bypass `sanitize_text_field_deep()` during settings update.

```php
apply_filters('powerhouse/option/skip_sanitize_keys', array $keys): array;
```

### powerhouse/options/get_options

Modifies the response data of `GET /options`.

```php
apply_filters('powerhouse/options/get_options', array $options, WP_REST_Request $request): array;
```

---

## License Code Filters

### powerhouse_product_infos

Child plugins register their product info for the license code management UI.
If empty, the license code submenu is hidden.

```php
apply_filters('powerhouse_product_infos', array $product_infos): array;
```

Expected return format:
```php
[
    [
        'product_slug' => 'power-course',
        'product_name' => 'Power Course',
        // ...additional fields
    ],
]
```

---

## WooCommerce Modifications

### Payment Retry Rules

Powerhouse overrides default WooCommerce Subscriptions retry rules:
- 3 retries at 1-hour intervals (default: 5 retries over 7 days)
- After max retries, subscription moves to `cancelled` (default: stays `on-hold`)

```php
// Force subscription cancellation after max retries
add_filter('woocommerce_subscription_max_failed_payments_exceeded', '__return_true', 100, 2);

// Custom retry rules
add_filter('wcs_default_retry_rules', [RetryPayment::class, 'set_retry_rule']);
```

### Action Scheduler Schema

Powerhouse migrates the `wp_actionscheduler_actions.args` column from `varchar(191)` to
`longtext` to support large action arguments. Runs once per version via compatibility scheduler.
