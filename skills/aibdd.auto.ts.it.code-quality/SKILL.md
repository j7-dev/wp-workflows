---
name: aibdd.auto.ts.it.code-quality
description: >
  React Integration Test 程式碼品質規範合集。包含 SOLID 設計原則、
  Component/Hook 組織規範、Testing-Library 最佳實踐、TypeScript 嚴格型別、
  MSW Handler 品質。供 refactor 階段嚴格遵守。
---

# React IT 程式碼品質規範

供重構階段嚴格遵守。涵蓋 SOLID、測試組織、Meta 清理、程式架構、程式碼品質。

---

## 1. SOLID 設計原則

### S — 單一職責（Single Responsibility）

- 每個 React component 僅負責一件事
- 若 component 同時處理資料擷取 + 渲染 + 驗證，必須拆分
- Custom hooks 應將資料擷取邏輯從 component 中抽離

❌ Bad — Component 同時做資料擷取、狀態管理、渲染：

```tsx
function LessonProgressPage({ userId }: { userId: string }) {
  const [data, setData] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${userId}/progress`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return <ul>{data.map((d) => <li key={d.id}>{d.lessonId}</li>)}</ul>;
}
```

✅ Good — Component 僅渲染，資料擷取交給 custom hook：

```tsx
function LessonProgressPage({ userId }: { userId: string }) {
  const { data, isLoading, error } = useLessonProgress(userId);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;
  return <LessonProgressList items={data ?? []} />;
}
```

### O — 開放封閉（Open/Closed）

- 透過組合擴展（props、children、render props），而非修改原 component

```tsx
// 可透過 children 擴展而不修改 Card
function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}
```

### L — 里氏替換（Liskov Substitution）

- Component 介面（props）必須可互相替換
- 若 `ButtonPrimary` 與 `ButtonSecondary` 皆宣告繼承 `ButtonProps`，則兩者必須可在同樣的上下文中互換

### I — 介面隔離（Interface Segregation）

- Props 介面必須最小化——僅需 2 個欄位時不要傳整個物件

❌ Bad:

```tsx
function UserAvatar({ user }: { user: User }) {
  return <img src={user.avatarUrl} alt={user.displayName} />;
}
```

✅ Good:

```tsx
interface UserAvatarProps {
  avatarUrl: string;
  displayName: string;
}

function UserAvatar({ avatarUrl, displayName }: UserAvatarProps) {
  return <img src={avatarUrl} alt={displayName} />;
}
```

### D — 依賴反轉（Dependency Inversion）

- Components 依賴 hooks（抽象），而非直接呼叫 API
- Custom hooks 抽象資料擷取與狀態管理

```tsx
// hooks/useLessonProgress.ts
export function useLessonProgress(userId: string) {
  return useQuery({
    queryKey: ['lessonProgress', userId],
    queryFn: () => apiClient.getLessonProgress(userId),
  });
}

// components/LessonProgressPage.tsx — 不直接觸碰 fetch/axios
function LessonProgressPage({ userId }: { userId: string }) {
  const { data } = useLessonProgress(userId);
  return <LessonProgressList items={data ?? []} />;
}
```

---

## 2. Testing-Library 最佳實踐

### Query 優先級

依序使用：

1. `getByRole`
2. `getByLabelText`
3. `getByPlaceholderText`
4. `getByText`
5. `getByDisplayValue`
6. `getByAltText`
7. `getByTitle`
8. `getByTestId`（最後手段）

### 互動

- 使用 `userEvent`（而非 `fireEvent`）——更貼近真實使用者行為
- 使用 `userEvent.setup()` 以保證事件順序正確
- `await user.click(button)`，而非 `fireEvent.click(button)`

```tsx
import userEvent from '@testing-library/user-event';

it('submits form', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  await user.type(screen.getByLabelText(/email/i), 'user@example.com');
  await user.type(screen.getByLabelText(/password/i), 'secret');
  await user.click(screen.getByRole('button', { name: /log in/i }));

  expect(await screen.findByText(/welcome/i)).toBeInTheDocument();
});
```

### 非同步

- 使用 `waitFor` 處理依賴非同步操作的斷言
- 使用 `findBy*` 處理非同步出現的元素
- 絕不使用 `setTimeout` 或固定延遲
- `waitFor` 預設逾時為 1000ms，僅在有正當理由時才延長

```tsx
// ✅ 等待非同步出現的元素
expect(await screen.findByText(/success/i)).toBeInTheDocument();

