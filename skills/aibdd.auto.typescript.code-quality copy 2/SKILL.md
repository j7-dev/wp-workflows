---
name: aibdd.auto.typescript.code-quality
description: TypeScript 程式碼品質規範合集。包含 SOLID 設計原則、Step Definition 組織規範、StepDef Meta 註記清理、日誌實踐、程式架構、程式碼品質等六項規範。供 refactor 階段嚴格遵守。
user-invocable: false
---

# SOLID 設計原則

## 目的

確保程式碼好讀、好維護、好擴充。重構時必須遵守這些原則。

---

## S - Single Responsibility Principle（單一職責原則）

每個模組/函式只負責一件事。

**範例：**
```typescript
// ❌ 元件做太多事
function LessonPage() {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate() {
    // 驗證權限
    if (!currentUser) throw new Error('未登入');
    // 呼叫 API
    const res = await fetch('/api/progress', { method: 'POST', body: ... });
    // 處理回應
    if (!res.ok) setError('更新失敗');
    // 發送通知
    toast.success('更新成功');
  }
  // ...
}

// ✅ 職責分離
function LessonPage() {
  const { progress, updateProgress, error } = useLessonProgress(lessonId);
  return <ProgressPanel progress={progress} onUpdate={updateProgress} error={error} />;
}

function useLessonProgress(lessonId: number) {
  // Hook 封裝 API 呼叫邏輯
}
```

---

## O - Open/Closed Principle（開放封閉原則）

對擴展開放，對修改封閉。新增功能時應透過擴展而非修改現有程式碼。

```typescript
// ✅ 使用策略模式
interface PaymentStrategy {
  pay(order: Order): Promise<void>;
}

class CreditCardPayment implements PaymentStrategy {
  async pay(order: Order) { /* 信用卡支付 */ }
}

class LinePayPayment implements PaymentStrategy {
  async pay(order: Order) { /* LINE Pay */ }
}

// 新增支付方式只需新增 class，不修改現有程式碼
```

---

## L - Liskov Substitution Principle（里氏替換原則）

子型別應該可以替換父型別而不影響程式正確性。

---

## I - Interface Segregation Principle（介面隔離原則）

不應強迫客戶端依賴它不需要的介面。

```typescript
// ❌ 過大的介面
interface UserService {
  createUser(): Promise<void>;
  updateUser(): Promise<void>;
  deleteUser(): Promise<void>;
  sendEmail(): Promise<void>;      // 不是所有實作都需要
  generateReport(): Promise<void>; // 不是所有實作都需要
}

// ✅ 介面隔離
interface UserCrudService {
  createUser(): Promise<void>;
  updateUser(): Promise<void>;
  deleteUser(): Promise<void>;
}

interface EmailService {
  sendEmail(): Promise<void>;
}
```

---

## D - Dependency Inversion Principle（依賴反轉原則）

高層模組不應依賴低層模組，兩者都應依賴抽象。

```typescript
// ✅ 透過介面抽象化 API 呼叫
interface LessonProgressApi {
  updateProgress(userId: string, lessonId: number, progress: number): Promise<void>;
  getProgress(userId: string, lessonId: number): Promise<ProgressData>;
}

// 生產環境使用真實 API
class HttpLessonProgressApi implements LessonProgressApi { /* fetch */ }

// 測試環境使用 MSW Mock
// MSW handlers 提供假的 API 回應
```

---

## 檢查清單

- [ ] 每個模組/函式只負責一件事
- [ ] API 呼叫邏輯封裝在獨立的 client 模組中
- [ ] 高層模組不直接依賴低層模組
- [ ] 介面不過大，按職責分離

---

**文件版本**：E2E Playwright + Cucumber BDD Version 1.0
**適用框架**：TypeScript 5.2+ + React 18 + Playwright + @cucumber/cucumber

---

# Step Definition 組織規範

## 目的

確保 Cucumber Step Definition 檔案組織清晰、易於維護。

---

## 組織原則

- 一個 Step Pattern 對應一個 TypeScript 函式
- 使用目錄分類（`aggregateGiven`, `commands`, `query` 等）
- 語意化檔案名稱（避免 `steps.ts` 這類大雜燴）

---

## 目錄結構範例

