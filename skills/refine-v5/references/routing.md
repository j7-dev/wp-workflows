# Refine v5 Router Provider & Routing Hooks Reference

> Source: https://refine.dev/core/docs/routing/

## Table of Contents

- [Router Provider Interface](#router-provider-interface)
- [React Router Integration](#react-router-integration)
- [Routing Hooks](#routing-hooks)
- [Link Component](#link-component)
- [Route Patterns](#route-patterns)

---

## Router Provider Interface

```typescript
const routerProvider: {
  go?: () => (config: GoConfig) => void | string;
  back?: () => () => void;
  parse?: () => () => ParsedParams;
  Link?: React.ComponentType<{ to: string; children?: React.ReactNode }>;
};

interface GoConfig {
  to?: string | { resource: string; action: string; id?: BaseKey; meta?: Record<string, any> };
  query?: Record<string, unknown>;
  hash?: string;
  type?: "push" | "replace" | "path";
  options?: { keepQuery?: boolean; keepHash?: boolean };
}

interface ParsedParams {
  resource?: IResourceItem;
  id?: BaseKey;
  action?: Action;
  pathname?: string;
  params?: {
    filters?: CrudFilters;
    sorters?: CrudSorting;
    currentPage?: number;
    pageSize?: number;
    [key: string]: any;
  };
}
```

---

## React Router Integration

```tsx
import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/react-router";
import { BrowserRouter, Route, Routes, Outlet } from "react-router";

function App() {
  return (
    <BrowserRouter>
      <Refine
        routerProvider={routerProvider}
        resources={[
          {
            name: "products",
            list: "/products",
            show: "/products/:id",
            edit: "/products/:id/edit",
            create: "/products/create",
          },
        ]}
      >
        <Routes>
          <Route element={<Layout><Outlet /></Layout>}>
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/create" element={<ProductCreate />} />
            <Route path="/products/:id" element={<ProductShow />} />
            <Route path="/products/:id/edit" element={<ProductEdit />} />
          </Route>
        </Routes>
      </Refine>
    </BrowserRouter>
  );
}
```

**Package:** `@refinedev/react-router` ^2.x (v5 of Refine)

Also available: `@refinedev/nextjs-router` (Next.js), `@refinedev/remix-router` (Remix)

---

## Routing Hooks

### useGo

Primary navigation hook. Replaces deprecated `useNavigation.push/replace`.

```tsx
import { useGo } from "@refinedev/core";

const go = useGo();

// Navigate by path
go({ to: "/products", type: "push" });
go({ to: "/products?status=active", type: "replace" });

// Navigate by resource (recommended)
go({
  to: { resource: "products", action: "edit", id: "1" },
  query: { tab: "settings" },
  type: "push",
});

// Generate path without navigating
const path = go({
  to: { resource: "products", action: "list" },
  type: "path",
}); // returns "/products"

// Keep existing query params
go({
  to: "/products",
  query: { page: 2 },
  options: { keepQuery: true },
});
```

### useBack

Navigate to previous page.

```tsx
import { useBack } from "@refinedev/core";
const back = useBack();
back(); // equivalent to history.back()
```

### useParsed

Access current URL state and inferred resource.

```tsx
import { useParsed } from "@refinedev/core";

const { resource, action, id, pathname, params } = useParsed();
// resource: "products" (inferred from route)
// action: "edit" (inferred from route)
// id: "123" (from :id param)
// pathname: "/products/123/edit"
// params: { filters, sorters, currentPage, pageSize, ...custom }
```

### useResourceParams

Access resource, id, action from route with programmatic override.

```tsx
import { useResourceParams } from "@refinedev/core";

const {
  id,           // BaseKey | undefined
  setId,        // (id: BaseKey) => void
  resource,     // IResourceItem | undefined
  action,       // "list" | "create" | "edit" | "show" | "clone"
  formAction,   // "create" | "edit" | "clone" (normalized for forms)
  identifier,   // resource identifier or name
  resources,    // all defined resources
  select,       // (name) => IResourceItem
} = useResourceParams({
  resource: "products",  // optional override
  id: 123,               // optional override
  action: "edit",        // optional override
});
```

### useNavigation (legacy -- prefer useGo)

```tsx
import { useNavigation } from "@refinedev/core";

const { list, create, edit, show, clone } = useNavigation();
const { listUrl, createUrl, editUrl, showUrl, cloneUrl } = useNavigation();

list("products");                    // navigate to /products
edit("products", "1");               // navigate to /products/1/edit
const url = editUrl("products", "1"); // returns "/products/1/edit"
```

### useLink

Access the Link component from router provider.

```tsx
import { useLink } from "@refinedev/core";
const Link = useLink();
<Link to="/products">Products</Link>
```

### useGetToPath

Generate paths for resources.

```tsx
import { useGetToPath } from "@refinedev/core";
const getToPath = useGetToPath();

const path = getToPath({
  resource: { name: "products", list: "/products" },
  action: "list",
}); // "/products"

const editPath = getToPath({
  resource: { name: "products", edit: "/products/:id/edit" },
  action: "edit",
  meta: { id: "123" },
}); // "/products/123/edit"
```

---

## Link Component

```tsx
import { Link } from "@refinedev/core"; // uses router provider's Link

<Link to="/products">Products</Link>
```

---

## Route Patterns

### Protected Routes

```tsx
import { Authenticated } from "@refinedev/core";

<Routes>
  <Route element={
    <Authenticated key="protected" fallback={<Navigate to="/login" />}>
      <ThemedLayout><Outlet /></ThemedLayout>
    </Authenticated>
  }>
    <Route path="/products" element={<ProductList />} />
  </Route>

  <Route element={
    <Authenticated key="auth" fallback={<Outlet />}>
      <Navigate to="/" />
    </Authenticated>
  }>
    <Route path="/login" element={<AuthPage type="login" />} />
    <Route path="/register" element={<AuthPage type="register" />} />
  </Route>
</Routes>
```

### Nested Resources

```tsx
resources={[
  { name: "categories", list: "/categories" },
  {
    name: "products",
    list: "/categories/:categoryId/products",
    show: "/categories/:categoryId/products/:id",
    meta: { parent: "categories" },
  },
]}
```

### Resource with Identifier

```tsx
resources={[
  {
    name: "products",           // API resource name
    identifier: "my-products",  // unique key for multi-instance
    list: "/my-products",
  },
]}

// Use identifier in hooks:
useList({ resource: "my-products" });
```
