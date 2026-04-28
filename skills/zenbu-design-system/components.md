# Component Specifications

## Buttons

### Variants

| Variant   | Class          | Background                 | Text Color    | Border                      | Height |
|-----------|----------------|----------------------------|---------------|-----------------------------|--------|
| Primary   | `btn-primary`  | `var(--color-brand)`       | white         | none                        | 36px   |
| Secondary | `btn-secondary`| white                      | gray-700      | `1px solid var(--color-border)` | 36px |
| Ghost     | `btn-ghost`    | transparent                | gray-500      | none                        | 28-36px|
| Danger    | `btn-danger`   | `var(--color-error)`       | white         | none                        | 36px   |
| Dark      | —              | `slate-700`                | white         | none                        | 28px   |

### Common Properties

```css
border-radius: 8px;       /* rounded-lg */
font-size: 14px;          /* text-sm */
font-weight: 500;         /* font-medium */
padding: 8px 16px;        /* py-2 px-4 */
transition: colors/opacity 150ms;
```

### Small Button (batch bar, inline actions)

```css
font-size: 12px;          /* text-xs */
padding: 6px 12px;        /* py-1.5 px-3 */
height: 28px;
```

### Icon-Only Button

```css
padding: 6px;             /* p-1.5 */
border-radius: 6px;       /* rounded-md */
height: 27px;
```

---

## Cards

The `.card` class is the standard container component.

```css
.card {
  background-color: white;
  border: 1px solid var(--color-border);
  border-radius: 12px;            /* rounded-xl */
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);  /* shadow-sm */
}
```

**Variants:**

| Variant       | Classes                    | Padding | Notes                          |
|---------------|----------------------------|---------|--------------------------------|
| Default       | `.card p-4`                | 16px    | Most common card               |
| Compact       | `.card p-3`                | 12px    | Tight cards, sidebar panels    |
| Flush         | `.card overflow-hidden`    | 0px     | Tables/lists inside card       |
| Spaced        | `.card p-4 space-y-3`      | 16px    | Vertical stack with 12px gaps  |

---

## Tables

Tables sit inside a `.card overflow-hidden` wrapper.

**Table Header (`<th>`):**
```css
font-size: 11px;
font-weight: 600;
color: var(--color-text-muted);  /* gray-500 */
padding: 12px 16px;
text-align: left;
text-transform: uppercase;      /* implied by convention */
background: transparent;
```

**Table Cell (`<td>`):**
```css
font-size: 14px;                /* default; 12px for secondary columns */
padding: 12px 16px;
vertical-align: middle;
color: inherit;
border-bottom: 1px solid var(--color-border);  /* row divider */
```

**Table Row Hover:**
```css
tr:hover { background-color: var(--color-surface-overlay); }
```

**Checkbox Column:** First column `padding: 12px 8px` (narrower), checkbox centered vertically.

**Numeric Columns:** Right-aligned (`text-align: right`).

---

## Tabs

Used on detail pages and settings pages.

```html
<!-- Tab container -->
<div class="flex border-b border-[var(--color-border)]">

  <!-- Active tab -->
  <button class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px
                  border-[var(--color-brand)] text-[var(--color-brand)]
                  flex items-center gap-2 transition-colors">
    <Icon /> Label
  </button>

  <!-- Inactive tab -->
  <button class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px
                  border-transparent text-[var(--color-text-secondary)]
                  hover:text-[var(--color-text-primary)]
                  flex items-center gap-2 transition-colors">
    <Icon /> Label
  </button>
</div>
```

- Height: 42px (including border).
- Active: brand color text + 2px brand bottom border.
- Inactive: secondary text, transparent bottom border, hover to primary text.
- Icon + text with `gap-2`.
- Tabs support badge indicators (e.g., "(未翻譯)").

---

## Form Inputs

```css
input, textarea, select {
  border: 1px solid var(--color-border);
  border-radius: 8px;           /* rounded-lg */
  padding: 8px 12px;
  font-size: 14px;
  height: 40px;                  /* for single-line inputs */
  background: white;
  transition: border-color 150ms, box-shadow 150ms;
}

input:focus {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px var(--color-brand-ring);
  outline: none;
}
```

---

## Status Badges

Pill-shaped badges for item states:

```html
<span class="inline-flex items-center px-2 py-0.5 rounded-full
             text-xs font-medium
             bg-green-50 text-green-700">
  Active
</span>
```

Standard badge color pairings follow the Semantic Status Colors table in [tokens.md](tokens.md).

---

## Toggle / Switch

- On state: brand blue (`--color-brand`), rounded-full.
- Off state: gray-300, rounded-full.
- Standard width/height consistent with Tailwind `<Switch>` defaults.

---

## Dropdown / Select

Module-switcher style dropdown:

```html
<button class="w-full inline-flex items-center justify-between gap-2
               px-3 h-10 rounded-lg text-sm font-medium
               text-[var(--color-text-primary)]
               hover:bg-[var(--color-surface-overlay)]
               transition-colors
               border border-[var(--color-border)] bg-white">
  <span>Label</span>
  <ChevronDown />
</button>
```

---

## Dashboard Stat Cards

Used on dashboard overview pages:

```html
<div class="card p-4 flex items-center gap-3">
  <div class="p-2 rounded-lg bg-blue-50">
    <Icon class="w-5 h-5 text-blue-600" />
  </div>
  <div>
    <p class="text-sm text-[var(--color-text-muted)]">Label</p>
    <p class="text-2xl font-bold text-[var(--color-text-primary)]">42</p>
  </div>
  <ArrowRight class="ml-auto text-[var(--color-text-muted)]" />
</div>
```

Icon background tint matches icon color family (blue-50/blue-600, green-50/green-600, etc.).

---

## Iconography

- **Library:** Lucide React icons (lucide-react).
- **Default size:** `w-5 h-5` (20px) for nav and content icons. `w-4 h-4` (16px) for inline/button icons.
- **Stroke width:** 2 (default).
- **Color:** Inherits from parent (`currentColor`).
