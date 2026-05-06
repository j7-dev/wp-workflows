# `antd-toolkit` Form Items & Rich-Text Editor

All symbols in this file are imported from the package root:

```ts
import { Switch, DatePicker, BlockNote /* … */ } from 'antd-toolkit'
```

These components are designed to drop into an antd `<Form>`. They normalise values for backends that store dates as Unix timestamps and booleans as `'yes'`/`'no'`.

## Table of Contents

- [Switch](#switch) — `'yes' | 'no'` switch
- [Segmented](#segmented) — `'yes' | 'no'` Segmented (reverse order)
- [DatePicker](#datepicker) — Dayjs ⇄ Unix-seconds
- [RangePicker](#rangepicker) — `[Dayjs, Dayjs]` ⇄ `[seconds, seconds]`
- [DoubleConfirmSwitch](#doubleconfirmswitch) — Switch + Popconfirm + Tooltip
- [Limit](#limit) — Subscription / fixed-days / specified-time / follow_subscription
- [VideoLength](#videolength) — Hour/Min/Sec → total seconds
- [VideoInput](#videoinput) — Multi-source video picker (Youtube / Vimeo / Bunny / WP / custom code)
- [BlockNote / useBlockNote](#blocknote--useblocknote) — BlockNote rich-text editor
- [BlockNoteDrawer](#blocknotedrawer) — Editor inside a SimpleDrawer + Refine `useUpdate`
- [DescriptionDrawer](#descriptiondrawer) — Editor switcher (BlockNote vs Elementor)

---

## `Switch`

Antd `<Form.Item>` + `<Switch>` that round-trips through `'yes' | 'no'`. Internally:
- `getValueProps(value)` → `stringToBool(value) ? { checked: true } : {}`
- `normalize(value)` → `stringToBool(value) ? 'yes' : 'no'`

```tsx
import { Switch } from 'antd-toolkit'

<Switch
  formItemProps={{ name: 'is_active', label: '啟用' }}
  switchProps={{ size: 'small' }}
/>
```

```ts
type Props = {
  formItemProps?: FormItemProps
  switchProps?: SwitchProps
}
```

Memoised.

> If you *want* a JS `boolean` in the form, import `Switch` directly from `antd` instead — the toolkit version is intentionally tied to WP meta semantics.

## `Segmented`

`<Form.Item>` + `<Segmented block>` using `BOOLEAN_OPTIONS_REVERSE` (i.e. `[{label:'否', value:'no'}, {label:'是', value:'yes'}]`) by default. Useful for filter chrome where you want a wider control than a switch.

```tsx
import { Segmented } from 'antd-toolkit'

<Segmented
  formItemProps={{ name: 'is_featured' }}
  segmentedProps={{ size: 'small' }}
/>
```

```ts
type Props = {
  formItemProps?: FormItemProps
  segmentedProps?: Omit<SegmentedProps,'ref'> & React.RefAttributes<HTMLDivElement>
}
```

Memoised.

## `DatePicker`

Antd `<DatePicker>` wrapped in `<Form.Item>` that converts between **Dayjs** (UI) and **Unix seconds** (storage). Defaults to `showTime: { defaultValue: dayjs() }` and format `'YYYY-MM-DD HH:mm'`.

```tsx
import { DatePicker } from 'antd-toolkit'

<DatePicker
  formItemProps={{ name: 'expire_at', label: '到期日' }}
  datePickerProps={{
    disabledDate: (current) => current.isBefore(dayjs()),
  }}
/>
// Stored value: 1735689600 (seconds)
// Form sees:    Dayjs object via parseDatePickerValue(seconds)
```

```ts
type Props = {
  formItemProps?: FormItemProps
  datePickerProps?: DatePickerProps
}
```

Conversion helpers (also useful when you need raw transforms outside a form):

```ts
import {
  parseDatePickerValue,    // (val) → Dayjs | undefined
  formatDatePickerValue,   // (val, format='YYYY-MM-DD', fallback='') → string
} from 'antd-toolkit'
```

`parseDatePickerValue` accepts:
- A Dayjs → returned as-is
- 13-digit number → `dayjs(ms)`
- 10-digit number → `dayjs(seconds * 1000)`
- Any other → `dayjs(value)` (best-effort) or `undefined`

Memoised.

## `RangePicker`

Antd `DatePicker.RangePicker` wrapped in `<Form.Item>`. Stores `[from_seconds, to_seconds]`, displays `[Dayjs, Dayjs]`. Default `format='YYYY-MM-DD HH:mm'`, `allowEmpty=[true,true]`.

```tsx
import { RangePicker } from 'antd-toolkit'

<RangePicker
  formItemProps={{ name: 'sale_date_range', label: '促銷期間' }}
  rangePickerProps={{ size: 'small' }}
/>
```

```ts
type Props = {
  formItemProps?: FormItemProps
  rangePickerProps?: GetProps<typeof DatePicker.RangePicker>
}
```

Conversion helpers:
```ts
import {
  parseRangePickerValue,    // (vals) → [Dayjs|undef, Dayjs|undef] | values
  formatRangePickerValue,   // (vals, format='YYYY-MM-DD', fallback=[]) → string[]
} from 'antd-toolkit'
```

`parseRangePickerValue` accepts:
- `[Dayjs, Dayjs]` → returned as-is
- `[number, number]` → each number parsed using the same 13/10 digit rule

If you need to flatten a range field into two separate REST keys, use the `formatDateRangeData` helper:

```ts
import { formatDateRangeData } from 'antd-toolkit'

const payload = formatDateRangeData(
  values,
  'sale_date_range',                       // source key in `values`
  ['date_on_sale_from', 'date_on_sale_to'] // target keys
)
// values.sale_date_range = [dayjs, dayjs]    →    { date_on_sale_from: 1700, date_on_sale_to: 1800, sale_date_range: undefined }
```

Memoised.

## `DoubleConfirmSwitch`

Switch with `<Popconfirm>` + `<Tooltip>` wrapper. Used when *enabling* something needs explicit confirmation but disabling does not — Popconfirm is `disabled` while the switch is already on.

```tsx
import { DoubleConfirmSwitch } from 'antd-toolkit'

<DoubleConfirmSwitch
  fromItemProps={{ name: 'is_published', label: '上架' }}
  popconfirmProps={{
    title: '確認上架？',
    description: '商品將立即對顧客可見。',
  }}
  onConfirm={(checked) => publish()}
  onCancel={() => setUnchecked()}
  switchProps={{ checkedChildren: 'ON', unCheckedChildren: 'OFF' }}
/>
```

```ts
type Props = {
  fromItemProps?: FormItemProps         // sic — matches source spelling
  popconfirmProps?: PopconfirmProps
  tooltipProps?: TooltipProps
  switchProps?: SwitchProps
  onClick?: (checked: boolean) => void
  onConfirm?: (checked: boolean, e?: React.MouseEvent) => void
  onCancel?:  (checked: boolean, e?: React.MouseEvent) => void
}
```

Default texts: title=`'Please Confirm'`, description=`'Do you confirm to Enable ?'`, ok=`'Confirm'`, cancel=`'Cancel'`. (Not localised — override via `popconfirmProps`.)

Memoised.

## `Limit`

Three-way toggle for "expiry / quota" semantics. Manages **three** form fields atomically: `limit_type`, `limit_value`, `limit_unit`. Renamed via `limitTypeName` / `limitValueName` / `limitUnitName` props.

```tsx
import { Limit } from 'antd-toolkit'
import type { TLimit } from 'antd-toolkit'

<Limit
  formItemProps={{ label: '使用期限' }}
  limitTypeName={['watch_limit', 'limit_type']}
  limitValueName={['watch_limit', 'limit_value']}
  limitUnitName={['watch_limit', 'limit_unit']}
/>

// Form values shape (TLimit):
// {
//   limit_type: 'unlimited' | 'fixed' | 'assigned' | 'follow_subscription'
//   limit_value: number | ''   // days/months/years for 'fixed'; unix-seconds for 'assigned'
//   limit_unit: 'second' | 'day' | 'month' | 'year' | ''
// }
```

```ts
type Props = {
  formItemProps?: Omit<FormItemProps, 'name'>      // 'name' is overridden by limitTypeName
  radioGroupProps?: RadioGroupProps                 // override Radio.Group props
  limitTypeName?: NamePath<string>                  // default ['limit_type']
  limitValueName?: NamePath<string>                 // default ['limit_value']
  limitUnitName?: NamePath<string>                  // default ['limit_unit']
}
```

Behaviour matrix (auto-managed when the user switches `limit_type`):

| `limit_type` | `limit_value` | `limit_unit` | Visible UI |
|--------------|---------------|--------------|-----------|
| `unlimited` | `''` | `''` | (none) |
| `fixed` | `1` | `'day'` | Compact `<InputNumber>` + `<Select>` (day/month/year) |
| `assigned` | `undefined` | `'timestamp'` | `<DatePicker>` (toolkit version, stores seconds) |
| `follow_subscription` | `''` | `''` | (none) |

Texts come from the `Limit` locale namespace.

Memoised.

## `VideoLength`

Hour / Minute / Second `<InputNumber>` triplet that writes a **single** total-seconds value to the form field. Auto-decomposes the value back into HH/MM/SS when an existing record is loaded (watching `['id']`).

```tsx
import { VideoLength } from 'antd-toolkit'

<VideoLength name="length_in_seconds" label="影片時長" />
// Stored in form: length_in_seconds = 3725  (=1h 02m 05s)
```

```ts
type Props = FormItemProps           // standard FormItemProps. Source uses formItemProps directly.
```

Behaviour notes:
- Watches `['id']` to decide whether to seed the local hour/minute/second state from the form value.
- `<Item hidden {...formItemProps} />` is rendered to keep antd Form aware of the field.
- Min hour is unbounded; min/max for minute/second is `[0, 59]`.
- Texts: `VideoLength.hour | minute | second`.

Memoised.

## `VideoInput`

Card grid + dynamic sub-form to pick a video by source. Stores a `TVideo` shape:

```ts
import type { TVideo, TVideoType } from 'antd-toolkit'
type TVideoType = 'youtube' | 'vimeo' | 'bunny-stream-api' | 'code'
type TVideo = {
  type: TVideoType
  id: string
  meta: { [key: string]: any }
}
```

```tsx
import { VideoInput } from 'antd-toolkit'

<VideoInput formItemProps={{ name: 'video', label: '主影片' }} />
```

```ts
type Props = {
  formItemProps: FormItemProps          // required
  selectProps?: SelectProps             // accepted but unused in the current impl
}
```

Source picker (rendered as 6 image-tile cards):
- `none` (no video)
- `wordpress` (WP media library)
- `youtube` (URL / embed)
- `vimeo` (URL / embed)
- `bunny-stream-api` (Bunny library — requires `<BunnyProvider>` if the chosen source is Bunny)
- `code` (raw embed code)

When a source is selected, the form value is reset to `{ type: <source>, id: '', meta: {} }` and the matching sub-component (`<Youtube/>`, `<Vimeo/>`, `<Bunny/>`, `<Code/>`) is rendered below the grid.

The hidden form field for `name` is rendered via `<Item hidden {...formItemProps} initialValue="none" />` — note the `initialValue` is the string `'none'`, not a `TVideo` shape, so the form will set the proper `TVideo` when the user picks a source.

Memoised.

---

## BlockNote / useBlockNote

`BlockNote` is the toolkit's pre-configured BlockNote (mantine theme) editor with:
- Custom blocks: `Alert`, `CustomHTML`, `BunnyVideo`, `MediaLibrary` (replacing default `image`/`video`/`audio`/`file`).
- Custom slash menu order + filter.
- A custom `<FormattingToolbar>` (BlockTypeSelect / FileCaption / FileReplace / Bold / Italic / Underline / Strike / Code / Align / Color / Nest / Unnest / Link).
- Drag-and-drop / paste handlers that upload via Refine's `useCustomMutation` to `${apiUrl}/upload`.

```tsx
import { BlockNote, useBlockNote } from 'antd-toolkit'

function MyEditor() {
  const { blockNoteViewProps, blocks, setBlocks } = useBlockNote()
  return <BlockNote {...blockNoteViewProps} />
}
```

### `useBlockNote(params?)`

```ts
import type {
  BlockNoteViewProps, // from @blocknote/react
} from '@blocknote/react'
import type {
  BlockNoteEditorOptions, DefaultStyleSchema, DefaultInlineContentSchema, Block,
} from '@blocknote/core'

type TUseBlockNoteParams = {
  options?: BlockNoteEditorOptions<        // forwarded to useCreateBlockNote
    typeof schema.blockSchema,
    DefaultInlineContentSchema,
    DefaultStyleSchema
  >
  deps?: React.DependencyList              // forwarded to useCreateBlockNote
  itemsFilter?: (
    items: DefaultReactSuggestionItem[],
    query: string,
  ) => DefaultReactSuggestionItem[]        // hook reserves but currently unused — see source
}

function useBlockNote(params?: TUseBlockNoteParams): {
  blockNoteViewProps: BlockNoteViewProps<typeof schema.blockSchema, DefaultInlineContentSchema, DefaultStyleSchema>
  blocks: Block[]
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>
}
```

Behaviour:
- The schema disables defaults (`image`, `video`, `audio`, `checkListItem`) and registers `alert`, `customHTML`, `bunnyVideo`, `mediaLibrary` custom blocks.
- `slashMenu: false` (custom menu via `<SuggestionMenuController>`).
- Internal paste/drop handlers detect file uploads — they:
  1. Insert a temporary "Loading..." `paragraph` block.
  2. POST the file as multipart to `${apiUrl}/upload` via `useCustomMutation`.
  3. On success, replace the temp block with a `mediaLibrary` block.
  4. On error, replace the temp block with an empty paragraph and `console.log`.
- The `onChange` debounce is **700 ms**.

> **Important**: `useBlockNote` calls `useApiUrl()` from Refine. You **must** wrap the editor in a Refine context (via `<Refine dataProvider={…}>`).

### `getEditorHtml(editor, escape?)`

Convert blocks to HTML (lossy). Used by `BlockNoteDrawer` and `DescriptionDrawer` before saving.

```ts
import { getEditorHtml } from 'antd-toolkit'

const html = await getEditorHtml(editor)        // returns '<div class="power-editor">…</div>'
const escapedHtml = await getEditorHtml(editor, true)
```

- Returns empty string when there's only an empty paragraph.
- Removes `data-html` attributes.
- Replaces empty `<p></p>` tags with `<p>&nbsp;</p>`.
- Wraps the result in `<div class="power-editor">…</div>` (unless `escape=true` — then it returns the inner HTML escaped).

### `BlockNote` component

```ts
const BlockNote: FC<
  BlockNoteViewProps<
    typeof schema.blockSchema,
    DefaultInlineContentSchema,
    DefaultStyleSchema
  >
>
```

Just a typed pass-through to BlockNote's `<BlockNoteView>` (mantine). All props you'd pass to `BlockNoteView` work here.

## `BlockNoteDrawer`

Higher-level component that combines:
- `useBlockNote()` (the editor)
- `useSimpleDrawer()` (the side drawer)
- Refine `useUpdate()` (saves on click)

```tsx
import { BlockNoteDrawer } from 'antd-toolkit'

<Form>
  <Form.Item name="id" hidden initialValue={postId} />
  {/* the drawer reads ['id'] internally to decide which record to update */}
  <BlockNoteDrawer
    name={['short_description']}
    resource="posts"
    dataProviderName="default"
    parseData={(values) => ({ ...values, sanitized: true })}
    buttonProps={{ size: 'small' }}
  />
</Form>
```

```ts
type Props = {
  name?: FormItemProps['name']        // default ['short_description']
  resource?: string                   // default 'posts'
  dataProviderName?: string           // default 'default'
  buttonProps?: ButtonProps           // applied to the trigger button
  parseData?: (values: any) => any    // default (v) => v. Mutate payload before useUpdate
}
```

Behaviour:
- The trigger button shows `t.startEditing` from the `EditorDrawer` locale namespace.
- The drawer footer has *Fullscreen toggle*, *Clear all*, *Save content* buttons.
- On open, if there's already a value at `name`, the editor loads it via `editor.tryParseHTMLToBlocks`.
- On save, sends `{ id: form.getFieldValue(['id']), values: parseData({...form.getFieldsValue(), [name]: html}) }` to `useUpdate`.
- Notification handling uses `notificationProps` from `antd-toolkit/refine` (success + error mappers).

Memoised.

## `DescriptionDrawer`

Like `BlockNoteDrawer` but adds a `<Radio.Group>` to switch between `'power-editor'` (BlockNote) and `'elementor'` (opens `${SITE_URL}/wp-admin/post.php?post=<id>&action=elementor` in a new tab).

```tsx
import { DescriptionDrawer } from 'antd-toolkit'

<Form>
  <Form.Item name="id" hidden initialValue={postId} />
  <Form.Item name="editor" hidden initialValue="power-editor" />
  <DescriptionDrawer
    name={['description']}
    resource="posts"
    initialEditor="power-editor"      // shows warning if user changes it
  />
</Form>
```

```ts
type Props = {
  name?: FormItemProps['name']                 // default ['description']
  resource?: string                            // default 'posts'
  dataProviderName?: string                    // default 'default'
  editorFormItemProps?: FormItemProps          // override for the editor switcher Radio.Group
  buttonProps?: ButtonProps
  initialEditor?: 'power-editor' | 'elementor'
  parseData?: (values: any) => any
}
```

Behaviour:
- Reads `useEnv()` to get `SITE_URL` and `ELEMENTOR_ENABLED`. **Requires `<EnvProvider>`**.
- When `editor` field changes, it sets `_elementor_edit_mode='builder'` (or `''`) on the form so the WP backend knows.
- Disables the "open" button while `editor !== initialEditor` and shows a warning to save first.
- Tooltip explains why Elementor is disabled if `ELEMENTOR_ENABLED=false`.

Memoised.
