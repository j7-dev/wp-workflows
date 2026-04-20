# 命名規範與目錄結構

## 檔案命名

| 類型 | 命名 | 範例 |
|------|------|------|
| Module | `xxx.module.ts` | `users.module.ts` |
| Controller | `xxx.controller.ts` | `users.controller.ts` |
| Service | `xxx.service.ts` | `users.service.ts` |
| Repository | `xxx.repository.ts` | `users.repository.ts` |
| TypeORM Entity | `xxx.entity.ts` | `user.entity.ts` |
| Prisma Service wrapper | `prisma.service.ts` | 單一檔 |
| DTO | `xxx.dto.ts` | `create-user.dto.ts`, `update-user.dto.ts` |
| Guard | `xxx.guard.ts` | `jwt-auth.guard.ts`, `roles.guard.ts` |
| Interceptor | `xxx.interceptor.ts` | `timing.interceptor.ts` |
| Pipe | `xxx.pipe.ts` | `trim.pipe.ts` |
| Filter | `xxx.filter.ts` | `all-exceptions.filter.ts` |
| Middleware | `xxx.middleware.ts` | `logger.middleware.ts` |
| Decorator | `xxx.decorator.ts` | `current-user.decorator.ts` |
| Exception | `xxx.exception.ts` | `order-not-found.exception.ts` |
| Strategy (Passport) | `xxx.strategy.ts` | `jwt.strategy.ts` |
| Test | `xxx.spec.ts` | `users.service.spec.ts` |
| E2E Test | `xxx.e2e-spec.ts` | `orders.e2e-spec.ts` |
| Constants | `xxx.constants.ts` | `error-codes.constants.ts` |
| Types | `xxx.types.ts` 或 `xxx.interface.ts` | `pagination.types.ts` |

---

## Class / Interface / 變數命名

### Class：PascalCase + 類型 suffix

```typescript
// ✅ 對應檔名
export class UsersController {}        // users.controller.ts
export class UsersService {}           // users.service.ts
export class UsersRepository {}        // users.repository.ts
export class CreateUserDto {}          // create-user.dto.ts
export class JwtAuthGuard {}           // jwt-auth.guard.ts
export class OrderNotFoundException extends HttpException {}
```

### Interface / Type：PascalCase

```typescript
// ✅ 介面不加 I 前綴（TS 官方風格）
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
}

// Type alias
export type UserRole = 'admin' | 'user' | 'guest';

// 專案若採 T 前綴（如 WordPress 前端），保持一致
export type TUser = { id: number; email: string };
```

### Enum：PascalCase + 成員 PascalCase

```typescript
export enum OrderStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
}

// 或用 as const（type-safe 且不生成 runtime 物件）
export const ORDER_STATUS = {
  Pending: 'pending',
  Confirmed: 'confirmed',
  Cancelled: 'cancelled',
} as const;
export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];
```

### 變數：camelCase，描述性

```typescript
// ✅ 描述清楚
const activeUsers = await this.usersRepo.findActive();
const isEmailVerified = user.emailVerifiedAt !== null;
const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

// ❌ 不清楚
const u = await this.usersRepo.findActive();
const flag = user.emailVerifiedAt !== null;
const x = orders.filter(o => o.status === 'pending').length;
```

### 常數：UPPER_SNAKE_CASE

```typescript
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
export const DEFAULT_PAGE_SIZE = 20;
export const JWT_EXPIRATION = '1h';
```

### 函式：camelCase + 動詞-名詞

```typescript
// ✅ 動詞開頭
async function createUser(dto: CreateUserDto): Promise<User> {}
function calculateTotal(items: OrderItem[]): number {}
function isValidEmail(email: string): boolean {}
function hasPermission(user: User, action: string): boolean {}
async function fetchOrderHistory(userId: number) {}

// ❌ 不清楚
async function user(dto: any) {}
function total(items: any) {}
```

### 私有成員：加 `private`（不用 `_` 前綴）

```typescript
@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepo: OrdersRepository,  // readonly 對 DI 標配
  ) {}

  async create() {
    return this.validateAndPersist();
  }

  // ✅ 用 private，不用 _prefix
  private validateAndPersist() {}
}
```

---

## 目錄結構（Feature-first）

### 推薦結構

```
src/
├── main.ts
├── app.module.ts
├── common/                      # 跨模組共用
│   ├── decorators/
│   ├── filters/
│   │   └── all-exceptions.filter.ts
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   ├── constants/
│   └── types/
├── config/                      # 設定
│   ├── config.module.ts
│   ├── database.config.ts
│   └── jwt.config.ts
├── auth/                        # 認證 feature
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── local.strategy.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── local-auth.guard.ts
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   └── dto/
│       ├── login.dto.ts
│       └── register.dto.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.repository.ts
│   ├── entities/
│   │   └── user.entity.ts
│   └── dto/
│       ├── create-user.dto.ts
│       ├── update-user.dto.ts
│       └── user-response.dto.ts
├── orders/
│   └── ...（同上結構）
└── prisma/                      # Prisma 專案
    ├── prisma.module.ts
    ├── prisma.service.ts
    └── schema.prisma

test/                            # E2E 測試
├── app.e2e-spec.ts
├── auth.e2e-spec.ts
├── orders.e2e-spec.ts
└── jest-e2e.json
```

### 結構原則

- **Feature-first** > Layer-first：按業務領域切，不按技術層切（不要 `src/controllers/`、`src/services/`）
- **一個 feature 一個資料夾**：所有相關檔案放一起
- **巢狀上限 3 層**：`users/dto/create-user.dto.ts` ✅，`users/dto/create/user/create-user.dto.ts` ❌
- **common/ 只放真正共用的**：一個 feature 用的工具就放該 feature 內
- **測試與原始碼**：
  - Unit / Integration：與原始碼同層 `users.service.spec.ts`
  - E2E：獨立 `test/` 目錄

---

## 路徑別名（`tsconfig.json`）

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@test/*": ["test/*"]
    }
  }
}
```

### 匯入順序

```typescript
// 1. Node.js 內建
import { readFileSync } from 'fs';

// 2. 外部套件（先框架，再第三方）
import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { lastValueFrom } from 'rxjs';

// 3. 專案內（用別名）
import { UsersRepository } from '@/users/users.repository';
import { OrdersRepository } from '@/orders/orders.repository';

// 4. 相對路徑（同 feature 內才用）
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderNotFoundException } from './exceptions';

// 5. Type-only import
import type { PaginatedResult } from '@/common/types';
```

---

## 符號匯出

### 優先 named export

```typescript
// ❌ 避免 default export（refactor 時改名困難）
export default class UsersService {}

// ✅ named export
export class UsersService {}
```

### 模組內公開面（barrel file）

```typescript
// users/index.ts（選擇性，若 Module 有穩定對外 API）
export { UsersModule } from './users.module';
export { UsersService } from './users.service';
export type { User } from './entities/user.entity';

// 注意：不要 export Repository（內部實作）
```

---

## 常見反模式

- ❌ Layer-first 目錄（`controllers/`、`services/`、`repositories/` 分開放）
- ❌ `*.ts` 不帶類型 suffix（看不出是 service 還是 controller）
- ❌ DTO 放在 Controller 檔案內（應該獨立檔）
- ❌ Default export（refactor 改名時 TypeScript 追不到）
- ❌ 巢狀過深（> 3 層）
- ❌ 相對路徑爬樓梯（`../../../../../`，用別名）
