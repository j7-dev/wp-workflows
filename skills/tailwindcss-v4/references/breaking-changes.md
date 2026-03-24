# TailwindCSS v3 -> v4 破壞性變更完整對照表

> 來源：https://tailwindcss.com/docs/upgrade-guide | 適用：v4.0+

## 目錄
1. 安裝與設定變更
2. CSS 指令變更
3. 已移除的 Utilities
4. 重命名的 Utilities
5. 預設值變更
6. Selector 與行為變更
7. Variant 堆疊順序
8. 自訂 CSS 撰寫方式
9. 配置檔案變更
10. Arbitrary Value 語法
11. Transform 屬性變更
12. Hover 在行動裝置的行為

---

## 安裝與設定變更

### Vite 整合（推薦）

v3: `npm install tailwindcss postcss autoprefixer` + `npx tailwindcss init`
v4: `npm install tailwindcss @tailwindcss/vite`

```typescript
// v4: vite.config.ts
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
})
```

### PostCSS 整合

```javascript
// v3: postcss.config.mjs
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}

// v4: postcss.config.mjs
export default {
  plugins: { "@tailwindcss/postcss": {} },
}
```

v4 自動處理 autoprefixer 和 postcss-import。

CLI: v3 `npx tailwindcss` -> v4 `npx @tailwindcss/cli`

---

## CSS 指令變更

```css
/* v3 */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* v4 */
@import "tailwindcss";
```

Prefix 設定：v4 使用 `@import "tailwindcss" prefix(tw);`
- v3 class: tw-flex
- v4 class: tw:flex

Important 修飾符：v3 前綴 `!flex` -> v4 後綴 `flex!`

---

## 已移除的 Utilities

| v3 Class | v4 替代方案 |
|---------|-----------|
| bg-opacity-* | bg-black/50 |
| text-opacity-* | text-black/50 |
| border-opacity-* | border-black/50 |
| divide-opacity-* | divide-black/50 |
| ring-opacity-* | ring-black/50 |
| placeholder-opacity-* | placeholder-black/50 |
| flex-shrink-* | shrink-* |
| flex-grow-* | grow-* |
| overflow-ellipsis | text-ellipsis |
| decoration-slice | box-decoration-slice |
| decoration-clone | box-decoration-clone |

---

## 重命名的 Utilities

### Shadow / Blur / Rounded（整體縮小一級）

| v3 | v4 |
|----|-----|
| shadow-sm | shadow-xs |
| shadow | shadow-sm |
| shadow-md | shadow-md（不變）|
| drop-shadow-sm | drop-shadow-xs |
| drop-shadow | drop-shadow-sm |
| blur-sm | blur-xs |
| blur | blur-sm |
| backdrop-blur-sm | backdrop-blur-xs |
| backdrop-blur | backdrop-blur-sm |
| rounded-sm | rounded-xs |
| rounded | rounded-sm |

### Outline 相關

- v3: `focus:outline-none`（隱藏 focus ring）
- v4: `focus:outline-hidden`（保留 forced-colors 可視性）

注意：v4 的 `outline-none` 真的設定 `outline-style: none`。

```html
<!-- v3 -->
<input class="outline outline-2" />

<!-- v4: outline-2 自動設定 outline-style: solid -->
<input class="outline-2" />
```

---

## 預設值變更

### Border 顏色（gray-200 -> currentColor）

```html
<!-- v4: 需明確指定顏色 -->
<div class="border border-gray-200">灰色邊框</div>
```

恢復 v3 行為：
```css
@layer base {
  *, ::after, ::before, ::backdrop, ::file-selector-button {
    border-color: var(--color-gray-200, currentColor);
  }
}
```

### Ring 寬度與顏色（3px/blue-500 -> 1px/currentColor）

```html
<!-- v3 -->
<button class="focus:ring">...</button>

<!-- v4 -->
<button class="focus:ring-3 focus:ring-blue-500">...</button>
```

恢復 v3 行為：
```css
@theme {
  --default-ring-width: 3px;
  --default-ring-color: var(--color-blue-500);
}
```

### Placeholder 顏色

- v3: gray-400（固定）
- v4: 當前文字顏色的 50% 不透明度

### Button cursor

- v3: cursor: pointer
- v4: cursor: default

恢復 v3：
```css
@layer base {
  button:not(:disabled) { cursor: pointer; }
}
```

### Hidden attribute 優先級

v4: hidden attribute 優先，display 類別無法覆蓋。

---

## Selector 與行為變更

### space-between selector 改變

- v3: `> :not([hidden]) ~ :not([hidden])`
- v4: `> :not(:last-child)`（改用 margin-bottom）

遷移到 flex + gap（推薦）：
```html
<div class="flex flex-col gap-4">
  <label>Name</label>
  <input type="text" />
</div>
```

### Gradient variant preservation

v3 中 variant 重置 gradient stops，v4 保留：
```html
<div class="bg-linear-to-r from-red-500 via-orange-400 to-yellow-400
            dark:via-none dark:from-blue-500 dark:to-teal-400"></div>
```

### Outline-color 包含在 transition

先設顏色再加 hover outline：
```html
<button class="outline-cyan-500 transition hover:outline-2">...</button>
```

---

## Variant 堆疊順序

v3: 右到左 | v4: 左到右

```html
<!-- v3 -->
<ul class="first:*:pt-0">
<!-- v4 -->
<ul class="*:first:pt-0">
```

---

## 自訂 CSS 撰寫方式

```css
/* v3 */
@layer utilities {
  .tab-4 { tab-size: 4; }
}

/* v4: @utility（自動支援所有 variant） */
@utility tab-4 {
  tab-size: 4;
}
```

Container 配置：
```css
@utility container {
  margin-inline: auto;
  padding-inline: 2rem;
}
```

---

## 配置檔案變更

v4 不自動偵測 tailwind.config.js，需明確載入：
```css
@config "../../tailwind.config.js";
```

v4 不支援的 JS Config 選項：corePlugins、safelist（改用 @source inline()）、separator

resolveConfig 已移除，改用 CSS 變數：
```javascript
const styles = getComputedStyle(document.documentElement)
const color = styles.getPropertyValue('--color-blue-500')
```

---

## Arbitrary Value 語法

```html
<!-- v3: CSS 變數用方括號 -->
<div class="bg-[--brand-color]"></div>

<!-- v4: CSS 變數用括號（推薦） -->
<div class="bg-(--brand-color)"></div>

<!-- v4: Grid 逗號改底線 -->
<div class="grid-cols-[max-content_auto]"></div>
```

---

## Transform 屬性變更

v4 的 rotate-*、scale-*、translate-* 使用個別 CSS 屬性。

- 重置: v3 `transform-none` -> v4 `scale-none`（個別重置）
- Transition: v3 `transition-[opacity,transform]` -> v4 `transition-[opacity,scale]`

---

## Hover 在行動裝置的行為

v4 中 `hover:` 包裝在 `@media (hover: hover)` 內。

若需要行動裝置也觸發（v3 行為）：
```css
@custom-variant hover (&:hover);
```

---

## 自動遷移工具

```bash
npx @tailwindcss/upgrade
```

## 瀏覽器支援要求（v4）

Safari 16.4+、Chrome 111+、Firefox 128+
