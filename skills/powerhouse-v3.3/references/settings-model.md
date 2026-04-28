# Powerhouse Settings Model Reference

Settings are stored in `wp_options` under option_name `powerhouse_settings` as a JSON object.
PHP class: `J7\Powerhouse\Settings\Model\Settings` (extends `J7\WpUtils\Classes\DTO`).

## All Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enable_manual_send_email` | `"yes"\|"no"` | `"no"` | Allow manual email sending |
| `enable_captcha_login` | `"yes"\|"no"` | `"no"` | Enable login CAPTCHA |
| `captcha_role_list` | `string[]` | `["administrator"]` | Roles that trigger CAPTCHA |
| `enable_captcha_register` | `"yes"\|"no"` | `"no"` | Enable registration CAPTCHA |
| `enable_email_domain_check_register` | `"yes"\|"no"` | `"yes"` | Validate email domain MX on registration |
| `enable_email_domain_check_wp_mail` | `"yes"\|"no"` | `"yes"` | Validate email domain before wp_mail() |
| `email_domain_check_white_list` | `string[]` | `["gmail.com","yahoo.com","hotmail.com","outlook.com","icloud.com"]` | Domains that skip MX check |
| `delay_email` | `"yes"\|"no"` | `"yes"` | Delay WooCommerce emails |
| `last_name_optional` | `"yes"\|"no"` | `"yes"` | Make billing last name optional |
| `theme` | `string` | `"power"` | Active theme name |
| `enable_theme_changer` | `"yes"\|"no"` | `"no"` | Show theme switcher in frontend |
| `enable_theme` | `"yes"\|"no"` | `"yes"` | Enable theme system |
| `theme_css` | `object` | `{}` | Custom CSS variables (OKLCH) |
| `api_booster_rules` | `object[]` | `[]` | API booster rule configurations |
| `api_booster_rule_recipes` | `object[]` | `[]` | Predefined API booster recipes (read-only) |
| `bunny_library_id` | `string` | `""` | BunnyCDN library ID |
| `bunny_cdn_hostname` | `string` | `""` | BunnyCDN CDN hostname |
| `bunny_stream_api_key` | `string` | `""` | BunnyCDN stream API key |

## Settings Update Flow

1. REST API `POST /options` received
2. `powerhouse/option/allowed_fields` filter applied to determine accepted keys
3. `powerhouse/option/skip_sanitize_keys` filter applied to skip sanitization for specific keys
4. For `powerhouse_settings` key: `Settings::partial_update()` merges with existing values
5. For other allowed keys: `update_option()` directly

## Extending Settings (Child Plugins)

Child plugins (e.g., power-course) can add their own settings fields:

```php
// Register additional allowed fields
add_filter('powerhouse/option/allowed_fields', function (array $fields): array {
    $fields['power_course_settings'] = [];
    return $fields;
});

// Skip sanitization for specific keys (e.g., HTML content)
add_filter('powerhouse/option/skip_sanitize_keys', function (array $keys): array {
    $keys[] = 'power_course_settings';
    return $keys;
});

// Add data to GET /options response
add_filter('powerhouse/options/get_options', function (array $options, WP_REST_Request $request): array {
    $options['power_course_settings'] = get_option('power_course_settings', []);
    return $options;
}, 10, 2);
```

## API Booster Rule Structure

```json
{
  "name": "Rule Name",
  "enabled": "yes",
  "rules": "/wp-json/v2/powerhouse/posts\n/wp-json/v2/powerhouse/products/*",
  "plugins": [
    "powerhouse/plugin.php",
    "woocommerce/woocommerce.php"
  ]
}
```

- `rules`: Newline-separated URL patterns. `*` matches `[0-9a-zA-Z/]`.
- `plugins`: Only these plugins will be loaded for matching requests.
- The API booster mu-plugin intercepts at `muplugins_loaded` and overrides `option_active_plugins`.
- Requests to `/wp-json/v2/powerhouse/plugins` always bypass the booster (to show accurate plugin list).

## Theme CSS Variables

The `theme_css` field contains OKLCH color values as CSS custom properties.
These are applied to `#tw[data-theme='{theme}']` in the frontend.

Default "power" theme values (OKLCH format):

| Variable | Property | Default |
|----------|----------|---------|
| `--p` | Primary | `59.87% 0.219 259.04` |
| `--pc` | Primary content | `100% 0 0` (white) |
| `--s` | Secondary | `73.62% 0.143 233.93` |
| `--sc` | Secondary content | `100% 0 0` |
| `--a` | Accent | `76.76% 0.184 183.61` |
| `--ac` | Accent content | `15.35% 0.037 183.61` |
| `--n` | Neutral | `32.18% 0.025 255.70` |
| `--nc` | Neutral content | `89.50% 0.012 252.10` |
| `--b1` | Base 100 | `100% 0 0` |
| `--b2` | Base 200 | `96.12% 0 0` |
| `--b3` | Base 300 | `92.42% 0.001 197.14` |
| `--bc` | Base content | `27.81% 0.030 256.85` |
| `--in` | Info | `72.06% 0.191 231.6` |
| `--su` | Success | `64.8% 0.150 160` |
| `--wa` | Warning | `84.71% 0.199 83.87` |
| `--er` | Error | `71.76% 0.221 22.18` |
| `color-scheme` | Color scheme | `light` |
