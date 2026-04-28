# Module 邊界與 Dependency Injection 審查

## Checklist

### Module 邊界
- [ ] `AppModule` 僅做組合，不含 controllers / providers 業務邏輯
- [ ] Feature Module 按業務領域切分（不按技術層切）
- [ ] `imports` / `exports` 精準，沒有 export 內部實作（如 Repository）
- [ ] 沒有循環依賴（啟動不噴 `Nest can't resolve dependencies`）
- [ ] `forwardRef()` 使用有註解說明原因
- [ ] `@Global()` 只用於基礎設施（Config / Logger / Database）
- [ ] Feature 之間透過 Module 的 public API 互通，不直接 `import` 別家 Repository

### DI 正確性
- [ ] Service / Repository 都加 `@Injectable()`
- [ ] 依賴全部透過建構子注入（無 `new` 手動建構 DI-managed 類別）
- [ ] 建構子參數加 `private readonly`（標準樣式）
- [ ] 沒有誤用 `Scope.REQUEST`（會級聯退化效能）
- [ ] Provider token 一致（用 string token 時統一用 const）
- [ ] Dynamic Module 有 `forRoot` / `forRootAsync` 明確介面

---

## 常見問題與嚴重性

### 🔴 嚴重：循環依賴

```typescript
// ❌ Before：UsersService ↔ OrdersService 互相依賴
@Injectable()
export class UsersService {
  constructor(private readonly ordersService: OrdersService) {}
}

@Injectable()
export class OrdersService {
  constructor(private readonly usersService: UsersService) {}
}
// 啟動噴：Nest can't resolve dependencies
```

**治本解法**：將共用邏輯抽到第三個 Service，或用 `EventEmitter2` 解耦。

**治標解法（須註解）**：

```typescript
@Injectable()
export class UsersService {
  constructor(
    // 循環依賴：OrdersService 需要讀 User，UsersService 需要取消訂單。
    // TODO: 抽 OrderCancellationService 後可移除 forwardRef
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
  ) {}
}
```

---

### 🔴 嚴重：手動 `new` 依賴

```typescript
// ❌ Before
@Injectable()
export class OrdersService {
  private usersRepo = new UsersRepository();
  private mailer = new MailerService();

  async create(dto: CreateOrderDto) {
    const user = await this.usersRepo.findById(dto.userId); // ❌ 繞過 DI
  }
}

// ✅ After
@Injectable()
export class OrdersService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly mailer: MailerService,
  ) {}
}
```

**理由**：手動 `new` 繞過 DI，導致無法 mock、無法注入 scope、單元測試被卡死。

---

### 🟠 重要：漏打 `@Injectable()`

```typescript
// ❌ Before
export class OrdersRepository {
  constructor(@InjectRepository(Order) private repo: Repository<Order>) {}
}

// ✅ After
@Injectable()
export class OrdersRepository {
  constructor(@InjectRepository(Order) private repo: Repository<Order>) {}
}
```

症狀：啟動時 `Nest can't resolve dependencies of the XxxRepository (?)`

---

### 🟠 重要：神級 AppModule

```typescript
// ❌ Before
@Module({
  imports: [TypeOrmModule.forRoot({...})],
  controllers: [UsersController, OrdersController, ProductsController, PaymentsController, AuthController],
  providers: [
    UsersService, OrdersService, ProductsService, PaymentsService, AuthService,
    UsersRepository, OrdersRepository, ProductsRepository, PaymentsRepository,
    JwtStrategy, LocalStrategy, RolesGuard,
  ],
})
export class AppModule {}

// ✅ After：拆成 feature modules
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({...}),
    AuthModule,
    UsersModule,
    OrdersModule,
    ProductsModule,
    PaymentsModule,
  ],
})
export class AppModule {}
```

---

### 🟠 重要：誤用 `Scope.REQUEST`

```typescript
// ❌ Before（效能殺手）
@Injectable({ scope: Scope.REQUEST })
export class UsersService {
  // 每個 HTTP request 建立一個新實例，且注入它的所有 Provider 都變 REQUEST scope
}

// ✅ 替代方案 A：用 @Req() 拿 request 資訊
@Get()
findAll(@Req() req: Request) {
  return this.usersService.findAll(req.user.id);
}

// ✅ 替代方案 B：用 AsyncLocalStorage 存 request context（進階）
```

---

### 🟠 重要：Export 了內部實作

```typescript
// ❌ Before
@Module({
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository], // ❌ Repository 是內部實作
})
export class UsersModule {}

// ✅ After
@Module({
  providers: [UsersService, UsersRepository],
  exports: [UsersService], // 其他 Module 只能透過 Service 使用
})
export class UsersModule {}
```

**理由**：export Repository 讓外部繞過 Service 的業務規則直接改資料。

---

### 🟡 建議：`@Global()` 濫用

```typescript
// 🟡 Before
@Global()
@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {} // ❌ UsersService 不是基礎設施

// ✅ After：去掉 @Global()，其他 Module 明確 imports
```

**判準**：只有 Config / Logger / Database / Cache 這類「全 app 幾乎到處都會用」的基礎設施才值得 `@Global()`。

---

### 🔵 備註：建構子參數多

Service 建構子注入 > 5 個依賴時，可能是 SRP 違反。考慮：
- 拆分 Service
- 引入 Facade 物件
- 檢查是否有該抽到共用 Module 的職責

---

## 快速判定

- 循環依賴無 forwardRef 註解 → 🔴
- 手動 `new` DI-managed 類別 → 🔴
- 漏 `@Injectable()` 導致無法注入 → 🔴
- `AppModule` 直接持有 feature controllers/providers → 🟠
- `Scope.REQUEST` 無必要使用 → 🟠
- Export Repository 等內部實作 → 🟠
- `forwardRef()` 無註解 → 🟠
- `@Global()` 用於 feature 模組 → 🟡
