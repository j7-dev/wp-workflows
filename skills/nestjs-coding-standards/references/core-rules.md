# 9 條核心開發規則（詳細展開）

## 規則 1：Strict Mode，禁止 `any`

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true,
    "noUncheckedIndexedAccess": true
  }
}
```

```typescript
// ❌ 禁止
function processUser(data: any) { return data.id; }

// ✅ 明確型別
function processUser(data: UserDto): number { return data.id; }

// ✅ 真的不確定用 unknown + 型別守衛
function parse(input: unknown): string {
  if (typeof input === 'string') return input;
  throw new BadRequestException('Expected string');
}
```

---

## 規則 2：DTO + class-validator 驗證所有輸入

```typescript
// ❌ 禁止：Controller 直接收 any / 手動驗證
@Post()
create(@Body() body: any) {
  if (!body.email) throw new Error('no email');
}

// ✅ 正確：DTO + 裝飾器驗證
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

@Post()
create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}
```

並在 `main.ts` 啟用全域 `ValidationPipe`：

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // 自動剝除未定義屬性
  forbidNonWhitelisted: true, // 有未定義屬性直接拒絕
  transform: true,            // 自動轉型（string → number 等）
  transformOptions: { enableImplicitConversion: true },
}));
```

---

## 規則 3：Module 單一職責

```typescript
// ❌ 神級 AppModule
@Module({
  imports: [TypeOrmModule.forRoot({...})],
  controllers: [UsersController, OrdersController, ProductsController, PaymentsController],
  providers: [UsersService, OrdersService, ProductsService, PaymentsService],
})
export class AppModule {}

// ✅ 依 feature 拆分
@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService], // 僅匯出其他模組需要的
})
export class UsersModule {}

@Module({
  imports: [UsersModule], // 明確依賴
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
})
export class OrdersModule {}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({...}),
    UsersModule,
    OrdersModule,
    ProductsModule,
  ],
})
export class AppModule {}
```

---

## 規則 4：Controller 薄層

```typescript
// ❌ 業務邏輯洩漏到 Controller
@Controller('orders')
export class OrdersController {
  @Post()
  async create(@Body() dto: CreateOrderDto) {
    const user = await this.usersRepo.findOne({ id: dto.userId });
    if (!user) throw new NotFoundException();
    const total = dto.items.reduce((s, i) => s + i.price * i.qty, 0);
    if (user.credit < total) throw new ForbiddenException();
    return this.ordersRepo.save({ userId: user.id, total, items: dto.items });
  }
}

// ✅ Controller 只協調請求/回應
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }
}

// 業務邏輯全部在 Service
@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepo: OrdersRepository,
    private readonly usersRepo: UsersRepository,
  ) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    const user = await this.usersRepo.findById(dto.userId);
    if (!user) throw new UserNotFoundException(dto.userId);
    const total = this.calculateTotal(dto.items);
    if (user.credit < total) throw new InsufficientCreditException();
    return this.ordersRepo.create({ userId: user.id, total, items: dto.items });
  }

  private calculateTotal(items: OrderItemDto[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}
```

---

## 規則 5：`@Injectable()` + 建構子注入

```typescript
// ❌ 禁止：手動 new
@Injectable()
export class OrdersService {
  private usersRepo = new UsersRepository(); // ❌
  private mailer = new MailerService();       // ❌
}

// ✅ 建構子注入 + readonly
@Injectable()
export class OrdersService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {}
}
```

---

## 規則 6：Repository Pattern

```typescript
// ❌ Service 直接操作 DataSource
@Injectable()
export class UsersService {
  constructor(private dataSource: DataSource) {}

  async findActive() {
    return this.dataSource.query('SELECT * FROM users WHERE active = true');
  }
}

// ✅ 封裝於 Repository 層
@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findActive(): Promise<User[]> {
    return this.repo.find({ where: { active: true } });
  }

  findById(id: number): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }
}

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  getActiveUsers() {
    return this.usersRepo.findActive();
  }
}
```

> Prisma 專案的對應做法：建立 `UsersRepository` 包裝 `PrismaService.user`，不要讓 Service 直接用 `this.prisma.user.xxx`。

---

## 規則 7：全域 ValidationPipe + ExceptionFilter

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全域驗證
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // 全域例外處理（統一錯誤格式）
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全域攔截器（統一回應格式）
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.listen(3000);
}
```

---

## 規則 8：認證授權

```typescript
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminUsersController {
  @Get()
  @Roles('admin', 'super-admin')
  list() { /* ... */ }

  @Delete(':id')
  @Roles('super-admin')
  remove(@Param('id', ParseIntPipe) id: number) { /* ... */ }
}

// 自訂 @Roles() 裝飾器
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

---

## 規則 9：自訂例外繼承 HttpException

```typescript
// ❌ 禁止：拋 raw Error
throw new Error('User not found');

// ✅ 使用內建
throw new NotFoundException(`User ${id} not found`);

// ✅ 自訂業務例外
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

// 使用
throw new InsufficientCreditException(100, 50);
```

---

## 禁止事項總結

- ❌ Controller 寫業務邏輯或直接查 DB
- ❌ 直接讀 `process.env`（必須 `ConfigService`）
- ❌ 拋 raw `Error`
- ❌ 繞過 `ValidationPipe` 自行驗證
- ❌ Service / Module 間循環依賴
- ❌ 使用 `forwardRef()` 除非絕對必要，且必須註解原因
- ❌ 使用 `any` 型別
- ❌ 手動 `new` 建構被 DI 管理的類別
- ❌ 跳過測試直接交付
