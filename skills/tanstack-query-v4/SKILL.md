---
name: tanstack-query-v4
description: >
  TanStack Query (React Query) v4 complete technical reference. Covers useQuery, useMutation,
  useInfiniteQuery, useQueries, QueryClient, QueryClientProvider, QueryCache, MutationCache,
  Hydration/SSR, and all configuration options with types and defaults.
  When the user's code imports from @tanstack/react-query or react-query, or involves
  query keys, query functions, cache invalidation, mutations, optimistic updates,
  infinite scroll, paginated queries, prefetching, staleTime, cacheTime,
  refetchOnWindowFocus, keepPreviousData, enabled, dependent queries, parallel queries,
  or any server-state management pattern in React -- use this skill instead of searching the web.
  This skill covers v4 specifically (package @tanstack/react-query ^4.x).
  v4 differs from v5 in significant ways (cacheTime vs gcTime, onSuccess/onError/onSettled
  callbacks on useQuery, keepPreviousData vs placeholderData, etc.).
  Do NOT apply v5 API patterns when working with v4 code.
user-invocable: false
---

# TanStack Query v4 (React Query)

> **Version**: 4.x | **Package**: `@tanstack/react-query` | **Docs**: https://tanstack.com/query/v4/docs/framework/react/overview

TanStack Query manages server state -- data that lives on a remote server, is asynchronous, and can become stale. It handles fetching, caching, synchronizing, and updating server state with zero boilerplate. It replaces manual `useEffect` + `useState` fetch patterns and most Redux/MobX server-state usage.

## Setup

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,           // default: data is immediately stale
      cacheTime: 5 * 60 * 1000, // default: 5 minutes
      retry: 3,               // default: 3 retries with exponential backoff
      refetchOnWindowFocus: true, // default
      refetchOnMount: true,      // default
      refetchOnReconnect: true,  // default
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  )
}
```

## Core API Quick Reference

### useQuery -- Data Fetching

```tsx
const {
  data,              // TData | undefined
  error,             // TError | null
  status,            // 'loading' | 'error' | 'success'
  fetchStatus,       // 'fetching' | 'paused' | 'idle'
  isLoading,         // status === 'loading' (no cached data yet)
  isFetching,        // any fetch in-flight (including background)
  isSuccess,
  isError,
  isInitialLoading,  // isLoading && isFetching (true first load)
  isPreviousData,    // true when keepPreviousData shows old data
  dataUpdatedAt,     // timestamp of last successful fetch
  refetch,           // () => Promise -- manual refetch
  remove,            // () => void -- remove from cache
} = useQuery({
  queryKey: ['todos', { status: 'done' }],  // required, must be array
  queryFn: ({ queryKey, signal }) => fetch(...), // required (unless default set)
  enabled: true,              // false = disable auto-fetch
  staleTime: 0,               // ms before data is considered stale
  cacheTime: 5 * 60 * 1000,   // ms to keep unused cache (garbage collected after)
  refetchOnWindowFocus: true,
  refetchOnMount: true,
  refetchOnReconnect: true,
  refetchInterval: false,      // ms | false -- polling interval
  retry: 3,                    // boolean | number | (failureCount, error) => boolean
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  select: (data) => data.items,  // transform data (cache unaffected)
  keepPreviousData: false,       // v4 only: show prev data while new key loads
  initialData: undefined,        // seed cache (persisted, counts as "success")
  placeholderData: undefined,    // temporary display data (NOT persisted)
  onSuccess: (data) => {},       // v4: called on success (deprecated in v5)
  onError: (error) => {},        // v4: called on error (deprecated in v5)
  onSettled: (data, error) => {},// v4: called on settle (deprecated in v5)
  suspense: false,               // enable React Suspense mode
  useErrorBoundary: false,       // throw errors to error boundary
  networkMode: 'online',         // 'online' | 'always' | 'offlineFirst'
  structuralSharing: true,       // preserve referential identity when possible
  meta: {},                      // custom metadata attached to query
})
```

### useMutation -- Data Modification

```tsx
const {
  mutate,          // (variables, { onSuccess?, onError?, onSettled? }) => void
  mutateAsync,     // (variables, opts?) => Promise<TData>
  data,            // TData | undefined
  error,           // TError | null
  status,          // 'idle' | 'loading' | 'error' | 'success'
  isIdle, isLoading, isSuccess, isError,
  reset,           // () => void -- clear state back to idle
  failureCount,
  failureReason,
} = useMutation({
  mutationFn: (variables) => axios.post('/todos', variables), // required
  mutationKey: ['addTodo'],  // optional, for setMutationDefaults
  onMutate: (variables) => { /* return context for rollback */ },
  onSuccess: (data, variables, context) => {},
  onError: (error, variables, context) => {},
  onSettled: (data, error, variables, context) => {},
  retry: false,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  cacheTime: 5 * 60 * 1000,
  networkMode: 'online',
  useErrorBoundary: false,
  meta: {},
})
```

### useInfiniteQuery -- Infinite Scroll / Load More

```tsx
const {
  data,                // { pages: TData[], pageParams: unknown[] }
  fetchNextPage,       // () => Promise
  fetchPreviousPage,   // () => Promise
  hasNextPage,         // boolean
  hasPreviousPage,     // boolean
  isFetchingNextPage,  // boolean
  isFetchingPreviousPage, // boolean
  // ...plus all useQuery return values
} = useInfiniteQuery({
  queryKey: ['projects'],
  queryFn: ({ pageParam = 0 }) => fetchProjects(pageParam),
  getNextPageParam: (lastPage, allPages) => lastPage.nextCursor ?? undefined,
  getPreviousPageParam: (firstPage, allPages) => firstPage.prevCursor ?? undefined,
  // ...plus all useQuery options
})
```

### QueryClient -- Key Methods

```tsx
const queryClient = useQueryClient()

