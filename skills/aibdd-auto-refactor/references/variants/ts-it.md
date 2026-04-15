# Refactor Variant: ts-it (React Integration Test)

## Linter / Formatter

```bash
npx tsc --noEmit
npx eslint src/
npx prettier --check src/
```

## 測試命令

```bash
# 每次重構後必須執行
npx vitest run

# 特定測試檔（快速迭代）
npx vitest run src/__tests__/{feature-slug}.integration.test.tsx
```

## 入口

### 被 control-flow 調用

接收 `FEATURE_FILE`，直接進入重構流程。

### 獨立使用

詢問目標 Feature File，確認綠燈階段已完成後執行重構。

---

## 兩階段工作流

**React IT 特有** — 先重構測試碼，再重構產品碼。

```
執行測試（確認綠燈）
    │
    ▼
【Phase A】重構測試碼（test files / helpers / factories / mocks）
    │
    ▼
執行測試（確認仍然綠燈）
    │
    ▼
【Phase B】重構產品碼（components / hooks / api client / types）
    │
    ▼
執行測試（確認仍然綠燈）
    │
    ▼
完成
```

**關鍵**：Phase 順序不可顛倒。每個 Phase 結束跑測試，Phase 內每次小步驟也跑測試。

---

## 安全規則

- **兩段式順序不可顛倒** — Phase A → 綠燈 → Phase B → 綠燈
- **禁止自動抽 helpers** — 除非使用者明確要求，不新增 helper、不搬移測試結構
- **禁止跨檔搬動** — 優先在原檔案內做最小改善（移除 TODO、補 JSDoc、調整命名/縮排）
- **如果真的要抽共用** — 必須先徵詢確認，一次只抽一個小片段，每次變更後跑測試

---

## Phase A：測試程式碼重構

### 範圍

- `src/__tests__/**/*.integration.test.tsx`
- `src/test/helpers/**/*.ts(x)`
- `src/test/factories/**/*.ts`
- `src/test/mocks/**/*.ts`

### 常見任務

1. **移除 TODO 註解** → 替換為有意義的註解

```typescript
// 重構前
it('進度從 70% 更新到 80%', async () => {
  // TODO: [States Prepare: aggregate-given] MSW handler for LessonProgress
  // TODO: [Operation Invocation: command] user-event
  server.use(...);
  // ...
});

// 重構後
it('進度從 70% 更新到 80%', async () => {
  // 前置：Alice 在課程 1 的進度為 70%
  server.use(...);
  // ...
});
```

2. **改善查詢選擇器** → 從 `getByText` / `getByTestId` 升級為 `getByRole`

```typescript
// 重構前
screen.getByTestId('submit-btn');

// 重構後
screen.getByRole('button', { name: /送出|更新/i });
```

3. **抽取重複 MSW setup** → 提升到 `beforeEach`（若重複 3+ 次）

```typescript
// 重構前（重複 3 次）
it('case 1', async () => {
  server.use(http.get('/api/v1/auth/me', () => HttpResponse.json(...)));
  // ...
});
it('case 2', async () => {
  server.use(http.get('/api/v1/auth/me', () => HttpResponse.json(...)));
  // ...
});

// 重構後
beforeEach(() => {
  server.use(http.get('/api/v1/auth/me', () => HttpResponse.json(...)));
});
```

4. **簡化測試邏輯** → 減少巢狀、使用 Early Return

---

## Phase B：生產程式碼重構

### 範圍

- `src/app/**/*.tsx`（頁面 / layout）
- `src/components/**/*.tsx`（React 元件）
- `src/hooks/**/*.ts`（自定義 hooks）
- `src/lib/api/**/*.ts`（API client）
- `src/lib/types/**/*.ts`（Zod schemas）

### 常見任務

1. **抽取 Custom Hook** → 資料邏輯從 Component 分離

```tsx
// 重構前
export default function LessonProgressPage({ params }) {
  const { data, isPending } = useQuery({
    queryKey: ['lesson-progress', params.id],
    queryFn: () => getLessonProgress(Number(params.id)),
  });
  const mutation = useMutation({
    mutationFn: (progress: number) => updateLessonProgress(Number(params.id), { progress }),
  });
  // ...
}

// 重構後
function useLessonProgress(lessonId: number) {
  const query = useQuery({
    queryKey: ['lesson-progress', lessonId],
    queryFn: () => getLessonProgress(lessonId),
  });
  const mutation = useMutation({
    mutationFn: (progress: number) => updateLessonProgress(lessonId, { progress }),
  });
  return {
    progress: query.data,
    isPending: query.isPending,
    update: mutation.mutate,
    updateStatus: mutation.status,
  };
}

export default function LessonProgressPage({ params }: { params: { id: string } }) {
  const { progress, isPending, update } = useLessonProgress(Number(params.id));
  // ...
}
```

2. **Component 組合** → 拆分過大的 Component

3. **型別加強** → 使用 Zod `z.infer`，移除 `any`

```typescript
// 重構前
type LessonProgress = {
  userId: string;
  lessonId: number;
  progress: any;  // ❌
};

// 重構後
import { z } from 'zod';

export const LessonProgressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  lessonId: z.number(),
  progress: z.number().min(0).max(100),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
});

export type LessonProgress = z.infer<typeof LessonProgressSchema>;
```

4. **Early Return / Guard Clause**

```tsx
// 重構前
function Component({ data }) {
  if (data) {
    if (data.isValid) {
      return <div>{data.content}</div>;
    }
  }
  return null;
}

// 重構後
function Component({ data }: { data: Data | null }) {
  if (!data?.isValid) return null;
  return <div>{data.content}</div>;
}
```

5. **命名清晰** → 函數名表達意圖

---

## React 特有重構模式

### Extract Custom Hook
資料取得邏輯從 Component 分離，提升可測試性與可重用性。

### Component Composition
用 `children` / render props 取代繼承或條件分支。

### Props Interface Simplification
不傳整個物件，只傳需要的欄位：

```tsx
// ❌ 傳整個物件
<UserCard user={user} />

// ✅ 只傳需要的欄位
<UserCard name={user.name} avatar={user.avatar} />
```

---

## Critical Rules

1. **每個 Phase 與每個小步驟後都跑測試**
2. **一次只做一個小重構**
3. **只抽取重複 3+ 次的邏輯**
4. **保持 Component 簡潔**
5. **不改變測試行為**
6. **移除所有 TODO 註解**
7. **遵守安全規則**（不自動抽 helpers、不跨檔搬動）

---

## 品質規範

完整 TypeScript/React 品質規範詳見 `references/code-quality/typescript.md`。
