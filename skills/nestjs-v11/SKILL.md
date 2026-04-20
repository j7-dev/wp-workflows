---
name: nestjs-v11
description: >
  NestJS v11 完整技術參考，對應 @nestjs/core ^11.x、@nestjs/common ^11.x。
  當程式碼出現任何以下情況時，必須使用此 skill：
  import from '@nestjs/core'、'@nestjs/common'、'@nestjs/config'、'@nestjs/testing'、
  '@nestjs/typeorm'、'@nestjs/bullmq'、'@nestjs/platform-express'、'@nestjs/platform-fastify'；
  @Module、@Controller、@Injectable、@Get/@Post/@Put/@Delete/@Patch/@Options/@Head/@All、
  @Body/@Query/@Param/@Headers/@Session/@Ip/@HostParam、@Req/@Res、@HttpCode/@Header/@Redirect、
  @Global、@Optional、@Inject、@UsePipes、@UseGuards、@UseInterceptors、@UseFilters、
  @Catch、@SetMetadata、createParamDecorator、applyDecorators、
  NestFactory.create、CanActivate、NestInterceptor、PipeTransform、ExceptionFilter、
  NestMiddleware、MiddlewareConsumer、HttpException、BadRequestException、UnauthorizedException、
  NotFoundException、ForbiddenException、ConflictException、InternalServerErrorException、
  ValidationPipe、ParseIntPipe、ParseUUIDPipe、ParseBoolPipe、ParseArrayPipe、ParseEnumPipe、
  DefaultValuePipe、ParseFilePipe、ParseFloatPipe、ParseDatePipe、
  ConfigModule、ConfigService、registerAs、ConfigType、
  Test.createTestingModule、TestingModule、APP_GUARD、APP_PIPE、APP_INTERCEPTOR、APP_FILTER、
  ConfigurableModuleBuilder、forRoot/forRootAsync/forFeature/forFeatureAsync/register/registerAsync、
  ContextIdFactory、Reflector、ExecutionContext、CallHandler、ArgumentsHost、ArgumentMetadata。
  主要技術：TypeScript ^5.x、RxJS ^7.x、reflect-metadata ^0.2.x。v11 需要 Node.js 20+。
---

# NestJS v11 (@nestjs/core, @nestjs/common)

> **版本對應**：@nestjs/core ^11.x / @nestjs/common ^11.x / @nestjs/config ^3.x / @nestjs/testing ^11.x
> **文件來源**：https://docs.nestjs.com/ | 本 SKILL 對應 NestJS v11
> **最低需求**：Node.js 20+、TypeScript 5.x、RxJS 7.x

NestJS 是以 decorator 驅動、建構在 Express（或 Fastify）之上的 Node.js 後端框架，核心採用 Angular 風格的依賴注入與模組系統。

---

## 目錄

