# TailwindCSS v4 Variants 完整參考

> 來源：https://tailwindcss.com/docs/hover-focus-and-other-states | https://tailwindcss.com/docs/responsive-design

## 目錄
1. [Pseudo-class Variants](#1-pseudo-class-variants)
2. [Pseudo-element Variants](#2-pseudo-element-variants)
3. [媒體查詢 Variants](#3-媒體查詢-variants)
4. [Container Query Variants](#4-container-query-variants)
5. [group / peer Variants](#5-group--peer-variants)
6. [has / not / is / where Variants](#6-has--not--is--where-variants)
7. [ARIA Variants](#7-aria-variants)
8. [data-* Variants](#8-data--variants)
9. [方向性 Variants](#9-方向性-variants)
10. [子元素 Variants](#10-子元素-variants)
11. [任意 Variants](#11-任意-variants-arbitrary)
12. [自訂 Variants](#12-自訂-variants)
13. [堆疊規則](#13-堆疊規則)

---

## 1. Pseudo-class Variants

### 互動狀態

| Variant | CSS 對應 | 說明 |
|---------|---------|------|
| `hover:` | `:hover` | 游標懸停（v4 預設包含 `@media (hover: hover)`） |
| `focus:` | `:focus` | 鍵盤聚焦 |
| `focus-within:` | `:focus-within` | 自身或後代聚焦 |
| `focus-visible:` | `:focus-visible` | 鍵盤聚焦（可見輪廓） |
| `active:` | `:active` | 點擊時 |
| `visited:` | `:visited` | 已訪問連結 |
| `target:` | `:target` | URL hash 匹配 |

```html
<button class="bg-blue-500 hover:bg-blue-700 active:bg-blue-900 focus-visible:ring-2">
  按鈕
</button>
```

### 表單狀態

| Variant | CSS 對應 |
|---------|---------|
| `disabled:` | `:disabled` |
| `enabled:` | `:enabled` |
| `checked:` | `:checked` |
| `indeterminate:` | `:indeterminate` |
| `required:` | `:required` |
| `optional:` | `:optional` |
| `valid:` | `:valid` |
| `invalid:` | `:invalid` |
| `in-range:` | `:in-range` |
| `out-of-range:` | `:out-of-range` |
| `read-only:` | `:read-only` |
| `placeholder-shown:` | `:placeholder-shown` |
| `autofill:` | `:autofill` |
| `default:` | `:default` |

```html
<input class="border-gray-300 invalid:border-red-500 disabled:opacity-50 read-only:bg-gray-100">
```

### 位置與結構

| Variant | CSS 對應 |
|---------|---------|
| `first:` | `:first-child` |
| `last:` | `:last-child` |
| `only:` | `:only-child` |
| `odd:` | `:nth-child(odd)` |
| `even:` | `:nth-child(even)` |
| `first-of-type:` | `:first-of-type` |
| `last-of-type:` | `:last-of-type` |
| `only-of-type:` | `:only-of-type` |
| `empty:` | `:empty` |

```html
<ul>
  <li class="border-t-0 first:border-t odd:bg-gray-50">項目</li>
</ul>
```

### 其他

| Variant | CSS 對應 |
|---------|---------|
| `open:` | `[open]`（dialog/details） |
| `starting:` | `@starting-style`（進場動畫） |

---

## 2. Pseudo-element Variants

| Variant | CSS 對應 | 說明 |
|---------|---------|------|
| `before:` | `::before` | 偽元素前 |
| `after:` | `::after` | 偽元素後 |
| `placeholder:` | `::placeholder` | input placeholder |
| `file:` | `::file-selector-button` | file input 按鈕 |
| `marker:` | `::marker` | list marker |
| `selection:` | `::selection` | 選取文字 |
| `first-line:` | `::first-line` | 首行 |
| `first-letter:` | `::first-letter` | 首字母 |
| `backdrop:` | `::backdrop` | dialog backdrop |

```html
<p class="before:content-['#'] before:mr-1 selection:bg-yellow-200">
  段落
</p>
<input class="placeholder:text-gray-400" placeholder="輸入...">
<input type="file" class="file:border file:rounded file:px-3 file:py-1">
```

---

## 3. 媒體查詢 Variants

### 響應式斷點（Mobile-first）

| Variant | 最小寬度 |
|---------|---------|
| `sm:` | 40rem (640px) |
| `md:` | 48rem (768px) |
| `lg:` | 64rem (1024px) |
| `xl:` | 80rem (1280px) |
| `2xl:` | 96rem (1536px) |

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">...</div>
```

自訂斷點（在 `@theme` 中定義）：
```css
@theme { --breakpoint-3xl: 120rem; }
```
使用：`3xl:text-6xl`

最大寬度（max-width）使用 `max-*:`：
```html
<div class="max-md:hidden">640px 以下隱藏</div>
```

### 系統偏好

| Variant | 媒體查詢 |
|---------|---------|
| `dark:` | `prefers-color-scheme: dark` |
| `light:` | `prefers-color-scheme: light` |
| `motion-reduce:` | `prefers-reduced-motion: reduce` |
| `motion-safe:` | `prefers-reduced-motion: no-preference` |
| `contrast-more:` | `prefers-contrast: more` |
| `contrast-less:` | `prefers-contrast: less` |
| `forced-colors:` | `forced-colors: active` |
| `print:` | `print` 媒體 |
| `portrait:` | `orientation: portrait` |
| `landscape:` | `orientation: landscape` |

```html
<div class="bg-white dark:bg-gray-900 motion-reduce:transition-none">...</div>
```

**v4 dark mode 預設為媒體查詢**。要改為 class-based：
```css
@custom-variant dark (&:where(.dark, .dark *));
```

---

## 4. Container Query Variants

v4 內建，無需 `@tailwindcss/container-queries` 插件。

### 基本用法

```html
<div class="@container">
  <div class="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3">...</div>
</div>
```

### 預設 Container 尺寸

| Variant | 最小容器寬度 |
|---------|------------|
| `@3xs:` | 16rem (256px) |
| `@2xs:` | 18rem (288px) |
| `@xs:` | 20rem (320px) |
| `@sm:` | 24rem (384px) |
| `@md:` | 28rem (448px) |
| `@lg:` | 32rem (512px) |
| `@xl:` | 36rem (576px) |
| `@2xl:` | 42rem (672px) |
| `@3xl:` | 48rem (768px) |
| `@4xl:` | 56rem (896px) |
| `@5xl:` | 64rem (1024px) |
| `@6xl:` | 72rem (1152px) |
| `@7xl:` | 80rem (1280px) |

### 命名容器（巢狀時區分）

```html
<div class="@container/main">
  <div class="@container/sidebar">
    <p class="@sm/main:text-lg @sm/sidebar:text-sm">...</p>
  </div>
</div>
```

### 最大寬度容器查詢

```html
<div class="@max-md:hidden">...</div>
```

### 任意值

```html
<div class="@[800px]:grid-cols-4">...</div>
```

---

## 5. group / peer Variants

### group

標記父元素，對子元素應用條件樣式：

```html
<div class="group hover:bg-gray-100">
  <p class="text-gray-500 group-hover:text-gray-900">...</p>
  <svg class="opacity-50 group-hover:opacity-100">...</svg>
</div>
```

所有 pseudo-class 都可以用於 group：`group-focus:`、`group-active:`、`group-disabled:` 等。

**命名 group**（巢狀時區分）：
```html
<div class="group/card hover:bg-gray-50">
  <div class="group/item">
    <p class="group-hover/card:text-blue-500 group-hover/item:underline">...</p>
  </div>
</div>
```

**任意 group selector**：
```html
<div class="group is-published">
  <p class="group-[.is-published]:text-green-600">...</p>
</div>
```

### peer

標記同層前置兄弟元素，對後置兄弟應用條件樣式（**必須是前置兄弟**）：

```html
<input type="checkbox" class="peer">
<label class="text-gray-600 peer-checked:text-blue-600">核取框標籤</label>

<input class="peer" placeholder="">
<p class="hidden peer-placeholder-shown:block">請輸入內容</p>
<p class="peer-invalid:block hidden">格式不正確</p>
```

**命名 peer**：
```html
<input id="a" class="peer/a">
<input id="b" class="peer/b">
<p class="peer-checked/a:text-blue peer-checked/b:text-red">...</p>
```

---

## 6. has / not / is / where Variants

### has:

父元素包含特定後代時套用：

```html
<!-- label 中有 checked 的 input 時，改變 label 樣式 -->
<label class="bg-white has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500">
  <input type="checkbox">
</label>
```

### not:

自身不匹配特定條件時套用：

```html
<button class="not-disabled:hover:bg-blue-600">...</button>
<li class="not-first:border-t">...</li>
```

### in:（v4 新增）

自身是特定選擇器的後代時套用：

```html
<div class="in-[.dark-mode]:text-white">...</div>
```

### 任意 CSS 選擇器

```html
<div class="[&>p]:text-sm [&_a]:underline">...</div>
```

---

## 7. ARIA Variants

根據 ARIA 屬性套用樣式：

| Variant | HTML 屬性 |
|---------|----------|
| `aria-checked:` | `aria-checked="true"` |
| `aria-disabled:` | `aria-disabled="true"` |
| `aria-expanded:` | `aria-expanded="true"` |
| `aria-hidden:` | `aria-hidden="true"` |
| `aria-pressed:` | `aria-pressed="true"` |
| `aria-readonly:` | `aria-readonly="true"` |
| `aria-required:` | `aria-required="true"` |
| `aria-selected:` | `aria-selected="true"` |

```html
<button aria-expanded="true" class="aria-expanded:bg-blue-100">
  選項
</button>
```

**任意 ARIA 值**：
```html
<div aria-sort="ascending" class="aria-[sort=ascending]:text-blue-500">...</div>
```

---

## 8. data-* Variants

根據 data 屬性套用樣式：

```html
<div data-active class="data-active:bg-blue-100">...</div>
<div data-state="active" class="data-[state=active]:bg-blue-100">...</div>
```

---

## 9. 方向性 Variants

### 文字方向

| Variant | 說明 |
|---------|------|
| `ltr:` | LTR 文字方向時 |
| `rtl:` | RTL 文字方向時 |

```html
<div class="rtl:flex-row-reverse">...</div>
```

### 邏輯屬性（方向無關）

`ms-*`（margin-inline-start）、`me-*`（margin-inline-end）、`ps-*`、`pe-*` 等邏輯屬性 class 會自動根據文字方向調整，不需要使用 `ltr:`/`rtl:` variant。

---

## 10. 子元素 Variants

### * （直接子元素）

```html
<ul class="*:border-b *:py-2">
  <li>項目一</li>
  <li>項目二</li>
</ul>
```

### ** （任意後代元素）

```html
<div class="**:text-sm">所有後代的文字都是 sm</div>
```

---

## 11. 任意 Variants（Arbitrary）

使用方括號語法直接寫 CSS 選擇器：

```html
<!-- 選取直接後代 -->
<div class="[&>p]:text-sm">...</div>

<!-- 選取特定後代 -->
<div class="[&_a:hover]:underline">...</div>

<!-- 選取第 N 個子元素 -->
<ul class="[&>li:nth-child(3)]:font-bold">...</ul>

<!-- 媒體查詢 -->
<div class="[@media(min-width:900px)]:grid-cols-3">...</div>

<!-- 帶 & 的 pseudo-class -->
<a class="[&:not(:first-child)]:ml-4">...</a>
```

---

## 12. 自訂 Variants

### 短語法（單一選擇器）

```css
@custom-variant theme-midnight (&:where([data-theme="midnight"] *));
@custom-variant dark (&:where(.dark, .dark *));
```

### 完整語法（多規則，使用 @slot）

```css
@custom-variant any-hover {
  @media (any-hover: hover) {
    &:hover {
      @slot;
    }
  }
}
```

### 用法

```html
<div class="theme-midnight:bg-gray-900 any-hover:hover:underline">...</div>
```

---

## 13. 堆疊規則

**v4 Variant 堆疊順序：從左到右（v3 為從右到左）**

```html
<!-- v4 正確：* 先應用，再應用 first -->
<div class="*:first:pt-0">...</div>

<!-- v3 寫法（在 v4 中行為不同） -->
<div class="first:*:pt-0">...</div>
```

**常見堆疊組合：**

```html
<!-- group + responsive -->
<div class="group">
  <p class="md:group-hover:text-blue-500">...</p>
</div>

<!-- dark + hover -->
<button class="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
  按鈕
</button>

<!-- group + peer + responsive -->
<form class="group">
  <input class="peer border invalid:border-red-500">
  <p class="hidden peer-invalid:block md:peer-invalid:text-sm group-[.submitted]:block">
    錯誤訊息
  </p>
</form>

<!-- container query + responsive -->
<div class="@container">
  <div class="grid grid-cols-1 @sm:grid-cols-2 md:@lg:grid-cols-3">...</div>
</div>
```

**important modifier（加 !）：**

```html
<div class="!text-sm"><!-- !important --></div>
<div class="hover:!text-blue-500"><!-- hover 時 !important --></div>
```
