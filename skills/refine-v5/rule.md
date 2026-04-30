---
paths:
  - "**/*.{ts,tsx}"
---

# Refine v5 資料存取規範

## SKILL 優先參考

進行任何 Refine v5 相關開發時，**必須**優先參考 SKILL `/zenbu-powers:refine-v5`：

| SKILL 文件 | 用途 |
|------------|------|
| `SKILL.md` | 核心概覽、v5 vs v4 差異、Hook 速查 |
| `references/data-hooks.md` | useList/useOne/useCreate/useUpdate/useDelete/useForm/useTable/useShow/useSelect 等 Data Hooks |
| `references/data-provider.md` | Data Provider 介面與 REST Provider 設定 |
| `references/auth-provider.md` | Auth Provider 介面與認證 hooks |
| `references/routing.md` | Router Provider 與路由 hooks（useGo/useParsed/useNavigation） |
| `references/antd-integration.md` | Ant Design 整合（useTable/useForm/useModalForm/useDrawerForm/useSelect/元件） |
| `references/providers.md` | Notification/Live/AccessControl/I18n/AuditLog Providers |
| `references/migration-v4-to-v5.md` | v4 → v5 完整遷移指南 |
| `references/type-references.md` | 核心 TypeScript 介面參考 |

## 版本注意

- 此專案使用 **Refine v5**（`@refinedev/core ^5.x`、`@refinedev/antd ^6.x`、`@refinedev/react-router ^2.x`）
- 基於 **TanStack Query v5**
- Hook 回傳結構為 `{ result, query }` / `{ mutate, mutation }`（不是 v4 的 `{ data, isLoading }`）
- `metaData` → `meta`、`sort` → `sorters`、`current` → `currentPage`
- Layout 元件為 `ThemedLayout`（不是 `ThemedLayoutV2`）

## 禁止直接 API 呼叫

- **禁止**使用 `fetch`、`axios`、`ky` 或其他 HTTP 客戶端直接呼叫 API
- **所有資料讀取與寫入必須透過 Refine 的 Data Provider + Data Hooks** 進行
- 這確保與 Refine 的快取機制、樂觀更新、錯誤處理、loading 狀態管理完整整合
- 唯一例外：Refine Data Provider 本身的實作內部可使用 HTTP 客戶端

```tsx
// ❌ 錯誤：直接使用 fetch
const response = await fetch('/api/products')

// ❌ 錯誤：直接使用 axios
const { data } = await axios.get('/api/products')

// ✅ 正確：使用 Refine Data Hook
const { result, query: { isLoading } } = useList<IProduct>({
  resource: 'products',
})

// ✅ 正確：使用 mutation hook
const { mutate } = useCreate<IProduct>()
mutate({ resource: 'products', values: { name: 'New Product' } })
```

## Hooks 使用規範

- 讀取資料使用 `useList`、`useOne`、`useMany`、`useInfiniteList`、`useShow`、`useSelect`
- 寫入資料使用 `useCreate`、`useUpdate`、`useDelete`
- 表格狀態使用 `useTable`（`@refinedev/antd`）
- 表單狀態使用 `useForm`、`useModalForm`、`useDrawerForm`、`useStepsForm`（`@refinedev/antd`）
- 自訂 API 使用 `useCustom`（查詢）、`useCustomMutation`（變更）
- 快取失效使用 `useInvalidate`

## Resource 命名

- 使用複數小寫（`products`、`blog-posts`），對應 API path
- 透過 `meta` 傳遞 headers、tenant ID 等上下文資訊
- 多 Data Provider 時使用 `dataProviderName` 指定

## Type Safety

- 為每個 resource 定義 `interface`，傳給 hooks 泛型參數
- 使用 `HttpError` 型別處理錯誤
- Filter/Sorter 使用 `CrudFilters` / `CrudSorting` 型別
