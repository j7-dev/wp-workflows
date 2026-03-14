---
name: refine
description: Refine React meta-framework 開發專家。精通 CRUD-heavy 應用程式架構、Data/Auth/Router Provider 系統、Ant Design UI 整合、REST Data Provider (@refinedev/rest)。當使用者需要建立 Refine 應用程式、實作 Provider、整合 Ant Design 元件、配置路由或資料層時，請啟用此技能。
---

# Refine — React CRUD Meta-Framework 開發指南

**相容版本**：`@refinedev/core ^4.x`, `@refinedev/antd ^5.x`, `@refinedev/react-router ^1.x`

## 核心概念

Refine 是一個針對 **CRUD-heavy** 網頁應用程式優化的 React meta-framework，採用 **headless 架構**，商業邏輯與 UI 完全解耦。

### 三大支柱

1. **Provider 系統** — 可替換的服務層（Data、Auth、Router、Notification、i18n、Access Control）
2. **Resource 概念** — 將 API endpoint 映射至 CRUD 路由的核心抽象
3. **Hooks 架構** — 基於 TanStack Query 的 headless data hooks

---

## 安裝與基本設定

```bash
npm create refine-app@latest
# 或手動安裝
npm i @refinedev/core @refinedev/react-router @refinedev/antd antd
npm i @refinedev/rest  # REST Data Provider
```

### 最小化 App.tsx

```tsx
import { Refine } from "@refinedev/core";
import { BrowserRouter, Route, Routes } from "react-router";
import routerProvider from "@refinedev/react-router";
import dataProvider from "@refinedev/simple-rest";

export default function App() {
  return (
    <BrowserRouter>
      <Refine
        routerProvider={routerProvider}
        dataProvider={dataProvider("https://api.example.com")}
        resources={[
          {
            name: "products",
            list: "/products",
            show: "/products/:id",
            edit: "/products/:id/edit",
            create: "/products/new",
          },
        ]}
      >
        <Routes>
          <Route path="/products" element={<ProductList />} />
        </Routes>
      </Refine>
    </BrowserRouter>
  );
}
```

> 完整 App 範例見 [references/app-setup.md](./references/app-setup.md)

---

## `<Refine>` Component 屬性

| 屬性 | 類型 | 說明 |
|------|------|------|
| `dataProvider` | `DataProvider \| Record<string, DataProvider>` | 必要。單一或多個 data provider |
| `routerProvider` | `RouterProvider` | 路由整合 |
| `authProvider` | `AuthProvider` | 認證/授權 |
| `notificationProvider` | `NotificationProvider` | 通知系統 |
| `i18nProvider` | `I18nProvider` | 國際化 |
| `accessControlProvider` | `AccessControlProvider` | 存取控制 |
| `resources` | `ResourceProps[]` | 資源定義清單 |
| `options` | `RefineOptions` | 全域設定（mutationMode、syncWithLocation 等）|

### Resource 定義

```tsx
resources={[
  {
    name: "products",          // API resource 名稱（傳給 data provider）
    identifier: "my-products", // 可選，用於 UI 匹配（不影響 API 呼叫）
    list: "/products",
    show: "/products/:id",
    edit: "/products/:id/edit",
    create: "/products/new",
    meta: {
      label: "產品管理",        // 選單顯示名稱
      icon: <ShopOutlined />,
      canDelete: true,
    },
  },
]}
```

---

## Data Provider

Data Provider 是 Refine 與後端通訊的橋樑。必要方法：`getList`、`getOne`、`create`、`update`、`deleteOne`、`getApiUrl`。選用方法：`getMany`、`createMany`、`updateMany`、`deleteMany`、`custom`。

> 完整介面定義與自訂範例見 [references/data-provider.md](./references/data-provider.md)

### @refinedev/rest（REST Data Provider）

```typescript
import { createDataProvider } from "@refinedev/rest";

const { dataProvider, kyInstance } = createDataProvider(
  "https://api.example.com/v1",
  {
    getList: {
      buildQueryParams: ({ pagination, sorters, filters }) => ({
        _page: pagination?.current,
        _limit: pagination?.pageSize,
        _sort: sorters?.[0]?.field,
        _order: sorters?.[0]?.order,
      }),
      getTotalCount: ({ response }) =>
        Number(response.headers.get("x-total-count")),
    },
  }
);
```

