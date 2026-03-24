---
name: tailwindcss-v4
description: >
  TailwindCSS v4 的完整技術參考，採用 CSS-first 設定（非 v3 的 JS config）。
  當任務涉及 Tailwind、tailwindcss、CSS utilities、@theme 指令、@custom-variant、
  @utility、@source、@plugin、design tokens、utility classes、responsive design、
  dark mode、container queries、3D transforms、@starting-style、field-sizing、
  prose 排版、@tailwindcss/vite、@tailwindcss/typography 時，必須使用此 skill。
  即使用戶沒有明確說出「Tailwind」，只要任務涉及 bg-*、text-*、flex、grid、
  hover:、dark:、md:、rounded、shadow、transition、animate 等 class 命名模式，
  也應該使用此 skill 而不是去搜尋 web。
  此 skill 對應 v4.x，與 v3 有重大差異（無 tailwind.config.js，改用 @theme）。
---

# TailwindCSS v4

> **適用版本**：v4.x（含 v4.0.7+）| **文件來源**：https://tailwindcss.com/docs | **最後更新**：2026-03

v4 是 CSS-first 的重大改版。核心變化：用 `@import "tailwindcss"` 取代三行 `@tailwind` 指令，用 `@theme` CSS 區塊取代 `tailwind.config.js`，效能提升 3-5x（增量建置快達 182x）。

---

## 核心 API 速查

### Vite 整合（最常用設定）

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
})
```

```css
/* src/index.css */
@import "tailwindcss";
```

安裝：`npm install tailwindcss @tailwindcss/vite`

### @theme — 定義 Design Tokens

```css
@import "tailwindcss";

@theme {
  /* 新增自訂 token，自動生成 utility class */
  --color-brand: oklch(0.72 0.11 178);
  --font-display: "Satoshi", sans-serif;
  --breakpoint-3xl: 120rem;

  /* 覆蓋整個命名空間 */
  --color-*: initial;
  --color-white: #fff;
  --color-primary: oklch(0.72 0.11 221);

  /* 覆蓋全部預設 */
  --*: initial;
}
```

生成結果：`bg-brand`、`text-brand`、`font-display`、`3xl:*` 等 class。

### @theme inline — 引用其他 CSS 變數

```css
@theme inline {
  --color-canvas: var(--acme-canvas-color);  /* 在使用處解析，不在定義處解析 */
  --font-sans: var(--font-inter);
}
```

### @custom-variant — 自訂 Variant

```css
/* 短語法 */
@custom-variant theme-midnight (&:where([data-theme="midnight"] *));

/* 完整語法（多規則） */
@custom-variant dark (&:where(.dark, .dark *));

/* 多層巢狀 */
@custom-variant any-hover {
  @media (any-hover: hover) {
    &:hover {
      @slot;
    }
  }
}
```

### @utility — 自訂 Utility

```css
/* 靜態 utility */
@utility content-auto {
  content-visibility: auto;
}

/* 函式式 utility（配合主題） */
@utility tab-* {
  tab-size: --value(--tab-size-*);   /* 匹配主題值 */
  tab-size: --value(integer);         /* 匹配裸數字 */
  tab-size: --value([integer]);       /* 匹配任意值 */
}
```

### @source — 內容偵測控制

```css
@import "tailwindcss";

/* 加入額外來源（預設不掃 node_modules） */
@source "../node_modules/@my-company/ui-lib";

/* 強制生成特定 class（safelist） */
@source inline("underline");
@source inline("{hover:,focus:,}bg-red-{50,{100..900..100},950}");

/* 排除路徑 */
@source not "../src/legacy";

/* 停用自動偵測 */
@import "tailwindcss" source(none);
```

### @plugin — 載入插件

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

/* 帶參數的插件 */
@plugin "@tailwindcss/typography" {
  className: wysiwyg;
}
```

### @apply / @reference

```css
/* 在全域 CSS 中使用 */
.select2-dropdown {
  @apply rounded-b-lg shadow-md border border-gray-300;
}

/* 在 Vue/Svelte <style> 或 CSS Modules 中需要 @reference */
```

```vue
<style>
  @reference "../../app.css";
  h1 { @apply text-2xl font-bold text-red-500; }
</style>
```

