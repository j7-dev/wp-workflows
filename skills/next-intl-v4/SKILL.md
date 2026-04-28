---
name: next-intl-v4
description: >
  next-intl v4 complete technical reference for Next.js App Router i18n.
  Covers defineRouting, createMiddleware, createNavigation, NextIntlClientProvider,
  useTranslations, getTranslations, useFormatter, getFormatter, ICU MessageFormat
  (plurals, select, rich text), message configuration, static rendering with
  setRequestLocale, TypeScript augmentation, and error file i18n.
  Use this skill whenever the task involves next-intl imports, i18n routing in
  Next.js, locale-prefixed URLs, translation message files, useTranslations,
  getTranslations, useFormatter, ICU message syntax, NextIntlClientProvider,
  createMiddleware, defineRouting, createNavigation, or any internationalization
  work in a Next.js App Router project. Also consult when debugging locale
  detection, middleware composition, missing translation errors, or static
  rendering issues related to i18n.
---

# next-intl v4 -- Next.js App Router i18n

Version: `next-intl ^4.9.1` | Next.js 15 App Router | React 19
Docs: https://next-intl.dev (v4)

## Reference Files

Read these for extended API details:
- [references/routing-config.md](references/routing-config.md) -- defineRouting options (localePrefix, pathnames, domains, localeCookie, alternateLinks)
- [references/navigation-api.md](references/navigation-api.md) -- Link, useRouter, redirect, getPathname, usePathname, hasLocale
- [references/message-format.md](references/message-format.md) -- ICU syntax, t.rich, t.markup, t.raw, t.has, RichText pattern, iteration
- [references/server-patterns.md](references/server-patterns.md) -- Server Actions, generateMetadata, Route Handlers, sitemap, OG images, error files, testing

---

## Architecture

```
defineRouting (i18n/routing.ts)  <-- single source of truth
    |
    +-> createMiddleware (middleware.ts)   -- locale negotiation, redirects, rewrites
    +-> createNavigation                   -- Link, redirect, usePathname, useRouter, getPathname
    +-> getRequestConfig (i18n/request.ts) -- per-request: locale, messages, timeZone, formats
            |
            +-> Server: getTranslations, getFormatter, getMessages, getLocale, getNow, getTimeZone
            +-> Client (via NextIntlClientProvider): useTranslations, useFormatter, useLocale, useNow, useTimeZone
```

## File Structure

```
messages/{locale}.json        # Translation messages per locale
i18n/routing.ts               # defineRouting + createNavigation
i18n/request.ts               # getRequestConfig
middleware.ts                  # createMiddleware (proxy.ts in Next.js 16+)
next.config.mjs               # createNextIntlPlugin
app/layout.tsx                 # minimal root layout (return children)
app/not-found.tsx              # root 404 fallback
app/[locale]/layout.tsx        # NextIntlClientProvider + setRequestLocale
app/[locale]/not-found.tsx     # localized 404
app/[locale]/[...rest]/page.tsx  # catch-all -> notFound()
```

---

## 1. Routing Configuration

```typescript
// i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['zh-TW', 'en', 'ja', 'ko'],
  defaultLocale: 'zh-TW',
  localePrefix: 'as-needed',
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

### localePrefix modes

| Mode | Default locale URL | Other locale URL |
|------|-------------------|-----------------|
| `'always'` (default) | `/zh-TW/blog` | `/en/blog` |
| `'as-needed'` | `/blog` | `/en/blog` |
| `'never'` | `/blog` | `/blog` (cookie/domain only) |

Other options: `pathnames`, `domains`, `localeDetection`, `localeCookie`, `alternateLinks`.
See [references/routing-config.md](references/routing-config.md).

## 2. Middleware

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/users/(.+)'],
};
```

Locale detection order: URL prefix > NEXT_LOCALE cookie > accept-language header > defaultLocale.

### Custom composition (skip admin/API routes)

```typescript
const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  return intlMiddleware(req);
}
```

## 3. Request Configuration

```typescript
// i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = (routing.locales as readonly string[]).includes(requested ?? '')
    ? (requested as string)
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    // timeZone: 'Asia/Taipei',
    // now: new Date(),
    // formats: { dateTime: { short: { day: 'numeric', month: 'short', year: 'numeric' } } },
    // onError(error) { ... },
    // getMessageFallback({ namespace, key, error }) { ... },
  };
});
```

| Property | Type | Purpose |
|----------|------|---------|
| `locale` | `string` | Active locale |
| `messages` | `object` | Translation messages |
| `timeZone` | `string` | IANA timezone |
| `now` | `Date` | Reference time for relativeTime |
| `formats` | `{ dateTime, number, list }` | Named format presets |
| `onError` | `(error) => void` | Error handler |
| `getMessageFallback` | `fn` | Fallback for errors |

Error codes: `IntlErrorCode.MISSING_MESSAGE` from `'next-intl'`.

## 4. NextIntlClientProvider

