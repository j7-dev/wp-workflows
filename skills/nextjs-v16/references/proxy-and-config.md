# proxy.ts & next.config.ts

## proxy.ts (Replaces middleware.ts)

### Convention

File: `proxy.ts` at project root (or `src/proxy.ts`).
Runs on **Node.js runtime** (NOT Edge). The `runtime` config option is not available in proxy files.

> `middleware.ts` is deprecated. Rename to `proxy.ts` and rename the exported function to `proxy`.

```ts
// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
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

Can be exported as named `proxy` or as `default export`.

### NextProxy Type Helper

```tsx
import type { NextProxy } from 'next/server';

export const proxy: NextProxy = (request, event) => {
  event.waitUntil(Promise.resolve());
  return Response.json({ pathname: request.nextUrl.pathname });
};
```

### Matcher Patterns

```tsx
export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
```

Advanced matcher with `has` / `missing`:
```tsx
export const config = {
  matcher: [
    {
      source: '/api/:path*',
      locale: false,
      has: [
        { type: 'header', key: 'Authorization', value: 'Bearer Token' },
        { type: 'query', key: 'userId', value: '123' },
      ],
      missing: [{ type: 'cookie', key: 'session', value: 'active' }],
    },
  ],
};
```

### Key APIs

**NextRequest** extends Request:
- `request.cookies` -- RequestCookies (get, getAll, has, set, delete, clear)
- `request.nextUrl` -- NextURL with `pathname`, `searchParams`, `basePath`
- `request.headers` -- standard Headers
- `request.method` -- HTTP method

**NextResponse** methods:
- `NextResponse.next()` -- continue to the next route
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

Setting request headers (passed upstream):
```tsx
const requestHeaders = new Headers(request.headers);
requestHeaders.set('x-custom', 'value');
const response = NextResponse.next({
  request: { headers: requestHeaders },
});
```

### waitUntil

```tsx
import type { NextFetchEvent, NextRequest } from 'next/server';

export function proxy(req: NextRequest, event: NextFetchEvent) {
  event.waitUntil(
    fetch('https://analytics.example.com', {
      method: 'POST',
      body: JSON.stringify({ pathname: req.nextUrl.pathname }),
    })
  );
  return NextResponse.next();
}
```

### Execution Order

1. `headers` from `next.config.js`
2. `redirects` from `next.config.js`
3. **Proxy** (rewrites, redirects, etc.)
4. `beforeFiles` rewrites from `next.config.js`
5. Filesystem routes (`public/`, `_next/static/`, `pages/`, `app/`)
6. `afterFiles` rewrites from `next.config.js`
7. Dynamic Routes (`/blog/[slug]`)
8. `fallback` rewrites from `next.config.js`

### Advanced Flags

```js
// next.config.js
module.exports = {
  skipProxyUrlNormalize: true,   // was skipMiddlewareUrlNormalize
  skipTrailingSlashRedirect: true,
};
```

### Migration from middleware.ts

```bash
npx @next/codemod@canary middleware-to-proxy .
```

Changes:
- Rename `middleware.ts` -> `proxy.ts`
- Rename exported function `middleware` -> `proxy`
- `skipMiddlewareUrlNormalize` -> `skipProxyUrlNormalize`

### Unit Testing (experimental)

```tsx
import { unstable_doesProxyMatch } from 'next/experimental/testing/server';

expect(unstable_doesProxyMatch({
  config,
  nextConfig,
  url: '/test',
})).toEqual(false);
```

---

## next.config.ts

### v16 Config Structure

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Cache Components (v16 headline feature)
  cacheComponents: true,

  // Custom cache life profiles
  cacheLife: {
    editorial: {
      stale: 600,
      revalidate: 3600,
      expire: 86400,
    },
  },

  // React Compiler (stable in v16)
  reactCompiler: true,

  // Turbopack config (moved from experimental.turbopack)
  turbopack: {
    resolveAlias: {
      fs: { browser: './empty.ts' },
    },
  },

  // Docker deployment
  output: 'standalone',

  // Image optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    minimumCacheTTL: 14400,        // v16 default: 4 hours
    // imageSizes default no longer includes 16
    // qualities default is now [75]
    // dangerouslyAllowLocalIP: true, // Only for private networks
    // maximumRedirects: 3,          // v16 default
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

  // Proxy flags (renamed from middleware)
  skipProxyUrlNormalize: false,
  skipTrailingSlashRedirect: false,

  // Experimental
  experimental: {
    turbopackFileSystemCacheForDev: true, // stable in 16.1
  },
};

export default nextConfig;
```

### Key v15 -> v16 Config Changes

| v15 | v16 |
|-----|-----|
| `experimental.turbopack` | `turbopack` (top-level) |
| `experimental.dynamicIO` | `cacheComponents` |
| `experimental.ppr` | Removed (use `cacheComponents`) |
| `experimental.reactCompiler` | `reactCompiler` (top-level) |
| `skipMiddlewareUrlNormalize` | `skipProxyUrlNormalize` |
| `serverRuntimeConfig` / `publicRuntimeConfig` | Removed (use env vars) |
| `eslint` config option | Removed (`next lint` removed) |

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

### Environment Variables

- Server-only by default (safe for secrets).
- `NEXT_PUBLIC_*` prefix: inlined into client JS at build time.
- Runtime env vars: use `connection()` before reading `process.env` for runtime-only values.
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`: for multi-instance Server Action encryption.

### Concurrent dev and build

`next dev` outputs to `.next/dev/`, `next build` outputs to `.next/`.
A lockfile prevents multiple instances on the same project.

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

No more `--turbopack` flag needed -- it is the default.
To opt out: `next build --webpack`.