// ✅ 自訂條件
await waitFor(() => {
  expect(screen.getByRole('status')).toHaveTextContent(/complete/i);
});
```

### screen 的使用

- 永遠使用 `screen.getByRole()` 等（不要解構 render 回傳值）
- 使用 `within()` 將查詢限縮於特定容器

```tsx
const row = screen.getByRole('row', { name: /lesson 1/i });
expect(within(row).getByText(/completed/i)).toBeInTheDocument();
```

---

## 3. TypeScript 嚴格型別

- 禁止 `any`——必要時使用 `unknown` + type guard
- API 型別由 Zod schema 推導：`type Foo = z.infer<typeof FooSchema>`
- Custom hooks 必須有明確的回傳型別
- Component props 介面以 `interface` 定義（而非 `type`）
- Generic factory function 必須搭配適當的型別參數

```ts
// ✅ Zod schema 推導
const LessonProgressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  lessonId: z.number(),
  progress: z.number(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
});
export type LessonProgress = z.infer<typeof LessonProgressSchema>;

// ✅ Hook 明確回傳型別
export function useLessonProgress(
  userId: string,
): UseQueryResult<LessonProgress[], Error> {
  return useQuery({ ... });
}

// ✅ Props 使用 interface
interface LessonCardProps {
  lessonId: number;
  title: string;
  progress: number;
}
```

---

## 4. 測試檔案組織

- 每個 `.feature` 對應一個測試檔
- 檔名：`{feature}.integration.test.tsx`
- `describe()` block 對應 Feature / Rule 結構
- `it()` block 對應 Examples
- 共用 setup 置於 `beforeEach`，不在各個 `it()` 重複
- Helper function 集中於 `src/__tests__/helpers/`
- Factory function 集中於 `src/__tests__/factories/`
- MSW 測試 handler 與測試檔同層，或集中於 `src/__tests__/mocks/`

### Import 排序

1. React / framework imports
2. Testing libraries（`@testing-library/*`、`vitest`、`msw`）
3. 待測 component
4. Test helpers、factories、mocks
5. 型別

```ts
// 1. framework
import React from 'react';

// 2. testing libraries
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

// 3. component under test
import { LessonProgressPage } from '@/pages/LessonProgressPage';

// 4. test helpers
import { renderWithProviders } from '@/test/helpers/render';
import { createUser } from '@/test/helpers/user-event';
import { mockLessonProgress } from '@/test/factories/lesson-progress.factory';
import { server } from '@/test/mocks/server';

// 5. types
import type { LessonProgress } from '@/lib/types/schemas';
```

---

## 5. MSW Handler 品質

- Request/response body 型別安全
- Happy path 的預設 handler 置於 `handlers.ts`
- 單一測試的 override 以 `server.use()` 處理，並於 `afterEach` 重置
- 使用 MSW v2 API（`http.get()`、`http.post()` 等）
- Response body 需符合 Zod schema 型別
- 為失敗情境提供 error handler

```ts
import { http, HttpResponse } from 'msw';
import type { LessonProgress } from '@/lib/types/schemas';

export const handlers = [
  http.get('/api/users/:userId/progress', () => {
    const body: LessonProgress[] = [];
    return HttpResponse.json(body);
  }),
];
```

---

## 6. Component 品質（Production Code）

### 架構分層

```
pages/          (routing + layout)
  └── components/   (UI rendering)
        └── hooks/       (data fetching + state)
              └── lib/api/    (API client functions)
```

- Pages 僅負責組合 component 與提供路由 context
- Components 依 props 渲染 UI
- Hooks 管理資料擷取、mutation、狀態
- API client function 為 fetch/axios 的薄包裝

### 命名

- Components：PascalCase（`LessonProgressCard`）
- Hooks：camelCase 以 `use` 為前綴（`useLessonProgress`）
- Event handlers：以 `handle` 為前綴（`handleSubmit`、`handleProgressUpdate`）
- Boolean props：以 `is` / `has` / `can` 為前綴（`isLoading`、`hasError`）

### Early Return / Guard Clause

```tsx
function LessonProgressPage({ userId }: { userId: string }) {
  const { data, isLoading, error } = useLessonProgress(userId);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;
  if (!data || data.length === 0) return <EmptyState />;

  return <LessonProgressList items={data} />;
}
```

---

## 7. Meta 清理

### 刪除

- `// TODO: [States Prepare: ...]`
- `// TODO: [Operation Invocation: ...]`
- `// TODO: [Result Verifier: ...]`
- `// TODO: [States Verify: ...]`
- 任何開發階段的臨時註記

### 保留

- 說明業務邏輯的 JSDoc 註解
- 必要的技術註解

---

## 檢查清單

- [ ] 每個 component 只負責一件事（SRP）
- [ ] Component 透過 custom hooks 取得資料（DIP）
- [ ] 測試使用 `getByRole` 優先（Testing-Library best practice）
- [ ] 使用 `userEvent`，非 `fireEvent`
- [ ] 使用 `waitFor` / `findBy*` 處理非同步
- [ ] 無 `any` 型別
- [ ] Zod schema inference 用於 API 型別
- [ ] 所有 TODO/META 標記已清除
- [ ] Import 排序正確
- [ ] MSW handlers 型別安全
- [ ] `afterEach` 重置 MSW handlers
- [ ] 命名清晰表達用途
