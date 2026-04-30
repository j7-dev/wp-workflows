---
name: refine-v5
description: >
  Refine v5 完整技術參考，對應 @refinedev/core ^5.x、@refinedev/antd ^6.x、@refinedev/react-router ^2.x。
  當程式碼出現任何以下情況時，必須使用此 skill：
  import from '@refinedev/core'、'@refinedev/antd'、'@refinedev/react-router'、'@refinedev/rest'、
  '@refinedev/simple-rest'、'@refinedev/react-hook-form'、'@refinedev/react-table'；
  使用 useList、useOne、useCreate、useUpdate、useDelete、useForm、useTable、useShow、useSelect、
  useInfiniteList、useMany、useCustom、useGo、useParsed、useIsAuthenticated、useCan、useMenu、
  useNotification、useInvalidate 等 Refine hooks；
  定義 DataProvider、AuthProvider、RouterProvider、AccessControlProvider、LiveProvider、
  NotificationProvider、I18nProvider、AuditLogProvider 等 Provider；
  使用 <Refine>、<Authenticated>、<CanAccess>、ThemedLayout、List、Show、Edit、Create 等元件；
  任何涉及 Refine CRUD 應用程式、admin panel、dashboard 或 B2B 應用的開發任務。
  此 skill 對應 v5，不適用於 v4（v4 有獨立 SKILL）。
  即使用戶沒有明確說出 Refine，只要任務涉及上述 import 或 hooks，也應使用此 skill。
---

# Refine v5 -- React CRUD Meta-Framework

> **適用版本**: @refinedev/core ^5.x | **文件來源**: https://refine.dev/core/docs/ | **最後更新**: 2026-04-30

Refine 是針對 CRUD-heavy 網頁應用（admin panels、dashboards、B2B apps）優化的 React meta-framework。採用 headless 架構，商業邏輯與 UI 完全解耦。基於 TanStack Query v5。

## v5 vs v4 關鍵差異

v5 的主要破壞性變更（完整遷移指南見 `references/migration-v4-to-v5.md`）：

| 變更 | v4 | v5 |
|------|----|----|
| TanStack Query | v4 | **v5** |
| Hook 回傳結構 | `{ data, isLoading }` | **`{ result, query: { isLoading } }`** |
| Mutation 回傳 | `{ mutate, isLoading }` | **`{ mutate, mutation: { isPending } }`** |
| `queryResult` | `queryResult` | **`query`** |
| `mutationResult` | `mutationResult` | **`mutation`** |
| `tableQueryResult` | `tableQueryResult` | **`tableQuery`** |
| `current/setCurrent` | `current/setCurrent` | **`currentPage/setCurrentPage`** |
| `metaData` | `metaData` | **`meta`** |
| `sort/sorter` | `sort/sorter` | **`sorters`** |
| `config` 巢狀 | `config: { pagination, sorters }` | **頂層參數** |
| `useResource` | `useResource("posts")` | **`useResourceParams({ resource: "posts" })`** |
| Layout 元件 | `ThemedLayoutV2` | **`ThemedLayout`** |
| 型別 | `AuthBindings` | **`AuthProvider`** |
| React 支援 | 18 | **18 + 19** |

## 核心架構

```
<Refine>
  ├── dataProvider        -- 後端通訊（CRUD + custom）
  ├── authProvider        -- 認證（login/logout/check/onError）
  ├── routerProvider      -- 路由整合（React Router/Next.js/Remix）
  ├── accessControlProvider -- 權限控制
  ├── notificationProvider  -- 通知系統
  ├── liveProvider        -- 即時更新
  ├── i18nProvider        -- 國際化
  ├── auditLogProvider    -- 審計日誌
  └── resources[]         -- 資源定義（name + CRUD 路由）
```

## 安裝

```bash
npm i @refinedev/core @refinedev/react-router @refinedev/antd antd @refinedev/rest
```

## 最小化 App.tsx

