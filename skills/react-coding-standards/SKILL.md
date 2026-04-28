---
name: react-coding-standards
description: TypeScript / React 18 編碼標準與最佳實踐，適用於 WordPress Plugin 前端（Ant Design、Refine.dev、Jotai）。供 @zenbu-powers-lite:react-reviewer agent 審查時參考，也可作為開發時的規範指引。當開發或審查任何 React/TypeScript 程式碼、建立新元件、重構前端、或需要確認命名與型別慣例時，請啟用此技能。
---

# TypeScript / React 編碼標準

適用於 WordPress Plugin 前端的 TypeScript 與 React 18 編碼規範。與 `@zenbu-powers-lite:react-reviewer` agent 配合使用，作為審查與開發的共同準則。

## 適用時機

- 審查 React / TypeScript 程式碼品質（搭配 `@zenbu-powers-lite:react-reviewer`）
- 開始新模組或元件開發
- 重構現有程式碼以符合規範
- 確立命名、格式、型別的一致性
- 新成員熟悉專案編碼慣例

---

## 程式碼品質原則

### 1. 可讀性優先
- 程式碼被閱讀的次數遠多於撰寫次數
- 清楚的變數與函式命名
- 優先讓程式碼自我說明，而非依賴注解
- 保持一致的格式

### 2. KISS（保持簡單）
- 找到最簡單的可行解
- 避免過度設計
- 不做提前優化
- 易理解 > 聰明的程式碼

### 3. DRY（不重複自己）
- 將通用邏輯提取為函式或 Custom Hook
- 建立可複用元件
- 跨模組共享工具函式
- 避免複製貼上程式碼

### 4. YAGNI（不做不需要的功能）
- 不提前建構未需要的功能
- 避免過度抽象
- 只在必要時增加複雜度
- 從簡單開始，有需要時再重構

---

## TypeScript 型別規範

### 命名規則

```typescript
// 型別與介面：PascalCase + T 前綴
type TProduct = {
  id: number
  name: string
  status: 'publish' | 'draft'
}

// Enum：PascalCase + E 前綴
enum EProductType {
  Simple = 'simple',
  Variable = 'variable',
}

// 常數物件：UPPER_SNAKE_CASE + as const
const ORDER_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
} as const

type TOrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

// 元件 Props：型別名稱 = 元件名稱 + Props
type TProductCardProps = {
  product: TProduct
  onDelete: (id: number) => void
  showActions?: boolean
}
```

### 禁止使用 `any`

```typescript
// ❌ 禁止：使用 any
const handleData = (data: any) => { }
function getItem(id: any): any { }

// ✅ 正確：使用明確型別
const handleData = (data: TProduct): void => { }
function getItem(id: number): Promise<TProduct> { }

// ✅ 真的不確定型別時使用 unknown 並做型別守衛
function processInput(input: unknown): string {
  if (typeof input === 'string') return input
  throw new Error('Expected string')
}
```

### 有限狀態使用 `as const` 或 Enum

```typescript
// ❌ 禁止：magic string
const updateStatus = (status: string) => { }

// ✅ 正確：as const + union type
const COURSE_STATUS = {
  PUBLISH: 'publish',
  DRAFT: 'draft',
  PENDING: 'pending',
} as const

type TCourseStatus = (typeof COURSE_STATUS)[keyof typeof COURSE_STATUS]

const updateStatus = (status: TCourseStatus): void => { }
```

### 變數命名

```typescript
// ✅ 描述性命名
const courseSearchQuery = 'React 入門'
const isUserEnrolled = true
const totalEnrollments = 120

// ❌ 不清楚的命名
const q = 'React 入門'
const flag = true
const x = 120
```

### 函式命名（動詞-名詞模式）

```typescript
// ✅ 清楚的動詞-名詞
async function fetchCourseList(params: TCourseParams) { }
function calculateProgress(completed: number, total: number): number { }
function isValidEmail(email: string): boolean { }

// ❌ 不清楚
async function course(id: string) { }
function progress(a: number, b: number) { }
```

---

## React 元件規範

### 元件結構順序

```typescript
// 1. 型別定義（放在元件前面，或獨立檔案）
type TProductCardProps = {
  /** 商品資料 */
  product: TProduct
  /** 刪除商品回呼 */
  onDelete: (id: number) => void
  /** 是否顯示操作按鈕，預設 true */
  showActions?: boolean
}

/**
 * 商品卡片元件
 * 顯示商品基本資訊，支援刪除操作
 */
const ProductCard: React.FC<TProductCardProps> = ({
  product,
  onDelete,
  showActions = true,
}) => {
  // 2a. Hooks（所有 hooks 集中在最上方）
  const [isDeleting, setIsDeleting] = useState(false)
  const { message } = App.useApp()

  // 2b. 衍生資料 / 計算
  const displayPrice = useMemo(() =>
    formatPrice(product.price), [product.price]
  )

  // 2c. 事件處理函式
  const handleDelete = useCallback(async () => {
    setIsDeleting(true)
    await onDelete(product.id)
    setIsDeleting(false)
  }, [product.id, onDelete])

  // 2d. Early return（載入中、錯誤等）
  if (!product) return null

  // 2e. JSX 渲染
  return (
    <Card className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold">{product.name}</h3>
      <p className="text-primary">{displayPrice}</p>
      {showActions && (
        <Button danger loading={isDeleting} onClick={handleDelete}>
          刪除
        </Button>
      )}
    </Card>
  )
}

// 3. 用 memo 包裝匯出（純展示元件）
export default memo(ProductCard)
```

