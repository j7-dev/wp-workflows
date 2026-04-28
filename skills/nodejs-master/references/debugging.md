# 除錯技巧

## pino 結構化日誌分析

```typescript
// ✅ 使用 child logger 傳遞請求 context
app.use((req, res, next) => {
  req.logger = logger.child({
    requestId: randomUUID(),
    path: req.path,
    method: req.method,
  })
  next()
})

// 在 Service 中使用 request-scoped logger
async createOrder(input: TCreateOrderInput, reqLogger: Logger): Promise<TOrder> {
  reqLogger.info({ input }, 'Creating order') // 自動帶上 requestId
  // ...
}
```

---

## Prisma Query Log

```typescript
// prisma/client.ts
export const prisma = new PrismaClient({
  log:
    env.NODE_ENV === 'development'
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ]
      : ['warn', 'error'],
})

if (env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug({ query: e.query, duration: e.duration }, 'Prisma query')
  })
}
```

---

## TypeScript 型別工具

```typescript
// 常用型別工具範例
type TPartialOrder = Partial<TOrder>                     // 所有欄位可選
type TRequiredOrder = Required<TOrder>                   // 所有欄位必填
type TOrderKeys = keyof TOrder                           // 所有欄位名稱
type TOrderStatus = TOrder['status']                     // 提取欄位型別
type TCreateOrder = Omit<TOrder, 'id' | 'createdAt'>    // 排除欄位
type TOrderSummary = Pick<TOrder, 'id' | 'status' | 'total'> // 選取欄位
```

---

## 工具使用

- 使用 **web_search** 搜尋 Node.js / TypeScript / Prisma / Zod / BullMQ 的最新文件
- 使用 **Serena MCP**（如可用）查看代碼引用關係，快速定位問題所在
- 遇到不確定的 API 用法時，主動上網搜尋官方文件
- 使用 **Prisma Studio** 或 `prisma db pull` 協助資料庫結構分析
