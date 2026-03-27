# 表單進階處理模式

## Form.Item 值轉換

```typescript
import { Form, Switch } from 'antd'

// ✅ 使用 getValueProps + normalize 進行值轉換
<Form.Item
  name={['status']}
  getValueProps={(value) => ({
    // 將 API 的 'publish' 轉為 Switch 的 true
    value: value === 'publish',
  })}
  normalize={(value) => {
    // 將 Switch 的 true/false 轉回 API 的 'publish'/'draft'
    return value ? 'publish' : 'draft'
  }}
>
  <Switch checkedChildren="發佈" unCheckedChildren="草稿" />
</Form.Item>
```

## 動態條件式 Tabs

```typescript
// ✅ 根據資料狀態動態過濾 Tabs
const watchType = Form.useWatch(['type'], form)

const items: TabsProps['items'] = [
  { key: 'basic', label: '基本資訊', children: <BasicInfo /> },
  { key: 'price', label: '價格', children: <PriceForm /> },
  { key: 'stock', label: '庫存', children: <StockForm /> },
  { key: 'variations', label: '款式', children: <Variations /> },
].filter((item) => {
  const conditions: Record<string, boolean> = {
    // 只有可變商品才顯示「款式」Tab
    variations: watchType === 'variable',
    // 可變商品和組合商品沒有自己的價格
    price: !['variable', 'grouped'].includes(watchType),
  }
  return conditions[item.key] !== false
})
```
