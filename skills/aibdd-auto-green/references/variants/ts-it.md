# Green Variant: ts-it (React Integration Test)

## 測試命令

```bash
# 開發階段：執行特定 Feature 檔案
npx vitest run src/__tests__/{feature-slug}.integration.test.tsx

# 開發階段：執行特定 Scenario
npx vitest run src/__tests__/{feature-slug}.integration.test.tsx -t "scenario name"

# Watch mode（TDD 建議）
npx vitest src/__tests__/{feature-slug}.integration.test.tsx

# 完成階段：執行所有整合測試（總回歸測試）
npx vitest run
```

## 實作模式

### 實作目標

Component rendering → data fetching hooks → event handlers → form logic → validation feedback

### 實作順序

根據測試錯誤訊息逐步實作：

1. 執行測試 → `npx vitest run {test-file}`
2. 看錯誤訊息（Unable to find element? waitFor timeout? requestRef.current null?）
3. 根據錯誤補充最少的程式碼
4. 再次執行測試
5. 循環直到通過

### 最小增量範例

```tsx
// 做太多了（測試沒要求）
export default function LessonProgressPage({ params }) {
  const [history, setHistory] = useState([]);           // 沒測試
  const [sharing, setSharing] = useState(false);        // 沒測試
  const [achievements, setAchievements] = useState([]); // 沒測試
  // ...
}

// 剛好夠
export default function LessonProgressPage({ params }) {
  const { data } = useQuery({ ... });
  const mutation = useMutation({ ... });
  return <form onSubmit={handleSubmit}>...</form>;
}
```

## 框架 API

### Component 實作（綠燈）

紅燈階段的 `<div>TODO</div>` → 綠燈改為實際 rendering：

```tsx
// src/app/lessons/[id]/progress/page.tsx
'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { getLessonProgress, updateLessonProgress } from '@/lib/api/lesson-progress';

export default function LessonProgressPage({ params }: { params: { id: string } }) {
  const lessonId = Number(params.id);

  const { data, isPending } = useQuery({
    queryKey: ['lesson-progress', lessonId],
    queryFn: () => getLessonProgress(lessonId),
  });

  const mutation = useMutation({
    mutationFn: (progress: number) => updateLessonProgress(lessonId, { progress }),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const progress = Number(formData.get('progress'));
    mutation.mutate(progress);
  };

  if (isPending) return <div>Loading...</div>;
  if (mutation.isSuccess) return <div role="status">更新成功</div>;
  if (mutation.isError) return <div role="alert">{String(mutation.error)}</div>;

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="progress">進度</label>
      <input id="progress" name="progress" type="number" defaultValue={data?.progress} />
      <button type="submit">更新</button>
    </form>
  );
}
```

### API Client 實作（綠燈）

```typescript
// src/lib/api/lesson-progress.ts
import type { LessonProgress } from '@/lib/types/schemas';

export async function getLessonProgress(lessonId: number): Promise<LessonProgress> {
  const res = await fetch(`/api/v1/lessons/${lessonId}/progress`);
  if (!res.ok) throw new Error('Failed to fetch');
  const json = await res.json();
  return json.data;
}

export async function updateLessonProgress(
  lessonId: number,
  payload: { progress: number },
): Promise<void> {
  const res = await fetch(`/api/v1/lessons/${lessonId}/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? 'Update failed');
  }
}
```

## 迭代策略

### 開發循環

```
1. 執行測試 → npx vitest run {test-file}
2. 看到 `Unable to find element` → 加對應 JSX
3. 看到 `waitFor timeout` → 檢查 MSW handler + data fetching
4. 看到 `requestRef.current is null` → 加 event handler + API call
5. 通過 → 下一個 scenario
```

### 常見失敗模式

| 失敗模式 | 原因 | 修復 |
|---------|------|------|
| `Unable to find element` | Component 未 render 預期元素 | 加入 JSX 元素 |
| `toHaveTextContent` 不符 | 資料綁定錯誤 | 修正 data binding |
| `waitFor` timeout | API fetch 未完成或未觸發 | 檢查 MSW handler + useEffect/useQuery |
| `user.click()` 無反應 | 事件 handler 未綁定 | 加 `onClick`/`onSubmit` |
| `requestRef.current` null | API call 未觸發 | 檢查 event handler 是否呼叫 API client |
| MSW unhandled request | URL 不符 | 修正 API client URL 或 MSW pattern |
| `act(...)` warning | state update 未被包裹 | 用 `await user.xxx()` 或 `waitFor` |

## Docker / 環境

**不需要 Docker / Testcontainers / 真實 DB / 真實 API Server。**

- Vitest 使用 jsdom environment（Node.js 內模擬 DOM）
- MSW `setupServer` 攔截所有 fetch 請求
- 所有 API mock data 透過 MSW handlers 提供

## 完成條件

- [ ] 所有 React Component 已實作（不只是 stub）
- [ ] 所有 API Client functions 已實作
- [ ] 測試命令全數通過（零失敗）
- [ ] 未引入任何測試未要求的功能
- [ ] 無 MSW unhandled request 警告
- [ ] 無 `act(...)` warnings
