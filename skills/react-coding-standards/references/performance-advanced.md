# 進階效能優化

## useTransition — 大量資料搜尋

```typescript
import { useState, useTransition, useDeferredValue } from 'react'

/**
 * 課程搜尋元件
 * 使用 Concurrent 功能優化大量資料的即時篩選
 */
const CourseSearch: React.FC<{ courses: TCourse[] }> = ({ courses }) => {
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const deferredQuery = useDeferredValue(query)

  const filtered = courses.filter(c =>
    c.name.toLowerCase().includes(deferredQuery.toLowerCase())
  )

  return (
    <div>
      <Input.Search
        onChange={e => startTransition(() => setQuery(e.target.value))}
        className="mb-4"
      />
      {isPending && <span className="text-gray-400">搜尋中...</span>}
      <List dataSource={filtered} renderItem={c => <List.Item>{c.name}</List.Item>} />
    </div>
  )
}
```

## 條件式 API 查詢

```typescript
// ✅ 使用 queryOptions.enabled 避免不必要的請求
const { data } = useCustom<TRevenueStats>({
  url: `${apiUrl}/reports/revenue`,
  method: 'get',
  queryOptions: {
    enabled: !!params.dateRange, // 只在有日期範圍時才查詢
  },
})
```
