---
name: antd-toolkit
description: >
  antd-toolkit (j7-dev/antd-toolkit) v1.3.x — React component library wrapping
  antd v5 with Refine integration helpers, WordPress / WooCommerce specific UI,
  BlockNote-based rich-text editor, and a Bunny Stream media library. Use this
  skill whenever code imports from 'antd-toolkit', 'antd-toolkit/wp', or
  'antd-toolkit/refine', or when package.json contains "antd-toolkit". Triggers
  include LocaleProvider, EnvProvider, ActionButton, ObjectTable, SimpleModal,
  SimpleDrawer, BlockNote, MediaLibrary, BunnyProvider, dataProvider,
  bunnyStreamDataProvider, useWoocommerce, ProductFilter, UserAvatarUpload,
  notificationProvider, useColumnSearch, and the WP / WooCommerce constant sets
  (POST_STATUS, ORDER_STATUS, PRODUCT_TYPES). Do NOT search the web for
  antd-toolkit docs — use this skill instead.
---

# antd-toolkit API Reference

`antd-toolkit` (npm package `antd-toolkit`, repo `j7-dev/antd-toolkit`) is a React component library that bundles three things: (1) opinionated wrappers around `antd` v5, (2) Refine integration helpers, (3) WordPress / WooCommerce admin building blocks. It also ships a BlockNote-based rich text editor and a Bunny Stream media library.

**Version coverage**: `antd-toolkit@1.3.x` (tested against 1.3.223). Built on antd ^5.25, React 18.3, @refinedev/core ^4.58, @refinedev/antd ^5.47, @blocknote ^0.49, @tanstack/react-query ^5.100, jotai ^2.12, dayjs ^1.11.

## Three Entry Points

The package ships three independent ESM entries — each must be imported from its own subpath:

| Import path | Contains | Required peers |
|-------------|----------|----------------|
| `antd-toolkit` (`./`) | Core components, hooks, utils, locales, types | antd, react, dayjs |
| `antd-toolkit/wp` | WordPress + WooCommerce specific components, hooks, types, constants | antd, @refinedev/core, @refinedev/antd |
| `antd-toolkit/refine` | Refine `dataProvider`, `notificationProvider`, Bunny Stream module, batch CRUD components | @refinedev/core, @refinedev/antd, axios, query-string |

```tsx
// Core
import { LocaleProvider, useLocale, ActionButton, cn, defaultImage } from 'antd-toolkit'
import type { TLocale, TLimit } from 'antd-toolkit'

// WordPress / WooCommerce
import { useWoocommerce, ProductName, UserFilter, stringToBool } from 'antd-toolkit/wp'
import type { TProductBaseRecord, TUserBaseRecord, TWoocommerce } from 'antd-toolkit/wp'

// Refine integration
import { dataProvider, notificationProvider, BunnyProvider, useBunny } from 'antd-toolkit/refine'

// Stylesheet (only required for the core entry; auto-loaded once via side-effect)
import 'antd-toolkit/style.css'
```

> The `dist/style.css` is automatically loaded when you import the JS entry (the package marks `**/*.css` as a sideEffect). Importing it explicitly is only needed if your bundler tree-shakes side-effects.

## Reference Files

Read only what your task needs. Each file contains complete API signatures, all props with TypeScript types, defaults, and runnable patterns.

| File | When to read |
|------|--------------|
| `references/main-components.md` | Anything imported from `antd-toolkit` core that is a component (Amount, Card, NameId, ObjectTable, SimpleModal/Drawer, ActionButton, Heading, etc.) |
| `references/main-form-items.md` | Form items under `formItem/*` (Switch, Segmented, DatePicker, RangePicker, VideoInput, VideoLength, DoubleConfirmSwitch, Limit) and BlockNote editor stack |
| `references/main-hooks-utils.md` | All core hooks (useColor, useColumnSearch, useConstantSelect, useRowSelection, useEnv, useLocale, useSimpleModal, useSimpleDrawer), utils (cn, renderHTML, dayjs/video/zod helpers, defaultSelectProps), locales (zh_TW/en_US/ja_JP) and types (TLimit, TVideo, TConstant, etc.) |
| `references/refine-module.md` | Anything imported from `antd-toolkit/refine`: `dataProvider`, `bunnyStreamDataProvider`, `notificationProvider`/`notificationProps`, `useDeleteButtonProps`, batch components (BindItems, UnbindItems, GrantUsers, RevokeUsers, UpdateBoundItems, UpdateGrantedUsers, FilterTags, ActionArea, SelectedItem, ProductFilter), `useUpdateRecord`, `objToCrudFilters`, `onProductSearch`. **Bunny module** (BunnyProvider, MediaLibrary, MediaLibraryModal, hooks) is also documented here. |
| `references/wp-module.md` | Anything imported from `antd-toolkit/wp`: WordPress media library (MediaLibrary/Modal/Notification/OnChangeUpload/Upload/FileUpload), WooCommerce product UI (ProductName, ProductType, ProductPrice, ProductStock, ProductTotalSales, ProductCat, ProductBoundItems), user UI (UserName, UserAvatarUpload, UserFilter, UserRole), hooks (useItemSelect, useWoocommerce, useCountries, useCountryOptions, useProductTaxonomies), all constants & their hook variants, type definitions (TProductBaseRecord, TUserBaseRecord, TAttachment, TWoocommerce, etc.) |

