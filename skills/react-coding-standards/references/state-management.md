# 狀態管理規範

## Jotai — 全域跨頁面狀態

```typescript
// atoms/course.ts
import { atom } from 'jotai'

/** 已選擇的課程列表（跨頁選擇） */
export const selectedCoursesAtom = atom<TCourse[]>([])

/** 衍生 atom：已選擇的課程 ID（唯讀） */
export const selectedCourseIdsAtom = atom(get =>
  get(selectedCoursesAtom).map(c => c.id)
)

// 元件內使用
const [selectedCourses, setSelectedCourses] = useAtom(selectedCoursesAtom)
const selectedIds = useAtomValue(selectedCourseIdsAtom) // 唯讀衍生值
```

## React Context — 元件子樹狀態

```typescript
type TFormContextType = {
  isEditing: boolean
  setIsEditing: (value: boolean) => void
}

const FormContext = createContext<TFormContextType | null>(null)

/** 表單 Context Provider */
export const FormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <FormContext.Provider value={{ isEditing, setIsEditing }}>
      {children}
    </FormContext.Provider>
  )
}

/**
 * 取得表單 Context 的 Hook
 * 必須在 FormProvider 內使用
 */
export const useFormContext = (): TFormContextType => {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error('useFormContext must be used within FormProvider')
  }
  return context
}
```

## Jotai — 禁止 atom 與 Component 的循環依賴

Jotai atom 檔案（`atom.tsx`）**絕不可**從元件的 barrel export（`index.tsx`）import 預設值或常量，因為該元件通常會反向 import atom，形成循環依賴，導致 `ReferenceError: Cannot access 'xxx' before initialization`。

**原則：atom 檔案只能 import 純型別/常量檔案（如 `types.ts`、`constants.ts`），不可 import 含有 React 元件的模組。**

```typescript
// ❌ 循環依賴：atom.tsx ↔ HistoryDrawer/index.tsx
// atom.tsx
import { defaultProps } from './HistoryDrawer'        // HistoryDrawer/index.tsx 又 import atom
export const drawerAtom = atom(defaultProps)           // ReferenceError!

// ✅ 正確：將預設值放在 types.ts，斬斷循環
// atom.tsx
import { defaultProps } from './HistoryDrawer/types'   // types.ts 不 import atom
export const drawerAtom = atom(defaultProps)            // 正常運作
```

**常見循環依賴模式與解法：**

| 循環路徑 | 解法 |
|----------|------|
| `atom.tsx` → `Component/index.tsx` → `atom.tsx` | 將常量/預設值移至 `Component/types.ts` |
| `ComponentA/index.tsx` → `ComponentB/index.tsx` → `ComponentA/index.tsx` | 提取共用邏輯至獨立的 `shared.ts` |
| `hooks/useX.ts` → `Component/index.tsx` → `hooks/useX.ts` | 將型別定義獨立至 `types.ts` |

---

## 選擇指引

| 場景 | 推薦方案 |
|------|----------|
| 跨頁面共享狀態（如購物車、選擇清單） | Jotai atom |
| 僅限元件子樹的狀態（如表單編輯模式） | React Context |
| 單一元件的 UI 狀態（如 modal 開關） | `useState` |
| 伺服器資料（API 回應） | Refine hooks / React Query |
