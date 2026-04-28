# TanStack Query v4 -- Complete API Reference

> Source: https://tanstack.com/query/v4/docs/framework/react/overview

## Table of Contents

- [useQuery](#usequery)
- [useMutation](#usemutation)
- [useInfiniteQuery](#useinfinitequery)
- [useQueries](#usequeries)
- [useIsFetching](#useisfetching)
- [useIsMutating](#useismutating)
- [useQueryClient](#usequeryclient)
- [QueryClient](#queryclient)
- [QueryClientProvider](#queryclientprovider)
- [QueryCache](#querycache)
- [MutationCache](#mutationcache)
- [Hydration (dehydrate / Hydrate)](#hydration)
- [QueryErrorResetBoundary](#queryerrorresetboundary)
- [focusManager](#focusmanager)
- [onlineManager](#onlinemanager)
- [Query Filters](#query-filters)
- [Mutation Filters](#mutation-filters)

---

## useQuery

```tsx
import { useQuery } from '@tanstack/react-query'

const result = useQuery({
  queryKey,
  queryFn,
  ...options,
})
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `queryKey` | `QueryKey` (readonly unknown[]) | **required** | Unique key for this query. Deterministically hashed. Auto-refetches when key changes (if enabled). |
| `queryFn` | `(context: QueryFunctionContext) => Promise<TData>` | **required** (unless default set) | Function that returns a promise. Receives `{ queryKey, signal, meta, pageParam }`. Must resolve data or throw. |
| `enabled` | `boolean` | `true` | `false` disables auto-fetch. `invalidateQueries` and `refetchQueries` are also ignored. Manual `refetch()` still works. |
| `staleTime` | `number \| Infinity` | `0` | Milliseconds before data is considered stale. `Infinity` = never stale. |
| `cacheTime` | `number \| Infinity` | `300000` (5 min) | Milliseconds unused cache is kept before garbage collection. `Infinity` on server. |
| `refetchOnWindowFocus` | `boolean \| 'always'` | `true` | Refetch stale queries on window focus. `'always'` refetches regardless of staleness. |
| `refetchOnMount` | `boolean \| 'always'` | `true` | Refetch stale queries on mount. `'always'` refetches regardless. |
| `refetchOnReconnect` | `boolean \| 'always'` | `true` | Refetch stale queries on network reconnect. |
| `refetchInterval` | `number \| false \| ((data, query) => number \| false)` | `false` | Polling interval in ms. Function form receives latest data and query. |
| `refetchIntervalInBackground` | `boolean` | `false` | Continue polling when window is not focused. |
| `retry` | `boolean \| number \| (failureCount: number, error: TError) => boolean` | `3` | `false` = no retry. `true` = infinite. Number = max attempts. Function for custom logic. |
| `retryDelay` | `number \| (retryAttempt: number, error: TError) => number` | `(attempt) => Math.min(1000 * 2 ** attempt, 30000)` | Delay between retries. Default: exponential backoff, max 30s. |
| `retryOnMount` | `boolean` | `true` | If query errored, retry on mount. |
| `select` | `(data: TData) => TTransformed` | - | Transform or select a subset of data. Does not affect cache. |
| `keepPreviousData` | `boolean` | `false` | When queryKey changes, keep previous data visible until new data arrives. Sets `isPreviousData: true`. **v4 only** (removed in v5). |
| `initialData` | `TData \| () => TData` | - | Seed cache with initial data. Persisted to cache. Counts as successful fetch. |
| `initialDataUpdatedAt` | `number \| (() => number)` | - | Timestamp when initialData was last updated. Used to determine staleness. |
| `placeholderData` | `TData \| (previousData: TData) => TData` | - | Temporary display data while loading. NOT persisted to cache. |
| `structuralSharing` | `boolean \| (oldData, newData) => TData` | `true` | Preserves referential identity for unchanged parts. JSON-compatible values only. |
| `onSuccess` | `(data: TData) => void` | - | Called on successful fetch. **Deprecated in v4, removed in v5**. Use `useEffect` on `data`. |
| `onError` | `(error: TError) => void` | - | Called on error. **Deprecated in v4, removed in v5**. |
| `onSettled` | `(data?: TData, error?: TError) => void` | - | Called on success or error. **Deprecated in v4, removed in v5**. |
| `suspense` | `boolean` | `false` | Enable React Suspense mode. **Experimental in v4**. |
| `useErrorBoundary` | `boolean \| (error, query) => boolean` | `false` | Throw errors to nearest error boundary. Named `throwOnError` in v5. |
| `networkMode` | `'online' \| 'always' \| 'offlineFirst'` | `'online'` | Controls behavior without network. `'always'` ignores connectivity. `'offlineFirst'` tries once then pauses. |
| `notifyOnChangeProps` | `string[] \| 'all'` | tracked (auto) | Which properties trigger re-render. Default in v4 is auto-tracked. `'all'` opts out. |
| `queryKeyHashFn` | `(queryKey: QueryKey) => string` | - | Custom hash function for query key. |
| `meta` | `Record<string, unknown>` | - | Custom metadata stored on the query cache entry. Available in `queryFn` context. |
| `context` | `React.Context<QueryClient \| undefined>` | - | Custom React context for QueryClient. |

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `data` | `TData \| undefined` | Last successfully resolved data. |
| `error` | `TError \| null` | Error object if query errored. |
| `status` | `'loading' \| 'error' \| 'success'` | `loading` = no data yet, `error` = errored, `success` = has data. |
| `fetchStatus` | `'fetching' \| 'paused' \| 'idle'` | `fetching` = request in-flight, `paused` = wants to fetch but offline, `idle` = not running. |
| `isLoading` | `boolean` | `status === 'loading'` -- no cached data exists. |
| `isSuccess` | `boolean` | `status === 'success'`. |
| `isError` | `boolean` | `status === 'error'`. |
| `isFetching` | `boolean` | `fetchStatus === 'fetching'` -- any request in-flight (including background). |
| `isPaused` | `boolean` | `fetchStatus === 'paused'`. |
| `isInitialLoading` | `boolean` | `isLoading && isFetching` -- true only during first actual load. |
| `isRefetching` | `boolean` | `isFetching && !isLoading` -- background refetch. |
| `isStale` | `boolean` | Data has exceeded staleTime. |
| `isFetched` | `boolean` | Query has been fetched at least once. |
| `isFetchedAfterMount` | `boolean` | Query was fetched after component mount. |
| `isPreviousData` | `boolean` | `true` when `keepPreviousData` is showing old data during key change. |
| `isPlaceholderData` | `boolean` | `true` when displaying placeholderData. |
| `dataUpdatedAt` | `number` | Timestamp (ms) of last successful data update. `0` if never. |
| `errorUpdatedAt` | `number` | Timestamp (ms) of last error. `0` if never. |
| `failureCount` | `number` | Number of consecutive failures. Resets to 0 on success. |
| `failureReason` | `TError \| null` | Error from the last retry attempt. |
| `refetch` | `(options?: { throwOnError?: boolean, cancelRefetch?: boolean }) => Promise<UseQueryResult>` | Manual refetch function. `throwOnError: true` throws instead of returning error state. |
| `remove` | `() => void` | Remove query from cache entirely. |

---

## useMutation

```tsx
import { useMutation } from '@tanstack/react-query'

const mutation = useMutation({
  mutationFn,
  ...options,
})
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mutationFn` | `(variables: TVariables) => Promise<TData>` | **required** | Async function performing the mutation. |
| `mutationKey` | `unknown[]` | - | Optional key for inheriting defaults via `setMutationDefaults`. |
| `cacheTime` | `number \| Infinity` | `300000` (5 min) | Time unused mutation cache is kept. |
| `onMutate` | `(variables: TVariables) => Promise<TContext> \| TContext` | - | Fires before mutation. Return value becomes `context` for `onError`/`onSettled`. Used for optimistic updates. |
| `onSuccess` | `(data: TData, variables: TVariables, context: TContext) => Promise<void> \| void` | - | Fires on success. If returns promise, awaited before next callback. |
| `onError` | `(error: TError, variables: TVariables, context: TContext) => Promise<void> \| void` | - | Fires on error. Receives context from `onMutate` for rollback. |
| `onSettled` | `(data: TData \| undefined, error: TError \| null, variables: TVariables, context: TContext) => Promise<void> \| void` | - | Fires after success or error. |
| `retry` | `boolean \| number \| (failureCount, error) => boolean` | `false` | Retry failed mutations. Default is `false` (no retry). |
| `retryDelay` | `number \| (retryAttempt, error) => number` | exponential backoff | Delay between retries. |
| `networkMode` | `'online' \| 'always' \| 'offlineFirst'` | `'online'` | Controls offline behavior. |
| `useErrorBoundary` | `boolean \| (error) => boolean` | `false` | Throw errors to error boundary. |
| `meta` | `Record<string, unknown>` | - | Custom metadata. |
| `context` | `React.Context<QueryClient \| undefined>` | - | Custom React context. |

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `mutate` | `(variables: TVariables, options?: { onSuccess?, onError?, onSettled? }) => void` | Trigger mutation. Does not return a promise. Callbacks in options fire after useMutation callbacks. |
| `mutateAsync` | `(variables: TVariables, options?) => Promise<TData>` | Trigger mutation and return promise. Use for sequential mutations or try/catch. |
| `data` | `TData \| undefined` | Last successful mutation result. |
| `error` | `TError \| null` | Error if mutation failed. |
| `status` | `'idle' \| 'loading' \| 'error' \| 'success'` | Current mutation state. |
| `isIdle` | `boolean` | `status === 'idle'`. |
| `isLoading` | `boolean` | `status === 'loading'`. |
| `isSuccess` | `boolean` | `status === 'success'`. |
| `isError` | `boolean` | `status === 'error'`. |
| `isPaused` | `boolean` | Mutation paused due to offline. |
| `failureCount` | `number` | Number of retry failures. |
| `failureReason` | `TError \| null` | Error from last retry. |
| `reset` | `() => void` | Reset mutation state back to `idle`. |

### Callback Execution Order

When using callbacks on both `useMutation` and `mutate()`:

1. `useMutation.onMutate`
2. `mutationFn` executes
3. `useMutation.onSuccess` / `useMutation.onError`
4. `useMutation.onSettled`
5. `mutate.onSuccess` / `mutate.onError`
6. `mutate.onSettled`

With consecutive mutations, `mutate()` callbacks fire only for the **last** mutation (if component still mounted). `useMutation` callbacks fire for **every** mutation.

---

## useInfiniteQuery

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'

const result = useInfiniteQuery({
  queryKey,
  queryFn: ({ pageParam = defaultPageParam }) => fetchPage(pageParam),
  getNextPageParam: (lastPage, allPages) => lastPage.nextCursor,
  ...options,
})
```

### Additional Options (beyond useQuery)

| Option | Type | Description |
|--------|------|-------------|
| `getNextPageParam` | `(lastPage: TData, allPages: TData[]) => TPageParam \| undefined` | **Required for forward pagination**. Return next page param or `undefined`/`null` if no more pages. Result used as `pageParam` in next `queryFn` call. Also determines `hasNextPage`. |
| `getPreviousPageParam` | `(firstPage: TData, allPages: TData[]) => TPageParam \| undefined` | For bi-directional pagination. Determines `hasPreviousPage`. |

### Additional Return Values (beyond useQuery)

| Property | Type | Description |
|----------|------|-------------|
| `data.pages` | `TData[]` | Array of all fetched pages. |
| `data.pageParams` | `unknown[]` | Array of page params used for each page. |
| `fetchNextPage` | `(options?: { pageParam?: TPageParam, cancelRefetch?: boolean }) => Promise` | Fetch next page. Do NOT pass `pageParam` unless overriding calculated value. |
| `fetchPreviousPage` | `(options?) => Promise` | Fetch previous page. |
| `hasNextPage` | `boolean` | `true` if `getNextPageParam` returns non-undefined. |
| `hasPreviousPage` | `boolean` | `true` if `getPreviousPageParam` returns non-undefined. |
| `isFetchingNextPage` | `boolean` | `true` while fetching next page via `fetchNextPage`. |
| `isFetchingPreviousPage` | `boolean` | `true` while fetching previous page. |

### Refetch Behavior

When an infinite query becomes stale and refetches, pages are fetched **sequentially** starting from the first page. This ensures fresh cursors. Use `refetchPage` in filters to control which pages refetch.

### Data Structure

```tsx
// data shape
{
  pages: [page1Data, page2Data, page3Data],
  pageParams: [undefined, cursor1, cursor2],
}
```

---

## useQueries

Execute a variable number of queries in parallel.

```tsx
import { useQueries } from '@tanstack/react-query'

const results = useQueries({
  queries: [
    { queryKey: ['post', 1], queryFn: fetchPost },
    { queryKey: ['post', 2], queryFn: fetchPost },
  ],
})
// results: UseQueryResult[]
```

### Options

- `queries`: Array of `useQuery` option objects (same options as useQuery)
- `context`: Optional custom React context

### Return Value

Array of `UseQueryResult` objects in the same order as input. Each result has the same shape as `useQuery` return value.

### Caveats

- Duplicate query keys in the array may cause shared data between queries
- Preferred over multiple `useQuery` calls when query count is dynamic (avoids React hooks rules violation)
- Required when using Suspense mode with parallel queries

---

## useIsFetching

```tsx
import { useIsFetching } from '@tanstack/react-query'

const isFetching = useIsFetching()                          // all queries
const isFetchingPosts = useIsFetching({ queryKey: ['posts'] }) // filtered
```

Returns `number` -- count of queries currently fetching. Useful for global loading indicators.

---

## useIsMutating

```tsx
import { useIsMutating } from '@tanstack/react-query'

const isMutating = useIsMutating()
const isMutatingPosts = useIsMutating({ mutationKey: ['posts'] })
```

Returns `number` -- count of mutations currently in-flight.

---

## useQueryClient

```tsx
import { useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient({ context })
```

Returns the `QueryClient` instance provided by the nearest `QueryClientProvider`. Optionally accepts a custom context.

---

## QueryClient

```tsx
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient({
  queryCache?: QueryCache,
  mutationCache?: MutationCache,
  logger?: { log, warn, error },
  defaultOptions?: {
    queries?: { /* useQuery defaults */ },
    mutations?: { /* useMutation defaults */ },
  },
})
```

### Methods

#### queryClient.fetchQuery(options)

Async. Fetches and caches a query. Returns data or throws error. Uses cache if not invalidated and within `staleTime`. Options same as `useQuery` minus UI-specific options (enabled, refetchInterval, onSuccess, etc.).

```tsx
const data = await queryClient.fetchQuery({ queryKey: ['todos'], queryFn: fetchTodos })
```

Returns: `Promise<TData>`

#### queryClient.prefetchQuery(options)

Same as `fetchQuery` but does not return data or throw errors. Fire-and-forget prefetching.

```tsx
await queryClient.prefetchQuery({ queryKey: ['todos'], queryFn: fetchTodos })
```

Returns: `Promise<void>`

#### queryClient.getQueryData(queryKey)

Synchronous. Returns cached data or `undefined`.

```tsx
const data = queryClient.getQueryData(['todos']) // TData | undefined
```

#### queryClient.ensureQueryData(options)

Async. Returns cached data if exists, otherwise fetches.

```tsx
const data = await queryClient.ensureQueryData({ queryKey: ['todos'], queryFn: fetchTodos })
```

Returns: `Promise<TData>`

#### queryClient.getQueriesData(filters)

Synchronous. Returns array of `[queryKey, data]` tuples for matching queries.

```tsx
const data = queryClient.getQueriesData({ queryKey: ['todos'] })
// [[['todos', 'list'], todosData], [['todos', 1], todoData]]
```

#### queryClient.setQueryData(queryKey, updater)

Synchronous. Immediately updates cached data. **Must use immutable updates.**

```tsx
// Direct value
queryClient.setQueryData(['todos'], newTodos)

// Updater function
queryClient.setQueryData(['todos'], (old) => [...old, newTodo])

// Return undefined to skip update
queryClient.setQueryData(['todos'], (old) => old ? [...old, newTodo] : old)
```

If the query doesn't exist, a new cache entry is created. It will be garbage collected after `cacheTime` if no observers subscribe.

#### queryClient.setQueriesData(filters, updater)

Synchronous. Updates multiple queries matching filters. Does NOT create new entries.

```tsx
queryClient.setQueriesData({ queryKey: ['todos'] }, (old) => [...old, newTodo])
```

#### queryClient.getQueryState(queryKey)

Synchronous. Returns full query state including `dataUpdatedAt`, `error`, `status`, etc.

```tsx
const state = queryClient.getQueryState(['todos'])
// state.dataUpdatedAt, state.status, state.error, etc.
```

#### queryClient.invalidateQueries(filters?, options?)

Marks queries as stale and optionally refetches active ones.

```tsx
// Invalidate all queries starting with 'todos'
await queryClient.invalidateQueries({ queryKey: ['todos'] })

// Exact match only
await queryClient.invalidateQueries({ queryKey: ['todos'], exact: true })

// Mark stale but don't refetch
await queryClient.invalidateQueries({ queryKey: ['todos'], refetchType: 'none' })

// Also refetch inactive queries
await queryClient.invalidateQueries({ queryKey: ['todos'], refetchType: 'all' })
```

Filter options:
- `refetchType: 'active' | 'inactive' | 'all' | 'none'` (default: `'active'`)
- `cancelRefetch: boolean` (default: `true` -- cancels in-flight requests)
- `throwOnError: boolean`

#### queryClient.refetchQueries(filters?, options?)

Refetch queries matching filters.

```tsx
await queryClient.refetchQueries()                            // all
await queryClient.refetchQueries({ stale: true })             // stale only
await queryClient.refetchQueries({ queryKey: ['posts'], type: 'active' })
```

#### queryClient.cancelQueries(filters?)

Cancel outgoing queries. Essential for optimistic updates.

```tsx
await queryClient.cancelQueries({ queryKey: ['todos'] })
```

#### queryClient.removeQueries(filters?)

Remove queries from cache entirely.

```tsx
queryClient.removeQueries({ queryKey: ['todos'], exact: true })
```

#### queryClient.resetQueries(filters?, options?)

Reset queries to initial state. If query has `initialData`, resets to that. Active queries refetch.

```tsx
queryClient.resetQueries({ queryKey: ['todos'] })
```

#### queryClient.isFetching(filters?)

Returns `number` -- count of currently fetching queries.

#### queryClient.isMutating(filters?)

Returns `number` -- count of currently executing mutations.

#### queryClient.setDefaultOptions(options)

Dynamically update default query/mutation options.

#### queryClient.setQueryDefaults(queryKey, options)

Set defaults for queries matching a specific key.

```tsx
queryClient.setQueryDefaults(['posts'], { queryFn: fetchPosts })
```

Registration order matters: register from least generic to most generic.

#### queryClient.setMutationDefaults(mutationKey, options)

Set defaults for mutations matching a specific key.

```tsx
queryClient.setMutationDefaults(['addPost'], { mutationFn: addPost })
```

#### queryClient.getQueryCache() / getMutationCache()

Returns the underlying cache instances.

#### queryClient.clear()

Clears all caches.

#### queryClient.resumePausedMutations()

Resume mutations paused due to offline.

---

## QueryClientProvider

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `client` | `QueryClient` | **Required**. The QueryClient instance. |
| `context` | `React.Context` | Optional custom context for isolated query scopes. |
| `contextSharing` | `boolean` | **Deprecated**. Shares context across window for microfrontends. Default: `false`. |

---

## QueryCache

```tsx
import { QueryCache } from '@tanstack/react-query'

const queryCache = new QueryCache({
  onError: (error, query) => {},    // global error handler
  onSuccess: (data, query) => {},   // global success handler
  onSettled: (data, error, query) => {}, // global settled handler
})
```

Global callbacks always fire (unlike defaultOptions which can be overridden). Fire once per Query, not per Observer.

### Methods

- `queryCache.find(queryKey, filters?)` -- find single query
- `queryCache.findAll(queryKey?, filters?)` -- find multiple queries
- `queryCache.subscribe(callback)` -- subscribe to cache changes, returns unsubscribe fn
- `queryCache.clear()` -- empty cache

---

## MutationCache

```tsx
import { MutationCache } from '@tanstack/react-query'

const mutationCache = new MutationCache({
  onError: (error, variables, context, mutation) => {},
  onSuccess: (data, variables, context, mutation) => {},
  onSettled: (data, error, variables, context, mutation) => {},
  onMutate: (variables, mutation) => {},
})
```

Global callbacks always fire. Useful for centralized error reporting.

### Methods

- `mutationCache.getAll()` -- get all mutations
- `mutationCache.subscribe(callback)` -- subscribe, returns unsubscribe
- `mutationCache.clear()` -- clear all mutations

---

## Hydration

### dehydrate(queryClient, options?)

Creates serializable representation of cache state for SSR.

```tsx
import { dehydrate } from '@tanstack/react-query'

const dehydratedState = dehydrate(queryClient)
```

Options:
- `shouldDehydrateQuery?: (query) => boolean` -- default: only successful queries
- `shouldDehydrateMutation?: (mutation) => boolean`

Errored queries are automatically excluded. You must handle serialization for non-JSON values (like Error objects).

### hydrate(queryClient, dehydratedState, options?)

Hydrates dehydrated state into a query client.

```tsx
import { hydrate } from '@tanstack/react-query'

hydrate(queryClient, dehydratedState)
```

Existing queries are NOT overwritten -- they are silently discarded.

### Hydrate Component

```tsx
import { Hydrate } from '@tanstack/react-query'

<Hydrate state={dehydratedState}>
  <App />
</Hydrate>
```

### useHydrate(state, options?)

Hook form of hydrate. Merges based on `dataUpdatedAt`.

---

## QueryErrorResetBoundary

Wraps error boundaries to reset query errors within scope.

```tsx
import { QueryErrorResetBoundary } from '@tanstack/react-query'

<QueryErrorResetBoundary>
  {({ reset }) => (
    <ErrorBoundary onReset={reset} fallbackRender={({ resetErrorBoundary }) => (
      <button onClick={resetErrorBoundary}>Try again</button>
    )}>
      <App />
    </ErrorBoundary>
  )}
</QueryErrorResetBoundary>
```

---

## focusManager

Control window focus detection.

```tsx
import { focusManager } from '@tanstack/react-query'

// Override detection
focusManager.setEventListener((handleFocus) => {
  window.addEventListener('visibilitychange', handleFocus, false)
  return () => window.removeEventListener('visibilitychange', handleFocus)
})

// Manual control
focusManager.setFocused(true)
focusManager.setFocused(undefined) // restore default

// React Native
function onAppStateChange(status) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active')
  }
}
```

---

## onlineManager

Control network status detection.

```tsx
import { onlineManager } from '@tanstack/react-query'

onlineManager.setOnline(true)
onlineManager.setOnline(undefined) // restore default

onlineManager.setEventListener((setOnline) => {
  // custom online detection
})
```

---

## Query Filters

Used in `invalidateQueries`, `refetchQueries`, `cancelQueries`, `removeQueries`, `resetQueries`, `isFetching`, `getQueriesData`, `setQueriesData`.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `queryKey` | `QueryKey` | - | Match by query key prefix |
| `exact` | `boolean` | `false` | Only exact key match |
| `type` | `'active' \| 'inactive' \| 'all'` | `'all'` | Filter by observer status |
| `stale` | `boolean` | - | `true` = stale only, `false` = fresh only |
| `fetchStatus` | `'fetching' \| 'paused' \| 'idle'` | - | Filter by fetch status |
| `predicate` | `(query: Query) => boolean` | - | Custom filter function |

---

## Mutation Filters

Used in `isMutating`, `useIsMutating`.

| Property | Type | Description |
|----------|------|-------------|
| `mutationKey` | `MutationKey` | Match by mutation key |
| `exact` | `boolean` | Exact key match only |
| `fetching` | `boolean` | Currently executing |
| `predicate` | `(mutation: Mutation) => boolean` | Custom filter |
