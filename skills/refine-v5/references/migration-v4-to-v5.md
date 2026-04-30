# Refine v4 to v5 Migration Guide

> Source: https://refine.dev/core/docs/migration-guide/4x-to-5x/

## Table of Contents

- [Package Version Updates](#package-version-updates)
- [Automated Migration](#automated-migration)
- [Hook Return Type Changes](#hook-return-type-changes)
- [Parameter Renames](#parameter-renames)
- [Config Flattening](#config-flattening)
- [Type Renames](#type-renames)
- [Component Renames](#component-renames)
- [Resource Config Changes](#resource-config-changes)
- [Data Provider Changes](#data-provider-changes)
- [Removed APIs](#removed-apis)
- [TanStack Query v5 Upgrade](#tanstack-query-v5)

---

## Package Version Updates

| Package | v4 | v5 |
|---------|----|----|
| `@refinedev/core` | 4.x.x | **5.x.x** |
| `@tanstack/react-query` | 4.x.x | **5.x.x** |
| `@refinedev/antd` | 5.x.x | **6.x.x** |
| `@refinedev/mui` | 6.x.x | **7.x.x** |
| `@refinedev/react-router` | 1.x.x | **2.x.x** |
| `@refinedev/react-hook-form` | 4.x.x | **5.x.x** |
| `@refinedev/react-table` | 5.x.x | **6.x.x** |

---

## Automated Migration

```bash
npx @refinedev/codemod@latest refine4-to-refine5
```

Handles most standard cases. Review changes manually after running.

---

## Hook Return Type Changes

### Query Hooks (useList, useOne, useMany, useShow)

```tsx
// v4
const { data, isLoading, isError } = useList();
const posts = data?.data;
const total = data?.total;

// v5
const { result, query: { isLoading, isError } } = useList();
const posts = result.data;
const total = result.total;
```

```tsx
// v4
const { data, isLoading } = useOne({ resource: "users", id: 1 });
const user = data?.data;

// v5
const { result, query: { isLoading } } = useOne({ resource: "users", id: 1 });
const user = result;
```

### Mutation Hooks (useCreate, useUpdate, useDelete, etc.)

```tsx
// v4
const { mutate, isLoading, isError } = useCreate();

// v5
const { mutate, mutation: { isPending, isError } } = useCreate();
```

**Note:** `isLoading` on mutations renamed to `isPending` (TanStack Query v5).

### useForm

```tsx
// v4
const { queryResult, mutationResult } = useForm();

// v5
const { query, mutation } = useForm();
```

### useTable (core)

```tsx
// v4
const { tableQueryResult, current, setCurrent, sorter, setSorter } = useTable();

// v5
const { tableQuery, currentPage, setCurrentPage, sorters, setSorters } = useTable();
```

### useTable (@refinedev/react-table)

```tsx
// v4
const { getHeaderGroups, getRowModel, refineCore } = useTable({ columns });

// v5
const { reactTable: { getHeaderGroups, getRowModel }, refineCore } = useTable({ columns });
```

### useSelect

```tsx
// v4
const { queryResult, defaultValueQueryResult } = useSelect();

// v5
const { query, defaultValueQuery } = useSelect();
```

### useInfiniteList

```tsx
// v4
const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteList();

// v5
const { result, query: { isLoading, fetchNextPage, hasNextPage } } = useInfiniteList();
```

---

## Parameter Renames

### metaData -> meta

```tsx
// v4
useList({ metaData: { foo: "bar" } });
useOne({ metaData: { headers: { Authorization: "Bearer token" } } });

// v5
useList({ meta: { foo: "bar" } });
useOne({ meta: { headers: { Authorization: "Bearer token" } } });
```

### sort/sorter -> sorters

```tsx
// v4
useList({ sort: [{ field: "title", order: "asc" }] });
useTable({ initialSorter: [...], permanentSorter: [...] });

// v5
useList({ sorters: [{ field: "title", order: "asc" }] });
useTable({ sorters: { initial: [...], permanent: [...] } });
```

### hasPagination -> pagination.mode

```tsx
// v4
useList({ hasPagination: false });
useTable({ hasPagination: false, initialCurrent: 1, initialPageSize: 20 });

// v5
useList({ pagination: { mode: "off" } });
useTable({ pagination: { mode: "off", currentPage: 1, pageSize: 20 } });
```

### current/setCurrent -> currentPage/setCurrentPage

```tsx
// v4
const { current, setCurrent } = useTable();

// v5
const { currentPage, setCurrentPage } = useTable();
```

### initialFilter/permanentFilter -> filters.initial/filters.permanent

```tsx
// v4
useTable({
  initialFilter: [{ field: "status", operator: "eq", value: "published" }],
  permanentFilter: [{ field: "category", operator: "eq", value: "tech" }],
  defaultSetFilterBehavior: "replace",
});

// v5
useTable({
  filters: {
    initial: [{ field: "status", operator: "eq", value: "published" }],
    permanent: [{ field: "category", operator: "eq", value: "tech" }],
    defaultBehavior: "replace",
  },
});
```

### resourceName/resourceNameOrRouteName -> resource

```tsx
// v4
useImport({ resourceName: "posts" });
<CreateButton resourceNameOrRouteName="posts" />

// v5
useImport({ resource: "posts" });
<CreateButton resource="posts" />
```

### ignoreAccessControlProvider -> accessControl

```tsx
// v4
<CreateButton ignoreAccessControlProvider />

// v5
<CreateButton accessControl={{ enabled: false }} />
```

### exportOptions -> unparseConfig (useExport)

```tsx
// v4
useExport({ sorter: [...], exportOptions: {}, metaData: {} });

// v5
useExport({ sorters: [...], unparseConfig: {}, meta: {} });
```

---

## Config Flattening

The nested `config` parameter is removed. All properties move to top level.

```tsx
// v4
useList({
  config: {
    pagination: { current: 1, pageSize: 10 },
    sort: [{ field: "title", order: "asc" }],
    filters: [{ field: "status", operator: "eq", value: "published" }],
    hasPagination: false,
    metaData: { foo: "bar" },
  },
});

// v5
useList({
  pagination: { currentPage: 1, pageSize: 10, mode: "off" },
  sorters: [{ field: "title", order: "asc" }],
  filters: [{ field: "status", operator: "eq", value: "published" }],
  meta: { foo: "bar" },
});
```

---

## Type Renames

```tsx
// v4
import { type AuthBindings } from "@refinedev/core";
import type { RouterBindings } from "@refinedev/core";
import { type ITreeMenu } from "@refinedev/core";

// v5
import { type AuthProvider } from "@refinedev/core";
import type { RouterProvider } from "@refinedev/core";
import { type TreeMenuItem } from "@refinedev/core";
```

---

## Component Renames

Layout components across all UI packages (antd, mui, mantine, chakra-ui):

```tsx
// v4
import { ThemedLayoutV2, ThemedTitleV2, ThemedSiderV2, ThemedHeaderV2 } from "@refinedev/antd";

// v5
import { ThemedLayout, ThemedTitle, ThemedSider, ThemedHeader } from "@refinedev/antd";
```

---

## Resource Config Changes

### options -> meta

```tsx
// v4
resources={[{
  name: "posts",
  options: {
    label: "Blog Posts",
    icon: <PostIcon />,
    route: "my-posts",
    auditLog: { permissions: ["list", "create"] },
    hide: false,
    dataProviderName: "default",
  },
  canDelete: true,
}]}

// v5
resources={[{
  name: "posts",
  meta: {
    label: "Blog Posts",
    icon: <PostIcon />,
    parent: "categories",
    canDelete: true,
    audit: ["list", "create"],
    hide: false,
    dataProviderName: "default",
  },
}]}
```

### ITreeMenu -> TreeMenuItem

```tsx
// v4
menuItems.map((item: ITreeMenu) => {
  const route = typeof list === "string" ? list : list?.path;
});

// v5
menuItems.map((item: TreeMenuItem) => {
  const route = list ?? key; // always a string
});
```

---

## Data Provider Changes

```tsx
// v4
const dataProvider = {
  getList: ({ resource, pagination: { current, pageSize }, hasPagination, sort, metaData }) => {},
  custom: ({ sort }) => {},
};

// v5
const dataProvider = {
  getList: ({ resource, pagination: { currentPage, pageSize, mode }, sorters, filters, meta }) => {},
  custom: ({ sorters }) => {},
};
```

---

## Removed APIs

| Removed | Replacement |
|---------|-------------|
| `useResource("posts")` | `useResourceParams({ resource: "posts" })` |
| `useNavigation().push/replace/goBack` | `useGo()` and `useBack()` |
| `queryKeys` | `keys()` |
| `legacyAuthProvider` prop | Modern `authProvider` |
| `v3LegacyAuthProviderCompatible` | Remove, use modern auth |
| `ThemedLayoutV2` / `ThemedTitleV2` etc. | `ThemedLayout` / `ThemedTitle` |

---

## TanStack Query v5

Update `@tanstack/react-query` to v5. Key changes:

- `isLoading` on mutations -> `isPending`
- `cacheTime` -> `gcTime`
- `useQuery` requires `queryKey` as array (Refine handles this internally)
- `onSuccess` / `onError` / `onSettled` removed from `useQuery` (use `useEffect` or pass to `select`)

Follow the official TanStack Query v5 migration guide for custom query usage.

---

## React 19 (Optional)

Refine v5 supports React 18 and 19. React 19 upgrade is optional.
