# next-intl v4 Routing Configuration Reference

All options for `defineRouting()` from `next-intl/routing`.

## defineRouting Signature

```typescript
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: string[],
  defaultLocale: string,
  localePrefix?: 'always' | 'as-needed' | 'never' | { mode: string; prefixes: Record<string, string> },
  pathnames?: Record<string, string | Record<string, string>>,
  domains?: Domain[],
  localeDetection?: boolean,
  localeCookie?: CookieConfig | false,
  alternateLinks?: boolean,
});
```

---

## localePrefix

### `'always'` (default)

Every URL includes locale prefix. `/en/about`, `/de/about`.

### `'as-needed'`

Default locale omits prefix; others include it.

- `/about` serves default locale
- `/en/about` serves English
- Superfluous default prefix (`/zh-TW/about`) auto-redirects to `/about`
- Sets `NEXT_LOCALE` cookie for preference tracking

### `'never'`

No prefix in URLs. Locale determined by cookie or domain only.

- Disables alternate links (URLs not unique per locale)
- Requires `[locale]` folder structure still
- Best combined with `domains` config

### Custom prefixes

```typescript
localePrefix: {
  mode: 'always',
  prefixes: {
    'en-US': '/us',
    'de-AT': '/eu/at'
  }
}
```

User-facing URLs use custom prefix; internally rewritten to locale code.

---

## pathnames

Maps internal routes to localized external paths.

```typescript
pathnames: {
  // Same path for all locales
  '/': '/',
  '/blog': '/blog',

  // Per-locale paths
  '/about': {
    en: '/about',
    de: '/ueber-uns'
  },

  // Dynamic segments preserved
  '/news/[articleSlug]': {
    en: '/news/[articleSlug]',
    de: '/neuigkeiten/[articleSlug]'
  },

  // Static overrides dynamic
  '/news/just-in': {
    de: '/neuigkeiten/aktuell'
  },

  // Catch-all segments
  '/categories/[...slug]': {
    de: '/kategorien/[...slug]'
  }
}
```

- Non-ASCII characters are automatically encoded
- When using `pathnames`, `createNavigation` returns strictly-typed Link/router that require internal pathname templates

---

## domains

Multi-domain locale routing.

```typescript
domains: [
  {
    domain: 'us.example.com',
    defaultLocale: 'en-US',
    locales: ['en-US']
  },
  {
    domain: 'ca.example.com',
    defaultLocale: 'en-CA',
    locales: ['en-CA', 'fr-CA']
  }
]
```

Rules:
- Each locale must appear in exactly one domain
- Falls back to prefix-based detection on non-matching domains
- Compatible with `localePrefix` and custom prefixes
- Host detected from `x-forwarded-host` header, fallback to `host`

---

## localeDetection

Default: `true`

When `true`:
1. Check `accept-language` header via `@formatjs/intl-localematcher` best-fit algorithm
2. Check `NEXT_LOCALE` cookie
3. Fallback to `defaultLocale`

When `false`:
- Only URL prefix and domain determine locale
- Required for `output: 'export'` (static export)

---

## localeCookie

Configure the `NEXT_LOCALE` cookie.

```typescript
localeCookie: {
  name: 'USER_LOCALE',     // default: 'NEXT_LOCALE'
  maxAge: 60 * 60 * 24 * 365,  // default: no max-age (session cookie)
}
```

Default attributes:
- `sameSite: 'lax'`
- `path` inherits from Next.js `basePath`
- No `max-age` by default (GDPR-friendly session cookie)

Disable entirely:
```typescript
localeCookie: false
```

---

## alternateLinks

Default: `true`

When enabled, middleware adds `Link` response headers with `hreflang` values:

```
Link: <https://example.com/en/about>; rel="alternate"; hreflang="en",
      <https://example.com/de/ueber-uns>; rel="alternate"; hreflang="de",
      <https://example.com/about>; rel="alternate"; hreflang="x-default"
```

- Reads domain from `x-forwarded-host` or `host` header
- Incorporates `domains`, `pathnames`, and `basePath` settings
- Includes `x-default` entry pointing to default locale

Disable:
```typescript
alternateLinks: false
```

---

## Next.js Config Integration

### basePath

Middleware and navigation automatically respect `basePath` from `next.config.mjs`.
`getPathname` returns unadorned path; manually prefix if needed outside navigation APIs.

### trailingSlash

Middleware and navigation handle `trailingSlash: true` automatically.
Internal and external pathnames normalize regardless of trailing slash presence.
