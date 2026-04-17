# Hooks、效能、狀態管理、程式碼異味審查項

對應主 SKILL.md 的類別三、五、六、七、十。

---

## 類別三：元件結構與品質

- [ ] 元件與 Custom Hook 是否有 **JSDoc 繁體中文**說明（🟡）
- [ ] Props 型別是否定義完整（含選填 `?` 與預設值）（🟠）
- [ ] 禁止 `dangerouslySetInnerHTML` 或字串拼接 HTML（改用 JSX）（🔴）
- [ ] 元件結構是否遵循順序：Hooks → 衍生資料 → 事件處理 → Early return → JSX（🟡）
- [ ] 元件超過 200 行是否拆分為子元件（🟠）
- [ ] **生產環境是否有未清除的 `console.log`**（🟡）
- [ ] Class component 是否改用 Function component + Hooks（🟠）

### Before / After：元件結構順序

```tsx
// 前段：Hooks
const [isDeleting, setIsDeleting] = useState(false)
const { message } = App.useApp()

// 中段：衍生資料
const displayPrice = useMemo(() => formatPrice(product.price), [product.price])

// 中段：事件處理
const handleDelete = useCallback(async () => { ... }, [...])

// 中段：Early return
if (!product) return null

// 尾段：JSX
return <Card>...</Card>
```

---

## 類別五：React Hooks 正確性

- [ ] **Missing error boundary**：async / Suspense 樹是否有 `<ErrorBoundary>`（🔴）
- [ ] **Missing loading / error 狀態**：資料請求是否提供使用者反饋（🟠）
- [ ] 是否遵循 Rules of Hooks（不在條件式中呼叫 Hook）（🔴）
- [ ] `useEffect` 依賴陣列是否完整（無遺漏或冗餘）（🟠）
- [ ] 是否有物件引用造成無限迴圈的 `useEffect`（需用 `useMemo` 穩定引用）（🟠）
- [ ] **API 呼叫禁止在元件中直接 `useEffect` + `fetch`**，需封裝為 Custom Hook（🟠）
- [ ] **非同步競爭條件**：`useEffect` 中 async 操作是否使用 AbortController 或 cleanup flag（🟠）
- [ ] **過期狀態**：快速連續觸發的非同步操作是否確保只採用最新結果（🟠）

### Before / After：避免無限迴圈

```tsx
// 誤用
useEffect(() => {
  fetchData({ status, search })
}, [{ status, search }])   // 每次 render 都新物件

// 正確：穩定引用
const filters = useMemo(() => ({ status, search }), [status, search])
useEffect(() => {
  fetchData(filters)
}, [filters])
```

### Before / After：競爭條件處理

```tsx
// 正確：AbortController
useEffect(() => {
  const ctrl = new AbortController()
  fetch('/api', { signal: ctrl.signal }).then(setData).catch(() => {})
  return () => ctrl.abort()
}, [])
```

---

## 類別六：效能

- [ ] 純展示元件是否用 `memo` 包裝（🟡）
- [ ] 傳遞給子元件的回呼是否用 `useCallback`（🟡）
- [ ] 昂貴計算是否用 `useMemo`（🟡）
- [ ] **JSX 中的 inline 物件 / 陣列**（如 `style={{}}`）每次 render 都建立新引用（🟠）
- [ ] 大量資料的即時搜尋是否考慮 `useTransition` / `useDeferredValue`（🔵）
- [ ] Refine.dev `queryOptions.enabled` 是否正確控制條件式查詢（🟠）
- [ ] **Prop drilling 超過 3 層**：改用 Context 或 Jotai（🟠）
- [ ] 動態列表的 `key` 是否使用穩定 ID（禁止 index 作為 key）（🟠）

### Before / After：inline 物件引用

```tsx
// 誤用
<Child style={{ padding: 10 }} options={{ sort: 'asc' }} />

// 正確
const options = useMemo(() => ({ sort: 'asc' }), [])
const styleObj = useMemo(() => ({ padding: 10 }), [])
<Child style={styleObj} options={options} />
```

---

## 類別七：狀態管理

- [ ] 跨頁面的全域狀態是否使用 Jotai atom（🟡）
- [ ] 元件子樹的共享狀態是否使用 React Context（🟡）
- [ ] Context 是否提供自訂 Hook 存取，並驗證是否在 Provider 內（throw Error）（🟠）
- [ ] **Jotai**：衍生狀態是否使用 derived atom，而非存成獨立 atom（🟡）

### Before / After：Jotai derived atom

```tsx
// 誤用
const itemsAtom = atom<TItem[]>([])
const countAtom = atom(0)
// setItems 時還要手動同步 setCount

// 正確
const itemsAtom = atom<TItem[]>([])
const countAtom = atom((get) => get(itemsAtom).length)  // derived
```

---

## 類別十：程式碼異味

- [ ] 函式是否過長（> 50 行建議拆分）（🟡）
- [ ] 巢狀深度是否過深（> 4 層改用 early return）（🟠）
- [ ] 是否有 magic number / magic string（改用命名常數）（🟡）
- [ ] 是否有重複程式碼（DRY 原則）（🟡）
- [ ] 是否有直接 mutation（禁止 `array.push`、`obj.key = value`）（🟠）
- [ ] 是否有未使用的死碼、被注解掉的程式碼（🟡）
