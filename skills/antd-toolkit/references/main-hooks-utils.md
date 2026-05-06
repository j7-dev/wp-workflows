# `antd-toolkit` Core Hooks, Utils, Locales, Types

All symbols here are imported from the package root:

```ts
import { useEnv, useLocale, cn, defaultImage, zh_TW } from 'antd-toolkit'
import type { TLocale, TLimit, TVideo } from 'antd-toolkit'
```

## Table of Contents

- [Providers](#providers)
  - [LocaleProvider / useLocale](#localeprovider--uselocale)
  - [EnvProvider / useEnv / TEnv](#envprovider--useenv--tenv)
- [Hooks](#hooks)
  - [useColor](#usecolor)
  - [useColumnSearch](#usecolumnsearch)
  - [useConstantSelect](#useconstantselect)
  - [useRowSelection](#userowselection)
  - [useSimpleModal](#usesimplemodal)
  - [useSimpleDrawer](#usesimpledrawer)
- [Utility functions](#utility-functions)
  - [Antd helpers](#antd-helpers)
  - [Date helpers (dayjs)](#date-helpers-dayjs)
  - [API helpers](#api-helpers)
  - [Common helpers](#common-helpers)
  - [Video helpers](#video-helpers)
  - [Zod helper](#zod-helper)
  - [Image constants](#image-constants)
- [Locales](#locales)
- [Type definitions](#type-definitions)

---

## Providers

### `LocaleProvider` / `useLocale`

```tsx
import { LocaleProvider, useLocale, zh_TW, en_US, ja_JP } from 'antd-toolkit'
import type { TLocale } from 'antd-toolkit'
```

```ts
const LocaleProvider: FC<{
  children: React.ReactNode
  locale?: TLocale       // default zh_TW
}>

function useLocale<K extends keyof TLocale>(namespace: K): TLocale[K]
```

Wrap your app once, then call `useLocale('SomeNamespace')` inside any component to get the strings for that namespace. The default value is `zh_TW`, so without a Provider components still render with Traditional Chinese text.

Built-in locales: `zh_TW`, `en_US`, `ja_JP`. To create a custom locale, import the `TLocale` type and provide all namespaces — or spread an existing locale and override only what you need:

```tsx
import { LocaleProvider, zh_TW } from 'antd-toolkit'
import type { TLocale } from 'antd-toolkit'

const myLocale: TLocale = {
  ...zh_TW,
  ActionButton: { ...zh_TW.ActionButton, edit: 'Edit', save: 'Save' },
}

<LocaleProvider locale={myLocale}>{children}</LocaleProvider>
```

> Antd's own components (Pagination, Empty, etc.) need antd's `ConfigProvider` + `locale` separately. The toolkit `LocaleProvider` only owns the toolkit's strings.

### `EnvProvider` / `useEnv` / `TEnv`

Provides app-level env vars (typically populated server-side) and produces a Nonce/cookie-aware Axios instance.

```tsx
import { EnvProvider } from 'antd-toolkit'

<EnvProvider env={{
  SITE_URL: 'https://example.com',
  AJAX_URL: 'https://example.com/wp-admin/admin-ajax.php',
  API_URL: 'https://example.com/wp-json/my-app/v1',
  CURRENT_USER_ID: 1,
  CURRENT_POST_ID: false,
  PERMALINK: 'https://example.com/post/123',
  APP_NAME: 'my-app',
  KEBAB: 'my-app',
  SNAKE: 'my_app',
  NONCE: window.appData.nonce,
  // optional Bunny credentials picked up by useEnv()
  BUNNY_LIBRARY_ID: '123',
  BUNNY_CDN_HOSTNAME: 'vz-xxx.b-cdn.net',
  BUNNY_STREAM_API_KEY: 'xxx',
}}>
  <App />
</EnvProvider>
```

```ts
export type TEnv = {
  SITE_URL: string
  AJAX_URL: string
  API_URL: string
  CURRENT_USER_ID: number
  CURRENT_POST_ID: string | false
  PERMALINK: string
  APP_NAME: string
  KEBAB: string
  SNAKE: string
  NONCE: string
  BUNNY_LIBRARY_ID?: string
  BUNNY_CDN_HOSTNAME?: string
  BUNNY_STREAM_API_KEY?: string
  AXIOS_INSTANCE?: AxiosInstance     // populated by useEnv()
} & { [key: string]: any }            // open-shape for app-specific fields
```

`useEnv<T = TEnv>(): T & { AXIOS_INSTANCE: AxiosInstance }` returns the merged context **plus** an `AXIOS_INSTANCE` it builds on every call:

```ts
const axiosInstance = axios.create({
  timeout: 30_000,
  headers: NONCE
    ? { 'X-WP-Nonce': NONCE, 'Content-Type': 'application/json' }
    : { Authorization: 'Basic ' + btoa(STORYBOOK_USERNAME + ':' + STORYBOOK_PASSWORD), 'Content-Type': 'application/json' },
})
```

It also installs a response interceptor that handles `403` by `window.confirm`-ing the locale's `cookieExpired` text and reloading on confirm.

> Note: `useEnv()` re-builds the Axios instance on every render. If you need a stable reference, hoist it to a `useMemo` in your own code or grab it once and stash in a ref.

> The `STORYBOOK_USERNAME` / `STORYBOOK_PASSWORD` come from Vite's `import.meta.env` and are only relevant for Storybook's basic-auth path.

`<EnvProvider>` merges with parent context, so nested providers can override individual keys.

---

## Hooks

### `useColor()`

Tiny wrapper around antd's `theme.useToken()` — returns the entire token object spread.

```tsx
import { useColor } from 'antd-toolkit'

const token = useColor()
<div style={{ background: token.colorBgContainer }} />
```

```ts
function useColor(): ReturnType<typeof theme.useToken>['token']
```

### `useColumnSearch<DataType, DataIndex>()`

Returns `getColumnSearchProps(dataIndex)` — apply spread it into a `ColumnType<DataType>` to enable search-on-column with highlight. Uses `react-highlight-words` + antd's filter dropdown.

```tsx
import { useColumnSearch } from 'antd-toolkit'

const { getColumnSearchProps } = useColumnSearch<User, 'name'>()

const columns: ColumnsType<User> = [
  { title: 'Name', dataIndex: 'name', ...getColumnSearchProps('name') },
]
```

```ts
function useColumnSearch<DataType, DataIndex extends string & keyof DataType>(): {
  getColumnSearchProps: (dataIndex: DataIndex) => ColumnType<DataType>
}
```

Internal state holds `searchText` and `searchedColumn` so the `render` highlights matches in the active column. Filtering is **client-side**, case-insensitive, substring-based.

### `useConstantSelect(params)`

A controlled antd `<Select>` bound to a `TConstant<string>[]` array. Returns a memoised `Select` component plus the value/setter. Optional Tooltip wrapper.

```tsx
import { useConstantSelect } from 'antd-toolkit'

const { value, setValue, Select } = useConstantSelect({
  constants: [
    { label: 'A', value: 'a' },
    { label: 'B', value: 'b' },
  ],
  hasTooltip: true,
  tooltipProps: { title: 'pick one' },
  selectProps: { defaultValue: 'a', style: { width: 200 } },
})
```

```ts
type TConstantSelectProps = {
  constants: TConstant<string>[]
  hasTooltip?: boolean                     // false
  tooltipProps?: TooltipProps              // default { title: 'Please select' }
  selectProps?: SelectProps                // default { style: {width:120}, defaultValue: '' }
}

type TConstantSelectResponse = {
  value: string
  setValue: React.Dispatch<React.SetStateAction<string>>
  Select: React.NamedExoticComponent       // memoised <Select>
  selectProps: SelectProps                 // pre-merged props if you want to render <Select> yourself
}

export type TConstant<T> = {
  label: string
  value: T
  color?: string
}
```

### `useRowSelection<T>(rowSelectionProps?)`

Boilerplate for antd Table cross-page selection.

```tsx
import { useRowSelection } from 'antd-toolkit'

const { selectedRowKeys, setSelectedRowKeys, rowSelection } = useRowSelection<User>()
<Table rowSelection={rowSelection} dataSource={data} />
```

```ts
function useRowSelection<T>(rowSelectionProps?: TableProps<T>['rowSelection']): {
  selectedRowKeys: React.Key[]
  setSelectedRowKeys: React.Dispatch<React.SetStateAction<React.Key[]>>
  rowSelection: TableProps<T>['rowSelection']
}
```

Default rowSelection includes `selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE]`. Pass `rowSelectionProps` to override or extend.

### `useSimpleModal()`

State management hook for `<SimpleModal>` (see `references/main-components.md`).

```ts
function useSimpleModal(): {
  show: () => void                          // sets opacity:1, pointerEvents:'auto'
  close: () => void                         // sets opacity:0, pointerEvents:'none'
  modalProps: Partial<TSimpleModalProps>    // spread into <SimpleModal>
  setModalProps: React.Dispatch<React.SetStateAction<Partial<TSimpleModalProps>>>
}
```

The default `title` is the locale's `SimpleDrawerModal.defaultTitle`. Spread into the modal:

```tsx
const { show, close, modalProps, setModalProps } = useSimpleModal()
useEffect(() => {
  setModalProps((p) => ({ ...p, title: '編輯' }))
}, [])
return (
  <SimpleModal {...modalProps}>
    {/* content */}
  </SimpleModal>
)
```

Note: `modalProps.onCancel = close` is auto-set on every render.

### `useSimpleDrawer()`

Identical surface to `useSimpleModal` but for `<SimpleDrawer>`.

```ts
function useSimpleDrawer(): {
  show: () => void                            // transform:'translateX(0)', pointerEvents:'auto', opacity:1
  close: () => void                           // transform:'translateX(-100%)', pointerEvents:'none', opacity:0
  drawerProps: Partial<TSimpleDrawerProps>
  setDrawerProps: React.Dispatch<React.SetStateAction<Partial<TSimpleDrawerProps>>>
}
```

---

## Utility functions

### Antd helpers

Module: `'@/main/utils/antd'` (re-exported from package root).

```ts
// Selects
defaultSelectProps: SelectProps                                // { placeholder:'搜尋', allowClear, showSearch, mode:'multiple', optionFilterProp:'label', optionRender:<NameId/> }
useDefaultSelectProps(): SelectProps                           // localised version (uses 'AntdUtils' namespace)

// Tables
defaultTableProps: TableProps                                  // { size:'small', rowKey:'id', bordered:true, sticky:true }

// BooleanRadioButton
defaultBooleanRadioButtonProps: { radioGroupProps: RadioGroupProps }   // { radioGroupProps:{size:'small'} }

// Pagination — both versions
useDefaultPaginationProps(label?: string): PaginationProps
getDefaultPaginationProps({ label = '商品' }): PaginationProps & { position: ['…'] }

// Column filter
getColumnFilterProps<DataType>({
  dataSource: TConstant<…>[] | DataType[],
  dataIndex: keyof DataType,
  dataFrom?: 'local' | 'fetched',         // default 'local'
  exactMatch?: boolean,                   // default false
}): { filters, onFilter }

// Form helper
formatDateRangeData(values, fromProperty: string, toProperty: [string, string]): typeof values
```

`getColumnFilterProps` returns a `{ filters, onFilter }` ready for an antd Table column. `dataFrom='local'` reads `{label, value}` from a constants array; `'fetched'` reads `dataIndex` directly off each row.

`formatDateRangeData(values, 'sale_date_range', ['date_on_sale_from','date_on_sale_to'])`:

```ts
// values.sale_date_range: [Dayjs, Dayjs] | [null, null]
// →
// { …values, date_on_sale_from: <unix-seconds>, date_on_sale_to: <unix-seconds>, sale_date_range: undefined }
```

### Date helpers (dayjs)

```ts
// (Dayjs | timestamp) ⇄ string conversion
formatRangePickerValue(values, format = 'YYYY-MM-DD', fallback = []): string[] | typeof fallback
parseRangePickerValue(values): [Dayjs|undef, Dayjs|undef] | values

formatDatePickerValue(value, format = 'YYYY-MM-DD', fallback = ''): string
parseDatePickerValue(value): Dayjs | undefined
```

`parseDatePickerValue` accepts:
- `Dayjs` → returned as-is
- 13-digit number → `dayjs(ms)`
- 10-digit number → `dayjs(seconds * 1000)`
- otherwise → `dayjs(value)` (best-effort) or `undefined`

`parseRangePickerValue` applies the same rule pairwise.

### API helpers

```ts
// Axios FormData with two opinions:
//   1. empty array → '[]' string (so the backend receives "field=[]" not no field at all)
//   2. null/undefined → '' string
toFormData(data: object): GenericFormData
```

Use this when posting to a WordPress REST endpoint that doesn't tolerate missing fields.

### Common helpers

```ts
cn(...args: ClassValue[]): string                                   // = twMerge(clsx(args))
isIphone: boolean                                                    // /iPhone/.test(navigator.userAgent)

renderHTML(htmlString: string, allowJS?: boolean): React.ReactElement     // <div dangerouslySetInnerHTML>; allowJS=true also extracts & runs <script> tags via setTimeout

escapeHtml(text: string): string                                     // textContent → innerHTML round-trip

getCopyableJson(variable: object): string                            // strip-escaped JSON; returns '' for empty objects/falsy
getQueryString(name: string): string | null                          // wraps URLSearchParams(window.location.search)

getCurrencyString({ price: number|string|undefined, symbol?: string='NT$' }): string

filterObjKeys(
  obj: object,
  filterValues?: (string|number|boolean|undefined|null)[],            // default [undefined]
): object                                                              // mutates obj — drops keys whose value matches filterValues; recurses into nested objects

keyToWord(str: string): string                                       // 'snake_case' → 'Snake Case' / 'camelCase' → 'Camel Case'
isUsingBlockEditor: boolean                                          // typeof window.wp?.blocks !== 'undefined'
removeTrailingSlash(str: string): string

getGCDItems<T>(items: T[][], key?: string='id'): T[]                  // intersection by key — handy for bulk-edit common values

getFileExtension(url: string): string                                 // 'a.b.JPG' → 'jpg'; ''-safe
isImageFile(url: string): boolean                                     // jpg/jpeg/png/gif/webp
isAudioFile(url: string): boolean                                     // mp3/wav/m4a/aac/flac
isVideoFile(url: string): boolean                                     // mp4/webm

simpleDecrypt(str: string): any                                       // -1 ASCII shift then atob then JSON.parse — pairs with PHP-side encrypt
getTextContent(html: string): string                                  // DOMParser → body.textContent
valueStringify(value: any): string                                    // null/undefined/array/etc → readable string
```

> `cn`, `renderHTML`, `valueStringify`, `keyToWord`, and `getTextContent` are heavily used by other components — prefer the package's own `cn` over importing `clsx` directly to ensure tailwind-merge runs.

### Video helpers

```ts
getYoutubeVideoId(url: string | null): string | null      // accepts youtu.be/* and youtube.com/?v=
getVimeoVideoId(url: string | null): string | null        // matches /\d+/ in vimeo.com/<id>
getEstimateUploadTimeInSeconds(fileSize: number): number   // assumes 30 Mbps
getVideoUrl(file: File): string                            // URL.createObjectURL(file)
```

### Zod helper

```ts
import { safeParse } from 'antd-toolkit'
import { ZodType } from 'zod/v4'

safeParse(scheme: ZodType, data: any): void                // logs error.issues on failure; no return value
```

> Note: this targets `zod/v4` specifically (the package depends on `zod ^3.25` which exposes `zod/v4` as a sub-export).

### Image constants

```ts
defaultImage: string         // bundled JPG asset URL
defaultImageVideo: string    // 'https://placehold.co/480x270?text=<IMG />'
fakeImage: string            // 'https://picsum.photos/480/270' — random
```

`defaultImage` is the fallback for `<SimpleImage>`, `<Gallery>`, `<ProductName>`, `<UserName>`, etc.

---

## Locales

```ts
import { zh_TW, en_US, ja_JP } from 'antd-toolkit'
import type { TLocale } from 'antd-toolkit'
```

`TLocale` is a deeply nested type that lists every namespace + key. Notable namespaces:

| Namespace | Used by |
|-----------|---------|
| `ActionButton` | `<ActionButton>` |
| `PopconfirmDelete` | `<PopconfirmDelete>` |
| `CopyText` | `<CopyText>` |
| `Countdown` | `<Countdown>` |
| `DateTime` | `<DateTime>` |
| `SecondToStr` | `<SecondToStr>` |
| `WatchStatusTag` | `<WatchStatusTag>` |
| `Limit` | `<Limit>` |
| `FormDatePicker` | `<DatePicker>` (toolkit form item) |
| `FormRangePicker` | `<RangePicker>` (toolkit form item) |
| `SelectedRecord` | `<SelectedRecord>` |
| `ToggleContent` | `<ToggleContent>` |
| `SimpleDrawer` | `<SimpleDrawer>` (closeConfirm) |
| `SimpleDrawerModal` | `useSimpleModal`/`useSimpleDrawer` defaults |
| `EnvProvider` | `useEnv` axios interceptor |
| `BindItems`, `GrantUsers`, `RevokeUsers`, `UnbindItems`, `UpdateBoundItems`, `UpdateGrantedUsers` | refine batch components |
| `SelectedItem` | refine `<SelectedItem>` |
| `RefineCommon` | refine delete-button defaults |
| `BackToWpAdmin` | wp `<BackToWpAdmin>` |
| `CopyResources` | wp `<CopyResources>` |
| `WpMediaLibrary` | wp `<MediaLibrary>` |
| `MediaLibraryNotification` | wp + bunny notification |
| `OnChangeUpload`, `Upload` | wp upload components |
| `UserFilter` | wp `<UserFilter>` |
| `ProductType` | wp `<ProductType>` |
| `VideoInput`, `VideoLength` | toolkit form items |
| `EditorDrawer` | `<BlockNoteDrawer>`, `<DescriptionDrawer>` |
| `AlertBlock`, `BunnyVideoBlock`, `CustomHTMLBlock`, `MediaLibraryBlock` | BlockNote custom blocks |
| `BunnyModule` | refine bunny `<MediaLibrary>` |
| `ProductFilter` | refine `<ProductFilter>` |
| `WpMediaLibraryItem`, `WpMediaLibraryItemInfo`, `WpMediaLibraryUploadFile`, `WpMediaLibraryModal` | wp media library internals |
| `ProductStock` | wp `<ProductStock>` |
| `ProductBoundItems` | wp `<ProductBoundItems>` |
| `ProductTotalSales` | wp `<ProductTotalSales>` |
| `FileUpload` | wp `<FileUpload>` |
| `UserAvatarUpload` | wp `<UserAvatarUpload>` |
| `AntdUtils` | `useDefaultSelectProps`, `useDefaultPaginationProps` |
| `WpConstants` | `useBooleanOptions`, `usePostStatus`, `useUserRoles` |
| `WcProduct` | `useBackorders`, `useProductStockStatus`, `useProductDateFields`, `useProductTypes`, `useProductCatalogVisibilities`, `useProductFilterLabels` |
| `WcOrder` | `useOrderStatus` |

Some namespaces include **functions** (e.g., `paginationTotal: (a, b, c, label) => string`). When extending a locale, keep these as functions; the components call them directly.

Full file list:
- `lib/main/locales/zh_TW.ts` — default
- `lib/main/locales/en_US.ts`
- `lib/main/locales/ja_JP.ts`
- `lib/main/locales/types.ts` — `TLocale` definition

---

## Type definitions

Re-exported from package root:

```ts
// Constants & filters
export type TConstant<T> = { label: string; value: T; color?: string }
export type TGetColumnFilterProps<T> = {
  dataSource: readonly TConstant<string|number|boolean>[] | readonly T[]
  dataIndex: keyof T
  dataFrom?: 'local' | 'fetched'
  exactMatch?: boolean
}

// HTTP
export type THttpMethods = 'get'|'post'|'put'|'patch'|'delete'|'head'|'options'
export type THttpMethodsWithBody = Exclude<THttpMethods, 'get'|'head'|'options'>

// Sorting (matches WP_Query's orderby values)
export type TOrderBy =
  | 'none'|'ID'|'author'|'title'|'name'|'type'|'date'|'modified'|'parent'
  | 'rand'|'comment_count'|'relevance'|'menu_order'|'meta_value'|'meta_value_num'
  | 'post__in'|'post_name__in'|'post_parent__in'
export type TOrder = 'ASC' | 'DESC'

// Limit
export type TLimitType = 'unlimited' | 'fixed' | 'assigned' | 'follow_subscription'
export type TLimitUnit = 'second' | 'day' | 'month' | 'year' | ''
export type TLimit = {
  limit_type: TLimitType
  limit_value: number | ''      // for 'fixed': N days/months/years; for 'assigned': unix seconds
  limit_unit: TLimitUnit
}

// Video
export type TVideoType = 'youtube' | 'vimeo' | 'bunny-stream-api' | 'code'
export type TVideo = { type: TVideoType; id: string; meta: { [key:string]: any } }

// Watch status
export type TExpireDate = {
  is_subscription: boolean
  subscription_id: number | null
  is_expired: boolean
  timestamp: number | null      // 0 → unlimited; null → empty
}
```
