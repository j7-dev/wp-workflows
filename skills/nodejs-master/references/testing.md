# 測試撰寫與驗證規範

## 測試撰寫要求

完成功能開發後，**必須**為新增或修改的功能撰寫對應的測試：

- **單元測試**：針對 Service 層業務邏輯，使用 Vitest + mock Repository（透過 DI 注入）
- **整合測試**：針對 Controller / Route，使用 Supertest 發出真實 HTTP 請求
- **測試涵蓋範圍**：至少涵蓋主要流程（happy path）與關鍵的錯誤場景（error path）

---

## 單元測試範例

```typescript
// tests/unit/order-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OrderService } from '@/services/order-service'
import type { IOrderRepository } from '@/repositories/order-repository'

/**
 * @description 訂單 Service 單元測試
 * 透過 mock Repository 隔離資料庫依賴
 */
describe('OrderService', () => {
  let orderService: OrderService
  let mockOrderRepo: IOrderRepository

  beforeEach(() => {
    // 注入 mock Repository，不需要真實資料庫
    mockOrderRepo = {
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findByUserId: vi.fn(),
    }
    orderService = new OrderService(mockOrderRepo, mockLogger)
  })

  describe('getOrderById', () => {
    it('應回傳存在的訂單', async () => {
      const mockOrder = { id: 1, userId: 1, status: 'PENDING', total: 100 }
      vi.mocked(mockOrderRepo.findById).mockResolvedValue(mockOrder)

      const order = await orderService.getOrderById(1)

      expect(order).toEqual(mockOrder)
      expect(mockOrderRepo.findById).toHaveBeenCalledWith(1)
    })

    it('應在訂單不存在時拋出 NotFoundError', async () => {
      vi.mocked(mockOrderRepo.findById).mockResolvedValue(null)

      await expect(orderService.getOrderById(999)).rejects.toThrow(NotFoundError)
    })
  })
})
```

---

## 整合測試範例

```typescript
// tests/integration/order-routes.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '@/app'

/**
 * @description 訂單 API 整合測試
 */
describe('GET /orders/:id', () => {
  it('應回傳 200 和訂單資料', async () => {
    const res = await request(app).get('/orders/1').set('Authorization', `Bearer ${testToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ id: 1 })
  })

  it('應在訂單不存在時回傳 404', async () => {
    const res = await request(app).get('/orders/99999').set('Authorization', `Bearer ${testToken}`)

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })
})
```

> 沒有測試的代碼不得提交審查。若功能性質確實無法撰寫測試，需在提交審查時說明原因。

---

## 交付前驗證步驟

在呼叫 reviewer agent 之前，**必須**執行以下指令並確認全數通過：

```bash
# 1. 型別檢查
pnpm tsc --noEmit

# 2. 程式碼規範檢查
pnpm eslint

# 3. 格式化檢查
pnpm prettier --check "src/**/*.ts"

# 4. 單元測試 + 整合測試
pnpm test

# 5. 建構確認
pnpm build
```

> 只有當所有指令全數通過時，才可以進入下一步呼叫 reviewer agent。若有測試失敗，必須先修復再重新執行，直到全部通過。
