# TypeScript / React 程式碼品質規範

供重構階段嚴格遵守。涵蓋 SOLID、測試組織、Meta 清理、程式架構、程式碼品質。

---

## 1. SOLID 設計原則

### S — 單一職責

每個 Component / Hook / Function 只負責一件事。

```tsx
// ❌ Component 做太多事
export default function LessonProgressPage({ params }) {
  // 資料取得
  const { data } = useQuery({ ... });
  // 表單狀態
  const [form, setForm] = useState({ progress: 0 });
  // API mutation
  const mutation = useMutation({ ... });
  // 權限檢查
  const { user } = useAuth();
  if (!user.canEdit) return null;
  // UI rendering
  return <form>{/* ... */}</form>;
}

// ✅ 職責分離
function useLessonProgress(lessonId: number) {
  const query = useQuery({ ... });
  const mutation = useMutation({ ... });
  return { data: query.data, update: mutation.mutate };
}

function useCanEdit() {
  const { user } = useAuth();
  return user.canEdit;
}

export default function LessonProgressPage({ params }: { params: { id: string } }) {
  const { data, update } = useLessonProgress(Number(params.id));
  const canEdit = useCanEdit();
  if (!canEdit) return null;
  return <ProgressForm data={data} onSubmit={update} />;
}
```

### O — 開放封閉

透過 Composition（props, children, render props）擴展，不修改既有 Component。

```tsx
// ✅ 可擴展的 Card Component
function Card({ children, header, footer }: {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="card">
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}
```

### L — 里氏替換

Props interface 必須可替換（subtype 必須相容 supertype）。

### I — 介面隔離

Props interface 保持最小，不傳整個物件。

```tsx
// ❌ 傳整個 user 物件，但只用 name
<UserBadge user={user} />

// ✅ 只傳需要的欄位
<UserBadge name={user.name} />
```

### D — 依賴反轉

Component 依賴 hooks（abstractions），不直接呼叫 API。

```tsx
// ❌ Component 直接呼叫 fetch
export default function Page() {
  useEffect(() => {
    fetch('/api/...').then(...);
  }, []);
}

// ✅ Component 依賴 hook
export default function Page() {
  const { data } = useLessonProgress(1);
}
```

---

## 2. Testing-Library 最佳實踐

### Query 優先級

```
getByRole > getByLabelText > getByPlaceholderText > getByText > getByDisplayValue > getByAltText > getByTitle > getByTestId
```

### 互動

```typescript
// ✅ userEvent
const user = userEvent.setup();
await user.click(button);

// ❌ fireEvent（較不真實）
fireEvent.click(button);
```

### 非同步

```typescript
// ✅ findBy 自動 retry
const element = await screen.findByRole('button');

// ✅ waitFor 包裹 assertion
await waitFor(() => {
  expect(screen.getByText(/success/i)).toBeInTheDocument();
});

// ❌ 固定延遲
await new Promise(r => setTimeout(r, 1000));
```

### screen 使用

```typescript
// ✅ 使用 screen
screen.getByRole('button');

// ❌ destructure render result
const { getByRole } = render(<Component />);
getByRole('button');
```

---

## 3. TypeScript 嚴格型別

### 禁用 `any`

```typescript
// ❌
function process(data: any) { ... }

// ✅ 使用 unknown + type guard
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'id' in data) {
    // ...
  }
}

// ✅ 使用 generic
function process<T>(data: T) { ... }
```

### Zod Schema Inference

```typescript
import { z } from 'zod';

export const LessonProgressSchema = z.object({
  id: z.string(),
  progress: z.number(),
});

// 型別從 schema 推導
export type LessonProgress = z.infer<typeof LessonProgressSchema>;
```

### Custom Hook 明確回傳型別

```typescript
export function useLessonProgress(lessonId: number): {
  data: LessonProgress | undefined;
  isPending: boolean;
  update: (progress: number) => void;
} {
  // ...
}
```

---

## 4. 測試檔案組織

### 目錄結構

```
src/
├── __tests__/
│   ├── {feature}.integration.test.tsx  # 一 feature 一 test file
│   └── helpers/
│       └── {custom-helpers}.ts
├── test/
│   ├── setup.ts                         # Vitest global setup
│   ├── mocks/
│   │   ├── server.ts
│   │   └── handlers.ts
│   ├── helpers/
│   │   ├── render.tsx
│   │   ├── user-event.ts
│   │   └── msw-utils.ts
│   └── factories/
│       ├── index.ts
│       └── {aggregate}.factory.ts
```

### describe/it 對應

```typescript
// Feature → describe
describe('用戶課程進度', () => {

  // Background → beforeEach
  beforeEach(() => { ... });

  // Rule → nested describe
  describe('成功更新進度', () => {

    // Example → it
    it('進度從 70% 更新到 80%', async () => { ... });
  });
});
```

### Import 排序

