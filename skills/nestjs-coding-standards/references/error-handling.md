# 例外處理與 HttpException 體系

## NestJS 內建 HTTP 例外

| 類別 | Status | 常見用途 |
|------|--------|---------|
| `BadRequestException` | 400 | 輸入格式錯 |
| `UnauthorizedException` | 401 | 未登入 / token 失效 |
| `ForbiddenException` | 403 | 已登入但權限不足 |
| `NotFoundException` | 404 | 資源不存在 |
| `MethodNotAllowedException` | 405 | HTTP method 不允許 |
| `NotAcceptableException` | 406 | Accept header 不符 |
| `RequestTimeoutException` | 408 | 請求逾時 |
| `ConflictException` | 409 | 衝突（唯一鍵、樂觀鎖） |
| `GoneException` | 410 | 資源已永久刪除 |
| `PayloadTooLargeException` | 413 | 請求體過大 |
| `UnsupportedMediaTypeException` | 415 | Content-Type 不支援 |
| `UnprocessableEntityException` | 422 | 語義錯誤（通常 validation） |
| `InternalServerErrorException` | 500 | 非預期錯誤 |
| `NotImplementedException` | 501 | 功能未實作 |
| `BadGatewayException` | 502 | 上游服務錯誤 |
| `ServiceUnavailableException` | 503 | 服務暫時不可用 |
| `GatewayTimeoutException` | 504 | 上游服務逾時 |

---

## 使用原則

```typescript
// ❌ 禁止：拋 raw Error
throw new Error('User not found');

// ❌ 禁止：直接操作 response
@Get(':id')
findOne(@Param('id') id: string, @Res() res: Response) {
  const user = this.usersService.find(+id);
  if (!user) return res.status(404).send('Not found');
  return res.json(user);
}

// ✅ 正確：拋對應的內建例外
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  const user = this.usersService.find(id);
  if (!user) throw new NotFoundException(`User ${id} not found`);
  return user;
}

// ✅ 或讓 Service 拋
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.usersService.findOrFail(id); // Service 內部拋
}
```

---

## 自訂業務例外

### 為什麼要自訂？

- 攜帶額外上下文（錯誤碼、需要重試的參數等）
- 統一錯誤碼給前端 / 其他服務使用
- 便於在 Filter 做特殊處理（日誌、告警、metric）

### 範例

```typescript
// common/exceptions/business.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export abstract class BusinessException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus,
    public readonly context?: Record<string, unknown>,
  ) {
    super({ code, message, context }, status);
  }
}

// orders/exceptions/insufficient-credit.exception.ts
export class InsufficientCreditException extends BusinessException {
  constructor(required: number, actual: number) {
    super(
      'INSUFFICIENT_CREDIT',
      `Required credit ${required}, but user has ${actual}`,
      HttpStatus.FORBIDDEN,
      { required, actual },
    );
  }
}

// orders/exceptions/order-not-found.exception.ts
export class OrderNotFoundException extends BusinessException {
  constructor(orderId: number) {
    super(
      'ORDER_NOT_FOUND',
      `Order ${orderId} not found`,
      HttpStatus.NOT_FOUND,
      { orderId },
    );
  }
}
```

### 使用

```typescript
@Injectable()
export class OrdersService {
  async create(userId: number, dto: CreateOrderDto) {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new UserNotFoundException(userId);

    const total = this.calculateTotal(dto.items);
    if (user.credit < total) {
      throw new InsufficientCreditException(total, user.credit);
    }
    // ...
  }
}
```

---

## 全域 ExceptionFilter 統一回應格式

```typescript
// common/filters/all-exceptions.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const { status, body } = this.resolveError(exception);

    // 4xx 只警告，5xx 才當成錯誤
    if (status >= 500) {
      this.logger.error(
        `${req.method} ${req.url} ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${req.method} ${req.url} ${status} ${body.message}`);
    }

    res.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: req.url,
      ...body,
    });
  }

  private resolveError(exception: unknown): { status: number; body: Record<string, unknown> } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      return {
        status: exception.getStatus(),
        body: typeof response === 'object' ? response as Record<string, unknown> : { message: response },
      };
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    };
  }
}
```

```typescript
// main.ts
app.useGlobalFilters(new AllExceptionsFilter());
```

---

## ORM 錯誤轉換

### TypeORM 唯一鍵衝突

```typescript
@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    // PostgreSQL 唯一鍵違反
    if ((exception as any).code === '23505') {
      return res.status(409).json({
        code: 'DUPLICATE_ENTRY',
        message: 'Resource already exists',
        detail: (exception as any).detail,
      });
    }

    res.status(500).json({ message: 'Database error' });
  }
}
```

### Prisma

```typescript
@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    const mapping: Record<string, { status: number; code: string; message: string }> = {
      P2002: { status: 409, code: 'DUPLICATE_ENTRY', message: 'Unique constraint violation' },
      P2003: { status: 400, code: 'FK_VIOLATION', message: 'Foreign key constraint failed' },
      P2025: { status: 404, code: 'NOT_FOUND', message: 'Record not found' },
    };

    const mapped = mapping[exception.code];
    if (mapped) {
      return res.status(mapped.status).json({
        code: mapped.code,
        message: mapped.message,
        meta: exception.meta,
      });
    }

    res.status(500).json({ message: 'Database error' });
  }
}
```

註冊時**順序很重要**：特定型別的 Filter 必須放在通用 Filter 之前。

```typescript
// 正確：先特定，再通用
app.useGlobalFilters(
  new PrismaExceptionFilter(),
  new AllExceptionsFilter(),
);
```

---

## 錯誤碼約定

建議專案統一一份錯誤碼表（給前端與其他服務使用）：

```typescript
// common/error-codes.ts
export const ERROR_CODES = {
  // Auth
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',

  // Business
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  INSUFFICIENT_CREDIT: 'INSUFFICIENT_CREDIT',
  INVENTORY_OUT_OF_STOCK: 'INVENTORY_OUT_OF_STOCK',

  // Infrastructure
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
```

---

## 常見反模式

- ❌ Service 吞例外（`try { ... } catch { return null; }`）
- ❌ Controller 用 `@Res()` 直接回應（繞過 Filter 體系）
- ❌ 多種例外混用（有時拋 `Error` 有時拋 `HttpException`）
- ❌ Production 環境回傳 stack trace 給前端
- ❌ 錯誤訊息含敏感資訊（SQL、檔案路徑、內部 IP）
