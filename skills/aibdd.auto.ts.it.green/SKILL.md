---
name: aibdd.auto.ts.it.green
description: >
  React IT Stage 4：綠燈階段。以 Red 階段產出的失敗測試為驅動，
  用最小增量迭代實作 React 元件，直到所有測試通過。
  當 /aibdd.auto.ts.it.control-flow 呼叫綠燈階段，或使用者說「綠燈」「green」時觸發。
---

# 綠燈實作者（React IT）

以失敗測試為驅動，迭代實作 React 元件至所有測試通過。

## 實作目標

```
Component rendering → data fetching hooks → event handlers → form logic → validation feedback
```

---

## 核心循環

```
while 測試未全部通過:
    1. 執行測試 → 讀取第一個失敗
    2. 分析失敗原因（element not found? text mismatch? waitFor timeout?）
    3. 寫最小增量程式碼修復該失敗
    4. 重新執行測試
    5. 若新失敗出現 → 回到 2
    6. 若全部通過 → 結束
```

### 失敗模式對照表

| 失敗模式 | 原因 | 修復方向 |
|---------|------|---------|
| `TestingLibraryElementError: Unable to find element` | Component 未 render 預期元素 | 加入對應的 JSX 元素 |
| `expect(element).toHaveTextContent(...)` 不符 | 資料綁定錯誤 | 修正 component 的 data binding |
| `waitFor` timeout | API fetch 未完成或未觸發 | 檢查 MSW handler + useEffect/useQuery 邏輯 |
| `user.click()` 無反應 | 事件 handler 未綁定 | 加入 `onClick` / `onSubmit` |
| `user.type()` 無反應 | input 非 controlled 或 readOnly | 檢查 value/onChange binding |
| MSW unhandled request warning | API client URL 與 MSW handler 不符 | 修正 client URL 或 MSW pattern |
| `act(...)` warning | state update 未被包裹 | 在 `waitFor` 或 `findBy` 中驗證 |
| `expect(requestRef.current).not.toBeNull()` 失敗 | API call 未被觸發 | 檢查事件 handler 是否呼叫 API client function |

---

## 最小增量範例

### 範例 1：Component 未 render 元素

**失敗**：`Unable to find an element with the role "spinbutton" and name "進度"`

**修復（最小）**：
```tsx
// src/app/lessons/[id]/progress/page.tsx
'use client';

export default function LessonProgressPage() {
  return (
    <form>
      <label htmlFor="progress">進度</label>
      <input id="progress" type="number" />
      <button type="submit">更新</button>
    </form>
  );
}
```

### 範例 2：資料未顯示

**失敗**：`Unable to find text "80%"`

**修復（最小）**：加入 data fetching

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { getLessonProgress } from '@/lib/api/lesson-progress';

export default function LessonProgressPage({ params }: { params: { id: string } }) {
  const { data } = useQuery({
    queryKey: ['lesson-progress', params.id],
    queryFn: () => getLessonProgress(Number(params.id)),
  });

  if (!data) return <div>Loading...</div>;

  return <div>{data.progress}%</div>;
}
```

### 範例 3：Event handler 未觸發 API

**失敗**：`expect(requestRef.current).not.toBeNull()` timeout

**修復（最小）**：
```tsx
const mutation = useMutation({
  mutationFn: (progress: number) =>
    updateLessonProgress(Number(params.id), { progress }),
});

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const progress = Number(formData.get('progress'));
  mutation.mutate(progress);
};

return <form onSubmit={handleSubmit}>...</form>;
```

---

## 最小增量原則

- 每次只修一個失敗
- **不預先實作**其他測試還沒要求的功能
- 不做「順便」的重構（那是 Refactor 階段的事）

### 反例：過度實作

```tsx
// ❌ 測試只要求能更新進度，但加了一堆未測試的功能
export default function LessonProgressPage() {
  const [history, setHistory] = useState([]);           // 測試沒要求
  const [isSharing, setIsSharing] = useState(false);    // 測試沒要求
  const [achievements, setAchievements] = useState([]); // 測試沒要求
  // ...
}
```

### 正例：剛好夠

```tsx
// ✅ 只實作測試需要的
export default function LessonProgressPage({ params }) {
  const { data } = useQuery({ ... });
  const mutation = useMutation({ ... });
  return (
    <form onSubmit={handleSubmit}>
      <input name="progress" />
      <button>更新</button>
    </form>
  );
}
```

---

## 測試執行命令

```bash
# 開發階段：執行特定測試檔
npx vitest run src/__tests__/{feature-slug}.integration.test.tsx

# Watch mode（TDD 建議）
npx vitest src/__tests__/{feature-slug}.integration.test.tsx

# 完成階段：執行所有整合測試
npx vitest run
```

---

## 常見失敗與解決

### `MSW: Received request but no handler matched`
→ 檢查 API Client 的 URL 是否與 MSW handler 的 URL pattern 一致。
MSW v2 的 URL pattern 規則：`:param` 而非 `{param}`。

### `act(...) warning`
→ 將觸發 state update 的操作用 `await` 包裹：
```typescript
await user.click(button);  // ✅
// 而非 user.click(button);
```

### QueryClient 快取汙染
→ `renderWithProviders` 每次建立新的 QueryClient instance（已在模板中實作）。

### Next.js App Router `useRouter` 錯誤
→ 在測試中 mock `next/navigation`：
```typescript
import { vi } from 'vitest';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ id: '1' }),
  useSearchParams: () => new URLSearchParams(),
}));
```

---

## 完成條件

- [ ] 測試命令全數通過（零失敗）
- [ ] 未引入任何測試未要求的功能
- [ ] 無 MSW unhandled request 警告
- [ ] 無 `act(...)` 警告
- [ ] `npx tsc --noEmit` 通過