> 完整範例見 [references/rest-data-provider.md](./references/rest-data-provider.md)

---

## Auth Provider

Auth Provider 處理登入、登出、認證檢查與錯誤處理。必要方法：`login`、`check`、`logout`、`onError`。選用方法：`register`、`forgotPassword`、`updatePassword`、`getPermissions`、`getIdentity`。

```typescript
// 常用 Hooks
import { useLogin, useLogout, useIsAuthenticated, useGetIdentity } from "@refinedev/core";

const { mutate: login } = useLogin();
const { data: authData } = useIsAuthenticated();
```

> 完整介面定義與範例見 [references/auth-provider.md](./references/auth-provider.md)

---

## Data Hooks

所有 data hooks 基於 TanStack Query，自動處理快取、重新驗證和錯誤狀態。

| Hook | 用途 | Data Provider 方法 |
|------|------|-------------------|
| `useList` | 取得列表（分頁、排序、篩選） | `getList` |
| `useOne` | 取得單筆資料 | `getOne` |
| `useCreate` | 建立資料 | `create` |
| `useUpdate` | 更新資料 | `update` |
| `useDelete` | 刪除資料 | `deleteOne` |
| `useTable` | 整合表格狀態 | `getList` |
| `useCustom` | 自訂 API 呼叫 | `custom` |
| `useMany` | 批量取得 | `getMany` |

### Filter Operators

| operator | 說明 |
|----------|------|
| `eq` / `ne` | 等於 / 不等於 |
| `lt` / `gt` / `lte` / `gte` | 比較運算 |
| `contains` / `startswith` / `endswith` | 字串匹配 |
| `in` / `nin` | 清單匹配 |
| `between` | 範圍 |
| `null` / `nnull` | 空值檢查 |

> 完整 hooks 範例與用法見 [references/data-hooks.md](./references/data-hooks.md)

---

## Ant Design UI 整合（@refinedev/antd）

### 必要設定

```tsx
import "@refinedev/antd/dist/reset.css"; // 必須匯入
import { App as AntdApp, ConfigProvider } from "antd";
import { RefineThemes, useNotificationProvider } from "@refinedev/antd";

<ConfigProvider theme={RefineThemes.Blue}>
  <AntdApp>
    <Refine notificationProvider={useNotificationProvider}>
      {/* ... */}
    </Refine>
  </AntdApp>
</ConfigProvider>
```

### CRUD 頁面元件

| 元件 | 用途 |
|------|------|
| `<List>` | 列表頁容器，自動加入建立按鈕 |
| `<Show>` | 顯示頁容器，含編輯/刪除按鈕 |
| `<Edit>` | 編輯頁容器，含儲存按鈕 |
| `<Create>` | 建立頁容器，含儲存按鈕 |

### useTable（@refinedev/antd）

```tsx
import { useTable, List, getDefaultSortOrder, FilterDropdown } from "@refinedev/antd";
import { Table } from "antd";

export const ProductList = () => {
  const { tableProps, sorters, filters } = useTable<IProduct>({
    syncWithLocation: true,
    sorters: { initial: [{ field: "id", order: "desc" }] },
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="name" title="名稱" sorter
          defaultSortOrder={getDefaultSortOrder("name", sorters)} />
      </Table>
    </List>
  );
};
```

### useForm（@refinedev/antd）

```tsx
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";

export const ProductEdit = () => {
  const { formProps, saveButtonProps } = useForm<IProduct>({
    action: "edit",
    redirect: "show",
  });

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="名稱" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Form>
    </Edit>
  );
};
```

> 完整 CRUD 頁面、欄位顯示元件與操作按鈕範例見 [references/antd-crud.md](./references/antd-crud.md)

---

## Router Provider

```typescript
// React Router v7
import routerProvider from "@refinedev/react-router";

// Next.js
import routerProvider from "@refinedev/nextjs-router";
```

### 路由 Hooks

