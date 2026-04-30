# Refine v5 Other Providers Reference

> Source: https://refine.dev/core/docs/

## Table of Contents

- [Notification Provider](#notification-provider)
- [Access Control Provider](#access-control-provider)
- [Live Provider (Realtime)](#live-provider)
- [I18n Provider](#i18n-provider)
- [Audit Log Provider](#audit-log-provider)

---

## Notification Provider

### Interface

```typescript
interface NotificationProvider {
  open: (params: OpenNotificationParams) => void;
  close: (key: string) => void;
}

interface OpenNotificationParams {
  key?: string;
  message: string;
  type: "success" | "error" | "progress";
  description?: string;
  cancelMutation?: () => void;     // for undoable mutations
  undoableTimeout?: number;        // countdown in seconds
}
```

### Ant Design Integration

```tsx
import { useNotificationProvider } from "@refinedev/antd";

<Refine notificationProvider={useNotificationProvider} />
```

### useNotification Hook

```tsx
import { useNotification } from "@refinedev/core";

const { open, close } = useNotification();

open({
  type: "success",
  message: "Record saved",
  description: "Product has been updated successfully",
  key: "save-product-1",
});

close("save-product-1");
```

### Custom Provider

```typescript
const notificationProvider: NotificationProvider = {
  open: ({ key, message, type, description, cancelMutation, undoableTimeout }) => {
    if (type === "progress") {
      // Show undoable notification with countdown
      toast.info(message, {
        autoClose: undoableTimeout * 1000,
        closeButton: <button onClick={cancelMutation}>Undo</button>,
      });
    } else {
      toast[type](message, { description });
    }
  },
  close: (key) => {
    toast.dismiss(key);
  },
};
```

---

## Access Control Provider

### Interface

```typescript
interface AccessControlProvider {
  can: (params: CanParams) => Promise<CanResponse>;
  options?: {
    buttons?: {
      enableAccessControl?: boolean;    // default: true
      hideIfUnauthorized?: boolean;     // default: false
    };
    queryOptions?: UseQueryOptions;      // caching config
  };
}

interface CanParams {
  resource: string;
  action: string;                        // "list" | "create" | "edit" | "delete" | "show" | custom
  params?: {
    resource?: IResourceItem;
    id?: BaseKey;
    [key: string]: any;
  };
}

interface CanResponse {
  can: boolean;
  reason?: string;                       // shown as tooltip on disabled buttons
  [key: string]: any;
}
```

### Implementation

```typescript
const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action, params }) => {
    const userRole = getUserRole();

    // Role-based
    if (resource === "admin-settings" && userRole !== "admin") {
      return { can: false, reason: "Admin only" };
    }

    // Action-based
    if (action === "delete" && userRole === "viewer") {
      return { can: false, reason: "Viewers cannot delete" };
    }

    // Record-based (ABAC)
    if (action === "edit" && params?.id) {
      const record = await getRecord(resource, params.id);
      if (record.ownerId !== currentUserId) {
        return { can: false, reason: "You can only edit your own records" };
      }
    }

    return { can: true };
  },
  options: {
    buttons: {
      enableAccessControl: true,
      hideIfUnauthorized: false,      // false = disable, true = hide
    },
  },
};
```

### useCan Hook

```tsx
import { useCan } from "@refinedev/core";

const { data } = useCan({
  resource: "products",
  action: "delete",
  params: { id: 1 },
});

if (data?.can) {
  // show delete button
}
```

### CanAccess Component

```tsx
import { CanAccess } from "@refinedev/core";

<CanAccess
  resource="products"
  action="create"
  fallback={<span>No permission</span>}
>
  <CreateButton />
</CanAccess>
```

---

## Live Provider

### Interface

```typescript
interface LiveProvider {
  subscribe: (params: {
    channel: string;
    params?: { ids?: BaseKey[]; [key: string]: any };
    types: string[];
    callback: (event: LiveEvent) => void;
    meta?: any;
  }) => any;  // returns subscription reference

  unsubscribe: (subscription: any) => void;

  publish?: (event: {
    channel: string;
    type: string;       // "created" | "updated" | "deleted" | "*"
    payload: { ids?: BaseKey[]; [key: string]: any };
    date: Date;
    meta?: any;
  }) => void;
}

interface LiveEvent {
  channel: string;
  type: string;
  payload: { ids?: BaseKey[]; [key: string]: any };
  date: Date;
  meta?: any;
}
```

### Configuration

```tsx
<Refine
  liveProvider={liveProvider}
  options={{ liveMode: "auto" }}  // "auto" | "manual" | "off"
>
```

- `auto`: Queries auto-invalidate on live events
- `manual`: Events fire `onLiveEvent` callback but don't invalidate
- `off`: No live subscriptions

### Live Hooks

```tsx
// usePublish -- send events
import { usePublish } from "@refinedev/core";
const publish = usePublish();
publish({
  channel: "resources/products",
  type: "updated",
  payload: { ids: [1] },
  date: new Date(),
});

// useSubscription -- custom subscriptions
import { useSubscription } from "@refinedev/core";
useSubscription({
  channel: "resources/products",
  types: ["created", "updated"],
  onLiveEvent: (event) => {
    console.log("Live event:", event);
  },
});
```

### Per-Hook Override

```tsx
useList({
  resource: "products",
  liveMode: "manual",
  onLiveEvent: (event) => {
    // handle manually
  },
});
```

---

## I18n Provider

### Interface

```typescript
interface I18nProvider {
  translate: (key: string, options?: any, defaultMessage?: string) => string;
  changeLocale: (locale: string, options?: any) => Promise<any>;
  getLocale: () => string;
}
```

### Implementation with react-i18next

```typescript
import { useTranslation } from "react-i18next";

const { t, i18n } = useTranslation();

const i18nProvider: I18nProvider = {
  translate: (key, options, defaultMessage) => t(key, defaultMessage, options),
  changeLocale: (locale) => i18n.changeLanguage(locale),
  getLocale: () => i18n.language,
};

<Refine i18nProvider={i18nProvider} />
```

### useTranslation Hook

```tsx
import { useGetLocale, useSetLocale, useTranslation } from "@refinedev/core";

// Translation
const { translate } = useTranslation();  // alias for i18nProvider.translate
translate("products.titles.list");

// Locale management
const locale = useGetLocale()();
const changeLocale = useSetLocale();
changeLocale("zh-TW");
```

### Translation Keys (auto-generated)

Refine auto-generates keys for resources:
- `{resource}.titles.list` / `.create` / `.edit` / `.show`
- `{resource}.fields.{fieldName}`
- `actions.create` / `.edit` / `.delete` / `.show` / `.list`
- `buttons.create` / `.save` / `.delete` / `.edit` / `.cancel`
- `notifications.success` / `.error`

---

## Audit Log Provider

### Interface

```typescript
interface AuditLogProvider {
  create: (params: {
    resource: string;
    action: string;          // "create" | "update" | "delete"
    data?: any;
    previousData?: any;
    author?: { name?: string; [key: string]: any };
    meta?: Record<string, any>;
  }) => void;

  get: (params: {
    resource: string;
    action?: string;
    meta?: Record<string, any>;
    author?: Record<string, any>;
  }) => Promise<any>;

  update: (params: {
    id: BaseKey;
    name: string;
  }) => Promise<any>;
}
```

### Auto-logging

Refine automatically calls `auditLogProvider.create` for:
- `useCreate` / `useCreateMany`
- `useUpdate` / `useUpdateMany`
- `useDelete` / `useDeleteMany`

### Hooks

```tsx
import { useLog, useLogList } from "@refinedev/core";

// Manual logging
const { mutate: log } = useLog();
log({
  resource: "products",
  action: "custom-action",
  data: { customField: "value" },
  meta: { reason: "manual trigger" },
});

// Query logs
const { data: logs } = useLogList({
  resource: "products",
  action: "update",
});
```
