# React Router v6 to v7 Migration Guide

> Source: https://reactrouter.com/upgrading/v6

## Step 1: Install the new package

```bash
npm uninstall react-router-dom
npm install react-router
```

## Step 2: Update imports

All imports change from react-router-dom to react-router.
Exception: RouterProvider must come from react-router/dom.

```tsx
// v6
import { createBrowserRouter, RouterProvider, Link, ... } from "react-router-dom";

// v7
import { createBrowserRouter, Link, ... } from "react-router";
import { RouterProvider } from "react-router/dom"; // special path!
```

## Step 3: Remove deprecated APIs

### json() -- Deprecated
```tsx
// v6
import { json } from "react-router-dom";
export async function loader() {
  return json({ user: await getUser() });
}

// v7
export async function loader() {
  return { user: await getUser() }; // plain object
}
```

### defer() -- Deprecated
```tsx
// v6
import { defer } from "react-router-dom";
export async function loader() {
  return defer({ slow: getSlowData() });
}

// v7
export async function loader() {
  return { slow: getSlowData() }; // Promise directly
}
```

## Step 4: Fix formMethod casing

```tsx
// v6 -- lowercase
navigation.formMethod === "post"  // true in v6

// v7 -- UPPERCASE
navigation.formMethod === "POST"  // true in v7
```

## Future Flags (All default in v7)

These flags were optional in v6 but are now the default behavior in v7.
If you adopted them before upgrading, you get zero behavior changes.

| Flag | v6 behavior (off) | v7 default behavior |
|------|------|------|
| v7_startTransition | No transition wrapping | Router state updates in React.startTransition |
| v7_relativeSplatPath | Buggy relative paths in splat routes | Fixed relative path resolution |
| v7_fetcherPersist | Fetchers removed on unmount | Fetchers persist until navigation completes |
| v7_normalizeFormMethod | Lowercase formMethod | UPPERCASE formMethod |
| v7_partialHydration | Full hydration required | Partial hydration supported |
| v7_skipActionErrorRevalidation | Always revalidates after action error | Skip revalidation on action error |

## Enabling Future Flags in v6 (Pre-migration)

```tsx
const router = createBrowserRouter(routes, {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});
```

## Breaking Changes Summary

| Change | Impact |
|--------|--------|
| Package rename | High: all imports must change |
| RouterProvider import path | High: must use react-router/dom |
| json() removed | Medium: refactor all loaders using json() |
| defer() removed | Medium: refactor to plain Promise returns |
| formMethod uppercase | Low: check navigation.formMethod comparisons |
| Splat route relative paths | Low: only affects ../ navigation in * routes |

## TypeScript: Infer loader/action return types

```tsx
// v7 pattern -- use typeof loader for type safety
export async function loader({ params }: LoaderFunctionArgs) {
  return { user: await getUser(params.id) };
}

export function Component() {
  // TypeScript infers { user: User } automatically
  const { user } = useLoaderData<typeof loader>();
}
```