```typescript
import { useGo, useBack, useParsed, useNavigation } from "@refinedev/core";

const go = useGo();
go({ to: { resource: "products", action: "list" } });
go({ to: "/custom-page", type: "push" });

const { resource, action, id, params } = useParsed();

const { list, show, edit, create } = useNavigation();
list("products");
show("products", 1);
```

---

## Notification Provider

```tsx
import { useNotificationProvider } from "@refinedev/antd";

<Refine notificationProvider={useNotificationProvider}>
  {/* 會自動顯示 CRUD 操作的成功/失敗通知 */}
</Refine>
```

### 手動觸發通知

```typescript
import { useNotification } from "@refinedev/core";

const { open, close } = useNotification();

open({
  type: "success", // "success" | "error" | "progress"
  message: "操作成功",
  description: "資料已儲存",
  key: "unique-key",
});
close("unique-key");
```

---

## Access Control Provider

```typescript
import { useCan, CanAccess } from "@refinedev/core";

// Hook 方式
const { data: { can } } = useCan({
  resource: "products",
  action: "delete",
  params: { id: 1 },
});

// Component 方式
<CanAccess resource="products" action="create" fallback={<span>無權限</span>}>
  <CreateButton />
</CanAccess>
```

---

## 進階設定

### Mutation Mode

```tsx
<Refine
  options={{
    mutationMode: "optimistic", // "pessimistic" | "optimistic" | "undoable"
    syncWithLocation: true,     // URL 與 table 狀態同步
    warnWhenUnsavedChanges: true,
  }}
>
```

### 多個 Data Provider

```tsx
<Refine
  dataProvider={{
    default: restDataProvider("https://api.example.com"),
    cms: strapiDataProvider("https://cms.example.com"),
  }}
>
```

```typescript
useList({ resource: "posts", dataProviderName: "cms" });
```

### Meta 傳遞

```typescript
// 傳遞自訂參數到 data provider
useList({
  resource: "products",
  meta: {
    headers: { Authorization: `Bearer ${token}` },
    queryContext: { tenant: "acme" },
  },
});
```

---

## 最佳實踐

1. **Resource 命名** — 使用複數小寫（`products`、`blog-posts`），對應 API path
2. **Provider 抽象** — 不要在元件內直接 fetch，透過 hooks 使用 data provider
3. **Type Safety** — 為每個 resource 定義 interface，傳給 hooks 泛型
4. **Error Handling** — Auth Provider 的 `onError` 處理 401/403 自動登出
5. **Optimistic Updates** — CRUD-heavy 應用建議使用 `mutationMode: "optimistic"`
6. **URL Sync** — 在列表頁啟用 `syncWithLocation: true` 確保狀態可分享
7. **Meta 使用** — 透過 `meta` 傳遞 headers、tenant ID 等上下文資訊

---

## 套件速查

| 套件 | 用途 |
|------|------|
| `@refinedev/core` | 核心 hooks 和 providers |
| `@refinedev/react-router` | React Router v7 整合 |
| `@refinedev/nextjs-router` | Next.js 整合 |
| `@refinedev/antd` | Ant Design UI 整合 |
| `@refinedev/mui` | Material UI 整合 |
| `@refinedev/simple-rest` | 簡易 REST data provider |
| `@refinedev/rest` | 進階 REST data provider（KY-based）|
| `@refinedev/strapi-v4` | Strapi v4 data provider |
| `@refinedev/supabase` | Supabase data provider |

---

## 參考文件

依需要載入對應的詳細文件：

- **App 設定範例**：`references/app-setup.md`
- **Data Provider 完整介面**：`references/data-provider.md` — 介面定義、自訂實作範例
- **REST Data Provider**：`references/rest-data-provider.md` — KY-based REST provider 設定
- **Auth Provider**：`references/auth-provider.md` — 完整介面、回傳類型、範例實作
- **Data Hooks**：`references/data-hooks.md` — useList/useOne/useCreate/useUpdate/useDelete/useTable 完整範例
- **Ant Design CRUD**：`references/antd-crud.md` — CRUD 頁面、欄位顯示元件、操作按鈕
