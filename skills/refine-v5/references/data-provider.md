# Refine v5 Data Provider & REST Data Provider Reference

> Source: https://refine.dev/core/docs/data/data-provider/ | https://refine.dev/core/docs/data/packages/rest-data-provider/

## Table of Contents

- [DataProvider Interface](#dataprovider-interface)
- [Required Methods](#required-methods)
- [Optional Methods](#optional-methods)
- [Error Handling](#error-handling)
- [Multiple Data Providers](#multiple-data-providers)
- [@refinedev/rest (REST Data Provider)](#refinedevrest)
- [@refinedev/simple-rest](#refinedevsimple-rest)

---

## DataProvider Interface

```typescript
import { DataProvider } from "@refinedev/core";

const dataProvider: DataProvider = {
  // Required
  getList:    ({ resource, pagination, sorters, filters, meta }) => Promise<{ data: T[], total: number }>,
  getOne:     ({ resource, id, meta }) => Promise<{ data: T }>,
  create:     ({ resource, variables, meta }) => Promise<{ data: T }>,
  update:     ({ resource, id, variables, meta }) => Promise<{ data: T }>,
  deleteOne:  ({ resource, id, variables, meta }) => Promise<{ data: T }>,
  getApiUrl:  () => string,

  // Optional (fallback to required methods if not implemented)
  getMany:    ({ resource, ids, meta }) => Promise<{ data: T[] }>,
  createMany: ({ resource, variables, meta }) => Promise<{ data: T[] }>,
  updateMany: ({ resource, ids, variables, meta }) => Promise<{ data: T[] }>,
  deleteMany: ({ resource, ids, variables, meta }) => Promise<{ data: T[] }>,
  custom:     ({ url, method, filters, sorters, payload, query, headers, meta }) => Promise<{ data: T }>,
};
```

---

## Required Methods

### getList

```typescript
getList: async ({ resource, pagination, sorters, filters, meta }) => {
  // pagination: { currentPage: number, pageSize: number, mode: "server"|"client"|"off" }
  // sorters: CrudSort[] = [{ field: string, order: "asc"|"desc" }]
  // filters: CrudFilter[] = [{ field, operator, value }]

  const response = await fetch(`${API_URL}/${resource}?${buildQuery(pagination, sorters, filters)}`);
  const data = await response.json();

  return {
    data: data.items,       // T[]
    total: data.totalCount, // number -- required for pagination
  };
}
```

### getOne

```typescript
getOne: async ({ resource, id, meta }) => {
  const response = await fetch(`${API_URL}/${resource}/${id}`);
  const data = await response.json();
  return { data };  // { data: T }
}
```

### create

```typescript
create: async ({ resource, variables, meta }) => {
  const response = await fetch(`${API_URL}/${resource}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(variables),
  });
  const data = await response.json();
  return { data };  // { data: T } -- must include the created record with id
}
```

### update

```typescript
update: async ({ resource, id, variables, meta }) => {
  const response = await fetch(`${API_URL}/${resource}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(variables),
  });
  const data = await response.json();
  return { data };
}
```

### deleteOne

```typescript
deleteOne: async ({ resource, id, variables, meta }) => {
  const response = await fetch(`${API_URL}/${resource}/${id}`, {
    method: "DELETE",
  });
  const data = await response.json();
  return { data };
}
```

### getApiUrl

```typescript
getApiUrl: () => API_URL,  // returns the base API URL string
```

---

## Optional Methods

### getMany

Falls back to multiple `getOne` calls if not implemented.

```typescript
getMany: async ({ resource, ids, meta }) => {
  const response = await fetch(`${API_URL}/${resource}?ids=${ids.join(",")}`);
  const data = await response.json();
  return { data };  // { data: T[] }
}
```

### createMany / updateMany / deleteMany

Same pattern; falls back to individual calls if not implemented.

### custom

For non-CRUD operations (search, export, analytics, file uploads).

```typescript
custom: async ({ url, method, filters, sorters, payload, query, headers, meta }) => {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const data = await response.json();
  return { data };
}
```

---

## Error Handling

Errors should conform to `HttpError`:

```typescript
interface HttpError extends Record<string, any> {
  message: string;
  statusCode: number;
  errors?: ValidationErrors;  // field-level errors for form validation
}

// ValidationErrors maps field names to:
//   string | string[] | boolean | { key: string; message: string }
```

When a data provider throws an `HttpError` with `errors`, Refine automatically maps them to form field errors.

---

## Multiple Data Providers

```tsx
<Refine
  dataProvider={{
    default: restDataProvider("https://api.example.com"),
    cms: strapiDataProvider("https://cms.example.com"),
    analytics: customProvider("https://analytics.example.com"),
  }}
/>

// In hooks, specify the provider:
useList({ resource: "posts", dataProviderName: "cms" });

// In resources:
resources={[{
  name: "articles",
  meta: { dataProviderName: "cms" },
}]}
```

---

## @refinedev/rest

KY-based REST data provider with full customization.

### Installation

```bash
npm i @refinedev/rest
```

### createDataProvider

```typescript
import { createDataProvider } from "@refinedev/rest";

const { dataProvider, kyInstance } = createDataProvider(
  "https://api.example.com",  // base URL
  dataProviderOptions,         // per-method customization
  kyOptions,                   // KY client options
);
```

### Data Provider Options (per-method)

Each method accepts these customization functions:

| Function | Purpose |
|----------|---------|
| `getEndpoint({ resource, id?, ids? })` | Custom URL path |
| `buildQueryParams({ pagination, sorters, filters, ids? })` | Transform to API query format |
| `buildHeaders({ resource, meta })` | Custom request headers |
| `buildBodyParams({ variables, ids? })` | Transform request body |
| `mapResponse(response)` | Extract data from response |
| `getTotalCount({ response })` | Extract total count (getList only) |
| `getRequestMethod()` | HTTP method override (update only) |
| `transformError(response)` | Convert API errors to HttpError |

### Full Example

```typescript
const { dataProvider } = createDataProvider(
  "https://api.example.com/v1",
  {
    getList: {
      buildQueryParams: async ({ pagination, sorters, filters }) => ({
        page: pagination?.currentPage ?? 1,
        limit: pagination?.pageSize ?? 10,
        sort: sorters?.[0]?.field,
        order: sorters?.[0]?.order,
        ...buildFilterQuery(filters),
      }),
      getTotalCount: async ({ response }) => {
        const json = await response.json();
        return json.meta.total;
      },
      mapResponse: async (response) => {
        const json = await response.json();
        return json.data;
      },
    },
    getOne: {
      mapResponse: async (response) => {
        const json = await response.json();
        return json.data;
      },
    },
    create: {
      buildBodyParams: async ({ variables }) => ({
        dto: { ...variables, status: "DRAFT" },
      }),
      mapResponse: async (response) => {
        const json = await response.json();
        return json.data;
      },
      transformError: async (response) => {
        const json = await response.json();
        return {
          message: json.error,
          statusCode: response.status,
          errors: json.field_errors,
        };
      },
    },
    update: {
      getRequestMethod: () => "put",  // default is PATCH
      buildBodyParams: async ({ variables }) => ({
        dto: { ...variables, updatedAt: new Date().toISOString() },
      }),
    },
  }
);
```

### KY Hooks (Authentication)

```typescript
import { createDataProvider, authHeaderBeforeRequestHook, refreshTokenAfterResponseHook } from "@refinedev/rest";

const { dataProvider } = createDataProvider(
  "https://api.example.com",
  {},
  {
    hooks: {
      beforeRequest: [
        authHeaderBeforeRequestHook({ ACCESS_TOKEN_KEY: "accessToken" }),
        // Reads localStorage["accessToken"] and adds Authorization: Bearer <token>
      ],
      afterResponse: [
        refreshTokenAfterResponseHook({
          ACCESS_TOKEN_KEY: "accessToken",
          REFRESH_TOKEN_KEY: "refreshToken",
          REFRESH_TOKEN_URL: "https://api.example.com/auth/refresh",
          // On 401: refreshes token, retries original request
        }),
      ],
    },
  }
);
```

---

## @refinedev/simple-rest

Simplified REST provider for standard REST APIs. Expects:
- `GET /resources?_page=1&_limit=10&_sort=field&_order=asc` for lists
- `x-total-count` header for total count
- Standard CRUD endpoints

```typescript
import dataProvider from "@refinedev/simple-rest";

<Refine dataProvider={dataProvider("https://api.example.com")} />
```

No customization options -- use `@refinedev/rest` for custom APIs.
