# Accessibility, Anti-Patterns & QA Checklist

## Accessibility

- Target: WCAG 2.2 AA.
- All interactive elements must have visible focus indicators using `ring-2 ring-[var(--color-brand-ring)] ring-offset-2`.
- Buttons use `<button>` elements, not `<div>` or `<span>`.
- Tables use semantic `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`.
- Tabs use `role="tab"`, `aria-selected`, `role="tablist"`.
- Toggles use `role="switch"`, `aria-checked`.
- Color is never the sole indicator of state — always pair with text labels or icons.

---

## Anti-Patterns (Prohibited)

- Using raw hex values instead of CSS custom properties.
- Card with `rounded-lg` (must be `rounded-xl`).
- Button with `rounded-xl` (must be `rounded-lg`).
- Mixing shadow levels on the same visual plane.
- Bottom action bar without `left-[220px]` sidebar offset.
- Batch select bar that does not match the `/zb-cart/products` pattern.
- Table headers in normal weight (must be `font-semibold` / 600).
- Table headers in body font size (must be 11px `caption` size).
- Custom one-off spacing values not in the spacing scale.
- Using font weights other than 400, 500, 600, 700.
- Page title without subtitle/description text.

---

## QA Checklist

When implementing any new page or component, verify:

- [ ] All colors use `var(--color-*)` tokens, no raw hex in components
- [ ] Cards use `rounded-xl` (12px), buttons/inputs use `rounded-lg` (8px)
- [ ] Page header has title (20px/600) + description (14px/muted)
- [ ] Tables: 11px/600/muted headers, 14px body, 12px 16px cell padding
- [ ] Bottom action bar: fixed, `left-[220px]`, `justify-end`, `z-40`
- [ ] Batch select bar matches `/zb-cart/products` canonical pattern
- [ ] Active sidebar item uses `bg-primary-50` + `text-brand`
- [ ] Tab active state has `border-b-2 border-brand`
- [ ] Focus states visible on all interactive elements
- [ ] Responsive: 3-col grid collapses below `xl` breakpoint
- [ ] Icon sizes consistent: 20px in nav, 16px inline
- [ ] Font stack includes `"Noto Sans TC"` for CJK support
- [ ] Status badges use the semantic color pairing table
