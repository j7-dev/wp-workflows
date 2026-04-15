# Refactor Variant: Node.js IT

## Linter / Formatter

```bash
npx tsc --noEmit                  # TypeScript 型別檢查
npx prettier --write .            # 格式化
```

## 測試命令

```bash
# 每次重構後必須執行
npx cucumber-js --tags "not @ignore"
```

## 入口

### 被 control-flow 調用

接收 `FEATURE_FILE`，直接進入重構流程。

### 獨立使用

```
請指定要重構的範圍：
1. 特定 Feature 相關的程式碼（提供 feature file 路徑）
2. 全域重構（所有已通過測試的程式碼）
```

---

## TypeScript 特有重構模式

### Type 收窄（Type Narrowing）

```typescript
// 重構前
function process(input: string | number) {
  const result = (input as string).toUpperCase();
}

// 重構後
function process(input: string | number) {
  if (typeof input === 'string') {
    return input.toUpperCase();
  }
  return input.toString();
}
```

### Discriminated Unions

```typescript
// 重構前
interface Result {
  success: boolean;
  data?: any;
  error?: string;
}

// 重構後
type Result =
  | { success: true; data: unknown }
  | { success: false; error: string };
```

### Const Assertions（替代 Enum）

```typescript
// 重構前
enum Status { IN_PROGRESS = 'IN_PROGRESS', COMPLETED = 'COMPLETED' }

// 重構後（const object + type inference）
const Status = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

type Status = typeof Status[keyof typeof Status];
```

### Zod Schema 收斂

```typescript
// 重構前：散落的 inline 驗證
if (!body.lessonId || typeof body.lessonId !== 'number') {
  throw new BusinessError('lessonId is required');
}

// 重構後：集中 Zod schema
import { z } from 'zod';

const UpdateVideoProgressSchema = z.object({
  lessonId: z.number(),
  progress: z.number().min(0).max(100),
});
```

### Import 排序

```typescript
// 1. Node.js 內建
import assert from 'assert/strict';

// 2. 第三方套件
import { Given, When, Then } from '@cucumber/cucumber';
import { eq, and } from 'drizzle-orm';
import supertest from 'supertest';

// 3. 本地模組
import { TestWorld } from '../../support/world';
import { lessonProgress } from '../../../src/db/schema';
```

### Cucumber Step 整理

- 一個 step 一個檔案
- 共用 helpers 提取到 `steps/helpers/`
- 狀態映射 const object 集中定義

```typescript
// steps/helpers/status-mapping.ts
export const STATUS_MAP: Record<string, string> = {
  '進行中': 'IN_PROGRESS',
  '已完成': 'COMPLETED',
  '未開始': 'NOT_STARTED',
};

export function mapStatus(chinese: string): string {
  return STATUS_MAP[chinese] ?? chinese;
}
```

---

## 常見重構方向

### Step Definition 層
- 提取共用的 Given 步驟到 helpers
- 統一 `this.ids` 的使用模式（抽 `getUserId(world, name)` helper）
- 消除重複的 status mapping 邏輯
- 改善 DataTable 解析的可讀性

### Service 層
- 提取業務規則為獨立方法
- 消除過長的方法
- 統一異常處理模式（`BusinessError` hierarchy）
- Early Return / Guard Clause

### Route 層
- 統一回應格式
- 提取共用的驗證邏輯（Zod schema middleware）
- async error wrapper（避免重複 try/catch）

### Repository 層
- 方法命名一致性
- 查詢優化（使用 Drizzle relational queries）

---

## 品質規範

完整 Node.js/TypeScript 品質規範詳見 `references/code-quality/nodejs.md`。
