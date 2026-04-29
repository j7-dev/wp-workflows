---
name: aibdd.auto.ts.it.refactor
description: >
  React IT Stage 5：重構階段。在測試保護下改善程式碼品質，小步前進，
  嚴格遵守 /aibdd.auto.ts.it.code-quality 規範。
  當 /aibdd.auto.ts.it.control-flow 呼叫重構階段，或使用者說「重構」「refactor」時觸發。
---

# 重構階段（React IT）

在測試保護下，小步驟改善程式碼品質。

## 入口

### 被 control-flow 調用
接收 `FEATURE_FILE` 參數，直接進入重構流程。

### 獨立使用
詢問目標範圍（特定 Feature 或全域），確認綠燈後進入重構流程。

---

## 兩階段工作流

```
執行測試（確認綠燈）
    │
    ▼
【Phase A】重構測試碼（test files / helpers / factories）
    │
    ▼
執行測試（確認仍然綠燈）
    │
    ▼
【Phase B】重構產品碼（components / hooks / utils / api client）
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
- **每步測試** — 每次小重構後立即跑 `npx vitest run`，失敗立即還原
- **一次一件事** — 不同時重構多個部分
- **不改外部行為** — 重構不加新功能、不改 API 契約、不改 Zod schemas
- **禁止自動抽 helpers** — 除非使用者明確要求，否則不新增共用模組
- **禁止跨檔搬動** — 優先在原檔案內做最小改善；跨檔需先徵詢
- **三次以上再抽** — 重複兩次可接受，三次以上才抽取

---

## Phase A：測試程式碼重構

### 範圍

- `src/__tests__/**/*.integration.test.tsx`（測試檔）
- `src/test/helpers/**/*.ts(x)`（render helper, user-event helper, msw-utils）
- `src/test/factories/**/*.ts`（test data factories）
- `src/test/mocks/**/*.ts`（MSW handlers, server）

### 常見任務

1. **移除 TODO 註解** → 替換為有意義的 JSDoc

```typescript
// 重構前
it('進度從 70% 更新到 80%', async () => {
  // TODO: [States Prepare: aggregate-given] MSW handler for LessonProgress
  // TODO: [Operation Invocation: command] user-event
  // ...
});

// 重構後
it('進度從 70% 更新到 80%', async () => {
  // 前置狀態：Alice 在課程 1 的進度為 70%
  server.use(...);
  // 使用者互動：填寫 80, 點擊更新
  // ...
});
```

2. **抽取重複 MSW setup** → 提升到 `beforeEach` 或 factory

3. **改善查詢選擇器** → `getByText('submit')` → `getByRole('button', { name: /送出/i })`

4. **類型標註完整** → `const requestRef = captureMswRequest(...)` 確保泛型明確

---

## Phase B：生產程式碼重構

### 範圍

- `src/app/**/*.tsx`（頁面 / layout）
- `src/components/**/*.tsx`（React 元件）
- `src/hooks/**/*.ts`（自定義 hooks）
- `src/lib/api/**/*.ts`（API client functions）
- `src/lib/types/**/*.ts`（Zod schemas）

### 常見任務

1. **抽取 Custom Hook** → 資料取得邏輯從 Component 分離

```tsx
// 重構前
export default function LessonProgressPage({ params }) {
  const { data, isPending } = useQuery({
    queryKey: ['lesson-progress', params.id],
    queryFn: () => getLessonProgress(Number(params.id)),
  });
  const mutation = useMutation({ ... });
  // ...
}

// 重構後
function useLessonProgress(lessonId: number) {
  const query = useQuery({ ... });
  const mutation = useMutation({ ... });
  return { ...query, update: mutation.mutate };
}

export default function LessonProgressPage({ params }) {
  const { data, isPending, update } = useLessonProgress(Number(params.id));
  // ...
}
```

2. **Component 組合** → 拆分過大的元件

```tsx
// 重構前：一個 Component 處理 display + form + validation
export default function LessonProgressPage() {
  return <div>{/* 100+ lines */}</div>;
}

// 重構後：職責分離
export default function LessonProgressPage({ params }) {
  return (
    <>
      <ProgressDisplay lessonId={Number(params.id)} />
      <ProgressUpdateForm lessonId={Number(params.id)} />
    </>
  );
}
```

3. **Early Return / Guard Clause** → 減少巢狀

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
  if (!data) return null;
  if (!data.isValid) return null;
  return <div>{data.content}</div>;
}
```

4. **型別加強** → 移除 `any`，改用 Zod infer

5. **命名清晰** → `process` → `updateVideoProgress`

---

## 測試命令

```bash
# 每次重構後必須執行
npx vitest run

# 特定測試檔（快速迭代）
npx vitest run src/__tests__/{feature-slug}.integration.test.tsx

# 型別檢查
npx tsc --noEmit

# Linter
npx eslint src/
```

---

## 重構邊界

- 不加新功能
- 不改測試行為（除非重構測試程式碼本身）
- 不改 API 契約（api.yml）
- 不改 Zod schemas 的對外型別（可內部改善結構）
- 不做效能優化（除非明顯問題）

---

## 完成條件

- [ ] 測試仍全數通過（零失敗、零 warnings）
- [ ] `npx tsc --noEmit` 通過
- [ ] `npx eslint src/` 通過（或僅剩無害警告）
- [ ] 所有 TODO/META 標記已清除
- [ ] Meta 清理完成（無殘留樣板階段的註解）
- [ ] 測試輸出乾淨（無 `act(...)` warnings、無 MSW unhandled request）

---

## 品質規範

完整 React IT 程式碼品質規範詳見 `/zenbu-powers:aibdd.auto.ts.it.code-quality`。核心面向：

1. SOLID for React（一元件一職責、依賴 hooks 抽象）
2. Testing-Library 最佳實踐（`getByRole` > `getByTestId`、`userEvent` > `fireEvent`）
3. TypeScript 嚴格型別（禁 `any`）
4. 測試檔案組織（一 feature 一 test file）
5. MSW Handler 品質（型別安全）
6. Meta 清理（移除所有 TODO）
