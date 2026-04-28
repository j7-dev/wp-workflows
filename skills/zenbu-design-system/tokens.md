# Design Tokens

## Color Tokens (CSS Custom Properties)

All colors must be referenced via `var(--color-*)`. Raw hex values are prohibited in component code.

```css
/* Brand */
--color-brand:          #2563eb;   /* blue-600 — primary actions, links, active states */
--color-brand-ring:     #93c5fd;   /* blue-300 — focus ring */
--color-primary-50:     #eff6ff;   /* blue-50  — active sidebar bg, light tint */
--color-primary-100:    #dbeafe;   /* blue-100 — selected state bg, hover tint */

/* Text */
--color-text-primary:   #111827;   /* gray-900 — headings, primary body text */
--color-text-secondary: #374151;   /* gray-700 — secondary text, inactive nav items */
--color-text-muted:     #6b7280;   /* gray-500 — placeholders, helper text, table headers */

/* Surface */
--color-surface:         #f9fafb;  /* gray-50  — page background */
--color-surface-overlay: #f3f4f6;  /* gray-100 — hover states, dropdown bg */

/* Border */
--color-border:          #e5e7eb;  /* gray-200 — all borders, dividers, card outlines */

/* Semantic */
--color-error:           #ef4444;  /* red-500  — destructive actions, error states */
--color-success:         #22c55e;  /* green-500 — success badges, active toggles */
```

### Semantic Status Colors (badges, tags, status indicators)

| Status      | Text Color          | Background           | Tailwind Pair        |
|-------------|---------------------|----------------------|----------------------|
| Success     | `rgb(21, 128, 61)`  | `rgb(240, 253, 244)` | green-700 / green-50 |
| Warning     | `rgb(180, 83, 9)`   | `rgb(255, 251, 235)` | amber-700 / amber-50 |
| Error       | `rgb(220, 38, 38)`  | `rgb(254, 242, 242)` | red-600 / red-50     |
| Info        | `rgb(37, 99, 235)`  | `rgb(239, 246, 255)` | blue-600 / blue-50   |
| Purple      | `rgb(147, 51, 234)` | `rgb(250, 245, 255)` | purple-600 / purple-50 |
| Orange      | `rgb(234, 88, 12)`  | `rgb(255, 247, 237)` | orange-600 / orange-50 |
| Neutral     | `rgb(75, 85, 99)`   | `rgb(243, 244, 246)` | gray-600 / gray-100  |

---

## Typography

**Font Stack:**
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", sans-serif;
```

**Scale:**

| Token       | Size  | Weight | Line Height | Usage                              |
|-------------|-------|--------|-------------|------------------------------------|
| page-title  | 20px  | 600    | 28px        | Page `<h1>`, main headings         |
| card-title  | 14px  | 600    | 20px        | Card `<h3>`, section headings      |
| body        | 14px  | 400    | 20px        | Default paragraph/body text        |
| body-medium | 14px  | 500    | 20px        | Nav items, buttons, links          |
| label       | 12px  | 500    | 16px        | Form labels, small buttons         |
| caption     | 11px  | 600    | 16px        | Table headers, overline text       |
| small       | 12px  | 400    | 16px        | Badges, secondary info, timestamps |
| metric      | 24px  | 700    | 32px        | Dashboard stat numbers             |

---

## Spacing

Standard gap/padding values. Stick to these values only.

| Token | Value | Typical Use                          |
|-------|-------|--------------------------------------|
| xs    | 4px   | Tight inline gaps, icon-text pairs   |
| sm    | 6px   | Small inner spacing                  |
| md    | 8px   | Button/input inner padding, gap      |
| lg    | 10px  | Sidebar item padding                 |
| xl    | 12px  | Card inner padding, nav gaps         |
| 2xl   | 16px  | Section spacing, form field gaps     |
| 3xl   | 20px  | Grid gaps, page section margins      |
| 4xl   | 24px  | Bottom bar horizontal padding (px-6) |

---

## Border Radius

| Token     | Value    | Usage                                  |
|-----------|----------|----------------------------------------|
| sm        | 4px      | Small elements, progress bars, tags    |
| md        | 6px      | Icon-only buttons                      |
| lg        | 8px      | Buttons, inputs, sidebar nav items     |
| xl        | 12px     | Cards, containers, major panels        |
| full      | 9999px   | Badges, pills, avatars, toggles        |

**Rule:** Cards always use `rounded-xl` (12px). Buttons and inputs always use `rounded-lg` (8px). Never mix.

---

## Shadows

| Token   | Value                                                                 | Usage                |
|---------|-----------------------------------------------------------------------|----------------------|
| sm      | `0 1px 2px rgba(0,0,0,0.05)`                                         | Cards (default)      |
| md      | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)`            | Elevated cards       |
| xl      | `0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.05)` | Batch action bar     |
| ring    | `0 0 0 2px var(--color-brand-ring)`                                   | Focus state ring     |

---

## Z-Index Scale

| Token      | Value | Usage                               |
|------------|-------|-------------------------------------|
| dropdown   | 30    | Dropdowns, popovers                 |
| sticky     | 40    | Bottom action bars, batch bars      |
| modal      | 50    | Modal overlays                      |
| toast      | 60    | Toast notifications                 |
