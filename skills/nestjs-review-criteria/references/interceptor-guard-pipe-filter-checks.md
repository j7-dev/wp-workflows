# Guards / Interceptors / Pipes / Filters 職責審查

## 核心判準：職責不混淆

| 單元 | 該做 | 不該做 |
|------|------|--------|
| **Guard** | 決定「是否允許執行 handler」（認證、授權） | 資料轉換、業務邏輯、副作用 |
| **Interceptor** | 包裝 handler 執行（計時、快取、日誌、回應格式化） | 權限判斷、例外捕捉（那是 Filter） |
| **Pipe** | 驗證 / 轉型（DTO 驗證、`ParseIntPipe`） | 存取資料庫、副作用 |
| **Filter** | 將例外翻譯成 HTTP 回應 | 重業務邏輯、資料庫寫入 |

---

## Checklist

### Guards
- [ ] 認證使用 Guard（`JwtAuthGuard` / `AuthGuard('jwt')`）
- [ ] 授權使用 Guard + 自訂 `@Roles()` / `@Permissions()` 裝飾器
- [ ] Guard 回傳 boolean（或拋 `UnauthorizedException` / `ForbiddenException`）
- [ ] 未用 Guard 做資料轉換（request.user 以外的注入）

### Interceptors
- [ ] Interceptor 用於 cross-cutting concerns（計時、快取、統一回應）
- [ ] 未用 Interceptor 做權限判斷
- [ ] 快取優先用 `@nestjs/cache-manager` 的 `CacheInterceptor`

### Pipes
- [ ] Pipe 保持純淨（無副作用、無 DB 存取）
- [ ] 自訂 Pipe 只做轉型 / 驗證
- [ ] 路由參數數字用 `ParseIntPipe`

### Filters
- [ ] 全域 Exception Filter 存在且處理所有例外
- [ ] 特定例外的 Filter 註冊順序正確（特定在前，通用在後）
- [ ] Production 不洩漏 stack trace
- [ ] 4xx vs 5xx 日誌層級區別（warn vs error）

---

## 常見問題與嚴重性

### 🔴 嚴重：用 Interceptor 做權限檢查

```typescript
// ❌ Before
@Injectable()
export class AdminOnlyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const { user } = context.switchToHttp().getRequest();
    if (user?.role !== 'admin') {
      throw new ForbiddenException();
    }
    return next.handle();
  }
}

// ✅ After：應該用 Guard
@Injectable()
export class AdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    return user?.role === 'admin';
  }
}
```

**理由**：Guard 語義明確「准入」，Interceptor 語義是「包裝執行」。混用會讓架構意圖模糊。

---

### 🔴 嚴重：全域 Exception Filter 缺失

```typescript
// ❌ Before（main.ts 沒加 filter）
const app = await NestFactory.create(AppModule);
await app.listen(3000);
// 結果：未捕捉的錯誤吐出 Node stack trace，格式不一致，可能洩漏內部資訊

// ✅ After
app.useGlobalFilters(new AllExceptionsFilter());
```

---

### 🟠 重要：Filter 洩漏 stack trace 到 production

```typescript
// ❌ Before
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    res.status(500).json({
      error: exception, // 🔥 含 stack trace
    });
  }
}

// ✅ After
catch(exception: unknown, host: ArgumentsHost) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(status).json({
    statusCode: status,
    message: isProduction ? 'Internal error' : (exception as Error).message,
    ...(isProduction ? {} : { stack: (exception as Error).stack }),
  });
}
```

---

### 🟠 重要：Pipe 做 DB 查詢

```typescript
// ❌ Before
@Injectable()
export class UserExistsPipe implements PipeTransform {
  constructor(private readonly usersRepo: UsersRepository) {}

  async transform(id: number): Promise<User> {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new NotFoundException();
    return user;
  }
}

@Get(':id')
findOne(@Param('id', UserExistsPipe) user: User) {}
// 問題：Pipe 副作用、難以 reason、測試困難

// ✅ After：放 Service
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.usersService.findByIdOrFail(id);
}
```

**例外**：若使用模式非常頻繁（如 `CurrentUser`），可考慮用 Param decorator 或 Guard 放到 `request.user`，但仍不建議 Pipe 做。

---

### 🟠 重要：Filter 執行順序錯

```typescript
// ❌ Before
app.useGlobalFilters(
  new AllExceptionsFilter(),       // 通用的先
  new PrismaExceptionFilter(),     // 特定的後 → 永遠不會觸發
);

// ✅ After：特定的先，通用的後
app.useGlobalFilters(
  new PrismaExceptionFilter(),
  new TypeOrmExceptionFilter(),
  new AllExceptionsFilter(),
);
```

---

### 🟠 重要：Guard 做資料轉換

```typescript
// ❌ Before
@Injectable()
export class EnrichUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = {
      ...req.user,
      displayName: `${req.user.firstName} ${req.user.lastName}`, // ❌ 不是 Guard 的事
    };
    return true;
  }
}

// ✅ After：用 Interceptor 或 Service 做
```

---

### 🟡 建議：手刻快取而非用官方 Interceptor

```typescript
// 🟡 Before
@Injectable()
export class CustomCacheInterceptor implements NestInterceptor {
  private cache = new Map();
  // 自己實作一堆...
}

// ✅ After
@UseInterceptors(CacheInterceptor)
@CacheTTL(60)
@Get()
findAll() { return this.service.findAll(); }

// main.ts
imports: [CacheModule.register({ ttl: 5 })]
```

---

### 🟡 建議：全域 Interceptor 範圍過廣

```typescript
// 🟡 Before：統一回應格式套用所有端點，但 webhook / streaming 不需要
app.useGlobalInterceptors(new ResponseInterceptor());

// ✅ After：特定 controller 才套
@Controller('api/v1')
@UseInterceptors(ResponseInterceptor)
export class ApiController {}
```

---

### 🔵 備註：4xx vs 5xx 日誌層級

```typescript
// 🔵 Filter 日誌細節
if (status >= 500) {
  this.logger.error(`${method} ${url} ${status}`, stack);
} else if (status >= 400) {
  this.logger.warn(`${method} ${url} ${status} ${message}`);
}
// 4xx 不該轟炸 error log（客戶端問題，不是伺服器問題）
```

---

## 快速判定

- Interceptor 做權限檢查 → 🔴
- 無全域 Exception Filter → 🔴
- Production 洩漏 stack trace → 🟠
- Pipe 存取 DB / 其他副作用 → 🟠
- Filter 註冊順序錯（通用在特定前面）→ 🟠
- Guard 做資料轉換 → 🟠
- 手刻快取而非用 CacheInterceptor → 🟡
- 全域 Interceptor 套用範圍過廣 → 🟡
- 4xx 與 5xx 日誌層級未區分 → 🔵
