# next-intl v4 Server Patterns Reference

Server Actions, generateMetadata, Route Handlers, error files, sitemaps, OG images, and testing.

---

## generateMetadata

Pass explicit `locale` to enable static rendering eligibility:

```typescript
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return { title: t('title') };
}
```

---

## Server Actions

```typescript
'use server';
import { getTranslations } from 'next-intl/server';

export async function submitForm(data: FormData) {
  const t = await getTranslations('ContactForm');
  const valid = /* validate */;
  if (!valid) return { error: t('invalidInput') };
}
```

### Zod integration

```typescript
'use server';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAction(data: FormData) {
  const t = await getTranslations('LoginForm');
  const values = Object.fromEntries(data);

  const result = schema.safeParse(values, {
    error(issue) {
      if (issue.path) {
        const path = issue.path.join('.');
        return {
          email: t('invalidEmail'),
          password: t('invalidPassword'),
        }[path];
      }
    }
  });
}
```

Note: if the user can switch locale while a Server Action error is displayed, the message may be in the wrong language. Handle this at the UI layer.

---

## Route Handlers

Locale must come from search params, headers, or path since Route Handlers are outside `[locale]`:

```typescript
import { NextResponse } from 'next/server';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale');
  if (!hasLocale(routing.locales, locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }
  const t = await getTranslations({ locale, namespace: 'API' });
  return NextResponse.json({ message: t('hello') });
}
```

---

## OG Images

```typescript
import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';

export default async function OpenGraphImage({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'OpenGraphImage' });
  return new ImageResponse(<div style={{ fontSize: 128 }}>{t('title')}</div>);
}
```

---

## Manifest

Outside `[locale]` segment -- provide locale explicitly:

```typescript
import { MetadataRoute } from 'next';
import { getTranslations } from 'next-intl/server';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations({ namespace: 'Manifest', locale: 'en' });
  return { name: t('name'), start_url: '/', theme_color: '#101E33' };
}
```

---

## Sitemap

```typescript
import { MetadataRoute } from 'next';
import { getPathname } from '@/i18n/navigation';

const host = 'https://example.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: host,
      lastModified: new Date(),
      alternates: {
        languages: {
          en: host + (await getPathname({ locale: 'en', href: '/' })),
          de: host + (await getPathname({ locale: 'de', href: '/' })),
        }
      }
    }
  ];
}
```

---

## Error Files

### not-found.tsx (localized)

```typescript
// app/[locale]/not-found.tsx
import { useTranslations } from 'next-intl';

export default function NotFoundPage() {
  const t = useTranslations('NotFoundPage');
  return <h1>{t('title')}</h1>;
}
```

### Catch-all for unknown routes

```typescript
// app/[locale]/[...rest]/page.tsx
import { notFound } from 'next/navigation';
export default function CatchAll() { notFound(); }
```

This catches requests like `/en/unknown` and triggers the localized not-found page.

### Root not-found (non-localized paths)

```typescript
// app/not-found.tsx
'use client';
import Error from 'next/error';
export default function NotFound() {
  return <html lang="en"><body><Error statusCode={404} /></body></html>;
}
```

### Root layout

```typescript
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

### Locale validation in layout

```typescript
// app/[locale]/layout.tsx
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // ...
}
```

### error.tsx

Must be a Client Component. Requires `NextIntlClientProvider` in a parent layout:

```typescript
// app/[locale]/error.tsx
'use client';
import { useTranslations } from 'next-intl';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('Error');
  return (
    <div>
      <h1>{t('title')}</h1>
      <button onClick={reset}>{t('retry')}</button>
    </div>
  );
}
```

Performance optimization -- lazy-load:
```typescript
'use client';
import { lazy } from 'react';
export default lazy(() => import('./Error'));
```

---

## Testing

### Vitest configuration

```typescript
// vitest.config.mts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    server: {
      deps: { inline: ['next-intl'] }
    }
  }
});
```

### Basic test pattern

```typescript
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../messages/en.json';

it('renders translated content', () => {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MyComponent />
    </NextIntlClientProvider>
  );
});
```

### Jest configuration

```javascript
// jest.config.js
const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

module.exports = async () => ({
  ...(await createJestConfig({ testEnvironment: 'jsdom', rootDir: 'src' })()),
  transformIgnorePatterns: ['node_modules/(?!next-intl)/']
});
```

### Best practice

Define components as non-async functions rather than async Server Components to avoid mocking complexity. Non-async components using `useTranslations` work in both server and client environments, making them directly testable with `NextIntlClientProvider`.

---

## Error Handling Configuration

### Server-side (i18n/request.ts)

```typescript
import { IntlErrorCode } from 'next-intl';

export default getRequestConfig(async () => ({
  // ...
  onError(error) {
    if (error.code === IntlErrorCode.MISSING_MESSAGE) {
      console.error(error);
    } else {
      reportToErrorTracking(error);
    }
  },
  getMessageFallback({ namespace, key, error }) {
    const path = [namespace, key].filter(Boolean).join('.');
    if (error.code === IntlErrorCode.MISSING_MESSAGE) {
      return `${path} is not yet translated`;
    }
    return `Fix this message: ${path}`;
  }
}));
```

### Client-side (non-serializable props)

`onError` and `getMessageFallback` are not serializable. Create a `'use client'` wrapper:

```typescript
// components/IntlErrorHandlingProvider.tsx
'use client';
import { NextIntlClientProvider } from 'next-intl';

export default function IntlErrorHandlingProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider
      onError={(error) => console.error(error)}
      getMessageFallback={({ namespace, key }) => `${namespace}.${key}`}
    >
      {children}
    </NextIntlClientProvider>
  );
}
```

Use inside the server layout:
```typescript
<NextIntlClientProvider>
  <IntlErrorHandlingProvider>{children}</IntlErrorHandlingProvider>
</NextIntlClientProvider>
```
