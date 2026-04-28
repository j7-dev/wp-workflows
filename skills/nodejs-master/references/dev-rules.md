# Node.js / TypeScript 開發規則

以下規則必須嚴格遵守。所有範例使用通用命名做示範，實際開發時請替換為當前專案的路徑別名、命名空間和慣例。

---

## 規則 1：TypeScript strict mode + 禁止 `any`

`tsconfig.json` 必須啟用 `strict: true`，任何情況下禁止使用 `any` 型別。

```typescript
// ❌ 不好的做法：關閉嚴格模式 + 使用 any
{
  "compilerOptions": {
    "strict": false
  }
}

const processData = (data: any) => {
  return data.id // 完全沒有型別保護
}

// ✅ 正確的做法：strict mode + 明確型別
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true
  }
}

type TOrderData = {
  id: number
  userId: number
  status: TOrderStatus
}

const processData = (data: TOrderData): string => {
  return data.id.toString()
}
```

---

## 規則 2：Zod Schema 驗證所有輸入（含環境變數）

所有外部輸入（Request body、Query params、環境變數）都必須透過 Zod Schema 驗證，不直接信任原始輸入。

```typescript
// ❌ 不好的做法：直接使用 req.body，不驗證
const createOrder = (req: Request, res: Response) => {
  const { userId, items } = req.body // 沒有驗證，型別不安全
  await orderService.create(userId, items)
}

// ❌ 不好的做法：直接讀取 process.env
const DB_URL = process.env.DATABASE_URL // 可能是 undefined

// ✅ 正確的做法：Zod Schema 驗證 Request body
import { z } from 'zod'

const createOrderSchema = z.object({
  userId: z.number().int().positive(),
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().min(1),
    }),
  ).min(1),
  note: z.string().max(500).optional(),
})

type TCreateOrderInput = z.infer<typeof createOrderSchema>

const createOrder = async (req: Request, res: Response) => {
  const input = createOrderSchema.parse(req.body) // 自動型別推導 + 驗證
  const order = await orderService.create(input)
  res.json(order)
}

// ✅ 正確的做法：Zod 驗證環境變數
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']),
})

export const env = envSchema.parse(process.env) // 啟動時驗證，失敗即中止
```

---

## 規則 3：Repository Pattern 隔離資料層（介面 + 實作分離）

資料存取邏輯必須封裝在 Repository 層，Service 層透過介面操作，不直接呼叫 ORM。

```typescript
// ❌ 不好的做法：Service 直接使用 Prisma
class OrderService {
  async findById(id: number) {
    return prisma.order.findUnique({ where: { id } }) // 耦合 Prisma，難以測試
  }
}

// ✅ 正確的做法：定義介面 + Prisma 實作分離
/**
 * 訂單資料存取介面
 * Service 層只依賴此介面，不依賴具體實作
 */
interface IOrderRepository {
  findById(id: number): Promise<TOrder | null>
  findByUserId(userId: number): Promise<TOrder[]>
  create(data: TCreateOrderData): Promise<TOrder>
  update(id: number, data: Partial<TOrder>): Promise<TOrder>
  delete(id: number): Promise<void>
}

/**
 * Prisma 實作的訂單 Repository
 */
class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: number): Promise<TOrder | null> {
    return this.prisma.order.findUnique({ where: { id } })
  }

  async create(data: TCreateOrderData): Promise<TOrder> {
    return this.prisma.order.create({ data })
  }
  // ...其他方法
}

/**
 * 訂單業務邏輯 Service
 * 依賴介面，可注入 mock 進行單元測試
 */
class OrderService {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async getOrderById(id: number): Promise<TOrder> {
    const order = await this.orderRepo.findById(id)
    if (!order) throw new NotFoundError(`Order ${id} not found`)
    return order
  }
}
```

---

## 規則 4：自訂 Error 類別 + 統一錯誤 middleware

使用自訂 Error 類別攜帶 HTTP 狀態碼，透過統一的 error middleware 格式化回應。

```typescript
// ❌ 不好的做法：直接在 Controller 處理錯誤，回應格式不一致
const getOrder = async (req: Request, res: Response) => {
  try {
    const order = await orderService.getOrderById(Number(req.params.id))
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: err.message }) // 格式不一致、狀態碼硬寫
  }
}

// ✅ 正確的做法：自訂 Error 類別
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND')
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422, 'VALIDATION_ERROR')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

// ✅ 統一錯誤 middleware（Express）
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error({ err, path: req.path }, 'Request error')

  if (err instanceof ZodError) {
    res.status(422).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      errors: err.flatten().fieldErrors,
    })
    return
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
    })
    return
  }

  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
  })
}
```

---

## 規則 5：依賴注入（DI）透過建構子注入

所有依賴透過建構子明確注入，不在類別內部直接 import 實例，確保可測試性。

