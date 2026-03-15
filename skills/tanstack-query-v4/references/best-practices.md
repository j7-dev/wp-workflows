# TanStack Query v4 -- Best Practices & Caching Strategy

> Source: https://tanstack.com/query/v4/docs/framework/react/guides/

## Table of Contents

- [Caching Lifecycle](#caching-lifecycle)
- [staleTime vs cacheTime Strategy](#staletime-vs-cachetime-strategy)
- [Query Key Design](#query-key-design)
- [Custom Hook Patterns](#custom-hook-patterns)
- [Mutation Patterns](#mutation-patterns)
- [Optimistic Updates Best Practices](#optimistic-updates-best-practices)
- [Error Handling](#error-handling)
- [Performance Optimization](#performance-optimization)
- [Testing](#testing)
- [SSR Best Practices](#ssr-best-practices)
- [Common Pitfalls](#common-pitfalls)

---

## Caching Lifecycle

Understanding the query lifecycle is essential for correct configuration:

1. **First mount** -- `useQuery({ queryKey: ['todos'], queryFn: fetchTodos })` triggers network request. Data cached under key `['todos']`.
2. **Second instance** -- another component uses same key. Gets cached data immediately. Background refetch triggers if stale.
3. **Both unmount** -- no active observers. Cache timeout (`cacheTime`) starts counting.
4. **New mount before timeout** -- cached data returned immediately. Background refetch if stale.
5. **Timeout expires** -- cached data garbage collected permanently.

### Key Lifecycle Rules

- `staleTime` controls **when** background refetches happen
- `cacheTime` controls **how long** unused data stays in memory
- Data with active observers (mounted components) is NEVER garbage collected regardless of `cacheTime`
- Multiple components sharing the same query key share the same cache entry and refetch simultaneously

---

## staleTime vs cacheTime Strategy

### When to increase staleTime

| Scenario | Recommended staleTime | Reasoning |
|----------|----------------------|-----------|
| Data rarely changes (user profile) | `5 * 60 * 1000` (5 min) or more | Reduces unnecessary refetches |
| Static reference data (countries, categories) | `Infinity` | Never auto-refetch; invalidate manually when needed |
| Real-time data (chat, stock prices) | `0` (default) | Always refetch for freshness |
| Dashboard data | `30 * 1000` (30s) | Balance between freshness and performance |
| Form select options | `10 * 60 * 1000` (10 min) | Rarely changes, used often |

### When to adjust cacheTime

| Scenario | Recommended cacheTime | Reasoning |
|----------|----------------------|-----------|
| Large datasets | Lower (1-2 min) | Free memory sooner |
| Frequently revisited data | Higher (10-30 min) | Avoid re-fetching on navigation |
| Sensitive data | Lower or `0` | Don't persist after user navigates away |
| Default | `300000` (5 min) | Works for most cases |

### Configuration Example

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,      // 1 minute globally
      cacheTime: 1000 * 60 * 10, // 10 minutes globally
    },
  },
})

// Override per-query for static data
useQuery({
  queryKey: ['countries'],
  queryFn: fetchCountries,
  staleTime: Infinity,
})
```

---

## Query Key Design

### Hierarchical Keys

Design keys from general to specific. This enables prefix-based invalidation:

```tsx
// Entity structure
['todos']                           // all todos
['todos', 'list']                   // todo list
['todos', 'list', { status: 'done' }] // filtered list
['todos', 'detail', 5]             // single todo

// Invalidation cascades
queryClient.invalidateQueries({ queryKey: ['todos'] })
// Invalidates ALL of the above

queryClient.invalidateQueries({ queryKey: ['todos', 'list'] })
// Invalidates lists only, not details

queryClient.invalidateQueries({ queryKey: ['todos', 'detail', 5], exact: true })
// Invalidates only todo #5
```

### Include Dependencies in Keys

```tsx
// CORRECT -- filter is part of the key
useQuery({
  queryKey: ['todos', { status, page, search }],
  queryFn: () => fetchTodos({ status, page, search }),
})

// WRONG -- filter not in key, stale data shown when filter changes
useQuery({
  queryKey: ['todos'],
  queryFn: () => fetchTodos({ status, page, search }),
})
```

### Object Key Determinism

Object keys are hashed deterministically -- property order doesn't matter:

```tsx
// These are equivalent (same cache entry):
['todos', { status: 'done', page: 1 }]
['todos', { page: 1, status: 'done' }]

// But array order matters -- these are DIFFERENT:
['todos', 'active', 1]
['todos', 1, 'active']
```

---

## Custom Hook Patterns

Encapsulate queries in custom hooks for reusability and consistency:

```tsx
// hooks/useTodos.ts
export function useTodos(filters?: TodoFilters) {
  return useQuery({
    queryKey: ['todos', filters],
    queryFn: () => api.getTodos(filters),
    staleTime: 5 * 60 * 1000,
  })
}

// hooks/useTodo.ts
export function useTodo(id: number) {
  return useQuery({
    queryKey: ['todos', 'detail', id],
    queryFn: () => api.getTodo(id),
    enabled: !!id,
  })
}

// hooks/useCreateTodo.ts
export function useCreateTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}

// hooks/useUpdateTodo.ts
export function useUpdateTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.updateTodo,
    onSuccess: (data, variables) => {
      // Update detail cache
      queryClient.setQueryData(['todos', 'detail', variables.id], data)
      // Invalidate list caches
      queryClient.invalidateQueries({ queryKey: ['todos', 'list'] })
    },
  })
}
```

---

## Mutation Patterns

### Pattern 1: Invalidate After Mutation (Simple)

Best for: lists, dashboards, any data where the server is the source of truth.

```tsx
useMutation({
  mutationFn: createTodo,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

### Pattern 2: Update Cache from Response (Efficient)

Best for: single-item updates where the API returns the updated entity.

```tsx
useMutation({
  mutationFn: updateTodo,
  onSuccess: (updatedTodo) => {
    queryClient.setQueryData(['todos', 'detail', updatedTodo.id], updatedTodo)
  },
})
```

### Pattern 3: Optimistic Update (Fast UX)

Best for: toggling, inline editing, any action where perceived speed matters.

See [Optimistic Updates Best Practices](#optimistic-updates-best-practices) below.

### Pattern 4: Mutation + Invalidation + Cache Update (Complete)

Best for: when you need immediate UI update AND eventual consistency.

```tsx
useMutation({
  mutationFn: updateTodo,
  onSuccess: (data, variables) => {
    // Immediately update detail view
    queryClient.setQueryData(['todos', 'detail', variables.id], data)
    // Invalidate list to refresh counts, sorting, etc.
    queryClient.invalidateQueries({ queryKey: ['todos', 'list'] })
  },
})
```

---

## Optimistic Updates Best Practices

### The 4-Step Pattern

1. **Cancel** -- prevent outgoing refetches from overwriting optimistic data
2. **Snapshot** -- save current cache for rollback
3. **Update** -- apply optimistic change to cache
4. **Rollback** -- revert on error, always refetch on settle

```tsx
useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    // Step 1: Cancel
    await queryClient.cancelQueries({ queryKey: ['todos'] })

    // Step 2: Snapshot
    const previousTodos = queryClient.getQueryData(['todos'])

    // Step 3: Optimistic update
    queryClient.setQueryData(['todos'], (old) =>
      old.map((t) => (t.id === newTodo.id ? { ...t, ...newTodo } : t)),
    )

    // Return context for rollback
    return { previousTodos }
  },
  onError: (err, newTodo, context) => {
    // Step 4a: Rollback
    queryClient.setQueryData(['todos'], context.previousTodos)
  },
  onSettled: () => {
    // Step 4b: Always refetch for consistency
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

### Common Mistakes

- Forgetting `cancelQueries` -- outgoing refetch can overwrite your optimistic update
- Not using `onSettled` to refetch -- leaves cache potentially out of sync
- Mutating cache directly instead of immutable updates
- Not returning the snapshot from `onMutate`

---

## Error Handling

### Per-Query Error Handling

```tsx
// Using onError (deprecated in v4, removed in v5)
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  onError: (error) => toast.error(error.message),
})

// Recommended: useEffect on error state
const { error } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
React.useEffect(() => {
  if (error) toast.error(error.message)
}, [error])
```

### Global Error Handling

```tsx
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Global error handler -- fires for every failed query
      if (query.state.data !== undefined) {
        // Only show for queries that had previous data (background error)
        toast.error(`Something went wrong: ${error.message}`)
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      toast.error(`Mutation failed: ${error.message}`)
    },
  }),
})
```

### Error Boundary Integration

```tsx
// Per-query
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  useErrorBoundary: true,
})

