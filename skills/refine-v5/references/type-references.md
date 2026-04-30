# Refine v5 TypeScript Interface References

> Source: https://refine.dev/core/docs/core/interface-references/

## Table of Contents

- [Core Types](#core-types)
- [Filter Types](#filter-types)
- [Sorting & Pagination](#sorting--pagination)
- [Data Types](#data-types)
- [Notification Types](#notification-types)
- [Authorization Types](#authorization-types)
- [Resource Types](#resource-types)
- [Provider Types](#provider-types)
- [Realtime Types](#realtime-types)
- [Query Types](#query-types)

---

## Core Types

### BaseKey

```typescript
type BaseKey = string | number;
```

### BaseRecord

```typescript
type BaseRecord = {
  id?: BaseKey;
  [key: string]: any;
};
```

### HttpError

```typescript
interface HttpError extends Record<string, any> {
  message: string;
  statusCode: number;
  errors?: ValidationErrors;
}
```

### ValidationErrors

```typescript
type ValidationErrors = {
  [field: string]: string | string[] | boolean | { key: string; message: string };
};
```

### MutationMode

```typescript
type MutationMode = "pessimistic" | "optimistic" | "undoable";
```

---

## Filter Types

### CrudFilter

```typescript
type CrudFilter = LogicalFilter | ConditionalFilter;

type CrudFilters = CrudFilter[];
```

### LogicalFilter

```typescript
interface LogicalFilter {
  field: string;
  operator: Exclude<CrudOperators, "or" | "and">;
  value: any;
}
```

### ConditionalFilter

```typescript
interface ConditionalFilter {
  key?: string;
  operator: "or" | "and";
  value: (LogicalFilter | ConditionalFilter)[];
}
```

### CrudOperators

```typescript
type CrudOperators =
  | "eq" | "ne"           // equals / not equals
  | "lt" | "gt"           // less / greater than
  | "lte" | "gte"         // less/greater than or equal
  | "in" | "nin"          // in list / not in list
  | "ina" | "nina"        // in array field / not in array field
  | "contains"            // string contains (case-insensitive)
  | "ncontains"           // not contains
  | "containss"           // contains (case-sensitive)
  | "ncontainss"          // not contains (case-sensitive)
  | "startswith"          // starts with (case-insensitive)
  | "nstartswith"
  | "startswiths"         // starts with (case-sensitive)
  | "nstartswiths"
  | "endswith"            // ends with (case-insensitive)
  | "nendswith"
  | "endswiths"           // ends with (case-sensitive)
  | "nendswiths"
  | "between"             // range (inclusive)
  | "nbetween"            // not in range
  | "null"                // is null
  | "nnull"               // is not null
  | "or"                  // logical OR (ConditionalFilter)
  | "and";                // logical AND (ConditionalFilter)
```

---

## Sorting & Pagination

### CrudSort / CrudSorting

```typescript
interface CrudSort {
  field: string;
  order: "asc" | "desc";
}

type CrudSorting = CrudSort[];
```

### Pagination

```typescript
interface Pagination {
  currentPage?: number;      // default: 1
  pageSize?: number;         // default: 10
  mode?: "client" | "server" | "off";  // default: "server"
}
```

---

## Data Types

### GetListResponse

```typescript
interface GetListResponse<TData extends BaseRecord = BaseRecord> {
  data: TData[];
  total: number;
}
```

### GetOneResponse / CreateResponse / UpdateResponse / DeleteOneResponse

```typescript
interface GetOneResponse<TData extends BaseRecord = BaseRecord> {
  data: TData;
}

// CreateResponse, UpdateResponse, DeleteOneResponse have the same shape
```

### GetManyResponse

```typescript
interface GetManyResponse<TData extends BaseRecord = BaseRecord> {
  data: TData[];
}
```

### CustomResponse

```typescript
interface CustomResponse<TData = BaseRecord> {
  data: TData;
}
```

---

## Notification Types

### OpenNotificationParams

```typescript
interface OpenNotificationParams {
  key?: string;
  message: string;
  type: "success" | "error" | "progress";
  description?: string;
  cancelMutation?: () => void;
  undoableTimeout?: number;
}
```

### SuccessErrorNotification

```typescript
type SuccessErrorNotification<TData = unknown, TError = unknown, TVariables = unknown> = {
  successNotification?:
    | OpenNotificationParams
    | false
    | ((data?: TData, values?: TVariables, resource?: string) => OpenNotificationParams);
  errorNotification?:
    | OpenNotificationParams
    | false
    | ((error?: TError, values?: TVariables, resource?: string) => OpenNotificationParams);
};
```

---

## Authorization Types

### CanParams / CanResponse

```typescript
interface CanParams {
  resource: string;
  action: string;
  params?: {
    resource?: IResourceItem;
    id?: BaseKey;
    [key: string]: any;
  };
}

interface CanResponse {
  can: boolean;
  reason?: string;
  [key: string]: any;
}
```

---

## Resource Types

### ResourceProps

```typescript
interface ResourceProps {
  name: string;
  identifier?: string;
  list?: string;       // route path
  create?: string;
  edit?: string;
  show?: string;
  meta?: ResourceMeta;
}
```

### ResourceMeta

```typescript
interface ResourceMeta {
  label?: string;
  hide?: boolean;
  dataProviderName?: string;
  parent?: string;
  canDelete?: boolean;
  audit?: ResourceAuditLogPermissions[];
  icon?: React.ReactNode;
  [key: string]: any;
}

type ResourceAuditLogPermissions = "create" | "update" | "delete" | string;
```

### TreeMenuItem (menu items from useMenu)

```typescript
type TreeMenuItem = IResourceItem & {
  key: string;
  route?: string;
  icon?: React.ReactNode;
  label?: string;
  children: TreeMenuItem[];
};
```

---

## Provider Types

### DataProvider

```typescript
interface DataProvider {
  getList:    <TData extends BaseRecord = BaseRecord>(params: GetListParams) => Promise<GetListResponse<TData>>;
  getOne:     <TData extends BaseRecord = BaseRecord>(params: GetOneParams) => Promise<GetOneResponse<TData>>;
  create:     <TData extends BaseRecord = BaseRecord, TVariables = {}>(params: CreateParams<TVariables>) => Promise<CreateResponse<TData>>;
  update:     <TData extends BaseRecord = BaseRecord, TVariables = {}>(params: UpdateParams<TVariables>) => Promise<UpdateResponse<TData>>;
  deleteOne:  <TData extends BaseRecord = BaseRecord, TVariables = {}>(params: DeleteOneParams<TVariables>) => Promise<DeleteOneResponse<TData>>;
  getApiUrl:  () => string;

  // Optional
  getMany?:    <TData extends BaseRecord = BaseRecord>(params: GetManyParams) => Promise<GetManyResponse<TData>>;
  createMany?: <TData extends BaseRecord = BaseRecord, TVariables = {}>(params: CreateManyParams<TVariables>) => Promise<CreateManyResponse<TData>>;
  updateMany?: <TData extends BaseRecord = BaseRecord, TVariables = {}>(params: UpdateManyParams<TVariables>) => Promise<UpdateManyResponse<TData>>;
  deleteMany?: <TData extends BaseRecord = BaseRecord, TVariables = {}>(params: DeleteManyParams<TVariables>) => Promise<DeleteManyResponse<TData>>;
  custom?:     <TData extends BaseRecord = BaseRecord>(params: CustomParams) => Promise<CustomResponse<TData>>;
}
```

### AuthProvider

```typescript
interface AuthProvider {
  login:    (params: any) => Promise<AuthActionResponse>;
  check:    (params?: any) => Promise<CheckResponse>;
  logout:   (params?: any) => Promise<AuthActionResponse>;
  onError:  (error: any) => Promise<OnErrorResponse>;

  register?:        (params: any) => Promise<AuthActionResponse>;
  forgotPassword?:  (params: any) => Promise<AuthActionResponse>;
  updatePassword?:  (params: any) => Promise<AuthActionResponse>;
  getPermissions?:  (params?: any) => Promise<unknown>;
  getIdentity?:     (params?: any) => Promise<unknown>;
}

type AuthActionResponse = {
  success: boolean;
  redirectTo?: string;
  error?: Error;
  [key: string]: unknown;
};

type CheckResponse = {
  authenticated: boolean;
  redirectTo?: string;
  logout?: boolean;
  error?: Error;
};

type OnErrorResponse = {
  redirectTo?: string;
  logout?: boolean;
  error?: Error;
};
```

### NotificationProvider

```typescript
interface NotificationProvider {
  open: (params: OpenNotificationParams) => void;
  close: (key: string) => void;
}
```

### I18nProvider

```typescript
interface I18nProvider {
  translate: (key: string, options?: any, defaultMessage?: string) => string;
  changeLocale: (locale: string, options?: any) => Promise<any>;
  getLocale: () => string;
}
```

### AccessControlProvider

```typescript
interface AccessControlProvider {
  can: (params: CanParams) => Promise<CanResponse>;
  options?: {
    buttons?: { enableAccessControl?: boolean; hideIfUnauthorized?: boolean };
    queryOptions?: UseQueryOptions;
  };
}
```

---

## Realtime Types

### LiveEvent

```typescript
interface LiveEvent {
  channel: string;
  type: string;       // "created" | "updated" | "deleted" | "*"
  payload: {
    ids?: BaseKey[];
    [key: string]: any;
  };
  date: Date;
  meta?: any;
}
```

### LiveModeProps

```typescript
interface LiveModeProps {
  liveMode?: "auto" | "manual" | "off";
  onLiveEvent?: (event: LiveEvent) => void;
  liveParams?: { ids?: BaseKey[]; [key: string]: any };
}
```

---

## Query Types

### MetaQuery

```typescript
interface MetaQuery extends Record<string, any> {
  queryContext?: any;
  gqlQuery?: DocumentNode;
  gqlMutation?: DocumentNode;
  gqlVariables?: any;
  operation?: string;
  fields?: any[];
  variables?: VariableOptions;
}
```

### SyncWithLocationParams

```typescript
interface SyncWithLocationParams {
  pagination: { currentPage?: number; pageSize?: number };
  sorters: CrudSorting;
  filters: CrudFilters;
}
```
