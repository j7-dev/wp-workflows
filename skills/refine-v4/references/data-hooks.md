# Data Hooks 完整參考

## useList

```typescript
import { useList } from "@refinedev/core";

const { data, isLoading, isError } = useList({
  resource: "products",
  pagination: { current: 1, pageSize: 20, mode: "server" },
  sorters: [{ field: "id", order: "desc" }],
  filters: [
    { field: "category", operator: "eq", value: "electronics" },
    { field: "price", operator: "lte", value: 1000 },
  ],
  meta: { headers: { "x-custom-header": "value" } },
});

// data.data: BaseRecord[]
// data.total: number
```

## useOne

```typescript
const { data, isLoading } = useOne({ resource: "products", id: 1 });
```

## useCreate

```typescript
const { mutate, isLoading } = useCreate();

mutate({
  resource: "products",
  values: { name: "新產品", price: 100 },
});
```

## useUpdate

```typescript
const { mutate } = useUpdate();

mutate({
  resource: "products",
  id: 1,
  values: { price: 200 },
  mutationMode: "optimistic", // "pessimistic" | "optimistic" | "undoable"
});
```

## useDelete

```typescript
const { mutate: deleteProduct } = useDelete();

deleteProduct({ resource: "products", id: 1 });
```

## useTable（@refinedev/core）

```typescript
import { useTable } from "@refinedev/core";

const { tableQuery, current, setCurrent, pageSize, setPageSize,
        sorters, setSorters, filters, setFilters } = useTable({
  resource: "products",
  syncWithLocation: true, // 同步 URL query string
});
```

## useCustom

```typescript
import { useCustom } from "@refinedev/core";

const { data, isLoading } = useCustom({
  url: `${apiUrl}/custom-endpoint`,
  method: "get",
  config: {
    query: { status: "active" },
    headers: { "X-Custom": "value" },
  },
});
```

## useMany

```typescript
import { useMany } from "@refinedev/core";

const { data } = useMany({
  resource: "products",
  ids: [1, 2, 3],
});
```

## Filter Operators

| operator | 說明 |
|----------|------|
| `eq` | 等於 |
| `ne` | 不等於 |
| `lt` / `gt` | 小於 / 大於 |
| `lte` / `gte` | 小於等於 / 大於等於 |
| `contains` | 包含（字串） |
| `startswith` / `endswith` | 開頭 / 結尾 |
| `in` / `nin` | 在清單內 / 不在清單內 |
| `between` | 範圍 |
| `null` / `nnull` | 為空 / 不為空 |
