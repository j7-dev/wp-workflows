# Next.js 16 API Functions Reference

## Navigation & Routing

### redirect(url, type?)
```tsx
import { redirect } from 'next/navigation';
redirect('/login');                    // 307 temporary redirect
redirect('/login', RedirectType.push); // RedirectType.push | .replace
```
- Throws internally (no code after it executes).
- Call `revalidatePath`/`revalidateTag`/`updateTag` before `redirect`.
- Usable in Server Components, Server Actions, Route Handlers.

### permanentRedirect(url, type?)
```tsx
import { permanentRedirect } from 'next/navigation';
permanentRedirect('/new-path'); // 308 permanent redirect
```

### notFound()
```tsx
import { notFound } from 'next/navigation';
if (!post) notFound(); // Triggers nearest not-found.tsx boundary
```

### useRouter()
```tsx
'use client';
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/dashboard');
router.replace('/login');
router.refresh();  // Re-fetch server components without losing client state
router.back();
router.forward();
router.prefetch('/about');
```

### usePathname()
```tsx
'use client';
import { usePathname } from 'next/navigation';
const pathname = usePathname(); // e.g., '/blog/hello'
```

### useSearchParams()
```tsx
'use client';
import { useSearchParams } from 'next/navigation';
const searchParams = useSearchParams();
const query = searchParams.get('q'); // ?q=hello -> 'hello'
```

### useParams()
```tsx
'use client';
import { useParams } from 'next/navigation';
const params = useParams(); // { slug: 'hello' }
```

### useSelectedLayoutSegment(parallelRoutesKey?)
```tsx
'use client';
import { useSelectedLayoutSegment } from 'next/navigation';
const segment = useSelectedLayoutSegment(); // e.g., 'settings'
```

### useSelectedLayoutSegments(parallelRoutesKey?)
```tsx
'use client';
import { useSelectedLayoutSegments } from 'next/navigation';
const segments = useSelectedLayoutSegments(); // ['blog', 'hello']
```

---

## Request/Response

### cookies() -- ASYNC (v15+, fully enforced v16)
```tsx
import { cookies } from 'next/headers';

const cookieStore = await cookies();
cookieStore.get('name');              // { name, value }
cookieStore.getAll();                 // CookieListItem[]
cookieStore.has('name');              // boolean
cookieStore.set('name', 'value');     // In Server Actions only
cookieStore.set({ name, value, httpOnly: true, path: '/' });
cookieStore.delete('name');           // In Server Actions only
```

### headers() -- ASYNC (v15+, fully enforced v16)
```tsx
import { headers } from 'next/headers';

const headersList = await headers();
headersList.get('content-type');
headersList.has('authorization');
// Read-only in Server Components. Mutable in Server Actions.
```

### NextRequest
```tsx
import { NextRequest } from 'next/server';

request.cookies           // RequestCookies
request.nextUrl           // NextURL (parsed URL with pathname, search, etc.)
request.nextUrl.pathname  // '/blog/hello'
request.nextUrl.searchParams.get('q')
request.headers
request.method
```

### NextResponse
```tsx
import { NextResponse } from 'next/server';

NextResponse.json({ data }, { status: 200 })
NextResponse.redirect(new URL('/login', request.url))
NextResponse.rewrite(new URL('/api/proxy', request.url))
NextResponse.next()  // Continue proxy chain

// Set cookies
const response = NextResponse.next();
response.cookies.set('token', 'abc', { httpOnly: true });

// Set headers
response.headers.set('x-custom', 'value');
```

---

## Caching & Revalidation (v16)

### revalidatePath(path, type?)
```tsx
import { revalidatePath } from 'next/cache';

revalidatePath('/blog');               // Revalidate specific path
revalidatePath('/blog', 'page');       // Only the page
revalidatePath('/blog', 'layout');     // Layout and all child segments
revalidatePath('/');                   // Revalidate entire site
revalidatePath('/blog/[slug]', 'page'); // Dynamic route
```

### revalidateTag(tag, profile) -- UPDATED in v16
```tsx
import { revalidateTag } from 'next/cache';

revalidateTag('posts', 'max');            // SWR with 'max' profile (recommended)
revalidateTag('news', 'hours');           // SWR with 'hours' profile
revalidateTag('data', { expire: 3600 }); // SWR with inline profile

// DEPRECATED: single argument
revalidateTag('posts'); // TypeScript error
```

### updateTag(tag) -- NEW in v16
```tsx
import { updateTag } from 'next/cache';

// Server Actions ONLY. Read-your-writes semantics.
updateTag('posts');  // Immediately expires + fetches fresh data
```

### refresh() -- NEW in v16
```tsx
import { refresh } from 'next/cache';

// Server Actions ONLY. Refreshes uncached data without touching cache.
refresh();
```

### cacheLife(profile)
```tsx
import { cacheLife } from 'next/cache';

// Inside "use cache" scope:
cacheLife('days');                                    // Built-in profile
cacheLife({ stale: 3600, revalidate: 900, expire: 86400 }); // Inline
```

### cacheTag(...tags)
```tsx
import { cacheTag } from 'next/cache';

// Inside "use cache" scope:
cacheTag('products');
cacheTag('tag-one', 'tag-two');  // Multiple tags
```

---

## Static Generation

### generateStaticParams()
```tsx
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map(post => ({ slug: post.slug }));
}
```