## Mandatory Setup: LocaleProvider

Most components use `useLocale(namespace)` internally for i18n. **Wrap your tree once** at the top — without it the components fall back to the default `zh_TW` (繁體中文) locale.

```tsx
import { LocaleProvider, en_US } from 'antd-toolkit'

function App() {
  return (
    <LocaleProvider locale={en_US}>
      <YourApp />
    </LocaleProvider>
  )
}
```

Built-in locales: `zh_TW` (default), `en_US`, `ja_JP`. To customise, spread one of the built-ins and override only the namespaces you need (see `references/main-hooks-utils.md` § Locales).

> **Important**: `antd-toolkit`'s `LocaleProvider` only translates antd-toolkit components. Antd's own UI text (Pagination, Empty, etc.) requires antd's `ConfigProvider` + `locale` separately.

## Common Setup with Refine

Most batch-CRUD and Bunny components assume Refine is configured with the bundled `dataProvider`. Typical bootstrap:

```tsx
import { Refine } from '@refinedev/core'
import { useNotificationProvider } from '@refinedev/antd'
import { dataProvider, notificationProvider, BunnyProvider } from 'antd-toolkit/refine'
import { LocaleProvider, EnvProvider } from 'antd-toolkit'
import axios from 'axios'

const axiosInstance = axios.create({ headers: { 'X-WP-Nonce': window.appData.nonce } })

<LocaleProvider>
  <EnvProvider env={{
    SITE_URL: 'https://example.com',
    AJAX_URL: '...', API_URL: '...', NONCE: '...',
    CURRENT_USER_ID: 1, CURRENT_POST_ID: false, PERMALINK: '',
    APP_NAME: 'my-app', KEBAB: 'my-app', SNAKE: 'my_app',
  }}>
    <BunnyProvider
      bunny_library_id="123"
      bunny_stream_api_key="xxx"
      bunny_cdn_hostname="vz-xxx.b-cdn.net">
      <Refine
        dataProvider={{
          default: dataProvider('https://api.example.com', axiosInstance),
        }}
        notificationProvider={notificationProvider}>
        {/* your routes */}
      </Refine>
    </BunnyProvider>
  </EnvProvider>
</LocaleProvider>
```

## Tailwind Class Prefix

All internal CSS classes are prefixed with `at-` (configured via tailwind `prefix: 'at-'`). When using the bundled stylesheet, `at-flex`, `at-mb-4`, etc. are scoped to antd-toolkit and won't collide with your project's Tailwind. The `cn()` util re-exported from the package is `twMerge(clsx(args))` and merges normally — you can mix prefixed and unprefixed classes in your own components.

## Behavioural Conventions

These show up everywhere; understanding them once removes most guesswork.

### Boolean as `'yes' | 'no'` strings
WordPress meta values commonly serialise booleans as `'yes' / 'no'`. The `Switch`, `Segmented` and many filter components in `formItem/*` and `wp/*` round-trip through `stringToBool` / `boolToString`. When wiring forms to a WP REST endpoint use those helpers — do **not** assume a JS boolean.

```ts
import { stringToBool, boolToString } from 'antd-toolkit/wp'
stringToBool('yes')   // true (also: '1', 1, 'true', 'on', true)
boolToString(true)    // 'yes'
```

### Date as Unix timestamp
The bundled `DatePicker` and `RangePicker` (under `formItem/*`) automatically convert between Dayjs (UI) and **Unix seconds** (storage). When the form value comes from REST as a number, the component handles parsing — see `references/main-form-items.md` § DatePicker. Manual conversion utilities: `parseDatePickerValue`, `formatDatePickerValue`, `parseRangePickerValue`, `formatRangePickerValue`.