1. [核心概念速查](#核心概念速查)
2. [Controllers（路由）](#controllers路由)
3. [Providers 與依賴注入](#providers-與依賴注入)
4. [Modules（模組系統）](#modules模組系統)
5. [Pipes（驗證/轉換）](#pipes驗證轉換)
6. [Guards（授權）](#guards授權)
7. [Interceptors（攔截器）](#interceptors攔截器)
8. [Exception Filters](#exception-filters)
9. [Middleware](#middleware)
10. [Custom Providers（自訂 Provider）](#custom-providers自訂-provider)
11. [Provider Scopes](#provider-scopes)
12. [Custom Decorators](#custom-decorators)
13. [Dynamic Modules](#dynamic-modules)
14. [Configuration（@nestjs/config）](#configurationnestjsconfig)
15. [Testing（@nestjs/testing）](#testingnestjstesting)
16. [APP_ 常數 token（全域 Provider）](#app_-常數-token全域-provider)

深入主題見 `references/`：
- `references/controllers-full.md` — 所有 HTTP 方法裝飾器、Request/Response 細節
- `references/providers-full.md` — Provider 完整 pattern 與 ConfigurableModuleBuilder
- `references/validation-pipes.md` — ValidationPipe / class-validator 整合
- `references/fundamentals.md` — Scopes、Dynamic Modules、DI 進階

---

## 核心概念速查

| 概念 | 裝飾器 / API | 套件 |
|------|-------------|------|
| 模組 | `@Module({ imports, controllers, providers, exports })` | @nestjs/common |
| 控制器 | `@Controller(path?)` | @nestjs/common |
| 服務 | `@Injectable({ scope?, durable? })` | @nestjs/common |
| 路由 | `@Get/@Post/@Put/@Delete/@Patch/@Options/@Head/@All(path?)` | @nestjs/common |
| 參數 | `@Body/@Query/@Param/@Headers/@Session/@Ip/@HostParam` | @nestjs/common |
| 請求對象 | `@Req()` / `@Res()` / `@Next()` | @nestjs/common |
| HTTP 回應 | `@HttpCode/@Header/@Redirect/@Render` | @nestjs/common |
| 管線 | `@UsePipes(...)` | @nestjs/common |
| 守衛 | `@UseGuards(...)` | @nestjs/common |
| 攔截器 | `@UseInterceptors(...)` | @nestjs/common |
| 過濾器 | `@UseFilters(...)` | @nestjs/common |
| 全域註冊 | `APP_PIPE / APP_GUARD / APP_INTERCEPTOR / APP_FILTER` | @nestjs/core |

生命週期順序（請求進入到回應）：
`Middleware → Guard → Interceptor (before) → Pipe → Handler → Interceptor (after) → ExceptionFilter`

---

## Controllers（路由）

### 基本範例

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Get()
  findAll(): string { return 'all cats'; }

  @Get(':id')
  findOne(@Param('id') id: string): string { return `cat #${id}`; }

  @Post()
  create(@Body() dto: CreateCatDto) { return dto; }
}
```

### HTTP 方法裝飾器

| 裝飾器 | 用途 |
|--------|------|
| `@Get(path?)` | GET |
| `@Post(path?)` | POST |
| `@Put(path?)` | PUT |
| `@Delete(path?)` | DELETE |
| `@Patch(path?)` | PATCH |
| `@Options(path?)` | OPTIONS |
| `@Head(path?)` | HEAD |
| `@All(path?)` | 匹配所有 HTTP 方法 |

`path` 支援：
- 靜態路徑：`'users'`
- 路徑參數：`':id'`、`'users/:id/posts/:postId'`
- 萬用：`'abcd/*splat'`（NestJS 11 起使用 splat 參數名）

### 參數裝飾器

| 裝飾器 | 等價於 | 範例 |
|--------|--------|------|
| `@Req()` | `req` | `findAll(@Req() req: Request)` |
| `@Res()` | `res` | `create(@Res() res: Response)` |
| `@Body(key?)` | `req.body[key]` | `create(@Body() dto: CreateDto)` |
| `@Query(key?)` | `req.query[key]` | `find(@Query('page') page: number)` |
| `@Param(key?)` | `req.params[key]` | `get(@Param('id') id: string)` |
| `@Headers(name?)` | `req.headers[name]` | `get(@Headers('x-token') t: string)` |
| `@Session()` | `req.session` | - |
| `@Ip()` | `req.ip` | - |
| `@HostParam(key?)` | 子網域參數 | - |
| `@UploadedFile(name?)` | 單檔上傳 | 需 Multer |
| `@UploadedFiles(name?)` | 多檔上傳 | 需 Multer |

### 回應控制

```typescript
@Post()
@HttpCode(204)                                  // 覆寫預設 status code
@Header('Cache-Control', 'no-store')            // 設定 response header
create() { return 'added'; }

@Get()
@Redirect('https://nestjs.com', 301)            // 永久轉址
redirect() {}

// 動態 redirect
@Get('docs')
@Redirect('https://docs.nestjs.com', 302)
getDocs(@Query('version') v: string) {
  if (v === '5') return { url: 'https://docs.nestjs.com/v5/' };
}
```

### 子網域路由

```typescript
@Controller({ host: 'admin.example.com' })
export class AdminController {
  @Get() index() { return 'admin'; }
}

@Controller({ host: ':account.example.com' })
export class AccountController {
  @Get() get(@HostParam('account') account: string) { return account; }
}
```

### Library-specific 回應（Express/Fastify）

```typescript
// 完全自己控制（Nest 不介入）
@Post()
create(@Res() res: Response) { res.status(201).json({}); }

// Passthrough 模式（Nest 仍處理 return value）
@Get()
findAll(@Res({ passthrough: true }) res: Response) {
  res.status(200);
  return [];
}
```

**注意**：`@Res()` 會停用 Nest 的標準回應機制，除非用 `passthrough: true`。

### Async / Observable 處理器

```typescript
@Get() async findAll(): Promise<any[]> { return []; }
@Get() findAll(): Observable<any[]> { return of([]); }
```

---

## Providers 與依賴注入

### @Injectable

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];
  findAll(): Cat[] { return this.cats; }
}
```

### Constructor Injection（預設）

```typescript
@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}
}
```

### Property Injection（透過 @Inject）

```typescript
@Injectable()
export class HttpService<T> {
  @Inject('HTTP_OPTIONS') private readonly httpClient: T;
}
```

### @Optional 與可選依賴

```typescript
@Injectable()
export class HttpService<T> {
  constructor(@Optional() @Inject('HTTP_OPTIONS') private httpClient?: T) {}
}
```

---

## Modules（模組系統）

### @Module 裝飾器

```typescript
@Module({
  imports:     [],  // 要匯入的其他 Module
  controllers: [],  // 本模組內的 Controllers
  providers:   [],  // 本模組內的 Providers
  exports:     [],  // 匯出給其他 Module 使用的 Provider 子集
})
export class CatsModule {}
```

### 基本 Feature Module

```typescript
// cats/cats.module.ts
@Module({
  controllers: [CatsController],
  providers:   [CatsService],
  exports:     [CatsService],
})
export class CatsModule {}

// app.module.ts
@Module({ imports: [CatsModule] })
export class AppModule {}
```

### Global Module

```typescript
import { Global, Module } from '@nestjs/common';

@Global()
@Module({ providers: [CatsService], exports: [CatsService] })
export class CatsModule {}
```

**注意**：`@Global()` 僅應在 root/core module 使用一次；過度使用降低可讀性。

### 模組重匯出

```typescript
@Module({
  imports: [CommonModule],
  exports: [CommonModule],  // 透過本模組取得 CommonModule
})
export class CoreModule {}
```

### 循環依賴（forwardRef）

```typescript
@Module({ imports: [forwardRef(() => CatsModule)] })
export class CommonModule {}

@Injectable()
export class CatsService {
  constructor(@Inject(forwardRef(() => CommonService)) private s: CommonService) {}
}
```

---

## Pipes（驗證/轉換）

### 內建 Pipes

所有從 `@nestjs/common` 匯出：

| Pipe | 用途 |
|------|------|
| `ValidationPipe` | 驗證 DTO（搭配 class-validator） |
| `ParseIntPipe` | string → number，失敗 400 |
| `ParseFloatPipe` | string → float |
| `ParseBoolPipe` | string → boolean |
| `ParseArrayPipe` | string → array |
| `ParseUUIDPipe` | 驗證 UUID 格式 |
| `ParseEnumPipe` | 驗證 enum 值 |
| `ParseDatePipe` | 驗證 date 格式 |
| `ParseFilePipe` | 驗證上傳檔案 |
| `DefaultValuePipe(value)` | 提供預設值 |

### 綁定範例

```typescript
// Parameter-scope
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {}

// 帶選項的 parameter-scope
@Get(':id')
findOne(
  @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }))
  id: number
) {}

// Multiple pipes
@Get()
findAll(
  @Query('activeOnly', new DefaultValuePipe(false), ParseBoolPipe) active: boolean,
  @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
) {}

// UUID
@Get(':uuid')
findOne(@Param('uuid', new ParseUUIDPipe()) uuid: string) {}

// Method-scope
@Post()
@UsePipes(new ZodValidationPipe(createCatSchema))
async create(@Body() dto: CreateCatDto) {}

// Global（main.ts）
const app = await NestFactory.create(AppModule);
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

// Global（Module，可注入依賴）
@Module({
  providers: [{ provide: APP_PIPE, useClass: ValidationPipe }],
})
export class AppModule {}
```

### ValidationPipe 選項

```typescript
new ValidationPipe({
  whitelist: true,              // 移除未在 DTO 聲明的屬性
  forbidNonWhitelisted: true,   // 若有非白名單屬性則拋錯
  transform: true,              // 轉型 plain object → DTO class
  disableErrorMessages: false,  // 正式環境可關閉
  exceptionFactory: (errors) => new BadRequestException(errors),
  validationError: { target: false, value: false },
});
```

需配合 `class-validator` 與 `class-transformer`：

```typescript
import { IsString, IsInt, MinLength } from 'class-validator';

export class CreateCatDto {
  @IsString() @MinLength(2)
  name: string;

  @IsInt()
  age: number;
}
```

### PipeTransform 介面

```typescript
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);
    if (isNaN(val)) throw new BadRequestException('Validation failed');
    return val;
  }
}

// ArgumentMetadata 定義：
interface ArgumentMetadata {
  type: 'body' | 'query' | 'param' | 'custom';
  metatype?: Type<unknown>;
  data?: string;
}
```

---

## Guards（授權）

### 基本範例

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = ctx.switchToHttp().getRequest();
    return validateRequest(request);  // true=放行, false=403
  }
}
```

### 綁定

```typescript
// Method / Controller-scope
@UseGuards(AuthGuard)
@Controller('cats')
export class CatsController {}

// Global
app.useGlobalGuards(new AuthGuard());

// Global with DI（Module）
@Module({ providers: [{ provide: APP_GUARD, useClass: AuthGuard }] })
export class AppModule {}
```

### Metadata 驅動的 Role Guard

```typescript
// roles.decorator.ts
import { Reflector } from '@nestjs/core';
export const Roles = Reflector.createDecorator<string[]>();

// 使用
@Post()
@Roles(['admin'])
async create(@Body() dto: CreateCatDto) {}

// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.get(Roles, ctx.getHandler());
    if (!roles) return true;
    const request = ctx.switchToHttp().getRequest();
    return matchRoles(roles, request.user.roles);
  }
}
```

### 拒絕時的例外

Guard 回傳 `false` 時預設丟 `ForbiddenException`。可在 Guard 內自行丟 `UnauthorizedException` 等。

---

## Interceptors（攔截器）

### NestInterceptor 介面

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    return next.handle().pipe(
      tap(() => console.log(`${Date.now() - now}ms`))
    );
  }
}
```

### 常用 RxJS Operator 模式

```typescript
// 回應轉換
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, { data: T }> {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map(data => ({ data })));
  }
}

// 錯誤轉換
@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      catchError(err => throwError(() => new BadGatewayException()))
    );
  }
}

// 快取覆寫
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    if (isCached) return of(cachedData);
    return next.handle();
  }
}

// 逾時
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      timeout(5000),
      catchError(err => err instanceof TimeoutError
        ? throwError(() => new RequestTimeoutException())
        : throwError(() => err))
    );
  }
}
```

### 綁定

```typescript
@UseInterceptors(LoggingInterceptor) // Method / Controller
app.useGlobalInterceptors(new LoggingInterceptor()); // Global
// Global with DI
{ provide: APP_INTERCEPTOR, useClass: LoggingInterceptor }
```

---

## Exception Filters

### 內建例外（全部繼承自 HttpException）

| 例外 | Status | 例外 | Status |
|------|--------|------|--------|
| `BadRequestException` | 400 | `UnauthorizedException` | 401 |
| `NotFoundException` | 404 | `ForbiddenException` | 403 |
| `NotAcceptableException` | 406 | `RequestTimeoutException` | 408 |
| `ConflictException` | 409 | `GoneException` | 410 |
| `PayloadTooLargeException` | 413 | `UnsupportedMediaTypeException` | 415 |
| `UnprocessableEntityException` | 422 | `InternalServerErrorException` | 500 |
| `NotImplementedException` | 501 | `BadGatewayException` | 502 |
| `ServiceUnavailableException` | 503 | `GatewayTimeoutException` | 504 |
| `HttpVersionNotSupportedException` | 505 | `ImATeapotException` | 418 |
| `MethodNotAllowedException` | 405 | `PreconditionFailedException` | 412 |

### HttpException 建構子

```typescript
throw new HttpException(response, status, options?);

// 字串回應
throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);

// 物件回應
throw new HttpException(
  { status: HttpStatus.FORBIDDEN, error: 'custom msg' },
  HttpStatus.FORBIDDEN,
  { cause: originalError }
);

// 內建例外帶 cause
throw new BadRequestException('Bad input', {
  cause: new Error('db error'),
  description: 'Failed validation',
});
```

### ExceptionFilter

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### @Catch 決定處理的例外類型

```typescript
@Catch(HttpException)              // 單一
@Catch(HttpException, TypeError)   // 多種
@Catch()                            // 所有
```

### 綁定

```typescript
@UseFilters(HttpExceptionFilter)   // Method / Controller
app.useGlobalFilters(new HttpExceptionFilter()); // Global
// Global with DI
{ provide: APP_FILTER, useClass: HttpExceptionFilter }
```

### AllExceptionsFilter（繼承 BaseExceptionFilter）

```typescript
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    super.catch(exception, host);  // fallback 至 Nest 預設處理
  }
}

// main.ts 使用
const { httpAdapter } = app.get(HttpAdapterHost);
app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
```

---

## Middleware

### Class-based Middleware

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('Request...');
    next();
  }
}
```

### 註冊（MiddlewareConsumer）

```typescript
@Module({ imports: [CatsModule] })
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .exclude(
        { path: 'cats', method: RequestMethod.GET },
        'cats/{*splat}'
      )
      .forRoutes(CatsController);  // 或 'cats' / { path, method }
  }
}

// 多個 middleware 串連
consumer.apply(cors(), helmet(), logger).forRoutes(CatsController);

// With HTTP method
consumer.apply(LoggerMiddleware).forRoutes({
  path: 'cats',
  method: RequestMethod.GET,
});

// Wildcard（NestJS 11）
consumer.apply(LoggerMiddleware).forRoutes({
  path: 'abcd/*splat',
  method: RequestMethod.ALL,
});
```

### Functional Middleware

```typescript
export function logger(req: Request, res: Response, next: NextFunction) {
  console.log('Request');
  next();
}

consumer.apply(logger).forRoutes(CatsController);
```

### Global Middleware

```typescript
// main.ts
const app = await NestFactory.create(AppModule);
app.use(logger);  // 但無法使用 DI
```

---

## Custom Providers（自訂 Provider）

### useValue

```typescript
const mockCatsService = { /* ... */ };

@Module({
  providers: [
    { provide: CatsService, useValue: mockCatsService },
  ],
})
export class AppModule {}
```

### 非 class token（string / symbol）

```typescript
@Module({
  providers: [{ provide: 'CONNECTION', useValue: connection }],
})
export class AppModule {}

@Injectable()
export class CatsRepository {
  constructor(@Inject('CONNECTION') connection: Connection) {}
}
```

### useClass（動態決定實作）

```typescript
const configProvider = {
  provide: ConfigService,
  useClass: process.env.NODE_ENV === 'development'
    ? DevelopmentConfigService
    : ProductionConfigService,
};
```

### useFactory（可注入依賴 / 可 async）

```typescript
const connectionProvider = {
  provide: 'CONNECTION',
  useFactory: (opts: OptionsProvider, optional?: string) => {
    return new DatabaseConnection(opts.get());
  },
  inject: [
    OptionsProvider,
    { token: 'SOME_OPTIONAL', optional: true },
  ],
};

// Async factory
const asyncConnection = {
  provide: 'ASYNC_CONN',
  useFactory: async () => {
    const conn = await createConnection();
    return conn;
  },
};
```

### useExisting（alias）

```typescript
const loggerAlias = {
  provide: 'AliasedLoggerService',
  useExisting: LoggerService,
};
```

### 匯出

```typescript
@Module({
  providers: [connectionFactory],
  exports: ['CONNECTION'],  // 透過 token 匯出
})
export class AppModule {}
```

---

## Provider Scopes

### 三種 Scope

```typescript
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.DEFAULT })     // 單例（預設）
@Injectable({ scope: Scope.REQUEST })     // 每個請求新實例
@Injectable({ scope: Scope.TRANSIENT })   // 每個注入者新實例
export class CatsService {}
```

**REQUEST scope 會向上傳播**：依賴 request-scoped 服務的控制器也會變 request-scoped。TRANSIENT 不會傳播。

### 存取 Request

```typescript
import { REQUEST } from '@nestjs/core';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(REQUEST) private request: Request) {}
}
```

### Inquirer（TRANSIENT 專屬）

```typescript
import { INQUIRER } from '@nestjs/core';

@Injectable({ scope: Scope.TRANSIENT })
export class HelloService {
  constructor(@Inject(INQUIRER) private parent: object) {}
  name() { return this.parent?.constructor?.name; }
}
```

### Durable Providers（多租戶）

```typescript
import { HostComponentInfo, ContextId, ContextIdFactory, ContextIdStrategy } from '@nestjs/core';

export class TenantStrategy implements ContextIdStrategy {
  attach(contextId: ContextId, request: Request) {
    const tenantId = request.headers['x-tenant-id'] as string;
    // ...共用 sub-tree
    return (info: HostComponentInfo) =>
      info.isTreeDurable ? sharedContextId : contextId;
  }
}

// main.ts
ContextIdFactory.apply(new TenantStrategy());

// Mark as durable
@Injectable({ scope: Scope.REQUEST, durable: true })
export class TenantService {}
```

---

## Custom Decorators

### createParamDecorator

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

// 使用
@Get()
findOne(@User() user: UserEntity) {}
@Get()
findOne(@User('firstName') name: string) {}
```

### applyDecorators（組合多個 decorator）

```typescript
import { applyDecorators } from '@nestjs/common';

export function Auth(...roles: string[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(AuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}

// 使用
@Auth('admin')
@Get('secure')
secure() {}
```

### 搭配 Pipe

```typescript
@Get()
async findOne(
  @User(new ValidationPipe({ validateCustomDecorators: true }))
  user: UserEntity,
) {}
```

`validateCustomDecorators: true` 是讓 ValidationPipe 處理自訂 param decorator 的關鍵選項。

---

## Dynamic Modules

### 方法命名慣例

| 方法 | 用途 |
|------|------|
| `register()` | 每次呼叫建立獨立設定 |
| `forRoot()` | 全域一次性設定 |
| `forFeature()` | 基於 forRoot 設定的功能擴充 |

各自有 async 版本：`registerAsync()`、`forRootAsync()`、`forFeatureAsync()`

### 基本 Dynamic Module

```typescript
@Module({})
export class ConfigModule {
  static register(options: Record<string, any>): DynamicModule {
    return {
      module: ConfigModule,
      providers: [
        { provide: 'CONFIG_OPTIONS', useValue: options },
        ConfigService,
      ],
      exports: [ConfigService],
    };
  }
}

// 使用
@Module({
  imports: [ConfigModule.register({ folder: './config' })],
})
export class AppModule {}

@Injectable()
export class ConfigService {
  constructor(@Inject('CONFIG_OPTIONS') private options: Record<string, any>) {}
}
```

### ConfigurableModuleBuilder

```typescript
// config.module-definition.ts
import { ConfigurableModuleBuilder } from '@nestjs/common';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<ConfigModuleOptions>()
    .setClassMethodName('forRoot')      // 改名（預設是 register）
    .setFactoryMethodName('createConfigOptions') // 改 useClass 期望的方法
    .setExtras(
      { isGlobal: true },
      (definition, extras) => ({ ...definition, global: extras.isGlobal })
    )
    .build();

// config.module.ts
@Module({ providers: [ConfigService], exports: [ConfigService] })
export class ConfigModule extends ConfigurableModuleClass {}
```

### 三種 async 寫法

```typescript
// useFactory
ConfigModule.registerAsync({
  useFactory: () => ({ folder: './config' }),
  inject: [SomeDependency],
});

// useClass
ConfigModule.registerAsync({
  useClass: ConfigOptionsFactory,  // 需實作 create() 方法
});

// useExisting
ConfigModule.registerAsync({
  useExisting: ExistingConfigFactory,
});
```

---

## Configuration（@nestjs/config）

### 安裝

```bash
npm i @nestjs/config
```

### 基本使用

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,                    // 全域使用
      envFilePath: ['.env.local', '.env'], // 多檔案（第一個優先）
      ignoreEnvFile: false,              // 只用環境變數時設 true
      cache: true,                       // 快取 env
      expandVariables: true,             // 支援 ${VAR} 展開
      load: [configuration],             // 自訂設定檔
      validate: validateFn,              // 自訂驗證
      validationSchema: Joi.object({/**/}), // Joi 驗證
    }),
  ],
})
export class AppModule {}
```

### 自訂設定檔

```typescript
// config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
  },
});
```

### 使用 ConfigService

```typescript
@Injectable()
export class AppService {
  constructor(private config: ConfigService) {}

