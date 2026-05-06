# `antd-toolkit/refine` — Refine Integration & Bunny Stream

All symbols here are imported from the `antd-toolkit/refine` subpath:

```ts
import {
  dataProvider, bunnyStreamDataProvider,
  notificationProvider, notificationProps,
  useDeleteButtonProps, defaultDeleteButtonProps,
  objToCrudFilters, onProductSearch,
  BunnyProvider, useBunny,
  MediaLibrary, MediaLibraryModal, useMediaLibraryModal,
  useListVideo, useGetVideo,
  FilterTags, BindItems, UnbindItems, GrantUsers, RevokeUsers,
  UpdateBoundItems, UpdateGrantedUsers, ActionArea, SelectedItem,
  ProductFilter, useUpdateRecord,
} from 'antd-toolkit/refine'

import type {
  TGrantedItemBase, TProductFilterProps, UseCustomMutationParams,
  TBunnyVideo, TGetVideosResponse, TUploadVideoResponse, TUploadStatus, TFileInQueue,
  TMediaLibraryProps as TBunnyMediaLibraryProps, TFileStatus,
} from 'antd-toolkit/refine'
```

> **Pre-requisite**: Almost everything here needs a Refine context (`<Refine dataProvider={…}>`) up the tree. Many components also need `<EnvProvider>`. The Bunny module additionally needs `<BunnyProvider>`.

## Table of Contents