```typescript
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

Auto-inherited from server config: `locale`, `messages`, `now`, `timeZone`, `formats`.
Not inherited (set on provider or `'use client'` wrapper): `onError`, `getMessageFallback`.

Selective messages: `messages={pick(messages, ['Navigation', 'Common'])}`.

## 5. next-intl/plugin

```typescript
// next.config.mjs
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
export default withNextIntl(nextConfig);
```

Auto-detects `i18n/request.ts` in `src/` or project root if no path given.
Experimental: `createMessagesDeclaration`, `messages.precompile`, `extract`.

## 6. Translations API

### Client Components

```typescript
import { useTranslations } from 'next-intl';
const t = useTranslations('contact.form');  // dot-separated namespace
t('name');  // "Name"
```

### Server Components (async)

```typescript
import { getTranslations } from 'next-intl/server';
const t = await getTranslations('blog');
t('title');
```

### All accessor pairs

| Client hook | Server function | Returns |
|-------------|-----------------|---------|
| `useTranslations(ns?)` | `getTranslations(ns?)` | `t` function |
| `useFormatter()` | `getFormatter()` | Format object |
| `useLocale()` | `getLocale()` | Locale string |
| `useNow(opts?)` | `getNow()` | Date |
| `useTimeZone()` | `getTimeZone()` | Timezone string |
| `useMessages()` | `getMessages()` | Messages object |

### Translation methods

| Method | Returns | Purpose |
|--------|---------|---------|
| `t('key', values?)` | `string` | Plain text with interpolation |
| `t.rich('key', tags)` | `ReactNode` | React elements in translations |
| `t.markup('key', tags)` | `string` | HTML string markup |
| `t.raw('key')` | `any` | Raw JSON value |
| `t.has('key')` | `boolean` | Key existence check |

## 7. ICU MessageFormat (Quick Reference)

```json
{ "greeting": "Hello {name}!" }
{ "items": "{count, plural, =0 {none} =1 {one item} other {# items}}" }
{ "rank": "{n, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}" }
{ "status": "{gender, select, female {She} male {He} other {They}} is online." }
{ "tos": "Accept <link>terms</link>." }
```

Rules: `other` is required in plural/select. `#` = formatted number in plural blocks. Values are alphanumeric + underscores only (no dashes). Single quotes escape: `'{literal}'`.

Rich text: `t.rich('tos', { link: (chunks) => <a href="/terms">{chunks}</a> })`.

See [references/message-format.md](references/message-format.md) for full syntax, RichText pattern, iteration.

## 8. Formatter API

```typescript
const format = useFormatter();          // client
const format = await getFormatter();    // server

format.dateTime(date, { year: 'numeric', month: 'short', day: 'numeric' });
format.dateTime(date, 'short');                    // named format from config
format.relativeTime(pastDate, now);                // "2 hours ago"
format.dateTimeRange(start, end, opts);            // "Nov 20 - Jan 24"
format.number(499.9, { style: 'currency', currency: 'USD' }); // "$499.90"
format.number(0.42, { style: 'percent' });         // "42%"
format.list(['A', 'B', 'C'], { type: 'conjunction' }); // "A, B, and C"
```

`useNow({ updateInterval: 10_000 })` -- auto-refreshing current time for relative formatting.

## 9. Server vs Client Components

**Async Server Components** use awaitable functions: `getTranslations`, `getFormatter`, etc.

**Non-async shared components** use hooks (`useTranslations`) and work in either environment.

**Client Components** (`'use client'`) require `NextIntlClientProvider` ancestor.

Strategies for client i18n:
1. Pass translated strings as props from server (simplest)
2. Wrap with `NextIntlClientProvider` (all messages or selective)
3. Use `pick(messages, ['Namespace'])` for smaller client bundles

## 10. Static Rendering / ISR

Both are required in every `[locale]` layout and page:

```typescript
// 1. generateStaticParams
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// 2. setRequestLocale -- call BEFORE any i18n hook/function
import { setRequestLocale } from 'next-intl/server';
setRequestLocale(locale);
```

Without these, pages fall back to dynamic rendering.

## 11. TypeScript Augmentation

```typescript
// global.d.ts
import { routing } from '@/i18n/routing';
import messages from '../messages/en.json';

declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
```

Provides: autocomplete for `t('key')`, compile errors for unknown keys/namespaces, strict locale typing.

Experimental type-safe arguments: set `experimental.createMessagesDeclaration` in plugin config + `allowArbitraryExtensions` in tsconfig.

Locale type helper: `import { Locale } from 'next-intl';`.

## 12. Navigation Quick Reference

```tsx
<Link href="/about">About</Link>
<Link href="/" locale="en">English</Link>
<Link href={{ pathname: '/users', query: { sort: 'name' } }}>Users</Link>

router.push('/about');
router.replace('/about', { locale: 'en' });

const pathname = usePathname();    // '/about' (no locale prefix)

redirect({ href: '/login', locale: 'en' });

const path = getPathname({ locale: 'en', href: '/about' }); // '/en/about'
```

See [references/navigation-api.md](references/navigation-api.md) for full API.

## 13. Common Pitfalls

| Problem | Fix |
|---------|-----|
| "Unable to find next-intl locale" | Call `setRequestLocale(locale)` before i18n hooks; check middleware matcher |
| Page renders default locale only | Verify `config.matcher` includes the path |
| Static build fails | Add `generateStaticParams` + `setRequestLocale` to every `[locale]` layout/page |
| Client Component missing translations | Ensure `NextIntlClientProvider` in ancestor tree |
| `onError` not working on client | Wrap in `'use client'` component (not serializable) |
| TypeScript not catching bad keys | Add `AppConfig` augmentation with `Messages` type |
| Admin routes getting locale prefix | Skip `/admin`, `/api` in middleware before `createMiddleware` |
| `requestLocale` is undefined | Page outside `[locale]` segment; fallback to `defaultLocale` |
| Dash in ICU select value | Replace: `locale.replaceAll('-', '_')` |