```tsx
import { Refine, Authenticated } from "@refinedev/core";
import routerProvider from "@refinedev/react-router";
import { BrowserRouter, Route, Routes, Outlet } from "react-router";
import { ConfigProvider, App as AntdApp } from "antd";
import {
  ThemedLayout, RefineThemes, useNotificationProvider, ErrorComponent,
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";
import { createDataProvider } from "@refinedev/rest";

const { dataProvider } = createDataProvider("https://api.example.com");

export default function App() {
  return (
    <BrowserRouter>
      <ConfigProvider theme={RefineThemes.Blue}>
        <AntdApp>
          <Refine
            routerProvider={routerProvider}
            dataProvider={dataProvider}
            notificationProvider={useNotificationProvider}
            resources={[
              {
                name: "products",
                list: "/products",
                show: "/products/:id",
                edit: "/products/:id/edit",
                create: "/products/new",
                meta: { canDelete: true },
              },
            ]}
          >
            <Routes>
              <Route element={<ThemedLayout><Outlet /></ThemedLayout>}>
                <Route path="/products" element={<ProductList />} />
                <Route path="/products/:id" element={<ProductShow />} />
                <Route path="/products/:id/edit" element={<ProductEdit />} />
                <Route path="/products/new" element={<ProductCreate />} />
                <Route path="*" element={<ErrorComponent />} />
              </Route>
            </Routes>
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}
```

## 核心 Data Hooks 速查

| Hook | 用途 | Data Provider 方法 | 回傳 |
|------|------|-------------------|------|
| `useList` | 列表（分頁/排序/篩選） | `getList` | `{ result: { data, total }, query }` |
| `useOne` | 單筆資料 | `getOne` | `{ result, query }` |
| `useCreate` | 建立 | `create` | `{ mutate, mutation }` |
| `useUpdate` | 更新 | `update` | `{ mutate, mutation }` |
| `useDelete` | 刪除 | `deleteOne` | `{ mutate, mutation }` |
| `useMany` | 批量取得 | `getMany` | `{ result, query }` |
| `useInfiniteList` | 無限捲動 | `getList` | `{ result, query }` |
| `useCustom` | 自訂查詢 | `custom` | `{ query }` |
| `useCustomMutation` | 自訂變更 | `custom` | `{ mutate, mutation }` |
| `useForm` | 表單 CRUD | `create`/`update` | `{ onFinish, query, mutation }` |
| `useTable` | 表格狀態 | `getList` | `{ tableQuery, currentPage, sorters, filters }` |
| `useShow` | 顯示頁 | `getOne` | `{ query, showId, setShowId }` |
| `useSelect` | 下拉選單 | `getList` | `{ options, onSearch, query }` |
| `useInvalidate` | 快取失效 | -- | `invalidate()` |

## 常用模式

### useList + 分頁/排序/篩選

```tsx
const { result, query: { isLoading } } = useList<IProduct>({
  resource: "products",
  pagination: { currentPage: 1, pageSize: 10 },
  sorters: [{ field: "name", order: "asc" }],
  filters: [{ field: "status", operator: "eq", value: "active" }],
});
const products = result.data; // IProduct[]
const total = result.total;   // number
```

### useForm (create)

```tsx
import { useForm, Create } from "@refinedev/antd";
import { Form, Input } from "antd";

const { formProps, saveButtonProps } = useForm<IProduct>({
  resource: "products",
  action: "create",
  redirect: "list",
});

return (
  <Create saveButtonProps={saveButtonProps}>
    <Form {...formProps} layout="vertical">
      <Form.Item label="Name" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
    </Form>
  </Create>
);
```

### useTable (Ant Design)

```tsx
import { useTable, List, FilterDropdown, getDefaultSortOrder } from "@refinedev/antd";
import { Table, Select } from "antd";

const { tableProps, sorters } = useTable<IProduct>({
  syncWithLocation: true,
  sorters: { initial: [{ field: "id", order: "desc" }] },
});

return (
  <List>
    <Table {...tableProps} rowKey="id">
      <Table.Column dataIndex="id" title="ID" sorter
        defaultSortOrder={getDefaultSortOrder("id", sorters)} />
      <Table.Column dataIndex="name" title="Name" />
      <Table.Column dataIndex="status" title="Status"
        filterDropdown={(props) => (
          <FilterDropdown {...props}>
            <Select options={[
              { label: "Active", value: "active" },
              { label: "Draft", value: "draft" },
            ]} />
          </FilterDropdown>
        )} />
    </Table>
  </List>
);
```