// With QueryErrorResetBoundary
<QueryErrorResetBoundary>
  {({ reset }) => (
    <ErrorBoundary onReset={reset}>
      <Todos />
    </ErrorBoundary>
  )}
</QueryErrorResetBoundary>
```

---

## Performance Optimization

### 1. Use select for Data Transformation

```tsx
// Transforms in select don't affect cache
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  select: (data) => data.filter((todo) => todo.done),
})
```

### 2. Structural Sharing

Enabled by default. Preserves referential identity for unchanged parts of data, preventing unnecessary re-renders. Works with JSON-compatible values only.

### 3. notifyOnChangeProps

Auto-tracked by default in v4. Only re-renders when accessed properties change. Use `'all'` to opt out.

### 4. Disable Window Focus Refetching for Stable Data

```tsx
useQuery({
  queryKey: ['config'],
  queryFn: fetchConfig,
  staleTime: Infinity,
  refetchOnWindowFocus: false,
})
```

### 5. Prefetch on Hover

```tsx
<Link
  to={`/post/${post.id}`}
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: ['post', post.id],
      queryFn: () => fetchPost(post.id),
    })
  }}
>
  {post.title}
</Link>
```

---

## Testing

### Setup

```tsx
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
```

### Key Testing Rules

1. **Disable retries** -- `retry: false` prevents test timeouts
2. **Create fresh QueryClient per test** -- prevents shared state between tests
3. **Suppress error logging** in tests:

```tsx
const queryClient = new QueryClient({
  logger: {
    log: console.log,
    warn: console.warn,
    error: process.env.NODE_ENV === 'test' ? () => {} : console.error,
  },
})
```

4. **Set `cacheTime: Infinity`** in Jest to prevent "did not exit one second after" errors
5. Use `waitFor` to wait for async state changes:

```tsx
const { result } = renderHook(() => useTodos(), { wrapper: createWrapper() })
await waitFor(() => expect(result.current.isSuccess).toBe(true))
expect(result.current.data).toHaveLength(3)
```

---

## SSR Best Practices

### Approach Comparison

| Approach | Pros | Cons |
|----------|------|------|
| `initialData` | Simple setup, works anywhere | Must pass data through props, no `dataUpdatedAt` info |
| `Hydrate` / `dehydrate` | Full cache transfer, timing info preserved, works with prefetching | More setup, requires `<Hydrate>` wrapper |

### Memory Management

- Call `queryClient.clear()` after sending dehydrated state to prevent server memory leaks
- `cacheTime` defaults to `Infinity` on server -- queries are never garbage collected automatically
- Create a new `QueryClient` per request to prevent shared state between users

### Next.js Guidelines

- Use `React.useState(() => new QueryClient())` in `_app.tsx` to avoid creating new client on every render
- For Next.js 13 app directory, use `cache()` from React to share QueryClient within a single request
- Errored queries are automatically excluded from dehydration

---

## Common Pitfalls

### 1. Creating QueryClient Outside Component

```tsx
// WRONG -- shared between requests in SSR
const queryClient = new QueryClient()
function App() {
  return <QueryClientProvider client={queryClient}>...</QueryClientProvider>
}

