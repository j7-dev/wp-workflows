# 測試規範：Jest + TestingModule + supertest

## 測試分層

| 層級 | 目的 | 範圍 | 命名 |
|------|------|------|------|
| **Unit** | 驗證 class 內部邏輯 | 單一 Service / Pipe / Guard，所有依賴 mock | `*.spec.ts` |
| **Integration** | 驗證模組內多個 class 協作 | 組合真實 Module，mock 外部邊界（HTTP、第三方） | `*.spec.ts` |
| **E2E** | 驗證端到端行為 | 啟動整個 Nest app + 真實 / 測試 DB | `*.e2e-spec.ts`（放 `test/` 目錄） |

---

## Unit Test 基本模式

### 完整範例：OrdersService

```typescript
// orders/orders.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { UsersRepository } from '@/users/users.repository';
import {
  OrderNotFoundException,
  InsufficientCreditException,
} from './exceptions';

describe('OrdersService', () => {
  let service: OrdersService;
  let ordersRepo: jest.Mocked<OrdersRepository>;
  let usersRepo: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: OrdersRepository,
          useValue: {
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: UsersRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(OrdersService);
    ordersRepo = module.get(OrdersRepository);
    usersRepo = module.get(UsersRepository);
  });

  describe('create', () => {
    it('should create order when user has enough credit', async () => {
      // Arrange
      const userId = 1;
      const dto = { items: [{ productId: 10, price: 50, quantity: 2 }] };
      const user = { id: userId, credit: 200 };
      const createdOrder = { id: 100, userId, total: 100 };

      usersRepo.findById.mockResolvedValue(user as any);
      ordersRepo.create.mockResolvedValue(createdOrder as any);

      // Act
      const result = await service.create(userId, dto as any);

      // Assert
      expect(result).toEqual(createdOrder);
      expect(ordersRepo.create).toHaveBeenCalledWith({
        userId,
        total: 100,
        items: dto.items,
        status: 'pending',
      });
    });

    it('should throw InsufficientCreditException when credit is not enough', async () => {
      const userId = 1;
      const dto = { items: [{ productId: 10, price: 100, quantity: 3 }] };
      usersRepo.findById.mockResolvedValue({ id: userId, credit: 50 } as any);

      await expect(service.create(userId, dto as any))
        .rejects.toThrow(InsufficientCreditException);
      expect(ordersRepo.create).not.toHaveBeenCalled();
    });

    it('should throw when user does not exist', async () => {
      usersRepo.findById.mockResolvedValue(null);

      await expect(service.create(999, { items: [] } as any))
        .rejects.toThrow(OrderNotFoundException);
    });
  });
});
```

### Mock 型別轉換

Mock 複雜介面時，使用 `as unknown as Type` 雙重轉型：

```typescript
// ❌ TS2352 錯誤：mock 物件缺少必要屬性
const mockRepo = { findOne: jest.fn() } as Repository<User>;

// ✅ 正確
const mockRepo = { findOne: jest.fn() } as unknown as Repository<User>;

// ✅ 或用 DeepMocked（@golevelup/ts-jest）
import { createMock, DeepMocked } from '@golevelup/ts-jest';

let repo: DeepMocked<Repository<User>>;
beforeEach(() => {
  repo = createMock<Repository<User>>();
});
```

---

## Testing 常用工具

### useFactory 建立完整 mock

```typescript
{
  provide: UsersRepository,
  useFactory: () => ({
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }),
}
```

### 取得 Provider

```typescript
// 用 Class token
const service = module.get<OrdersService>(OrdersService);

// 用 string token
const apiKey = module.get<string>('API_KEY');

// 用 Symbol token
const config = module.get(CONFIG_TOKEN);
```

### 覆蓋 Provider（整合測試）

```typescript
const module = await Test.createTestingModule({
  imports: [OrdersModule],
})
  .overrideProvider(UsersRepository)
  .useValue({ findById: jest.fn().mockResolvedValue(fakeUser) })
  .compile();
```