- [Data Providers](#data-providers)
  - [`dataProvider(apiUrl, axios)`](#dataproviderapiurl-axios)
  - [`bunnyStreamDataProvider(apiUrl, axios?)`](#bunnystreamdataproviderapiurl-axios)
- [Notifications](#notifications)
  - [`notificationProvider`](#notificationprovider)
  - [`notificationProps`](#notificationprops)
- [Filter helpers](#filter-helpers)
  - [`objToCrudFilters`](#objtocrudfilters)
  - [`onProductSearch`](#onproductsearch)
- [Delete-button helpers](#delete-button-helpers)
- [Hook: `useUpdateRecord`](#hook-useupdaterecord)
- [Batch CRUD components](#batch-crud-components)
  - [`BindItems` / `UnbindItems` / `UpdateBoundItems`](#binditems--unbinditems--updateboundtems)
  - [`GrantUsers` / `RevokeUsers` / `UpdateGrantedUsers`](#grantusers--revokeusers--updategrantedusers)
- [`FilterTags`](#filtertags)
- [`ActionArea`](#actionarea)
- [`SelectedItem`](#selecteditem)
- [`ProductFilter`](#productfilter)
- [Bunny Stream module](#bunny-stream-module)

---

## Data Providers

### `dataProvider(apiUrl, axios)`

WordPress REST-shaped Refine `DataProvider`. Implements **every** method in the `DataProvider` contract (`Required<DataProvider>`).

```ts
import { dataProvider } from 'antd-toolkit/refine'
import axios from 'axios'

const httpClient = axios.create({ headers: { 'X-WP-Nonce': '...' } })

const dp = dataProvider('https://example.com/wp-json/my-app/v1', httpClient)
```

Behaviour highlights (read source: `lib/refine/dataProvider/index.ts`):

| Method | URL | Method | Notes |
|--------|-----|--------|-------|
| `getList` | `${apiUrl}/${resource}?paged=…&posts_per_page=…&{filters}&{sort}` | `meta.method` or `'get'` | Pagination is encoded as WP's `paged` + `posts_per_page`; reads `x-wp-totalpages`/`x-wp-total`/`x-wp-currentpage` from response headers |
| `getMany` | `${apiUrl}/${resource}?include[]=1&include[]=2…` | `meta.method` or `'get'` | |
| `getOne` | `${apiUrl}/${resource}/${id}?{meta.variables}` | `meta.method` or `'get'` | |
| `create` | `${apiUrl}/${resource}` | `meta.method` or `'post'` | `Content-Type: multipart/form-data;` |
| `createMany` | `${apiUrl}/${resource}` | `meta.method` or `'post'` | multipart, sends array as `variables` |
| `update` | `${apiUrl}/${resource}/${id}` | `meta.method` or `'post'` | multipart |
| `updateMany` | `${apiUrl}/${resource}` | `meta.method` or `'post'` | multipart, payload includes `ids` + `action: 'update-many'` |
| `deleteOne` | `${apiUrl}/${resource}/${id}` | `meta.method` or `'delete'` | multipart |
| `deleteMany` | `${apiUrl}/${resource}` | `meta.method` or `'delete'` | `application/json`, payload `{…variables, ids}` |
| `getApiUrl` | (returns `apiUrl`) | — | |
| `custom` | `${url}?{sort}&{filter}&{query}` | per `method` | Plays nicely with `useCustomMutation` and `useCustom` |

Filters are encoded with `query-string`'s `arrayFormat: 'bracket'` (so a list filter becomes `?status[]=publish&status[]=draft`).

Errors are coerced to `{ message, statusCode: 500 }` — the underlying `error.response.data.message`/`error.message`/`error` is folded into `message` so `notificationProvider` displays it.

Three sort utilities live in `lib/refine/dataProvider/utils/`:
- `mapOperator(operator)` — Refine ops → WP-friendly tokens
- `generateFilter(filters)` — `CrudFilters` → query object
- `generateSort(sorters)` — `CrudSorting` → URL-encoded `_sort` / `_order`

These are exported from the data-provider module as well.

### `bunnyStreamDataProvider(apiUrl, axios?)`

```ts
import { bunnyStreamDataProvider } from 'antd-toolkit/refine'
import axios from 'axios'

const bunnyDp = bunnyStreamDataProvider('https://video.bunnycdn.com/library', axios)
```

Returns `Omit<Required<DataProvider>, 'createMany'|'updateMany'|'deleteMany'>` — those three are **not** implemented. Otherwise the surface mirrors Bunny's video API:
- `getList` returns `{ data: items, total: items.length || data.totalItems }`
- `getList` query keys are `page`, `itemsPerPage` (not WP's `paged` / `posts_per_page`).
- `create` / `update` / `getOne` / `deleteOne` follow `${apiUrl}/${resource}/${id}` semantics.

Inside `<BunnyProvider>` you get this configured automatically — the provider builds its own axios + dataProvider and stores them in context. You only call `bunnyStreamDataProvider` directly if you want to register it with Refine as `dataProvider={{ 'bunny-stream': bunnyStreamDataProvider(…) }}`. The Bunny hooks (`useListVideo`, `useGetVideo`) default to `dataProviderName: 'bunny-stream'` so registering it under that name is the lowest-friction path.

## Notifications

### `notificationProvider`

A `NotificationProvider` for Refine that uses antd's `notification` API. Custom icons + colour for each `type`:

| `type` | Colour | Icon |
|--------|--------|------|
| `'success'` | `#52c41a` | `<CheckCircleTwoTone twoToneColor="#52c41a" />` |
| `'open'` (also used by `'progress'`) | `#1677ff` | `<InfoCircleTwoTone twoToneColor="#1677ff" />` |
| `'error'` (default) | `#ff4d4f` | `<CloseCircleTwoTone twoToneColor="#ff4d4f" />` |

Other props passed: `showProgress: true`, `pauseOnHover: true`, `description`, custom `message` colour.

### `notificationProps`

A handy `{ successNotification, errorNotification }` pair for `useCreate` / `useUpdate` / `useCustomMutation` so the body of the response feeds the notification message:

```ts
import { notificationProps } from 'antd-toolkit/refine'

useUpdate({ resource: 'posts', ...notificationProps })
```

```ts
type SuccessFn = (
  data: AxiosResponse<{ code: number; message: string; data?: any }>,
  values: any,
  resource: string,
) => { message: string; type: 'success' }

type ErrorFn = (
  data: AxiosError<{ code: number; message: string; data?: any }>,
  values: any,
  resource: string,
) => { message: string; type: 'error' }
```

The success handler reads `data.data.message`, falling back to `'成功'`. The error handler tries `error.response.data.message` then `error.message` then `'失敗'`, and pipes through `getTextContent` to strip HTML tags (WP error messages often contain `<a>` etc.).

## Filter helpers

### `objToCrudFilters`

Convert a flat `{ key: value }` form-state object into Refine's `CrudFilters[]` shape. Skips falsy values.

```ts
import { objToCrudFilters } from 'antd-toolkit/refine'

const filters = objToCrudFilters({ s: 'foo', status: 'publish', empty: '' })
// → [
//   { field: 's', operator: 'eq', value: 'foo' },
//   { field: 'status', operator: 'eq', value: 'publish' },
// ]
```

```ts
function objToCrudFilters(values: BaseRecord): CrudFilters
```

> A `getInitialFilters` alias is also exported but **deprecated** — use `objToCrudFilters`.

### `onProductSearch`

WC-aware variant of `objToCrudFilters` that flips the operator on `date_created` to `'between'` (since dates are usually a range).

```ts
import { onProductSearch } from 'antd-toolkit/refine'

const filters = onProductSearch({
  s: 'shoe', status: 'publish',
  date_created: [dayjsStart, dayjsEnd],   // → operator: 'between'
})
```

```ts
function onProductSearch(values: TProductFilterProps): CrudFilters | Promise<CrudFilters>
```

## Delete-button helpers

```ts
import { useDeleteButtonProps, defaultDeleteButtonProps } from 'antd-toolkit/refine'
```

```ts
const useDeleteButtonProps: () => DeleteButtonProps         // localised version (uses RefineCommon namespace)

const defaultDeleteButtonProps: DeleteButtonProps           // hard-coded zh_TW: { confirmTitle:'確認刪除嗎?', confirmOkText:'確認', confirmCancelText:'取消', hideText:true, type:'text' }
```

Spread into `<DeleteButton>` from `@refinedev/antd`.

## Hook: `useUpdateRecord`

Helper for inline-editable antd Tables. Manages `editingKey` state, returns props you spread into `<Form>` and `<Table>`.

> **Packaging caveat**: in the source the hook is `export default useUpdateRecord` from `lib/refine/hooks/useUpdateRecord.tsx`. The barrel files use `export * from`, which does **not** propagate default exports — so you can **not** do `import { useUpdateRecord } from 'antd-toolkit'` or `from 'antd-toolkit/refine'`. Reach into the deep path with a default import:
>
> ```ts
> // ✅ Works (deep import of default export)
> import useUpdateRecord from 'antd-toolkit/dist/refine/hooks/useUpdateRecord'
> ```
>
> If you need a stable public surface, wrap it in your own module. Track upstream — a future minor may reclassify as a named export.

```tsx
// Conceptual usage (assuming the deep path import above)
import type { BaseRecord } from '@refinedev/core'

type Row = BaseRecord & { id: string; name: string; price: number }

function MyTable() {
  const { formProps, editableTableProps, EditButton, isEditing } =
    useUpdateRecord<Row>({
      rowKey: 'id',
      onFinish: (values) => updateMutate.mutate(values),
    })

  return (
    <Form {...formProps}>
      <Table<Row>
        {...editableTableProps}
        dataSource={rows}
        rowKey="id"
        columns={[
          { title: 'Name', dataIndex: 'name',
            onCell: (record): any => ({
              record,
              cellInput: { el: <Input/>, required: true, message: 'Name required' },
              dataIndex: 'name',
            }) },
          { title: '', render: (_v, record) => <EditButton record={record} /> },
        ]}
      />
    </Form>
  )
}
```

```ts
type TUpdateRecordProps<T extends BaseRecord> = {
  rowKey: keyof T
  onFinish?: (values: { [key: string]: any; key: React.Key }) => void
}

type TUpdateRecordResponse<T extends BaseRecord> = {
  formProps: FormProps<T>                                 // spread on <Form>
  editableTableProps: {
    components: { body: { cell: EditableCellFC } }
    rowClassName: 'editable-row'
  }                                                        // spread on <Table>
  editingKey: string
  EditButton: React.NamedExoticComponent<{ record: T }>
  form: FormInstance<T>
  isEditing: (record: T) => boolean
  edit: (record: T) => void
  save: (recordKey: React.Key) => Promise<void>
  cancel: () => void
}

type EditableCellProps<T> = {
  record: T
  cellInput: { el: React.ReactNode; required?: boolean; message?: string }
  dataIndex: string
  index: number
  children: React.ReactNode
} & React.HTMLAttributes<HTMLElement>
```

The `EditButton` shows an *Edit* circle icon by default, swapping to *Save* + *Cancel* circle icons during edit.

`save` calls your `onFinish` with `{ ...form.getFieldsValue(), key }`. Errors are swallowed (resets editing state regardless).

## Batch CRUD components

These all share a similar structure: pick **N** items from a Refine resource via `useItemSelect`, click a button → POST to a meta-key-bound endpoint → invalidate Refine cache. Locale strings come from `BindItems` / `UnbindItems` / `UpdateBoundItems` / `GrantUsers` / `RevokeUsers` / `UpdateGrantedUsers` namespaces.

### `BindItems` / `UnbindItems` / `UpdateBoundItems`

Use case: associate multiple **items** (e.g., courses) with multiple **products**, with a `TLimit` expiry/quota. The `meta_key` is the WP postmeta key under which the IDs are stored.

#### `BindItems`

```tsx
import { BindItems } from 'antd-toolkit/refine'
import type { Course } from './types'

<Form>
  {/* Limit form item — provides limit_type/limit_value/limit_unit */}
  <Limit />
  <BindItems<Course>
    product_ids={['p1', 'p2']}
    meta_key="bound_courses_ids"
    label="課程"
    useSelectProps={{ resource: 'courses' }}
    selectProps={{ /* override antd Select props */ }}
    url={`/products/bind-items`}                     // optional — defaults to `${apiUrl}/products/bind-items`
    useCustomMutationParams={{ /* axios overrides */ }}
    useInvalidateProp={{ resource: 'products' }}
  />
</Form>
```

```ts
type TBindItemsProps<T> = {
  product_ids: string[]                                              // required
  meta_key: string                                                   // required
  useSelectProps: UseSelectProps<T, HttpError, T>                    // required — must provide resource
  selectProps?: SelectProps
  url?: string                                                       // default `${apiUrl}/products/bind-items`
  useCustomMutationParams?: UseCustomMutationParams
  label?: string
  useInvalidateProp?: Partial<UseInvalidateProp>                     // default { resource:'products', invalidates:['list'] }
}
```

Sent payload (multipart):
```ts
{ product_ids, item_ids, meta_key, limit_type, limit_value, limit_unit }
```

Disabled when `!product_ids.length || !item_ids.length`.

#### `UnbindItems`

```tsx
<UnbindItems
  product_ids={['p1','p2']}
  item_ids={['c1','c2']}
  meta_key="bound_courses_ids"
  label="課程"
  onSettled={() => closeDrawer()}
/>
```

Wraps `<PopconfirmDelete type="button">`. Sends `{ product_ids, item_ids, meta_key }` to `${apiUrl}/products/unbind-items` (or your `url`). Invalidates `'products'` `'list'` by default.

#### `UpdateBoundItems`

Reads `TLimit` from the surrounding `<Form>` via `Form.useFormInstance()` and bulk-updates the limit on the bound items.

```tsx
<Form>
  <Limit />
  <UpdateBoundItems
    product_ids={['p1']}
    item_ids={['c1']}
    meta_key="bound_courses_ids"
  />
</Form>
```

Sends `{ product_ids, item_ids, meta_key, ...limitFields }` to `${apiUrl}/products/update-bound-items`.

### `GrantUsers` / `RevokeUsers` / `UpdateGrantedUsers`

Mirror of the bind/unbind set, but for `user_ids` × `item_ids` with a single `expire_date` (Unix seconds).

#### `GrantUsers`

```tsx
import { GrantUsers } from 'antd-toolkit/refine'

<GrantUsers<Course>
  user_ids={['u1','u2']}
  useSelectProps={{ resource: 'courses' }}
  label="授予課程"
  url={`/limit/grant-users`}
/>
```

```ts
type TGrantUsersProps<T> = {
  user_ids: string[]                                       // required
  useSelectProps: UseSelectProps<T, HttpError, T>          // required
  selectProps?: SelectProps
  url?: string                                             // default `${apiUrl}/limit/grant-users`
  useCustomMutationParams?: UseCustomMutationParams
  label?: string                                           // displayed on the trigger button
  hideLabel?: boolean
  useInvalidateProp?: Partial<UseInvalidateProp>           // default { resource:'users', invalidates:['list'] }
}
```

Sends `{ user_ids, item_ids, expire_date: time?.unix() ?? 0 }`. Includes a `<DatePicker>` for the expiry, defaulting to no value (= unlimited).

#### `RevokeUsers`

`<PopconfirmDelete type="button">` wrapper that POSTs `{ user_ids, item_ids }` to `${apiUrl}/limit/revoke-users`.

```ts
type TRevokeUsersProps = {
  user_ids: React.Key[]
  item_ids: string[]
  onSettled?: () => void
  url?: string
  useCustomMutationParams?: UseCustomMutationParams
  label?: string
  useInvalidateProp?: Partial<UseInvalidateProp>           // default { resource:'users', invalidates:['list'] }
}
```

#### `UpdateGrantedUsers`

DatePicker + button compound that POSTs `{ user_ids, item_ids, timestamp: time?.unix() ?? 0 }` to `${apiUrl}/limit/update-users`. After success, resets the local DatePicker to undefined.

```ts
type TUpdateGrantedUsersProps = {
  user_ids: string[]
  item_ids: string[]
  onSettled?: () => void
  url?: string
  useCustomMutationParams?: UseCustomMutationParams
  useInvalidateProp?: Partial<UseInvalidateProp>           // default { resource:'users', invalidates:['list'] }
}
```

## `FilterTags`

Pure UI component that turns a `<Form>`'s current values into removable `<Tag>` chips.

```tsx
import { FilterTags } from 'antd-toolkit/refine'
import { useProductFilterLabels } from 'antd-toolkit/wp'

<FilterTags<MyFilter>
  form={form}
  keyLabelMapper={(key) => labelMap[key as string] ?? String(key)}
  valueLabelMapper={(val, key) => `${val}`}
  booleanKeys={['featured','virtual']}
/>
```

```ts
function FilterTags<T = BaseRecord>(props: {
  form: FormInstance<T>
  keyLabelMapper?: (key: keyof T) => string                    // default: String(key)
  valueLabelMapper?: (value: string, key?: keyof T) => string  // default: String(value)
  booleanKeys?: (keyof T)[]                                     // these keys' values "1" / "0" → mapped via valueLabelMapper as "true" / "false"
}): JSX.Element
```

Tag generation rules (in order):
1. `undefined` / `null` / `''` → no tag.
2. Array of Dayjs (length>0) → single tag formatted as `YYYY/MM/DD ~ YYYY/MM/DD`. Closing the tag clears the field.
3. Array of strings or numbers → one tag per element. Closing a tag removes that element from the array.
4. Boolean → tag with `valueLabelMapper(value.toString())`.
5. Otherwise → single tag. If `key` is in `booleanKeys`, value `'1'` / `'0'` is mapped to `'true'` / `'false'` first.

Memoised. After every change it submits the form (`form.submit()`), which is what triggers Refine's re-fetch.

## `ActionArea`

Sticky bottom bar that respects Refine's `<ThemedLayoutV2>` sider state (collapsed / expanded). Use to hold bulk-action buttons when a Table has rowSelection.

```tsx
import { ActionArea } from 'antd-toolkit/refine'

<ActionArea>
  <Button onClick={bulkDelete}>批次刪除</Button>
</ActionArea>
```

```ts
type TActionAreaProps = {
  mainPadding?: [number, number]      // [mobile, desktop] px. default [12, 24]
  collapsedWidth?: number             // default 80  — must match your sider's collapsed width
  expandedWidth?: number              // default 200 — must match your sider's expanded width
  style?: React.CSSProperties
  children: React.ReactNode
}
```

Calculates width via `useThemedLayoutContext().siderCollapsed` and `Grid.useBreakpoint().lg`. Falls back to mobile layout when `lg` is `undefined`.

## `SelectedItem`

Cross-page selection indicator (refine-flavoured twin of core's `<SelectedRecord>`).

```tsx
import { SelectedItem } from 'antd-toolkit/refine'

<SelectedItem
  ids={selectedIds}
  label="課程"
  onClear={() => setSelectedIds([])}
  onSelected={() => navigateToFiltered()}
/>
```

```ts
type Props = {
  ids: string[]
  onClear?: () => void
  onSelected?: () => void
  label?: string                        // default '物件'
  tooltipProps?: TooltipProps
}
```

Differs from core `<SelectedRecord>` in: simpler typings (string ids only), no `hideOnEmpty` prop, locale namespace is `SelectedItem`.

## `ProductFilter`

Big WC product filter that shows full filter (desktop) or modal (mobile).

```tsx
import { ProductFilter } from 'antd-toolkit/refine'
import type { TProductFilterOptions } from 'antd-toolkit/refine'

<ProductFilter
  searchFormProps={searchFormProps}      // from useTable({ syncWithLocation: true })
  options={options}                       // shape below
  mobileWidth={810}                       // px — under this width, switch to mobile dialog
/>
```

```ts
type TProductFilterOptions = {
  product_cats: TTerm[]
  product_tags: TTerm[]
  product_shipping_classes: TTerm[]
  product_brands: (TTerm & { logo: string })[]
  top_sales_products: (TTerm & { total_sales: number })[]
  max_price: number
  min_price: number
  isLoading: boolean
}

const initialFilteredValues = {
  status: [],
  featured: '',
  downloadable: '',
  virtual: '',
  sold_individually: '',
}
```

Internally uses `<Form>` from `searchFormProps` → renders sub-controls (status, featured, virtual, downloadable, sold_individually, brand, category, tag, price range, sales tier, etc.). Reads texts from the `ProductFilter` locale namespace.

Memoised.

---

## Bunny Stream module

Bunny Stream is a CDN-backed video service. The toolkit ships a complete UI (provider + hooks + media library + modal) for picking and uploading videos.

### `BunnyProvider`

Wraps your tree to expose Bunny credentials + a pre-built axios + a Refine-compatible dataProvider.

```tsx
import { BunnyProvider } from 'antd-toolkit/refine'

<BunnyProvider
  bunny_library_id="123"
  bunny_stream_api_key="xxx-xxx"
  bunny_cdn_hostname="vz-xxx.b-cdn.net">
  <App />
</BunnyProvider>
```

```ts
type TBunnyContext = {
  bunny_library_id: string
  bunny_stream_api_key: string
  bunny_cdn_hostname: string
  bunny_stream_axios: AxiosInstance              // populated automatically
  bunny_data_provider_result: DataProvider       // populated automatically
}
```

Internal axios baseURL: `https://video.bunnycdn.com/library`. Auth header: `AccessKey: <bunny_stream_api_key>`. Inherits parent context (so a deeper Provider can override).

### `useBunny()`

```ts
function useBunny(): TBunnyContext
```

Exposes everything the provider stored. Use it to read the library ID inside hooks.

### `useListVideo(params?)`

Wraps Refine's `useList` with `bunny-stream` data-provider name and the `${library_id}/videos` resource.

```tsx
import { useListVideo } from 'antd-toolkit/refine'

const { data, isLoading } = useListVideo()
const videos = data?.data ?? []
```

```ts
type TUseListVideoParams<T = TBunnyVideo> = {
  dataProviderName?: string                                    // default 'bunny-stream'
  queryOptions?: UseQueryOptions<GetListResponse<T>, HttpError, GetListResponse<T>, QueryKey>
}

function useListVideo(params?: TUseListVideoParams):
  | ReturnType<typeof useList>
  | { data: never[]; isFetching: false; isLoading: false; isError: true }   // returned when useBunny throws
```

> Pagination defaults to 50 items per page. `enabled: !!bunny_library_id` so it's a no-op until credentials are set.

### `useGetVideo(params)`

```ts
function useGetVideo(params: {
  videoId: string
  queryOptions?: UseQueryOptions<GetOneResponse<TBunnyVideo>, HttpError, GetOneResponse<TBunnyVideo>, QueryKey>
}): ReturnType<typeof useOne<TBunnyVideo>>
```

Equivalent to `useOne({ resource: '${library_id}/videos', id: videoId, dataProviderName: 'bunny-stream' })`.

### `MediaLibrary`

Full Bunny media library UI: tabs (`Media Library` + `Settings`), drag-and-drop overlay, upload button.

```tsx
import { MediaLibrary } from 'antd-toolkit/refine'
import type { TMediaLibraryProps } from 'antd-toolkit/refine'

const [selectedItems, setSelectedItems] = useState<TBunnyVideo[]>([])

<MediaLibrary
  selectedItems={selectedItems}
  setSelectedItems={setSelectedItems}
  limit={1}                                          // single-pick
  uploadProps={{ accept: 'video/mp4' }}              // forwarded to antd <Upload>
  tabsProps={{ defaultActiveKey: 'bunny-settings' }} // forwarded to antd <Tabs>
/>
```

```ts
type TMediaLibraryProps = {
  selectedItems: TBunnyVideo[]
  setSelectedItems: React.Dispatch<React.SetStateAction<TBunnyVideo[]>>
  limit?: number                                     // default 1 (in DEFAULT) but unconstrained at type-level
  uploadProps?: UploadProps
  tabsProps?: TabsProps
}
```

If any of `bunny_library_id` / `bunny_stream_api_key` / `bunny_cdn_hostname` is missing, the Media Library tab is disabled and the Settings tab opens by default.

### `MediaLibraryModal` + `useMediaLibraryModal`

Wrap `MediaLibrary` inside a `SimpleModal`.

```tsx
import { MediaLibraryModal, useMediaLibraryModal } from 'antd-toolkit/refine'

const {
  show, close, modalProps,
  selectedItems, setSelectedItems,
} = useMediaLibraryModal({
  onConfirm: (items) => form.setFieldValue('video', items[0]?.guid),
  initItems: [],
})

<>
  <Button onClick={show}>選擇影片</Button>
  <MediaLibraryModal
    modalProps={modalProps}
    mediaLibraryProps={{ selectedItems, setSelectedItems, limit: 1 }}
  />
</>
```

```ts
function useMediaLibraryModal(params?: {
  onConfirm?: (selectedItems: TBunnyVideo[]) => void
  initItems?: TBunnyVideo[]
}): {
  show: () => void
  close: () => void
  modalProps: TSimpleModalProps                  // pre-filled with footer + title
  setModalProps: React.Dispatch<React.SetStateAction<TSimpleModalProps>>
  selectedItems: TBunnyVideo[]
  setSelectedItems: React.Dispatch<React.SetStateAction<TBunnyVideo[]>>
}
```

Default footer is a single `<Button type="primary">` showing `BunnyModule.confirmSelect(N)`. `initItems` rehydrates `selectedItems` whenever its `guid` set changes.

### `MediaLibraryNotification`

Top-level notification of in-progress uploads. Reads from a global `filesInQueueAtom` (jotai). Mount once near the root.

```tsx
import { MediaLibraryNotification } from 'antd-toolkit/refine'

<App>
  <YourPages />
  <MediaLibraryNotification />
</App>
```

It registers a single `notification` with `key='files-uploading'` and renders one progress bar per file. Closing it sets the atom back to `[]`.

### Bunny types

```ts
import type {
  TBunnyVideo, TGetVideosResponse, TUploadVideoResponse,
  TUploadStatus, TFileInQueue, TFileStatus,
} from 'antd-toolkit/refine'

type TBunnyVideo = {
  videoLibraryId: number
  guid: string
  title: string
  dateUploaded: string
  views: number
  isPublic: boolean
  length: number              // seconds
  status: number              // bunny's status code
  framerate: number
  rotation: null | number
  width: number
  height: number
  availableResolutions: null | string
  thumbnailCount: number
  encodeProgress: number
  storageSize: number
  captions: any[]
  hasMP4Fallback: boolean
  collectionId: string
  thumbnailFileName: string
  averageWatchTime: number
  totalWatchTime: number
  category: string
  chapters: any[]
  moments: any[]
  metaTags: any[]
  transcodingMessages: { timeStamp: string; level: number; issueCode: number; message: string; value: string }[]
}

type TGetVideosResponse = {
  totalItems: number
  currentPage: number
  itemsPerPage: number
  items: TBunnyVideo[]
}

type TUploadVideoResponse = { success: boolean; message: string; statusCode: number }

type TUploadStatus = 'active' | 'normal' | 'exception' | 'success' | undefined

type TFileInQueue = {
  key: string
  file: import('antd/lib/upload/interface').RcFile
  status?: TUploadStatus
  videoId: string
  isEncoding: boolean
  encodeProgress: number
  uploadProgress: number
  preview?: string
}

type TFileStatus = {            // alternative shape used by MediaLibrary internals
  key: string
  file: File
  status: 'active' | 'done' | 'error'
  videoId: string
  isEncoding: boolean
  encodeProgress: number
  uploadProgress: number
  preview: string
}
```

The thumbnail URL convention: `https://${bunny_cdn_hostname}/${guid}/${thumbnailFileName}`. The HLS playback URL: `https://${bunny_cdn_hostname}/${guid}/playlist.m3u8`.

## Refine-flavoured types

```ts
export type TGrantedItemBase = {
  id: string
  name: string
  expire_date: TExpireDate                 // see core types
}

export type TProductFilterProps = Partial<{
  s: string
  sku: string
  type: (typeof PRODUCT_TYPES)[number]['value']
  product_category_id?: string[]
  product_tag_id?: string[]
  product_brand_id?: string[]
  status: string
  featured: boolean
  downloadable: boolean
  virtual: boolean
  sold_individually: boolean
  backorders: string
  stock_status: string
  date_created: [Dayjs, Dayjs]
  is_course: boolean
  price_range: [number, number]
  author: string
  include: string[]
}>

export type UseCustomMutationParams<TVariables = { [key: string]: any }> = {
  url: string
  method?: 'post' | 'put' | 'patch' | 'delete'
  values?: TVariables
  meta?: MetaQuery
  metaData?: MetaQuery
  dataProviderName?: string
  config?: { headers?: {} }
}
```