// CORRECT -- new instance per component lifecycle
function App() {
  const [queryClient] = React.useState(() => new QueryClient())
  return <QueryClientProvider client={queryClient}>...</QueryClientProvider>
}
```

### 2. Using v3 Syntax

```tsx
// WRONG (v3 syntax)
useQuery('todos', fetchTodos)
useQuery(['todos'], fetchTodos, { staleTime: 1000 })

// CORRECT (v4 syntax)
useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
useQuery({ queryKey: ['todos'], queryFn: fetchTodos, staleTime: 1000 })
```

### 3. Returning undefined from queryFn

```tsx
// WRONG -- throws in v4
const { data } = useQuery({
  queryKey: ['todos'],
  queryFn: async () => {
    console.log('fetching')
    // Oops, forgot to return data
  },
})

// CORRECT
const { data } = useQuery({
  queryKey: ['todos'],
  queryFn: async () => {
    const response = await fetch('/todos')
    return response.json() // Always return data
  },
})
```

### 4. Not Handling fetch Errors

```tsx
// WRONG -- fetch doesn't throw on HTTP errors
useQuery({
  queryKey: ['todos'],
  queryFn: () => fetch('/todos').then((res) => res.json()),
})

// CORRECT -- check response.ok
useQuery({
  queryKey: ['todos'],
  queryFn: async () => {
    const response = await fetch('/todos')
    if (!response.ok) throw new Error('Network response was not ok')
    return response.json()
  },
})
```

### 5. Mutating Cache Data Directly

```tsx
// WRONG -- mutating in place
queryClient.setQueryData(['todos'], (old) => {
  old.push(newTodo) // NEVER mutate directly
  return old
})

// CORRECT -- immutable update
queryClient.setQueryData(['todos'], (old) => [...old, newTodo])
```

### 6. enabled: false Blocks invalidateQueries

When `enabled: false`, calling `invalidateQueries` will NOT trigger a refetch. The query is marked as invalid but won't fetch until `enabled` becomes `true` or `refetch()` is called manually.

### 7. Window Focus Refetching During Development

Switching between your app and DevTools triggers `refetchOnWindowFocus`. This is normal behavior, not a bug. During development, you may want to disable it:

```tsx
new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
})
```