  method() {
    this.config.get<string>('DATABASE_USER');
    this.config.get<string>('database.host');                 // 點記法
    this.config.get<string>('database.host', 'localhost');    // 預設值
    this.config.get<DatabaseConfig>('database');              // 結構化
  }
}
```

### 類型推導

```typescript
interface EnvVars {
  PORT: number;
  TIMEOUT: string;
}

// 第二個泛型 `true` 保證 get 不會返回 undefined
constructor(private config: ConfigService<EnvVars, true>) {
  const port = this.config.get('PORT', { infer: true });  // type: number
}
```

### registerAs（namespaced config）

```typescript
// config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DB_HOST,
  port: +(process.env.DB_PORT ?? 5432),
}));

// 載入
ConfigModule.forRoot({ load: [databaseConfig] });

// 注入具名設定
import { ConfigType } from '@nestjs/config';

constructor(
  @Inject(databaseConfig.KEY) private dbConfig: ConfigType<typeof databaseConfig>,
) {}
```

### 作為 Provider 給其他 Module

```typescript
TypeOrmModule.forRootAsync(databaseConfig.asProvider());
```

### 自訂 class-validator 驗證

```typescript
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, validateSync } from 'class-validator';

class EnvVars {
  @IsEnum(['development', 'production', 'test']) NODE_ENV: string;
  @IsNumber() PORT: number;
}

