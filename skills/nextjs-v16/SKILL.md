---
name: nextjs-v16
description: >
  Next.js 16 (App Router) complete technical reference with React 19.2 and Turbopack.
  Covers App Router file conventions (layout, page, loading, error, not-found, route groups,
  parallel routes, intercepting routes), Server vs Client Components ("use client" boundary),
  Cache Components ("use cache" directive, cacheLife, cacheTag, updateTag, refresh),
  cacheComponents config, Partial Prerendering (PPR), proxy.ts (replacement for middleware.ts),
  data fetching (async Server Components, streaming, Suspense), Server Actions ("use server"),
  Route Handlers (route.ts), next.config.ts (turbopack, cacheComponents, reactCompiler,
  rewrites, redirects, images, output: standalone), Image optimization (next/image),
  Metadata API (generateMetadata, opengraph-image), caching and revalidation (revalidatePath,
  revalidateTag with cacheLife profile, updateTag, refresh), ISR, static vs dynamic rendering,
  React 19.2 features (View Transitions, useEffectEvent, Activity), React Compiler support,
  Turbopack (stable default bundler), and v16 breaking changes (fully async request APIs,
  middleware renamed to proxy, image defaults, ESLint changes, parallel routes default.js
  requirement). Use this skill whenever writing, reviewing, or debugging code that imports
  from "next", "next/image", "next/link", "next/navigation", "next/headers", "next/cache",
  "next/server", or "next/og", or when working with App Router file conventions, proxy.ts,
  next.config, Cache Components, or ISR/revalidation logic. Also use when the user mentions
  Next.js 16, upgrading to v16, or any v16-specific features like Cache Components or proxy.ts.
---

# Next.js 16 -- App Router Technical Reference

Target version: `next ^16.2.x` with React 19.2.
Official docs: https://nextjs.org/docs (App Router mode).
Released: October 21, 2025. Current patch: 16.2.4 (April 2026).

> **v16 Headline**: Cache Components (`"use cache"` + `cacheComponents: true`) replace the
> implicit caching model. All data fetching is dynamic by default unless explicitly cached.
> Turbopack is now the default bundler. `middleware.ts` is deprecated in favor of `proxy.ts`.

## Table of Contents & Reference Map

| Topic | Where |
|-------|-------|
| File conventions, route groups, dynamic segments | This file, Section 1 |
| Server vs Client Components, "use client" rules | This file, Section 2 |
| Data fetching, streaming, Suspense | This file, Section 3 |
| Server Actions ("use server") | This file, Section 4 |
| Cache Components ("use cache", cacheLife, cacheTag) | This file, Section 5 |
| Caching APIs (updateTag, revalidateTag, refresh) | This file, Section 6 |
| Static vs dynamic rendering, PPR | This file, Section 7 |
| v16 breaking changes, migration from v15 | This file, Section 8 |
| proxy.ts (replaces middleware.ts), next.config.ts | [references/proxy-and-config.md](references/proxy-and-config.md) |
| Route Handlers, API function signatures | [references/api-functions.md](references/api-functions.md) |
| Image, Metadata API, OG images | [references/image-and-metadata.md](references/image-and-metadata.md) |
| Parallel routes, intercepting routes, error handling | [references/advanced-routing.md](references/advanced-routing.md) |
| React 19.2, React Compiler, Turbopack | [references/react-and-tooling.md](references/react-and-tooling.md) |
| Full v15->v16 migration guide, codemods, pitfalls | [references/migration-from-v15.md](references/migration-from-v15.md) |
| Cache Components migration (route config -> "use cache") | [references/cache-components-migration.md](references/cache-components-migration.md) |

---

## 1. App Router File Conventions

### 1.1 Core Special Files

