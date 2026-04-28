# next-intl v4 Navigation API Reference

All APIs returned by `createNavigation(routing)` from `next-intl/navigation`.

## createNavigation

```typescript
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

When called without `routing`, accepts any string as a valid locale (dynamic locales).

---

## Link

Wraps `next/link` with automatic locale-aware pathname resolution.

### Props

All `next/link` props plus:

| Prop | Type | Description |
|------|------|-------------|
| `href` | `string \| { pathname: string; query?: Record<string, string>; params?: Record<string, string> }` | Target path |
| `locale` | `string` | Override locale (always includes prefix, disables prefetch) |

### Examples

```tsx
// Basic
<Link href="/about">About</Link>

// With query params
<Link href={{ pathname: '/users', query: { sortBy: 'name' } }}>Users</Link>

// Locale switching (always prefixed, prefetch disabled)
<Link href="/" locale="de">Switch to German</Link>

// Dynamic segment (without pathnames config)
<Link href="/users/12">User 12</Link>

// Dynamic segment (with pathnames config -- requires params object)
<Link href={{ pathname: '/users/[userId]', params: { userId: '5' } }}>
  User 5
</Link>

// TypeScript component prop type
import { ComponentProps } from 'react';
type LinkProps = ComponentProps<typeof Link>;
```

### Behavior notes

- When `locale` prop is provided, the link always includes a locale prefix even with `localePrefix: 'as-needed'`, to ensure the `NEXT_LOCALE` cookie updates before navigation
- Prefetching is disabled when `locale` prop is set (cross-locale navigation)

---

## useRouter

Programmatic navigation wrapper around Next.js `useRouter`.

```typescript
'use client';
import { useRouter } from '@/i18n/routing';
```

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `push` | `(href: Href, options?: { locale?: string }) => void` | Navigate to path |
| `replace` | `(href: Href, options?: { locale?: string }) => void` | Replace current history entry |
| `prefetch` | `(href: Href) => void` | Prefetch route |
| `back` | `() => void` | Go back in history |
| `forward` | `() => void` | Go forward in history |
| `refresh` | `() => void` | Refresh current route |

### Href types

```typescript
// String path
router.push('/about');

// With query params
router.push({ pathname: '/users', query: { sortBy: 'name' } });

// Dynamic segment (no pathnames)
router.push('/users/12');

// Dynamic segment (with pathnames)
router.push({ pathname: '/users/[userId]', params: { userId: '5' } });

// With locale override
router.replace('/about', { locale: 'de' });
```

### Locale switching for current page

```typescript
'use client';
import { useRouter, usePathname } from '@/i18n/routing';
import { useParams } from 'next/navigation';

function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  function switchLocale(newLocale: string) {
    router.replace({ pathname, params }, { locale: newLocale });
  }

  return (
    <button onClick={() => switchLocale('en')}>English</button>
  );
}
```

---

## usePathname

Returns the current pathname without locale prefix.

```typescript
'use client';
import { usePathname } from '@/i18n/routing';

const pathname = usePathname();
// On '/en/about' -> returns '/about'
// On '/zh-TW' or '/' (default locale, as-needed) -> returns '/'
```

With `pathnames` config: returns the internal pathname template (e.g., `/news/[articleSlug]`), not the resolved value.

---

## redirect

Interrupts rendering and redirects. Works in Server Components, Server Actions, and Route Handlers.

```typescript
import { redirect } from '@/i18n/routing';

// Basic -- locale is required
redirect({ href: '/login', locale: 'en' });

// With query params
redirect({ href: '/users', query: { sortBy: 'name' }, locale: 'en' });

// Dynamic segment (no pathnames)
redirect({ href: '/users/12', locale: 'en' });

// Dynamic segment (with pathnames)
redirect({
  href: { pathname: '/users/[userId]', params: { userId: '5' } },
  locale: 'en'
});

// Force locale prefix even with localePrefix: 'as-needed'
redirect({ href: '/about', locale: 'en', forcePrefix: true });
```

### permanentRedirect

Same API as `redirect` but issues a 308 status code.

### TypeScript narrowing

```typescript
if (!userId) {
  return redirect({ href: '/login', locale: 'en' });
  // Adding `return` helps TypeScript narrow types below
}
// userId is narrowed to non-null here
```

---

## getPathname

Constructs a locale-aware pathname string without triggering navigation. Works in both server and client contexts.

```typescript
import { getPathname } from '@/i18n/routing';

// Basic
const path = getPathname({ locale: 'en', href: '/about' });
// '/en/about'

// With query params
const path = getPathname({
  locale: 'en',
  href: { pathname: '/users', query: { sortBy: 'name' } }
});

// Dynamic segment
const path = getPathname({
  locale: 'en',
  href: { pathname: '/users/[userId]', params: { userId: '5' } }
});
```

Use case: building sitemap alternates, canonical URLs, OG image URLs.

---

## hasLocale utility

```typescript
import { hasLocale } from 'next-intl';

hasLocale(routing.locales, 'en');      // true
hasLocale(routing.locales, 'invalid'); // false
```

Type-narrowing utility for validating locale strings against the routing config.
