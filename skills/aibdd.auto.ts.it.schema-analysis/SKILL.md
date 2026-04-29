---
name: aibdd.auto.ts.it.schema-analysis
description: >
  React IT 的 Schema Analysis。分析 Component Props、API Client 函式簽名、
  Zod Schemas、MSW Handler 型別，確保測試基礎建設與規格一致。
---

# Schema Analysis（React IT）

## 目的

在 Red 階段開始前，分析 `.feature` + `api.yml` 所需的 API endpoints 與資料結構，
確保現有的 Zod Schemas、API Client 函式、MSW Handlers 能滿足測試需求。
若不一致則修正或委派 `/zenbu-powers:aibdd-auto-frontend-msw-api-layer` 重建。

## 與後端 Schema Analysis 的差異

| 面向 | Web Backend | React IT |
|------|------------|----------|
| 資料結構來源 | ORM Models (SQLAlchemy / JPA) | Zod Schemas (`src/lib/types/`) |
| Migration | Alembic / Flyway | N/A（無 DB） |
| API 層 | FastAPI routes / Spring Controllers | API Client functions (`src/lib/api/`) + MSW handlers |
| 需要 Schema Analysis? | 是 | 是（驗證前端 API 層） |

---

## 分析 Checklist

### 1. 讀取規格檔案
- `.feature` — 需要的 Aggregates、UI 操作、驗證條件
- `api.yml` — API endpoints、request/response schemas
- `erm.dbml`（可選）— Entity 結構參考

### 2. 掃描前端資料型別
- `src/lib/types/` 或 `src/lib/schemas/` — Zod Schemas
- 檢查每個 api.yml 定義的 schema 是否有對應 Zod Schema
- 檢查 Zod Schema 的欄位名、型別、enum 是否與 api.yml 一致

### 3. 掃描 API Client 函式
- `src/lib/api/` — API client functions
- 檢查每個 api.yml endpoint 是否有對應的 client function
- 檢查 client function 的參數、回傳型別是否正確

### 4. 掃描 MSW Handlers
- `src/mocks/handlers/` 或 `src/test/mocks/handlers/` — MSW Handlers
- 檢查每個 endpoint 是否有 default happy-path handler
- 驗證 handler 回應結構符合 api.yml response schema

### 5. 掃描 Component Stubs
- `src/app/` 或 `src/pages/` 或 `src/components/` — React Component files
- 識別目標 Feature 需要的 Component 是否至少有 stub（可為空）

---

## GO / NO-GO 決策

| 狀態 | 行動 |
|------|------|
| 全部一致 | GO — 直接進入 Step Template |
| 缺 Zod Schema / API Client / MSW Handler | 委派 `/zenbu-powers:aibdd-auto-frontend-msw-api-layer` 補齊後 GO |
| 缺 Component Stub | 自動建立最小 stub（`<div>TODO</div>`）後 GO |
| 有衝突需人工判斷 | 暫停，報告差異 |

---

## 自動修正流程

### 缺 Zod Schema / API Client / MSW Handler
→ 呼叫 `/zenbu-powers:aibdd-auto-frontend-msw-api-layer`，此 skill 會從 `api.yml` 重新生成 Schemas / Fixtures / Handlers / Client。

### 缺 Component Stub
→ 直接建立最小 stub：

```typescript
// src/app/lessons/[id]/progress/page.tsx
'use client';

export default function LessonProgressPage({ params }: { params: { id: string } }) {
  return <div>TODO: LessonProgressPage for lesson {params.id}</div>;
}
```

### Zod Schema 欄位不齊全
→ 更新 Zod Schema，確保與 api.yml 一致：

```typescript
// src/lib/types/lesson-progress.ts
import { z } from 'zod';

export const LessonProgressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  lessonId: z.number(),
  progress: z.number().min(0).max(100),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
  updatedAt: z.string(),
});

export type LessonProgress = z.infer<typeof LessonProgressSchema>;
```

---

## 輸出

Schema Analysis 完成後產出：
- 更新後的 Zod Schemas / API Client functions / MSW handlers（若有變更）
- 新建的 Component stubs（若缺失）
- GO / NO-GO 報告

## 完成條件

- [ ] 所有 api.yml endpoints 都有對應的 Zod Schema
- [ ] 所有 api.yml endpoints 都有對應的 API Client function
- [ ] 所有 api.yml endpoints 都有對應的 default MSW handler
- [ ] 目標 Feature 的 Component 至少有 stub
- [ ] `npx tsc --noEmit` 通過（無型別錯誤）
