# Powerhouse REST API Reference

Base URL: `/wp-json/v2/powerhouse`
Auth: WordPress nonce (`X-WP-Nonce` header or `_wpnonce` parameter).
All endpoints require `manage_options` capability unless noted otherwise.

## Table of Contents

1. [Settings](#settings)
2. [License Code](#license-code)
3. [Limit (Access Control)](#limit)
4. [Posts](#posts)
5. [Products](#products)
6. [Orders](#orders)
7. [Users](#users)
8. [Terms](#terms)
9. [Comments](#comments)
10. [Upload](#upload)
11. [Product Attributes](#product-attributes)
12. [Reports](#reports)
13. [Miscellaneous](#miscellaneous)
14. [Common Response Schemas](#common-response-schemas)

---

## Settings

### GET /options

Returns all Powerhouse settings.

**Response 200:**
```json
{
  "code": "get_options_success",
  "message": "...",
  "data": {
    "powerhouse_settings": {
      "enable_manual_send_email": "no",
      "enable_captcha_login": "no",
      "captcha_role_list": ["administrator"],
      "enable_captcha_register": "no",
      "enable_email_domain_check_register": "yes",
      "enable_email_domain_check_wp_mail": "yes",
      "email_domain_check_white_list": ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"],
      "delay_email": "yes",
      "last_name_optional": "yes",
      "theme": "power",
      "enable_theme_changer": "no",
      "enable_theme": "yes",
      "theme_css": { "...OKLCH CSS vars..." },
      "api_booster_rules": [],
      "api_booster_rule_recipes": [],
      "bunny_library_id": "",
      "bunny_cdn_hostname": "",
      "bunny_stream_api_key": ""
    }
  }
}
```

Response data is extensible via `powerhouse/options/get_options` filter.

### POST /options

Partial update settings. Only registered fields are accepted.

**Request body (JSON):**
```json
{
  "powerhouse_settings": {
    "enable_captcha_login": "yes",
    "captcha_role_list": ["administrator", "editor"]
  }
}
```

Additional top-level keys allowed via `powerhouse/option/allowed_fields` filter.
Sanitization skippable for specific keys via `powerhouse/option/skip_sanitize_keys` filter.

**Response 200:**
```json
{
  "code": "post_user_success",
  "message": "...",
  "data": { "...submitted fields..." }
}
```

### GET /options/upload (deprecated)

Returns allowed MIME types as flattened accept string for HTML input.
Use `GET /upload/options` instead.

---

## License Code

### GET /lc

Returns all registered license code statuses. Statuses are cached in transients.

**Response 200:**
```json
[
  {
    "code": "TEST-CODE-01",
    "post_status": "activated",
    "expire_date": "1800000000",
    "type": "standard",
    "product_slug": "power-course",
    "product_name": "Power Course",
    "link": "https://example.com"
  }
]
```

### POST /lc/activate

Activates a license code via CloudAPI (`cloud.luke.cafe`).

**Request body (JSON):**
```json
{
  "code": "TEST-CODE-01",
  "product_slug": "power-course"
}
```

**Response 200:**
```json
{
  "code": "activate_lc_success",
  "message": "...",
  "data": { "...LicenseCodeStatus..." }
}
```

**Response 500:** CloudAPI returned 401 or connection error.

Side effects:
- Sets transient `lc_{product_slug}` (AES encrypted, 24h TTL)
- Saves code to `powerhouse_license_codes` option

### POST /lc/deactivate

**Request body:** Same as activate (`code`, `product_slug`).
Side effects: Deletes transient, removes from `powerhouse_license_codes`.

### POST /lc/invalidate

Public endpoint for CloudAPI callbacks. Clears cached transient.

**Request body (JSON):**
```json
{ "product_slug": "power-course" }
```

**Response 200:**
```json
{
  "code": "invalidate_lc_cache_success",
  "message": "...",
  "data": { "delete_transient_result": true, "product_slug": "power-course" }
}
```

---

## Limit

Access control for content items. Operates on `ph_access_itemmeta` table.

### POST /limit/grant-users

**Request body (form-urlencoded):**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| user_ids | int[] | Yes | User IDs to grant |
| item_ids | int[] | Yes | Content item IDs |
| expire_date | string | Yes | Unix timestamp (10-digit), `"0"` (unlimited), or `"subscription_{id}"` |

**Response 200:**
```json
{
  "code": "grant_users_success",
  "message": "...",
  "data": { "user_ids": "101,102", "item_ids": "201,202", "expire_date": "1800000000" }
}
```

Triggers: `powerhouse/limit/grant_user_to_item` -> `powerhouse/limit/after_grant_user_to_item`.

### POST /limit/update-users

**Request body (form-urlencoded):**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| user_ids | int[] | Yes | User IDs |
| item_ids | int[] | Yes | Item IDs |
| timestamp | int | Yes | Unix timestamp; 0 = unlimited |

Triggers: `powerhouse/limit/after_update_user_from_item`.

### POST /limit/revoke-users

**Request body (form-urlencoded):**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| user_ids | int[] | Yes | User IDs |
| item_ids | int[] | Yes | Item IDs |

Triggers: `powerhouse/limit/after_revoke_user_from_item`.

---

## Posts

### GET /posts

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| post_type | string | post | WordPress post type |
| posts_per_page | int | 20 | Items per page |
| paged | int | 1 | Page number |
| post_parent | string | "0" | Parent ID; `"unset"` for no filter |
| post_status | string | any | Post status filter |
| depth | int | 0 | Child nesting depth; 0 = no children |
| meta_keys[] | string[] | - | Additional meta fields to include |
| with_description | bool | false | Include post_content |

**Response 200:** Array of Post objects. Pagination in headers.

Post object:
```json
{
  "ID": 123,
  "post_title": "...",
  "post_content": "...",
  "post_status": "publish",
  "post_type": "post",
  "post_parent": 0,
  "menu_order": 0,
  "post_date": "2024-01-01 00:00:00",
  "meta": { "custom_key": "value" },
  "children": [ "...nested Post objects if depth > 0..." ]
}
```

### POST /posts

Create post(s). Content-Type: `multipart/form-data`.

| Param | Type | Description |
|-------|------|-------------|
| post_title | string | Title |
| post_type | string | Post type (default: post) |
| post_status | string | Status |
| post_content | string | Content |
| post_excerpt | string | Excerpt |
| post_parent | int | Parent ID |
| qty | int | Batch create quantity (default: 1) |
| images | file/string | Thumbnail file; `"delete"` to remove |

**Response 200:** `{ code: "create_success", data: [new_id_1, new_id_2] }`

### DELETE /posts

Batch delete. Body: `{ "ids": [1, 2, 3] }`.

### POST /posts/sort

Reorder posts. Body: `{ "from_tree": [{id: "1"}, ...], "to_tree": [{id: "1"}, ...] }`.
Updates `menu_order` and `post_parent`.

### GET /posts/{id}

Single post. Params: `meta_keys[]`, `depth`.

### POST /posts/{id}

Update post. Same fields as create (multipart/form-data).

### DELETE /posts/{id}

Delete single post (trash).

### GET /posts/{id}/field/{fieldName}

Get a single field value. `fieldName` must match `^[a-zA-Z_-]+$`.

### POST /copy/{id}

Deep copy post including all children. Returns new post ID.

---

## Products

Requires WooCommerce.

### GET /products

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| status[] | string[] | publish, draft, pending, private, trash |
| posts_per_page | int | Items per page |
| paged | int | Page number |
| orderby | string | Sort field |
| order | string | ASC or DESC |
| meta_keys[] | string[] | Additional meta fields |
| partials[] | string[] | Partial model loading |

### POST /products

Create or batch update.

| Param | Type | Description |
|-------|------|-------------|
| name | string | Product name |
| status | string | Status |
| regular_price | string | Regular price |
| description | string | Description |
| short_description | string | Short description |
| slug | string | URL slug |
| qty | int | Batch create count (default: 1) |
| action | string | `"update-many"` for batch update mode |
| ids | int[] | Required for update-many |

### DELETE /products

Body: `{ "ids": [1,2], "force_delete": false }`.

### GET /products/select

Lightweight selector. Params: `s` (search), `post__in[]`, `posts_per_page`.
Returns: `[{ id, name, slug, status }]`.

### GET /products/options

Returns product categories, tags, shipping classes, top sales products, min/max price.

### POST /products/bind-items

Bind access control items to products.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| product_ids | int[] | Yes | Product IDs |
| item_ids | int[] | Yes | Content item IDs to bind |
| limit_type | string | Yes | `unlimited`, `fixed_date`, `fixed_duration` |
| limit_value | int | No | Duration value (for fixed types) |
| limit_unit | string | No | `day`, `month`, `year` |
| meta_key | string | Yes | e.g., `_course_ids` |

Stores as BoundItemsData in product postmeta.

### POST /products/unbind-items

Body: `product_ids`, `item_ids`, `meta_key`.

### POST /products/update-bound-items

Same schema as bind-items. Updates limit settings on existing bindings.

### POST /products/attributes/{id}

Update product attributes. Body field `new_attributes` is an array of attribute objects with:
`id`, `name`, `options[]`, `taxonomy`, `is_taxonomy` ("true" for global), `position`, `visible`, `variation`.

### POST /products/create-variations/{id}

Auto-generate all variation combinations from product attributes.
Returns: `{ created_variation_ids: [], deleted_variation_ids: [] }`.

### POST /products/update-variations/{id}

Body: `default_attributes` (object), `variations` (array of `{id, regular_price, sale_price, stock_status}`).

---

## Orders

Requires WooCommerce.

### GET /orders

| Param | Type | Description |
|-------|------|-------------|
| status[] | string[] | WC order statuses (e.g., `wc-processing`) |
| limit | int | Items per page (default: 30) |
| paged | int | Page number |
| customer_id | int | Filter by customer |
| type | string | Order type (default: `shop_order`) |
| orderby | string | Sort field |
| order | string | ASC/DESC |

### POST /orders

Creates empty order with status `pending`. No body required.

### GET /orders/{id}

Returns order detail including `order_notes` array.

### POST /order-notes

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| order_id | int | Yes | Order ID |
| note | string | Yes | Note content |
| is_customer_note | int | No | 0 or 1 (default: 0) |

---

## Users

### GET /users

| Param | Type | Description |
|-------|------|-------------|
| role | string | Filter by role (e.g., subscriber) |
| number | int | Items per page |
| paged | int | Page number |
| meta_keys[] | string[] | Additional meta fields |
| search | string | Search term |

### POST /users

Create or batch update. If `ids` is present, switches to batch update mode.

| Param | Type | Description |
|-------|------|-------------|
| user_login | string | Username |
| user_email | string | Email |
| user_pass | string | Password |
| role | string | Role |
| qty | int | Batch create count |
| ids | int[] | Batch update mode |

### POST /users/resetpassword

Body: `{ "ids": [101, 102] }`. Sends reset password emails.

---

## Terms

### GET /terms/{taxonomy}

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| posts_per_page | int | 20 | Items per page |
| paged | int | 1 | Page number |
| parent | int | 0 | Parent term ID |
| hide_empty | bool | false | Hide empty terms |

Sorted by termmeta `order` ASC, then `term_id` DESC.

### POST /terms/{taxonomy}

Create term(s). Multipart/form-data.

| Param | Type | Description |
|-------|------|-------------|
| name | string | Term name |
| slug | string | URL slug |
| description | string | Description |
| parent | int | Parent term ID |
| thumbnail_id | file/string | Thumbnail file or `"delete"` |
| qty | int | Batch create count |

### POST /terms/{taxonomy}/sort

Body: `{ "from_tree": [...], "to_tree": [...] }`. Updates termmeta `order`.

---

## Comments

### POST /comments

| Param | Type | Description |
|-------|------|-------------|
| note | string | Comment content |
| comment_type | string | Type (default: comment) |
| is_customer_note | string | "0" or "1" |
| commented_user_id | int | Target user ID |

Author auto-set from `wp_get_current_user()`.

---

## Upload

### GET /upload/options

Returns raw MIME type map: `{ "allowed_mime_types": { "jpg|jpeg|jpe": "image/jpeg", ... } }`.

### POST /upload

Multipart/form-data.

| Param | Type | Description |
|-------|------|-------------|
| files | file(s) | One or more files |
| upload_only | string | `"1"` = upload to disk only, skip media library |

Response data (single or array):
```json
{
  "id": "123",
  "url": "https://...",
  "type": "image/jpeg",
  "name": "photo.jpg",
  "size": 12345,
  "width": 800,
  "height": 600
}
```

---

## Product Attributes

Global WooCommerce product attributes.

### GET /product-attributes

Returns: `[{ id, name, slug, type, order_by, has_archives }]`.

### POST /product-attributes

Body: `{ name (required), slug, type (default: "select"), order_by (default: "menu_order"), has_archives (default: false) }`.

### POST /product-attributes/{id}

Update attribute. Same fields as create.

### DELETE /product-attributes/{id}

Delete attribute.

---

## Reports

### GET /reports/revenue/stats

Revenue statistics via WooCommerce Analytics.

| Param | Type | Description |
|-------|------|-------------|
| after | date | Start date (YYYY-MM-DD) |
| before | date | End date |
| interval | string | `day`, `week`, `month`, `year` |
| product_includes | string | Comma-separated product IDs |
| segmentby | string | Segment by field |
| order | string | `asc` or `desc` |

Response includes `totals` (with custom `refunded_orders_count`, `non_refunded_orders_count`)
and `intervals` array.

---

## Miscellaneous

### GET /shortcode

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| shortcode | string | Yes | e.g., `[my_shortcode attr="value"]` |

Returns rendered HTML in `data` field.

### GET /plugins

Returns all installed plugins with activation status.
Response: `[{ key, is_active, Name, Version, Description, Author, PluginURI }]`.

### GET /woocommerce

Returns WooCommerce global settings (currency, store info, etc.).
Returns 400 if WooCommerce is not active.

---

## Common Response Schemas

### Success Response
```json
{ "code": "string", "message": "string", "data": null }
```

### Error Response
```json
{ "code": "error_code", "message": "..." }
```

### Delete by ID Response
```json
{ "code": "delete_success", "message": "...", "data": { "id": 123 } }
```

### Delete by IDs Response
```json
{ "code": "delete_success", "message": "...", "data": [101, 102] }
```

### Update by ID Response
```json
{ "code": "update_success", "message": "...", "data": { "id": 123 } }
```
