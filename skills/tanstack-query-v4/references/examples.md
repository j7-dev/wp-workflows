# TanStack Query v4 -- Complete Examples

> All examples from official documentation. Source: https://tanstack.com/query/v4/docs/

## Table of Contents

- [Basic Query](#basic-query)
- [Query with Status Checks](#query-with-status-checks)
- [Mutation with Side Effects](#mutation-with-side-effects)
- [Invalidation After Mutation](#invalidation-after-mutation)
- [Optimistic Update (List)](#optimistic-update-list)
- [Optimistic Update (Single Item)](#optimistic-update-single-item)
- [Update Cache from Mutation Response](#update-cache-from-mutation-response)
- [Dependent Queries](#dependent-queries)
- [Parallel Queries](#parallel-queries)
- [Dynamic Parallel Queries (useQueries)](#dynamic-parallel-queries)
- [Paginated Queries (keepPreviousData)](#paginated-queries)
- [Infinite Scroll (useInfiniteQuery)](#infinite-scroll)
- [Disabled / Lazy Query](#disabled--lazy-query)
- [Prefetching](#prefetching)
- [Initial Data from Cache](#initial-data-from-cache)
- [Placeholder Data from Cache](#placeholder-data-from-cache)
- [Default Query Function](#default-query-function)
- [Background Fetching Indicator](#background-fetching-indicator)
- [Global Loading Indicator](#global-loading-indicator)
- [Custom Retry Configuration](#custom-retry-configuration)
- [Window Focus Refetching Control](#window-focus-refetching-control)
- [SSR with Next.js (Hydration)](#ssr-with-nextjs-hydration)
- [SSR with Next.js (initialData)](#ssr-with-nextjs-initialdata)
- [Next.js 13 App Dir with Hydrate](#nextjs-13-app-dir)
- [Testing Custom Hooks](#testing-custom-hooks)
- [Mutation with Retry and Persistence](#mutation-with-retry-and-persistence)
- [Query Cancellation with AbortSignal](#query-cancellation)
- [React Native Focus Management](#react-native-focus-management)
- [Custom Hook Pattern](#custom-hook-pattern)

---

## Basic Query

```tsx
import { useQuery } from '@tanstack/react-query'

function Todos() {
  const { isLoading, isError, data, error } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodoList,
  })

  if (isLoading) return <span>Loading...</span>
  if (isError) return <span>Error: {error.message}</span>

  return (
    <ul>
      {data.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
```

---

## Query with Status Checks

```tsx
import { useQuery } from '@tanstack/react-query'

function Todos() {
  const { status, data, error } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodoList,
  })

  if (status === 'loading') return <span>Loading...</span>
  if (status === 'error') return <span>Error: {error.message}</span>

  return (
    <ul>
      {data.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
```

---

## Mutation with Side Effects

```tsx
import { useMutation } from '@tanstack/react-query'

function App() {
  const mutation = useMutation({
    mutationFn: (newTodo) => axios.post('/todos', newTodo),
    onMutate: (variables) => {
      // Fires before mutation; return context for rollback
      return { id: 1 }
    },
    onError: (error, variables, context) => {
      console.log(`rolling back optimistic update with id ${context.id}`)
    },
    onSuccess: (data, variables, context) => {
      // Mutation succeeded
    },
    onSettled: (data, error, variables, context) => {
      // Either outcome
    },
  })

  return (
    <div>
      {mutation.isLoading ? (
        'Adding todo...'
      ) : (
        <>
          {mutation.isError && <div>Error: {mutation.error.message}</div>}
          {mutation.isSuccess && <div>Todo added!</div>}
          <button onClick={() => mutation.mutate({ id: new Date(), title: 'Do Laundry' })}>
            Create Todo
          </button>
        </>
      )}
    </div>
  )
}
```

---

## Invalidation After Mutation

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

function AddTodo() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: addTodo,
    onSuccess: () => {
      // Invalidate and refetch all queries starting with 'todos'
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
  })

  return <button onClick={() => mutation.mutate({ title: 'New Todo' })}>Add</button>
}
```

---

## Optimistic Update (List)

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

function useTodoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTodo,
    onMutate: async (newTodo) => {
      // 1. Cancel outgoing refetches to prevent overwrite
      await queryClient.cancelQueries({ queryKey: ['todos'] })

      // 2. Snapshot previous value
      const previousTodos = queryClient.getQueryData(['todos'])

      // 3. Optimistically update cache
      queryClient.setQueryData(['todos'], (old) =>
        old.map((todo) => (todo.id === newTodo.id ? { ...todo, ...newTodo } : todo)),
      )

      // 4. Return context with snapshot for rollback
      return { previousTodos }
    },
    onError: (err, newTodo, context) => {
      // 5. Rollback on error
      queryClient.setQueryData(['todos'], context.previousTodos)
    },
    onSettled: () => {
      // 6. Always refetch after to sync with server
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}
```

---

## Optimistic Update (Single Item)

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

function useSingleTodoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTodo,
    onMutate: async (newTodo) => {
      await queryClient.cancelQueries({ queryKey: ['todo', newTodo.id] })
      const previousTodo = queryClient.getQueryData(['todo', newTodo.id])

      queryClient.setQueryData(['todo', newTodo.id], (old) => ({
        ...old,
        ...newTodo,
      }))

      return { previousTodo }
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['todo', newTodo.id], context.previousTodo)
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['todo', variables.id] })
    },
  })
}
```

---

## Update Cache from Mutation Response

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

const useMutateTodo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: editTodo,
    onSuccess: (data, variables) => {
      // Use returned data to update cache directly (no extra fetch)
      queryClient.setQueryData(['todo', { id: variables.id }], data)
    },
  })
}

// Usage
const mutation = useMutateTodo()
mutation.mutate({ id: 5, name: 'Do the laundry' })
```

Immutable update pattern:

```tsx
// CORRECT
queryClient.setQueryData(['posts', { id }], (oldData) =>
  oldData ? { ...oldData, title: 'my new post title' } : oldData,
)

// WRONG -- do not mutate directly
queryClient.setQueryData(['posts', { id }], (oldData) => {
  if (oldData) {
    oldData.title = 'my new post title' // NEVER do this
  }
  return oldData
})
```

---

## Dependent Queries

```tsx
import { useQuery } from '@tanstack/react-query'

function UserProjects({ email }) {
  // First query -- get user
  const { data: user } = useQuery({
    queryKey: ['user', email],
    queryFn: () => getUserByEmail(email),
  })

  const userId = user?.id

  // Second query -- depends on user.id
  const {
    status,
    fetchStatus,
    data: projects,
  } = useQuery({
    queryKey: ['projects', userId],
    queryFn: () => getProjectsByUser(userId),
    enabled: !!userId, // won't execute until userId exists
  })

  // status: 'loading', fetchStatus: 'idle' -- waiting for user
  // status: 'loading', fetchStatus: 'fetching' -- user loaded, fetching projects
  // status: 'success', fetchStatus: 'idle' -- projects loaded
}
```

Dynamic parallel dependent queries:

```tsx
const { data: userIds } = useQuery({
  queryKey: ['users'],
  queryFn: getUsersData,
  select: (users) => users.map((user) => user.id),
})

const usersMessages = useQueries({
  queries: userIds
    ? userIds.map((id) => ({
        queryKey: ['messages', id],
        queryFn: () => getMessagesByUsers(id),
      }))
    : [],
})
```

---

## Parallel Queries

```tsx
function App() {
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: fetchUsers })
  const teamsQuery = useQuery({ queryKey: ['teams'], queryFn: fetchTeams })
  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: fetchProjects })
  // All execute in parallel
}
```

With Suspense mode, use separate components or `useQueries` instead (first query suspends before others mount).

---

## Dynamic Parallel Queries

```tsx
import { useQueries } from '@tanstack/react-query'

function App({ users }) {
  const userQueries = useQueries({
    queries: users.map((user) => ({
      queryKey: ['user', user.id],
      queryFn: () => fetchUserById(user.id),
    })),
  })
  // userQueries: UseQueryResult[]
}
```

---

## Paginated Queries

```tsx
import { useQuery } from '@tanstack/react-query'

function Projects() {
  const [page, setPage] = React.useState(0)

  const { data, isPreviousData, isFetching } = useQuery({
    queryKey: ['projects', page],
    queryFn: () => fetchProjects(page),
    keepPreviousData: true, // show previous page while loading next
  })

  return (
    <div>
      {data.projects.map((project) => (
        <p key={project.id}>{project.name}</p>
      ))}

      <span>Current Page: {page + 1}</span>

      <button onClick={() => setPage((old) => Math.max(old - 1, 0))} disabled={page === 0}>
        Previous Page
      </button>

      <button
        onClick={() => {
          if (!isPreviousData && data.hasMore) {
            setPage((old) => old + 1)
          }
        }}
        disabled={isPreviousData || !data?.hasMore}
      >
        Next Page
      </button>

      {isFetching ? <span> Loading...</span> : null}
    </div>
  )
}
```

---

## Infinite Scroll

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'

function Projects() {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['projects'],
    queryFn: ({ pageParam = 0 }) => fetchProjects(pageParam),
    getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
  })

  if (status === 'loading') return <p>Loading...</p>
  if (status === 'error') return <p>Error: {error.message}</p>

  return (
    <>
      {data.pages.map((group, i) => (
        <React.Fragment key={i}>
          {group.projects.map((project) => (
            <p key={project.id}>{project.name}</p>
          ))}
        </React.Fragment>
      ))}

      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading more...' : hasNextPage ? 'Load More' : 'Nothing more'}
      </button>

      {isFetching && !isFetchingNextPage ? <span>Fetching...</span> : null}
    </>
  )
}
```

---

## Disabled / Lazy Query

```tsx
function Todos() {
  const { isInitialLoading, data, error, refetch, isFetching } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodoList,
    enabled: false, // no auto-fetch
  })

  return (
    <div>
      <button onClick={() => refetch()}>Fetch Todos</button>
      {isInitialLoading ? <span>Loading...</span> : null}
      {data && (
        <ul>
          {data.map((todo) => (
            <li key={todo.id}>{todo.title}</li>
          ))}
        </ul>
      )}
      {isFetching ? 'Fetching...' : null}
    </div>
  )
}
```

Lazy/conditional query:

```tsx
function Todos() {
  const [filter, setFilter] = React.useState('')

  const { data } = useQuery({
    queryKey: ['todos', filter],
    queryFn: () => fetchTodos(filter),
    enabled: !!filter, // only fetch when filter has a value
  })

  return (
    <div>
      <FiltersForm onApply={setFilter} />
      {data && <TodosTable data={data} />}
    </div>
  )
}
```

---

## Prefetching

```tsx
import { useQueryClient } from '@tanstack/react-query'

function TodoList() {
  const queryClient = useQueryClient()

  // Prefetch on hover
  const prefetchTodo = (todoId) => {
    queryClient.prefetchQuery({
      queryKey: ['todo', todoId],
      queryFn: () => fetchTodo(todoId),
    })
  }

  return todos.map((todo) => (
    <li key={todo.id} onMouseEnter={() => prefetchTodo(todo.id)}>
      {todo.title}
    </li>
  ))
}

// Or seed cache directly
queryClient.setQueryData(['todos'], todosData)
```

---

## Initial Data from Cache

```tsx
function Todo({ todoId }) {
  const queryClient = useQueryClient()

  const result = useQuery({
    queryKey: ['todo', todoId],
    queryFn: () => fetch(`/todos/${todoId}`),
    initialData: () => {
      // Use data from the 'todos' list cache as initial data
      return queryClient.getQueryData(['todos'])?.find((d) => d.id === todoId)
    },
    initialDataUpdatedAt: () => {
      // Tell React Query when this initial data was last fetched
      return queryClient.getQueryState(['todos'])?.dataUpdatedAt
    },
  })
}
```

---

## Placeholder Data from Cache

```tsx
function BlogPost({ blogPostId }) {
  const queryClient = useQueryClient()

  const result = useQuery({
    queryKey: ['blogPost', blogPostId],
    queryFn: () => fetch(`/blogPosts/${blogPostId}`),
    placeholderData: () => {
      // Show preview data from list cache while full data loads
      return queryClient
        .getQueryData(['blogPosts'])
        ?.find((d) => d.id === blogPostId)
    },
  })
}
```

---

## Default Query Function

```tsx
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'

const defaultQueryFn = async ({ queryKey }) => {
  const { data } = await axios.get(`https://jsonplaceholder.typicode.com${queryKey[0]}`)
  return data
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Posts />
    </QueryClientProvider>
  )
}

function Posts() {
  // No queryFn needed -- uses default
  const { status, data } = useQuery({ queryKey: ['/posts'] })
  // ...
}
```

---

## Background Fetching Indicator

```tsx
function Todos() {
  const { status, data, error, isFetching } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  return status === 'loading' ? (
    <span>Loading...</span>
  ) : status === 'error' ? (
    <span>Error: {error.message}</span>
  ) : (
    <>
      {isFetching ? <div>Refreshing...</div> : null}
      <ul>
        {data.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </>
  )
}
```

---

## Global Loading Indicator

```tsx
import { useIsFetching } from '@tanstack/react-query'

function GlobalLoadingIndicator() {
  const isFetching = useIsFetching()
  return isFetching ? <div>Queries are fetching in the background...</div> : null
}
```

---

## Custom Retry Configuration

```tsx
// Per-query
const result = useQuery({
  queryKey: ['todos', 1],
  queryFn: fetchTodoListPage,
  retry: 10,
})

// Global -- exponential backoff
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})

// Fixed delay
const result = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodoList,
  retryDelay: 1000, // always 1 second
})
```

---

## Window Focus Refetching Control

```tsx
// Disable globally
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

// Disable per-query
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  refetchOnWindowFocus: false,
})
```

---

## SSR with Next.js (Hydration)

`_app.tsx`:

```tsx
import { Hydrate, QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function MyApp({ Component, pageProps }) {
  const [queryClient] = React.useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <Hydrate state={pageProps.dehydratedState}>
        <Component {...pageProps} />
      </Hydrate>
    </QueryClientProvider>
  )
}
```

Page with `getStaticProps`:

```tsx
import { dehydrate, QueryClient, useQuery } from '@tanstack/react-query'

export async function getStaticProps() {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({ queryKey: ['posts'], queryFn: getPosts })

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  }
}

function Posts() {
  const { data } = useQuery({ queryKey: ['posts'], queryFn: getPosts })
  // data is available immediately from dehydrated state
}
```

---

## SSR with Next.js (initialData)

```tsx
export async function getStaticProps() {
  const posts = await getPosts()
  return { props: { posts } }
}

function Posts(props) {
  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
    initialData: props.posts,
  })
}
```

---

## Next.js 13 App Dir

`app/providers.tsx`:

```tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function Providers({ children }) {
  const [queryClient] = React.useState(() => new QueryClient())
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

`app/getQueryClient.tsx`:

```tsx
import { QueryClient } from '@tanstack/react-query'
import { cache } from 'react'

const getQueryClient = cache(() => new QueryClient())
export default getQueryClient
```

`app/hydratedPosts.tsx` (Server Component):

```tsx
import { dehydrate, Hydrate } from '@tanstack/react-query'
import getQueryClient from './getQueryClient'

export default async function HydratedPosts() {
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery({ queryKey: ['posts'], queryFn: getPosts })
  const dehydratedState = dehydrate(queryClient)

  return (
    <Hydrate state={dehydratedState}>
      <Posts />
    </Hydrate>
  )
}
```

`app/posts.tsx` (Client Component):

```tsx
'use client'
import { useQuery } from '@tanstack/react-query'

export default function Posts() {
  const { data } = useQuery({ queryKey: ['posts'], queryFn: getPosts })
  // data available immediately from hydration
}
```

---

## Testing Custom Hooks

```tsx
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // disable retries in tests
    },
  },
})

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

test('fetches data', async () => {
  const { result } = renderHook(() => useCustomHook(), { wrapper })

  await waitFor(() => expect(result.current.isSuccess).toBe(true))

  expect(result.current.data).toEqual('Hello')
})
```

---

## Mutation with Retry and Persistence

```tsx
const queryClient = new QueryClient()

// Set defaults for offline-capable mutations
queryClient.setMutationDefaults(['addTodo'], {
  mutationFn: addTodo,
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] })
    const optimisticTodo = { id: uuid(), title: variables.title }
    queryClient.setQueryData(['todos'], (old) => [...old, optimisticTodo])
    return { optimisticTodo }
  },
  onSuccess: (result, variables, context) => {
    queryClient.setQueryData(['todos'], (old) =>
      old.map((todo) => (todo.id === context.optimisticTodo.id ? result : todo)),
    )
  },
  onError: (error, variables, context) => {
    queryClient.setQueryData(['todos'], (old) =>
      old.filter((todo) => todo.id !== context.optimisticTodo.id),
    )
  },
  retry: 3,
})

// Resume paused mutations after hydration
const state = dehydrate(queryClient)
hydrate(queryClient, state)
queryClient.resumePausedMutations()
```

---

## Query Cancellation

```tsx
import { useQuery } from '@tanstack/react-query'

const { data } = useQuery({
  queryKey: ['todos'],
  queryFn: ({ signal }) => {
    // Pass signal to fetch for automatic cancellation
    return fetch('/todos', { signal }).then((res) => res.json())
  },
})

// Or with axios
const { data } = useQuery({
  queryKey: ['todos'],
  queryFn: ({ signal }) => {
    return axios.get('/todos', { signal })
  },
})

// Manual cancellation
const queryClient = useQueryClient()
queryClient.cancelQueries({ queryKey: ['todos'] })
```

---

## React Native Focus Management

```tsx
import { AppState, Platform } from 'react-native'
import { focusManager } from '@tanstack/react-query'

function onAppStateChange(status) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active')
  }
}

useEffect(() => {
  const subscription = AppState.addEventListener('change', onAppStateChange)
  return () => subscription.remove()
}, [])
```

---

## Custom Hook Pattern

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Custom query hook
function useTodos(filters) {
  return useQuery({
    queryKey: ['todos', filters],
    queryFn: () => fetchTodos(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Custom mutation hook
function useCreateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (newTodo) => axios.post('/api/todos', newTodo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}

// Usage in component
function TodoPage() {
  const { data: todos, isLoading } = useTodos({ status: 'active' })
  const createTodo = useCreateTodo()

  const handleCreate = () => {
    createTodo.mutate({ title: 'New Todo' })
  }
}
```
