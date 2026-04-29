# Migration Guide: Next.js 15 to 16

Complete, step-by-step migration reference. Follow sections in order.

## Table of Contents

1. [Pre-Migration Checklist](#1-pre-migration-checklist)
2. [Automated Migration](#2-automated-migration)
3. [Manual Migration Steps](#3-manual-migration-steps)
4. [Common Pitfalls & Gotchas](#4-common-pitfalls--gotchas)
5. [Post-Migration Verification](#5-post-migration-verification)

---

## 1. Pre-Migration Checklist

### 1.1 Runtime & Toolchain Requirements

| Requirement | Minimum | Notes |
|-------------|---------|-------|
| Node.js | 20.9.0 | Node 18 dropped; check `engines` in package.json |
| TypeScript | 5.1.0 | Update `typescript` and `@types/react`, `@types/react-dom` |
| Chrome/Edge | 111+ | |
| Firefox | 111+ | |
| Safari | 16.4+ | |

```bash
node -v   # Must be >= 20.9.0
npx tsc --version  # Must be >= 5.1.0
```

### 1.2 Dependency Audit -- Identify Blockers Before Upgrading

Scan your project for features removed in v16. Each item below requires manual action:

| Feature | How to detect | Required action |
|---------|--------------|-----------------|
| AMP support | `import { useAmp } from 'next/amp'` or `config.amp` in next.config | Remove all AMP code; use built-in optimizations instead |
| `next/legacy/image` | `import Image from 'next/legacy/image'` | Migrate to `next/image` before upgrading |
| `images.domains` | `images.domains` in next.config | Replace with `images.remotePatterns` |
| `serverRuntimeConfig` / `publicRuntimeConfig` | `getConfig()` from `next/config` | Replace with env vars + `connection()` |
| `next lint` in scripts | `"lint": "next lint"` in package.json | Will be migrated by codemod or manually to `eslint .` |
| `experimental.dynamicIO` | `experimental: { dynamicIO: true }` in next.config | Rename to `cacheComponents: true` |
| `experimental.ppr` | `experimental: { ppr: true }` in next.config | Remove; use `cacheComponents: true` instead |
| `experimental_ppr` route export | `export const experimental_ppr = true` in pages/layouts | Remove entirely (codemod available) |
| `unstable_rootParams` | `import { unstable_rootParams }` | Removed; no replacement yet |

---

## 2. Automated Migration

### 2.1 The Upgrade Command

The recommended approach -- handles dependency updates AND runs applicable codemods:

```bash
# npm
npx @next/codemod@canary upgrade latest

# pnpm
pnpm dlx @next/codemod@canary upgrade latest

# yarn
yarn dlx @next/codemod@canary upgrade latest

# bun
bunx @next/codemod@canary upgrade latest
```

The upgrade command will:
- Update `next`, `react`, `react-dom` to latest
- Prompt you to select which codemods to apply
- Optionally run React 19 codemods if upgrading React

### 2.2 Individual Codemod Catalog

Run these individually if the upgrade command missed something, or for targeted fixes:

#### `next-async-request-api`

Transforms `cookies()`, `headers()`, `draftMode()`, `params`, `searchParams` to async.

```bash
npx @next/codemod@latest next-async-request-api .
```

Before:
```tsx
import { cookies } from 'next/headers';
export default function Page() {
  const name = cookies().get('name');
}
```

After:
```tsx
import { cookies } from 'next/headers';
export default async function Page() {
  const name = (await cookies()).get('name');
}
```

#### `middleware-to-proxy`

Renames `middleware.ts` to `proxy.ts`, renames exports, updates config flags.

```bash
npx @next/codemod@latest middleware-to-proxy .
```

Renames:
- `middleware.ts` -> `proxy.ts`
- `export function middleware` -> `export function proxy`
- `skipMiddlewareUrlNormalize` -> `skipProxyUrlNormalize`
- `experimental.middlewarePrefetch` -> `experimental.proxyPrefetch`
- `experimental.middlewareClientMaxBodySize` -> `experimental.proxyClientMaxBodySize`
- `experimental.externalMiddlewareRewritesResolve` -> `experimental.externalProxyRewritesResolve`

#### `next-lint-to-eslint-cli`

Migrates from `next lint` to the ESLint CLI.

```bash
npx @next/codemod@canary next-lint-to-eslint-cli .
```

Creates `eslint.config.mjs` with flat config, updates `package.json` scripts from `next lint` to `eslint .`, adds ESLint dependencies.

#### `remove-experimental-ppr`

Removes `export const experimental_ppr = true` from pages and layouts.

```bash
npx @next/codemod@latest remove-experimental-ppr .
```

#### `remove-unstable-prefix`

Removes `unstable_` prefix from stabilized APIs (`unstable_cacheLife` -> `cacheLife`, `unstable_cacheTag` -> `cacheTag`).

```bash
npx @next/codemod@latest remove-unstable-prefix .
```

Before:
```tsx
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache';
```

After:
```tsx
import { cacheLife, cacheTag } from 'next/cache';
```

---

## 3. Manual Migration Steps

Ordered by priority and dependency. Complete each before moving to the next.

### 3.1 Async Request APIs (CRITICAL -- do first)

v16 removes ALL synchronous access. The codemod handles most cases, but verify edge cases manually.

**cookies(), headers(), draftMode():**

```tsx
// v15 (with sync compatibility)
import { cookies } from 'next/headers';
const store = cookies();
const token = store.get('token');

// v16 (async only)
import { cookies } from 'next/headers';
const store = await cookies();
const token = store.get('token');
```

**params in page/layout:**

```tsx
// v15
export default function Page({ params }: { params: { slug: string } }) {
  return <h1>{params.slug}</h1>;
}

// v16
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <h1>{slug}</h1>;
}
```

**searchParams in page:**

```tsx
// v15
export default function Page({ searchParams }: { searchParams: { q: string } }) {
  return <p>Query: {searchParams.q}</p>;
}

// v16
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <p>Query: {q}</p>;
}
```

**Client Components -- use React.use():**

```tsx
'use client';
import { use } from 'react';

export default function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  return <div>{id}</div>;
}
```

**Type helpers -- run `npx next typegen` for auto-generated types:**

```tsx
// Uses globally available PageProps helper
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params;
  return <h1>{slug}</h1>;
}
```

### 3.2 middleware.ts -> proxy.ts

If the codemod did not run, do manually:

```bash
# Rename file
mv middleware.ts proxy.ts
# or: mv src/middleware.ts src/proxy.ts
```

```tsx
// proxy.ts -- rename function
// Before:
export function middleware(request: NextRequest) { ... }

// After:
export function proxy(request: NextRequest) { ... }
```

```ts
// next.config.ts -- rename config flags
// Before:
{ skipMiddlewareUrlNormalize: true }

// After:
{ skipProxyUrlNormalize: true }
```

**Edge runtime NOT supported in proxy.ts.** Proxy runs on Node.js runtime only. If you relied on Edge runtime in middleware, keep using `middleware.ts` until a future minor release provides Edge instructions.

### 3.3 Turbopack Transition

Turbopack is now the default bundler. If your project has a custom `webpack` config, `next build` will fail.

**Decision:**

| Situation | Action |
|-----------|--------|
| No custom webpack config | Nothing to do |
| webpack config from a plugin (not yours) | Check if plugin supports Turbopack; run `next build --turbopack` to test |
| Simple resolve aliases | Migrate to `turbopack.resolveAlias` |
| Complex loaders/plugins | Use `next build --webpack` to opt out temporarily |

**Turbopack config location change:**

```ts
// v15
const nextConfig: NextConfig = {
  experimental: {
    turbopack: { /* options */ },
  },
};

// v16
const nextConfig: NextConfig = {
  turbopack: { /* options */ },
};
```

**Sass tilde imports -- Turbopack does NOT support `~` prefix:**

```scss
// v15 with webpack
@import '~bootstrap/dist/css/bootstrap.min.css';

// v16 with Turbopack
@import 'bootstrap/dist/css/bootstrap.min.css';
```

Workaround if you cannot change imports:
```ts
// next.config.ts
const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      '~*': '*',
    },
  },
};
```

**Resolve alias fallback (replacing webpack `resolve.fallback`):**

```ts
// v15 webpack
webpack: (config) => {
  config.resolve.fallback = { fs: false };
  return config;
}

// v16 turbopack
turbopack: {
  resolveAlias: {
    fs: { browser: './empty.ts' },
  },
}
```

Create an `empty.ts` file at root: `export {};`

### 3.4 revalidateTag Signature Change

Now requires a second argument (cacheLife profile). Single-arg form produces TypeScript error.

```tsx
// v15
revalidateTag('posts');

// v16
revalidateTag('posts', 'max');           // Named profile
revalidateTag('posts', 'hours');         // Other profiles
revalidateTag('posts', { expire: 3600 }); // Inline
```

For immediate expiration (read-your-writes), use `updateTag` instead:
```tsx
import { updateTag } from 'next/cache';
updateTag('posts'); // Server Actions only
```

### 3.5 Parallel Routes default.js Requirement

All parallel route slots now MUST have `default.tsx`. Build fails without them.

```tsx
// app/@modal/default.tsx
import { notFound } from 'next/navigation';
export default function Default() {
  notFound();
}

// Or simply return null:
export default function Default() {
  return null;
}
```

Audit: find all `@`-prefixed directories under `app/` and ensure each has `default.tsx`.

### 3.6 Image Config Defaults

v16 changes several defaults. Review this decision table:

| Setting | v15 default | v16 default | Action needed? |
|---------|------------|------------|---------------|
| `minimumCacheTTL` | 60s | 14400s (4h) | Only if you need frequent image revalidation |
| `imageSizes` | includes 16 | 16 removed | Only if you serve 16px images |
| `qualities` | [1..100] | [75] | Only if you use multiple quality levels |
| `dangerouslyAllowLocalIP` | allowed | blocked | Only for private/internal network setups |
| `maximumRedirects` | unlimited | 3 | Only if image sources chain >3 redirects |

To restore v15 behavior for any setting:
```ts
// next.config.ts
images: {
  minimumCacheTTL: 60,
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  qualities: [50, 75, 100],
  dangerouslyAllowLocalIP: true,
  maximumRedirects: 10,
},
```

**Quality coercion:** If `quality` prop is not in `images.qualities`, it rounds to the closest value. With default `[75]`, all quality props become 75.

### 3.7 Async Image/Sitemap Params

Image generation functions (`opengraph-image`, `twitter-image`, `icon`, `apple-icon`) now receive `params` and `id` as Promises:

```tsx
// v15 -- opengraph-image.tsx
export default function Image({ params, id }: { params: { slug: string }; id: string }) {
  // synchronous access
}

// v16 -- opengraph-image.tsx
export default async function Image({
  params,
  id,
}: {
  params: Promise<{ slug: string }>;
  id: Promise<string>;
}) {
  const { slug } = await params;
  const imageId = await id;
}
```

**Note:** `generateImageMetadata` still receives synchronous `params`.

Sitemap `id` is also now a Promise:
```tsx
// v15
export default async function sitemap({ id }: { id: number }) {
  const start = id * 50000;
}

// v16
export default async function sitemap({ id }: { id: Promise<string> }) {
  const resolvedId = await id;
  const start = Number(resolvedId) * 50000;
}
```

### 3.8 ESLint Migration

`next lint` is removed. `next build` no longer runs linting.

**If the codemod ran:** Verify `eslint.config.mjs` was created and `package.json` scripts updated.

**Manual migration:**

1. Update `package.json`:
   ```json
   {
     "scripts": {
       "lint": "eslint ."
     }
   }
   ```

2. Create `eslint.config.mjs` (flat config):
   ```js
   import { dirname } from 'path';
   import { fileURLToPath } from 'url';
   import { FlatCompat } from '@eslint/eslintrc';

   const __filename = fileURLToPath(import.meta.url);
   const __dirname = dirname(__filename);
   const compat = new FlatCompat({ baseDirectory: __dirname });

   const eslintConfig = [
     ...compat.extends('next/core-web-vitals', 'next/typescript'),
     {
       ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
     },
   ];
   export default eslintConfig;
   ```

3. Install dependencies:
   ```bash
   npm install -D eslint @eslint/eslintrc
   ```

4. Remove `eslint` config option from `next.config.ts` (no longer supported).

### 3.9 Removed Features -- Replacement Patterns

**serverRuntimeConfig / publicRuntimeConfig -> env vars:**

```tsx
// v15
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const apiUrl = publicRuntimeConfig.apiUrl;

// v16 -- server-only values: direct env access
const dbUrl = process.env.DATABASE_URL;

// v16 -- client values: NEXT_PUBLIC_ prefix
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// v16 -- runtime env (not bundled at build time):
import { connection } from 'next/server';
export default async function Page() {
  await connection();
  const config = process.env.RUNTIME_CONFIG;
  return <p>{config}</p>;
}
```

**experimental.dynamicIO -> cacheComponents:**

```ts
// v15
experimental: { dynamicIO: true }

// v16
cacheComponents: true,
```

**experimental.ppr -> cacheComponents:**

```ts
// v15
experimental: { ppr: true }

// v16 -- PPR is automatic with cacheComponents
cacheComponents: true,
```

**reactCompiler (promoted from experimental):**

```ts
// v15
experimental: { reactCompiler: true }

// v16
reactCompiler: true,
```

---

## 4. Common Pitfalls & Gotchas

### 4.1 Turbopack + Sass Tilde Imports

Turbopack does not support `~` prefix in Sass imports. Builds will fail with `Module not found`. Either remove the `~` prefix or add `resolveAlias: { '~*': '*' }` to turbopack config.

### 4.2 process.argv No Longer Includes 'dev'

`next dev` no longer loads the config file in the CLI process. Checking `process.argv.includes('dev')` returns `false`. Use `process.env.NODE_ENV === 'development'` instead, or use the `phase` parameter from `next.config.ts`.

### 4.3 Scroll Behavior Override Removed

v16 no longer overrides `scroll-behavior: smooth` on `<html>` during SPA transitions. If you relied on the old behavior (smooth scroll for in-page but instant for navigation), add:
```tsx
<html lang="en" data-scroll-behavior="smooth">
```

### 4.4 Edge Runtime Incompatibility

- `proxy.ts` does NOT support Edge runtime. It runs on Node.js only.
- `cacheComponents` requires Node.js runtime. Remove `export const runtime = 'edge'` from routes using Cache Components.
- If you need Edge, keep using `middleware.ts` (deprecated but still functional) until further guidance.

### 4.5 Quality Coercion in next/image

With default `qualities: [75]`, any `quality` prop (e.g., `quality={90}`) is silently coerced to 75. If you need multiple quality levels, explicitly configure `images.qualities`.

### 4.6 Custom Webpack Config Breaks Build

If any plugin adds a `webpack` config (even if you did not add one yourself), `next build` fails. Check all Next.js plugins. Use `next build --turbopack` to bypass, or `next build --webpack` to opt out.

### 4.7 Build Metrics Removed

`size` and `First Load JS` metrics no longer appear in `next build` output. Use Chrome Lighthouse or Vercel Analytics for performance measurement.

### 4.8 Concurrent Dev and Build

`next dev` now outputs to `.next/dev/` (not `.next/`). Adjust any scripts that reference `.next/` directly during development. A lockfile prevents multiple instances.

### 4.9 Local Images with Query Strings

Local image sources with query strings now require `images.localPatterns.search` configuration:
```ts
images: {
  localPatterns: [
    { pathname: '/assets/**', search: '?v=1' },
  ],
},
```

---

## 5. Post-Migration Verification

### 5.1 Build Verification

```bash
# Build with Turbopack (default)
next build

# If using webpack fallback
next build --webpack
```

Verify: zero build errors, all parallel routes have `default.tsx`.

### 5.2 Route Rendering Check

- Visit each major route in the app
- Verify Server Components render data correctly
- Verify Client Components maintain interactivity
- Check dynamic routes with `params` and `searchParams`

### 5.3 Cache Behavior

- If using `cacheComponents: true`, verify `"use cache"` pages serve cached content
- Test `revalidateTag('tag', 'max')` with second argument
- Test `updateTag` for read-your-writes behavior in forms
- Verify ISR pages revalidate on schedule

### 5.4 Image Optimization

- Check images load correctly with new defaults
- Verify `minimumCacheTTL` behavior (4h default)
- If quality-sensitive, check `qualities` coercion is acceptable
- Test remote images with `remotePatterns` (not deprecated `domains`)

### 5.5 Proxy (formerly Middleware)

- Verify `proxy.ts` intercepts requests correctly
- Test auth redirects, rewrite rules, cookie handling
- Confirm Node.js APIs work (no longer Edge-limited)

### 5.6 ESLint

```bash
# Run new ESLint setup
npm run lint
```

Verify flat config resolves correctly and all rules apply.

### 5.7 No Console Warnings

Check browser console and server logs for:
- Deprecation warnings about synchronous request APIs
- Warnings about `middleware.ts` (should be renamed)
- Any `UnsafeUnwrapped` type annotations left by codemod (must be manually resolved)
