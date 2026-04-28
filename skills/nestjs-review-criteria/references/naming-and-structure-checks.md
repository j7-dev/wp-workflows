# 命名與結構審查

## Checklist

### 檔案命名
- [ ] 類型 suffix 正確（`.controller.ts` / `.service.ts` / `.repository.ts` / `.dto.ts` / `.entity.ts`）
- [ ] kebab-case（`create-user.dto.ts`，不是 `CreateUser.dto.ts` 或 `createUser.dto.ts`）
- [ ] 測試檔：`*.spec.ts`（單元/整合）/ `*.e2e-spec.ts`（e2e）

### Class 命名
- [ ] PascalCase + 類型 suffix（`UsersController`、`UsersService`、`CreateUserDto`）
- [ ] Exception 類別以 `Exception` 結尾（`OrderNotFoundException`）
- [ ] Guard / Pipe / Filter / Interceptor / Strategy 類別有對應 suffix

### 變數 / 方法
- [ ] camelCase
- [ ] 描述性命名（不用 `data`、`temp`、`x`、`flag`）
- [ ] 函式用動詞-名詞（`createOrder`、`calculateTotal`、`findActiveUsers`）
- [ ] 布林變數用 `is` / `has` / `can` 前綴（`isActive`、`hasPermission`、`canEdit`）

### 常數
- [ ] 大寫常數用 UPPER_SNAKE_CASE
- [ ] 有限值集合用 `as const` 或 `enum`，不用 magic string

### 目錄結構
- [ ] Feature-first（按業務領域切資料夾，不按技術層切）
- [ ] 每個 feature 自成一個資料夾含 `.module.ts`
- [ ] `common/` 只放真正跨 feature 共用的
- [ ] 巢狀深度 ≤ 3 層

### Import
- [ ] 使用路徑別名（`@/users/...`）而非長 `../../../`
- [ ] Import 分組（node → 外部套件 → 專案內 → 相對路徑）
- [ ] 優先 named export，避免 default export

---

## 常見問題與嚴重性

### 🟠 重要：Layer-first 目錄結構

```
❌ Before
src/
├── controllers/
│   ├── users.controller.ts
│   ├── orders.controller.ts
│   └── products.controller.ts
├── services/
│   ├── users.service.ts
│   ├── orders.service.ts
│   └── products.service.ts
└── entities/
    ├── user.entity.ts
    └── order.entity.ts

✅ After（Feature-first）
src/
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.repository.ts
│   └── entities/user.entity.ts
├── orders/
│   └── ...
└── products/
    └── ...
```

---

### 🟠 重要：檔名缺類型 suffix

```
❌ Before
src/users/
├── users.ts       # 什麼？Module？Controller？Service？
├── create.ts
└── user.ts

✅ After
src/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── dto/create-user.dto.ts
└── entities/user.entity.ts
```

---

### 🟡 建議：變數命名過於簡短

```typescript
// 🟡 Before
const u = await this.usersRepo.findById(id);
const r = u.orders.filter(o => o.total > 100);
const x = r.length;

// ✅ After
const user = await this.usersRepo.findById(id);
const largeOrders = user.orders.filter(o => o.total > 100);
const largeOrderCount = largeOrders.length;
```

---

### 🟡 建議：函式命名缺動詞

```typescript
// 🟡 Before
function user(id: number) {}       // 做什麼？
function items(cart: Cart) {}      // 取？算？驗？
function status(order: Order) {}   // 讀？改？

// ✅ After
function findUser(id: number) {}
function listCartItems(cart: Cart) {}
function updateOrderStatus(order: Order, status: OrderStatus) {}
```

---

### 🟡 建議：布林命名不明

```typescript
// 🟡 Before
const user = true;          // 什麼是 true？
const email = !!user.email; // email 當成布林？

// ✅ After
const isAuthenticated = true;
const hasEmail = !!user.email;
```

---

### 🟡 建議：Magic string / number

```typescript
// 🟡 Before
if (order.status === 'pending') {}
if (user.role === 2) {}  // 2 是什麼？

// ✅ After
const ORDER_STATUS = {
  Pending: 'pending',
  Confirmed: 'confirmed',
} as const;

enum UserRole {
  User = 1,
  Admin = 2,
  SuperAdmin = 3,
}

if (order.status === ORDER_STATUS.Pending) {}
if (user.role === UserRole.Admin) {}
```

---

### 🟡 建議：深度相對路徑

```typescript
// 🟡 Before
import { UsersService } from '../../../users/users.service';
import { OrderRepository } from '../../orders/orders.repository';

// ✅ After（tsconfig.json 設 paths）
import { UsersService } from '@/users/users.service';
import { OrderRepository } from '@/orders/orders.repository';
```

---

### 🟡 建議：Default export

```typescript
// 🟡 Before
export default class UsersService {}

// 使用方可隨便命名：
import MyService from '@/users/users.service'; // ❌ 追蹤困難

// ✅ After
export class UsersService {}

// 使用方統一：
import { UsersService } from '@/users/users.service';
```

---

### 🔵 備註：Import 順序

```typescript
// 🔵 建議順序
// 1. Node 內建
import { readFileSync } from 'fs';

// 2. 外部套件（框架 → 其他）
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

// 3. 專案內別名
import { UsersRepository } from '@/users/users.repository';

// 4. 相對路徑（同 feature）
import { CreateOrderDto } from './dto/create-order.dto';

// 5. type-only
import type { PaginatedResult } from '@/common/types';
```

---

### 🔵 備註：巢狀過深

```
🔵 Before
src/features/shop/orders/dto/create/items/order-item.dto.ts

✅ After（壓平）
src/orders/dto/order-item.dto.ts
```

---

## 快速判定

- Layer-first 目錄結構 → 🟠
- 檔名缺類型 suffix（`.controller.ts` / `.service.ts` 等）→ 🟠
- 變數命名過短（`u` / `x` / `temp`）→ 🟡
- 函式命名缺動詞 → 🟡
- 布林變數無 `is` / `has` / `can` 前綴 → 🟡
- magic string / number → 🟡
- 相對路徑爬超過 2 層 → 🟡
- Default export → 🟡
- Import 無分組 → 🔵
- 目錄巢狀 > 3 層 → 🔵