### useLocale namespace pattern
Each component reads its own namespace, e.g. `useLocale('ActionButton')` returns just the `ActionButton` slice of `TLocale`. To override texts, spread `zh_TW` and replace just the slice you need. Adding a new component? It must declare its key in `TLocale` (in `lib/main/locales/types.ts`) and provide values in all three locales.

### Variant pattern for icon vs text vs both
Several components (`ActionButton`, `PopconfirmDelete`, `BooleanSegmented`, `ProductStock`) accept a `type` prop with values like `'icon' | 'text' | 'both'` or `'icon' | 'button'` to switch presentation. The default is usually `'both'` or `'icon'` — check the component's signature in the relevant reference file.

### Two modal/drawer flavours
`SimpleModal` and `SimpleDrawer` are **not** ant-design's `Modal`/`Drawer`. They're lighter, render via `Portal`, animate with CSS, and pair with `useSimpleModal()` / `useSimpleDrawer()` hooks that return `{ show, close, modalProps }` (or `drawerProps`). Use them for toolkit-managed UI (e.g. media library); use antd's own `Modal`/`Drawer` elsewhere.

## Quick Cheat-Sheet — When To Use What

| Need | Component / Hook | From |
|------|------------------|------|
| Curreny number with optional symbol | `Amount` | `antd-toolkit` |
| Round status dot (with optional tooltip) | `BooleanIndicator` | `antd-toolkit` |
| Yes/No filter as Radio buttons / Segmented | `BooleanRadioButton` / `BooleanSegmented` | `antd-toolkit` |
| Animated breathing dot (live indicator) | `BreathLight` | `antd-toolkit` |
| `<Card>` with optional bypass mode | `Card` (with `showCard` prop) | `antd-toolkit` |
| Click-to-copy span | `CopyText` | `antd-toolkit` |
| Big digit countdown to a timestamp | `Countdown` | `antd-toolkit` |
| Compact "calendar + clock" date display | `DateTime` | `antd-toolkit` |
| H2 / H3 with left bar | `Heading` | `antd-toolkit` |
| `LOADING…` placeholder card / page | `LoadingCard` / `LoadingPage` | `antd-toolkit` |
| `name #id` two-line display | `NameId` | `antd-toolkit` |
| Vertical key-value table from object | `ObjectTable` | `antd-toolkit` |
| Delete button with `Popconfirm` | `PopconfirmDelete` | `antd-toolkit` |
| Render in `document.body` | `Portal` | `antd-toolkit` |
| Format seconds as `HH MM SS` | `SecondToStr` | `antd-toolkit` |
| Cross-page selection indicator | `SelectedRecord` | `antd-toolkit` |
| Lazy `<img>` with skeleton | `SimpleImage` | `antd-toolkit` |
| Hand-rolled lightweight modal/drawer | `SimpleModal` / `SimpleDrawer` (+ hooks) | `antd-toolkit` |
| Collapsed/expanded HTML content | `ToggleContent` | `antd-toolkit` |
| Up/down trend arrow + percentage | `TrendIndicator` | `antd-toolkit` |
| File-extension SVG icon | `ExtIcon` | `antd-toolkit` |
| Permission expiry tag for video plays | `WatchStatusTag` | `antd-toolkit` |
| Edit/Save/Cancel/Delete button row | `ActionButton` | `antd-toolkit` |
| Read antd theme tokens as a hook | `useColor` | `antd-toolkit` |
| Antd Table column with built-in search | `useColumnSearch` | `antd-toolkit` |
| Stateful Antd Select wired to constants | `useConstantSelect` | `antd-toolkit` |
| `selectedRowKeys` + selections preset for Table | `useRowSelection` | `antd-toolkit` |
| WP/REST `Form.Item` for `'yes'`/`'no'` Switch | `Switch` (the toolkit one) | `antd-toolkit` |
| `Form.Item` for unix-timestamp DatePicker | `DatePicker` (the toolkit one) | `antd-toolkit` |
| Subscription / one-time / unlimited expiry input | `Limit` | `antd-toolkit` |
| Confirm-twice toggle | `DoubleConfirmSwitch` | `antd-toolkit` |
| BlockNote editor + WP integration | `BlockNote`, `useBlockNote`, `BlockNoteDrawer` | `antd-toolkit` |
| WP-aware editor switcher (BlockNote vs Elementor) | `DescriptionDrawer` | `antd-toolkit` |
| Cookie/Nonce-aware axios instance | `useEnv` (after `<EnvProvider>`) | `antd-toolkit` |
| Refine-compatible WP REST `dataProvider` | `dataProvider(apiUrl, axios)` | `antd-toolkit/refine` |
| Refine `notificationProvider` w/ icons | `notificationProvider`, `notificationProps` | `antd-toolkit/refine` |
| Bulk bind/unbind products and items | `BindItems`, `UnbindItems`, `UpdateBoundItems` | `antd-toolkit/refine` |
| Grant/revoke user access to items | `GrantUsers`, `RevokeUsers`, `UpdateGrantedUsers` | `antd-toolkit/refine` |
| Render filter Tags from antd Form values | `FilterTags` | `antd-toolkit/refine` |
| Sticky bottom action bar (Refine layout aware) | `ActionArea` | `antd-toolkit/refine` |
| Bunny Stream library + upload + modal | `BunnyProvider`, `MediaLibrary`, `MediaLibraryModal` | `antd-toolkit/refine` |
| WordPress media-library replacement | `MediaLibrary`, `MediaLibraryModal` | `antd-toolkit/wp` |
| WP file uploader integrated with REST | `Upload`, `useUpload`, `OnChangeUpload`, `useOnChangeUpload`, `FileUpload` | `antd-toolkit/wp` |
| WC product display widgets | `ProductName`, `ProductType`, `ProductPrice`, `ProductStock`, `ProductTotalSales`, `ProductCat`, `ProductBoundItems` | `antd-toolkit/wp` |
| User row / role / avatar / filter | `UserName`, `UserRole`, `UserAvatarUpload`, `UserFilter` | `antd-toolkit/wp` |
| WC settings (countries / taxonomies / currency) | `useWoocommerce`, `useCountries`, `useCountryOptions`, `useProductTaxonomies` | `antd-toolkit/wp` |
| Refine-compatible select for any CPT | `useItemSelect` | `antd-toolkit/wp` |
| Locale-aware option arrays | `usePostStatus`, `useUserRoles`, `useOrderStatus`, `useProductTypes`, `useProductStockStatus`, `useBackorders`, `useProductCatalogVisibilities`, `useProductDateFields`, `useBooleanOptions` | `antd-toolkit/wp` |