---

## 常用模式

### Dark Mode（Class-based，推薦）

```css
/* 在 CSS 中設定 */
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

```html
<html class="dark">
  <div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
    內容
  </div>
</html>
```

```javascript
// 切換邏輯
document.documentElement.classList.toggle(
  'dark',
  localStorage.theme === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
)
```

### Container Queries（v4 內建，無需插件）

```html
<div class="@container">
  <div class="grid grid-cols-1 @sm:grid-cols-3 @lg:grid-cols-4">
    <!-- 根據容器寬度響應 -->
  </div>
</div>

<!-- 命名容器（巢狀時區分） -->
<div class="@container/main">
  <div class="@sm/main:flex-row flex-col">...</div>
</div>
```

### 3D Transforms（v4 新增）

```html
<div class="perspective-distant">
  <article class="rotate-x-51 rotate-z-43 transform-3d">
    3D 旋轉卡片
  </article>
</div>
```

新增 utilities：`rotate-x-*`、`rotate-y-*`、`scale-z-*`、`translate-z-*`、`perspective-*`、`transform-3d`

### @starting-style 進場動畫（v4 新增）

```html
<div
  popover
  id="my-popover"
  class="transition-discrete starting:open:opacity-0 opacity-100"
>
  <!-- 從透明到不透明的進場動畫 -->
</div>
```

### Typography Plugin

```css
/* 安裝：npm install -D @tailwindcss/typography */
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

```html
<article class="prose lg:prose-xl dark:prose-invert max-w-none">
  <!-- Markdown 渲染內容 -->
</article>

<!-- 排除部分內容不套用 prose 樣式 -->
<article class="prose">
  <h1>標題</h1>
  <div class="not-prose">不套用排版樣式</div>
</article>
```

---

## 注意事項與陷阱

| 嚴重程度 | 問題 | 解法 |
|---------|------|------|
| 🔴 重大 | v4 無 `tailwind.config.js`（預設不讀取） | 改用 `@theme` 或加 `@config "tailwind.config.js"` |
| 🔴 重大 | `ring` 預設寬度從 3px 改為 1px | 使用 `ring-3` 明確指定，或設 `--default-ring-width: 3px` |
| 🔴 重大 | `border` 預設顏色從 gray-200 改為 currentColor | 明確加 `border-gray-200` |
| 🔴 重大 | `shadow-sm` 變 `shadow-xs`，`shadow` 變 `shadow-sm`（整體縮小一級） | 全面更新 shadow class 名稱 |
| 🔴 重大 | `outline-none` 現在真的設 `outline-style: none` | 使用 `outline-hidden` 代替 |
| 🟡 中等 | `@layer utilities { .tab-4 {...} }` 不適用於 variant | 改用 `@utility tab-4 { ... }` |
| 🟡 中等 | CSS 變數在 arbitrary value 需用括號 `bg-(--brand)` | 棄用 `bg-[--brand]` 語法（舊語法仍支援） |
| 🟡 中等 | Variant 堆疊順序改為左到右 | `*:first:pt-0` 而非 `first:*:pt-0` |
| 🟡 中等 | `hover:` 在 v4 預設包含 `@media (hover: hover)` | 行動裝置需自訂 `@custom-variant hover (&:hover)` |
| 🟡 中等 | `space-y-*` 選擇器改為 `:not(:last-child)` | 考慮改用 `gap-*` |
| 🟡 中等 | 不支援 Sass/Less/Stylus | v4 本身即為 preprocessor |
| 🟢 輕微 | `flex-shrink-*` -> `shrink-*`，`flex-grow-*` -> `grow-*` | 已棄用 class 仍可用 |

---

## References 導引

| 需求 | 參閱檔案 |
|------|---------|
| 完整 v3 -> v4 破壞性變更對照表 | `references/breaking-changes.md` |
| @theme 命名空間完整清單 & 所有指令 API | `references/directives-and-theme.md` |
| 所有 Variant 完整清單（pseudo-class、media、group、peer 等） | `references/variants.md` |
| 常用 utility class 範例（顏色、間距、排版、動畫等） | `references/utilities-examples.md` |
