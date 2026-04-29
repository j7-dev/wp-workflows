# General & Layout Components

## Table of Contents
- [Button](#button)
- [ConfigProvider](#configprovider)
- [Space](#space)
- [Layout](#layout)
- [Grid (Row/Col)](#grid-rowcol)
- [Spin](#spin)
- [Pagination](#pagination)

---

## Button

```tsx
import { Button } from 'antd';
import type { ButtonProps } from 'antd';
```

### Button Props

| Prop | Type | Default |
|------|------|---------|
| `autoInsertSpace` | `boolean` | `true` (v5.17.0+, space between CJK chars) |
| `block` | `boolean` | `false` |
| `color` | `'default' \| 'primary' \| 'danger' \| PresetColors` | - (v5.21.0+) |
| `danger` | `boolean` | `false` |
| `disabled` | `boolean` | `false` |
| `ghost` | `boolean` | `false` |
| `href` | `string` | - (renders as `<a>`) |
| `htmlType` | `'submit' \| 'reset' \| 'button'` | `'button'` |
| `icon` | `ReactNode` | - |
| `iconPlacement` | `'start' \| 'end'` | `'start'` (v5.17.0+) |
| `loading` | `boolean \| { delay: number, icon?: ReactNode }` | `false` |
| `shape` | `'default' \| 'circle' \| 'round'` | `'default'` |
| `size` | `'large' \| 'medium' \| 'small'` | `'medium'` |
| `target` | `string` | - (with href) |
| `type` | `'primary' \| 'dashed' \| 'link' \| 'text' \| 'default'` | `'default'` |
| `variant` | `'outlined' \| 'dashed' \| 'solid' \| 'filled' \| 'text' \| 'link'` | - (v5.21.0+) |
| `onClick` | `(event: MouseEvent) => void` | - |
| `classNames` | `Record<SemanticDOM, string>` | - |
| `styles` | `Record<SemanticDOM, CSSProperties>` | - |

### PresetColors

```tsx
type PresetColors = 'blue' | 'purple' | 'cyan' | 'green' | 'magenta' |
  'pink' | 'red' | 'orange' | 'yellow' | 'volcano' | 'geekblue' | 'lime' | 'gold';
```

### Button Types Summary

| type | Use Case |
|------|----------|
| `primary` | Main action, one per section |
| `default` | Secondary actions |
| `dashed` | Add/create operations |
| `text` | Minimal emphasis actions |
| `link` | Navigation/external links |

---

## ConfigProvider

```tsx
import { ConfigProvider, theme } from 'antd';
```

### ConfigProvider Props

| Prop | Type | Default |
|------|------|---------|
| `direction` | `'ltr' \| 'rtl'` | `'ltr'` |
| `locale` | `object` | - |
| `theme` | `ThemeConfig` | - |
| `prefixCls` | `string` | `'ant'` |
| `componentSize` | `'small' \| 'medium' \| 'large'` | - |
| `componentDisabled` | `boolean` | - |
| `getPopupContainer` | `(trigger?: HTMLElement) => HTMLElement \| ShadowRoot` | - |
| `getTargetContainer` | `() => HTMLElement \| Window \| ShadowRoot` | - |
| `renderEmpty` | `(componentName: string) => ReactNode` | - |
| `csp` | `{ nonce: string }` | - |
| `iconPrefixCls` | `string` | - |
| `variant` | `'outlined' \| 'filled' \| 'borderless'` | - |
| `popupMatchSelectWidth` | `boolean \| number` | - |
| `popupOverflow` | `'viewport' \| 'scroll'` | - |
| `virtual` | `boolean` | - |
| `warning` | `{ strict: boolean }` | - |

### ConfigProvider.config()

Configure static method behavior (Modal, Message, Notification):

```tsx
ConfigProvider.config({
  holderRender: (children) => (
    <ConfigProvider theme={myTheme}>{children}</ConfigProvider>
  ),
});
```

### ConfigProvider.useConfig()

```tsx
const { componentSize, componentDisabled } = ConfigProvider.useConfig();
```

### Locale Setup

```tsx
import zhTW from 'antd/locale/zh_TW';
// Available: en_US, zh_CN, zh_TW, ja_JP, ko_KR, ...

<ConfigProvider locale={zhTW}>
  <App />
</ConfigProvider>
```

### Component-Level Overrides

ConfigProvider supports per-component configuration for className, style, classNames, styles:

```tsx
<ConfigProvider
  button={{ className: 'custom-btn' }}
  table={{ className: 'custom-table' }}
  input={{ className: 'custom-input' }}
  // ... 70+ components supported
>
```

---

## Space

```tsx
import { Space } from 'antd';
```

### Space Props

| Prop | Type | Default |
|------|------|---------|
| `align` | `'start' \| 'end' \| 'center' \| 'baseline'` | - |
| `direction` | `'vertical' \| 'horizontal'` | `'horizontal'` |
| `size` | `'small' \| 'middle' \| 'large' \| number \| [number, number]` | `'small'` |
| `split` | `ReactNode` | - (deprecated, use `separator`) |
| `separator` | `ReactNode` | - |
| `wrap` | `boolean` | `false` |
| `classNames` | `Record<SemanticDOM, string>` | - |
| `styles` | `Record<SemanticDOM, CSSProperties>` | - |

### Space.Compact Props

Groups related components (Button, Input, Select, DatePicker):

| Prop | Type | Default |
|------|------|---------|
| `block` | `boolean` | `false` |
| `direction` | `'vertical' \| 'horizontal'` | `'horizontal'` |
| `size` | `'large' \| 'middle' \| 'small'` | `'middle'` |

```tsx
<Space.Compact>
  <Input placeholder="URL" />
  <Button type="primary">Submit</Button>
</Space.Compact>
```

---

## Layout

```tsx
import { Layout } from 'antd';
const { Header, Footer, Sider, Content } = Layout;
```

### Layout Props

| Prop | Type | Default |
|------|------|---------|
| `className` | `string` | - |
| `hasSider` | `boolean` | - (auto-detect; set for SSR) |
| `style` | `CSSProperties` | - |

### Layout.Sider Props

| Prop | Type | Default |
|------|------|---------|
| `breakpoint` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'xxl'` | - |
| `className` | `string` | - |
| `collapsed` | `boolean` | - |
| `collapsedWidth` | `number` | `80` |
| `collapsible` | `boolean` | `false` |
| `defaultCollapsed` | `boolean` | `false` |
| `reverseArrow` | `boolean` | `false` |
| `style` | `CSSProperties` | - |
| `theme` | `'light' \| 'dark'` | `'dark'` |
| `trigger` | `ReactNode` | - |
| `width` | `number \| string` | `200` |
| `zeroWidthTriggerStyle` | `CSSProperties` | - |
| `onBreakpoint` | `(broken: boolean) => void` | - |
| `onCollapse` | `(collapsed: boolean, type: 'clickTrigger' \| 'responsive') => void` | - |

### Layout.Header, Layout.Content, Layout.Footer

Accept standard `className` and `style` props. Must be placed inside Layout.

### Layout Patterns

```tsx
// Basic with Sider
<Layout>
  <Sider>Sider</Sider>
  <Layout>
    <Header>Header</Header>
    <Content>Content</Content>
    <Footer>Footer</Footer>
  </Layout>
</Layout>
```

---

## Grid (Row/Col)

```tsx
import { Row, Col } from 'antd';
```

### Row Props

| Prop | Type | Default |
|------|------|---------|
| `align` | `'top' \| 'middle' \| 'bottom' \| 'stretch' \| Responsive` | `'top'` |
| `gutter` | `number \| string \| object \| [horizontal, vertical]` | `0` |
| `justify` | `'start' \| 'end' \| 'center' \| 'space-around' \| 'space-between' \| 'space-evenly' \| Responsive` | `'start'` |
| `wrap` | `boolean` | `true` |

### Col Props

| Prop | Type | Default |
|------|------|---------|
| `flex` | `string \| number` | - |
| `span` | `number` | - (0 = display:none) |
| `offset` | `number` | `0` |
| `order` | `number` | `0` |
| `push` | `number` | `0` |
| `pull` | `number` | `0` |

### Responsive Breakpoints

Each breakpoint accepts `number` (span) or `{ span, offset, push, pull, order }`:

| Prop | Screen Width |
|------|-------------|
| `xs` | < 576px |
| `sm` | >= 576px |
| `md` | >= 768px |
| `lg` | >= 992px |
| `xl` | >= 1200px |
| `xxl` | >= 1600px |

### Grid Example

```tsx
<Row gutter={[16, 16]} justify="center">
  <Col xs={24} sm={12} md={8} lg={6}>
    <div>Content</div>
  </Col>
  <Col xs={24} sm={12} md={8} lg={6}>
    <div>Content</div>
  </Col>
</Row>
```

---

## Spin

```tsx
import { Spin } from 'antd';
```

### Spin Props

| Prop | Type | Default |
|------|------|---------|
| `delay` | `number` | - (ms) |
| `fullscreen` | `boolean` | `false` (v5.11.0+) |
| `indicator` | `ReactNode` | - |
| `percent` | `number \| 'auto'` | - (v5.18.0+) |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` |
| `spinning` | `boolean` | `true` |
| `tip` | `ReactNode` | - (deprecated, use `description`) |
| `description` | `ReactNode` | - |
| `classNames` | `Record<SemanticDOM, string>` | - |
| `styles` | `Record<SemanticDOM, CSSProperties>` | - |

### Static Method

```tsx
Spin.setDefaultIndicator(indicator: ReactNode); // Set global default spinner
```

### Design Tokens

`contentHeight` (400), `dotSize` (20), `dotSizeLG` (32), `dotSizeSM` (14)

### Spin as Wrapper

```tsx
<Spin spinning={loading}>
  <div>Content will be dimmed when loading</div>
</Spin>
```

---

## Pagination

```tsx
import { Pagination } from 'antd';
import type { PaginationProps } from 'antd';
```

### Pagination Props

| Prop | Type | Default |
|------|------|---------|
| `align` | `'start' \| 'center' \| 'end'` | - |
| `current` | `number` | - |
| `defaultCurrent` | `number` | `1` |
| `defaultPageSize` | `number` | `10` |
| `disabled` | `boolean` | - |
| `hideOnSinglePage` | `boolean` | `false` |
| `itemRender` | `(page, type: 'page' \| 'prev' \| 'next' \| 'jump-prev' \| 'jump-next', element) => ReactNode` | - |
| `pageSize` | `number` | - |
| `pageSizeOptions` | `number[]` | `[10, 20, 50, 100]` |
| `responsive` | `boolean` | - |
| `showLessItems` | `boolean` | `false` |
| `showQuickJumper` | `boolean \| { goButton: ReactNode }` | `false` |
| `showSizeChanger` | `boolean \| SelectProps` | - (auto when total > 50) |
| `showTitle` | `boolean` | `true` |
| `showTotal` | `(total: number, range: [number, number]) => ReactNode` | - |
| `simple` | `boolean \| { readOnly: boolean }` | - |
| `size` | `'large' \| 'medium' \| 'small'` | `'medium'` |
| `total` | `number` | `0` |
| `onChange` | `(page: number, pageSize: number) => void` | - |
| `onShowSizeChange` | `(current: number, size: number) => void` | - |
| `classNames` | `Record<SemanticDOM, string>` | - |
| `styles` | `Record<SemanticDOM, CSSProperties>` | - |

### Table Pagination Usage

```tsx
// Table accepts pagination props directly
<Table
  pagination={{
    current: page,
    pageSize: 20,
    total: 100,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
    onChange: (page, pageSize) => { ... },
  }}
/>

// Hide pagination
<Table pagination={false} />
```
