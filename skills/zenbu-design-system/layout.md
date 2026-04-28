# Layout Structure

## Shell

```
+----------------------------------------------------+
| TopNav (h-14, bg-white, border-b)                  |
+----------+-----------------------------------------+
| Sidebar  | Main Content                            |
| w-[220px]| bg-[var(--color-surface)]               |
| bg-white | overflow-y-auto                         |
| border-r | p-6 (typical)                           |
+----------+-----------------------------------------+
```

- **TopNav**: `h-14`, white bg, bottom border `--color-border`, `z-50`. Left: logo + site name. Right: external link button.
- **Sidebar**: Fixed `w-[220px]`, white bg, right border, full height. Contains module switcher dropdown at top, nav items, and user avatar at bottom.
- **Main content area**: `bg-[var(--color-surface)]`, scrollable, minimum padding `p-6`.

---

## Sidebar Navigation

```html
<!-- Active item -->
<a class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
          bg-[var(--color-primary-50)] text-[var(--color-brand)]">
  <Icon class="w-5 h-5" />
  Label
</a>

<!-- Inactive item -->
<a class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
          text-[var(--color-text-secondary)]
          hover:bg-[var(--color-surface-overlay)]
          hover:text-[var(--color-text-primary)]
          transition-colors">
  <Icon class="w-5 h-5" />
  Label
</a>
```

- Module switcher at top: dropdown button with border, `h-10 rounded-lg`.
- Nav items support expandable sub-menus with `>` chevron.
- Bottom area: AI usage indicator + user avatar with name.

---

## Page Header

Every list page follows this pattern:

```html
<div class="flex items-center justify-between mb-6">
  <div>
    <h1 class="text-xl font-semibold text-[var(--color-text-primary)]">
      Page Title <span class="text-sm font-normal text-[var(--color-text-muted)]">count</span>
    </h1>
    <p class="text-sm text-[var(--color-text-muted)] mt-1">Description text</p>
  </div>
  <button class="btn-primary">+ Action</button>
</div>
```

---

## Page Layout Patterns

### List Page (Standard)

```
+--Page Header (title + count + description + primary CTA)--+
+--Filter Bar (search + dropdowns + date range)-------------+
+--Card (overflow-hidden)-----------------------------------+
|  Table Header Row                                         |
|  Table Data Rows with hover                               |
|  ...                                                      |
+-----------------------------------------------------------+
+--Batch Action Bar (fixed bottom, when items selected)-----+
```

### Detail / Edit Page

```
+--Header: flex justify-between mb-5-----------------------+
|  Left: "Title" + "ID: uuid"   |  Right: "返回列表" link  |
+--Grid: grid-cols-[300px_1fr_340px] gap-5------------------+
|  Left Aside  |  Main Content Area   |  Right Aside       |
|  (300px)     |  (1fr)               |  (340px)           |
|  AI tools,   |  Language tabs,      |  Settings,         |
|  helper      |  form fields,        |  metadata,         |
|  panels      |  rich text editor    |  categories, SEO   |
+--Fixed Bottom Bar: justify-end gap-2---------------------+
|                            [Secondary] [Primary]          |
+-----------------------------------------------------------+
```

**Grid breakpoints:**
- `xl` (1280px+): 3-column `grid-cols-[300px_1fr_340px]`
- Below `xl`: single column `grid-cols-1`

**Detail page header:**
```html
<div class="flex items-start justify-between mb-5">
  <div>
    <h1 class="text-xl font-semibold">編輯文章</h1>
    <p class="text-sm text-[var(--color-text-muted)] mt-1">
      ID: 3590f578-ae0c-46d2-b7f2-3ed5bf6063ba
    </p>
  </div>
  <div class="flex-shrink-0 ml-4">
    <a class="btn-ghost">← 返回列表</a>
  </div>
</div>
```

**Each aside section** is a `.card` with internal heading and content.

### Settings Page

Uses tabs for major sections, list items inside for individual settings:

```html
<div class="card overflow-hidden">
  <!-- Settings item row -->
  <div class="flex items-center gap-4 p-4 border-b border-[var(--color-border)]
              hover:bg-[var(--color-surface-overlay)] transition-colors">
    <Icon class="w-5 h-5 text-[var(--color-brand)]" />
    <div class="flex-1">
      <p class="text-sm font-medium">Setting Name</p>
      <p class="text-xs text-[var(--color-text-muted)]">Description</p>
    </div>
    <Toggle />
    <ChevronDown />
  </div>
</div>
```

---

## Responsive Behavior

| Breakpoint | Layout Change                                        |
|------------|------------------------------------------------------|
| < 1024px   | Sidebar collapses to hamburger overlay               |
| < 1280px   | Detail grid → single column stack                    |
| >= 1024px  | Sidebar visible, bottom bars use `left-[220px]`      |
| >= 1280px  | Detail grid → 3-column `[300px_1fr_340px]`           |