| File | Purpose | Client Component? |
|------|---------|-------------------|
| `layout.tsx` | Shared UI wrapping children; state preserved across navigations | No |
| `page.tsx` | Unique UI for a route; makes route publicly accessible | No |
| `loading.tsx` | Instant loading UI (auto-wrapped in `<Suspense>`) | No |
| `error.tsx` | Error boundary for route segment | **Yes** |
| `not-found.tsx` | 404 UI triggered by `notFound()` | No |
| `template.tsx` | Like layout but re-mounts on navigation | No |
| `default.tsx` | Fallback for parallel route slots (**required in v16**) | No |
| `route.ts` | API endpoint; cannot coexist with `page.tsx` at same level | N/A |
| `global-error.tsx` | Root error boundary; must include `<html>` and `<body>` | **Yes** |
| `proxy.ts` | Request interceptor (replaces `middleware.ts`) | N/A |

### 1.2 Root Layout (Required)

```tsx
// app/layout.tsx -- MUST contain <html> and <body>
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-TW"><body>{children}</body></html>;
}
```

### 1.3 Route Groups & Dynamic Segments

Route groups `(folder)` organize without affecting URL. Each can have its own layout.

| Pattern | Example | Matches |
|---------|---------|---------|
| `[slug]` | `app/blog/[slug]/page.tsx` | `/blog/hello` |
| `[...slug]` | `app/shop/[...slug]/page.tsx` | `/shop/a`, `/shop/a/b/c` |
| `[[...slug]]` | `app/docs/[[...slug]]/page.tsx` | `/docs`, `/docs/a/b` |

### 1.4 Page & Layout Props (ASYNC -- fully enforced in v16)

**v16 removes synchronous access entirely.** `params` and `searchParams` are `Promise` types.

```tsx
// page.tsx
export default async function Page({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const { query } = await searchParams;
}
```

Type helpers via `npx next typegen`: `PageProps<'/blog/[slug]'>`, `LayoutProps`, `RouteContext`.
Client Components use `React.use()` to unwrap: `const { id } = use(props.params);`

---

## 2. Server Components vs Client Components

### 2.1 Rules

- All components are **Server Components by default**.
- `'use client'` at top of file marks a serialization boundary -- all imports become client bundle.
- Props from Server to Client must be **serializable** (no functions, Date objects, class instances).
- Place `'use client'` as **deep** as possible (only on interactive leaves).

### 2.2 When to Use Each

| Server | Client |
|--------|--------|
| Data fetching (DB, API, secrets) | State (`useState`), event handlers |
| Reduce client JS | Lifecycle effects (`useEffect`) |
| Async component functions | Browser APIs (`window`, `localStorage`) |

### 2.3 Key Patterns

- **Interleaving**: `<ClientModal><ServerCart /></ClientModal>` (pass Server as children)
- **Context Providers**: Client Component wrapper in Server layout
- **Environment safety**: `import 'server-only'` / `import 'client-only'`; only `NEXT_PUBLIC_*` env vars exposed to client

---

## 3. Data Fetching

### 3.1 Server Component Fetching

```tsx
export default async function Page() {
  const res = await fetch('https://api.example.com/posts');
  const posts = await res.json();
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}
```

- Identical `fetch` calls are **memoized** within one render pass.
- **v16: fetch is NOT cached by default** -- use `"use cache"` + `cacheLife` to opt in.
- ORM/DB queries: use `React.cache()` for deduplication.

### 3.2 Parallel Fetching

```tsx
const [artist, albums] = await Promise.all([getArtist(id), getAlbums(id)]);
```

### 3.3 Streaming

```tsx
import { Suspense } from 'react';
<Suspense fallback={<Skeleton />}>
  <AsyncComponent />  {/* Streams in when ready */}
</Suspense>
```

`loading.tsx` wraps the entire page segment in `<Suspense>` automatically.

### 3.4 Client-Side with use() (React 19)

