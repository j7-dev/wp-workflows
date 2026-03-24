# TanStack Query v5 API Reference

> **來源**：https://tanstack.com/query/latest/docs/framework/react/reference/ | **最後更新**：2026-03-20

## 目錄（TOC）

- [useQuery](#usequery)
- [useMutation](#usemutation)
- [useInfiniteQuery](#useinfinitequery)
- [useSuspenseQuery](#usesuspensequery)
- [useQueries](#usequeries)
- [queryOptions() Helper](#queryoptions-helper)
- [infiniteQueryOptions() Helper](#infinitequeryoptions-helper)
- [skipToken](#skiptoken)
- [QueryClient](#queryclient)
- [QueryClientProvider / useQueryClient](#queryclientprovider--usequestclient)
- [QueryFunctionContext](#queryfunctioncontext)
- [QueryFilters](#queryfilters)

---

## useQuery

```typescript
import { useQuery } from "@tanstack/react-query";

const result = useQuery(options);
```

### Options

| 參數 | 型別 | 預設值 | 說明 |
|------|------|--------|------|
| `queryKey` | `unknown[]` | **必填** | 唯一識別此查詢的 key，用於快取、去重、刷新 |
| `queryFn` | `(context: QueryFunctionContext) => Promise<TData>` | **必填** | 執行實際資料抓取的函式 |
| `enabled` | `boolean` | `true` | `false` 時阻止查詢自動執行 |
| `staleTime` | `number \| Infinity` | `0` | 資料被視為新鮮（fresh）的時間 (ms)；`Infinity` = 永不過期 |
| `gcTime` | `number \| Infinity` | `5 * 60 * 1000` | 無 observer 時快取保留時間 (ms)；v5 取代 v4 `cacheTime` |
| `retry` | `boolean \| number \| (failureCount, error) => boolean` | `3` | 失敗重試次數或邏輯 |
| `retryDelay` | `number \| (attempt, error) => number` | 指數退避 | 重試延遲 (ms) |
| `retryOnMount` | `boolean` | `true` | 元件掛載時若有錯誤是否重試 |
| `refetchOnMount` | `boolean \| "always"` | `true` | 掛載時是否重新抓取 |
| `refetchOnWindowFocus` | `boolean \| "always"` | `true` | 視窗聚焦時是否重新抓取 |
| `refetchOnReconnect` | `boolean \| "always"` | `true` | 網路重連時是否重新抓取 |
| `refetchInterval` | `number \| false \| ((query) => number \| false)` | `false` | 輪詢間隔 (ms) |
| `refetchIntervalInBackground` | `boolean` | `false` | 視窗不在前景時是否繼續輪詢 |
| `placeholderData` | `TData \| (previousData, previousQuery) => TData \| undefined` | `undefined` | v5 取代 `keepPreviousData` |
| `select` | `(data: TData) => TSelected` | `undefined` | 轉換或選取快取資料的子集 |
| `initialData` | `TData \| () => TData` | `undefined` | 初始快取資料（被視為成功狀態） |
| `initialDataUpdatedAt` | `number` | `undefined` | 指定 `initialData` 的時間戳記 |
| `throwOnError` | `boolean \| (error, query) => boolean` | `false` | 錯誤時拋出至最近的 error boundary |
| `meta` | `Record<string, unknown>` | `undefined` | 傳遞給 `queryFn` 與 `QueryCache` 的任意元資料 |
| `networkMode` | `"online" \| "always" \| "offlineFirst"` | `"online"` | 離線模式行為控制 |
| `notifyOnChangeProps` | `string[] \| "all"` | 自動追蹤 | 指定哪些 result 屬性變更時觸發重渲染 |
| `structuralSharing` | `boolean \| (oldData, newData) => TData` | `true` | 深比較資料結構，避免不必要的重渲染 |

> **[v5 移除]** `onSuccess`、`onError`、`onSettled`、`keepPreviousData`、`cacheTime`、`remove()` 方法

### 返回值

| 屬性 | 型別 | 說明 |
|------|------|------|
| `status` | `"pending" \| "error" \| "success"` | 查詢狀態；v5 `"loading"` 改為 `"pending"` |
| `fetchStatus` | `"fetching" \| "paused" \| "idle"` | 網路請求狀態 |
| `data` | `TData \| undefined` | 查詢結果 |
| `error` | `TError \| null` | 錯誤物件 |
| `isPending` | `boolean` | `status === "pending"`（含 disabled query） |
| `isLoading` | `boolean` | `isPending && isFetching`（首次載入，v5 中為 alias） |
| `isError` | `boolean` | `status === "error"` |
| `isSuccess` | `boolean` | `status === "success"` |
| `isFetching` | `boolean` | 後台請求進行中（含首次與重新抓取） |
| `isRefetching` | `boolean` | `isFetching && !isPending`（非首次的重新抓取） |
| `isStale` | `boolean` | 資料超過 staleTime |
| `isPlaceholderData` | `boolean` | 目前顯示的是 placeholderData |
| `dataUpdatedAt` | `number` | 上次成功更新的時間戳記 |
| `errorUpdatedAt` | `number` | 上次錯誤的時間戳記 |
| `failureCount` | `number` | 連續失敗次數 |
| `failureReason` | `TError \| null` | 上次失敗原因 |
| `refetch` | `(options?) => Promise<QueryObserverResult>` | 手動觸發重新抓取 |
---

## useMutation

```typescript
import { useMutation } from "@tanstack/react-query";

const mutation = useMutation(options);
```

### Options

| 參數 | 型別 | 預設值 | 說明 |
|------|------|--------|------|
| `mutationFn` | `(variables: TVariables) => Promise<TData>` | **必填** | 執行 mutation 的函式 |
| `mutationKey` | `unknown[]` | `undefined` | 識別 mutation 的 key（用於 DevTools 與全域 callbacks） |
| `onMutate` | `(variables) => Promise<TContext> \| TContext` | `undefined` | mutation 開始前執行（樂觀更新用） |
| `onSuccess` | `(data, variables, context) => Promise<void> \| void` | `undefined` | mutation 成功後執行 |
| `onError` | `(error, variables, context) => Promise<void> \| void` | `undefined` | mutation 失敗後執行 |
| `onSettled` | `(data, error, variables, context) => Promise<void> \| void` | `undefined` | mutation 完成後執行 |
| `retry` | `boolean \| number \| (failureCount, error) => boolean` | `0` | 失敗重試邏輯 |
| `gcTime` | `number \| Infinity` | `5 * 60 * 1000` | mutation 結果快取時間 |
| `throwOnError` | `boolean \| (error) => boolean` | `false` | 錯誤時拋出 |
| `meta` | `Record<string, unknown>` | `undefined` | 任意元資料 |

> **[v5 保留]** `onSuccess`、`onError`、`onSettled` 在 `useMutation` 中保留（只從 `useQuery` 移除）

### 返回值

| 屬性 | 型別 | 說明 |
|------|------|------|
| `mutate` | `(variables, callbacks?) => void` | 觸發 mutation（fire-and-forget） |
| `mutateAsync` | `(variables, callbacks?) => Promise<TData>` | 觸發 mutation（可 await） |
| `status` | `"idle" \| "pending" \| "error" \| "success"` | mutation 狀態 |
| `isPending` | `boolean` | mutation 執行中 |
| `isIdle` | `boolean` | mutation 尚未執行或已 reset |
| `isSuccess` | `boolean` | mutation 成功 |
| `isError` | `boolean` | mutation 失敗 |
| `data` | `TData \| undefined` | mutation 回傳資料 |
| `error` | `TError \| null` | 錯誤物件 |
| `variables` | `TVariables \| undefined` | 傳入的 variables |
| `reset` | `() => void` | 重設 mutation 狀態至 idle |

---

## useInfiniteQuery

```typescript
import { useInfiniteQuery } from "@tanstack/react-query";

const result = useInfiniteQuery(options);
```

### Options（繼承 useQuery options，以下為差異項）

| 參數 | 型別 | 預設值 | 說明 |
|------|------|--------|------|
| `queryFn` | `(context: InfiniteQueryFunctionContext) => Promise<TData>` | **必填** | `context` 含 `pageParam` |
| `initialPageParam` | `TPageParam` | **必填**（v5 新增） | 第一頁的 pageParam 值 |
| `getNextPageParam` | `(lastPage, allPages, lastPageParam, allPageParams) => TPageParam \| undefined` | **必填** | 返回 `undefined` 表示無下一頁 |
| `getPreviousPageParam` | `(firstPage, allPages, firstPageParam, allPageParams) => TPageParam \| undefined` | `undefined` | 雙向無限捲動用 |
| `maxPages` | `number` | `undefined` | v5 新增；限制保留在快取中的頁數 |

### 返回值（繼承 useQuery 返回值，以下為差異項）

| 屬性 | 型別 | 說明 |
|------|------|------|
| `data.pages` | `TData[]` | 所有已載入頁面的資料陣列 |
| `data.pageParams` | `TPageParam[]` | 所有已使用的 pageParam 陣列 |
| `fetchNextPage` | `(options?) => Promise<...>` | 載入下一頁 |
| `fetchPreviousPage` | `(options?) => Promise<...>` | 載入上一頁 |
| `hasNextPage` | `boolean` | `getNextPageParam` 未返回 `undefined/null` |
| `hasPreviousPage` | `boolean` | `getPreviousPageParam` 未返回 `undefined/null` |
| `isFetchingNextPage` | `boolean` | 正在載入下一頁 |
| `isFetchingPreviousPage` | `boolean` | 正在載入上一頁 |

---

## useSuspenseQuery

```typescript
import { useSuspenseQuery } from "@tanstack/react-query";

const { data } = useSuspenseQuery(options);
// data 型別：TData（非 undefined）
```

- `data` 永遠有值（不是 `undefined`）—— Suspense 邊界處理 pending，ErrorBoundary 處理 error
- 不支援 `enabled` 選項
- 不支援 `placeholderData`
- `throwOnError` 預設為 `true`
- 父層必須包含 `<Suspense>` 與 `<ErrorBoundary>`

```typescript
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";

function TodoList() {
  const { data } = useSuspenseQuery({
    queryKey: ["todos"],
    queryFn: fetchTodos,
  });
  return <ul>{data.map(t => <li key={t.id}>{t.title}</li>)}</ul>;
}

function App() {
  return (
    <ErrorBoundary fallback={<p>Error occurred</p>}>
      <Suspense fallback={<p>Loading...</p>}>
        <TodoList />
      </Suspense>
    </ErrorBoundary>
  );
}
```

相關 hooks：`useSuspenseInfiniteQuery`、`useSuspenseQueries`

---

## useQueries

```typescript
import { useQueries } from "@tanstack/react-query";

// 不使用 combine：返回 QueryObserverResult[]
const results = useQueries({
  queries: ids.map(id => ({
    queryKey: ["todo", id],
    queryFn: () => fetchTodo(id),
  })),
});

// 使用 combine（v5 新增）：返回自訂型別
const { todos, isPending } = useQueries({
  queries: ids.map(id => ({
    queryKey: ["todo", id],
    queryFn: () => fetchTodo(id),
  })),
  combine: (results) => ({
    todos: results.map(r => r.data).filter(Boolean),
    isPending: results.some(r => r.isPending),
    errors: results.filter(r => r.isError).map(r => r.error),
  }),
});
```
---

## queryOptions() Helper

v5 新增的型別安全 query factory helper。確保 `queryKey` 與 `queryFn` 在跨情境使用時型別同步。

```typescript
import { queryOptions } from "@tanstack/react-query";

const todoQueryOptions = (id: number) => queryOptions({
  queryKey: ["todo", id],
  queryFn: () => fetchTodo(id),
  staleTime: 5 * 60 * 1000,
});

// 在元件中
const { data } = useQuery(todoQueryOptions(42));

// 在 prefetch（Server Component）
await queryClient.prefetchQuery(todoQueryOptions(42));

// 讀取快取（型別安全）
const cached = queryClient.getQueryData(todoQueryOptions(42).queryKey);
// cached: Todo | undefined（而非 unknown）
```

---

## infiniteQueryOptions() Helper

```typescript
import { infiniteQueryOptions } from "@tanstack/react-query";

const projectsInfiniteOptions = (filter: string) => infiniteQueryOptions({
  queryKey: ["projects", filter],
  queryFn: ({ pageParam }) => fetchProjects({ filter, cursor: pageParam }),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

const query = useInfiniteQuery(projectsInfiniteOptions("active"));
await queryClient.prefetchInfiniteQuery(projectsInfiniteOptions("active"));
```

---

## skipToken

v5 新增的 sentinel value，用於條件查詢。提供比 `enabled: false` 更好的 TypeScript 型別推斷。

```typescript
import { skipToken, useQuery } from "@tanstack/react-query";

const { data } = useQuery({
  queryKey: ["user", userId],
  queryFn: userId ? () => fetchUser(userId) : skipToken,
  // userId 為 undefined/null/0 時，queryFn = skipToken，查詢不執行
  // userId 有值時，queryFn = () => fetchUser(userId)（型別安全）
});
```

---

## QueryClient

```typescript
import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

### 查詢操作方法

| 方法 | 簽名 | 說明 |
|------|------|------|
| `fetchQuery` | `(options) => Promise<TData>` | 抓取資料並存入快取 |
| `prefetchQuery` | `(options) => Promise<void>` | 預先抓取，不返回結果（SSR 用） |
| `getQueryData` | `(queryKey) => TData \| undefined` | 同步讀取快取（不觸發請求） |
| `setQueryData` | `(queryKey, updater, options?) => TData` | 直接更新快取 |
| `getQueriesData` | `(filters) => [QueryKey, TData][]` | 讀取多個快取 |
| `setQueriesData` | `(filters, updater, options?) => [QueryKey, TData][]` | 批量更新快取 |
| `invalidateQueries` | `(filters?, options?) => Promise<void>` | 標記為 stale 並重新抓取 |
| `refetchQueries` | `(filters?, options?) => Promise<void>` | 強制立即重新抓取 |
| `cancelQueries` | `(filters?) => Promise<void>` | 取消進行中的請求 |
| `removeQueries` | `(filters?) => void` | 從快取中移除（v5 取代 `result.remove()`） |
| `resetQueries` | `(filters?, options?) => Promise<void>` | 重設為 initialData 狀態 |
| `clear` | `() => void` | 清除所有快取 |
| `fetchInfiniteQuery` | `(options) => Promise<InfiniteData<TData>>` | 抓取 infinite query |
| `prefetchInfiniteQuery` | `(options) => Promise<void>` | 預先抓取 infinite query |
| `isFetching` | `(filters?) => number` | 進行中的請求數量 |
| `isMutating` | `(filters?) => number` | 進行中的 mutation 數量 |

### setQueryData updater 模式

```typescript
// 直接設定值
queryClient.setQueryData(["todos"], newTodos);

// updater 函式（安全處理 undefined）
queryClient.setQueryData<Todo[]>(["todos"], (old = []) => [
  ...old,
  newTodo,
]);

// 更新單一項目
queryClient.setQueryData<Todo[]>(["todos"], (old = []) =>
  old.map(todo => todo.id === updatedTodo.id ? updatedTodo : todo)
);
```

### invalidateQueries 精確控制

```typescript
queryClient.invalidateQueries({ queryKey: ["todos"] });

queryClient.invalidateQueries({
  queryKey: ["todos", { status: "done" }],
  exact: true,
});

queryClient.invalidateQueries({
  queryKey: ["todos"],
  refetchType: "none",  // 只標記為 stale，不觸發重新抓取
});
```

---

## QueryClientProvider / useQueryClient

```typescript
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  );
}

function SomeComponent() {
  const queryClient = useQueryClient();
  // queryClient.invalidateQueries(...)
}
```

---

## QueryFunctionContext

```typescript
type QueryFunctionContext<TQueryKey extends QueryKey = QueryKey> = {
  queryKey: TQueryKey;
  signal: AbortSignal;           // 用於取消請求
  meta: Record<string, unknown> | undefined;
  // Infinite Query 額外屬性：
  pageParam?: TPageParam;
  direction?: "forward" | "backward";
};

// 正確使用 signal 取消請求
const queryFn = ({ queryKey, signal }: QueryFunctionContext) =>
  fetch(`/api/todos?id=${queryKey[1]}`, { signal }).then(r => r.json());
```

---

## QueryFilters

```typescript
type QueryFilters = {
  queryKey?: QueryKey;
  exact?: boolean;
  type?: "active" | "inactive" | "all";
  stale?: boolean;
  predicate?: (query: Query) => boolean;
  fetchStatus?: "fetching" | "paused" | "idle";
};

// 範例：只失效 active 且 stale 的 todos
queryClient.invalidateQueries({
  queryKey: ["todos"],
  type: "active",
  stale: true,
});
```

---

## QueryCache / MutationCache（全域 callbacks）

```typescript
import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // 全域錯誤處理（取代 useQuery 移除的 onError）
      console.error(`Query ${String(query.queryKey)} failed:`, error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      toast.error(error.message);
    },
  }),
});
```

---

## HydrationBoundary（SSR）

```typescript
import {
  QueryClient,
  dehydrate,
  HydrationBoundary,  // v5: 取代 v4 的 Hydrate
} from "@tanstack/react-query";

// Next.js App Router Server Component
async function Page({ params }: { params: { id: string } }) {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["post", params.id],
    queryFn: () => fetchPost(params.id),
  });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostDetail id={params.id} />
    </HydrationBoundary>
  );
}
```