### generateMetadata(props, parent?)
```tsx
import type { Metadata, ResolvingMetadata } from 'next';

export async function generateMetadata(
  { params, searchParams }: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  const previousImages = (await parent).openGraph?.images || [];
  return {
    title: post.title,
    openGraph: { images: [post.ogImage, ...previousImages] },
  };
}
```

### generateViewport(props?)
```tsx
import type { Viewport } from 'next';
export function generateViewport(): Viewport {
  return { themeColor: '#000', width: 'device-width', initialScale: 1 };
}
```

### Type Helpers (v16)
```tsx
// Auto-generated via: npx next typegen
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params;
  return <h1>{slug}</h1>;
}

export default async function Layout(props: LayoutProps<'/blog/[slug]'>) {
  return <div>{props.children}</div>;
}

// Route Handler context
export async function GET(_req: NextRequest, ctx: RouteContext<'/users/[id]'>) {
  const { id } = await ctx.params;
  return Response.json({ id });
}
```

---

## Image

### ImageResponse (OG Image Generation)
```tsx
import { ImageResponse } from 'next/og';

export default function Image() {
  return new ImageResponse(
    <div style={{ fontSize: 128, display: 'flex' }}>Hello</div>,
    { width: 1200, height: 630 }
  );
}
```

---

## Miscellaneous

### after(callback)
```tsx
import { after } from 'next/server';

export async function POST(req: NextRequest) {
  const data = await processRequest(req);
  after(() => {
    logToAnalytics(data); // Runs after response is sent
  });
  return NextResponse.json(data);
}
```

### connection()
```tsx
import { connection } from 'next/server';

// Ensures the component renders at request time (not prerendered)
await connection();
// Also use before reading runtime env vars:
const config = process.env.RUNTIME_CONFIG;
```

### draftMode() -- ASYNC (fully enforced v16)
```tsx
import { draftMode } from 'next/headers';

const { isEnabled } = await draftMode();
// In Route Handler: (await draftMode()).enable();
```

### React.cache()
```tsx
import { cache } from 'react';

export const getUser = cache(async (id: string) => {
  return db.users.findUnique({ where: { id } });
});
// Memoized per-request. Same args = same result within one render.
// Note: React.cache operates in isolated scope inside "use cache" boundaries.
```

---

## Route Segment Config Exports

```tsx
// Any of these can be exported from page.tsx, layout.tsx, or route.ts

export const dynamic = 'auto';
// 'auto' | 'force-dynamic' | 'error' | 'force-static'

export const dynamicParams = true;
// true: generate unknown dynamic params on-demand
// false: return 404 for unknown params

export const revalidate = false;
// false | 0 | number (seconds)

export const fetchCache = 'auto';
// 'auto' | 'default-cache' | 'only-cache' | 'force-cache'
// | 'force-no-store' | 'default-no-store' | 'only-no-store'

export const runtime = 'nodejs';
// 'nodejs' | 'edge'

export const preferredRegion = 'auto';
// 'auto' | 'global' | 'home' | string | string[]

export const maxDuration = 5;
// number (seconds) -- max execution time for serverless functions
```

---

## Route Handlers (route.ts)

### Convention

```tsx
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ posts: [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ created: true }, { status: 201 });
}
```

Supported methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`.

### Dynamic Segments (ASYNC params)

```tsx
// app/api/posts/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({ id });
}
```

### Caching Rules

- Route Handlers are NOT cached by default.
- To cache GET: `export const dynamic = 'force-static';`
- Other HTTP methods are never cached.
- `route.ts` and `page.tsx` cannot exist at the same route segment level.

---

## Link Component

```tsx
import Link from 'next/link';

<Link href="/about">About</Link>
<Link href="/blog/hello" prefetch={false}>Post</Link>
<Link href={{ pathname: '/blog/[slug]', query: { slug: 'hello' } }}>Post</Link>
<Link href="/dashboard" replace>Dashboard</Link>
<Link href="/dashboard" scroll={false}>Dashboard</Link>
```

Props:
- `href`: string | UrlObject (required)
- `replace`: boolean -- replace history instead of push
- `scroll`: boolean -- scroll to top on navigation (default: true)
- `prefetch`: boolean | null

### v16 Prefetch Behavior

- **Layout deduplication**: shared layouts downloaded once, not per-link
- **Incremental prefetching**: only prefetches parts not already in cache
- Cancels prefetch when link leaves viewport
- Re-prefetches when data invalidated

---

## Async Image/Sitemap Parameters (v16)

### OG/Twitter Image Generation

```tsx
// app/shop/[slug]/opengraph-image.tsx
export async function generateImageMetadata({ params }) {
  const { slug } = params; // Still synchronous in generateImageMetadata
  return [{ id: '1' }, { id: '2' }];
}

export default async function Image({ params, id }) {
  const { slug } = await params;    // params is now async
  const imageId = await id;          // id is now Promise<string>
  // ...
}
```

### Sitemap Generation

```tsx
// app/product/sitemap.ts
export async function generateSitemaps() {
  return [{ id: 0 }, { id: 1 }, { id: 2 }];
}

export default async function sitemap({ id }) {
  const resolvedId = await id;           // id is now Promise<string>
  const start = Number(resolvedId) * 50000;
  // ...
}
```
