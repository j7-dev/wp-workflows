# Node.js / TypeScript 程式碼品質規範

供重構階段嚴格遵守。涵蓋 SOLID、Step Definition 組織、Meta 清理、日誌實踐、程式架構、程式碼品質。

---

## 1. SOLID 設計原則

### S — 單一職責

每個類別/函式只負責一件事。

```typescript
// ❌ Service 做太多事
class AssignmentService {
  async submitAssignment(userId: string, content: string) {
    this.checkPermission(userId);
    await this.repository.save({ userId, content });
    await this.sendEmail(userId);
  }
}

// ✅ 職責分離
class AssignmentService {
  constructor(
    private assignmentRepo: AssignmentRepository,
    private permissionValidator: PermissionValidator,
    private notificationService: NotificationService,
  ) {}

  async submitAssignment(userId: string, content: string) {
    this.permissionValidator.validate(userId);
    await this.assignmentRepo.save({ userId, content });
    await this.notificationService.notify(userId);
  }
}
```

### O — 開放封閉

對擴展開放，對修改封閉。新增功能時透過擴展（interface、策略模式）而非修改現有程式碼。

### L — 里氏替換

子類別/實作可安全替換介面。

### I — 介面隔離

不強迫實作不需要的方法。使用 TypeScript interface 定義精簡的契約。

### D — 依賴反轉

高層模組不依賴低層模組。Service 透過建構子注入 Repository。

```typescript
// ✅ DI
class LessonProgressService {
  constructor(
    private lessonProgressRepo: LessonProgressRepository,
    private journeySubscriptionRepo: JourneySubscriptionRepository,
  ) {}
}
```

---

## 2. Step Definition 組織規範

### 組織原則

- 一個 Step Pattern 對應一個 TypeScript module（`.ts` 檔案）
- 使用目錄分類（`aggregate_given/`, `commands/`, `query/` 等）
- 語意化檔名（避免 `steps.ts` 大雜燴）

### 目錄結構

```
features/steps/
├── {subdomain}/
│   ├── aggregate_given/
│   │   ├── lesson-progress.ts
│   │   └── user.ts
│   ├── commands/
│   │   └── update-video-progress.ts
│   ├── query/
│   │   └── get-lesson-progress.ts
│   ├── aggregate_then/
│   │   └── lesson-progress.ts
│   └── readmodel_then/
│       └── progress-result.ts
├── common_then/
│   ├── success.ts
│   ├── failure.ts
│   └── error-message.ts
└── helpers/
    ├── status-mapping.ts
    └── context-helpers.ts
```

### 共用邏輯

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

```typescript
// steps/helpers/context-helpers.ts
import { TestWorld } from '../../support/world';

export function getUserId(world: TestWorld, userName: string): string | number {
  const id = world.ids[userName];
  if (id === undefined) {
    throw new Error(`找不到用戶 '${userName}' 的 ID，請先建立用戶`);
  }
  return id;
}
```

---

## 3. Meta 註記清理

### 刪除

- `// TODO: [事件風暴部位: ...]`
- `// TODO: 參考 xxx-Handler.md 實作`
- `// [生成參考 Prompt: ...]`
- 其他開發過程臨時標記

### 保留

- 必要的業務邏輯註解
- JSDoc 文件
- 必要的技術註解

### 範例

```typescript
// 重構前
Given('...', async function (this: TestWorld, ...) {
  // TODO: [事件風暴部位: Aggregate - LessonProgress]
  // TODO: 參考 Aggregate-Given-Handler.md 實作
  // ...
});

// 重構後
Given('...', async function (this: TestWorld, ...) {
  /** 建立用戶的課程進度初始狀態 */
  // ...
});
```

---

## 4. 日誌實踐

### 框架

小型專案使用 `console` 結構化輸出，中大型專案使用 pino。

```typescript
// 小型專案
console.info('[LessonProgressService] Progress updated: userId=%s, lessonId=%d', userId, lessonId);

// 大型專案（使用 pino）
import pino from 'pino';
const logger = pino({ name: 'LessonProgressService' });
logger.info({ userId, lessonId }, 'Progress updated');
```

### 等級規則