```
tests/
├── features/
│   └── *.feature
├── steps/
│   ├── {subdomain}/               # 按業務領域分（例：lesson, order）
│   │   ├── aggregateGiven.ts      # Given: 設定 MSW mock 資料
│   │   ├── commands.ts            # When: 使用者互動（click, type）
│   │   ├── query.ts               # When: 頁面導航（goto, waitFor）
│   │   ├── aggregateThen.ts       # Then: 驗證 API 被正確呼叫
│   │   └── readmodelThen.ts       # Then: 驗證頁面內容
│   └── commonThen.ts              # Then: 通用驗證（成功/失敗 UI 回饋）
├── support/
│   ├── world.ts                   # Custom World class
│   ├── hooks.ts                   # Before/After hooks
│   └── msw/
│       ├── handlers.ts            # MSW handlers
│       └── fixtures.ts            # Test fixtures
├── cucumber.js                    # Cucumber config
└── playwright.config.ts
```

---

## Step Definition 範例

```typescript
// tests/steps/lesson/aggregateGiven.ts
import { Given } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';

Given('用戶 {string} 在課程 {int} 的進度為 {int}%，狀態為 {string}',
  async function (this: CustomWorld, userName: string, lessonId: number, progress: number, status: string) {
    // 設定 MSW mock 回應
  }
);
```

---

## 檢查清單

- [ ] 使用目錄分類組織 step definitions
- [ ] 檔案名稱語意化（如 `aggregateGiven.ts`）
- [ ] 共用邏輯已提取到 `support/`
- [ ] MSW handlers 和 fixtures 放在 `support/msw/`

---

**文件版本**：E2E Playwright + Cucumber BDD Version 1.0
**適用框架**：TypeScript 5.2+ + React 18 + Playwright + @cucumber/cucumber

---

# Meta 註記清理規範

## 目的

移除開發過程中的臨時註記，保持程式碼乾淨。

---

## 刪除的內容

- `// TODO: [事件風暴部位: ...]`
- `// TODO: 參考 xxx-Handler 實作`
- `// [生成參考 Prompt: ...]`
- 其他開發過程中的臨時標記

---

## 保留的內容

- 必要的業務邏輯註解
- 必要的技術註解（如解釋複雜邏輯）
- JSDoc / TSDoc 文檔註解

---

## 範例

**重構前：**
```typescript
Given('用戶 {string} 在課程 {int} 的進度為 {int}%，狀態為 {string}',
  async function (this: CustomWorld, userName: string, lessonId: number, progress: number, status: string) {
    // TODO: [事件風暴部位: Aggregate - LessonProgress]
    // TODO: 參考 /aibdd.auto.typescript.e2e.handlers.aggregate-given 實作

    const statusMap: Record<string, string> = { '進行中': 'IN_PROGRESS', ... };
    // ...
  }
);
```

**重構後：**
```typescript
Given('用戶 {string} 在課程 {int} 的進度為 {int}%，狀態為 {string}',
  async function (this: CustomWorld, userName: string, lessonId: number, progress: number, status: string) {
    // 狀態映射（中文 → 英文 enum）
    const dbStatus = mapStatus(status);
    // ...
  }
);
```

---

## 檢查清單

- [ ] 所有 `// TODO: [事件風暴部位: ...]` 已刪除
- [ ] 所有 `// TODO: 參考 xxx-Handler 實作` 已刪除
- [ ] 所有 `// [生成參考 Prompt: ...]` 已刪除
- [ ] 必要的業務邏輯註解已保留

---

**文件版本**：E2E Playwright + Cucumber BDD Version 1.0
**適用框架**：TypeScript 5.2+ + React 18 + Playwright + @cucumber/cucumber

---

# 日誌實踐規範

## 目的

前端 E2E 測試的日誌規範，確保測試輸出清晰可讀。

---

## 日誌等級使用規則

### console.error — 測試基礎設施錯誤

```typescript
console.error('MSW handler setup failed:', error);
```

### console.warn — 預期內的異常狀況

```typescript
console.warn('Element not found, retrying...');
```

### console.info — 測試流程關鍵步驟

```typescript
console.info('Navigating to:', url);
console.info('API call intercepted:', method, path);
```

### console.debug — 詳細除錯資訊

```typescript
console.debug('MSW fixture data:', JSON.stringify(fixture));
```

---

## 禁止事項

- ❌ 不要在 step definitions 中使用 `console.log`（改用適當的等級）
- ❌ 不要記錄敏感資訊（密碼、token 等）
- ❌ 不要在迴圈中記錄大量資訊

---

**文件版本**：E2E Playwright + Cucumber BDD Version 1.0
**適用框架**：TypeScript 5.2+ + React 18 + Playwright + @cucumber/cucumber

---

# 程式架構規範

## 目的

定義前端 E2E 測試的程式碼組織結構和職責分層。

---

## 檔案組織結構

### 應用程式程式碼（被測試對象）

