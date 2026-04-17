# Ant Design / Refine.dev / React Query / WordPress 專項審查

對應主 SKILL.md 的類別九（WordPress Plugin 特殊規範）與框架專項檢查區塊。

---

## 類別九：WordPress Plugin 特殊規範

- [ ] SPA 路由是否使用 `HashRouter`，**禁止 `BrowserRouter`**（🔴）
- [ ] React 入口掛載是否有 DOM 元素的 null 檢查（🟠）
- [ ] WordPress 全域變數（`window.myPluginData`）是否有 `declare global` 型別宣告（🟠）
- [ ] REST API 請求是否正確傳遞 nonce（`X-WP-Nonce` 標頭）（🟠）
- [ ] `ReactQueryDevtools` 是否有 `process.env.NODE_ENV === 'development'` 條件（🟡）
- [ ] **邊界型別強制轉換**：REST API 回傳的字串 ID 是否轉為數字再比較（`"123" !== 123`）（🟠）
- [ ] **JSON 邊界**：PHP → JSON → JS 傳遞的值是否保持型別一致（數字、布林、null 可能改變型別）（🟡）

### Before / After：HashRouter

```tsx
// 誤用：與 WP 路徑衝突
import { BrowserRouter } from 'react-router-dom'

// 正確
import { HashRouter } from 'react-router-dom'
```

### Before / After：入口 null 檢查

```tsx
// 誤用
const root = createRoot(document.getElementById('app')!)

// 正確
const mount = document.getElementById('my-plugin-app')
if (mount) {
  createRoot(mount).render(<App />)
}
```

### Before / After：WP 全域型別宣告

```tsx
// global.d.ts
declare global {
  interface Window {
    myPluginData: {
      apiUrl: string
      nonce: string
      currentUserId: number
    }
  }
}
export {}
```

### Before / After：邊界 ID 型別統一

```tsx
// 誤用：字串 ID === 數字 ID → 永遠 false
const selected = products.find((p) => p.id === userSelectedId)

// 正確：邊界轉型
const selected = products.find((p) => Number(p.id) === Number(userSelectedId))
```

---

## Refine.dev 專項

重點：使用 `useTable`、`useForm`、`useCustom`、`useList`、`useOne` 等 Refine data hooks，**禁止自訂 fetch / axios 邏輯**（除非明確的 escape hatch 場景）。

### Before / After：useCustom 取代手刻 fetch

```tsx
// 誤用
const [data, setData] = useState<TCourse[]>([])
useEffect(() => {
  fetch('/wp-json/plugin/v1/courses').then(r => r.json()).then(setData)
}, [])

// 正確
const { data } = useCustom<TCourse[]>({
  url: `${apiUrl}/courses`,
  method: 'get',
})
```

### 條件式查詢：`queryOptions.enabled`

```tsx
// 正確：缺 courseId 時不發請求
const { data } = useOne({
  resource: 'courses',
  id: courseId,
  queryOptions: { enabled: !!courseId },
})
```

---

## Ant Design 5 專項

- 表單欄位一律使用 `Form.Item`，**禁止手動管理受控狀態**（除非高度自訂場景）
- `Table` 搭配 `pagination`、`scroll`，大量資料需加 `virtual`
- **禁止 inline style**（改用 className + Tailwind 或 CSS Module）
- `App.useApp()` 取得 `message` / `notification` / `modal`，**禁止直接 import 靜態方法**（ConfigProvider 主題不會生效）

### Before / After：message 正確取法

```tsx
// 誤用：主題不會套到
import { message } from 'antd'
message.success('OK')

// 正確
const { message } = App.useApp()
message.success('OK')
```

---

## React Query 專項

- [ ] `queryKey` 結構是否一致（陣列形式，resource → id → filters）
- [ ] mutation 成功後是否 `invalidateQueries` 對應的 key
- [ ] `enabled` 是否用於條件式查詢（避免 undefined ID 發請求）
- [ ] `staleTime` / `gcTime` 是否合理設定（避免過度請求）

### Before / After：queryKey 結構

```tsx
// 誤用：字串拼接（不易 invalidate）
useQuery({ queryKey: [`courses-${userId}-${status}`], ... })

// 正確：階層陣列
useQuery({ queryKey: ['courses', userId, { status }], ... })

// invalidate 時可指定任一層級
queryClient.invalidateQueries({ queryKey: ['courses'] })
queryClient.invalidateQueries({ queryKey: ['courses', userId] })
```

---

## Jotai 專項

- atom 命名加 `Atom` 後綴（如 `selectedProductsAtom`、`cartAtom`）
- 衍生狀態使用 derived atom（`atom((get) => ...)`），**禁止以 useEffect + setAtom 同步**
- 全域 atom 放 `atoms/`，元件區域 atom 可放 `Component/atom.tsx`（注意循環依賴）

---

## REST API 邊界一致性

PHP → JSON → JS 的型別漂移常見陷阱：

| 來源 | 可能變成 |
|------|----------|
| PHP `int` | JS 字串（大數字、超過 Number.MAX_SAFE_INTEGER） |
| PHP `bool true` | `"1"` 或 `true`（看序列化設定） |
| PHP `null` | `null` / `""` / `undefined` 皆可能 |
| PHP float | 字串（如 `"10.00"`） |

在 API client 層統一轉型（Zod schema、`.transform()` 或手動 parser），**禁止每個元件各自處理**。
