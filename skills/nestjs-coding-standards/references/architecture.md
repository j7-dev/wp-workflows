# Module 架構與 Dependency Injection

## Module 基礎結構

```typescript
@Module({
  imports: [/* 其他 Module */],
  controllers: [/* HTTP 入口 */],
  providers: [/* Service / Repository / 自訂 Provider */],
  exports: [/* 給其他 Module 用的 Provider */],
})
export class UsersModule {}
```

### 各欄位角色

| 欄位 | 內容 | 何時使用 |
|------|------|---------|
| `imports` | 其他 Module | 需要用別的 Module 匯出的 Provider 時 |
| `controllers` | 本模組的 Controller | 暴露 HTTP / GraphQL / WS endpoint |
| `providers` | 本模組內部 Provider（Service / Repository / Factory） | 提供給本模組的 Controller 與其他 Provider 注入 |
| `exports` | 要匯出的 Provider | 讓匯入本模組的其他 Module 能注入 |

---

## Module 組織模式

### 模式 A：Feature Module（推薦預設）

每個業務領域一個 Module：

```
src/
├── app.module.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.repository.ts
│   └── dto/
├── orders/
│   ├── orders.module.ts
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   └── ...
└── shared/
    └── shared.module.ts   # 跨模組共用工具
```

### 模式 B：Core Module（全域基礎設施）

```typescript
// core/core.module.ts
@Global()
@Module({
  imports: [ConfigModule, DatabaseModule, LoggerModule, CacheModule],
  exports: [ConfigModule, DatabaseModule, LoggerModule, CacheModule],
})
export class CoreModule {}
```

`@Global()` 讓 export 的 Provider 全域可注入。**慎用**：只用於真正全域的基礎設施（Config / Logger / Database），不要濫用。

---

## Provider 的四種定義方式

### 1. Class Provider（最常見）

```typescript
providers: [UsersService]
// 等同於
providers: [{ provide: UsersService, useClass: UsersService }]
```

### 2. Value Provider（常數 / 設定）

```typescript
providers: [
  { provide: 'API_VERSION', useValue: 'v1' },
  { provide: 'CONFIG', useValue: { apiKey: 'xxx' } },
]

// 注入
constructor(@Inject('API_VERSION') private version: string) {}
```

### 3. Factory Provider（動態建構）

```typescript
providers: [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: async (config: ConfigService) => {
      const conn = await createConnection({
        host: config.get('DB_HOST'),
      });
      return conn;
    },
    inject: [ConfigService],
  },
]
```

### 4. Existing Provider（別名）

```typescript
providers: [
  LegacyLoggerService,
  { provide: LoggerService, useExisting: LegacyLoggerService },
]
```

---

## Provider 作用域（Scope）

```typescript
// 預設：Singleton（整個 app 共用一個實例）
@Injectable()
export class ConfigService {}

// Request 作用域：每個 HTTP request 一個新實例
@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {}

// Transient：每次注入都建立新實例
@Injectable({ scope: Scope.TRANSIENT })
export class TransientHelper {}
```

### 重要警告

- `Scope.REQUEST` 會**級聯**：任何注入它的 Provider 也會變成 REQUEST 作用域，影響效能。
- 預設 Singleton 就好，除非真的需要 per-request 狀態。
- 若需要 request 資訊，優先考慮 `@Req()` 或自訂 Interceptor，而非 Request scope。

---

## Dynamic Module

用於需要傳入設定參數的 Module：

```typescript
@Module({})
export class DatabaseModule {
  static forRoot(options: DbOptions): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        { provide: 'DB_OPTIONS', useValue: options },
        DatabaseService,
      ],
      exports: [DatabaseService],
    };
  }

  static forRootAsync(options: DbAsyncOptions): DynamicModule {
    return {
      module: DatabaseModule,
      imports: options.imports,
      providers: [
        {
          provide: 'DB_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        DatabaseService,
      ],
      exports: [DatabaseService],
    };
  }
}

// 使用
@Module({
  imports: [
    DatabaseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        host: config.get('DB_HOST'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

---

## 循環依賴（避免）

### 症狀

```
Nest can't resolve dependencies of the XxxService (?). Please make sure that the argument ... is available in the current context.
```

### 治本：重新設計

- 將共用邏輯抽到第三個 Module
- 使用事件（`EventEmitter2`）解耦
- 重新審視是否真的需要雙向依賴

### 治標：`forwardRef`（最後手段）

```typescript
// ⚠️ 只在重構成本過高時使用，必須註解原因
@Injectable()
export class UsersService {
  constructor(
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
  ) {}
}

@Injectable()
export class OrdersService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}
}
```

---

## Module 間依賴健康度檢查

- [ ] Module 依賴圖無循環
- [ ] `exports` 只包含其他 Module 真正需要的 Provider（不是全部 public Service）
- [ ] 沒有 `forwardRef`（或有但註解了重構計劃）
- [ ] `@Global()` 只用於基礎設施
- [ ] Feature Module 之間透過 `exports`/`imports` 明確宣告依賴
- [ ] 沒有跨模組直接 `import` 類別（繞過 DI）