// Read cache
queryClient.getQueryData(['todos'])              // TData | undefined
queryClient.getQueriesData({ queryKey: ['todos'] }) // [queryKey, data][]

// Write cache (synchronous, immutable updates only)
queryClient.setQueryData(['todos'], (old) => [...old, newTodo])
queryClient.setQueryData(['todo', { id: 5 }], updatedTodo)

// Invalidate & refetch
await queryClient.invalidateQueries({ queryKey: ['todos'] })
await queryClient.invalidateQueries({ queryKey: ['todos'], exact: true })
await queryClient.invalidateQueries({ refetchType: 'none' }) // mark stale only

// Prefetch
await queryClient.prefetchQuery({ queryKey: ['todos'], queryFn: fetchTodos })

// Fetch (returns data, throws on error)
const data = await queryClient.fetchQuery({ queryKey, queryFn })

// Cancel
await queryClient.cancelQueries({ queryKey: ['todos'] })

// Remove from cache
queryClient.removeQueries({ queryKey: ['todos'] })
```

## Critical Concepts

### staleTime vs cacheTime

| Property | Default | Purpose |
|----------|---------|---------|
| `staleTime` | `0` | How long data is considered "fresh". While fresh, no background refetch triggers. |
| `cacheTime` | `300000` (5 min) | How long **unused** (no active observers) cache entries are kept before garbage collection. |

- `staleTime: 0` = data is immediately stale, refetch on every mount/focus/reconnect
- `staleTime: Infinity` = data never becomes stale (manual invalidation only)
- `cacheTime: Infinity` = cache entries never garbage collected
- `cacheTime` on server defaults to `Infinity`

### Query Status vs Fetch Status

```
status:      'loading'  |  'error'  |  'success'
             (no data)     (error)     (has data)

fetchStatus: 'fetching' | 'paused'  | 'idle'
             (running)    (offline)   (not running)
