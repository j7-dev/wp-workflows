# TanStack Query -- Migration Notes

## Table of Contents

- [v3 to v4 Breaking Changes](#v3-to-v4-breaking-changes)
- [v4 to v5 Differences](#v4-to-v5-differences)

---

## v3 to v4 Breaking Changes

### Package Rename

```bash
# Remove old
npm uninstall react-query

# Install new
npm install @tanstack/react-query
npm install @tanstack/react-query-devtools  # separate package now
```

```tsx
// Before (v3)
import { useQuery } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'

// After (v4)
import { useQuery } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
```

### Query Keys Must Be Arrays

```tsx
// v3 -- string or array
useQuery('todos', fetchTodos)

// v4 -- array only
useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
```

### Object Syntax Required

```tsx
// v3 -- positional arguments
useQuery(['todos'], fetchTodos, { staleTime: 1000 })

// v4 -- single object
useQuery({ queryKey: ['todos'], queryFn: fetchTodos, staleTime: 1000 })
```

### idle State Removed

v3 had `status: 'idle'` for disabled queries. v4 replaces this:

```tsx
// v3
status: 'idle'       // disabled query, no data

// v4
status: 'loading'    // no data (even if disabled)
fetchStatus: 'idle'  // not currently fetching
```

Use `isInitialLoading` (= `isLoading && isFetching`) to detect actual first load.

### useQueries API Changed

```tsx
// v3
useQueries([
  { queryKey: ['post', 1], queryFn: fetchPost },
  { queryKey: ['post', 2], queryFn: fetchPost },
])

// v4
useQueries({
  queries: [
    { queryKey: ['post', 1], queryFn: fetchPost },
    { queryKey: ['post', 2], queryFn: fetchPost },
  ],
})
```

### undefined Cannot Be Returned from queryFn

Returning `undefined` from a query function throws an error in v4. Use `null` for "no data" scenarios.

### Network Mode Default Changed

Queries pause by default without network connection. To restore v3 behavior:

```tsx
new QueryClient({
  defaultOptions: {
    queries: { networkMode: 'offlineFirst' },
    mutations: { networkMode: 'offlineFirst' },
  },
})
```

### notifyOnChangeProps 'tracked' is Default

- `'tracked'` is now the default behavior (auto-detect which props trigger re-render)
- Use `'all'` to opt out of smart tracking
- `notifyOnChangePropsExclusion` was removed

### cancelRefetch Defaults to true

For `refetchQueries`, `invalidateQueries`, `resetQueries`, `refetch`, `fetchNextPage`, `fetchPreviousPage` -- `cancelRefetch` now defaults to `true` (cancels in-flight requests before refetching).

### Query Filter Changes

```tsx
// v3
invalidateQueries({ active: true, inactive: false })
invalidateQueries({ refetchActive: true, refetchInactive: false })

// v4
invalidateQueries({ type: 'active' })
invalidateQueries({ refetchType: 'active' })
```

### onSuccess No Longer Called from setQueryData

`onSuccess` callback only fires for actual network requests, not when using `setQueryData`. Use `useEffect` for data change reactions:

```tsx
const { data } = useQuery({ queryKey, queryFn })
React.useEffect(() => {
  if (data) mySideEffect(data)
}, [data])
```

### Logger Configuration Changed

```tsx
// v3
import { setLogger } from 'react-query'
setLogger(customLogger)

// v4
const queryClient = new QueryClient({ logger: customLogger })
```

### Hydration Imports Changed

```tsx
// v3
import { dehydrate, Hydrate } from 'react-query/hydration'

// v4
import { dehydrate, Hydrate } from '@tanstack/react-query'
```

### Persistence Plugin Renamed

```tsx
// v3
import { persistQueryClient } from 'react-query/persistQueryClient-experimental'
import { createWebStoragePersistor } from 'react-query/createWebStoragePersistor-experimental'

// v4
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
```

### Other v3 to v4 Changes

- TypeScript v4.1+ required
- Promise `cancel()` method removed (use `AbortController` instead)
- `cacheTime` on server defaults to `Infinity`
- Production errors no longer logged to console
- QueryCache event names: `queryAdded` -> `added`, `queryRemoved` -> `removed`, `queryUpdated` -> `updated`
- Removed methods: `queryClient.cancelMutations()`, `queryClient.executeMutation()`
- Browser target: modern browsers only (no IE11)
- ESM `exports` field in package.json restricts import paths

---

## v4 to v5 Differences

These are the key API differences between v4 (current) and v5. When working with v4 code, do NOT use v5 patterns.

### Renamed Options

| v4 | v5 | Notes |
|----|----|----|
| `cacheTime` | `gcTime` | "garbage collection time" |
| `useErrorBoundary` | `throwOnError` | Clearer naming |
| `keepPreviousData: true` | `placeholderData: keepPreviousData` | `keepPreviousData` is now a function imported from the library |
| `loading` (status) | `pending` (status) | Status value rename |
| `isLoading` | `isPending` | `isLoading` in v5 means `isPending && isFetching` |
| `isInitialLoading` | `isLoading` | Redefined meaning |

### Removed in v5

| v4 Feature | v5 Replacement |
|------------|---------------|
| `onSuccess` callback on `useQuery` | `useEffect` on `data`, or global `QueryCache.onSuccess` |
| `onError` callback on `useQuery` | `useEffect` on `error`, or global `QueryCache.onError` |
| `onSettled` callback on `useQuery` | `useEffect`, or global `QueryCache.onSettled` |
| `logger` option on `QueryClient` | Removed entirely |
| `isDataEqual` option | `structuralSharing` function |
| `contextSharing` on `QueryClientProvider` | Removed |

### New in v5 (NOT Available in v4)

- `throwOnError` option (v4 uses `useErrorBoundary`)
- `maxPages` option for `useInfiniteQuery` to limit stored pages
- TypeScript strict mode improvements
- First-class `skipToken` for conditional queries
- Optimistic updates via returned value from `mutationFn`
- Streamlined types (fewer generics needed)

### Key Behavioral Differences

1. **Status naming**: v4 `'loading'` = v5 `'pending'`
2. **isLoading meaning**: v4 `isLoading` = no data; v5 `isLoading` = no data AND currently fetching
3. **Callbacks**: v4 has `onSuccess`/`onError`/`onSettled` on useQuery; v5 removed them
4. **keepPreviousData**: v4 is a boolean option; v5 uses `placeholderData` with a helper function
5. **Default behavior**: v5 `staleTime` still defaults to `0`, but the overall behavior around Suspense and streaming is more mature

### Migration Checklist (When Moving v4 to v5)

- [ ] Rename `cacheTime` to `gcTime` everywhere
- [ ] Replace `useErrorBoundary` with `throwOnError`
- [ ] Replace `keepPreviousData: true` with `placeholderData: keepPreviousData` (import `keepPreviousData` from `@tanstack/react-query`)
- [ ] Remove `onSuccess`/`onError`/`onSettled` from all `useQuery` calls; move logic to `useEffect` or global cache callbacks
- [ ] Replace `isInitialLoading` with `isLoading` (new meaning in v5)
- [ ] Replace `status === 'loading'` checks with `status === 'pending'`
- [ ] Remove custom `logger` from `QueryClient`
- [ ] Review `isLoading` usage -- in v5 it means `isPending && isFetching`, not just `isPending`
