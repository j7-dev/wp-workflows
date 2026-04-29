# Cache Components Migration Guide

How to migrate from the v15 route segment config caching model to the v16 Cache Components model.

**Prerequisite:** Set `cacheComponents: true` in `next.config.ts`. This is opt-in -- your app works without it, but you lose access to Cache Components, PPR, and `<Activity>` state preservation.

```ts
// next.config.ts
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  cacheComponents: true,
};
export default nextConfig;
```

---

## 1. Route Segment Config Replacement Table

| v15 Route Segment Config | v16 Cache Components Equivalent | Notes |
|--------------------------|--------------------------------|-------|
| `dynamic = 'force-dynamic'` | Remove entirely | All pages are dynamic by default with `cacheComponents` |
| `dynamic = 'force-static'` | `"use cache"` + `cacheLife('max')` | Apply to page/layout or closest data-fetching function |
| `revalidate = N` | `"use cache"` + `cacheLife(profile)` | Map seconds to nearest built-in profile or define custom |
| `fetchCache = 'force-cache'` | `"use cache"` at page/component level | All fetches inside `"use cache"` scope are automatically cached |
| `fetchCache = 'default-cache'` | `"use cache"` at page/component level | Same -- all fetches within scope are cached |
| `fetchCache = 'only-cache'` | `"use cache"` at page/component level | Same pattern |
| `fetchCache = 'force-no-store'` | Remove; don't use `"use cache"` | Dynamic by default, no action needed |
| `runtime = 'edge'` | **Not supported** -- remove | Cache Components require Node.js runtime |

### Revalidate-to-CacheLife Mapping

| `revalidate` value | Closest `cacheLife` profile | Profile details (stale / revalidate / expire) |
|--------------------|-----------------------------|-----------------------------------------------|
| `0` | (no cache -- remove config) | Dynamic by default |
| `1` - `60` | `'seconds'` | 30s / 1s / 1min |
| `61` - `600` | `'minutes'` | 5min / 1min / 1h |
| `601` - `7200` | `'hours'` | 5min / 1h / 1d |
| `7201` - `86400` | `'days'` | 5min / 1d / 1w |
| `86401` - `604800` | `'weeks'` | 5min / 1w / 30d |
| `> 604800` | `'max'` | 5min / 30d / 1y |
| Custom value | Custom profile in next.config.ts | Define exact stale/revalidate/expire |

Custom profile example:
```ts
// next.config.ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    tenMinutes: {
      stale: 300,      // 5 min stale window
      revalidate: 600, // 10 min revalidation
      expire: 3600,    // 1h expiry
    },
  },
};
```

Usage:
```tsx
import { cacheLife } from 'next/cache';
export default async function Page() {
  'use cache';
  cacheLife('tenMinutes');
  // ...
}
```

---

## 2. Before/After Patterns

### Pattern A: Fully Dynamic Page (no change needed)

```tsx
// v15
export const dynamic = 'force-dynamic';

export default async function Page() {
  const data = await fetch('https://api.example.com/live');
  return <div>{data}</div>;
}

// v16 -- just remove the config export
export default async function Page() {
  const data = await fetch('https://api.example.com/live');
  return <div>{data}</div>;
}
```

### Pattern B: Fully Static Page

```tsx
// v15
export const dynamic = 'force-static';

export default async function Page() {
  const data = await fetch('https://api.example.com/data');
  return <div>{data}</div>;
}

// v16
import { cacheLife } from 'next/cache';

export default async function Page() {
  'use cache';
  cacheLife('max');
  const data = await fetch('https://api.example.com/data');
  return <div>{data}</div>;
}
```

### Pattern C: ISR with Revalidation

```tsx
// v15
export const revalidate = 3600; // 1 hour

export default async function Page() {
  const posts = await fetch('https://api.example.com/posts');
  return <PostList posts={posts} />;
}

// v16
import { cacheLife } from 'next/cache';

export default async function Page() {
  'use cache';
  cacheLife('hours');
  const posts = await fetch('https://api.example.com/posts');
  return <PostList posts={posts} />;
}
```

### Pattern D: Force-Cache All Fetches

```tsx
// v15
export const fetchCache = 'force-cache';

export default async function Page() {
  const a = await fetch('https://api.example.com/a');
  const b = await fetch('https://api.example.com/b');
  return <div>{a}{b}</div>;
}

// v16 -- "use cache" automatically caches all fetches in scope
import { cacheLife } from 'next/cache';

export default async function Page() {
  'use cache';
  cacheLife('hours');
  const a = await fetch('https://api.example.com/a');
  const b = await fetch('https://api.example.com/b');
  return <div>{a}{b}</div>;
}
```

