# Route Handlers, Middleware & next.config.mjs

## Route Handlers (route.ts)

### Convention

Route Handlers are defined in `route.ts` files inside `app/`. They use Web Request/Response APIs.

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
Unsupported methods return 405.

### Dynamic Segments (v15 -- async params)

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

### RouteContext Type Helper (globally available)

```tsx
export async function GET(_req: NextRequest, ctx: RouteContext<'/users/[id]'>) {
  const { id } = await ctx.params;
  return Response.json({ id });
}
```

### Caching Rules

- Route Handlers are **NOT cached by default** in v15.
- To cache GET: `export const dynamic = 'force-static';`
- Other HTTP methods are never cached.
- `route.ts` and `page.tsx` cannot exist at the same route segment level.

### On-demand Revalidation Endpoint

```tsx
// app/api/revalidate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-revalidate-secret');
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { tags, paths } = await req.json();
  for (const tag of tags ?? []) revalidateTag(tag);
  for (const path of paths ?? []) revalidatePath(path);
  return NextResponse.json({ ok: true });
}
```

---

## Middleware

### Convention

File: `middleware.ts` at project root (or `src/middleware.ts`).
Runs on Edge Runtime by default (limited Node.js APIs).

```tsx
import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  if (!token && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
```

### Matcher Patterns

```tsx
export const config = {
  matcher: [
    '/admin/:path*',                      // Specific path prefix
    '/((?!api|_next|.*\\..*).*)',          // Exclude API, _next, static files
    '/((?!_next/static|_next/image|favicon.ico).*)', // Common exclusion pattern
  ],
};
```

### Key APIs

**NextRequest** extends Request:
- `request.cookies` -- RequestCookies (get, getAll, has, set, delete)
- `request.nextUrl` -- NextURL with `pathname`, `searchParams`, `basePath`, `locale`
- `request.headers` -- standard Headers

**NextResponse** methods:
- `NextResponse.next()` -- continue to the next middleware/route
- `NextResponse.redirect(url)` -- redirect (302 by default)
- `NextResponse.rewrite(url)` -- rewrite URL (client sees original URL)
- `NextResponse.json(body, init?)` -- JSON response

Setting headers and cookies:
```tsx
const response = NextResponse.next();
response.headers.set('x-pathname', request.nextUrl.pathname);
response.cookies.set('theme', 'dark', { httpOnly: true, path: '/' });
return response;
```

### Important Limitations

- Middleware runs on Edge Runtime -- no `fs`, limited `crypto`, no native Node.js modules.
- v15 removed `geo` and `ip` from NextRequest (use hosting provider's APIs).
- Don't use middleware for heavy computation -- keep it fast.

---

## next.config.mjs

### Common Options

```js
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Docker deployment
  output: 'standalone',

  // Image optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    // minimumCacheTTL: 60, // seconds for optimized images
  },

  // Monorepo: transpile workspace packages
  transpilePackages: ['@my/shared-types'],

  // API proxy
  async rewrites() {
    const apiUrl = process.env.API_URL_INTERNAL ?? 'http://localhost:6001';
    return [
      { source: '/v1/:path*', destination: `${apiUrl}/v1/:path*` },
    ];
  },

  // Redirects
  async redirects() {
    return [
      { source: '/old-path', destination: '/new-path', permanent: true },
      {
        source: '/blog/:slug',
        has: [{ type: 'query', key: 'preview', value: 'true' }],
        destination: '/preview/blog/:slug',
        permanent: false,
      },
    ];
  },

  // Custom response headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },

  // Webpack customization
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },

  // Experimental features
  experimental: {
    staleTimes: { dynamic: 30, static: 180 }, // Client router cache durations
  },
};

export default withNextIntl(nextConfig);
```

### output: 'standalone'

Creates a self-contained build at `.next/standalone/` with only required `node_modules`.

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
ENV PORT=3000
CMD ["node", "server.js"]
```

For monorepos, set `outputFileTracingRoot` to the monorepo root.

### Key v15 Config Changes

| v14 (experimental) | v15 (stable) |
|---------------------|--------------|
| `experimental.bundlePagesExternals` | `bundlePagesRouterDependencies` |
| `experimental.serverComponentsExternalPackages` | `serverExternalPackages` |

### Environment Variables

- Server-only by default (safe for secrets).
- `NEXT_PUBLIC_*` prefix: inlined into client JS at build time.
- Runtime env vars: read in dynamically rendered routes (after `cookies()`, `headers()`, or `connection()`).
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`: for multi-instance Server Action encryption consistency.

### Self-Hosting Considerations

- **Image optimization**: works with `next start` out of the box. Install `sharp` for better performance on Linux.
- **ISR cache**: stored on local filesystem by default. Use `cacheHandler` + `cacheMaxMemorySize: 0` for shared cache (Redis/S3).
- **Streaming**: disable reverse proxy buffering (`X-Accel-Buffering: no` for nginx).
- **Build ID**: use `generateBuildId` for consistent IDs across containers.
- **Version skew**: set `deploymentId` for rolling deployments.