### 禁止 `dangerouslySetInnerHTML` 與字串拼接 HTML

```typescript
// ❌ 禁止
const Notice = ({ message, type }: TNoticeProps) => (
  <div dangerouslySetInnerHTML={{ __html: `<p class="notice-${type}">${message}</p>` }} />
)

// ✅ 正確：使用 JSX
const Notice: React.FC<TNoticeProps> = ({ message, type }) => (
  <div className={`notice notice-${type}`}>
    <p>{message}</p>
  </div>
)
```

### JSDoc 繁體中文說明

元件與 Custom Hook 必須撰寫繁體中文 JSDoc：

```typescript
/**
 * 課程進度顯示元件
 * 以圓形進度條呈現使用者的課程完成率
 */
const CourseProgress: React.FC<TCourseProgressProps> = ({ progress }) => { }

/**
 * 取得課程列表的 Hook
 * 封裝分頁、篩選與資料請求邏輯
 * @param params 篩選參數（可選）
 */
const useCourseList = (params?: TCourseParams) => { }
```

---

## Custom Hook 規範

### 封裝 API 呼叫

```typescript
// ❌ 禁止：元件直接操作 API
const CourseList = () => {
  const [courses, setCourses] = useState<TCourse[]>([])

  useEffect(() => {
    fetch('/wp-json/wp/v2/courses').then(r => r.json()).then(setCourses)
  }, [])

  return <Table dataSource={courses} />
}

// ✅ 正確：封裝為 Custom Hook
/**
 * 取得課程列表的 Hook
 * 使用 Refine.dev useCustom 管理請求狀態
 */
const useCourseList = (params?: TCourseQueryParams) => {
  const apiUrl = useApiUrl()

  const result = useCustom<TCourse[]>({
    url: `${apiUrl}/courses`,
    method: 'get',
    config: {
      filters: params ? objToCrudFilters(params) : [],
    },
    queryOptions: {
      enabled: true,
    },
  })

  return {
    courses: result.data?.data ?? [],
    isLoading: result.isLoading,
    refetch: result.refetch,
  }
}

const CourseList = () => {
  const { courses, isLoading } = useCourseList()
  return <Table dataSource={courses} loading={isLoading} />
}
```

---

## import 路徑規範

```typescript
// ❌ 禁止：深度相對路徑、import 雜亂無序
import { Button } from 'antd'
import { useState } from 'react'
import { CourseCard } from '../../../components/course/CourseCard'
import { useCourses } from '../../../hooks/useCourses'

// ✅ 正確：路徑別名 + 分組排列
// 第一組：React / 第三方套件
import { useState, useCallback, memo } from 'react'
import { Button, Table, Card } from 'antd'
import { useTable } from '@refinedev/antd'
import { HttpError } from '@refinedev/core'

// 第二組：專案內部模組（使用 @/ 別名）
import { useCourses } from '@/hooks/useCourses'
import { CourseCard } from '@/components/course/CourseCard'
import type { TCourse } from '@/types/course'
```

---

## 不可變性

```typescript
// ❌ 禁止：直接 mutation
user.name = 'New Name'
items.push(newItem)
courses[0].status = 'publish'

// ✅ 正確：使用展開運算子
const updatedUser = { ...user, name: 'New Name' }
const updatedItems = [...items, newItem]
const updatedCourses = courses.map((c, i) =>
  i === 0 ? { ...c, status: 'publish' } : c
)
```

---

## 效能規範

### memo + useCallback + useMemo

```typescript
// ✅ memo：包裝純展示元件
const CourseCardComponent: React.FC<TCourseCardProps> = ({ course, onDelete }) => (
  <Card>
    <h3>{course.name}</h3>
    <Button onClick={() => onDelete(course.id)}>刪除</Button>
  </Card>
)
export const CourseCard = memo(CourseCardComponent)

// ✅ useCallback：穩定傳遞給子元件的回呼
const CourseList = () => {
  const handleDelete = useCallback((id: number) => {
    deleteCourse(id)
  }, [deleteCourse])

  return courses.map(course => (
    <CourseCard key={course.id} course={course} onDelete={handleDelete} />
  ))
}

// ✅ useMemo：穩定 useEffect 的物件依賴
const stableFilters = useMemo(() => filters, [
  filters.status,
  filters.search,
])

useEffect(() => {
  fetchData(stableFilters)
}, [stableFilters]) // ✅ 不會無限迴圈
```

---

## 參考文件

依需要載入對應的詳細規範：

- **進階效能優化**：`references/performance-advanced.md` — useTransition、條件式 API 查詢
- **狀態管理**：`references/state-management.md` — Jotai atom、React Context、選擇指引
- **WordPress Plugin 前端**：`references/wordpress-plugin.md` — HashRouter、入口掛載、全域變數型別、REST API Nonce
- **程式碼品質與測試**：`references/code-quality.md` — 錯誤處理、程式碼異味偵測、注解規範、測試規範（AAA 模式）
