---
name: tanstack-query-v5
description: >
  TanStack Query (React Query) v5 完整技術參考，對應 @tanstack/react-query ^5.90.x。
  當程式碼涉及 useQuery、useMutation、useInfiniteQuery、useSuspenseQuery、
  useQueries、QueryClient、QueryClientProvider、queryOptions、keepPreviousData、
  placeholderData、gcTime、isPending、HydrationBoundary、useQueryClient、
  invalidateQueries、prefetchQuery、usePrefetchQuery、infiniteQueryOptions、
  mutationOptions、skipToken、@tanstack/react-query 時，必須使用此 skill。
  這是 v5，與 v4 有重大 breaking changes：gcTime 取代 cacheTime、
  isPending 取代 isLoading、移除 useQuery 的 onSuccess/onError/onSettled、
  keepPreviousData 改用 placeholderData identity function、只接受 object 語法、
  Hydrate 改名 HydrationBoundary、initialPageParam 成為 useInfiniteQuery 必填。
  專案使用 ^5.x 時必須使用此 skill，不可使用 tanstack-query-v4 skill。
  v5 最低需求：React 18、TypeScript 4.7+。
---
# TanStack Query v5 (@tanstack/react-query)

> **適用版本**：^5.x (5.90.x+) | **文件來源**：https://tanstack.com/query/latest/docs/framework/react/ | **最後更新**：2026-03-20
> **最低需求**：React 18+、TypeScript 4.7+

TanStack Query 是 React 的非同步狀態管理函式庫，提供資料抓取、快取、同步與更新功能。v5 是重大版本，與 v4 有多處 breaking changes。

---

## v4 → v5 Breaking Changes 速查表

| v4 | v5 | 說明 |
|----|----|------|
| `cacheTime` | `gcTime` | Garbage collection time 重新命名 |
| `isLoading` | `isPending` | 更精確描述查詢狀態 |
| `keepPreviousData: true` | `placeholderData: (prev) => prev` | 改為 identity function |
| `onSuccess/onError/onSettled` (useQuery) | 已移除 | 僅 useMutation 保留 |
| `useQuery(key, fn, opts)` | `useQuery({ queryKey, queryFn, ...opts })` | 強制 object 語法 |
| `Hydrate` | `HydrationBoundary` | 組件重新命名 |
| `useInfiniteQuery` (無 initialPageParam) | `useInfiniteQuery({ initialPageParam })` | 必填參數 |
| `getNextPageParam` 接收 `lastPage, pages` | 同，但多了 `allPageParams` 第三參數 | |
| `status: "loading"` | `status: "pending"` | 狀態值改名 |
| `enabled: false` 時 `status: "success"` | `enabled: false` 時 `status: "pending", fetchStatus: "idle"` | |
| `QueryObserverResult.isLoading` | `isPending && isFetching` (首次載入) | |
| `dehydrate/hydrate` import | 從 `@tanstack/react-query` 直接 import | |
| `useQuery` 返回 `remove()` | 已移除，改用 `queryClient.removeQueries` | |
| `notifyOnChangeProps: "tracked"` | 已移除，預設即追蹤 | |
| 函式型 `queryKey` | 已移除，必須是靜態陣列 | |

---

## 核心 API 速查

### useQuery

```typescript
import { useQuery } from "@tanstack/react-query";

const result = useQuery({
  queryKey: ["todos", { status, page }],    // 必填：唯一識別快取的 key
  queryFn: ({ queryKey, signal, meta }) => fetchTodos(queryKey[1]),  // 必填
  enabled: true,                             // 是否執行查詢
  staleTime: 0,                              // 資料過期時間(ms)，0=立即過期
  gcTime: 5 * 60 * 1000,                    // 快取保留時間(ms)，預設5分鐘
  retry: 3,                                  // 失敗重試次數
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  refetchOnWindowFocus: true,               // 視窗聚焦時重新抓取
  refetchInterval: false,                   // 輪詢間隔(ms)
  placeholderData: (prev) => prev,          // v5: 取代 keepPreviousData
  select: (data) => data.filter(todo => todo.done),  // 轉換資料
  initialData: undefined,                   // 初始資料（不會觸發查詢）
  throwOnError: false,                      // 是否拋出錯誤（Suspense 用）
  meta: {},                                  // 傳遞給 queryFn 的額外資料
});

// 返回值
const {
  data,          // 查詢結果（T | undefined）
  error,         // 錯誤（E | null）
  status,        // "pending" | "error" | "success"
  isPending,     // status === "pending"（v5: 取代 isLoading 的語意）
  isError,       // status === "error"
  isSuccess,     // status === "success"
  isFetching,    // 後台抓取中（含初次）
  isLoading,     // isPending && isFetching（v5: 首次載入中）
  isRefetching,  // isFetching && !isPending（重新抓取，非首次）
  fetchStatus,   // "fetching" | "paused" | "idle"
  refetch,       // () => Promise<QueryObserverResult>
  dataUpdatedAt, // number（時間戳）
} = result;
```