---

## Integration Test

組合真實 Module，僅 mock 外部邊界：

```typescript
// orders/orders.module.spec.ts
describe('OrdersModule (integration)', () => {
  let app: INestApplication;
  let ordersService: OrdersService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Order, User],
          synchronize: true,
        }),
        OrdersModule,
        UsersModule,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    ordersService = module.get(OrdersService);
  });

  afterAll(() => app.close());

  it('creates order through real repository', async () => {
    // 準備真實資料
    await usersRepo.create({ id: 1, credit: 1000 });

    const order = await ordersService.create(1, {
      items: [{ productId: 1, price: 50, quantity: 2 }],
    });

    expect(order.total).toBe(100);
    expect(order.status).toBe('pending');
  });
});
```

---

## E2E Test（supertest）

```typescript
// test/orders.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';

describe('OrdersController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    await app.init();

    // 取得 token
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'Password123' });
    accessToken = res.body.accessToken;
  });

  afterAll(() => app.close());

  describe('POST /orders', () => {
    it('returns 201 and creates order', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          items: [{ productId: 1, price: 50, quantity: 2 }],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.total).toBe(100);
        });
    });

    it('returns 401 without token', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .send({ items: [] })
        .expect(401);
    });

    it('returns 400 for invalid body', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ items: [] }) // 空陣列違反 ArrayMinSize(1)
        .expect(400);
    });
  });
});
```

### jest-e2e.json 設定

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/../src/$1"
  }
}
```

---

## 測試資料管理

### 測試容器（推薦）

```typescript
import { PostgreSqlContainer } from 'testcontainers';

beforeAll(async () => {
  const pgContainer = await new PostgreSqlContainer().start();
  // 傳給 TypeORM / Prisma 設定
});
```

### In-memory SQLite（輕量）

```typescript
TypeOrmModule.forRoot({
  type: 'sqlite',
  database: ':memory:',
  entities: [...],
  synchronize: true,
  dropSchema: true,
})
```

### Factory 模式

```typescript
// test/factories/user.factory.ts
export const createUser = (overrides?: Partial<User>): User => ({
  id: 1,
  email: 'test@example.com',
  credit: 1000,
  ...overrides,
});
```

---

## Guard / Pipe 測試

```typescript
describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('returns true when no roles required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createMockExecutionContext({ user: { roles: [] } });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true when user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const ctx = createMockExecutionContext({ user: { roles: ['admin'] } });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns false when user lacks required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const ctx = createMockExecutionContext({ user: { roles: ['user'] } });
    expect(guard.canActivate(ctx)).toBe(false);
  });
});

function createMockExecutionContext(reqOverrides: any): ExecutionContext {
  return {
    getHandler: () => () => {},
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => reqOverrides,
    }),
  } as unknown as ExecutionContext;
}
```

---

## 測試命名與組織

```typescript
describe('<ClassName>', () => {
  describe('<methodName>', () => {
    it('should <expected behaviour> when <condition>', () => {});
    it('should throw <ExceptionType> when <invalid condition>', () => {});
  });
});
```

---

## AAA 模式

每個 test case 遵守 **Arrange → Act → Assert**：

```typescript
it('should calculate total correctly', () => {
  // Arrange
  const items = [{ price: 10, quantity: 2 }, { price: 5, quantity: 3 }];

  // Act
  const total = service.calculateTotal(items);

  // Assert
  expect(total).toBe(35);
});
```

---

## 常見陷阱

- ❌ 測試依賴執行順序（每個 `it` 應該獨立）
- ❌ 跨測試共用狀態（用 `beforeEach` 重置）
- ❌ Mock 未清除（`jest.clearAllMocks()` 在 `afterEach`）
- ❌ E2E 測試跑真實 production DB（必須用專用測試 DB）
- ❌ 覆蓋率追求 100% 導致測試無意義（關注關鍵分支與邊界）