| 等級 | 用途 | 範例 |
|------|------|------|
| error | 未預期錯誤，含 stack trace | `console.error('Unexpected:', err)` |
| warn | 認證失敗、權限不足 | `console.warn('Expired JWT for %s %s', method, path)` |
| info | 業務關鍵操作（寫入完成） | `console.info('Order created: orderNumber=%s', ...)` |
| debug | 詳細流程、查詢結果數量 | `console.debug('Fetching order=%s for userId=%s', ...)` |

### 格式規則

- 使用 `%s`/`%d` 佔位符或結構化物件
- 使用 `key=value` 格式（方便 grep 搜尋）
- 訊息前加事件描述（`Order created:`, `Payment submitted:`）

### 禁止

- ❌ `console.log()` 用於生產程式碼（除 debug 外）
- ❌ 在迴圈中用 `console.info`
- ❌ 記錄敏感資訊（密碼、JWT token 全文）

---

## 5. 程式架構規範

### 分層

```
src/
├── routes/          # Express Routes（HTTP 轉換）
├── services/        # Business Logic
├── repositories/    # Data Access（Drizzle ORM）
├── db/
│   ├── schema.ts    # Drizzle Schema（Table 定義）
│   ├── index.ts     # DB Connection
│   └── migrations/  # SQL Migration Files
├── schemas/         # Zod Validation Schemas
├── middleware/      # Express Middleware（JWT, Error Handler）
├── errors.ts        # Custom Error Classes
└── app.ts           # Express App Factory
```

### 各層職責

| 層 | 負責 | 不負責 |
|----|------|--------|
| Routes | 路由、解析 Request、構建 Response、套用 middleware | 業務邏輯、資料存取 |
| Service | 業務規則、協調 Repository、拋業務異常 | HTTP 處理、直接操作 DB |
| Repository | Drizzle CRUD、封裝查詢 | 業務規則 |

### 依賴注入

Service 透過建構子接收 Repository，Route factory 建立 Service。

```typescript
// routes/orders.ts
export function orderRoutes(db: NodePgDatabase): Router {
  const repository = new OrderRepository(db);
  const service = new OrderService(repository);
  // ...
}
```

### 常見錯誤

- ❌ 業務邏輯寫在 Route handler
- ❌ Service 直接使用 `db.select()` 繞過 Repository
- ❌ Domain 程式碼放在 `features/` 測試目錄

---

## 6. 程式碼品質

### Early Return

```typescript
// ❌ 深層巢狀
function process(data: Data | null) {
  if (data) {
    if (data.isValid()) {
      return processData(data);
    }
  }
}

// ✅ Guard Clause
function process(data: Data | null) {
  if (!data) throw new NotFoundError('Data not found');
  if (!data.isValid()) throw new BusinessError('Invalid data');
  return processData(data);
}
```

### Const Object 替代 Magic String

```typescript
// ❌ 每次調用都創建
function process(status: string) {
  const mapping: Record<string, string> = { A: '狀態A', B: '狀態B' };
  return mapping[status];
}

// ✅ Module-level const
const STATUS_MAPPING = { A: '狀態A', B: '狀態B' } as const;

function process(status: string) {
  return STATUS_MAPPING[status as keyof typeof STATUS_MAPPING];
}
```

### DRY

重複 3+ 次的邏輯提取共用方法。

### 命名

- 函數名表達意圖（`updateVideoProgress` 而非 `process`）
- 布林變數用 `is`/`has`/`can` 開頭
- 使用 kebab-case 檔名（`lesson-progress-service.ts`）

### TypeScript 型別

- 所有 public 函式參數與回傳值加上型別標註
- 避免 `any`，使用 `unknown` + type narrowing
- 用 Drizzle `$inferInsert` / `$inferSelect` 推導 Entity 型別
- 避免過度使用型別 assertion（`as`）

---

## 檢查清單

- [ ] 每個類別/函式只負責一件事（SRP）
- [ ] Service 透過建構子注入 Repository（DIP）
- [ ] 一個 Step Pattern 一個 module
- [ ] 所有 TODO/META 標記已清除
- [ ] 日誌使用結構化格式 + key=value
- [ ] Routes/Services/Repositories 在正確的 `src/` 子目錄
- [ ] 使用 Early Return 減少巢狀
- [ ] 重複資料提升為 module-level const
- [ ] 命名清晰表達用途
- [ ] 檔名使用 kebab-case
- [ ] 無 `any` 型別（除非有明確理由）