Server passes promise as prop (don't await), Client unwraps with `use()`:
```tsx
'use client';
import { use } from 'react';
export function PostsList({ posts }: { posts: Promise<Post[]> }) { const data = use(posts); /* render */ }
```

---

## 4. Server Actions ("use server")

### 4.1 Definition

```tsx
// app/actions.ts
'use server';
export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  await db.post.create({ data: { title: formData.get('title') } });
  revalidatePath('/posts');
  redirect('/posts');
}
```

### 4.2 Usage

- **Forms**: `<form action={createPost}>` (progressive enhancement, works without JS).
- **Event handlers**: `onClick={async () => { await serverFn(); }}` (Client Components only).
- **useActionState** (React 19): `const [state, action, pending] = useActionState(fn, init)`.
- Cannot define in Client Components; must import from `'use server'` file.
- Always verify auth/authz inside every Server Function (reachable via POST).

### 4.3 After Mutation -- v16 APIs

```tsx
updateTag('posts');              // Read-your-writes (Server Actions only)
revalidateTag('posts', 'max');   // SWR (Server Actions + Route Handlers)
refresh();                       // Refresh uncached data (Server Actions only)
revalidatePath('/posts');        // Path-based invalidation
redirect('/posts');              // Redirect (call after revalidation)
```

---

## 5. Cache Components ("use cache")

Enabled by `cacheComponents: true` in `next.config.ts`. This is the v16 opt-in caching model.

### 5.1 Enabling

Set `cacheComponents: true` in `next.config.ts`. When enabled: all data is dynamic by default,
`"use cache"` opts into caching at page/component/function level, PPR is automatic,
React `<Activity>` preserves state during navigation.

### 5.2 "use cache" Directive

```tsx
// File level -- caches all exports (all must be async)
'use cache';
export default async function Page() { /* ... */ }

// Component level
export async function MyComponent() {
  'use cache';
  return <></>;
}

// Function level
export async function getData() {
  'use cache';
  const data = await fetch('/api/data');
  return data;
}
```

**Variants:**
- `"use cache"` -- default in-memory LRU cache
- `"use cache: remote"` -- platform-provided cache handler (Redis/KV) for serverless
- `"use cache: private"` -- for compliance when runtime data cannot be refactored

**Cache key is auto-generated from:** Build ID + Function ID + serialized arguments + closure variables.

### 5.3 cacheLife Profiles

```tsx
import { cacheLife } from 'next/cache';
export default async function Page() {
  'use cache';
  cacheLife('days');
  const posts = await getBlogPosts();
  return <div>{/* render */}</div>;
}
```

| Profile | `stale` | `revalidate` | `expire` |
|---------|---------|--------------|----------|
| `default` | 5 min | 15 min | never |
| `seconds` | 30s | 1s | 1 min |
| `minutes` | 5 min | 1 min | 1h |
| `hours` | 5 min | 1h | 1d |
| `days` | 5 min | 1d | 1w |
| `weeks` | 5 min | 1w | 30d |
| `max` | 5 min | 30d | 1y |

Custom profiles in `next.config.ts` via `cacheLife: { name: { stale, revalidate, expire } }`.
Inline: `cacheLife({ stale: 3600, revalidate: 900, expire: 86400 })`.
See [references/api-functions.md](references/api-functions.md) for full API details.

### 5.4 cacheTag

```tsx
import { cacheTag } from 'next/cache';

export async function getProducts() {
  'use cache';
  cacheTag('products');
  cacheLife('hours');
  return db.query('SELECT * FROM products');
}
```

- Multiple tags: `cacheTag('tag-one', 'tag-two')`
- Max tag length: 256 chars, max 128 tags per entry
- Idempotent: applying same tag multiple times has no effect

### 5.5 Interleaving Cached and Dynamic

Pass dynamic content as `children` through cached components:
```tsx
async function CachedWrapper({ children }: { children: React.ReactNode }) {
  'use cache';
  const data = await fetch('/api/cached');
  return <div><Static data={data} />{children}</div>;
}
```

---

## 6. Caching APIs (v16)

### 6.1 updateTag(tag) -- NEW

Server Actions only. Read-your-writes: expires cache and immediately fetches fresh data.
```tsx
'use server';
import { updateTag } from 'next/cache';
export async function updateProfile(userId: string, data: Profile) {
  await db.users.update(userId, data);
  updateTag(`user-${userId}`); // User sees changes immediately
}
```

### 6.2 revalidateTag(tag, profile) -- UPDATED

Now requires `cacheLife` profile as second argument for SWR behavior.
```tsx
import { revalidateTag } from 'next/cache';
revalidateTag('blog-posts', 'max');            // Recommended
revalidateTag('news-feed', 'hours');           // Other profiles
revalidateTag('products', { expire: 3600 });   // Inline
// Single argument form is DEPRECATED (TypeScript error)
```

### 6.3 refresh() -- NEW

Server Actions only. Refreshes uncached data without touching the cache.
```tsx
'use server';
import { refresh } from 'next/cache';
export async function markNotificationRead(id: string) {
  await db.notifications.markAsRead(id);
  refresh(); // Refreshes uncached UI (e.g., notification count)
}
```

### 6.4 When to Use Which

| API | Context | Behavior | Use Case |
|-----|---------|----------|----------|
| `updateTag(tag)` | Server Actions only | Immediate expiry + fresh data | Forms, user settings |
| `revalidateTag(tag, profile)` | Server Actions + Route Handlers | Stale-while-revalidate | Blog posts, catalogs |
| `refresh()` | Server Actions only | Re-renders uncached data | Notification counts, live metrics |
| `revalidatePath(path)` | Server Actions + Route Handlers | Path-based invalidation | Broad cache clear |

---

## 7. Static vs Dynamic Rendering & PPR

### 7.1 Makes a Route Dynamic

- `cookies()`, `headers()`, `searchParams` access (without `"use cache"`)
- Uncached fetch calls
- `export const dynamic = 'force-dynamic'`

### 7.2 Keeps a Route Static

- All data fetching wrapped in `"use cache"`
- `generateStaticParams` provides all params
- `export const dynamic = 'force-static'`

### 7.3 Partial Prerendering (PPR)

With `cacheComponents: true`, PPR is automatic: static shell from `"use cache"` + `<Suspense>`
fallbacks; dynamic holes stream uncached content at request time.
Pattern: wrap cached content with `"use cache"` + `cacheLife`, wrap dynamic in `<Suspense>`:
```tsx
// Static (cached)
async function BlogContent({ slug }: { slug: string }) {
  'use cache'; cacheLife('days');
  return <article>{(await getPost(slug)).content}</article>;
}
// Dynamic (uncached) -- wrap in Suspense
async function VisitorCount({ slug }: { slug: string }) {
  return <span>{await getVisitorCount(slug)} views</span>;
}
```

### 7.4 Activity-based Navigation

With `cacheComponents` enabled, React's `<Activity>` preserves component state during navigation.
Previous route set to `mode="hidden"` (not unmounted). State intact on back-navigation.

---

## 8. v16 Breaking Changes & Migration

> **Full migration guide**: [references/migration-from-v15.md](references/migration-from-v15.md)
> **Cache Components migration**: [references/cache-components-migration.md](references/cache-components-migration.md)

### 8.1 Version Requirements

| Requirement | Minimum |
|-------------|---------|
| Node.js | 20.9.0 |
| TypeScript | 5.1.0 |
| Chrome/Edge | 111+ |
| Firefox | 111+ |
| Safari | 16.4+ |

### 8.2 Upgrade Command & Codemods

```bash
npx @next/codemod@canary upgrade latest
```

The upgrade command runs applicable codemods automatically. Available v16 codemods:
- `next-async-request-api` -- migrates cookies/headers/params/searchParams to async
- `middleware-to-proxy` -- renames middleware.ts to proxy.ts, updates exports and config flags
- `next-lint-to-eslint-cli` -- migrates `next lint` to ESLint CLI with flat config
- `remove-experimental-ppr` -- removes `experimental_ppr` route segment config
- `remove-unstable-prefix` -- removes `unstable_` prefix from cacheLife/cacheTag

For individual codemod commands and before/after examples, see [references/migration-from-v15.md](references/migration-from-v15.md) Section 2.

### 8.3 Async Request APIs (Fully Enforced)

Synchronous access removed entirely. Must `await` cookies(), headers(), draftMode(),
params, searchParams. Image/sitemap params (`opengraph-image`, `twitter-image`, `icon`,
`apple-icon`, `sitemap`) also receive `params` and `id` as Promises.
See [references/api-functions.md](references/api-functions.md) and [references/migration-from-v15.md](references/migration-from-v15.md) Section 3.1.

### 8.4 middleware.ts -> proxy.ts

Rename file and function. Config: `skipMiddlewareUrlNormalize` -> `skipProxyUrlNormalize`.
Edge runtime NOT supported in proxy.ts (Node.js only).
See [references/proxy-and-config.md](references/proxy-and-config.md).

### 8.5 Turbopack Default

Turbopack is now the default bundler. Custom webpack configs cause build failure unless:
- `next build --webpack` to opt out
- `next build --turbopack` to ignore webpack config
- Migrate webpack config to `turbopack` options

Turbopack config moved from `experimental.turbopack` to top-level `turbopack`.
Sass tilde imports (`~`) not supported; use `resolveAlias` workaround.
See [references/migration-from-v15.md](references/migration-from-v15.md) Section 3.3.

### 8.6 Parallel Routes default.js Required

All parallel route slots must have explicit `default.tsx`. Builds fail without them.
```tsx
// app/@modal/default.tsx
export default function Default() {
  return null;
}
```

### 8.7 Removals

AMP support, `next lint`, `serverRuntimeConfig`/`publicRuntimeConfig`, `experimental.dynamicIO`
(use `cacheComponents`), `experimental.ppr` (use `cacheComponents`), `experimental_ppr` route
export, auto `scroll-behavior: smooth` override (use `data-scroll-behavior="smooth"` on `<html>`),
`unstable_rootParams()`, `devIndicators` options, build `size`/`First Load JS` metrics.

### 8.8 Image Default Changes

`minimumCacheTTL`: 60s -> 4h. `imageSizes`: 16 removed. `qualities`: [1..100] -> [75].
`dangerouslyAllowLocalIP`: blocked by default. `maximumRedirects`: unlimited -> 3.
Local images with query strings require `images.localPatterns.search` config.
See [references/image-and-metadata.md](references/image-and-metadata.md) for details.

### 8.9 revalidateTag Signature Change

Now requires second argument: `revalidateTag('posts', 'max')`. Single-arg deprecated.

### 8.10 Cache Components Migration

To migrate from route segment configs (`dynamic`, `revalidate`, `fetchCache`) to Cache Components
(`"use cache"` + `cacheLife` + `cacheTag`), see [references/cache-components-migration.md](references/cache-components-migration.md).
Key: `cacheComponents: true` is opt-in. Edge runtime incompatible. Gradual adoption supported.

---

## Reference Files

For deeper API details, read the relevant reference file:

- [references/proxy-and-config.md](references/proxy-and-config.md) -- proxy.ts, next.config.ts, Turbopack config
- [references/api-functions.md](references/api-functions.md) -- Complete API function signatures
- [references/image-and-metadata.md](references/image-and-metadata.md) -- next/image, Metadata API, OG images
- [references/advanced-routing.md](references/advanced-routing.md) -- Parallel routes, intercepting routes, error handling
- [references/react-and-tooling.md](references/react-and-tooling.md) -- React 19.2, React Compiler, Turbopack, DevTools MCP
- [references/migration-from-v15.md](references/migration-from-v15.md) -- Complete v15-to-v16 migration guide with codemods, manual steps, pitfalls
- [references/cache-components-migration.md](references/cache-components-migration.md) -- Route segment config to Cache Components migration patterns
