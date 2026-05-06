# `antd-toolkit/wp` — WordPress / WooCommerce UI

All symbols here are imported from the `antd-toolkit/wp` subpath:

```ts
import {
  // components
  Upload, OnChangeUpload, BackToWpAdmin, MediaLibrary, MediaLibraryModal,
  MediaLibraryNotification, CopyResources, FileUpload,
  ProductName, ProductType, ProductPrice, ProductStock, ProductTotalSales,
  ProductCat, ProductBoundItems,
  UserName, UserAvatarUpload, UserFilter, UserRole,
  // hooks
  useUpload, useOnChangeUpload, useItemSelect,
  useWoocommerce, useCountries, useCountryOptions, useProductTaxonomies,
  useMediaLibraryModal,
  // localised constants (Hook variants)
  useBooleanOptions, usePostStatus, useUserRoles,
  useBackorders, useProductStockStatus, useProductDateFields, useProductTypes,
  useProductCatalogVisibilities, useProductFilterLabels, useOrderStatus,
  // helpers
  stringToBool, boolToString,
  isVariable, isVariation, isSubscription,
  getProductFilterLabels, productKeyLabelMapper, getOrderStatus,
  // module-level constants (kept for back-compat — prefer the hook versions)
  BOOLEAN_OPTIONS, BOOLEAN_OPTIONS_REVERSE,
  POST_STATUS, PRODUCT_STATUS, USER_ROLES, ORDER_STATUS,
  BACKORDERS, PRODUCT_STOCK_STATUS, PRODUCT_DATE_FIELDS,
  PRODUCT_TYPES, PRODUCT_CATALOG_VISIBILITIES,
  // schemas
  WoocommerceSchema, TaxonomySchema, DEFAULT_WOOCOMMERCE,
} from 'antd-toolkit/wp'

import type {
  TImage, TTerm, TPostStatus, TOrderStatus,
  TUserBaseRecord, TProductBaseRecord, TProductVariationBase,
  TProductAttribute, TProductType, TProductStockStatus, TBackorders,
  TWoocommerce, TTaxonomy, TAttachment,
  TMediaLibraryProps as TWpMediaLibraryProps,
} from 'antd-toolkit/wp'
```

> **Pre-requisites**: most components call `useApiUrl()` from Refine and `useEnv()` from `antd-toolkit`. Wrap the tree with both `<EnvProvider>` (for `NONCE`, `SITE_URL`, `API_URL`) **and** `<Refine dataProvider={…}>` before mounting anything from this module.

## Table of Contents