## Things to NOT do

- **Never re-export from `antd-toolkit/wp` to use core symbols.** The `wp` entry imports from core; reaching into `wp` for `cn()` or `LocaleProvider` works at runtime but bloats the bundle. Always use the most specific entry.
- **Don't construct `dataProvider` outside of a Refine `<Refine dataProvider={…}>`.** Most batch components call `useApiUrl()` from `@refinedev/core`, which throws without a Refine provider in scope.
- **Don't pass a JS `boolean` to the toolkit `Switch` / `Segmented`.** They normalise to `'yes' | 'no'`. Pre-store as string. (Use the antd `Switch` directly if you want a JS boolean.)
- **Don't omit `<EnvProvider>` if you call `useEnv()`, `BackToWpAdmin`, `DescriptionDrawer`, or any media library component.** Those expect `SITE_URL`, `NONCE`, `API_URL`, etc. (see `references/main-hooks-utils.md` § EnvProvider).
- **Don't use the bundled `Card` wrapper if you want antd's `Card.Meta` etc.** It's `<AntdCard>` for `showCard=true`, otherwise pass-through children — `Meta` is unaffected but bear in mind the wrapper has no other surface.
- **Don't expect Bunny's `dataProvider` to support `createMany`/`updateMany`/`deleteMany`.** It only ships getList / getMany / getOne / create / update / deleteOne / custom.

## Useful Type Aliases

```ts
import type {
  // Core
  TLocale, TConstant, TGetColumnFilterProps, TLimit, TLimitType, TLimitUnit,
  TVideo, TVideoType, THttpMethods, THttpMethodsWithBody, TOrder, TOrderBy,
  TEnv, TExpireDate,
} from 'antd-toolkit'

import type {
  // WordPress / WooCommerce
  TImage, TTerm, TPostStatus, TOrderStatus,
  TUserBaseRecord, TProductBaseRecord, TProductVariationBase, TProductAttribute,
  TProductType, TProductStockStatus, TBackorders,
  TWoocommerce, TTaxonomy, TAttachment,
} from 'antd-toolkit/wp'

import type {
  // Refine module
  TGrantedItemBase, TProductFilterProps, UseCustomMutationParams,
  TBunnyVideo, TGetVideosResponse, TUploadVideoResponse, TUploadStatus, TFileInQueue,
  TMediaLibraryProps, TFileStatus,
} from 'antd-toolkit/refine'
```

(The `TMediaLibraryProps` type exists separately in both `wp` and `refine` namespaces — they look similar but the WP one accepts `(TAttachment | TImage)[]` while the Bunny one accepts `TBunnyVideo[]`. Pick the right entry.)