```typescript
// ❌ 不好的做法：類別內直接建立依賴
class NotificationService {
  async sendEmail(to: string, subject: string) {
    const mailer = new NodeMailer() // 硬耦合，無法 mock
    await mailer.send({ to, subject })
  }
}

// ✅ 正確的做法：建構子注入
interface IMailer {
  send(options: TMailOptions): Promise<void>
}

/**
 * 通知服務
 * 透過建構子注入 Mailer，測試時可替換為 MockMailer
 */
class NotificationService {
  constructor(
    private readonly mailer: IMailer,
    private readonly logger: Logger,
  ) {}

  async sendOrderConfirmation(order: TOrder): Promise<void> {
    this.logger.info({ orderId: order.id }, 'Sending order confirmation')
    await this.mailer.send({
      to: order.userEmail,
      subject: `訂單確認 #${order.id}`,
      html: renderOrderConfirmationTemplate(order),
    })
  }
}

// 組裝（Composition Root）
const mailer = new NodeMailerAdapter(smtpConfig)
const notificationService = new NotificationService(mailer, logger)
```

---

## 規則 6：JSDoc 繁體中文 + 型別標註

所有公開 Service 方法、Repository 介面、Controller 路由處理函式都必須撰寫繁體中文 JSDoc。

```typescript
// ❌ 不好的做法：沒有 JSDoc、缺少說明
async function createOrder(input: TCreateOrderInput) {
  const items = await validateItems(input.items)
  return orderRepo.create({ ...input, items })
}

// ✅ 正確的做法：完整 JSDoc + 參數說明
/**
 * 建立新訂單
 *
 * 驗證商品庫存 → 計算總金額 → 建立訂單 → 觸發庫存扣減事件
 *
 * @param input - 建立訂單所需資料（使用者 ID、商品清單、備注）
 * @returns 建立完成的訂單，含系統生成的訂單編號
 * @throws {NotFoundError} 商品不存在時拋出
 * @throws {ValidationError} 庫存不足時拋出
 */
async createOrder(input: TCreateOrderInput): Promise<TOrder> {
  const items = await this.validateItemsStock(input.items)
  const total = calculateOrderTotal(items)
  const order = await this.orderRepo.create({ ...input, items, total })
  await this.eventBus.emit('order.created', { orderId: order.id })
  return order
}
```

---

## 規則 7：async/await + asyncHandler wrapper（不讓 rejection 消失）

Express 的 async route handler 若 reject，不會被 error middleware 捕捉。必須使用 asyncHandler wrapper 確保錯誤正確傳遞。

```typescript
// ❌ 不好的做法：async route 未包裝，rejection 靜默消失
app.get('/orders/:id', async (req, res) => {
  const order = await orderService.getById(Number(req.params.id))
  // 如果 getById 拋出錯誤，Express error middleware 收不到！
  res.json(order)
})

// ✅ 正確的做法：asyncHandler wrapper 確保錯誤傳遞
/**
 * 包裝 async route handler，確保 rejection 傳遞至 Express error middleware
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next) // 捕捉 rejection，傳給 error middleware
  }
}

// 使用 asyncHandler 包裝
app.get(
  '/orders/:id',
  asyncHandler(async (req, res) => {
    const order = await orderService.getById(Number(req.params.id))
    res.json(order)
  }),
)

// ✅ Fastify 原生支援，不需要 wrapper
fastify.get('/orders/:id', async (request, reply) => {
  const order = await orderService.getById(Number(request.params.id))
  return order // Fastify 自動處理 async rejection
})
```

---

## 規則 8：命名規範

- **類別**：PascalCase（如 `OrderService`、`PrismaOrderRepository`）
- **介面**：PascalCase 且以 `I` 開頭（如 `IOrderRepository`、`IMailer`）
- **型別**：PascalCase 且以 `T` 開頭（如 `TOrder`、`TCreateOrderInput`）
- **常數**：UPPER_SNAKE_CASE（如 `ORDER_STATUS`、`MAX_RETRY_COUNT`）
- **變數 / 函式**：camelCase（如 `orderService`、`handleCreateOrder`）
- **檔案**：kebab-case（如 `order-service.ts`、`prisma-order-repository.ts`）
- **目錄**：kebab-case（如 `order/`、`user-auth/`）

---

## 規則 9：import 分組（Node 內建 → 第三方 → 內部）

```typescript
// ❌ 不好的做法：import 順序混亂
import { OrderService } from './services/order-service'
import express from 'express'
import { z } from 'zod'
import path from 'path'
import { env } from '@/config/env'

// ✅ 正確的做法：三組分離，空行區隔
// 1. Node.js 內建模組
import path from 'path'
import { randomUUID } from 'crypto'

// 2. 第三方套件
import express, { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import pino from 'pino'

// 3. 專案內部模組
import { env } from '@/config/env'
import { asyncHandler } from '@/middleware/async-handler'
import { OrderService } from '@/services/order-service'
import type { TOrder } from '@/types/order'
```