- [Constants & helpers](#constants--helpers)
- [Hooks](#hooks)
  - [`useItemSelect`](#useitemselect)
  - [`useWoocommerce` / `useCountries` / `useCountryOptions` / `useProductTaxonomies`](#usewoocommerce--usecountries--usecountryoptions--useproducttaxonomies)
- [General components](#general-components)
  - [`BackToWpAdmin`](#backtowpadmin)
  - [`CopyResources`](#copyresources)
  - [`Upload` + `useUpload`](#upload--useupload)
  - [`OnChangeUpload` + `useOnChangeUpload`](#onchangeupload--useonchangeupload)
  - [`MediaLibrary` + `MediaLibraryModal` + `useMediaLibraryModal`](#medialibrary--medialibrarymodal--usemedialibrarymodal)
  - [`MediaLibraryNotification`](#medialibrarynotification-1)
- [Form items](#form-items)
  - [`FileUpload`](#fileupload)
- [WooCommerce product display](#woocommerce-product-display)
  - [`ProductName`](#productname)
  - [`ProductType`](#producttype)
  - [`ProductPrice`](#productprice)
  - [`ProductStock`](#productstock)
  - [`ProductTotalSales`](#producttotalsales)
  - [`ProductCat`](#productcat)
  - [`ProductBoundItems`](#productbounditems)
- [User components](#user-components)
  - [`UserName`](#username)
  - [`UserAvatarUpload`](#useravatarupload)
  - [`UserFilter`](#userfilter)
  - [`UserRole`](#userrole)
- [Type definitions](#type-definitions)

---

## Constants & helpers

The module exports two flavours of every option set: a **module-level array** (no i18n) and a **Hook** (locale-aware). The hook reads texts from the relevant locale namespace (`WpConstants` or `WcProduct` / `WcOrder`), so prefer hooks when the project supports multiple languages.

```ts
// Booleans
const BOOLEAN_OPTIONS = [
  { label: '是', value: 'yes' },
  { label: '否', value: 'no' },
]
const BOOLEAN_OPTIONS_REVERSE = [{ label: '否', value: 'no' }, { label: '是', value: 'yes' }]
function useBooleanOptions(): { label: string; value: 'yes' | 'no' }[]

// Post statuses
const POST_STATUS = [
  { label: '已發佈', value: 'publish', color: 'blue' },
  { label: '送交審閱', value: 'pending', color: 'volcano' },
  { label: '草稿', value: 'draft', color: 'orange' },
  { label: '私密', value: 'private', color: 'purple' },
  { label: '回收桶', value: 'trash', color: 'red' },
]
const PRODUCT_STATUS = POST_STATUS                       // alias
function usePostStatus(): typeof POST_STATUS

// User roles
const USER_ROLES = [
  { label: '網站管理員', value: 'administrator', color: 'red' },
  { label: '商店經理',   value: 'shop_manager',  color: 'orange' },
  { label: '編輯',       value: 'editor',        color: 'pink' },
  { label: '作者',       value: 'author',        color: 'green' },
  { label: '翻譯',       value: 'translator',    color: 'cyan' },
  { label: '投稿者',     value: 'contributor',   color: 'purple' },
  { label: '顧客',       value: 'customer',      color: 'blue' },
  { label: '訂閱者',     value: 'subscriber',    color: 'gray' },
]
function useUserRoles(): typeof USER_ROLES

// WooCommerce
const BACKORDERS = [
  { label: '不允許', value: 'no' },
  { label: '允許', value: 'yes' },
  { label: '只有缺貨時允許', value: 'notify' },
]
function useBackorders(): typeof BACKORDERS

const PRODUCT_STOCK_STATUS = [
  { label: '有庫存', value: 'instock', color: 'blue' },
  { label: '缺貨', value: 'outofstock', color: 'magenta' },
  { label: '預定', value: 'onbackorder', color: 'cyan' },
]
function useProductStockStatus(): typeof PRODUCT_STOCK_STATUS

const PRODUCT_DATE_FIELDS = [
  { label: '商品發佈日期', value: 'date_created' },
  { label: '商品修改日期', value: 'date_modified' },
  { label: '特價開始日期', value: 'date_on_sale_from' },
  { label: '特價結束日期', value: 'date_on_sale_to' },
]
function useProductDateFields(): typeof PRODUCT_DATE_FIELDS

const PRODUCT_TYPES = [
  { value: 'simple',                  label: '簡單商品', color: 'processing' },
  { value: 'grouped',                 label: '組合商品', color: 'orange' },
  { value: 'external',                label: '外部商品', color: 'lime' },
  { value: 'variable',                label: '可變商品', color: 'magenta' },
  { value: 'variation',               label: '商品變體', color: 'magenta' },
  { value: 'subscription',            label: '簡易訂閱', color: 'cyan' },
  { value: 'variable-subscription',   label: '可變訂閱', color: 'purple' },
  { value: 'subscription_variation',  label: '訂閱變體', color: 'purple' },
]
function useProductTypes(): typeof PRODUCT_TYPES

const PRODUCT_CATALOG_VISIBILITIES = [
  { value: 'hidden',  label: '隱藏', color: 'red' },
  { value: 'visible', label: '出現在商店與搜尋結果', color: 'green' },
  { value: 'search',  label: '只出現在搜尋結果', color: 'blue' },
  { value: 'catalog', label: '只出現在商店', color: 'orange' },
]
function useProductCatalogVisibilities(): typeof PRODUCT_CATALOG_VISIBILITIES

const ORDER_STATUS = [
  { label: '處理中', value: 'processing', color: '#108ee9' },
  { label: '等待付款中', value: 'pending', color: 'volcano' },
  { label: '配送中', value: 'wmp-in-transit', color: '#2db7f5' },
  { label: '已出貨', value: 'wmp-shipped', color: 'green' },
  { label: '保留', value: 'on-hold', color: 'gold' },
  { label: '已完成', value: 'completed', color: '#87d068' },
  { label: '已取消', value: 'cancelled', color: 'orange' },
  { label: '已退款', value: 'refunded', color: 'volcano' },
  { label: '失敗訂單', value: 'failed', color: 'magenta' },
  { label: '未完成結帳', value: 'checkout-draft', color: 'gold' },
  { label: 'RY 等待撿貨中', value: 'ry-at-cvs', color: 'cyan' },
  { label: 'RY 訂單過期', value: 'ry-out-cvs', color: 'purple' },
]
function useOrderStatus(): typeof ORDER_STATUS

// Filter label maps
function getProductFilterLabels(label?: string): { [k in keyof TProductFilterProps]: string }
function useProductFilterLabels(label?: string): { [k in keyof TProductFilterProps]: string }
function productKeyLabelMapper(key: keyof TProductFilterProps, label?: string): string
```

### Boolean coercion helpers

```ts
function stringToBool(value: string | boolean | number): boolean
// Returns true when value ∈ {'yes', '1', 1, 'true', 'on', true}; otherwise false.

function boolToString(value: boolean | string): 'yes' | 'no'
// Internally calls stringToBool to support '1'/'on'/etc.
```

### Order helpers

```ts
function getOrderStatus(status: string): typeof ORDER_STATUS[number] | undefined
// Strips a leading 'wc-' (so 'wc-completed' → 'completed') and finds the matching entry.
```

### Product type predicates

```ts
function isVariable(type: string | undefined): boolean        // type?.startsWith('variable')
function isVariation(type: string | undefined): boolean       // type?.includes('variation')
function isSubscription(type: string): boolean                 // type?.includes('subscription')
```

> `isVariation` and the deprecated `getIsVariation(productType)` (alias for `isVariation`) intentionally treat `'subscription_variation'` as a variation.

---

## Hooks

### `useItemSelect`

Boilerplate for searchable Refine-backed antd `<Select>` (e.g., select courses by name).

```tsx
import { useItemSelect } from 'antd-toolkit/wp'
import type { Course } from './types'

const { selectProps, itemIds, setItemIds } = useItemSelect<Course>({
  useSelectProps: { resource: 'courses' },
  selectProps: { placeholder: '選擇課程' },
})

<Select {...selectProps} />
```

```ts
function useItemSelect<T extends BaseRecord & { name: string; id: string }>(params: {
  selectProps?: SelectProps
  useSelectProps: UseSelectProps<T, HttpError, T>
}): {
  selectProps: SelectProps           // pre-merged: defaultSelectProps + your selectProps + Refine's selectProps + value/onChange
  itemIds: string[]
  setItemIds: (value: string[]) => void
}
```

Defaults wire `optionLabel: (item) => item.name`, `optionValue: (item) => item.id`, `debounce: 500ms`, `pagination: { pageSize: 20, mode: 'server' }`, and the search filter is a single `{ field:'s', operator:'contains', value }`. Customize via `useSelectProps`.

### `useWoocommerce` / `useCountries` / `useCountryOptions` / `useProductTaxonomies`

Reads an authenticated `${apiUrl}/woocommerce` endpoint via Refine's `useCustom`. The response is validated with `WoocommerceSchema` (zod) — failures are logged but don't throw.

```tsx
import { useWoocommerce, useCountries, useCountryOptions, useProductTaxonomies } from 'antd-toolkit/wp'

const wc = useWoocommerce()                    // → TWoocommerce
const countriesMap = useCountries()            // → { US:'United States', … }
const countryOptions = useCountryOptions()     // → [{ label:'United States', value:'US' }]
const taxonomyOptions = useProductTaxonomies() // → [{ label, value, hierarchical, publicly_queryable }]
```

```ts
function useWoocommerce(): TWoocommerce
function useCountries(): Record<string, string> | undefined
function useCountryOptions(): SelectProps['options']
function useProductTaxonomies(): SelectProps['options']
```

The `DEFAULT_WOOCOMMERCE` constant exported alongside is used as the fallback while the request is pending. Available zod schemas: `WoocommerceSchema`, `TaxonomySchema`.

> The hook keys the query as `['woocommerce']`. To bust it after a settings change, use `useInvalidate({ resource:'woocommerce' })` or invalidate `['woocommerce']` directly.

---

## General components

### `BackToWpAdmin`

WP-admin link with the WordPress logo SVG. Reads `SITE_URL` from `useEnv()`.

```tsx
import { BackToWpAdmin } from 'antd-toolkit/wp'

<BackToWpAdmin collapsed={siderCollapsed} iconClassName="at-size-8" />
<BackToWpAdmin collapsed={false} href={'/wp-admin/edit.php?post_type=product'} />
```

```ts
type Props = {
  iconClassName?: string         // forwarded (merged via cn) onto the SVG
  collapsed: boolean             // required — true hides the label
  href?: string                  // default `${SITE_URL}/wp-admin/`
}
```

Memoised. Locale text comes from `BackToWpAdmin.label`.

### `CopyResources`

POST `${apiUrl}/copy/${id}` button with a Tooltip. After success it invalidates a Refine resource (you supply `invalidateProps`).

```tsx
import { CopyResources } from 'antd-toolkit/wp'

<CopyResources
  id={product.id}
  invalidateProps={{ resource: 'products' }}
  buttonProps={{ size: 'small' }}
  tooltipProps={{ placement: 'top' }}
/>
```

```ts
type Props = {
  id: string                                                   // required
  tooltipProps?: TooltipProps
  invalidateProps: Omit<UseInvalidateProp, 'invalidates'>     // required — invalidates is forced to ['list']
  buttonProps?: ButtonProps
  children?: React.ReactNode
}
```

Sends a `multipart/form-data` POST with `notificationProps` from `antd-toolkit/refine`. Memoised.

### `Upload` + `useUpload`

Antd `<Dragger>` wrapped in `<ImgCrop>` with localised text. The hook pre-fills upload props (multipart/file POST to your endpoint) and surfaces success/error via antd `message`.

```tsx
import { Upload, useUpload } from 'antd-toolkit/wp'

const { uploadProps } = useUpload({
  apiUrl: 'https://example.com/wp-json/upload',
  accept: 'image/*',
  uploadProps: { multiple: true },           // override the defaults
})

<Upload uploadProps={uploadProps} />
```

```ts
function useUpload(params: {
  apiUrl: string                              // required
  accept?: string                             // default 'image/*'
  uploadProps?: UploadProps
}): { uploadProps: UploadProps }
```

`<Upload>` itself:

```ts
type UploadCompProps = {
  uploadProps: UploadProps                     // required — wire via useUpload
  children?: React.ReactNode                   // override the default drag-zone content
}
```

Defaults: `name: 'file'`, `multiple: false`, `method: 'post'`, `listType: 'picture'`, hooks `onChange`/`onPreview`/`onDrop`. Use the inner messages from the `Upload` namespace.

### `OnChangeUpload` + `useOnChangeUpload`

Single-file upload that triggers the API call on `onChange`. Used for "upload now, get a URL back" flows like avatars / featured images. Internally writes to `form.field 'files'` (URL).

```tsx
import { OnChangeUpload, useOnChangeUpload } from 'antd-toolkit/wp'

// Form-bound (recommended): simply mount inside an antd Form
<OnChangeUpload />

// Manual usage of the hook
const { uploadProps, fileList, setFileList, attachmentId, isUploading } =
  useOnChangeUpload({
    onUploading: (file) => {/* …*/},
    onDone: (file, attachment) => form.setFieldValue('image', attachment.url),
    onError: (file) => {/* …*/},
    onRemoved: (file) => {/* …*/},
  })
<Upload uploadProps={uploadProps} />
```

```ts
function useOnChangeUpload(props?: {
  onUploading?: (file: UploadFile) => void
  onDone?:      (file: UploadFile, attachment: TAttachment) => void
  onError?:     (file: UploadFile) => void
  onRemoved?:   (file: UploadFile) => void
}): {
  uploadProps: UploadProps
  fileList: UploadFile[]
  setFileList: React.Dispatch<React.SetStateAction<UploadFile[]>>
  attachmentId: number | undefined
  isUploading: boolean
}
```

The hook posts `name: 'files'` (note plural — matches the WP REST endpoint convention) to `${apiUrl}/upload` with `X-WP-Nonce` from `useEnv()`. After `done` it tries to read `file.response.data` as a `TAttachment`.

`OnChangeUpload` (the component) wraps this in an `<ImgCrop aspect={1.778}>` + delete handler + form `<Item name='files'>` hidden field. It also watches `['id']` from the form to seed a preview URL when editing.

### `MediaLibrary` + `MediaLibraryModal` + `useMediaLibraryModal`

WordPress media library replacement. Selecting items pushes them to the parent's state via `setSelectedItems`.

```tsx
import { MediaLibrary, MediaLibraryModal, useMediaLibraryModal } from 'antd-toolkit/wp'
import type { TAttachment } from 'antd-toolkit/wp'

const [items, setItems] = useState<TAttachment[]>([])

<MediaLibrary
  selectedItems={items}
  setSelectedItems={setItems}
  limit={3}
  uploadProps={{ accept: 'image/*' }}
/>

// Modal flavour
const { show, modalProps, selectedItems, setSelectedItems } = useMediaLibraryModal({
  onConfirm: (items) => form.setFieldValue('images', items.map(i => i.id)),
})
<>
  <Button onClick={show}>選圖</Button>
  <MediaLibraryModal
    modalProps={modalProps}
    mediaLibraryProps={{ selectedItems, setSelectedItems, limit: 3 }}
  />
</>
```

```ts
type TMediaLibraryProps = {
  selectedItems: (TAttachment | TImage)[]
  setSelectedItems: React.Dispatch<React.SetStateAction<(TAttachment | TImage)[]>>
  limit?: number
  uploadProps?: UploadProps
}

function useMediaLibraryModal(params?: {
  onConfirm?: (selectedItems: (TAttachment | TImage)[]) => void
  initItems?: (TAttachment | TImage)[]
}): {
  show: () => void
  close: () => void
  modalProps: TSimpleModalProps                  // pre-filled title/footer
  setModalProps: React.Dispatch<React.SetStateAction<TSimpleModalProps>>
  selectedItems: (TAttachment | TImage)[]
  setSelectedItems: React.Dispatch<React.SetStateAction<(TAttachment | TImage)[]>>
}
```

Notes:
- The accept prop is parsed by an internal `MimeTypeValidator` to whitelist actual file uploads.
- Default footer button text uses `WpMediaLibraryModal.confirmSelect(N)`.

### `MediaLibraryNotification`

Same idea as the Bunny `MediaLibraryNotification` but for the WP attachment uploader. Mount once near the root of your admin tree.

```tsx
import { MediaLibraryNotification } from 'antd-toolkit/wp'

<MediaLibraryNotification />
```

Reads from a `filesInQueueAtom` (jotai). Closing the notification clears the queue.

---

## Form items

### `FileUpload`

Antd Dragger inside `<ImgCrop>` (optional) that **does not** auto-upload. Stores the raw `File` (or `'delete'`) into the form so you can submit it manually. Useful when the parent endpoint accepts multipart with embedded files.

```tsx
import { FileUpload } from 'antd-toolkit/wp'

const [fileList, setFileList] = useState<UploadFile[]>([])

<Form>
  <FileUpload
    fileList={fileList}
    setFileList={setFileList}
    formItemProps={{ name: ['featured_image'] }}     // default ['images']
    aspect={1.778}                                    // 16:9
    disableImgCrop={false}
    imgCropProps={{ rotationSlider: false }}
  />
</Form>
```

```ts
type Props = {
  fileList: UploadFile[]                    // required
  setFileList: React.Dispatch<React.SetStateAction<UploadFile<any>[]>>  // required
  formItemProps?: FormItemProps             // default { name: ['images'] }
  aspect?: number                           // default 1
  uploadProps?: UploadProps
  imgCropProps?: ImgCropProps
  disableImgCrop?: boolean                  // default false
}
```

Behaviour:
- `beforeUpload` returns `false` (to prevent auto-upload) and stores the raw `File` in the form.
- Clicking the trash icon sets the form value to the literal string `'delete'` (so the backend knows to remove the existing image).
- Texts come from the `FileUpload` locale namespace.

Memoised.

---

## WooCommerce product display

These components are deliberately **generic-typed** so you can use them with custom record shapes provided you supply the required fields.

### `ProductName`

Image + name (with `<NameId>`) + meta line (SKU + attribute summary).

```tsx
import { ProductName } from 'antd-toolkit/wp'

<ProductName
  record={product}                               // must include id, name; optional sku, images, attribute_summary, type
  onClick={(p) => navigate(`/products/${p.id}`)}
  hideImage={false}
  imageProps={{ width: 60, height: 60 }}
  className="at-py-2"
/>
```

```ts
type TBaseRecord = {
  id: string
  name: string
  sku?: string
  images?: TImage[]
  type?: TProductType
  attribute_summary?: string
}

type Props<T extends TBaseRecord> = {
  record: T
  onClick?: (record: T | undefined) => void
  renderTitle?: React.ReactNode             // override the default <NameId>
  renderBelowTitle?: React.ReactNode        // override the default sku/attribute line
  hideImage?: boolean                        // default false
  imageProps?: ImageProps                    // forwarded to antd <Image>
  className?: string
}
```

The image falls back to `defaultImage` when `images?.[0]?.url` is empty. Memoised generic.

### `ProductType`

Tag + 3 status icons (featured, virtual, downloadable). Pulls the WC product types via `useWoocommerce()` so colours stay in sync with the backend setting.

```tsx
import { ProductType } from 'antd-toolkit/wp'

<ProductType
  record={product}
  hideDownloadable={false}
  renderBefore={<Badge dot />}
  renderAfter={<span>{product.id}</span>}
/>
```

```ts
type TBaseRecord = {
  type: TProductType
  featured: boolean
  virtual: boolean
  downloadable: boolean
}

type Props<T extends TBaseRecord> = {
  record: T
  hideDownloadable?: boolean              // default true
  renderBefore?: React.ReactNode
  renderAfter?: React.ReactNode
}
```

Featured / virtual / downloadable booleans are run through `stringToBool` so `'yes'`/`'no'`/`'1'`/`'0'` all work. Memoised.

### `ProductPrice`

Renders WooCommerce's pre-formatted `price_html` via `renderHTML`. No-ops if missing.

```tsx
<ProductPrice record={{ price_html: product.price_html }} />
```

```ts
type Props<T extends { price_html: string }> = { record: T }
```

Memoised.

### `ProductStock`

Stock-status indicator. `type='text'` (default) renders a small grey paragraph; `type='tag'` renders an antd `<Tag>`.

```tsx
<ProductStock record={product} type="tag" />
```

```ts
type TBaseRecord = {
  stock_status: TProductStockStatus           // 'instock' | 'outofstock' | 'onbackorder'
  stock_quantity: number | null
  low_stock_amount: number | null
}

type Props<T extends TBaseRecord> = {
  record: T
  type?: 'text' | 'tag'        // default 'text'
}
```

Behaviour:
- `instock` & `stock_quantity > low_stock_amount` → green `stockSufficient`
- `instock` & `stock_quantity <= low_stock_amount` → orange `lowStock`
- `instock` with null quantity/amount → green `inStock`
- `outofstock` → red `outOfStock` (X icon)
- `onbackorder` → purple `onBackorder` (clock icon)
- otherwise → grey `unknownStatus`

When `stock_quantity` is an integer, it's appended as `(N)`. Texts come from `ProductStock` namespace. Memoised.

### `ProductTotalSales`

Coloured `<Badge count>` representing relative sales tier vs `max_sales`.

```tsx
<ProductTotalSales record={{ total_sales: product.total_sales }} max_sales={top.total_sales} />
```

Tier rules:
| `total_sales` vs `max_sales` | tier | colour | label |
|------------------------------|------|--------|-------|
| `> 0.8 × max` (or `max=0`)   | tier-1 | `#f5222d` | top20 |
| `> 0.6 × max` | tier-2 | `#ff4d4f` | top40 |
| `> 0.4 × max` | tier-3 | `#ff7875` | top60 |
| `> 0.2 × max` | tier-4 | `#ffa39e` | top80 |
| else | tier-5 | `#ffccc7` | top100 |

```ts
type Props<T extends { total_sales: number }> = {
  record: T
  max_sales: number
}
```

Memoised.

### `ProductCat`

Render arrays of `TTerm` as antd `<Tag>` (categories) and `#tag` text (tags).

```tsx
<ProductCat
  categories={[{ value: '1', label: '電子' }]}
  tags={[{ value: 't1', label: 'sale' }]}
/>
```

```ts
type Props = {
  categories: TTerm[]
  tags: TTerm[]
}
```

Memoised.

### `ProductBoundItems`

Render a list of items (with `TLimit` info) bound to a product, e.g., courses with their access duration.

```tsx
import { ProductBoundItems } from 'antd-toolkit/wp'

<ProductBoundItems
  items={[
    { id: 'c1', name: 'Course A', limit_type: 'fixed', limit_value: 30, limit_unit: 'day' },
    { id: 'c2', name: 'Course B', limit_type: 'unlimited', limit_value: '', limit_unit: '' },
  ]}
  hideName={false}
/>
```

```ts
export type TBoundItemData = TLimit & { id: string; name: string }

export type TProductBoundItemsProps = {
  items: TBoundItemData[]
  className?: string
  hideName?: boolean         // default false. true → only show the #id with a tooltip of name
}
```

Tag text is computed from `(limit_type, limit_value, limit_unit)` using the `ProductBoundItems` namespace. Memoised.

---

## User components

### `UserName`

Avatar + display_name + email line (with `<NameId>` fallback for the name).

```tsx
import { UserName } from 'antd-toolkit/wp'

<UserName record={user} onClick={(u) => goToProfile(u.id)} hideImage={false} />
```

```ts
type TBaseRecord = {
  display_name: string
  user_email: string
  id: string
  user_avatar_url: string
}

type Props<T extends TBaseRecord> = {
  record: T
  onClick?: (record: T | undefined) => void
  renderTitle?: React.ReactNode
  renderBelowTitle?: React.ReactNode
  hideImage?: boolean                          // default false
  imageProps?: ImageProps
}
```

The avatar is wrapped in antd `<Image preview={{mask:<EyeOutlined/>}}>`. Falls back to `defaultImage` when `user_avatar_url` is empty. Memoised generic.

### `UserAvatarUpload`

Avatar upload form item. `Upload` with `listType="picture-circle"` + `<ImgCrop cropShape="round">`. Stores the URL in the form field at `name`.

```tsx
import { UserAvatarUpload } from 'antd-toolkit/wp'

<Form>
  <Form.Item name="id" hidden initialValue={user.id} />
  <UserAvatarUpload
    name={['user_avatar_url']}
    nonce={nonce}
    endPoint={`${apiUrl}/users/upload-avatar`}      // optional — defaults to `${apiUrl}/upload`
  />
</Form>
```

```ts
type Props = {
  endPoint?: string                              // default `${apiUrl}/upload` from useApiUrl()
  nonce: string                                  // required — sent as X-WP-Nonce
  name: string | number | (string | number)[]    // form field path
}
```

Behaviour:
- After upload, reads `file.response.data.url` and sets the form value.
- On edit (form watches `['id']`), seeds the upload list from the current form value.
- The recommended display size hint defaults to `400x400`.

Memoised.

### `UserFilter`

Search-form with `search` input + `include` (user IDs) tags + filter/reset buttons.

```tsx
import { UserFilter } from 'antd-toolkit/wp'

<UserFilter<MyFilter>
  formProps={searchFormProps}                       // from useTable()
  hideInclude={false}
  wrapperClassName="at-grid at-grid-cols-3 at-gap-x-4"
  renderAfter={
    <Form.Item name="role" label="角色">
      <Select options={USER_ROLES} />
    </Form.Item>
  }
/>
```

```ts
type TBaseRecord = {
  search?: string
  include?: string[]
}

type Props<T extends TBaseRecord> = {
  formProps: FormProps<T>                                                // required
  renderAfter?: React.ReactNode                                          // injected after the include field
  wrapperClassName?: string                                              // default 'at-grid at-grid-cols-2 md:at-grid-cols-3 at-gap-x-4'
  hideInclude?: boolean                                                  // default false
}
```

The reset button calls `form.resetFields()` then `form.submit()`. Texts from `UserFilter` namespace. Memoised generic.

### `UserRole`

Badge with the role's colour and label, looked up from `USER_ROLES` (the static constant — not the hook). Falls back to `gray` and the raw role string.

```tsx
<UserRole role="administrator" />
```

```ts
type Props = { role: string }
```

> Note: this component does **not** read from `useLocale` — it uses the hard-coded zh_TW labels in `USER_ROLES`. If you need a localised version, render your own `<Badge>` using `useUserRoles()` data.

---

## Type definitions

```ts
// Term (taxonomy term)
export type TTerm = { value: string; label: string }

// Image
export type TImage = { id: string; url: string }

// Post status
export type TPostStatus = (typeof POST_STATUS)[number]['value']
// 'publish' | 'pending' | 'draft' | 'private' | 'trash'

// Order status
export type TOrderStatus = (typeof ORDER_STATUS)[number]['value']
// 'processing' | 'pending' | 'wmp-in-transit' | 'wmp-shipped' | 'on-hold'
// | 'completed' | 'cancelled' | 'refunded' | 'failed' | 'checkout-draft'
// | 'ry-at-cvs' | 'ry-out-cvs'

// User base record (shape returned by the WP REST users endpoint)
export type TUserBaseRecord = {
  id: string
  user_login: string
  user_email: string
  display_name: string
  user_registered: string
  user_registered_human: string
  user_avatar_url: string
  user_birthday: string | ''           // 'YYYY-MM-DD'
  description: string
  role: string
  billing_phone: string
  date_last_active: string | null
  date_last_order: string | null
  orders_count: number | null
  total_spend: number | null
  avg_order_value: number | null
  edit_url: string
  ip_address?: string
}

// Product types
export type TProductType =
  | 'simple' | 'grouped' | 'external'
  | 'variable' | 'variation'
  | 'subscription' | 'variable-subscription' | 'subscription_variation'
export type TProductStockStatus = 'instock' | 'outofstock' | 'onbackorder'
export type TBackorders = 'no' | 'yes' | 'notify'

export type TProductAttribute = {
  id: string
  name: string
  taxonomy: string
  variation: 'yes' | 'no'
  visible: 'yes' | 'no'
  options: { value: string; label: string }[]
  position: number
}

export type TProductBaseRecord = {
  // Basics
  id: string
  type: Omit<TProductType, 'variation' | 'subscription_variation'>
  name: string
  slug: string
  date_created: string
  date_modified: string
  status: string
  featured: boolean
  catalog_visibility: string
  sku: string
  menu_order: number
  virtual: boolean
  downloadable: boolean
  permalink: string
  edit_url: string
  parent_id: string

  // Description / editor
  editor: 'power-editor' | 'elementor'
  description?: string
  short_description?: string
  page_template?: string
  page_template_options?: { value: string; label: string }[]

  // Pricing
  price_html: string
  regular_price: string
  sale_price: string
  on_sale: boolean
  sale_date_range: [number, number]
  date_on_sale_from?: number
  date_on_sale_to?: number
  total_sales: number

  // Stock
  stock: number | null
  stock_status: TProductStockStatus
  manage_stock: boolean
  stock_quantity: number | null
  backorders: TBackorders
  backorders_allowed: boolean
  backordered: boolean
  low_stock_amount: number | null

  // Cross / upsell
  upsell_ids: number[]
  cross_sell_ids: number[]

  // Attributes
  attributes: TProductAttribute[]
  default_attributes: { [key: string]: string }
  attribute_summary: string

  // Taxonomies
  category_ids: string[]
  tag_ids: string[]

  // Images
  images: TImage[]

  // Subscription
  _subscription_price?: string
  _subscription_period?: string
  _subscription_period_interval?: string
  _subscription_length?: string
  _subscription_sign_up_fee?: string
  _subscription_trial_length?: string
  _subscription_trial_period?: string

  // Variations (for variable products)
  children?: TProductVariationBase[]
}

export type TProductVariationBase = TProductBaseRecord & {
  type: Extract<TProductType, 'variation' | 'subscription_variation'>
}

// WooCommerce settings (validated via WoocommerceSchema)
export type TTaxonomy = {
  value: string
  label: string
  hierarchical: boolean
  publicly_queryable: boolean
}
export type TWoocommerce = {
  countries: Record<string, string>
  currency: { slug: string; symbol: string }
  product_taxonomies: TTaxonomy[]
  notify_low_stock_amount: number
  dimension_unit: string
  weight_unit: string
  permalinks: {
    product_base: string; category_base: string; tag_base: string; attribute_base: string
    use_verbose_page_rules: boolean
    product_rewrite_slug: string; category_rewrite_slug: string; tag_rewrite_slug: string; attribute_rewrite_slug: string
  }
  manage_stock: boolean
  product_types: { value: string; label: string; color: string }[]
  order_statuses: { value: string; label: string; color: string }[]
  post_statuses: { value: string; label: string; color: string }[]
  product_stock_statuses: { value: string; label: string; color: string }[]
}

// Attachment (WP media library response)
export type TAttachment = {
  id: string
  status: string
  slug: string
  title: string
  filename: string
  url: string
  img_url: string
  _wp_attachment_image_alt: string
  description: string
  short_description: string
  type: string
  mime: string
  subtype: string
  edit_link: string
  filesize_human_readable: string
  height: number
  width: number
  date_created: string
  date_modified: string
  author: { id: string; name: string }
}

// MediaLibrary props (note: same name as the Bunny equivalent — pick the import)
export type TMediaLibraryProps = {
  selectedItems: (TAttachment | TImage)[]
  setSelectedItems: React.Dispatch<React.SetStateAction<(TAttachment | TImage)[]>>
  limit?: number
  uploadProps?: UploadProps
}
```
