# Interaction Patterns

## Batch Select Bar (STANDARD: /zb-cart/products)

**IMPORTANT:** The `/zb-cart/products` page is the canonical reference for batch selection UI. Other pages with batch select will be updated to match this pattern.

```html
<!-- Outer wrapper: fixed bottom, respects sidebar -->
<div class="fixed bottom-0 left-0 lg:left-[220px] right-0 z-40 pointer-events-none">
  <!-- Inner container: centered, clickable -->
  <div class="pointer-events-auto mx-auto max-w-5xl px-4 pb-4">
    <!-- Bar -->
    <div class="rounded-xl border border-[var(--color-border)] bg-white shadow-xl
                px-4 py-3 flex items-center gap-3">

      <!-- Count -->
      <span class="text-sm font-medium text-[var(--color-text-primary)]">
        已選取 <span class="text-[var(--color-brand)] font-semibold">2</span> 筆
      </span>

      <!-- Clear -->
      <button class="btn-ghost text-xs py-1 flex items-center gap-1
                      text-[var(--color-text-muted)]">
        <X size={12} /> 清除選取
      </button>

      <!-- Divider -->
      <span class="text-[var(--color-border)]">|</span>

      <!-- Actions (right-aligned) -->
      <div class="flex items-center gap-2 ml-auto">
        <button class="text-xs py-1.5 px-3 rounded-lg
                        bg-[var(--color-brand)] text-white
                        hover:opacity-90 transition-opacity">
          變更狀態 <ChevronDown size={12} />
        </button>
        <button class="text-xs py-1.5 px-3 rounded-lg
                        bg-slate-700 text-white
                        hover:bg-slate-800 transition-colors">
          <PenLine size={12} /> 批次編輯
        </button>
        <button class="text-xs py-1.5 px-3 rounded-lg
                        bg-[var(--color-error)] text-white
                        hover:opacity-90 transition-opacity">
          <Trash2 size={12} /> 刪除選取
        </button>
      </div>
    </div>
  </div>
</div>
```

**Key rules:**
- Outer wrapper uses `pointer-events-none`; inner bar uses `pointer-events-auto`.
- `lg:left-[220px]` to respect sidebar width on desktop.
- Bar is centered with `max-w-5xl` and has bottom padding `pb-4` to float above page bottom.
- Rounded-xl with shadow-xl for emphasis.
- Buttons use `text-xs` (12px), compact padding `py-1.5 px-3`.

---

## Fixed Bottom Action Bar (Detail Pages)

```html
<div class="fixed bottom-0 right-0 left-[220px]
            bg-white border-t border-[var(--color-border)]
            px-6 py-3 flex items-center justify-end gap-2 z-40">
  <button class="btn-secondary">儲存草稿</button>
  <button class="btn-primary">發布</button>
</div>
```

- Always anchored to `left-[220px]` (sidebar width).
- `justify-end` — buttons always right-aligned.
- `gap-2` (8px) between buttons.
- `px-6 py-3` (24px / 12px) padding.
- White bg with top border for visual separation.

---

## Filter Bar

Positioned between page header and table card:

```html
<div class="flex items-center gap-2 mb-4 flex-wrap">
  <div class="relative flex-1 max-w-xs">
    <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
    <input class="w-full pl-9 pr-3 h-9 rounded-lg border text-sm" placeholder="搜尋..." />
  </div>
  <select class="h-9 rounded-lg border text-sm px-3">...</select>
  <select class="h-9 rounded-lg border text-sm px-3">...</select>
  <!-- Date range inputs when applicable -->
</div>
```
