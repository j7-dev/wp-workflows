# TypeScript 型別安全審查

## Checklist

- [ ] `tsconfig.json` 啟用 `strict: true`
- [ ] 無 `any` 型別（含隱式 any：未標型別的參數、catch error）
- [ ] 無 `@ts-ignore` / `@ts-expect-error`（若有必須註解原因）
- [ ] 無濫用 type assertion（`as Xxx`）繞過編譯錯誤
- [ ] 所有公開 API（exported function、class method）有明確回傳型別
- [ ] 使用 `unknown` + 型別守衛處理不確定輸入
- [ ] `null` / `undefined` 明確處理（非 optional chain 掩蓋問題）
- [ ] 列舉值使用 `as const` 或 `enum`，不用 magic string
- [ ] `tsc --noEmit` 通過，無 error / warning

---

## 常見問題與嚴重性

### 🔴 嚴重：使用 `any`

```typescript
// ❌ Before
@Post()
create(@Body() dto: any) {
  return this.service.create(dto);
}

// ✅ After
@Post()
create(@Body() dto: CreateOrderDto) {
  return this.service.create(dto);
}
```

**理由**：`any` 關閉所有型別檢查，是大型專案腐化的主要原因。

---

### 🔴 嚴重：隱式 any

```typescript
// ❌ 參數沒標型別（strict 下會報錯，但若有人加了 // @ts-ignore 就過了）
function calculate(items) {
  return items.reduce((s, i) => s + i.price, 0);
}

// ✅ After
function calculate(items: OrderItem[]): number {
  return items.reduce((s, i) => s + i.price, 0);
}
```

---

### 🟠 重要：catch error 未標型別

```typescript
// ❌ Before（TS 4.4+ 預設 unknown，但很多專案關掉了）
try {
  await doSomething();
} catch (err) {
  console.log(err.message); // err 可能不是 Error
}

// ✅ After
try {
  await doSomething();
} catch (err) {
  if (err instanceof Error) {
    this.logger.error(err.message, err.stack);
  } else {
    this.logger.error(String(err));
  }
}
```

---

### 🟠 重要：type assertion 繞過檢查

```typescript
// ❌ Before
const user = req.user as User; // runtime 是 undefined 怎麼辦？

// ✅ After
const user = req.user;
if (!user) throw new UnauthorizedException();
// 此時 user 被窄化為 User
```

Mock 測試中用 `as unknown as Type` 是唯一可接受的 assertion 場景。

---

### 🟡 建議：回傳型別沒標註

```typescript
// 🟡 Before
getActiveUsers() {
  return this.usersRepo.findActive();
}

// ✅ After
getActiveUsers(): Promise<User[]> {
  return this.usersRepo.findActive();
}
```

公開方法加上回傳型別：
1. 作為文件
2. 防止誤改實作時靜默改變 API

---

### 🟡 建議：magic string

```typescript
// 🟡 Before
if (order.status === 'pending') { /* ... */ }

// ✅ After
const ORDER_STATUS = {
  Pending: 'pending',
  Confirmed: 'confirmed',
  Cancelled: 'cancelled',
} as const;
type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

if (order.status === ORDER_STATUS.Pending) { /* ... */ }
```

---

### 🟡 建議：nullable 未處理

```typescript
// 🟡 Before
const user = await this.usersRepo.findById(id);
return user.email.toLowerCase(); // user 可能 null

// ✅ After
const user = await this.usersRepo.findById(id);
if (!user) throw new NotFoundException();
return user.email.toLowerCase();
```

---

## 快速判定

- 發現 `any` → 🔴
- 發現 `@ts-ignore` 無註解 → 🔴
- 發現 `as Xxx` 繞過編譯錯誤 → 🟠
- 發現 catch err 直接用 `err.message` → 🟠
- 公開方法缺回傳型別 → 🟡
- magic string / number → 🟡
