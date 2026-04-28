# TailwindCSS v4 Directives & @theme 命名空間完整參考

> 來源：https://tailwindcss.com/docs/functions-and-directives | https://tailwindcss.com/docs/theme

## 目錄
1. [CSS 指令](#1-css-指令)
2. [CSS 函式](#2-css-函式)
3. [@theme 命名空間清單](#3-theme-命名空間完整清單)
4. [預設主題值](#4-預設主題值)
5. [Preflight 重置規則](#5-preflight-重置規則)

---

## 1. CSS 指令

### @import

```css
@import "tailwindcss";
@import "tailwindcss" source("../src");
@import "tailwindcss" source(none);
@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css" layer(utilities);
```

停用 preflight：省略 preflight.css 行即可。支援 Node.js subpath imports（# 開頭別名）。

### @theme

```css
@theme {
  --color-brand: oklch(0.72 0.11 178);
  --font-display: "Satoshi", sans-serif;
  --breakpoint-3xl: 120rem;
  --color-*: initial;  /* 覆蓋整個命名空間 */
  --*: initial;        /* 覆蓋全部預設 */
}
@theme inline { --color-canvas: var(--acme-canvas-color); }
@theme static { --spacing-0: 0; /* 僅 CSS 變數，不生成 utility */ }
```

| 修飾詞 | 行為 |
|--------|------|
| `@theme` | 預設：生成 utility class + CSS 變數，值在定義處解析 |
| `@theme inline` | 值在使用處解析（用於引用其他 CSS 變數） |
| `@theme static` | 僅生成 CSS 變數，不生成 utility class |

### @source

```css
@source "../node_modules/@my-company/ui-lib";
@source inline("underline");
@source inline("{hover:,focus:,}bg-red-{50,{100..900..100},950}");
@source not "../src/legacy";
```

| 語法 | 用途 |
|------|------|
| `@source "path"` | 加入掃描來源 |
| `@source not "path"` | 排除路徑 |
| `@source inline("class")` | 強制生成（safelist） |
| `source(none)` on @import | 停用自動偵測 |

### @utility

```css
@utility content-auto { content-visibility: auto; }

@utility tab-* {
  tab-size: --value(--tab-size-*);  /* @theme 匹配 */
  tab-size: --value(integer);        /* 裸數字 */
  tab-size: --value([integer]);      /* 任意值 */
}
```

`@utility` 定義的 class 支援所有 variant（hover:、md:、dark: 等），而 `@layer utilities` 定義的不支援。

### @custom-variant

```css
@custom-variant theme-midnight (&:where([data-theme="midnight"] *));
@custom-variant dark (&:where(.dark, .dark *));
@custom-variant any-hover {
  @media (any-hover: hover) { &:hover { @slot; } }
}
```

`@slot` 標記 variant 內容的插入位置，用於多規則 variant。

### @variant

在 CSS 中使用已有的 variant（臨時性用法，較常用 @custom-variant）：

```css
.my-element {
  @variant dark { background: black; }
  @variant hover { background: gray; }
}
```

### @apply

```css
.select2-dropdown { @apply rounded-b-lg shadow-md border border-gray-300; }
```

```vue
<style>
  @reference "../../app.css";
  h1 { @apply text-2xl font-bold; }
</style>
```

注意：在 Vue/Svelte `<style>` 或 CSS Modules 中需搭配 `@reference`。

### @reference

```css
@reference "../../app.css";
@reference "tailwindcss";
```

讓獨立 CSS 檔案能使用 `@apply` 而不實際輸出 Tailwind 樣式（避免重複）。

### @layer

```css
@layer components { .card { background: white; border-radius: 0.5rem; } }
@layer utilities { .tab-4 { tab-size: 4; } /* 舊式，改用 @utility */ }
```

### @config

v4 預設不讀 tailwind.config.js。

```css
@import "tailwindcss";
@config "../../tailwind.config.js";
```

### @plugin

```css
@plugin "@tailwindcss/typography";
@plugin "@tailwindcss/typography" { className: wysiwyg; }
@plugin "./my-plugin.js";
```

---

## 2. CSS 函式

### --value()

在 `@utility` 中使用，解析 utility 的值部分（`*` 號後面）。

```css
@utility tab-* {
  tab-size: --value(--tab-size-*);  /* @theme 匹配 */
  tab-size: --value(integer);        /* 裸數字 */
  tab-size: --value([integer]);      /* 任意值 */
  tab-size: --value([*]);            /* 任意 CSS 值 */
}
```

型別關鍵字：`integer`、`number`、`percentage`、`color`、`length`、`url`、`[type]`（任意）

多個 `--value()` 宣告按順序嘗試匹配，第一個成功的生效。

### --modifier()

解析 utility 的修飾符（`/` 後面的值）：

```css
@utility text-shadow-* {
  text-shadow: --value(--text-shadow-*) / --modifier([color]);
}
/* 用法：text-shadow-lg/red, text-shadow-md/oklch(0.5 0.1 200) */
```

### --alpha()

調整顏色透明度：

```css
.el { background-color: --alpha(var(--color-blue-500) / 75%); }
```

### --spacing()

基於間距比例計算值（預設 1 unit = 0.25rem）：

```css
.el { padding: --spacing(--value(number)); }
/* 用法：--spacing(4) = 1rem */
```

### theme()（已棄用）

```css
.old { color: theme(colors.red.500); }
.new { color: var(--color-red-500); }  /* v4 推薦 */
```

---

## 3. @theme 命名空間完整清單

| 命名空間 | 生成的 utilities | 範例 |
|---------|-----------------|------|
| `--color-*` | `bg-*`, `text-*`, `border-*`, `ring-*`, `shadow-*`, `fill-*`, `stroke-*`, `accent-*`, `caret-*`, `decoration-*`, `outline-*`, `divide-*`, `from-*`, `via-*`, `to-*` | `bg-red-500` |
| `--font-*` | `font-*`（字型） | `font-sans` |
| `--text-*` | `text-*`（大小） | `text-xl` |
| `--font-weight-*` | `font-*`（粗細） | `font-bold` |
| `--tracking-*` | `tracking-*` | `tracking-tight` |
| `--leading-*` | `leading-*` | `leading-relaxed` |
| `--breakpoint-*` | responsive variants（sm: md: 等） | `md:flex` |
| `--container-*` | container query variants（@sm: 等） | `@lg:grid-cols-3` |
| `--spacing` | 所有間距 utilities | `p-4`, `m-2`, `gap-6` |
| `--radius-*` | `rounded-*` | `rounded-lg` |
| `--shadow-*` | `shadow-*` | `shadow-md` |
| `--inset-shadow-*` | `inset-shadow-*` | `inset-shadow-sm` |
| `--drop-shadow-*` | `drop-shadow-*` | `drop-shadow-lg` |
| `--text-shadow-*` | `text-shadow-*` | `text-shadow-md` |
| `--blur-*` | `blur-*` | `blur-md` |
| `--perspective-*` | `perspective-*` | `perspective-distant` |
| `--aspect-*` | `aspect-*` | `aspect-video` |
| `--ease-*` | `ease-*` | `ease-in-out` |
| `--animate-*` | `animate-*` | `animate-spin` |
| `--z-index-*` | `z-*` | `z-10` |
| `--opacity-*` | `opacity-*` | `opacity-75` |

---

## 4. 預設主題值

### 斷點

| 前綴 | 最小寬度 | 前綴 | 最小寬度 |
|------|---------|------|---------|
| `sm:` | 40rem (640px) | `xl:` | 80rem (1280px) |
| `md:` | 48rem (768px) | `2xl:` | 96rem (1536px) |
| `lg:` | 64rem (1024px) | | |

### Container Query 尺寸

`@3xs:`(16rem), `@2xs:`(18rem), `@xs:`(20rem), `@sm:`(24rem), `@md:`(28rem), `@lg:`(32rem), `@xl:`(36rem), `@2xl:`(42rem), `@3xl:`(48rem), `@4xl:`(56rem), `@5xl:`(64rem), `@6xl:`(72rem), `@7xl:`(80rem)

### 字體大小（--text-*）

| Class | font-size | line-height |
|-------|-----------|-------------|
| `text-xs` | 0.75rem (12px) | 1rem |
| `text-sm` | 0.875rem (14px) | 1.25rem |
| `text-base` | 1rem (16px) | 1.5rem |
| `text-lg` | 1.125rem (18px) | 1.75rem |
| `text-xl` | 1.25rem (20px) | 1.75rem |
| `text-2xl` | 1.5rem (24px) | 2rem |
| `text-3xl` | 1.875rem (30px) | 2.25rem |
| `text-4xl` | 2.25rem (36px) | 2.5rem |
| `text-5xl` | 3rem (48px) | 1 |
| `text-6xl` | 3.75rem (60px) | 1 |
| `text-7xl` | 4.5rem (72px) | 1 |
| `text-8xl` | 6rem (96px) | 1 |
| `text-9xl` | 8rem (128px) | 1 |

### 間距（--spacing: 0.25rem）

`1`=0.25rem, `2`=0.5rem, `3`=0.75rem, `4`=1rem, `5`=1.25rem, `6`=1.5rem, `8`=2rem, `10`=2.5rem, `12`=3rem, `16`=4rem, `20`=5rem, `24`=6rem, `32`=8rem, `40`=10rem, `48`=12rem, `64`=16rem, `80`=20rem, `96`=24rem

### 顏色（oklch 色彩空間）

調色板（各 11 階度 50-950）：`slate`、`gray`、`zinc`、`neutral`、`stone`、`red`、`orange`、`amber`、`yellow`、`lime`、`green`、`emerald`、`teal`、`cyan`、`sky`、`blue`、`indigo`、`violet`、`purple`、`fuchsia`、`pink`、`rose`

特殊：`black`, `white`, `transparent`, `current`

### 陰影（v4 整體縮小一級）

| v4 class | v3 等效 |
|----------|---------|
| `shadow-xs` | `shadow-sm` |
| `shadow-sm` | `shadow` |
| `shadow-md` | `shadow-md` |
| `shadow-lg` | `shadow-lg` |
| `shadow-xl` | `shadow-xl` |
| `shadow-2xl` | `shadow-2xl` |

### 圓角

`rounded-xs`(0.125rem) `rounded-sm`(0.25rem) `rounded`(0.375rem) `rounded-md`(0.5rem) `rounded-lg`(0.5rem) `rounded-xl`(0.75rem) `rounded-2xl`(1rem) `rounded-3xl`(1.5rem) `rounded-full`(9999px)

### 字型粗細

`font-thin`(100), `font-extralight`(200), `font-light`(300), `font-normal`(400), `font-medium`(500), `font-semibold`(600), `font-bold`(700), `font-extrabold`(800), `font-black`(900)

### 動畫（--animate-*）

| Class | 動畫效果 |
|-------|---------|
| `animate-spin` | 無限旋轉 |
| `animate-ping` | 脈衝（ping） |
| `animate-pulse` | 淡入淡出脈衝 |
| `animate-bounce` | 彈跳 |

---

## 5. Preflight 重置規則

Preflight 基於 `modern-normalize`，自動包含於 `@import "tailwindcss"` 中。

| 元素 | 重置行為 |
|------|---------|
| 所有元素 | `box-sizing: border-box` |
| `html` | 行高 1.5，`-webkit-text-size-adjust: 100%` |
| `body` | `margin: 0` |
| `h1-h6` | 字體大小重置為繼承（需手動設定） |
| `img, video, canvas, iframe` | `display: block` |
| `img, video` | `max-width: 100%; height: auto` |
| `button` | `cursor: pointer` |
| `ol, ul` | `list-style: none; margin: 0; padding: 0` |
| `table` | `border-collapse: collapse` |

**停用 Preflight：**

```css
@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
/* @import "tailwindcss/preflight.css" layer(base); <- 省略此行即停用 */
@import "tailwindcss/utilities.css" layer(utilities);
```
