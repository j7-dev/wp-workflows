# WordPress Plugin 前端特殊規範

## 必須使用 HashRouter

```typescript
// ✅ WordPress Plugin SPA 使用 HashRouter
import { HashRouter, Routes, Route } from 'react-router-dom'

const App = () => (
  <HashRouter>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/courses" element={<CourseList />} />
    </Routes>
  </HashRouter>
)

// ❌ 禁止在 WordPress Plugin 使用 BrowserRouter
```

## React 入口掛載

```typescript
// main.tsx
import { createRoot } from 'react-dom/client'
import App from './App'

const container = document.getElementById('my-plugin-app')
if (container) { // ✅ null 檢查
  createRoot(container).render(<App />)
}
```

## WordPress 全域變數型別宣告

```typescript
// types/global.d.ts
declare global {
  interface Window {
    myPluginData?: {
      apiUrl: string
      nonce: string
      userId: number
      siteUrl: string
    }
  }
}
```

## REST API Nonce 傳遞

```typescript
// ✅ 每個 REST API 請求都必須傳遞 nonce
const response = await fetch(`${apiUrl}/wp-json/my-plugin/v1/courses`, {
  headers: {
    'X-WP-Nonce': window.myPluginData?.nonce ?? '',
    'Content-Type': 'application/json',
  },
})
```
