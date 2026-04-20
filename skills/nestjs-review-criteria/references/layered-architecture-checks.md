# Controller / Service / Repository 分層審查

## Checklist

### Controller 薄層
- [ ] Controller 方法只做：接收請求 → 呼叫 Service → 回應
- [ ] 無業務邏輯（if/else 業務規則、計算、資料組裝）
- [ ] 無直接資料庫操作（`@InjectRepository`、`prisma.xxx`）
- [ ] 無使用 `@Res()` 繞過框架回應機制（除非串流等特殊需求）
- [ ] HTTP 狀態碼透過 `@HttpCode()` 或例外控制，不用 `res.status()`

### Service
- [ ] 包含業務邏輯，不含 HTTP / DB 原生 API
- [ ] 透過 Repository 存取資料，不直接用 ORM 原生物件
- [ ] 跨資源操作使用 Transaction
- [ ] 拋業務例外（自訂 `HttpException` 或內建）

### Repository
- [ ] 封裝資料存取，ORM 操作不洩漏到 Service
- [ ] 方法命名以查詢意圖為主（`findById` / `findActive` / `findByUserPaginated`）
- [ ] 不含業務規則判斷（那是 Service 的事）
- [ ] 不對外拋 `HttpException`（資料層應該拋 domain error 或直接回 null）

---

## 常見問題與嚴重性

### 🔴 嚴重：Controller 直接操作資料庫

```typescript
// ❌ Before
@Controller('users')
export class UsersController {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.repo.findOne({ where: { id } });
  }
}

// ✅ After
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }
}
```

---

### 🔴 嚴重：業務邏輯洩漏到 Controller

```typescript
// ❌ Before
@Post()
async create(@Body() dto: CreateOrderDto, @CurrentUser() user: User) {
  if (user.credit < dto.total) {
    throw new ForbiddenException('Insufficient credit');
  }
  const order = await this.ordersRepo.save({ ...dto, userId: user.id });
  await this.mailer.send({
    to: user.email,
    subject: 'Order confirmation',
    body: `Your order #${order.id} has been created.`,
  });
  return order;
}

// ✅ After
@Post()
create(@Body() dto: CreateOrderDto, @CurrentUser('id') userId: number) {
  return this.ordersService.create(userId, dto);
}

// Service
async create(userId: number, dto: CreateOrderDto): Promise<Order> {
  const user = await this.usersRepo.findById(userId);
  if (user.credit < dto.total) {
    throw new InsufficientCreditException(dto.total, user.credit);
  }
  const order = await this.ordersRepo.create({ ...dto, userId });
  await this.mailer.sendOrderConfirmation(user.email, order);
  return order;
}
```

---

### 🔴 嚴重：Service 直接用 ORM 原生 API

```typescript
// ❌ Before
@Injectable()
export class UsersService {
  constructor(private readonly dataSource: DataSource) {}

  async findActive() {
    return this.dataSource.query('SELECT * FROM users WHERE active = true');
  }
}

// ✅ After：封裝於 Repository
@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  findActive(): Promise<User[]> {
    return this.repo.find({ where: { active: true } });
  }
}

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  getActiveUsers(): Promise<User[]> {
    return this.usersRepo.findActive();
  }
}
```

**Prisma 對應**：不要讓 Service 直接 `this.prisma.user.xxx`，建立 `UsersRepository` 包裝。

---

### 🟠 重要：使用 `@Res()` 繞過框架

```typescript
// ❌ Before
@Get(':id')
async findOne(@Param('id') id: string, @Res() res: Response) {
  const user = await this.usersService.findById(+id);
  if (!user) return res.status(404).send({ message: 'Not found' });
  return res.json(user);
}

// ✅ After
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
  return this.usersService.findById(id); // 由 Service 拋 NotFoundException
}
```

**理由**：`@Res()` 會關閉 Interceptor / Exception Filter 的自動處理，破壞統一回應格式。

---

### 🟠 重要：Repository 內含業務規則

```typescript
// ❌ Before
@Injectable()
export class OrdersRepository {
  async create(dto: CreateOrderDto) {
    // 業務規則洩漏到資料層
    if (dto.total > 10000) {
      throw new ForbiddenException('Order total exceeds limit');
    }
    return this.repo.save(dto);
  }
}

// ✅ After：Repository 只存取，Service 做判斷
@Injectable()
export class OrdersService {
  async create(dto: CreateOrderDto) {
    if (dto.total > 10000) {
      throw new OrderTotalExceededException(dto.total);
    }
    return this.ordersRepo.create(dto);
  }
}

@Injectable()
export class OrdersRepository {
  create(data: CreateOrderDto): Promise<Order> {
    return this.repo.save(data);
  }
}
```

---

### 🟠 重要：多資源操作未使用 Transaction

```typescript
// ❌ Before（中途失敗會資料不一致）
async transferCredit(fromId: number, toId: number, amount: number) {
  await this.usersRepo.decreaseCredit(fromId, amount);
  await this.usersRepo.increaseCredit(toId, amount); // 若這步失敗，錢就飛了
}

// ✅ After（TypeORM）
async transferCredit(fromId: number, toId: number, amount: number) {
  return this.dataSource.transaction(async (manager) => {
    const repo = manager.getRepository(User);
    await repo.decrement({ id: fromId }, 'credit', amount);
    await repo.increment({ id: toId }, 'credit', amount);
  });
}

// ✅ After（Prisma）
async transferCredit(fromId: number, toId: number, amount: number) {
  return this.prisma.$transaction([
    this.prisma.user.update({ where: { id: fromId }, data: { credit: { decrement: amount } } }),
    this.prisma.user.update({ where: { id: toId }, data: { credit: { increment: amount } } }),
  ]);
}
```

---

### 🟡 建議：Repository 方法命名不清

```typescript
// 🟡 Before
findData(userId: number): Promise<Order[]>  // 找什麼 data？
getUsers(): Promise<User[]>                  // 所有？active？

// ✅ After
findOrdersByUserId(userId: number): Promise<Order[]>
findActiveUsers(): Promise<User[]>
findUsersPaginated(params: PaginationParams): Promise<Paginated<User>>
```

---

### 🟡 建議：Service 方法過肥

```typescript
// 🟡 Before：單一方法 100+ 行，處理多個邊界
async complexFlow(dto: ComplexDto) {
  // 驗證、查詢、計算、建立、通知、記錄 全部擠一起
}

// ✅ After：拆成小方法
async complexFlow(dto: ComplexDto) {
  const user = await this.validateUser(dto.userId);
  const total = this.calculateTotal(dto.items);
  await this.checkCredit(user, total);
  const order = await this.persistOrder(user, dto, total);
  await this.notifyUser(user, order);
  return order;
}
```

---

## 快速判定

- Controller 注入 Repository 或 DataSource → 🔴
- Controller 方法有 if/else 業務規則 → 🔴
- Service 用 `dataSource.query()` / 直接 `prisma.xxx.findMany()` → 🔴
- Controller 使用 `@Res()` 無特殊理由 → 🟠
- Repository 拋 `HttpException` 或有業務規則 → 🟠
- 多資源操作未加 Transaction → 🟠
- Repository / Service 方法命名模糊 → 🟡
- Service 方法超過 50 行未拆分 → 🟡
