# 程式碼品質與測試規範

## 錯誤處理

```typescript
// ✅ 完整的錯誤處理
async function fetchCourse(id: number): Promise<TCourse> {
  try {
    const response = await fetch(`${apiUrl}/courses/${id}`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[fetchCourse] 請求失敗:', error)
    throw new Error('無法取得課程資料')
  }
}

// ❌ 無錯誤處理
async function fetchCourse(id: number) {
  const response = await fetch(`${apiUrl}/courses/${id}`)
  return response.json()
}
```

---

## 程式碼異味偵測

### 1. 函式過長（> 50 行）

```typescript
// ❌ 100 行的函式
function processCourseData() { /* 100 行 */ }

// ✅ 拆分為小函式
function processCourseData() {
  const validated = validateCourseData()
  const transformed = transformCourseData(validated)
  return saveCourseData(transformed)
}
```

### 2. 巢狀過深（> 4 層）

```typescript
// ❌ 5 層巢狀
if (user) {
  if (user.isAdmin) {
    if (course) {
      if (course.isActive) {
        if (hasPermission) { /* 做事 */ }
      }
    }
  }
}

// ✅ Early return 扁平化
if (!user) return
if (!user.isAdmin) return
if (!course) return
if (!course.isActive) return
if (!hasPermission) return
// 做事
```

### 3. Magic Number / Magic String

```typescript
// ❌ 神秘數字與字串
if (retryCount > 3) { }
setTimeout(callback, 500)
if (status === 'pc_publish') { }

// ✅ 命名常數
const MAX_RETRIES = 3
const DEBOUNCE_DELAY_MS = 500
const COURSE_PUBLISH_STATUS = 'pc_publish'

if (retryCount > MAX_RETRIES) { }
setTimeout(callback, DEBOUNCE_DELAY_MS)
if (status === COURSE_PUBLISH_STATUS) { }
```

### 4. 平行 async（避免不必要的序列等待）

```typescript
// ❌ 不必要的序列等待
const courses = await fetchCourses()
const categories = await fetchCategories()
const teachers = await fetchTeachers()

// ✅ 平行執行
const [courses, categories, teachers] = await Promise.all([
  fetchCourses(),
  fetchCategories(),
  fetchTeachers(),
])
```

---

## 注解規範

```typescript
// ✅ 說明「為什麼」，而非「做什麼」
// 使用指數退避避免在 API 斷線時大量重試
const delay = Math.min(1000 * Math.pow(2, retryCount), 30_000)

// WordPress 後台路由使用 hash，避免與 WP 原生路由衝突
<HashRouter>

// ❌ 說明顯而易見的事
// 將 count 加 1
count++

// 將名稱設為使用者名稱
name = user.name
```

---

## 測試規範

### 測試結構（AAA 模式）

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('CourseCard', () => {
  it('應在點擊刪除按鈕時呼叫 onDelete', async () => {
    // Arrange（準備）
    const mockOnDelete = vi.fn()
    const course: TCourse = { id: 1, name: '測試課程', status: 'publish' }

    // Act（執行）
    render(<CourseCard course={course} onDelete={mockOnDelete} />)
    await userEvent.click(screen.getByRole('button', { name: /刪除/ }))

    // Assert（驗證）
    expect(mockOnDelete).toHaveBeenCalledWith(1)
  })
})
```

### 測試原則

1. 測試**行為**而非實作細節
2. 使用語意化查詢（`getByRole`、`getByLabelText`）
3. 禁止使用 index 作為查詢依據
4. 測試名稱清楚描述預期行為（「應...」格式）
