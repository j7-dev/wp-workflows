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

## 選擇指引

| 場景 | 推薦方案 |
|------|----------|
| 跨頁面共享狀態（如購物車、選擇清單） | Jotai atom |
| 僅限元件子樹的狀態（如表單編輯模式） | React Context |
| 單一元件的 UI 狀態（如 modal 開關） | `useState` |
| 伺服器資料（API 回應） | Refine hooks / React Query |
