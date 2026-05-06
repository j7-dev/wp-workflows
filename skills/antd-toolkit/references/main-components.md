# `antd-toolkit` Core Components

All symbols in this file are imported from the package root:

```ts
import { Amount, Card, NameId /* … */ } from 'antd-toolkit'
```

Components are organised by category. Every signature shown matches the source 1:1; defaults are the actual fallback values in code.

## Table of Contents

- [Display](#display)
  - [Amount](#amount)
  - [BooleanIndicator](#booleanindicator)
  - [BreathLight](#breathlight)
  - [Card](#card)
  - [Countdown](#countdown)
  - [DateTime](#datetime)
  - [SecondToStr](#secondtostr)
  - [Heading](#heading)
  - [LoadingCard](#loadingcard)
  - [LoadingPage](#loadingpage)
  - [NameId](#nameid)
  - [SimpleImage](#simpleimage)
  - [Gallery](#gallery)
  - [TrendIndicator](#trendindicator)
  - [WatchStatusTag](#watchstatustag)
  - [ObjectTable](#objecttable)
- [Icons (raw SVG)](#icons-raw-svg)
  - [CheckIcon](#checkicon)
  - [AltIcon](#alticon)
  - [ExtIcon](#exticon)
- [Interaction](#interaction)
  - [ActionButton](#actionbutton)
  - [BooleanRadioButton](#booleanradiobutton)
  - [BooleanSegmented](#booleansegmented)
  - [CopyText](#copytext)
  - [PopconfirmDelete](#popconfirmdelete)
  - [SelectedRecord](#selectedrecord)
  - [ToggleContent](#togglecontent)
- [Overlays](#overlays)
  - [Portal](#portal)
  - [SimpleModal](#simplemodal)
  - [SimpleDrawer](#simpledrawer)

---

## Display

### `Amount`

Currency-aware amount display. Renders the currency code (or symbol) followed by the locale-formatted number. Falls back gracefully for `null`/`undefined`.

```tsx
import { Amount } from 'antd-toolkit'

<Amount amount={12345.6} currency="USD" />            // "USD 12,345.6"
<Amount amount={12345.6} currency="USD" symbol />     // "$ 12,345.6"
<Amount amount={null as any} currency="" />           // " 0"
```

```ts
type Props = {
  amount: number          // Falsy → 0
  currency: string        // Falsy → ''. Always uppercased before lookup
  symbol?: boolean        // false (default) → show currency code; true → resolve via currency-symbol-map
  className?: string
}
```

`symbol={true}` uses [`currency-symbol-map`](https://www.npmjs.com/package/currency-symbol-map). Unknown codes return `undefined` which renders as empty.

### `BooleanIndicator`

Round status dot, teal for `true`, rose for `false`. Optional tooltip wrapper.

```tsx
<BooleanIndicator enabled={user.active} />
<BooleanIndicator
  enabled={user.active}
  tooltipProps={{ enabled: true, title: '線上' }}
/>
```

```ts
type Props = {
  enabled: boolean
  className?: string                                  // Merged via cn() onto the dot
  tooltipProps?: TooltipProps & { enabled: boolean }  // tooltipProps.enabled === true → wrap in <Tooltip>
}
```

> Note: the `enabled` flag inside `tooltipProps` is what toggles the tooltip wrapper, not the antd Tooltip's `open` prop.

### `BreathLight`

Animated "breathing" dot (ping animation). Default colour `at-bg-orange-400`.

```tsx
<BreathLight />                                  // orange
<BreathLight className="at-bg-emerald-500" />    // emerald
```

```ts
type Props = { className?: string }
```

### `Card`

Wrapper around antd's `<Card>` with a `showCard` toggle. When `showCard={false}` it returns `children` directly — useful for re-using a list view inside both a card and a filter panel.

```tsx
<Card title="使用者" showCard>
  <UserList />
</Card>

<Card showCard={false}>     // <-- renders bare children
  <UserList />
</Card>
```

```ts
type Props = CardProps & { showCard?: boolean }   // showCard defaults to true
```

### `Countdown`

Big-digit countdown to a target millisecond timestamp. Validates that `date.toString().length === 13` (ms-precision unix); otherwise renders the locale's error message. Built on `react-countdown` with a custom renderer.

```tsx
<Countdown date={Date.now() + 60 * 60 * 1000} title={<h3>限時優惠</h3>} />
```

```ts
type Props = {
  date: number                     // Unix ms — must be 13 digits
  title?: React.ReactNode
  className?: string               // default 'at-text-center'
  width?: string | number          // optional explicit width
}
```

> Marked `TODO 棄用，改用 daisyUI 的` in source; still functional. If you need months/years use a different lib.

### `DateTime`

Two-line "📅 yyyy-MM-dd ⏰ HH:mm:ss" display from a 13-digit ms timestamp. With `hideTime`, time moves into a `<Tooltip>`.

```tsx
<DateTime date={post.created_at_ms} />
<DateTime
  date={post.created_at_ms}
  hideTime
  dateProps={{ format: 'YYYY/MM/DD' }}
/>
```

```ts
type DateProps = { icon?: React.ReactNode; format?: string }
type Props = {
  date: number                     // Unix ms — must be 13 digits
  className?: string
  dateProps?: DateProps           // default icon=<CalendarOutlined>, format='YYYY-MM-DD'
  timeProps?: DateProps           // default icon=<ClockCircleOutlined>, format='HH:mm:ss'
  hideTime?: boolean              // false — true = collapse time into a Tooltip
}
```

### `SecondToStr`

Render a second count as `HH 時 MM 分 SS 秒` (locale-aware). Returns the empty-state text when `second` is falsy.

```tsx
<SecondToStr second={3725} />     // "01 時 02 分 05 秒" (zh_TW)
```

```ts
type Props = {
  second: number
  className?: string                // default 'at-text-gray-400 at-text-xs'
}
```

### `Heading`

Antd `<Divider orientation="left">` wrapper with two sizes. `md` (default) wraps a `<Title level={2}>` with a left blue bar; `sm` is a thin grey divider with a `<SendOutlined>` icon. Inherits all `DividerProps`.

```tsx
<Heading>使用者</Heading>                              // medium
<Heading size="sm">基本資料</Heading>
<Heading size="md" hideIcon titleProps={{ level: 3 }}>進階</Heading>
```

```ts
type Props = {
  children: React.ReactNode
  titleProps?: TypographyProps['Title']    // forwarded to antd <Title>; only used when size='md'
  size?: 'sm' | 'md'                        // 'md'
  hideIcon?: boolean                        // false. md → drop left bar; sm → drop send icon
} & DividerProps
```

Memoised — exported as `memo(HeadingComponent)`.

### `LoadingCard`

Animated grey-pulse placeholder card. Children default to the literal `'LOADING…'`.

```tsx
<LoadingCard />
<LoadingCard className="at-aspect-square">圖片載入中</LoadingCard>
```

```ts
type Props = HTMLAttributes<HTMLDivElement>
// children defaults to 'LOADING...'; className defaults to 'at-aspect-video'
```

### `LoadingPage`

Square-grid loading animation centred on the viewport. No props. Use as the fallback while a heavy page mounts.

```tsx
<Suspense fallback={<LoadingPage />}>
  <UsersPage />
</Suspense>
```

### `NameId`

Two-line "Name #id" display. Auto-renders HTML in `name` if it's a string (via `renderHTML`). Optional Tooltip wrapper.

```tsx
<NameId name="John Doe" id="42" />
<NameId
  name="John <strong>Doe</strong>"     // auto-rendered as HTML
  id="42"
  tooltipProps={{ placement: 'right' }}
/>
```

```ts
type Props = {
  name: React.ReactNode          // string → renderHTML; otherwise rendered as-is
  id: string                     // Empty string ⇒ '#' is hidden
  className?: string
  tooltipProps?: TooltipProps    // null → no Tooltip wrapper
}
```

Memoised.

### `SimpleImage`

`<img loading="lazy">` with a pulse-animated overlay that says `LOADING...`. Optional `render` overrides the `<img>` entirely (e.g., a `<video>`).

```tsx
<SimpleImage src={user.avatar_url} ratio="at-aspect-square" />
<SimpleImage render={<video src={url} controls />} />
```

```ts
type Props = {
  render?: ReactNode                              // if set, replaces <img>
  src: string                                     // default: defaultImage
  className?: string                              // default 'w-full'
  ratio?: string                                  // default 'at-aspect-video'
  loadingClassName?: string                       // default 'text-xl text-gray-500 font-bold'
} & HTMLAttributes<HTMLDivElement>
```

Memoised.

### `Gallery`

Grid-thumbnails + main-image gallery. Click a thumbnail to swap the main image. If `selectedImage` is provided and matches one of `images`, it auto-selects on mount.

```tsx
<Gallery images={product.images.map(i => i.url)} selectedImage={defaultUrl} />
```

```ts
type Props = {
  images: string[]            // empty array → renders defaultImage square
  selectedImage?: string      // optional initial selection
}
```

> Source has a known minor ordering bug: `selectedImage` effect references `isInclude` before it's declared. Works in practice because closures capture by reference. Do not depend on this for hot paths.

### `TrendIndicator`

Up/down arrow + percentage between `value` and `compareValue`. Red for greater, green for less. Wrapped in a Tooltip.

```tsx
<TrendIndicator
  value={now}
  compareValue={lastWeek}
  tooltipProps={{ title: '相比上週' }}
/>
```

```ts
type Props = {
  value: number
  compareValue: number
  tooltipProps: TooltipProps               // required
  hideWithoutCompareValue?: boolean        // true → returns null when compareValue is 0/undef
}
```

Memoised.

### `WatchStatusTag`

WooCommerce-membership-style "permission expiry" tag.

```tsx
<WatchStatusTag expireDate={{
  is_subscription: false,
  subscription_id: null,
  is_expired: false,
  timestamp: 1735689600,        // unix seconds
}} />
```

```ts
export type TExpireDate = {
  is_subscription: boolean
  subscription_id: number | null
  is_expired: boolean
  timestamp: number | null      // 0 → unlimited; null → empty
}

type Props = { expireDate: TExpireDate }
```

Colour rules:
- `timestamp === 0` → blue tag, label `unlimited`
- `is_expired === true` → magenta tag, label `expired`
- otherwise → green tag, label `notExpired`

Companion utility:
```ts
import { getWatchStatusTagTooltip } from 'antd-toolkit'

const tip = getWatchStatusTagTooltip(expireDate, locale?: {
  followSubscription: (id: number | null) => string
  expiredAt: (date: string) => string
  availableUntil: (date: string) => string
})
```
Pass `tip` to a `<Tooltip title={tip}>` around the tag if you want the same Chinese-style readable date tooltip.

### `ObjectTable`

Vertical key-value table. Auto-derives columns from `record` (handles primitives + arrays of primitives). Supports an inline edit mode that uses `<Form.Item>` cells.

```tsx
<ObjectTable record={user} />

<ObjectTable
  record={user}
  editable
  columns={[
    { key: 'email', title: '電子郵件', dataIndex: 'email' },
    { key: 'roles', title: '角色', dataIndex: 'roles',
      render: (val) => Array.isArray(val) ? val.join(', ') : val },
  ]}
  actionButtonProps={{ onSave: handleSave }}
/>
```

```ts
export type TColumn = {
  key: string
  title: string
  dataIndex: string
  render?: (
    value: any,
    record: any,
    index: number,
    editable: boolean,
  ) => React.ReactNode
}

export type TObjectTable = {
  record: { [key: string]: any }     // {} → renders <Empty>
  editable?: boolean                  // false. true → adds <ActionButton> + makes cells editable
  columns?: TColumn[]                 // omit → derives from record
  className?: string
  actionButtonProps?: TActionButton   // see ActionButton below
}
```

Editable mode wraps each cell in `<Form.Item name={dataIndex} initialValue={…}><Input/></Form.Item>` — the surrounding `<Form>` is your responsibility, and you read values via `form.getFieldsValue()`.

Memoised.

---

## Icons (raw SVG)

These are inline `<svg>` icons. They do **not** require `@ant-design/icons`.

### `CheckIcon`

```ts
const CheckIcon: FC<HTMLAttributes<SVGElement>>
// 20×20 viewport, fill="#000". Pass {...rest} via spread.
```

### `AltIcon`

The "alt" letter icon used by editor blocks (image alt text marker).

```ts
const AltIcon: FC<{
  color?: string       // default '#444'
  className?: string   // default 'at-size-4'
}>
```

### `ExtIcon`

File-extension icon. Returns a different SVG for each extension; falls back to a generic file icon when the extension isn't recognised.

```ts
const ExtIcon: FC<{
  ext: string                          // case-sensitive — pre-lowercase the extension
  className?: string                   // default 'h-6 w-6'
  style?: React.CSSProperties
}>
```

Recognised extensions cover `txt`, `doc/docx`, `pdf`, `xls/xlsx`, `ppt/pptx`, `zip/rar`, `mp4`, `mp3`, image extensions, etc. (long list — derived from a stack of inline SVGs).

---

## Interaction

### `ActionButton`

Edit / Save / Cancel / Delete button group with internal `isEditing` state. Saves require manual wiring via `onSave`; cancel + edit toggle internally.

```tsx
<ActionButton
  type="both"                                     // icon + text (default)
  onEdit={() => console.log('start edit')}
  onSave={() => form.submit()}
  onCancel={() => console.log('cancelled')}
  onDelete={() => deleteRow()}
  canDelete                                       // shows the Popconfirm-wrapped delete button
  buttonProps={{ size: 'small' }}                 // applied to all four buttons
/>
```

```ts
export type TActionButton = {
  canDelete?: boolean              // default true
  buttonProps?: ButtonProps        // merged with the default { type:'primary', className:'at-mx-1' }
  className?: string               // wrapper div
  type?: 'icon' | 'text' | 'both'  // default 'both'
  onDelete?: () => void
  onSave?: () => void
  onEdit?: () => void
  onCancel?: () => void
}
```

Behaviour:
- Default state shows **Edit**.
- Clicking edit triggers `onEdit` and switches to **Save / Cancel**.
- Cancel resets `isEditing=false` and triggers `onCancel`.
- The delete button is *always* visible while `canDelete=true` and uses the `ActionButton` locale namespace for confirm texts.
- `type='icon'` removes `.children`; `type='text'` removes `.icon`.

Memoised.

### `BooleanRadioButton`

Antd `<Form.Item><Radio.Group optionType="button"></Form.Item>` with an `ALL / ✓ / ✕` default. Pass `formItemProps.name` to bind it to your form.

```tsx
<BooleanRadioButton formItemProps={{ name: 'is_active', label: '狀態' }} />

<BooleanRadioButton
  formItemProps={{ name: 'is_active' }}
  radioGroupProps={{
    options: [
      { label: '全部', value: '' },
      { label: '啟用', value: '1' },
      { label: '停用', value: '0' },
    ],
  }}
  averageWidth                         // 'w-avg' class — equal-width buttons
/>
```

```ts
type Props = {
  formItemProps: FormItemProps                                          // required
  radioGroupProps?: RadioGroupProps                                     // override options here
  averageWidth?: boolean                                                // default true
}
// Default options: [{label:'ALL', value:''}, {label:<CheckOutlined/>, value:'1'}, {label:<CloseOutlined/>, value:'0'}]
```

### `BooleanSegmented`

Same idea as `BooleanRadioButton` but uses antd's `<Segmented>` and ships **four** preset option sets via `type`.

```tsx
<BooleanSegmented formItemProps={{ name: 'is_active' }} type="default" />
<BooleanSegmented formItemProps={{ name: 'is_active' }} type="text" />
<BooleanSegmented formItemProps={{ name: 'is_active' }} type="icon" />
<BooleanSegmented formItemProps={{ name: 'is_active' }} type="vertical" />
```

```ts
type Props = {
  formItemProps: FormItemProps
  segmentedProps?: Omit<SegmentedProps,'ref'> & React.RefAttributes<HTMLDivElement>
  type?: 'default' | 'text' | 'icon' | 'vertical'   // default 'default'
}
// 'default' → {ALL+icon, TRUE+✓, FALSE+✕}
// 'text'    → {ALL,    TRUE,   FALSE}
// 'icon'    → {ALL,    ✓,      ✕}      // 2 segments + ALL
// 'vertical'→ stacked icon-on-top label-below
```

### `CopyText`

Click children → write `text` to clipboard. Uses `navigator.clipboard`; surfaces success/fail/unavailable via antd's `message` API.

```tsx
<CopyText text={user.email}>
  <Button>複製</Button>
</CopyText>

<CopyText text={user.email} />        // default: a blue <CopyOutlined> icon
```

```ts
type Props = {
  text: string
  children?: React.ReactNode      // default <CopyOutlined className="at-text-blue-500 hover:at-text-blue-500/70" />
  messageConfig?: ConfigOptions   // antd message useMessage() config
}
```

The component uses `message.useMessage(messageConfig)` and renders its own `contextHolder`, so it works without antd's global `App` wrapper.

### `PopconfirmDelete`

Delete button with antd `<Popconfirm>`. Two variants: `'icon'` (red text-button with `<DeleteOutlined>`) or `'button'` (red primary button with text).

```tsx
<PopconfirmDelete
  popconfirmProps={{ onConfirm: () => deleteRow(id) }}
/>

<PopconfirmDelete
  type="button"
  popconfirmProps={{ title: '確認刪除？', onConfirm: handleRemove }}
  buttonProps={{ children: '刪除', loading: isLoading }}
  tooltipProps={{ title: '此操作不可逆' }}
/>
```

```ts
type Props = {
  popconfirmProps: Omit<PopconfirmProps, 'title'> & { title?: React.ReactNode }
  type?: 'icon' | 'button'        // default 'icon'
  buttonProps?: ButtonProps
  tooltipProps?: TooltipProps     // adds Tooltip to the trigger when set
}
```

Defaults are pulled from the `PopconfirmDelete` locale namespace (`title`, `okText`, `cancelText`).

Memoised.

### `SelectedRecord`

Cross-page selection indicator. Shows "已選 N 筆" with optional clear / show-selected buttons.

```tsx
<SelectedRecord
  ids={selectedRowKeys}
  resourceLabel="使用者"
  onClear={() => setSelectedRowKeys([])}
  onSelected={() => navigate('?ids=' + selectedRowKeys.join(','))}
/>
```

```ts
type Props = {
  ids: (string | React.Key)[]
  onClear?: () => void
  onSelected?: () => void
  resourceLabel?: string          // empty → falls back to ''
  hideOnEmpty?: boolean           // default true. When false, renders even with zero selection
}
```

Memoised.

### `ToggleContent`

HTML content with a fade-out gradient + "expand all / collapse all" button. Renders sanitised HTML via `renderHTML`.

```tsx
<ToggleContent content={post.long_html} className="at-prose" />
```

```ts
type Props = {
  content: string         // raw HTML string
  className: string       // required — applied to outer div
}
```

Default collapsed height is `at-h-[20rem]` until expanded.

---

## Overlays

### `Portal`

Tiny wrapper around `ReactDOM.createPortal`. Defaults to `document.body`.

```tsx
<Portal>
  <FloatingPanel />
</Portal>

<Portal target={document.getElementById('layout-root')!}>
  <Sidebar />
</Portal>
```

```ts
type Props = {
  children: React.ReactNode
  target?: HTMLElement              // default document.body
}
```

### `SimpleModal`

A *non-antd* modal. Renders into `<Portal>`, sized in `px`, animated via opacity transition. Pair with `useSimpleModal()` (see `references/main-hooks-utils.md`).

```tsx
import { SimpleModal, useSimpleModal } from 'antd-toolkit'

function MyPage() {
  const { show, close, modalProps } = useSimpleModal()
  return (
    <>
      <Button onClick={show}>開啟</Button>
      <SimpleModal {...modalProps} title="編輯">
        <ContentInside />
      </SimpleModal>
    </>
  )
}
```

```ts
export type TSimpleModalProps = {
  width?: number                       // default 1600. CSS: maxWidth: max(90%, calc(100vw - 4rem))
  title?: React.ReactNode              // default ''
  children?: React.ReactNode
  footer?: React.ReactNode | null      // default null
  className?: string                   // default 'pc-media-library'
  onCancel?: () => void
  zIndex?: number                      // default 2000
  opacity?: number                     // default 0. Set to 1 by useSimpleModal().show()
  pointerEvents?: 'auto' | 'none'      // default 'none'. show() flips to 'auto'
  destroyOnHidden?: boolean            // default false. true → unmount when opacity≠1
}
```

Closing rules:
- Click outside the inner card → calls `onCancel`.
- Click the close (×) button → calls `onCancel`.
- There's a 700ms grace before children mount (showing `<Skeleton>` first) — this is intentional to keep the open animation smooth even with heavy children.

Memoised.

### `SimpleDrawer`

Side drawer (left edge) with the same animation philosophy. Supports `closeConfirm` (uses `window.confirm`).

```tsx
import { SimpleDrawer, useSimpleDrawer } from 'antd-toolkit'

function Page() {
  const { show, close, drawerProps, setDrawerProps } = useSimpleDrawer()
  return (
    <>
      <Button onClick={show}>開啟側欄</Button>
      <SimpleDrawer
        {...drawerProps}
        width={1200}
        title="設定"
        footer={<Button onClick={close}>關閉</Button>}
        closeConfirm
      >
        <Form />
      </SimpleDrawer>
    </>
  )
}
```

```ts
export type TSimpleDrawerProps = {
  width?: number                       // default 1600
  title?: React.ReactNode              // default ''
  children?: React.ReactNode
  footer?: React.ReactNode | null      // default null
  className?: string                   // default ''
  onCancel?: () => void
  transform?: string                   // default 'translateX(-100%)'. show() sets 'translateX(0)'
  zIndex?: number                      // default 2000
  opacity?: number                     // default 0 (the dim background)
  pointerEvents?: 'auto' | 'none'      // default 'none'
  destroyOnHidden?: boolean            // default false
  closeConfirm?: boolean               // default false. true → window.confirm before close
  fullWidth?: boolean                  // default false. true → drawer fills viewport width
}
```

Behaviour notes:
- Click on the dim background calls `onCancel` (after `closeConfirm` if applicable).
- The drawer opens from the **left** by default (matches WP-admin sidebar convention).
- When `fullWidth=true`, `maxWidth` is `100%`. Otherwise it's `max(75%, calc(100% - 100rem))`.

Memoised.