export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvVars, config, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length) throw new Error(errors.toString());
  return validated;
}

ConfigModule.forRoot({ validate });
```

---

## Testing（@nestjs/testing）

### 安裝

```bash
npm i --save-dev @nestjs/testing
```

### 基本 Unit Test

```typescript
import { Test, TestingModule } from '@nestjs/testing';

describe('CatsController', () => {
  let controller: CatsController;
  let service: CatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatsController],
      providers: [CatsService],
    }).compile();

    controller = module.get(CatsController);
    service = module.get(CatsService);
  });

  it('returns cats', () => {
    jest.spyOn(service, 'findAll').mockReturnValue(['a']);
    expect(controller.findAll()).toEqual(['a']);
  });
});
```

### TestingModule 方法

| 方法 | 用途 |
|------|------|
| `compile()` | 編譯模組、解析依賴 |
| `get(token)` | 取得 singleton 實例 |
| `resolve(token, contextId?)` | 取得 request/transient 實例（async） |
| `createNestApplication()` | 建立完整 INestApplication |

### 覆寫 Provider / Guard / Filter / Interceptor / Pipe

```typescript
const module = await Test.createTestingModule({
  imports: [AppModule],
})
  .overrideProvider(CatsService).useValue(mockService)
  .overrideProvider(OtherService).useClass(MockOtherService)
  .overrideProvider(ThirdService).useFactory({ factory: () => ({}) })
  .overrideGuard(JwtAuthGuard).useClass(MockAuthGuard)
  .overrideInterceptor(LoggingInterceptor).useClass(MockInterceptor)
  .overrideFilter(HttpExceptionFilter).useClass(MockFilter)
  .overridePipe(ValidationPipe).useClass(MockPipe)
  .overrideModule(CatsModule).useModule(MockCatsModule)
  .compile();
