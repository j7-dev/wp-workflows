# React 19.2, React Compiler, Turbopack & DevTools

## React 19.2 Features

Next.js 16 ships with React 19.2 (Canary release). Key new features:

### View Transitions

Animate elements that update inside a Transition or navigation.

```tsx
import { ViewTransition } from 'react';

function Page() {
  return (
    <ViewTransition>
      <Content />
    </ViewTransition>
  );
}
```

Animate elements between states during route transitions. Uses the browser's View Transitions API under the hood with React's transition system.

### useEffectEvent

Extract non-reactive logic from Effects into reusable Effect Event functions.

```tsx
import { useEffect, useEffectEvent } from 'react';

function Chat({ roomId, theme }) {
  const onConnected = useEffectEvent(() => {
    showNotification('Connected!', theme);
  });

  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on('connected', () => {
      onConnected();
    });
    return () => connection.disconnect();
  }, [roomId]); // theme not needed in deps
}
```

`useEffectEvent` captures the latest values without requiring them in the dependency array.

### Activity

Render "background activity" by hiding UI with `display: none` while maintaining state and cleaning up Effects.

```tsx
import { Activity } from 'react';

function App({ showPanel }) {
  return (
    <Activity mode={showPanel ? 'visible' : 'hidden'}>
      <ExpensivePanel />
    </Activity>
  );
}
```

Next.js uses `<Activity>` internally when `cacheComponents` is enabled:
- Previous route set to `mode="hidden"` during navigation
- Component state preserved when navigating back
- Effects clean up when hidden, recreate when visible

---

## React Compiler (Stable)

Built-in support for the React Compiler is stable in v16. Automatically memoizes components, reducing unnecessary re-renders.

### Setup

```ts
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true, // Promoted from experimental to stable
};

export default nextConfig;
```

Install the compiler plugin:
```bash
npm install -D babel-plugin-react-compiler
```

### Key Notes

- **Not enabled by default** -- opt-in via config.
- Compile times increase (uses Babel under the hood).
- Eliminates need for `useMemo`, `useCallback`, `React.memo` in most cases.
- Config option moved from `experimental.reactCompiler` to top-level `reactCompiler`.

---

## Turbopack (Stable Default)

### Overview

Turbopack is now the **default bundler** for all Next.js 16 apps. No flags needed.

Performance:
- 2-5x faster production builds
- Up to 10x faster Fast Refresh
- File system caching: ~5-14x faster restarts (stable in 16.1)

### Usage

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

No `--turbopack` flag needed. To opt out: `next build --webpack`.

### Configuration

```ts
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack config (was experimental.turbopack in v15)
  turbopack: {
    resolveAlias: {
      // Replace Node.js modules for browser
      fs: { browser: './empty.ts' },
      // Sass tilde imports (Turbopack doesn't support ~)
      '~*': '*',
    },
  },
};

export default nextConfig;
```

### Turbopack File System Caching

Stable in 16.1 for `next dev` (on by default). Stores compiler artifacts on disk.

Performance improvements:
- react.dev: ~10x faster (3.7s cold -> 380ms cached)
- nextjs.org: ~5x faster (3.5s cold -> 700ms cached)
- Large apps: ~14x faster (15s cold -> 1.1s cached)

For `next build`, file system caching is coming in a future release.

### Custom Webpack Migration

If your project has custom webpack config:
1. **Build fails by default** when Turbopack encounters webpack config.
2. Options:
   - `next build --turbopack` -- build with Turbopack, ignoring webpack config
   - `next build --webpack` -- opt out of Turbopack
   - Migrate webpack config to Turbopack options

### Sass Imports

Turbopack does NOT support legacy tilde (`~`) prefix for `node_modules` imports:

```scss
// Webpack (old): @import '~bootstrap/dist/css/bootstrap.min.css';
// Turbopack:     @import 'bootstrap/dist/css/bootstrap.min.css';
```

Workaround via resolveAlias:
```ts
turbopack: {
  resolveAlias: { '~*': '*' },
}
```

### Bundle Analyzer (experimental, 16.1+)

```bash
next experimental-analyze
```

Opens interactive UI to inspect production bundles, find large modules, and trace import chains.
Works with Turbopack. Supports filtering by route, client/server views.

### Debugging

```bash
next dev --inspect    # Enables Node.js debugger (16.1+)
```

### Tracing

```bash
# Dev traces now in .next/dev/
npx next internal trace .next/dev/trace-turbopack
```

---

## Next.js DevTools MCP

Model Context Protocol integration for AI-assisted debugging.

### Setup

```json
// .mcp.json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

### Capabilities

- **Next.js knowledge**: routing, caching, rendering behavior
- **Unified logs**: browser and server logs in one place
- **Automatic error access**: detailed stack traces
- **Page awareness**: contextual understanding of active route
- **Route listing**: `get_routes` tool to list all routes (16.1+)

### Browser Log Forwarding (16.2+)

```ts
// next.config.ts
const nextConfig = {
  logging: {
    browserToTerminal: true,
    // 'error' -- errors only (default)
    // 'warn'  -- warnings and errors
    // true    -- all console output
    // false   -- disabled
  },
};
```

### AGENTS.md (16.2+)

`create-next-app` includes `AGENTS.md` by default, pointing AI agents to version-matched docs bundled in `node_modules/next/dist/docs/`.

For existing projects:
```md
<!-- AGENTS.md -->
<!-- BEGIN:nextjs-agent-rules -->
# Next.js: ALWAYS read docs before coding
Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`.
<!-- END:nextjs-agent-rules -->
```

### Dev Server Lock File (16.2+)

`.next/dev/lock` file prevents multiple dev server instances. Contains PID, port, and URL.

---

## Build Adapters API (Alpha -> Stable in 16.2)

Custom adapters that hook into the build process for deployment platforms.

```ts
// next.config.ts (16.2+: top-level adapterPath)
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  adapterPath: require.resolve('./my-adapter.js'),
};

export default nextConfig;
```

Before 16.2:
```ts
experimental: {
  adapterPath: require.resolve('./my-adapter.js'),
}
```

---

## Version History Summary

| Version | Key Changes |
|---------|-------------|
| 16.0.0 | Cache Components, proxy.ts, Turbopack default, React 19.2, React Compiler stable |
| 16.1.0 | FS caching stable for dev, Bundle Analyzer, `--inspect`, `next upgrade` command |
| 16.2.0 | AGENTS.md, browser log forwarding, dev lock file, adapterPath stable |
| 16.2.4 | Current patch (April 2026) |