```

- `isLoading` = `status === 'loading'` -- no cached data
- `isFetching` = `fetchStatus === 'fetching'` -- request in flight
- `isInitialLoading` = `isLoading && isFetching` -- first load

### Query Keys

- Must be arrays: `['todos']`, `['todo', 5]`, `['todos', { status: 'done' }]`
- Deterministically hashed: `{ a: 1, b: 2 }` === `{ b: 2, a: 1 }` (object key order irrelevant)
- Array order matters: `['todos', 1]` !== `[1, 'todos']`
- Include all variables the queryFn depends on in the key
- Prefix matching: invalidating `['todos']` also hits `['todos', 1]`

## Common Patterns

### Invalidation After Mutation

```tsx
const queryClient = useQueryClient()

const mutation = useMutation({
  mutationFn: addTodo,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

### Optimistic Update

```tsx
const queryClient = useQueryClient()

useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] })
    const previous = queryClient.getQueryData(['todos'])
    queryClient.setQueryData(['todos'], (old) =>
      old.map(t => t.id === newTodo.id ? { ...t, ...newTodo } : t)
    )
    return { previous }
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos'], context.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

### Dependent Queries

```tsx
const { data: user } = useQuery({ queryKey: ['user', email], queryFn: getUser })
const { data: projects } = useQuery({
  queryKey: ['projects', user?.id],
  queryFn: () => getProjects(user.id),
  enabled: !!user?.id,  // won't run until user is loaded
})
```

### Paginated Queries (keepPreviousData)

```tsx
const [page, setPage] = useState(0)
const { data, isPreviousData } = useQuery({
  queryKey: ['projects', page],
  queryFn: () => fetchProjects(page),
  keepPreviousData: true,  // show prev page while loading next
})
```

### Update Cache from Mutation Response

```tsx
useMutation({
  mutationFn: editTodo,
  onSuccess: (data, variables) => {
    queryClient.setQueryData(['todo', { id: variables.id }], data)
  },
})
```

## Important Defaults (v4)

1. `staleTime: 0` -- data immediately stale
2. `cacheTime: 300000` -- 5 min garbage collection for inactive queries
3. `retry: 3` -- exponential backoff (1s, 2s, 4s... max 30s)
4. `refetchOnWindowFocus: true`
5. `refetchOnMount: true`
6. `refetchOnReconnect: true`
7. `structuralSharing: true` -- preserves referential identity
8. `networkMode: 'online'` -- pauses without network
9. Queries returning `undefined` throw an error (use `null` for "no data")

## v4-Specific Features (NOT in v5)

- `cacheTime` (renamed to `gcTime` in v5)
- `keepPreviousData` option (replaced by `placeholderData` function in v5)
- `onSuccess`, `onError`, `onSettled` callbacks on `useQuery` (removed in v5)
- `isInitialLoading` (renamed to `isPending` in v5)
- `useErrorBoundary` (renamed to `throwOnError` in v5)
- `status: 'loading'` (renamed to `'pending'` in v5)
- `isLoading` means "no data" in v4 (in v5 `isLoading` = `isPending && isFetching`)
- Custom logger via `QueryClient({ logger })` (removed in v5)

## Warnings & Pitfalls

1. **Never mutate cache data directly** -- always use immutable updates with `setQueryData`
2. **queryKey must be an array** -- `useQuery('todos', ...)` is v3 syntax, use `useQuery({ queryKey: ['todos'], ... })`
3. **v4 uses object syntax** -- `useQuery(['key'], fn, opts)` is v3; v4 is `useQuery({ queryKey, queryFn, ...opts })`
4. **`enabled: false` prevents invalidateQueries** from triggering refetch
5. **Window focus triggers refetch** during development (switching to DevTools and back)
6. **`onSuccess` on useQuery is deprecated** and will be removed in v5; use `useEffect` on `data` instead
7. **Suspense mode is experimental** in v4

## References

When you need deeper detail beyond this quick reference, read the appropriate file:

| Need | File |
|------|------|
| Full API signatures, all options and return values | `references/api-reference.md` |
| Complete runnable code examples | `references/examples.md` |
| Best practices, caching strategy, testing | `references/best-practices.md` |
| v3 to v4 migration, v4 to v5 differences | `references/migration-notes.md` |
