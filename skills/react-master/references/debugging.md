# 除錯技巧

## React DevTools

- 使用 React DevTools 的 Profiler 分析渲染效能
- 使用 Components 面板檢查 props 與 state
- 使用 Highlight updates 功能觀察不必要的重新渲染

## TanStack Query DevTools

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const App = () => (
  <>
    <MainContent />
    {process.env.NODE_ENV === 'development' && (
      <ReactQueryDevtools initialIsOpen={false} />
    )}
  </>
)
```

## 網路請求偵錯

- 使用瀏覽器 DevTools 的 Network 面板檢查 API 請求
- 確認 WordPress REST API 的 nonce 是否正確傳遞
- 檢查 CORS 設定是否正確

## Console 記錄

```typescript
// ✅ 開發模式下的條件式 log
if (process.env.NODE_ENV === 'development') {
  console.log('[ProductTable] filters:', filters)
  console.log('[ProductTable] tableProps:', tableProps)
}
```

## WordPress 特定偵錯

```typescript
// 檢查 WordPress 傳遞的全域變數
declare global {
  interface Window {
    myPluginData?: {
      apiUrl: string
      nonce: string
      userId: number
    }
  }
}

console.log('Plugin data:', window.myPluginData)
console.log('WP nonce:', window.myPluginData?.nonce)
```
