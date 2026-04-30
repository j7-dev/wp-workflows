# Refine v5 Data Hooks Complete API Reference

> Source: https://refine.dev/core/docs/data/hooks/

## Table of Contents

- [useList](#uselist)
- [useOne](#useone)
- [useMany](#usemany)
- [useInfiniteList](#useinfinitelist)
- [useCreate](#usecreate)
- [useCreateMany](#usecreatemany)
- [useUpdate](#useupdate)
- [useUpdateMany](#useupdatemany)
- [useDelete](#usedelete)
- [useDeleteMany](#usedeletemany)
- [useCustom](#usecustom)
- [useCustomMutation](#usecustommutation)
- [useForm (core)](#useform-core)
- [useTable (core)](#usetable-core)
- [useShow](#useshow)
- [useSelect](#useselect)
- [useInvalidate](#useinvalidate)
- [useDataProvider](#usedataprovider)
- [useApiUrl](#useapiurl)

---

## useList

Query hook wrapping TanStack Query `useQuery`. Calls `dataProvider.getList`.

```tsx
import { useList } from "@refinedev/core";

const { result, query } = useList<IProduct, HttpError>({
  resource: "products",
  pagination: { currentPage: 1, pageSize: 10, mode: "server" },
  sorters: [{ field: "name", order: "asc" }],
  filters: [{ field: "status", operator: "eq", value: "active" }],
  meta: { headers: { "X-Custom": "value" } },
  queryOptions: { enabled: true, staleTime: 5000 },
  dataProviderName: "default",
  liveMode: "auto",
  onLiveEvent: (event) => console.log(event),
});

const products = result.data;  // IProduct[]
const total = result.total;     // number
const isLoading = query.isLoading;
const isError = query.isError;
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `resource` | `string` | required | Resource name |
| `pagination` | `{ currentPage?: number; pageSize?: number; mode?: "server"\|"client"\|"off" }` | `{ currentPage: 1, pageSize: 10, mode: "server" }` | Pagination config |
| `sorters` | `CrudSort[]` | -- | `[{ field, order: "asc"\|"desc" }]` |
| `filters` | `CrudFilter[]` | -- | `[{ field, operator, value }]` |
| `meta` | `MetaQuery` | -- | Custom metadata for data provider |
| `queryOptions` | `UseQueryOptions` | -- | TanStack Query options |
| `dataProviderName` | `string` | `"default"` | Target data provider |
| `successNotification` | `OpenNotificationParams \| false` | -- | Success notification |
| `errorNotification` | `OpenNotificationParams \| false` | -- | Error notification |
| `liveMode` | `"auto" \| "manual" \| "off"` | `"off"` | Realtime mode |
| `onLiveEvent` | `(event: LiveEvent) => void` | -- | Live event callback |
| `liveParams` | `object` | -- | Live subscription params |
| `overtimeOptions` | `{ interval: number; onInterval: fn }` | -- | Overtime tracking |

**Return:** `{ result: { data: T[], total: number }, query: QueryObserverResult, overtime: { elapsedTime?: number } }`

---

## useOne

Query hook. Calls `dataProvider.getOne`.

```tsx
const { result, query } = useOne<IProduct>({
  resource: "products",
  id: 1,
  meta: { headers: { Authorization: `Bearer ${token}` } },
});

const product = result; // IProduct
```

**Parameters:** Same as useList plus `id: BaseKey` (required). No pagination/sorters/filters.

**Return:** `{ result: TData, query: QueryObserverResult, overtime }`

---

## useMany

Query hook. Calls `dataProvider.getMany` (falls back to multiple `getOne` calls).

```tsx
const { result, query } = useMany<IProduct>({
  resource: "products",
  ids: [1, 2, 3],
});

const products = result; // IProduct[]
```

**Parameters:** Same as useOne but `ids: BaseKey[]` instead of `id`.

**Return:** `{ result: TData[], query: QueryObserverResult, overtime }`

---

## useInfiniteList

Query hook wrapping TanStack Query `useInfiniteQuery`. Calls `dataProvider.getList` with pagination.

```tsx
const {
  result: { data, hasNextPage, hasPreviousPage },
  query: { isLoading, fetchNextPage, isFetchingNextPage },
} = useInfiniteList<IProduct>({
  resource: "products",
  pagination: { pageSize: 20 },
  sorters: [{ field: "createdAt", order: "desc" }],
});

const allItems = data.pages.flatMap((page) => page.data);
```

**Parameters:** Same as useList.

**Return:** `{ result: { data: InfiniteData, hasNextPage, hasPreviousPage }, query: UseInfiniteQueryResult, overtime }`

---

## useCreate

Mutation hook. Calls `dataProvider.create`. Auto-invalidates `["list", "many"]`.

```tsx
const { mutate, mutateAsync, mutation } = useCreate<IProduct, HttpError, ICreateVars>();

mutate({
  resource: "products",
  values: { name: "New Product", price: 100 },
  meta: { headers: { "X-Custom": "value" } },
  successNotification: (data) => ({
    message: "Created!",
    type: "success",
  }),
});

// mutation.isPending, mutation.isError, mutation.data
```

**Mutate Parameters:**

| Parameter | Type | Default |
|-----------|------|---------|
| `resource` | `string` | required |
| `values` | `TVariables` | required |
| `meta` | `MetaQuery` | -- |
| `dataProviderName` | `string` | `"default"` |
| `invalidates` | `string[]` | `["list", "many"]` |
| `successNotification` | `OpenNotificationParams \| false` | auto |
| `errorNotification` | `OpenNotificationParams \| false` | auto |

**Hook Options:** `mutationOptions`, `overtimeOptions`

**Return:** `{ mutate, mutateAsync, mutation: UseMutationResult, overtime }`

---

## useCreateMany

Mutation hook. Calls `dataProvider.createMany`. Auto-invalidates `["list", "many"]`.

```tsx
const { mutate } = useCreateMany();
mutate({
  resource: "products",
  values: [
    { name: "Product A", price: 100 },
    { name: "Product B", price: 200 },
  ],
});
```

Parameters and return same pattern as useCreate, but `values` is `TVariables[]`.

---

## useUpdate

Mutation hook. Calls `dataProvider.update`. Auto-invalidates `["list", "many", "detail"]`.

```tsx
const { mutate, mutation } = useUpdate<IProduct>();

mutate({
  resource: "products",
  id: 1,
  values: { name: "Updated Name" },
  mutationMode: "optimistic",
  undoableTimeout: 5000,
});
```

**Additional Mutate Parameters:**

| Parameter | Type | Default |
|-----------|------|---------|
| `id` | `BaseKey` | required |
| `mutationMode` | `"pessimistic" \| "optimistic" \| "undoable"` | `"pessimistic"` |
| `undoableTimeout` | `number` | `5000` |
| `onCancel` | `(cancelMutation: () => void) => void` | -- |
| `invalidates` | `array` | `["list", "many", "detail"]` |
| `optimisticUpdateMap` | `{ list?, many?, detail? }` | -- |

---

## useUpdateMany

Mutation hook. Calls `dataProvider.updateMany`. Same pattern as useUpdate but `ids: BaseKey[]`.

```tsx
const { mutate } = useUpdateMany();
mutate({
  resource: "products",
  ids: [1, 2, 3],
  values: { status: "archived" },
  mutationMode: "undoable",
});
```

---

## useDelete

Mutation hook. Calls `dataProvider.deleteOne`. Auto-invalidates `["list", "many"]`.

```tsx
const { mutate } = useDelete();
mutate({
  resource: "products",
  id: 1,
  mutationMode: "undoable",
  undoableTimeout: 10000,
});
```

Same additional parameters as useUpdate (mutationMode, undoableTimeout, onCancel).

---

## useDeleteMany

Mutation hook. Calls `dataProvider.deleteMany`. Same pattern as useDelete but `ids: BaseKey[]`.

```tsx
const { mutate } = useDeleteMany();
mutate({ resource: "products", ids: [1, 2, 3] });
```

---

## useCustom

Query hook for non-CRUD endpoints. Calls `dataProvider.custom`. Does NOT auto-invalidate.

```tsx
const { query } = useCustom<IStats>({
  url: `${apiUrl}/products/stats`,
  method: "get",
  config: {
    headers: { "X-Custom": "value" },
    query: { startDate: "2024-01-01" },
    sorters: [{ field: "total", order: "desc" }],
    filters: [{ field: "category", operator: "eq", value: "electronics" }],
    payload: { detailed: true },
  },
  queryOptions: { enabled: !!apiUrl },
  meta: { operation: "getProductStats" },
});
```

**Return:** `{ query: QueryObserverResult<CustomResponse<TData>>, overtime }`

---

## useCustomMutation

Mutation hook for non-CRUD endpoints. Calls `dataProvider.custom`.

```tsx
const { mutate, mutation } = useCustomMutation();

mutate({
  url: `${apiUrl}/products/bulk-archive`,
  method: "post",
  values: { productIds: [1, 2, 3] },
  config: { headers: { "X-Custom": "value" } },
});
```

---

## useForm (core)

Headless form hook managing create/edit/clone workflows. Foundation for UI-specific useForm hooks.

```tsx
import { useForm } from "@refinedev/core";

const { onFinish, formLoading, query, mutation, id, setId, autoSaveProps } = useForm<
  IProduct, HttpError, IFormValues
>({
  resource: "products",
  action: "edit",       // "create" | "edit" | "clone"
  id: 123,
  redirect: "show",     // "list" | "edit" | "show" | "create" | false
  mutationMode: "optimistic",
  invalidates: ["list", "many", "detail"],
  meta: { queryContext: { tenant: "acme" } },
  queryMeta: { /* override meta for useOne query */ },
  mutationMeta: { /* override meta for mutation */ },
  onMutationSuccess: (data, variables, context, isAutoSave) => {},
  onMutationError: (error, variables, context, isAutoSave) => {},
  autoSave: {
    enabled: true,
    debounce: 2000,
    invalidateOnUnmount: true,
  },
});

// Submit form
onFinish({ name: "Updated Product", price: 150 });
```

**Parameters:**

| Parameter | Type | Default |
|-----------|------|---------|
| `action` | `"create" \| "edit" \| "clone"` | inferred from route |
| `resource` | `string` | inferred from route |
| `id` | `BaseKey` | inferred from route |
| `redirect` | `"list" \| "edit" \| "show" \| "create" \| false` | `"list"` |
| `mutationMode` | `"pessimistic" \| "optimistic" \| "undoable"` | `"pessimistic"` |
| `invalidates` | `string[]` | create: `["list","many"]`, edit: `["list","many","detail"]` |
| `queryOptions` | `UseQueryOptions` | -- |
| `createMutationOptions` | `UseMutationOptions` | -- |
| `updateMutationOptions` | `UseMutationOptions` | -- |
| `autoSave` | `{ enabled, debounce?, invalidateOnUnmount?, onFinish? }` | -- |
| `optimisticUpdateMap` | `{ list?, many?, detail? }` | all true |

**Return:**

| Property | Type |
|----------|------|
| `onFinish` | `(values: TVariables) => Promise<CreateResponse \| UpdateResponse>` |
| `onFinishAutoSave` | `(values: TVariables) => void` |
| `formLoading` | `boolean` |
| `query` | `QueryObserverResult` (edit/clone only) |
| `mutation` | `UseMutationResult` |
| `id` / `setId` | `BaseKey \| undefined` / setter |
| `redirect` | `(target, id?) => Promise` |
| `overtime` | `{ elapsedTime?: number }` |
| `autoSaveProps` | `{ data?, error?, status }` |

---

## useTable (core)

Headless table hook with pagination, sorting, filtering. Wraps `useList`.

```tsx
import { useTable } from "@refinedev/core";

const {
  tableQuery,
  currentPage, setCurrentPage,
  pageSize, setPageSize, pageCount,
  sorters, setSorters,
  filters, setFilters,
  createLinkForSyncWithLocation,
} = useTable<IProduct>({
  resource: "products",
  pagination: { currentPage: 1, pageSize: 20, mode: "server" },
  sorters: {
    initial: [{ field: "createdAt", order: "desc" }],
    permanent: [{ field: "deletedAt", order: "asc" }],
    mode: "server",
  },
  filters: {
    initial: [{ field: "status", operator: "eq", value: "active" }],
    permanent: [{ field: "tenantId", operator: "eq", value: currentTenant }],
    defaultBehavior: "merge",
    mode: "server",
  },
  syncWithLocation: true,
});
```

**Pagination modes:** `"server"` (backend paginates), `"client"` (all data fetched, paginate in UI), `"off"` (no pagination)

**Filter behavior:** `"merge"` (combine with existing), `"replace"` (overwrite all)

---

## useShow

Query hook for show pages. Wraps `useOne` with route inference.

```tsx
import { useShow } from "@refinedev/core";

const { query, showId, setShowId } = useShow<IProduct>({
  resource: "products", // optional, inferred from route
  id: 1,                // optional, inferred from route
});

const product = query.data?.data;
```

---

## useSelect

Headless select hook. Wraps `useList` with search debounce.

```tsx
import { useSelect } from "@refinedev/core";

const { options, onSearch, query, defaultValueQuery } = useSelect<ICategory>({
  resource: "categories",
  optionLabel: "title",              // or function: (item) => `${item.code} - ${item.name}`
  optionValue: "id",                 // or function: (item) => item.id
  searchField: "title",
  defaultValue: [1, 2],
  selectedOptionsOrder: "selected-first",
  debounce: 300,
  sorters: [{ field: "title", order: "asc" }],
  filters: [{ field: "active", operator: "eq", value: true }],
  pagination: { pageSize: 50, mode: "server" },
  onSearch: (value) => [
    { field: "title", operator: "contains", value },
  ],
});

// options = [{ label: string, value: string }]
```

---

## useInvalidate

Manually invalidate cached queries.

```tsx
import { useInvalidate } from "@refinedev/core";

const invalidate = useInvalidate();

// Invalidate specific scopes
await invalidate({ resource: "products", invalidates: ["list", "many"] });
await invalidate({ resource: "products", invalidates: ["detail"], id: 1 });

// Invalidate all
await invalidate({ invalidates: ["all"] });

// Invalidate specific data provider
await invalidate({ dataProviderName: "cms", invalidates: ["resourceAll"], resource: "posts" });
```

**Scopes:** `"all"` | `"resourceAll"` | `"list"` | `"many"` | `"detail"`

---

## useDataProvider

Access data provider instance directly.

```tsx
const dataProvider = useDataProvider();
const defaultProvider = dataProvider();        // default provider
const cmsProvider = dataProvider("cms");       // named provider
```

---

## useApiUrl

Get base API URL from data provider.

```tsx
const apiUrl = useApiUrl();           // default provider URL
const cmsUrl = useApiUrl("cms");      // named provider URL
```
