# 測試覆蓋審查

## Checklist

### 單元測試（*.spec.ts）
- [ ] 每個 Service 有對應 spec 檔
- [ ] 關鍵 Guard / Pipe / Filter 有單元測試
- [ ] 依賴全部 mock（透過 `Test.createTestingModule` + `useValue`）
- [ ] 命名遵循 `describe(ClassName) > describe(methodName) > it(behaviour)`
- [ ] 測試遵循 AAA（Arrange / Act / Assert）
- [ ] 邊界條件（空陣列、null、最大值）有覆蓋
- [ ] 錯誤路徑（拋例外）有覆蓋
- [ ] `jest.clearAllMocks()` 在 `afterEach` 或 `beforeEach`

### 整合測試
- [ ] 關鍵業務流程有整合測試（組裝真實 Module）
- [ ] 使用測試 DB（Testcontainers / SQLite in-memory）
- [ ] 不汙染 production / 開發 DB

### E2E 測試
- [ ] 關鍵 endpoint 有 E2E（POST / PUT / DELETE 主要路徑）
- [ ] 包含 happy path + 認證失敗 + 驗證失敗 + 授權失敗
- [ ] 使用 `supertest` + `app.getHttpServer()`
- [ ] 測試檔放 `test/*.e2e-spec.ts`

### 前置檢查
- [ ] `pnpm test` 全綠（所有單元 + 整合）
- [ ] `pnpm test:e2e` 全綠（若配置）
- [ ] 覆蓋率未退化（若專案有設門檻）

---

## 常見問題與嚴重性

### 🔴 嚴重：新增 Service 無測試

```typescript
// ❌ 新增 OrdersService 含 200 行業務邏輯但無 orders.service.spec.ts
// 自動判 🔴

// ✅ 至少覆蓋：
// - 主要 method 的 happy path
// - 主要錯誤路徑（拋例外）
// - 邊界條件（空、null、極值）
```

---

### 🔴 嚴重：測試依賴真實 production DB

```typescript
// ❌ Before
beforeAll(async () => {
  const module = await Test.createTestingModule({
    imports: [AppModule], // 讀 .env，連 production DB
  }).compile();
});

// ✅ After：用測試專用設定
beforeAll(async () => {
  const module = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:',
        entities: [...],
        synchronize: true,
      }),
      UsersModule,
    ],
  }).compile();
});
```

---

### 🟠 重要：Mock 不完整導致 false positive

```typescript
// ❌ Before
const ordersRepo = { create: jest.fn() };
ordersRepo.create.mockResolvedValue(fakeOrder);

await service.create(userId, dto);
expect(ordersRepo.create).toHaveBeenCalled(); // 通過，但不知道參數

// ✅ After
expect(ordersRepo.create).toHaveBeenCalledWith({
  userId: 1,
  total: 100,
  items: dto.items,
  status: 'pending',
});
```

---

### 🟠 重要：缺少錯誤路徑測試

```typescript
// ❌ Before：只測 happy path
describe('create', () => {
  it('should create order', async () => {
    // arrange happy path
    const result = await service.create(userId, dto);
    expect(result).toBeDefined();
  });
});

// ✅ After：補齊錯誤路徑
describe('create', () => {
  it('should create order when user has enough credit', async () => {...});

  it('should throw InsufficientCreditException when credit insufficient', async () => {
    usersRepo.findById.mockResolvedValue({ credit: 10 });
    await expect(service.create(1, { total: 100 } as any))
      .rejects.toThrow(InsufficientCreditException);
  });

  it('should throw NotFoundException when user does not exist', async () => {
    usersRepo.findById.mockResolvedValue(null);
    await expect(service.create(999, dto))
      .rejects.toThrow(NotFoundException);
  });
});
```

---

### 🟠 重要：Mock 型別轉換錯誤

```typescript
// ❌ Before（TypeScript strict 會噴 TS2352）
const mockRepo = { findOne: jest.fn() } as Repository<User>;

// ✅ After
const mockRepo = { findOne: jest.fn() } as unknown as Repository<User>;

// 或
import { createMock, DeepMocked } from '@golevelup/ts-jest';
const mockRepo: DeepMocked<Repository<User>> = createMock<Repository<User>>();
```

---

### 🟠 重要：E2E 測試未涵蓋授權失敗

```typescript
// ❌ Before：只測成功路徑
it('returns 201', () =>
  request(app.getHttpServer())
    .post('/orders')
    .set('Authorization', `Bearer ${validToken}`)
    .send(validDto)
    .expect(201));

// ✅ After：補授權與驗證失敗
describe('POST /orders', () => {
  it('returns 201 for valid input', () => {...});

  it('returns 401 without token', () =>
    request(app.getHttpServer())
      .post('/orders')
      .send(validDto)
      .expect(401));

  it('returns 400 for invalid dto', () =>
    request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ items: [] }) // violates ArrayMinSize
      .expect(400));

  it('returns 403 when accessing other users order', () =>
    request(app.getHttpServer())
      .get(`/orders/${otherUsersOrderId}`)
      .set('Authorization', `Bearer ${validToken}`)
      .expect(403));
});
```

---

### 🟡 建議：測試命名不清

```typescript
// 🟡 Before
it('test 1', () => {});
it('works', () => {});
it('should work correctly', () => {});

// ✅ After
it('should return user when id exists', () => {});
it('should throw NotFoundException when id does not exist', () => {});
it('should exclude deleted users from result', () => {});
```

---

### 🟡 建議：測試間共用可變狀態

```typescript
// 🟡 Before
let sharedUser: User;

beforeAll(() => { sharedUser = { id: 1, credit: 100 } as User; });

it('test A', () => {
  sharedUser.credit -= 50; // 改了共用狀態
});

it('test B', () => {
  expect(sharedUser.credit).toBe(100); // ❌ 失敗：前一個測試改了它
});

// ✅ After
beforeEach(() => {
  sharedUser = { id: 1, credit: 100 } as User; // 每次重置
});

// 或用 factory
const createUser = (overrides?: Partial<User>): User =>
  ({ id: 1, credit: 100, ...overrides } as User);
```

---

### 🟡 建議：Mock 未清除

```typescript
// 🟡 Before
// 沒 clearAllMocks，上一個測試的 mock 影響下一個

// ✅ After
afterEach(() => {
  jest.clearAllMocks();
});

// 或在 jest.config 設 clearMocks: true
```

---

### 🔵 備註：Snapshot 測試濫用

Snapshot 適合穩定的 UI 或序列化結構。邏輯測試改用 explicit assertions（`expect(result).toEqual({...})`）。

---

## 快速判定

- 新增 Service 無 spec 檔 → 🔴
- 測試連真實 production / dev DB → 🔴
- Mock 只 `toHaveBeenCalled()` 不驗參數 → 🟠
- 只測 happy path，缺錯誤路徑 → 🟠
- Mock 型別用 `as Type` 而非 `as unknown as Type` → 🟠
- E2E 無覆蓋 401 / 403 / 400 → 🟠
- 測試命名模糊（`test 1` / `works`）→ 🟡
- 測試間共用可變狀態 → 🟡
- 無 `clearAllMocks` / `clearMocks: true` → 🟡
