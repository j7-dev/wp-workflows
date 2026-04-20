# 例外處理審查

## Checklist

- [ ] 所有錯誤情境拋 `HttpException` 或其子類，不拋 raw `Error`
- [ ] 業務錯誤有自訂 Exception 類別（繼承對應的 `HttpException`）
- [ ] 全域 `ExceptionFilter` 存在且統一回應格式
- [ ] 特定 ORM 錯誤（TypeORM `QueryFailedError`、Prisma `PrismaClientKnownRequestError`）有對應 Filter
- [ ] Filter 註冊順序正確（特定在前，通用在後）
- [ ] Production 環境不洩漏 stack trace
- [ ] 4xx 與 5xx 日誌層級區分（warn vs error）
- [ ] 自訂錯誤攜帶 error code（給前端 / 其他服務用）
- [ ] 非同步操作錯誤被正確捕捉（無 unhandled promise rejection）

---

## 常見問題與嚴重性

### 🔴 嚴重：拋 raw Error

```typescript
// ❌ Before
async create(dto: CreateOrderDto) {
  if (dto.total <= 0) {
    throw new Error('Invalid total'); // 被全域 Filter 當 500 處理
  }
}

// ✅ After
async create(dto: CreateOrderDto) {
  if (dto.total <= 0) {
    throw new BadRequestException('Order total must be positive');
  }
}
```

---

### 🔴 嚴重：吞例外

```typescript
// ❌ Before
async findById(id: number) {
  try {
    return await this.usersRepo.findById(id);
  } catch {
    return null; // 🔥 資料庫連線失敗被當成「查不到」
  }
}

// ✅ After
async findById(id: number): Promise<User | null> {
  return this.usersRepo.findById(id); // 讓例外往上冒，Filter 處理
}
```

---

### 🔴 嚴重：Production 洩漏 stack trace

```typescript
// ❌ Before
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    res.status(500).json({
      message: (exception as Error).message,
      stack: (exception as Error).stack, // 🔥
    });
  }
}

// ✅ After
catch(exception: unknown, host: ArgumentsHost) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(status).json({
    statusCode: status,
    timestamp: new Date().toISOString(),
    path: req.url,
    message: isProduction && status === 500
      ? 'Internal server error'
      : (exception as Error).message,
    ...(isProduction ? {} : { stack: (exception as Error).stack }),
  });
}
```

---

### 🟠 重要：無全域 ExceptionFilter

```typescript
// ❌ Before（main.ts 只有 ValidationPipe）
app.useGlobalPipes(new ValidationPipe());
await app.listen(3000);

// 結果：未捕捉的例外吐出預設 Nest 回應，格式可能不一致

// ✅ After
app.useGlobalPipes(new ValidationPipe({...}));
app.useGlobalFilters(new AllExceptionsFilter());
await app.listen(3000);
```

---

### 🟠 重要：Filter 順序錯

```typescript
// ❌ Before
app.useGlobalFilters(
  new AllExceptionsFilter(),        // 通用的先
  new PrismaExceptionFilter(),      // 特定的永遠不會觸發
);

// ✅ After
app.useGlobalFilters(
  new PrismaExceptionFilter(),      // 特定的先
  new TypeOrmExceptionFilter(),
  new AllExceptionsFilter(),        // 通用的最後
);
```

---

### 🟠 重要：ORM 錯誤直接回 500

```typescript
// ❌ Before（沒處理 Prisma 唯一鍵衝突）
async createUser(dto: CreateUserDto) {
  return this.prisma.user.create({ data: dto });
  // email 重複時拋 P2002，被當 500
}

// ✅ After：加 Filter 或在 Service 轉換
@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    const mapping: Record<string, { status: number; message: string }> = {
      P2002: { status: 409, message: 'Resource already exists' },
      P2003: { status: 400, message: 'Foreign key violation' },
      P2025: { status: 404, message: 'Resource not found' },
    };
    const mapped = mapping[exception.code];
    if (mapped) {
      return res.status(mapped.status).json({
        statusCode: mapped.status,
        code: `DB_${exception.code}`,
        message: mapped.message,
      });
    }
    res.status(500).json({ message: 'Database error' });
  }
}
```

---

### 🟠 重要：4xx 與 5xx 同級日誌

```typescript
// ❌ Before
catch(exception: unknown, host: ArgumentsHost) {
  this.logger.error(exception); // 所有 4xx 都是 error，log 爆量
}

// ✅ After
if (status >= 500) {
  this.logger.error(`${method} ${url} ${status}`, stack);
} else if (status >= 400) {
  this.logger.warn(`${method} ${url} ${status} ${message}`);
}
```

---

### 🟡 建議：無自訂業務例外

```typescript
// 🟡 Before：到處用內建，訊息硬編字串
throw new ForbiddenException('Insufficient credit');
// 前端難以 i18n / 根據錯誤碼分支處理

// ✅ After
export class InsufficientCreditException extends ForbiddenException {
  constructor(required: number, actual: number) {
    super({
      code: 'INSUFFICIENT_CREDIT',
      message: `Required ${required}, actual ${actual}`,
      required,
      actual,
    });
  }
}

throw new InsufficientCreditException(total, user.credit);
// 前端拿到 { code: 'INSUFFICIENT_CREDIT', required: 100, actual: 50 }
```

---

### 🟡 建議：錯誤訊息含敏感資訊

```typescript
// 🟡 Before
throw new NotFoundException(
  `User not found in ${this.config.get('DATABASE_URL')}`
); // 🔥 洩漏 DB URL

// ✅ After
throw new NotFoundException('User not found');
```

---

### 🟡 建議：無 request id 關聯

```typescript
// 🟡 生產環境排查困難
// ✅ 建議：middleware 給 request 賦 ID，Filter 日誌帶上
catch(exception: unknown, host: ArgumentsHost) {
  const req = host.switchToHttp().getRequest();
  const requestId = req.id ?? 'unknown';
  this.logger.error(`[${requestId}] ${req.method} ${req.url}`, stack);
}
```

---

### 🔵 備註：全域未處理 rejection

```typescript
// 🔵 main.ts 建議加
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', reason);
});
```

---

## 快速判定

- 拋 raw `Error` → 🔴
- `try { ... } catch { return null }` 吞例外 → 🔴
- Production 洩漏 stack trace → 🔴
- 無全域 ExceptionFilter → 🟠
- Filter 順序錯（通用在特定前）→ 🟠
- ORM 錯誤直接回 500 → 🟠
- 4xx 與 5xx 同級日誌 → 🟠
- 全部用內建例外，無業務錯誤碼 → 🟡
- 錯誤訊息含 DB URL / 檔案路徑 → 🟡
- 無 request id / 追蹤資訊 → 🟡
