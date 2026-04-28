# NestJS v11 Fundamentals（進階）

## Execution Context

`ExecutionContext` 繼承自 `ArgumentsHost`，提供當前請求上下文資訊。常用於 Guards / Interceptors。

```typescript
interface ExecutionContext extends ArgumentsHost {
  getClass<T = any>(): Type<T>;            // 取得 Controller class
  getHandler(): Function;                   // 取得當前處理器 function
}

interface ArgumentsHost {
  getArgs<T extends Array<any> = any[]>(): T;
  getArgByIndex<T = any>(index: number): T;
  switchToHttp(): HttpArgumentsHost;
  switchToRpc(): RpcArgumentsHost;
  switchToWs(): WsArgumentsHost;
  getType<TContext extends string = ContextType>(): TContext;
}
```

多協議支援範例：

```typescript
@Injectable()
export class MyGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    if (ctx.getType() === 'http') {
      const req = ctx.switchToHttp().getRequest();
    } else if (ctx.getType() === 'rpc') {
      const data = ctx.switchToRpc().getData();
    } else if (ctx.getType() === 'ws') {
      const client = ctx.switchToWs().getClient();
    }
    return true;
  }
}
```

---

## Reflector（Metadata 存取）

`Reflector` 用於讀取透過 `SetMetadata` 或 `Reflector.createDecorator` 設定的 metadata。

```typescript
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';

// 舊式：SetMetadata
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// 新式（推薦）：createDecorator
export const Roles = Reflector.createDecorator<string[]>();

// Guard 內讀取
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    // 舊式
    const roles = this.reflector.get<string[]>('roles', ctx.getHandler());

    // 新式
    const roles = this.reflector.get(Roles, ctx.getHandler());

    // 合併 handler + class 上的 metadata
    const roles = this.reflector.getAllAndOverride(Roles, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    // 合併（handler 優先於 class）
    const roles = this.reflector.getAllAndMerge(Roles, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    return true;
  }
}
```

---

## 模組生命週期事件

實作對應介面即可 hook 生命週期：

```typescript
import {
  OnModuleInit, OnModuleDestroy,
  OnApplicationBootstrap, OnApplicationShutdown,
  BeforeApplicationShutdown,
} from '@nestjs/common';

@Injectable()
export class UsersService implements
  OnModuleInit,
  OnApplicationBootstrap,
  BeforeApplicationShutdown,
  OnApplicationShutdown,
  OnModuleDestroy
{
  async onModuleInit() { /* 模組依賴解析完畢後 */ }
  async onApplicationBootstrap() { /* 所有模組初始化完畢後 */ }
  async beforeApplicationShutdown(signal?: string) { /* 關閉前 */ }
  async onApplicationShutdown(signal?: string) { /* 關閉時（如收到 SIGTERM） */ }
  async onModuleDestroy() { /* 模組銷毀時 */ }
}
```

啟用 shutdown hooks：

```typescript
// main.ts
const app = await NestFactory.create(AppModule);
app.enableShutdownHooks(); // 讓 Node.js 的 signal 觸發 lifecycle
```

---

## Circular Dependency（forwardRef）

兩種情況：
1. **模組間循環依賴**：`@Module({ imports: [forwardRef(() => OtherModule)] })`
2. **Provider 間循環依賴**：`@Inject(forwardRef(() => OtherService))`

```typescript
// cats.module.ts
@Module({
  imports: [forwardRef(() => CommonModule)],
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}

// common.module.ts
@Module({
  imports: [forwardRef(() => CatsModule)],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}

// cats.service.ts
@Injectable()
export class CatsService {
  constructor(
    @Inject(forwardRef(() => CommonService))
    private commonService: CommonService,
  ) {}
}
```

**注意**：盡可能重構來消除循環依賴（例如抽出共用 utils）。

---

## Module Reference（執行時取得 Provider）

```typescript
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class CatsService {
  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    // 取得 singleton
    const service = this.moduleRef.get(Service);

    // 從其他 Module（需 strict: false）
    const service2 = this.moduleRef.get(Service, { strict: false });

    // 解析 request / transient scoped
    const scoped = await this.moduleRef.resolve(ScopedService);

    // 同一個 contextId 返回同一實例
    const contextId = ContextIdFactory.create();
    const a = await this.moduleRef.resolve(ScopedService, contextId);
    const b = await this.moduleRef.resolve(ScopedService, contextId);
    // a === b

    // 動態建立未註冊的 class
    const instance = await this.moduleRef.create(NewService);
  }
}
```

---

## Discovery Service（列舉所有 Provider / Controller）

適用於實作自訂 Decorator Scanner（例如 schedule / event handler 自動註冊）。

```typescript
import { DiscoveryService, Reflector } from '@nestjs/core';

@Injectable()
export class TaskScanner implements OnModuleInit {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit() {
    const providers = this.discovery.getProviders();
    const controllers = this.discovery.getControllers();

    providers.forEach((wrapper) => {
      const { instance, metatype } = wrapper;
      if (!instance || !metatype) return;
      const prototype = Object.getPrototypeOf(instance);
      const methodNames = Object.getOwnPropertyNames(prototype).filter(
        (m) => m !== 'constructor' && typeof prototype[m] === 'function',
      );
      methodNames.forEach((name) => {
        const meta = this.reflector.get('schedule', prototype[name]);
        if (meta) { /* 註冊任務 */ }
      });
    });
  }
}
```

需要將 `DiscoveryModule` 匯入：

```typescript
import { DiscoveryModule } from '@nestjs/core';

@Module({ imports: [DiscoveryModule], providers: [TaskScanner] })
export class SchedulerModule {}
```

---

## Lazy Loading Modules

僅在需要時才載入模組（節省 cold-start 時間）：

```typescript
import { LazyModuleLoader } from '@nestjs/core';

@Injectable()
export class CatsService {
  constructor(private lazyModuleLoader: LazyModuleLoader) {}

  async loadLazyModule() {
    const { LazyModule } = await import('./lazy.module');
    const moduleRef = await this.lazyModuleLoader.load(() => LazyModule);
    const { LazyService } = await import('./lazy.service');
    const service = moduleRef.get(LazyService);
    return service.doSomething();
  }
}
```