### useModalForm (Ant Design)

```tsx
import { useModalForm } from "@refinedev/antd";

const { modalProps, formProps, show } = useModalForm<IProduct>({
  action: "create",
  autoResetForm: true,
});

// show() 開啟 modal，show(id) 切換為 edit
```

## Filter Operators

| operator | 說明 |
|----------|------|
| `eq` / `ne` | 等於 / 不等於 |
| `lt` / `gt` / `lte` / `gte` | 比較運算 |
| `contains` / `startswith` / `endswith` | 字串匹配 |
| `containss` / `startswiths` / `endswiths` | 大小寫敏感匹配 |
| `in` / `nin` | 清單匹配 |
| `ina` / `nina` | 陣列欄位匹配 |
| `between` / `nbetween` | 範圍 |
| `null` / `nnull` | 空值檢查 |
| `or` / `and` | 邏輯組合（ConditionalFilter） |

## 注意事項與陷阱

1. **v5 Hook 回傳結構已變更** -- `data` 不再直接在頂層，改為 `result` + `query` 分離
2. **Mutation hooks 使用 `isPending`** -- 不再是 `isLoading`（TanStack Query v5 變更）
3. **`metaData` 已改名為 `meta`** -- 所有 hooks 和 resource config 一致
4. **`sort` 已改名為 `sorters`** -- 包含 useTable 的 `initialSorter` -> `sorters.initial`
5. **useResource 已移除** -- 改用 `useResourceParams`
6. **ThemedLayoutV2 已移除** -- 改用 `ThemedLayout`（去掉 V2 後綴）
7. **config 巢狀結構已移除** -- pagination、sorters、filters 直接作為頂層參數
8. **React 19 支援** -- v5 同時支援 React 18 和 19

## <Refine> Component 重要選項

```tsx
<Refine
  options={{
    mutationMode: "optimistic",      // "pessimistic" | "optimistic" | "undoable"
    undoableTimeout: 5000,           // undoable 模式倒數
    syncWithLocation: true,          // URL 同步 table 狀態
    warnWhenUnsavedChanges: true,    // 離開未儲存提醒
    liveMode: "auto",               // "auto" | "manual" | "off"
    redirect: {                      // CRUD 後重導向
      afterCreate: "list",
      afterEdit: "list",
      afterClone: "list",
    },
    reactQuery: {                    // TanStack Query 設定
      clientConfig: {
        defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } },
      },
    },
    useNewQueryKeys: true,           // 建議 v5 啟用
  }}
/>
```

## 專案規則自動安裝

當偵測到專案使用 Refine v5（package.json 中有 `@refinedev/core` ^5.x），**必須**執行以下 script 將 Refine 開發規範寫入專案的 `.claude/rules/`：

```bash
bash ~/.claude/skills/refine-v5/scripts/install-rule.sh /path/to/project
```

此 rule 確保：
- 所有 `.ts` / `.tsx` 檔案套用 Refine v5 資料存取規範
- 禁止直接 API 呼叫，強制使用 Data Hooks
- 提醒開發者優先參考 SKILL 文件
- 標記正確的 v5 API 命名（`result`、`query`、`meta`、`sorters` 等）

---

## References 導引

| 需求 | 參閱檔案 |
|------|---------|
| Data hooks 完整 API（useList/useOne/useCreate/useUpdate/useDelete/useForm/useTable 等） | `references/data-hooks.md` |
| Data Provider 完整介面與 REST provider 設定 | `references/data-provider.md` |
| Auth Provider 介面與認證 hooks | `references/auth-provider.md` |
| Router Provider、路由 hooks（useGo/useParsed/useNavigation） | `references/routing.md` |
| Ant Design 整合（useTable/useForm/useModalForm/useDrawerForm/useSelect/元件） | `references/antd-integration.md` |
| 其他 Providers（Notification/Live/AccessControl/I18n/AuditLog） | `references/providers.md` |
| v4 to v5 完整遷移指南 | `references/migration-v4-to-v5.md` |
| 核心 TypeScript 介面參考 | `references/type-references.md` |
