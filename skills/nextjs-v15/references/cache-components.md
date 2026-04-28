# Cache Components (v16+ / opt-in)

> Enabled by `cacheComponents: true` in `next.config.ts`. This is **not** the default in v15.
> Documented here for forward-looking awareness and projects that opt in early.

## Enabling

```ts
// next.config.ts
const nextConfig = {
  cacheComponents: true,
};
```

## "use cache" Directive

Cache the return value of async functions and components.

### Data-level Caching

```tsx
import { cacheLife } from 'next/cache';

export async function getUsers() {
  'use cache';
  cacheLife('hours');
  return db.query('SELECT * FROM users');
}
```

### UI-level Caching

```tsx
import { cacheLife } from 'next/cache';

export default async function Page() {
  'use cache';
  cacheLife('hours');
  const users = await db.query('SELECT * FROM users');
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

## cacheLife Profiles

| Profile   | stale  | revalidate | expire      |
|-----------|--------|------------|-------------|
| `seconds` | 0      | 1s         | 60s         |
| `minutes` | 5m     | 1m         | 1h          |
| `hours`   | 5m     | 1h         | 1d          |
| `days`    | 5m     | 1d         | 1w          |
| `weeks`   | 5m     | 1w         | 30d         |
| `max`     | 5m     | 30d        | ~indefinite |

Custom:
```tsx
'use cache';
cacheLife({
  stale: 3600,     // 1 hour stale window
  revalidate: 7200, // 2 hours revalidation
  expire: 86400,   // 1 day expiry
});
```

## cacheTag

Tag cached data for on-demand invalidation:

```tsx
import { cacheTag } from 'next/cache';

export async function getProducts() {
  'use cache';
  cacheTag('products');
  return db.query('SELECT * FROM products');
}
```

## updateTag vs revalidateTag

| | updateTag | revalidateTag |
|---|-----------|---------------|
| Where | Server Actions only | Server Actions + Route Handlers |
| Behavior | Immediately expires cache | Stale-while-revalidate |
| Use case | Read-your-own-writes | Background refresh (slight delay OK) |

```tsx
// updateTag — immediate
import { updateTag } from 'next/cache';
export async function createPost(formData: FormData) {
  'use server';
  await db.post.create({ ... });
  updateTag('posts');
  redirect('/posts');
}

// revalidateTag — stale-while-revalidate
import { revalidateTag } from 'next/cache';
export async function refreshPosts() {
  'use server';
  revalidateTag('posts', 'max'); // second arg: stale window profile
}
```

## Streaming Uncached Data

Components requiring fresh data on every request should NOT use `"use cache"`.
Wrap them in `<Suspense>`:

```tsx
import { Suspense } from 'react';

async function LatestPosts() {
  const data = await fetch('https://api.example.com/posts');
  const posts = await data.json();
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}

export default function Page() {
  return (
    <Suspense fallback={<p>Loading posts...</p>}>
      <LatestPosts />
    </Suspense>
  );
}
```

## Runtime APIs with Cache Components

Components that access `cookies()`, `headers()`, `searchParams` should be wrapped in
`<Suspense>`:

```tsx
import { cookies } from 'next/headers';
import { Suspense } from 'react';

async function UserGreeting() {
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme')?.value || 'light';
  return <p>Your theme: {theme}</p>;
}

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <UserGreeting />
    </Suspense>
  );
}
```

## Passing Runtime Values to Cached Functions

```tsx
async function ProfileContent() {
  const session = (await cookies()).get('session')?.value;
  return <CachedContent sessionId={session} />;
}

async function CachedContent({ sessionId }: { sessionId: string }) {
  'use cache';
  // sessionId becomes part of the cache key
  const data = await fetchUserData(sessionId);
  return <div>{data}</div>;
}
```

## Non-deterministic Operations

- Use `connection()` from `next/server` before `Math.random()`, `Date.now()`, `crypto.randomUUID()`.
- Wrap in `<Suspense>`.

```tsx
import { connection } from 'next/server';
import { Suspense } from 'react';

async function UniqueContent() {
  await connection();
  const uuid = crypto.randomUUID();
  return <p>Request ID: {uuid}</p>;
}
```

## Route Handlers with Cache Components

GET Route Handlers follow the same prerendering model as pages:
- Static by default if no runtime APIs accessed.
- `"use cache"` cannot be used directly in Route Handler body; extract to helper.

```tsx
import { cacheLife } from 'next/cache';

export async function GET() {
  const products = await getProducts();
  return Response.json(products);
}

async function getProducts() {
  'use cache';
  cacheLife('hours');
  return await db.query('SELECT * FROM products');
}
```

## Partial Prerendering (PPR)

Default behavior with Cache Components enabled. The static shell includes:
- `"use cache"` results
- `<Suspense>` fallback UIs
- Deterministic operations (sync I/O, pure computation)

Dynamic content (runtime APIs, uncached fetches) streams in at request time.