```

### Auto-mocking（useMocker）

```typescript
.useMocker((token) => {
  if (token === CatsService) return { findAll: jest.fn().mockResolvedValue([]) };
  // 可用 jest-mock 或 @golevelup/ts-jest 自動產生 mock
})
```

### E2E Test（supertest）

```typescript
import * as request from 'supertest';

describe('Cats (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  it('/GET cats', () =>
    request(app.getHttpServer()).get('/cats').expect(200));

  afterAll(() => app.close());
});
```

### 測試 Request-scoped Provider

```typescript
import { ContextIdFactory } from '@nestjs/core';

const contextId = ContextIdFactory.create();
jest.spyOn(ContextIdFactory, 'getByRequest').mockImplementation(() => contextId);

const service = await module.resolve(CatsService, contextId);
```

---

## APP_ 常數 token（全域 Provider）

從 `@nestjs/core` 匯入，用於把 Guard / Pipe / Interceptor / Filter 註冊為可注入依賴的全域實例：

```typescript
import { APP_GUARD, APP_PIPE, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

@Module({
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_PIPE, useClass: ValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
```

**與 `app.useGlobalXxx()` 的差別**：APP_ token 版本可享 DI（能注入其他 Provider），`useGlobalXxx()` 則不能。

---

## Bootstrap 範例

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

---

## 常見陷阱

1. **`@Res()` 搭配 return**：使用 `@Res()` 會停用 Nest 回應機制，必須呼叫 `res.send()`，除非加 `passthrough: true`。
2. **ValidationPipe 沒搭配 class-validator**：必須 `npm i class-validator class-transformer`。
3. **REQUEST scope 成本**：每請求新建實例，影響效能；考慮 durable provider。
4. **Global middleware 無 DI**：`app.use()` 註冊的全域 middleware 無法注入 provider。
5. **forwardRef**：循環依賴的兩端都要用 `forwardRef`，不然啟動時會報錯。
6. **Test 的 Guard 覆寫**：e2e 測試要記得用 `.overrideGuard()` 繞過認證。

---

## 延伸閱讀（references/）

- `references/controllers-full.md` — 更多 HTTP 方法細節、streaming、file upload
- `references/providers-full.md` — Custom provider 進階 pattern
- `references/validation-pipes.md` — ValidationPipe 所有選項、自訂 ValidationError
- `references/fundamentals.md` — Scopes、Dynamic Modules、Durable、Discovery Service