### useMutation

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: (newTodo: CreateTodoInput) => createTodo(newTodo),
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey: ["todos"] });
    const previousTodos = queryClient.getQueryData(["todos"]);
    queryClient.setQueryData(["todos"], (old) => [...old, { ...variables, id: "temp" }]);
    return { previousTodos };
  },
  onError: (error, variables, context) => {
    queryClient.setQueryData(["todos"], context.previousTodos);
  },
  onSuccess: (data, variables, context) => {
    queryClient.invalidateQueries({ queryKey: ["todos"] });
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["todos"] });
  },
  retry: 0,
  gcTime: 5 * 60 * 1000,
});

const { mutate, mutateAsync, isPending, isError, isSuccess, data, error, reset } = mutation;
// mutate(variables, { onSuccess, onError, onSettled })
// mutateAsync(variables) -> Promise<TData>
```

### useInfiniteQuery

```typescript
import { useInfiniteQuery } from "@tanstack/react-query";

const query = useInfiniteQuery({
  queryKey: ["projects"],
  queryFn: ({ pageParam }) => fetchProjects({ cursor: pageParam }),
  initialPageParam: 0,                          // v5: 必填！
  getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) =>
    lastPage.nextCursor ?? undefined,
  getPreviousPageParam: (firstPage, allPages, firstPageParam, allPageParams) =>
    firstPage.prevCursor ?? undefined,
  maxPages: 5,                                  // v5 新增：限制快取頁數
});

const {
  data,               // { pages: TData[], pageParams: TPageParam[] }
  fetchNextPage,
  fetchPreviousPage,
  hasNextPage,
  hasPreviousPage,
  isFetchingNextPage,
  isFetchingPreviousPage,
} = query;
```

### useSuspenseQuery (v5 新增)

```typescript
import { useSuspenseQuery } from "@tanstack/react-query";

function TodoList() {
  const { data } = useSuspenseQuery({
    queryKey: ["todos"],
    queryFn: fetchTodos,
  });
  // data: Todo[] (永遠不是 undefined)
  return <ul>{data.map(todo => <li key={todo.id}>{todo.title}</li>)}</ul>;
}
// 父層必須有 <Suspense> 和 <ErrorBoundary>
```

### useQueries

```typescript
import { useQueries } from "@tanstack/react-query";

const results = useQueries({
  queries: ids.map(id => ({
    queryKey: ["todo", id],
    queryFn: () => fetchTodo(id),
  })),
  combine: (results) => ({           // v5 新增 combine 選項
    data: results.map(r => r.data),
    isPending: results.some(r => r.isPending),
  }),
});
```

### queryOptions (v5 新增)

```typescript
import { queryOptions } from "@tanstack/react-query";

const todoQueryOptions = (id: number) => queryOptions({
  queryKey: ["todo", id],
  queryFn: () => fetchTodo(id),
  staleTime: 5000,
});

// 跨情境重用（queryKey 和 queryFn 型別同步）
useQuery(todoQueryOptions(1));
queryClient.prefetchQuery(todoQueryOptions(1));
queryClient.getQueryData(todoQueryOptions(1).queryKey);
```

### skipToken (v5 新增)

```typescript
import { skipToken, useQuery } from "@tanstack/react-query";