### Pattern E: Mixed Static + Dynamic (PPR)

```tsx
// v15 (experimental PPR)
export const experimental_ppr = true;

export default async function Page() {
  const staticData = await getCachedContent();
  return (
    <div>
      <StaticSection data={staticData} />
      <Suspense fallback={<Skeleton />}>
        <DynamicSection />
      </Suspense>
    </div>
  );
}

// v16 -- PPR is automatic with cacheComponents
import { cacheLife } from 'next/cache';
import { Suspense } from 'react';

async function StaticSection() {
  'use cache';
  cacheLife('days');
  const data = await getCachedContent();
  return <div>{data}</div>;
}

async function DynamicSection() {
  // No "use cache" -- dynamic by default
  const live = await getLiveData();
  return <div>{live}</div>;
}

export default function Page() {
  return (
    <div>
      <StaticSection />
      <Suspense fallback={<Skeleton />}>
        <DynamicSection />
      </Suspense>
    </div>
  );
}
```

### Pattern F: Data Function Caching (replaces unstable_cache)

```tsx
// v15
import { unstable_cache } from 'next/cache';

const getCachedPosts = unstable_cache(
  async () => db.posts.findMany(),
  ['posts'],
  { revalidate: 3600, tags: ['posts'] }
);

// v16
import { cacheLife, cacheTag } from 'next/cache';

async function getPosts() {
  'use cache';
  cacheLife('hours');
  cacheTag('posts');
  return db.posts.findMany();
}
```

### Pattern G: Tagged Revalidation

```tsx
// v15
import { revalidateTag } from 'next/cache';
revalidateTag('posts'); // Single argument

// v16 -- requires cacheLife profile as second argument
import { revalidateTag } from 'next/cache';
revalidateTag('posts', 'max'); // SWR behavior

// v16 -- for immediate invalidation (read-your-writes)
import { updateTag } from 'next/cache';
updateTag('posts'); // Server Actions only
```

---

## 3. Edge Runtime Incompatibility

Cache Components require the Node.js runtime. Routes using `runtime = 'edge'` CANNOT use `"use cache"`, `cacheLife`, `cacheTag`, or benefit from PPR.

**Action required for Edge routes:**

| Scenario | Solution |
|----------|----------|
| Route uses Edge + needs caching | Remove `runtime = 'edge'`; switch to Node.js (default) |
| Route MUST run on Edge | Keep Edge, but cannot use Cache Components for this route |
| proxy.ts (middleware replacement) | Already Node.js only; no conflict |

```tsx
// Will NOT work -- build error
'use cache';
export const runtime = 'edge'; // Incompatible with Cache Components

// Correct -- remove Edge runtime
'use cache';
// runtime defaults to 'nodejs'
```

---

## 4. Gradual Adoption Strategy

`cacheComponents: true` is opt-in and does NOT require migrating everything at once.

### Phase 1: Enable and Verify

1. Add `cacheComponents: true` to `next.config.ts`
2. Run `next build` -- existing route segment configs still work but emit deprecation warnings
3. Fix any build errors (typically Edge runtime conflicts)

### Phase 2: Migrate Data Functions First

Start with data-fetching functions (lowest risk, highest reuse):

```tsx
// Convert unstable_cache or cached fetch helpers to "use cache"
async function getProducts() {
  'use cache';
  cacheLife('hours');
  cacheTag('products');
  return db.products.findMany();
}
```

### Phase 3: Migrate Page-Level Configs

Replace `revalidate`, `dynamic`, `fetchCache` exports one page at a time:

1. Remove the route segment config export
2. Add `"use cache"` + `cacheLife` to the page/layout function
3. Verify the route renders correctly
4. Move to the next page

### Phase 4: Adopt PPR

With `cacheComponents` enabled, PPR is automatic. Structure pages as cached shells with dynamic holes:

- Wrap cached sections in components with `"use cache"`
- Wrap dynamic sections in `<Suspense>`
- The static shell prerenders; dynamic content streams in

### Phase 5: Remove All Legacy Configs

Once all routes are migrated, remove any remaining route segment config exports (`dynamic`, `revalidate`, `fetchCache`). The `"use cache"` directive is now the single source of truth for caching behavior.
