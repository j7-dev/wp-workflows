# TanStack Query v5 Examples

> **最後更新**：2026-03-20 | 所有範例基於 @tanstack/react-query ^5.x + React 18

## 目錄（TOC）

- [QueryClientProvider 根元件設定](#queryclientprovider-根元件設定)
- [基本查詢與錯誤處理](#基本查詢與錯誤處理)
- [條件查詢 skipToken 模式](#條件查詢-skiptoken-模式)
- [依賴查詢（Dependent Queries）](#依賴查詢dependent-queries)
- [平行查詢 useQueries + combine](#平行查詢-usequeries--combine)
- [基本 Mutation](#基本-mutation)
- [樂觀更新（Optimistic Update）](#樂觀更新optimistic-update)
- [無限捲動（Infinite Scroll）](#無限捲動infinite-scroll)
- [queryOptions Helper 工廠模式](#queryoptions-helper-工廠模式)
- [Suspense 模式](#suspense-模式)
- [SSR Hydration（Next.js App Router）](#ssr-hydrationnextjs-app-router)
- [分頁查詢 placeholderData](#分頁查詢-placeholderdata)
- [全域錯誤處理 QueryCache](#全域錯誤處理-querycache)
- [搜尋與過濾（Debounce 整合）](#搜尋與過濾debounce-整合)

---

## QueryClientProvider 根元件設定

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

// 建議：在元件外建立 QueryClient 避免重新建立
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,        // 1 分鐘內不重新抓取
      gcTime: 10 * 60 * 1000,      // 10 分鐘後清理快取
      retry: 3,                     // 失敗重試 3 次
      refetchOnWindowFocus: true,   // 視窗聚焦時重新抓取
    },
    mutations: {
      retry: 0,                     // mutation 不重試
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourRoutes />
      {/* 開發環境顯示 DevTools */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

---

## 基本查詢與錯誤處理

```typescript
import { useQuery } from "@tanstack/react-query";

type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch("/api/todos");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function TodoList() {
  const { data, error, isLoading, isError, refetch } = useQuery({
    queryKey: ["todos"],
    queryFn: fetchTodos,
    staleTime: 30 * 1000,
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return (
    <div>
      Error: {error.message}
      <button onClick={() => refetch()}>Retry</button>
    </div>
  );

  return (
    <ul>
      {data?.map(todo => (
        <li key={todo.id}>
          {todo.title} {todo.completed ? "✓" : "○"}
        </li>
      ))}
    </ul>
  );
}
```

---

## 條件查詢 skipToken 模式

```typescript
import { skipToken, useQuery } from "@tanstack/react-query";

type User = { id: number; name: string; email: string };

async function fetchUser(id: number): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function UserProfile({ userId }: { userId: number | undefined }) {
  const { data, isLoading } = useQuery({
    queryKey: ["user", userId],
    // skipToken：userId 不存在時不執行查詢，且型別安全
    queryFn: userId !== undefined ? () => fetchUser(userId) : skipToken,
  });

  if (!userId) return <p>Please log in</p>;
  if (isLoading) return <p>Loading...</p>;
  return <p>Welcome, {data?.name}</p>;
}
```

---

## 依賴查詢（Dependent Queries）

```typescript
import { useQuery } from "@tanstack/react-query";

// 先取得 user，再根據 user.id 取得 projects
export function UserProjects({ userId }: { userId: number }) {
  const { data: user } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId),
  });

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", user?.teamId],
    queryFn: () => fetchProjects(user!.teamId),
    enabled: !!user?.teamId,  // user.teamId 存在後才執行
  });

  if (isLoading) return <p>Loading projects...</p>;
  return (
    <ul>
      {projects?.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
}
```

---

## 平行查詢 useQueries + combine

```typescript
import { useQueries } from "@tanstack/react-query";

type Post = { id: number; title: string; body: string };

async function fetchPost(id: number): Promise<Post> {
  const res = await fetch(`/api/posts/${id}`);
  return res.json();
}

export function PostGrid({ ids }: { ids: number[] }) {
  const { posts, isPending, hasErrors } = useQueries({
    queries: ids.map(id => ({
      queryKey: ["post", id],
      queryFn: () => fetchPost(id),
      staleTime: 5 * 60 * 1000,
    })),
    combine: (results) => ({
      posts: results.map(r => r.data).filter((d): d is Post => d !== undefined),
      isPending: results.some(r => r.isPending),
      hasErrors: results.some(r => r.isError),
    }),
  });

  if (isPending) return <p>Loading posts...</p>;
  if (hasErrors) return <p>Some posts failed to load</p>;
  return (
    <div className="grid">
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.body}</p>
        </article>
      ))}
    </div>
  );
}
```

---

## 基本 Mutation

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

type CreateTodoInput = { title: string };
type Todo = { id: number; title: string; completed: boolean };

async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const res = await fetch("/api/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function CreateTodoForm() {
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      // 成功後使 todos 快取失效，觸發重新抓取
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
    onError: (err) => {
      console.error("Failed to create todo:", err);
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    mutate({ title: data.get("title") as string });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="New todo..." required />
      <button disabled={isPending}>
        {isPending ? "Creating..." : "Add Todo"}
      </button>
      {error && <p className="error">{error.message}</p>}
    </form>
  );
}
```

---

## 樂觀更新（Optimistic Update）

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

type Todo = { id: number; title: string; completed: boolean };
type ToggleTodoInput = { id: number; completed: boolean };

async function toggleTodo(input: ToggleTodoInput): Promise<Todo> {
  const res = await fetch(`/api/todos/${input.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed: input.completed }),
  });
  return res.json();
}

export function TodoItem({ todo }: { todo: Todo }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: toggleTodo,

    // 1. 樂觀更新：在請求完成前立即更新 UI
    onMutate: async (updatedTodo) => {
      // 取消進行中的重新抓取，防止覆蓋樂觀更新
      await queryClient.cancelQueries({ queryKey: ["todos"] });

      // 保存原始快取（用於回滾）
      const snapshot = queryClient.getQueryData<Todo[]>(["todos"]);

      // 樂觀更新快取
      queryClient.setQueryData<Todo[]>(["todos"], (old = []) =>
        old.map(t =>
          t.id === updatedTodo.id ? { ...t, completed: updatedTodo.completed } : t
        )
      );

      return { snapshot };  // context 傳給 onError
    },

    // 2. 失敗時回滾至原始狀態
    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(["todos"], context.snapshot);
      }
    },

    // 3. 成功或失敗後，使快取失效以同步伺服器狀態
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  return (
    <li>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => mutation.mutate({ id: todo.id, completed: !todo.completed })}
      />
      {todo.title}
    </li>
  );
}
```

---

## 無限捲動（Infinite Scroll）

```typescript
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

type PagedResponse = {
  items: { id: number; name: string }[];
  nextCursor: string | null;
};

async function fetchItems({ cursor }: { cursor?: string }): Promise<PagedResponse> {
  const url = cursor ? `/api/items?cursor=${cursor}` : "/api/items";
  const res = await fetch(url);
  return res.json();
}

export function InfiniteList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["items"],
    queryFn: ({ pageParam }) => fetchItems({ cursor: pageParam }),
    initialPageParam: undefined as string | undefined,  // v5 必填
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  // Intersection Observer 偵測捲動到底部
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    if (bottomRef.current) observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <p>Loading...</p>;

  const allItems = data?.pages.flatMap(page => page.items) ?? [];

  return (
    <>
      <ul>
        {allItems.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
      <div ref={bottomRef} />
      {isFetchingNextPage && <p>Loading more...</p>}
      {!hasNextPage && allItems.length > 0 && <p>No more items</p>}
    </>
  );
}
```

---

## queryOptions Helper 工廠模式

```typescript
import { queryOptions, useQuery } from "@tanstack/react-query";

// ===== Query Options Factory =====
// 集中管理 queryKey + queryFn，確保型別同步

type Post = { id: number; title: string; body: string };

async function fetchPost(id: number): Promise<Post> {
  const res = await fetch(`/api/posts/${id}`);
  return res.json();
}

async function fetchPosts(): Promise<Post[]> {
  const res = await fetch("/api/posts");
  return res.json();
}

// 定義 options factories
export const postQueries = {
  all: () => queryOptions({
    queryKey: ["posts"],
    queryFn: fetchPosts,
    staleTime: 5 * 60 * 1000,
  }),

  detail: (id: number) => queryOptions({
    queryKey: ["posts", id],
    queryFn: () => fetchPost(id),
    staleTime: 60 * 1000,
  }),
};

// ===== 在元件中使用 =====
export function PostDetail({ id }: { id: number }) {
  const { data, isLoading } = useQuery(postQueries.detail(id));
  if (isLoading) return <p>Loading...</p>;
  return <h1>{data?.title}</h1>;
}

// ===== 在 Server Component 中 prefetch =====
// async function PostPage({ params }: { params: { id: string } }) {
//   const queryClient = new QueryClient();
//   await queryClient.prefetchQuery(postQueries.detail(Number(params.id)));
//   return <HydrationBoundary state={dehydrate(queryClient)}><PostDetail id={...} /></HydrationBoundary>;
// }
```

---

## Suspense 模式

```typescript
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";

type User = { id: number; name: string; email: string };

async function fetchUser(id: number): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

// Suspense 元件：data 永遠不是 undefined
function UserCard({ userId }: { userId: number }) {
  const { data: user } = useSuspenseQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId),
  });

  return (
    <div className="user-card">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

// 包裝 Suspense + ErrorBoundary
export function UserCardWithBoundaries({ userId }: { userId: number }) {
  return (
    <ErrorBoundary
      fallback={<div className="error">Failed to load user</div>}
    >
      <Suspense fallback={<div className="skeleton">Loading user...</div>}>
        <UserCard userId={userId} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

---

## SSR Hydration（Next.js App Router）

```typescript
// app/posts/[id]/page.tsx — Server Component
import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import { PostDetail } from "./PostDetail";
import { postQueries } from "@/lib/queries";

export default async function PostPage({
  params,
}: {
  params: { id: string };
}) {
  const queryClient = new QueryClient();
  const postId = Number(params.id);

  // 在 server 端預先抓取資料
  await queryClient.prefetchQuery(postQueries.detail(postId));

  return (
    // 將 dehydrated state 傳入，Client Component 首次渲染即有資料
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostDetail id={postId} />
    </HydrationBoundary>
  );
}
```

```typescript
// app/posts/[id]/PostDetail.tsx — Client Component
"use client";
import { useQuery } from "@tanstack/react-query";
import { postQueries } from "@/lib/queries";

export function PostDetail({ id }: { id: number }) {
  // 首次渲染使用 server prefetch 的資料，無需 loading 狀態
  const { data: post } = useQuery(postQueries.detail(id));

  return (
    <article>
      <h1>{post?.title}</h1>
      <p>{post?.body}</p>
    </article>
  );
}
```

---

## 分頁查詢 placeholderData

```typescript
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

type PaginatedTodos = {
  todos: { id: number; title: string }[];
  total: number;
  page: number;
  perPage: number;
};

async function fetchTodoPage(page: number): Promise<PaginatedTodos> {
  const res = await fetch(`/api/todos?page=${page}&perPage=10`);
  return res.json();
}

export function PaginatedTodos() {
  const [page, setPage] = useState(1);

  const { data, isPlaceholderData, isLoading } = useQuery({
    queryKey: ["todos", "paginated", page],
    queryFn: () => fetchTodoPage(page),
    placeholderData: keepPreviousData,  // 換頁時保留上一頁資料
    staleTime: 30 * 1000,
  });

  const totalPages = data ? Math.ceil(data.total / data.perPage) : 0;

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ul style={{ opacity: isPlaceholderData ? 0.5 : 1 }}>
          {data?.todos.map(todo => <li key={todo.id}>{todo.title}</li>)}
        </ul>
      )}
      <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages || isPlaceholderData} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </div>
  );
}
```

---

## 全域錯誤處理 QueryCache

```typescript
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";

// 建立全域錯誤處理的 QueryClient
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // 只對非預期錯誤顯示 toast（避免重複顯示）
      if (query.state.data !== undefined) {
        // 背景重新抓取失敗（使用者看到的是舊資料）
        toast.error(`Data refresh failed: ${error.message}`);
      }
    },
  }),
  defaultOptions: {
    queries: {
      // 首次載入失敗：讓元件自行處理 isError 狀態
      // 不在這裡 toast，避免重複
      retry: (failureCount, error) => {
        // HTTP 401/403/404 不重試
        if (error instanceof Response && [401, 403, 404].includes(error.status)) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  );
}
```

---

## 搜尋與過濾（Debounce 整合）

```typescript
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";

type SearchResult = { id: number; title: string };

async function searchItems(query: string): Promise<SearchResult[]> {
  if (!query) return [];
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  return res.json();
}

export function SearchBox() {
  const [inputValue, setInputValue] = useState("");
  const debouncedQuery = useDebounce(inputValue, 300);

  const { data, isLoading } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchItems(debouncedQuery),
    enabled: debouncedQuery.length > 1,  // 至少 2 個字元才查詢
    staleTime: 60 * 1000,
  });

  return (
    <div>
      <input
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        placeholder="Search..."
      />
      {isLoading && <p>Searching...</p>}
      <ul>
        {data?.map(item => <li key={item.id}>{item.title}</li>)}
      </ul>
    </div>
  );
}
```