```typescript
// 1. 外部 libraries（React, testing libraries, msw）
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

// 2. 專案內部（測試基礎建設）
import { server } from '@/test/mocks/server';
import { renderWithProviders } from '@/test/helpers/render';
import { createUser } from '@/test/helpers/user-event';

// 3. 被測試的元件
import LessonProgressPage from '@/app/lessons/[id]/progress/page';

// 4. 型別
import type { LessonProgress } from '@/lib/types/schemas';
```

---

## 5. MSW Handler 品質

### 型別安全

```typescript
import { http, HttpResponse } from 'msw';
import type { LessonProgress } from '@/lib/types/schemas';

export const handlers = [
  http.get<{ lessonId: string }, never, { success: boolean; data: LessonProgress }>(
    '/api/v1/lessons/:lessonId/progress',
    ({ params }) => {
      return HttpResponse.json({
        success: true,
        data: {
          id: 'lp-1',
          userId: 'user-1',
          lessonId: Number(params.lessonId),
          progress: 0,
          status: 'NOT_STARTED',
          updatedAt: new Date().toISOString(),
        },
      });
    },
  ),
];
```

### Per-test Override

```typescript
// ✅ 使用 server.use() + afterEach resetHandlers
beforeEach(() => {
  server.use(
    http.get('/api/...', () => HttpResponse.json({ ... })),
  );
});
// 在 setup.ts 中已設定 afterEach(() => server.resetHandlers())
```

---

## 6. 程式架構規範

### 分層

```
src/
├── app/              # Next.js pages（layout, routing）
├── components/       # Reusable UI components
├── hooks/            # Custom hooks（資料邏輯、狀態管理）
├── lib/
│   ├── api/          # API client functions
│   ├── types/        # Zod schemas + type definitions
│   └── utils/        # Pure utilities
└── test/             # 測試基礎建設
```

### 各層職責

| 層 | 負責 | 不負責 |
|----|------|--------|
| app | 路由、layout、composition | 業務邏輯、資料取得 |
| components | UI rendering（stateless 優先）| 資料取得、業務邏輯 |
| hooks | 資料取得、狀態管理、業務邏輯 | UI 呈現 |
| lib/api | `fetch` 包裝、URL 構建、response parsing | 業務邏輯、UI |
| lib/types | Zod schemas、型別推導 | Runtime 邏輯 |

### 命名規則

- **Components**：`PascalCase`（`LessonProgressCard`）
- **Hooks**：`camelCase` with `use` prefix（`useLessonProgress`）
- **Event handlers**：`handle` prefix（`handleSubmit`, `handleProgressUpdate`）
- **Boolean props/variables**：`is`/`has`/`can` prefix（`isLoading`, `hasError`, `canEdit`）
- **Event props**：`on` prefix（`onSubmit`, `onUpdate`）

### 常見錯誤

- ❌ 業務邏輯寫在 Component 內
- ❌ Component 直接呼叫 `fetch`（應透過 hook + api client）
- ❌ 多個 useState 可以合併為一個 object state
- ❌ 資料取得邏輯寫在 useEffect（應用 React Query / SWR）

---

## 7. Meta 註記清理

### 刪除
- `// TODO: [States Prepare: ...]`
- `// TODO: [Operation Invocation: ...]`
- `// TODO: [Result Verifier: ...]`
- `// TODO: [States Verify: ...]`
- `// 生成參考 Prompt: ...`
- 其他開發過程臨時標記

### 保留
- JSDoc 業務邏輯註解
- 必要的技術註解

---

## 8. 程式碼品質

### Early Return / Guard Clause

```tsx
// ❌ 深層巢狀
function Component({ data }) {
  if (data) {
    if (data.isValid) {
      if (data.content) {
        return <div>{data.content}</div>;
      }
    }
  }
  return null;
}

// ✅ Guard Clause
function Component({ data }: { data: Data | null }) {
  if (!data?.isValid || !data.content) return null;
  return <div>{data.content}</div>;
}
```

### 不 Mutate Props

```tsx
// ❌
function Component({ items }) {
  items.push(newItem);  // Mutation!
}

// ✅
function Component({ items }: { items: Item[] }) {
  const allItems = [...items, newItem];
}
```

### useCallback / useMemo 謹慎使用

**預設不用**。只在明確發現效能問題或被 child component 用於相等性比較時才用。

### DRY

重複 3+ 次的邏輯提取共用 function 或 custom hook。

---

## 檢查清單

- [ ] 每個 Component / Hook / Function 只負責一件事（SRP）
- [ ] Component 透過 custom hooks 取得資料（DIP）
- [ ] 測試使用 `getByRole` 優先
- [ ] 使用 `userEvent`，非 `fireEvent`
- [ ] 使用 `waitFor` / `findBy*` 處理非同步
- [ ] 無 `any` 型別
- [ ] Zod schema inference 用於 API 型別
- [ ] 所有 TODO/META 標記已清除
- [ ] Import 排序正確
- [ ] MSW handlers 型別安全
- [ ] 命名清晰表達用途（Components: PascalCase, Hooks: `use` prefix）
- [ ] 檔案組織符合分層（app / components / hooks / lib）
- [ ] `npx tsc --noEmit` 通過
- [ ] `npx eslint src/` 通過
