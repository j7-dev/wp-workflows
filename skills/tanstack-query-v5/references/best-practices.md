# TanStack Query v5 Best Practices

> **最後更新**：2026-03-20 | 基於官方文件建議與 v5 常見模式

## 目錄（TOC）

- [Query Key 工廠模式](#query-key-工廠模式)
- [staleTime vs gcTime 策略](#staletime-vs-gctime-策略)
- [queryOptions() 統一管理模式](#queryoptions-統一管理模式)
- [錯誤處理模式](#錯誤處理模式)
- [快取失效策略](#快取失效策略)
- [skipToken vs enabled 選擇指南](#skiptoken-vs-enabled-選擇指南)
- [Mutation 副作用處理](#mutation-副作用處理)
- [效能優化](#效能優化)
- [TypeScript 型別最佳化](#typescript-型別最佳化)
- [DevTools 使用](#devtools-使用)
- [常見陷阱與反模式](#常見陷阱與反模式)

---

## Query Key 工廠模式

Query Key 是快取的核心。建議使用**工廠函式**集中管理，避免散落各處的魔術字串。

```typescript
// ===== Query Key 工廠（推薦模式）=====

export const todoKeys = {
  // 根 key（用於 invalidateAll）
  all: ["todos"] as const,

  // 列表（帶篩選條件）
  lists: () => [...todoKeys.all, "list"] as const,
  list: (filters: { status?: string; page?: number }) =>
    [...todoKeys.lists(), filters] as const,

  // 詳情
  details: () => [...todoKeys.all, "detail"] as const,
  detail: (id: number) => [...todoKeys.details(), id] as const,
};

// ===== 使用方式 =====

// 查詢
useQuery({
  queryKey: todoKeys.detail(42),     // ["todos", "detail", 42]
  queryFn: () => fetchTodo(42),
});

// 失效所有 todos（包含 list 與 detail）
queryClient.invalidateQueries({ queryKey: todoKeys.all });

// 只失效 todos 列表
queryClient.invalidateQueries({ queryKey: todoKeys.lists() });

// 只失效特定 todo 詳情
queryClient.invalidateQueries({ queryKey: todoKeys.detail(42) });
```

**Query Key 設計原則：**

| 原則 | 說明 |
|------|------|
| 具體到粗粒度的層次結構 | `["todos"] > ["todos", "list"] > ["todos", "detail", id]` |
| 包含所有影響資料的變數 | `["todos", { status, page }]` 而非只有 `["todos"]` |
| 使用物件描述篩選條件 | `["todos", { status: "done" }]` 比 `["todos", "done"]` 更靈活 |
| 固定型別（as const）| 確保 TypeScript 能推斷正確型別 |

---

## staleTime vs gcTime 策略

```typescript
// ===== staleTime 策略 =====

// 1. 靜態資料（永不過期）
useQuery({
  queryKey: ["config"],
  queryFn: fetchConfig,
  staleTime: Infinity,  // 應用生命週期內不重新抓取
});

// 2. 即時資料（始終過期）
useQuery({
  queryKey: ["notifications"],
  queryFn: fetchNotifications,
  staleTime: 0,           // 每次聚焦/重連都重新抓取（預設值）
  refetchInterval: 30000, // 30 秒輪詢
});

// 3. 半靜態資料（1 分鐘緩存）
useQuery({
  queryKey: ["user-profile"],
  queryFn: fetchUserProfile,
  staleTime: 60 * 1000,   // 1 分鐘內不重新抓取
});

// ===== gcTime 策略 =====

// 預設 5 分鐘通常足夠
// 以下情況考慮縮短：
// - 資料敏感（金融、醫療），不希望長時間保留在記憶體
// - 大量頁面/動態路由，避免記憶體膨脹

// 以下情況考慮延長：
// - 使用者頻繁來回切換頁面，希望返回時有快取
// - 離線應用，需要較長的快取保留期

// 重要：gcTime 必須 >= staleTime
// 若 gcTime < staleTime，快取可能在資料過期前就被清除
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,       // 1 分鐘
      gcTime: 5 * 60 * 1000,      // 5 分鐘（必須 >= staleTime）
    },
  },
});
```

---

## queryOptions() 統一管理模式

v5 推薦的 query 組織模式：集中在 `lib/queries.ts` 或按 domain 分檔。

```typescript
// lib/queries/posts.ts
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { postsApi } from "@/api/posts";

export const postQueries = {
  // 列表
  list: (filters: PostFilters) => queryOptions({
    queryKey: ["posts", "list", filters],
    queryFn: () => postsApi.list(filters),
    staleTime: 30 * 1000,
  }),

  // 詳情
  detail: (id: number) => queryOptions({
    queryKey: ["posts", "detail", id],
    queryFn: () => postsApi.get(id),
    staleTime: 60 * 1000,
  }),

  // 無限捲動
  infinite: (filter: string) => infiniteQueryOptions({
    queryKey: ["posts", "infinite", filter],
    queryFn: ({ pageParam }) => postsApi.listPage({ filter, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
  }),
};

// 跨情境重用：元件、SSR prefetch、測試

// 元件
const { data } = useQuery(postQueries.detail(id));

// Server Component
await queryClient.prefetchQuery(postQueries.detail(id));

// 型別安全的 getQueryData
const post = queryClient.getQueryData(postQueries.detail(id).queryKey);
// post: Post | undefined（不是 unknown）
```

---

## 錯誤處理模式

### 模式一：元件層級錯誤處理

```typescript
function DataView() {
  const { data, error, isError, isLoading, refetch } = useQuery({
    queryKey: ["data"],
    queryFn: fetchData,
    retry: 2,
  });

  if (isLoading) return <Skeleton />;
  if (isError) return (
    <ErrorState error={error} onRetry={() => refetch()} />
  );
  return <DataDisplay data={data} />;
}
```

### 模式二：全域 QueryCache 錯誤處理（v5 推薦）

```typescript
// 替代 v4 useQuery({ onError }) 的方式
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // meta.silent 可讓特定 query 靜默失敗
      if (query.meta?.silent) return;

      // 背景重新抓取失敗（有舊資料可顯示）
      if (query.state.data !== undefined) {
        toast.warning(`Data may be outdated: ${error.message}`);
        return;
      }

      // 首次載入失敗（由元件的 isError 狀態處理）
    },
  }),
});

// 使用 meta 標記靜默 query
useQuery({
  queryKey: ["background-sync"],
  queryFn: syncData,
  meta: { silent: true },  // 失敗時不顯示 toast
});
```

### 模式三：Error Boundary（Suspense 模式）

```typescript
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

// 元件不需要處理 loading/error 狀態
function DataComponent() {
  const { data } = useSuspenseQuery({ queryKey: ["data"], queryFn: fetchData });
  return <div>{data.value}</div>;
}

// 父層統一處理
function Page() {
  return (
    <ErrorBoundary fallbackRender={({ error, resetErrorBoundary }) => (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={resetErrorBoundary}>Retry</button>
      </div>
    )}>
      <Suspense fallback={<Skeleton />}>
        <DataComponent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

---

## 快取失效策略

```typescript
// ===== 失效粒度控制 =====

// 1. 精確失效（最精準，效能最佳）
queryClient.invalidateQueries({
  queryKey: ["todos", "detail", todoId],
  exact: true,
});

// 2. 前綴失效（失效某類資源的所有快取）
queryClient.invalidateQueries({ queryKey: ["todos"] });
// 失效 ["todos"]、["todos", "list", ...]、["todos", "detail", ...] 全部

// 3. 條件失效
queryClient.invalidateQueries({
  predicate: (query) => {
    // 只失效包含特定 tag 的 queries
    return query.queryKey.includes("user-dependent");
  },
});

// ===== 失效時機策略 =====

// A. Mutation 成功後失效（最常用）
useMutation({
  mutationFn: createTodo,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["todos"] });
  },
});

// B. onSettled 保證失效（成功或失敗都執行）
useMutation({
  mutationFn: updateTodo,
  onSettled: () => {
    // 無論成功失敗，都讓快取同步最新狀態
    queryClient.invalidateQueries({ queryKey: ["todos"] });
  },
});

// C. 直接更新快取（搭配樂觀更新後無需再失效）
useMutation({
  mutationFn: updateTodo,
  onSuccess: (updatedTodo) => {
    // 直接用伺服器回傳的最新資料更新快取
    queryClient.setQueryData(["todos", "detail", updatedTodo.id], updatedTodo);
    // 失效列表（因為順序/統計可能變更）
    queryClient.invalidateQueries({ queryKey: ["todos", "list"] });
  },
});
```

---

## skipToken vs enabled 選擇指南

| 情境 | 推薦方式 | 原因 |
|------|---------|------|
| 條件型別依賴 queryFn 參數 | `skipToken` | 型別安全，queryFn 內不需要 non-null assertion |
| 簡單開關（boolean flag） | `enabled` | 簡潔，不需要條件三元運算 |
| 搭配 `queryOptions()` | `skipToken` | `queryOptions` 的 queryFn 型別推斷更好 |
| 需要獲取 disabled query 的 `data` | `enabled: false` | `skipToken` 的 `data` 也是 `undefined` |

```typescript
// skipToken：當 queryFn 需要 non-undefined 的參數時
const { data } = useQuery({
  queryKey: ["user", userId],
  queryFn: userId ? () => fetchUser(userId) : skipToken,
  // 若用 enabled：queryFn: () => fetchUser(userId!)  ← 需要 non-null assertion
});

// enabled：簡單布林控制
const { data } = useQuery({
  queryKey: ["data"],
  queryFn: fetchData,
  enabled: isReady,  // isReady: boolean
});
```

---

## Mutation 副作用處理

### useQuery callback 移除後的替代方案

```typescript
// v4 的錯誤寫法（v5 已移除）：
// useQuery({ ..., onSuccess: (data) => { navigate(data.redirect); } });

// v5 替代方案：使用 useMutation + onSuccess
const mutation = useMutation({
  mutationFn: login,
  onSuccess: (data) => {
    navigate(data.redirectUrl);  // 導航
    toast.success("Login successful!");  // 通知
    queryClient.setQueryData(["user"], data.user);  // 更新快取
  },
  onError: (error) => {
    toast.error(error.message);
  },
});

// useMutation callbacks 與 mutate() 的 callbacks 不同：
// - useMutation 的 callbacks：元件 unmount 後也執行
// - mutate() 的 callbacks：元件 unmount 後不執行（更安全）
mutation.mutate(loginData, {
  onSuccess: () => {
    // 此 callback 在元件 unmount 後不執行
    resetForm();
  },
});
```

---

## 效能優化

### 1. select 減少重渲染

```typescript
// 只在 todos count 變更時重渲染
const { data: count } = useQuery({
  queryKey: ["todos"],
  queryFn: fetchTodos,
  select: (todos) => todos.filter(t => !t.completed).length,
  // 注意：select 函式需要穩定引用
});

// 若 select 是複雜計算，用 useCallback 穩定引用
const selectIncompleteTodos = useCallback(
  (todos: Todo[]) => todos.filter(t => !t.completed),
  []
);
const { data } = useQuery({ queryKey: ["todos"], queryFn: fetchTodos, select: selectIncompleteTodos });
```

### 2. notifyOnChangeProps 精細控制

```typescript
// 只在 data 或 error 變更時重渲染（忽略 isFetching 等狀態）
const { data, error } = useQuery({
  queryKey: ["todos"],
  queryFn: fetchTodos,
  notifyOnChangeProps: ["data", "error"],
});

// v5 預設：自動追蹤（存取哪些屬性就追蹤哪些）
// 大多數情況不需要手動設定
```

### 3. 預先抓取（Prefetch）

```typescript
// 滑鼠懸停時 prefetch
function TodoLink({ id }: { id: number }) {
  const queryClient = useQueryClient();

  return (
    <Link
      to={`/todos/${id}`}
      onMouseEnter={() => {
        queryClient.prefetchQuery({
          queryKey: ["todos", "detail", id],
          queryFn: () => fetchTodo(id),
          staleTime: 30 * 1000,
        });
      }}
    >
      Todo #{id}
    </Link>
  );
}
```

### 4. initialData 與 placeholderData 的選擇

| | `initialData` | `placeholderData` |
|---|---|---|
| 資料來源 | 持久化到快取 | 不持久化（僅顯示用） |
| `isPlaceholderData` | `false` | `true` |
| 是否觸發背景重新抓取 | 依 `staleTime` | 是（若 staleTime 已過） |
| 適用場景 | 來自父元件的同步資料 | 分頁切換、舊查詢結果過渡 |

---

## TypeScript 型別最佳化

```typescript
import { useQuery, UseQueryResult } from "@tanstack/react-query";

// 1. 指定型別參數
// 泛型順序：TData, TError, TSelectData, TQueryKey
const { data } = useQuery<Todo[], Error, Todo[], ["todos"]>({
  queryKey: ["todos"],
  queryFn: (): Promise<Todo[]> => fetchTodos(),
});

// 2. 讓 TypeScript 自動推斷（推薦）
// queryFn 返回型別會自動成為 data 的型別
const { data } = useQuery({
  queryKey: ["todos"],
  queryFn: (): Promise<Todo[]> => fetchTodos(),
  // data: Todo[] | undefined
});

// 3. 使用 queryOptions 獲得最佳型別推斷
const opts = queryOptions({
  queryKey: ["todos"],
  queryFn: (): Promise<Todo[]> => fetchTodos(),
});
const { data } = useQuery(opts);  // data: Todo[] | undefined

// 4. select 的型別轉換
const { data: count } = useQuery({
  queryKey: ["todos"],
  queryFn: (): Promise<Todo[]> => fetchTodos(),
  select: (todos) => todos.length,
  // data: number | undefined
});

// 5. 錯誤型別
// v5 預設 error: Error | null
// 若後端返回自訂錯誤，需要型別轉換：
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const { error } = useQuery<Todo[], ApiError>({
  queryKey: ["todos"],
  queryFn: async () => {
    const res = await fetch("/api/todos");
    if (!res.ok) throw new ApiError(res.status, res.statusText);
    return res.json();
  },
});
if (error?.status === 401) { /* handle auth */ }
```

---

## DevTools 使用

```bash
npm install @tanstack/react-query-devtools
```

```typescript
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      {/* 只在開發環境顯示，生產環境不打包 */}
      <ReactQueryDevtools
        initialIsOpen={false}
        buttonPosition="bottom-right"
      />
    </QueryClientProvider>
  );
}
```

DevTools 功能：
- 查看所有 queries 的狀態（fresh/stale/fetching/paused）
- 查看 queryKey 和快取資料
- 手動觸發 refetch、invalidate、remove
- 查看 mutation 歷史

---

## 常見陷阱與反模式

### 陷阱 1：在 render 期間建立 queryClient

```typescript
// 錯誤：每次 render 建立新的 QueryClient，失去快取
function App() {
  const queryClient = new QueryClient();  // BAD
  return <QueryClientProvider client={queryClient}>...</QueryClientProvider>;
}

// 正確：在模組層級建立，或使用 useState 確保只建立一次
const queryClient = new QueryClient();  // GOOD
function App() {
  return <QueryClientProvider client={queryClient}>...</QueryClientProvider>;
}

// 或（SSR 時需要避免跨請求共享狀態）：
function App() {
  const [queryClient] = useState(() => new QueryClient());  // GOOD for SSR
  return <QueryClientProvider client={queryClient}>...</QueryClientProvider>;
}
```

### 陷阱 2：queryKey 未包含所有依賴

```typescript
// 錯誤：page 變化但 queryKey 不變，快取不更新
function Pagination({ page }: { page: number }) {
  const { data } = useQuery({
    queryKey: ["todos"],  // BAD：缺少 page
    queryFn: () => fetchTodos({ page }),
  });
}

// 正確
function Pagination({ page }: { page: number }) {
  const { data } = useQuery({
    queryKey: ["todos", { page }],  // GOOD
    queryFn: () => fetchTodos({ page }),
  });
}
```

### 陷阱 3：在 useQuery 中有副作用（v5 已移除但仍需注意）

```typescript
// 錯誤（v5 中 onSuccess 已移除，此為概念說明）：
// onSuccess 可能在 React StrictMode 中 fire 兩次

// 正確：副作用放在 useMutation 或 useEffect
const { data } = useQuery({ queryKey: ["user"], queryFn: fetchUser });
useEffect(() => {
  if (data?.role === "admin") {
    initAdminFeatures();
  }
}, [data?.role]);
```

### 陷阱 4：select 函式引用不穩定

```typescript
// 問題：每次 render 都建立新函式，觸發不必要的重渲染
const { data } = useQuery({
  queryKey: ["todos"],
  queryFn: fetchTodos,
  select: (todos) => todos.filter(t => !t.completed),  // 每次 render 都是新函式
});

// 正確：定義在元件外（無捕獲變數）
const selectActiveTodos = (todos: Todo[]) => todos.filter(t => !t.completed);

const { data } = useQuery({
  queryKey: ["todos"],
  queryFn: fetchTodos,
  select: selectActiveTodos,  // 穩定引用
});
```

### 陷阱 5：isPending 誤用（v5 特有）

```typescript
// 問題：isPending 在 enabled: false 時也為 true
const { data, isPending } = useQuery({
  queryKey: ["user", userId],
  queryFn: () => fetchUser(userId!),
  enabled: !!userId,
});

// 錯誤：userId 為空時 isPending = true，顯示了 loading spinner
if (isPending) return <Spinner />;  // BAD when enabled can be false

// 正確：使用 isLoading（isPending && isFetching）
if (!userId) return null;       // 先處理無 userId 的情況
if (isLoading) return <Spinner />;  // isLoading = isPending && isFetching
```