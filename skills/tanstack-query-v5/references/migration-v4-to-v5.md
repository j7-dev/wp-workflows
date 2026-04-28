# TanStack Query v4 → v5 Migration Guide

> **來源**：https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5 | **最後更新**：2026-03-20

## 目錄（TOC）

- [概覽：v5 設計目標](#概覽v5-設計目標)
- [最低版本需求](#最低版本需求)
- [Breaking Change 1：強制 Object 語法](#breaking-change-1強制-object-語法)
- [Breaking Change 2：cacheTime → gcTime](#breaking-change-2cachetime--gctime)
- [Breaking Change 3：isLoading → isPending](#breaking-change-3isloading--ispending)
- [Breaking Change 4：useQuery 移除 onSuccess/onError/onSettled](#breaking-change-4usequery-移除-onsuccessonerroronsettled)
- [Breaking Change 5：keepPreviousData → placeholderData](#breaking-change-5keeppreviousdata--placeholderdata)
- [Breaking Change 6：useInfiniteQuery 必填 initialPageParam](#breaking-change-6useinfinitequery-必填-initialpageparam)
- [Breaking Change 7：Hydrate → HydrationBoundary](#breaking-change-7hydrate--hydrationboundary)
- [Breaking Change 8：status "loading" → "pending"](#breaking-change-8status-loading--pending)
- [Breaking Change 9：result.remove() 移除](#breaking-change-9resultremove-移除)
- [Breaking Change 10：enabled: false 的狀態變更](#breaking-change-10enabled-false-的狀態變更)
- [Breaking Change 11：notifyOnChangeProps 移除 "tracked"](#breaking-change-11notifyonchangeprops-移除-tracked)
- [Breaking Change 12：函式型 queryKey 移除](#breaking-change-12函式型-querykey-移除)
- [Breaking Change 13：getNextPageParam 增加參數](#breaking-change-13getnextpageparam-增加參數)
- [v5 新增 API](#v5-新增-api)
- [自動遷移 Codemod](#自動遷移-codemod)

---

## 概覽：v5 設計目標

| 目標 | 改動 |
|------|------|
| 減少 API 歧義 | 統一 object 語法、移除混淆的 `isLoading` 語意 |
| 強化 TypeScript 支援 | `queryOptions()`、`skipToken`、型別安全的 `getQueryData` |
| 改善 Suspense 整合 | 首次設計 `useSuspenseQuery`（不再是實驗性功能） |
| 簡化無限查詢 | 強制 `initialPageParam`，邏輯更清晰 |
| 移除歷史包袱 | `onSuccess/onError/onSettled` 從 `useQuery` 移除，防止 double-firing |

---

## 最低版本需求

| 依賴 | v4 最低 | v5 最低 |
|------|---------|---------|
| React | 16.8 | **18** |
| TypeScript | 4.1 | **4.7** |
| Node.js | 12 | **18** |

---

## Breaking Change 1：強制 Object 語法

v5 移除了所有接受多個位置參數的重載，**只接受 object 語法**。

```typescript
// v4 — 多種語法均可
useQuery(queryKey, queryFn);
useQuery(queryKey, queryFn, options);
useQuery({ queryKey, queryFn, ...options });

useMutation(mutationFn);
useMutation(mutationFn, options);

// v5 — 只接受 object 語法
useQuery({ queryKey, queryFn, ...options });
useMutation({ mutationFn, ...options });
```

**影響 API**：`useQuery`、`useInfiniteQuery`、`useMutation`、`useQueries`、
`queryClient.fetchQuery`、`queryClient.prefetchQuery`、`queryClient.fetchInfiniteQuery`

**Codemod 可自動修復此項**（見末節）

---

## Breaking Change 2：cacheTime → gcTime

```typescript
// v4
useQuery({ queryKey: ["todos"], queryFn: fetchTodos, cacheTime: 60 * 1000 });
new QueryClient({ defaultOptions: { queries: { cacheTime: 60 * 1000 } } });

// v5
useQuery({ queryKey: ["todos"], queryFn: fetchTodos, gcTime: 60 * 1000 });
new QueryClient({ defaultOptions: { queries: { gcTime: 60 * 1000 } } });
```

`gcTime`（Garbage Collection Time）更精確描述了快取清理行為：
當 query 無任何 observer 時，等待此時間後清理快取資料。

---

## Breaking Change 3：isLoading → isPending

v5 中 `isLoading` 的語意發生了根本性變化：

| | v4 | v5 |
|---|---|---|
| `isLoading` | `status === "loading"` | `isPending && isFetching`（首次載入 alias） |
| `isPending` | 不存在 | `status === "pending"`（含 disabled query） |
| `isLoading`（disabled query）| `false` | `false`（因為 `isFetching === false`） |

```typescript
// v4 — 檢查首次載入
if (query.isLoading) { /* 第一次抓取中 */ }

// v5 — 等同邏輯（isPending && isFetching）
if (query.isLoading) { /* 第一次抓取中，v5 中為 alias */ }
// 或更明確：
if (query.isPending && query.isFetching) { /* 第一次抓取中 */ }

// 注意：v5 disabled query 的狀態
const q = useQuery({ queryKey: ["data"], queryFn: fn, enabled: false });
// q.status === "pending"（不是 "success"）
// q.fetchStatus === "idle"
// q.isPending === true
// q.isLoading === false（因為 isFetching === false）
```

---

## Breaking Change 4：useQuery 移除 onSuccess/onError/onSettled

這些 callbacks 從 `useQuery` 中完全移除（但在 `useMutation` 中保留）。

```typescript
// v4 — 可在 useQuery 使用 callbacks
useQuery({
  queryKey: ["user"],
  queryFn: fetchUser,
  onSuccess: (data) => { toast.success("Loaded!"); },
  onError: (error) => { toast.error(error.message); },
});

// v5 — 方案一：使用 useEffect
const { data, error } = useQuery({ queryKey: ["user"], queryFn: fetchUser });
useEffect(() => {
  if (data) toast.success("Loaded!");
}, [data]);
useEffect(() => {
  if (error) toast.error(error.message);
}, [error]);

// v5 — 方案二：全域錯誤處理（QueryCache）
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error(`[${String(query.queryKey)}] Error:`, error.message);
      toast.error(error.message);
    },
  }),
});
```

**移除原因**：`onSuccess` 在 React StrictMode 與 concurrent features 下可能 fire 兩次，
且語意不清晰（每次 re-render 都可能重新觸發）。

---

## Breaking Change 5：keepPreviousData → placeholderData

```typescript
// v4
useQuery({
  queryKey: ["todos", page],
  queryFn: () => fetchTodos(page),
  keepPreviousData: true,
});

// v5 — 方案一：identity function
useQuery({
  queryKey: ["todos", page],
  queryFn: () => fetchTodos(page),
  placeholderData: (previousData) => previousData,
});

// v5 — 方案二：使用 keepPreviousData 工具函式
import { keepPreviousData } from "@tanstack/react-query";

useQuery({
  queryKey: ["todos", page],
  queryFn: () => fetchTodos(page),
  placeholderData: keepPreviousData,  // 等同 (prev) => prev
});
```

使用 `placeholderData` 時，`isPlaceholderData` 會為 `true`（與 v4 的 `isPreviousData` 不同）。

---

## Breaking Change 6：useInfiniteQuery 必填 initialPageParam

```typescript
// v4 — 無需 initialPageParam
useInfiniteQuery({
  queryKey: ["projects"],
  queryFn: ({ pageParam = 0 }) => fetchProjects(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

// v5 — initialPageParam 為必填
useInfiniteQuery({
  queryKey: ["projects"],
  queryFn: ({ pageParam }) => fetchProjects(pageParam),  // 不再需要 = 0 預設值
  initialPageParam: 0,    // 必填！TypeScript 會報錯若缺少此項
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

---

## Breaking Change 7：Hydrate → HydrationBoundary

```typescript
// v4
import { Hydrate } from "@tanstack/react-query";

function Page({ dehydratedState }) {
  return (
    <Hydrate state={dehydratedState}>
      <Component />
    </Hydrate>
  );
}

// v5
import { HydrationBoundary } from "@tanstack/react-query";

function Page({ dehydratedState }) {
  return (
    <HydrationBoundary state={dehydratedState}>
      <Component />
    </HydrationBoundary>
  );
}
```

---

## Breaking Change 8：status "loading" → "pending"

```typescript
// v4
if (query.status === "loading") { ... }

// v5
if (query.status === "pending") { ... }
// 或
if (query.isPending) { ... }
```

這同樣影響 TypeScript 的 discriminated union type guard：

```typescript
// v5 的 status narrow
if (query.status === "pending") {
  query.data; // undefined
} else if (query.status === "error") {
  query.error; // TError
} else {
  query.data; // TData
}
```

---

## Breaking Change 9：result.remove() 移除

```typescript
// v4
const query = useQuery({ queryKey: ["todos"], queryFn: fetchTodos });
query.remove();

// v5
const queryClient = useQueryClient();
queryClient.removeQueries({ queryKey: ["todos"] });
```

---

## Breaking Change 10：enabled: false 的狀態變更

| 狀態 | v4 | v5 |
|------|----|----|
| `status` | `"success"` | `"pending"` |
| `fetchStatus` | `"idle"` | `"idle"` |
| `isPending` | `false`（無此屬性）| `true` |
| `isLoading` | `false` | `false`（因為 isFetching = false） |

```typescript
// v5 — 正確處理 disabled query 的顯示邏輯
const query = useQuery({
  queryKey: ["user", userId],
  queryFn: () => fetchUser(userId!),
  enabled: !!userId,
});

// 不要用 isPending 判斷「是否載入中」（disabled query 也是 pending）
// 要用 isLoading 判斷首次載入
if (query.isLoading) return <Spinner />;  // 正確
if (query.isPending && !userId) return null;  // disabled 時直接不顯示
```

---

## Breaking Change 11：notifyOnChangeProps 移除 "tracked"

```typescript
// v4 — 需要手動啟用追蹤模式
useQuery({ queryKey: ["todos"], queryFn: fetchTodos, notifyOnChangeProps: "tracked" });

// v5 — 追蹤為預設行為，無需設定
useQuery({ queryKey: ["todos"], queryFn: fetchTodos });
// 只存取了 data 屬性 → 只在 data 變更時重渲染
```

---

## Breaking Change 12：函式型 queryKey 移除

```typescript
// v4 — 函式型 queryKey 可在 v4 某些版本使用
useQuery({ queryKey: () => ["todos", userId], queryFn: fetchTodos });

// v5 — 必須是靜態陣列
useQuery({ queryKey: ["todos", userId], queryFn: fetchTodos });
```

---

## Breaking Change 13：getNextPageParam 增加參數

```typescript
// v4
getNextPageParam: (lastPage, allPages) => lastPage.nextCursor

// v5 — 增加 lastPageParam 與 allPageParams 兩個參數
getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => lastPage.nextCursor
// 若不使用新參數，舊程式碼仍可運作（JS 允許忽略額外參數）
```

---

## v5 新增 API

| 新增 API | 說明 |
|---------|------|
| `queryOptions()` | 型別安全的 query factory，讓 queryKey 與 queryFn 型別同步 |
| `infiniteQueryOptions()` | 同上，用於 infinite query |
| `skipToken` | 型別安全的條件查詢 sentinel value |
| `useSuspenseQuery` | 穩定版 Suspense hook（不再是實驗性） |
| `useSuspenseInfiniteQuery` | Suspense 版本的 infinite query |
| `useSuspenseQueries` | Suspense 版本的平行查詢 |
| `useQueries.combine` | 合併多個 query 結果的選項 |
| `useInfiniteQuery.maxPages` | 限制快取的頁數 |
| `keepPreviousData` utility | 取代 `keepPreviousData: true`，用於 `placeholderData` |
| `dehydrate/hydrate` 直接 import | 從 `@tanstack/react-query` 直接 import（v4 需要獨立套件） |

---

## 自動遷移 Codemod

TanStack Query v5 提供官方 codemod 自動修復大部分 breaking changes：

```bash
npx jscodeshift@latest ./src \
  --extensions=ts,tsx \
  --transform=node_modules/@tanstack/react-query/build/codemods/v5/remove-overloads/remove-overloads.cjs
```

**Codemod 可自動修復**：
- 位置參數語法 → object 語法
- `Hydrate` → `HydrationBoundary`
- `cacheTime` → `gcTime`

**Codemod 無法自動修復**（需人工處理）：
- `onSuccess/onError/onSettled` 的業務邏輯遷移
- `keepPreviousData` → `placeholderData` 語意調整
- `initialPageParam` 的 `useInfiniteQuery` 補充
- `status === "loading"` → `"pending"` 的判斷修改
- `enabled: false` query 的狀態處理調整