```
src/
├── components/                    # React 元件（綠燈階段實作）
├── hooks/                         # Custom hooks
├── pages/                         # 頁面元件 / 路由
├── api/                           # API client (fetch wrapper)
│   └── client.ts
├── schemas/                       # Zod schemas（MSW skill 產出）
│   └── lessonProgress.ts
└── types/                         # TypeScript types (z.infer)
```

### 測試程式碼

```
tests/
├── features/                      # Gherkin Feature Files
├── steps/                         # Step Definitions（按 subdomain 分類）
├── support/                       # 測試支援（World, hooks, MSW）
│   ├── world.ts
│   ├── hooks.ts
│   └── msw/
│       ├── handlers.ts
│       └── fixtures.ts
├── cucumber.js                    # Cucumber config
└── playwright.config.ts
```

---

## 分層架構

### Layer 1: React Components（頁面/元件）

**職責**：UI 呈現和使用者互動
- 定義路由和頁面結構
- 處理使用者事件（click, type, submit）
- 呼叫 API client 或 custom hooks

### Layer 2: API Client

**職責**：封裝 HTTP 請求
- 定義 API 呼叫函式
- 使用 Zod schema 驗證回應
- 處理 HTTP 錯誤

### Layer 3: MSW Handlers（測試層）

**職責**：Mock 後端 API
- 攔截 HTTP 請求
- 回傳預定義的 fixture 資料
- 記錄 API 呼叫以供驗證

---

## 檢查清單

- [ ] React 元件在 `src/components/` 或 `src/pages/`
- [ ] API client 在 `src/api/`
- [ ] Zod schemas 在 `src/schemas/`
- [ ] Step definitions 按 subdomain 分目錄
- [ ] MSW handlers 在 `tests/support/msw/`

---

**文件版本**：E2E Playwright + Cucumber BDD Version 1.0
**適用框架**：TypeScript 5.2+ + React 18 + Playwright + @cucumber/cucumber

---

# 程式碼品質規範

## 目的

提升程式碼可讀性、可維護性，減少重複和複雜度。

---

## Early Return 原則

```typescript
// ❌ 深層巢狀
async function handleSubmit(data: FormData) {
  if (data) {
    if (data.isValid()) {
      if (currentUser) {
        await submitForm(data);
      }
    }
  }
}

// ✅ Early return
async function handleSubmit(data: FormData) {
  if (!data) return;
  if (!data.isValid()) throw new ValidationError();
  if (!currentUser) throw new AuthError();
  await submitForm(data);
}
```

---

## 常數提取

```typescript
// ❌ 每次都創建
function mapStatus(status: string): string {
  const mapping: Record<string, string> = {
    '進行中': 'IN_PROGRESS',
    '已完成': 'COMPLETED',
  };
  return mapping[status] ?? status;
}

// ✅ 模組層級常數
const STATUS_MAP: Record<string, string> = {
  '進行中': 'IN_PROGRESS',
  '已完成': 'COMPLETED',
};

function mapStatus(status: string): string {
  return STATUS_MAP[status] ?? status;
}
```

---

## 命名清晰化

```typescript
// ❌ 不清楚的命名
const res = await fetch(url);
const d = await res.json();

// ✅ 清晰的命名
const response = await fetch(progressApiUrl);
const progressData = await response.json();
```

---

## DRY 原則

```typescript
// ❌ 重複的 ID 查詢邏輯
When('用戶 {string} 更新...', async function (this: CustomWorld, userName: string) {
  const userId = this.ids[userName];
  if (!userId) throw new Error(`找不到 '${userName}' 的 ID`);
  // ...
});

When('用戶 {string} 查詢...', async function (this: CustomWorld, userName: string) {
  const userId = this.ids[userName];
  if (!userId) throw new Error(`找不到 '${userName}' 的 ID`);
  // ...
});

// ✅ 提取共用方法
function getUserId(world: CustomWorld, userName: string): string {
  const userId = world.ids[userName];
  if (!userId) throw new Error(`找不到 '${userName}' 的 ID`);
  return userId;
}
```

---

## 型別安全

```typescript
// ❌ 使用 any
const data: any = await response.json();

// ✅ 使用 Zod schema 驗證
import { progressSchema } from '../../src/schemas/lessonProgress';
const data = progressSchema.parse(await response.json());
```

---

## 檢查清單

- [ ] 使用 Early Return 減少巢狀
- [ ] 重複使用的資料提升為模組常數
- [ ] 變數和函式名稱清晰表達用途
- [ ] 消除重複邏輯，提取共用函式
- [ ] 使用 Zod schema 確保型別安全

---

**文件版本**：E2E Playwright + Cucumber BDD Version 1.0
**適用框架**：TypeScript 5.2+ + React 18 + Playwright + @cucumber/cucumber
