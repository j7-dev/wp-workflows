# Guards / Interceptors / Pipes / Filters

## 四大攔截單元的職責

| 單元 | 執行時機 | 職責 | 典型用途 |
|------|---------|------|---------|
| **Middleware** | 最早，Express/Fastify 層 | 原始 req/res 操作 | cookie 解析、CORS（通常用官方 module） |
| **Guard** | Route handler 前 | 決定「是否允許」執行 | 認證、授權 |
| **Interceptor（前段）** | Guard 之後、handler 前 | 包裝 handler 執行 | 計時、快取、日誌 |
| **Pipe** | Handler 參數解析時 | 驗證 / 轉型 | DTO 驗證、`ParseIntPipe` |
| **Handler** | 本體 | 業務邏輯 | Controller method |
| **Interceptor（後段）** | Handler 之後 | 轉換回應 | 統一回應格式、序列化 |
| **Exception Filter** | 拋例外時 | 轉換錯誤為 HTTP 回應 | 統一錯誤格式、日誌、告警 |

執行順序：**Middleware → Guard → Interceptor(pre) → Pipe → Handler → Interceptor(post) → (若例外) Filter**

---

## Guard：認證授權

### JWT 認證 Guard

```typescript
// auth/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### 角色授權 Guard

```typescript
// auth/guards/roles.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) =>
  SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;

    const { user } = context.switchToHttp().getRequest();
    return required.some((role) => user?.roles?.includes(role));
  }
}
```

### 使用

```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)  // 全 Controller 套用
export class AdminController {
  @Get('stats')
  @Roles('admin', 'super-admin')        // 特定 endpoint 加角色限制
  stats() {}
}
```

### Guard 設計原則

- ✅ 只做「允許/拒絕」的二元判斷
- ❌ 不做資料轉換（那是 Pipe 或 Interceptor）
- ❌ 不做業務邏輯（那是 Service）

---

## Interceptor：包裝 handler

### 計時 Interceptor

```typescript
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TimingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const req = context.switchToHttp().getRequest();
    return next.handle().pipe(
      tap(() => {
        this.logger.log(`${req.method} ${req.url} - ${Date.now() - start}ms`);
      }),
    );
  }
}
```

### 統一回應格式 Interceptor

```typescript
interface Response<T> { data: T; timestamp: string; }

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

### 快取 Interceptor

優先使用官方 `@nestjs/cache-manager` 的 `CacheInterceptor`，不要手刻。

---

## Pipe：驗證與轉型

### 內建 Pipe

```typescript
@Get(':id')
findOne(
  @Param('id', ParseIntPipe) id: number,              // 字串 → 數字
  @Query('active', ParseBoolPipe) active: boolean,    // 字串 → 布林
  @Param('uuid', ParseUUIDPipe) uuid: string,         // 驗證 UUID 格式
) {}
```

### 自訂 Pipe

```typescript
@Injectable()
export class TrimPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException('Expected string');
    }
    return value.trim();
  }
}

@Post()
create(@Body('name', TrimPipe) name: string) {}
```

### Pipe 設計原則

- ✅ 只做轉型與驗證
- ✅ 純函式：輸入 A 產出 B，不依賴外部狀態
- ❌ 不存取資料庫（放 Service）
- ❌ 不做副作用（日誌放 Interceptor）

---

## Exception Filter：統一錯誤處理

### 全域錯誤過濾器

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload = exception instanceof HttpException
      ? exception.getResponse()
      : { message: 'Internal server error' };

    this.logger.error(
      `${req.method} ${req.url} ${status}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    res.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: req.url,
      ...(typeof payload === 'object' ? payload : { message: payload }),
    });
  }
}

// main.ts
app.useGlobalFilters(new AllExceptionsFilter());
```

### 特定例外的過濾器

```typescript
@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();

    if (exception.code === 'P2002') {
      return res.status(409).json({
        statusCode: 409,
        message: 'Unique constraint violation',
        target: exception.meta?.target,
      });
    }
    // ... 其他 Prisma 錯誤碼
  }
}
```

---

## 套用範圍

| 範圍 | 方式 | 適用 |
|------|------|------|
| 全域 | `app.useGlobalXxx()` in `main.ts` | Cross-cutting concerns（認證、錯誤、驗證） |
| Controller | `@UseGuards() / @UseInterceptors() / @UseFilters()` 在 class 上 | 特定模組範圍 |
| Method | `@UseGuards()` 等在 method 上 | 特定 endpoint |
| 參數 | Pipe 可在參數上：`@Param('id', ParseIntPipe)` | 特定參數轉型 |

---

## 常見反模式

- ❌ 用 Interceptor 做權限檢查（應該用 Guard）
- ❌ 用 Guard 修改 request.user 的欄位（Guard 只做判斷，轉換用 Interceptor）
- ❌ 用 Pipe 查資料庫（Pipe 應該是純的，查資料庫去 Service）
- ❌ Exception Filter 裡跑重業務邏輯（只應做「例外 → HTTP 回應」的翻譯）
- ❌ 多個 Filter 搶同一種例外（只會觸發最特定的那個）
