# Next.js 15 API Functions Reference

## Navigation & Routing

### redirect(url, type?)
```tsx
import { redirect } from 'next/navigation';
redirect('/login');                    // 307 temporary redirect
redirect('/login', RedirectType.push); // RedirectType.push | .replace
```
- Throws internally (no code after it executes).
- Call `revalidatePath`/`revalidateTag` before `redirect`.
- Usable in Server Components, Server Actions, Route Handlers.

### permanentRedirect(url, type?)
```tsx
import { permanentRedirect } from 'next/navigation';
permanentRedirect('/new-path'); // 308 permanent redirect
```

### notFound()
```tsx
import { notFound } from 'next/navigation';
// Triggers nearest not-found.tsx boundary
if (!post) notFound();
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
const query = searchParams.get('q'); // ?q=hello → 'hello'
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
// For parallel routes: useSelectedLayoutSegment('auth')
```

### useSelectedLayoutSegments(parallelRoutesKey?)
```tsx
'use client';
import { useSelectedLayoutSegments } from 'next/navigation';
const segments = useSelectedLayoutSegments(); // ['blog', 'hello']
```

---

## Request/Response

### cookies() — ASYNC in v15
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

### headers() — ASYNC in v15
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

// Properties
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
NextResponse.next()  // Continue middleware chain

// Set cookies
const response = NextResponse.next();
response.cookies.set('token', 'abc', { httpOnly: true });

// Set headers
response.headers.set('x-custom', 'value');
```

---

## Caching & Revalidation

### revalidatePath(path, type?)
```tsx
import { revalidatePath } from 'next/cache';

revalidatePath('/blog');        // Revalidate specific path
revalidatePath('/blog', 'page'); // Only the page
revalidatePath('/blog', 'layout'); // Layout and all child segments
revalidatePath('/');            // Revalidate entire site
revalidatePath('/blog/[slug]', 'page'); // Dynamic route
```

### revalidateTag(tag)
```tsx
import { revalidateTag } from 'next/cache';
revalidateTag('posts');  // Invalidate all cache entries tagged 'posts'
```

### unstable_cache(fn, keyParts?, options?)
```tsx
import { unstable_cache } from 'next/cache';

const getCachedData = unstable_cache(
  async (id: string) => db.findById(id),
  ['my-data'],                        // cache key parts
  { revalidate: 3600, tags: ['data'] } // options
);
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
- Returns array of param objects.
- Each object corresponds to one pre-rendered page.
- Combined with `dynamicParams` to control fallback behavior.

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
    // Runs after response is sent (logging, analytics, cleanup)
    logToAnalytics(data);
  });
  return NextResponse.json(data);
}
```

### connection()
```tsx
import { connection } from 'next/server';

// Ensures the component renders at request time (not prerendered)
await connection();
```

### draftMode() — ASYNC in v15
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
// number (seconds) — max execution time for serverless functions
```

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
- `replace`: boolean — replace history instead of push
- `scroll`: boolean — scroll to top on navigation (default: true)
- `prefetch`: boolean | null — prefetch on viewport entry (default: true for static, null for dynamic)
