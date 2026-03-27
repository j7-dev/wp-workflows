# 分層架構與代碼風格

## 標準目錄結構

```
src/
├── config/            # 環境變數、資料庫連線、外部服務設定
│   ├── env.ts         # Zod 驗證的環境變數
│   ├── database.ts    # Prisma Client 單例
│   └── logger.ts      # pino logger 設定
├── controllers/       # HTTP 請求/回應處理（薄層，不含業務邏輯）
├── services/          # 業務邏輯（核心層）
├── repositories/      # 資料存取抽象（介面定義）
│   └── prisma/        # Prisma 實作
├── middleware/        # Express / Fastify middleware
│   ├── auth.ts        # JWT 驗證
│   ├── async-handler.ts
│   └── error-handler.ts
├── routes/            # 路由定義（組裝 Controller）
├── types/             # 全域型別定義
│   ├── order.ts
│   └── user.ts
├── errors/            # 自訂 Error 類別
├── jobs/              # BullMQ Job 定義
├── workers/           # BullMQ Worker 實作
├── utils/             # 純工具函式（無副作用）
└── app.ts             # Express / Fastify App 設定（不含 listen）
```

---

## 分層架構範例（Controller / Service / Repository）

```typescript
// src/controllers/order-controller.ts
/**
 * 訂單 Controller
 * 負責 HTTP 請求/回應處理，不包含業務邏輯
 */
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * GET /orders/:id
   * 取得單一訂單詳情
   */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const id = z.coerce.number().int().positive().parse(req.params.id)
    const order = await this.orderService.getOrderById(id)
    res.json({ data: order })
  })

  /**
   * POST /orders
   * 建立新訂單
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const input = createOrderSchema.parse(req.body)
    const order = await this.orderService.createOrder(input)
    res.status(201).json({ data: order })
  })
}

// src/services/order-service.ts
/**
 * 訂單業務邏輯 Service
 * 負責業務規則、資料驗證、跨 Repository 協調
 */
export class OrderService {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly productRepo: IProductRepository,
    private readonly logger: Logger,
  ) {}

  async getOrderById(id: number): Promise<TOrder> {
    const order = await this.orderRepo.findById(id)
    if (!order) throw new NotFoundError(`Order ${id} not found`)
    return order
  }

  async createOrder(input: TCreateOrderInput): Promise<TOrder> {
    this.logger.info({ input }, 'Creating order')
    // 業務規則：驗證庫存
    await this.validateStock(input.items)
    const total = this.calculateTotal(input.items)
    return this.orderRepo.create({ ...input, total })
  }
}

// src/repositories/prisma-order-repository.ts
/**
 * Prisma 實作的訂單 Repository
 * 負責所有資料庫操作，不包含業務邏輯
 */
export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: number): Promise<TOrder | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: true, user: true },
    })
  }

  async create(data: TCreateOrderData): Promise<TOrder> {
    return this.prisma.order.create({
      data: {
        ...data,
        items: { create: data.items },
      },
      include: { items: true },
    })
  }
}
```

---

## Prisma Schema 設計範例

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Order {
  id        Int         @id @default(autoincrement())
  userId    Int
  status    OrderStatus @default(PENDING)
  total     Decimal     @db.Decimal(10, 2)
  note      String?
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  user  User        @relation(fields: [userId], references: [id])
  items OrderItem[]

  @@map("orders") // 資料表名稱使用 snake_case
}

enum OrderStatus {
  PENDING
  PROCESSING
  COMPLETED
  CANCELLED
}
```

---

## pino 結構化日誌

```typescript
// src/config/logger.ts
import pino from 'pino'
import { env } from '@/config/env'

/**
 * 結構化日誌 logger
 * 生產環境輸出 JSON，開發環境輸出美化格式
 */
export const logger = pino({
  level: env.LOG_LEVEL ?? 'info',
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
})

// 使用方式（始終帶上 context object）
logger.info({ orderId: order.id, userId: order.userId }, 'Order created')
logger.error({ err, orderId }, 'Failed to process order')
logger.warn({ attemptCount }, 'Retry limit approaching')
```

---

## BullMQ Job / Worker 範例

```typescript
// src/jobs/send-order-confirmation.ts
import { Queue } from 'bullmq'
import { env } from '@/config/env'

const connection = { host: env.REDIS_HOST, port: env.REDIS_PORT }

/**
 * 訂單確認信 Job Queue
 */
export const orderConfirmationQueue = new Queue('order-confirmation', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
})

export type TOrderConfirmationJobData = {
  orderId: number
  userEmail: string
  orderTotal: number
}

/**
 * 加入訂單確認信任務
 */
export const enqueueOrderConfirmation = (
  data: TOrderConfirmationJobData,
): Promise<void> => {
  orderConfirmationQueue.add('send-confirmation', data)
}

// src/workers/order-confirmation-worker.ts
import { Worker } from 'bullmq'
import type { Job } from 'bullmq'
import type { TOrderConfirmationJobData } from '@/jobs/send-order-confirmation'

/**
 * 訂單確認信 Worker
 * 獨立進程執行，失敗自動重試
 */
export const orderConfirmationWorker = new Worker<TOrderConfirmationJobData>(
  'order-confirmation',
  async (job: Job<TOrderConfirmationJobData>) => {
    const { orderId, userEmail, orderTotal } = job.data
    logger.info({ jobId: job.id, orderId }, 'Processing order confirmation')
    await notificationService.sendOrderConfirmation({ orderId, userEmail, orderTotal })
    logger.info({ jobId: job.id, orderId }, 'Order confirmation sent')
  },
  { connection, concurrency: 5 },
)
```

---

## 遇到違背原則的專案時的處置

### 步驟 1：評估當前任務性質

判斷當前的任務是否屬於 **[優化]**、**[重構]**、**[改良]** 類型。

### 步驟 2A：是 [優化] / [重構] / [改良] 任務

- 使用 Serena MCP 分析符號依賴關係，確認影響範圍
- 先建立新的 Interface + 實作，再逐步替換舊引用
- 確保重構後所有引用都正確更新
- 補充缺失的測試

### 步驟 2B：不是 [優化] / [重構] / [改良] 任務

- 維持**最小變更原則**
- 只做當前任務所需的修改
- 避免大規模重構導致更多問題
- 在 PR 中標註發現的技術債，建議後續處理