// 型別安全的條件查詢，取代 enabled: false 搭配型別問題
const query = useQuery({
  queryKey: ["user", userId],
  queryFn: userId ? () => fetchUser(userId) : skipToken,
});
```

---

## QueryClient 常用方法

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, gcTime: 10 * 60 * 1000 },
    mutations: { retry: 0 },
  },
});

queryClient.invalidateQueries({ queryKey: ["todos"] });  // 失效並重新抓取
queryClient.refetchQueries({ queryKey: ["todos"] });     // 強制重新抓取
queryClient.setQueryData(["todo", 1], updater);          // 更新快取
queryClient.getQueryData(["todo", 1]);                   // 讀取快取（同步）
queryClient.fetchQuery({ queryKey, queryFn });           // 抓取並快取
queryClient.prefetchQuery({ queryKey, queryFn });        // 預先抓取（無返回值）
queryClient.removeQueries({ queryKey: ["todos"] });      // 移除快取
queryClient.cancelQueries({ queryKey: ["todos"] });      // 取消進行中請求
queryClient.getQueriesData({ queryKey: ["todos"] });     // 取得多個快取
queryClient.setQueriesData({ queryKey: ["todos"] }, updater);
queryClient.resetQueries({ queryKey: ["todos"] });       // 重設為 initialData
queryClient.clear();                                     // 清除所有快取
```

---

## 常用模式

### 依賴查詢（Dependent Queries）

```typescript
const { data: user } = useQuery({
  queryKey: ["user", userId],
  queryFn: () => fetchUser(userId),
});

const { data: projects } = useQuery({
  queryKey: ["projects", user?.id],
  queryFn: () => fetchProjects(user!.id),
  enabled: !!user?.id,
});
```

### 樂觀更新（Optimistic Updates）

```typescript
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (updatedTodo) => {
    await queryClient.cancelQueries({ queryKey: ["todos"] });
    const snapshot = queryClient.getQueryData<Todo[]>(["todos"]);
    queryClient.setQueryData<Todo[]>(["todos"], (old = []) =>
      old.map(todo => todo.id === updatedTodo.id ? { ...todo, ...updatedTodo } : todo)
    );
    return { snapshot };
  },
  onError: (_err, _vars, context) => {
    queryClient.setQueryData(["todos"], context?.snapshot);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["todos"] });
  },
});
```

### 無限捲動（Infinite Scroll）

```typescript
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

function InfiniteList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["items"],
    queryFn: ({ pageParam }) => fetchItems({ cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const { ref, inView } = useInView();
  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  return (
    <>
      {data?.pages.flatMap(page => page.items).map(item => (
        <Item key={item.id} item={item} />
      ))}
      <div ref={ref}>{isFetchingNextPage ? "Loading..." : null}</div>
    </>
  );
}
```

### SSR / Hydration

```typescript
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

// Next.js Server Component
async function Page() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["todos"],
    queryFn: fetchTodos,
  });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TodoList />
    </HydrationBoundary>
  );
}
```

---

## 注意事項與陷阱

**[v5 嚴重陷阱]** `onSuccess/onError/onSettled` 已從 `useQuery` 移除
  - 解法：在 `useMutation.onSuccess` 處理副作用；全域錯誤處理用 `QueryCache({ onError })`

**[v5 嚴重陷阱]** `useInfiniteQuery` 必須提供 `initialPageParam`，省略會有 TypeScript 錯誤

**[v5 型別陷阱]** `isPending` 不等於「首次載入中」
  - `isPending = status === "pending"` 涵蓋 disabled query
  - 首次載入：使用 `isLoading`（alias for `isPending && isFetching`）

**[v5 陷阱]** `enabled: false` 的 query：`status: "pending"`, `fetchStatus: "idle"`（不是 "success"）

**[效能]** `select` 函式需穩定引用（定義在 component 外或用 useCallback）

**[v5 陷阱]** `keepPreviousData` utility 需從 `@tanstack/react-query` import：
```typescript
import { keepPreviousData } from "@tanstack/react-query";
// 使用：placeholderData: keepPreviousData
```

---

## References 導引

| 需求 | 參閱檔案 |
|------|--------|
| 完整 API 簽名、所有 options、TypeScript 型別 | `references/api-reference.md` |
| 完整可執行範例（含 import）| `references/examples.md` |
| v4 → v5 完整 Migration 指南與逐條說明 | `references/migration-v4-to-v5.md` |
| 快取策略、效能優化、整合模式 | `references/best-practices.md` |
