# DTO 與輸入驗證審查

## Checklist

- [ ] 所有 `@Body()` / `@Query()` / `@Param()` 都使用 DTO（不是 `any` 或 inline type）
- [ ] DTO 使用 `class-validator` 裝飾器（或 `nestjs-zod`）
- [ ] 巢狀物件加 `@ValidateNested()` + `@Type(() => NestedDto)`
- [ ] 陣列巢狀加 `@ValidateNested({ each: true })` + `@Type()`
- [ ] Query string 數字欄位有 `@Type(() => Number)` 或全域 `enableImplicitConversion: true`
- [ ] 全域 `ValidationPipe` 設定 `whitelist: true` + `forbidNonWhitelisted: true` + `transform: true`
- [ ] 敏感欄位未從輸入 DTO 流入（如 `role`、`isAdmin` 不能從 body 設定）
- [ ] Update DTO 使用 `PartialType(CreateDto)`，避免重複定義
- [ ] DTO 與 Entity 分離（Entity 是 DB 層，DTO 是 API 層）
- [ ] 同專案只用 class-validator 或 Zod 一種，不混用
- [ ] Swagger 裝飾器（`@ApiProperty`）存在於公開 API 的 DTO

---

## 常見問題與嚴重性

### 🔴 嚴重：收 `any` 或無驗證

```typescript
// ❌ Before
@Post()
create(@Body() body: any) {
  return this.service.create(body);
}

// ✅ After
@Post()
create(@Body() dto: CreateUserDto) {
  return this.service.create(dto);
}
```

---

### 🔴 嚴重：權限繞過（敏感欄位可透過 body 設定）

```typescript
// ❌ Before：攻擊者可 POST { email, password, role: 'admin' }
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  role?: string; // ❌
}

// ✅ After：role 由 Service 根據授權邏輯設定
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
  // 沒有 role 欄位
}

// Service
async create(dto: CreateUserDto, actor: User): Promise<User> {
  const role = actor?.role === 'admin' ? dto.requestedRole ?? 'user' : 'user';
  return this.usersRepo.create({ ...dto, role });
}
```

**搭配**：全域 `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` 會自動剝除並拒絕多餘欄位。

---

### 🟠 重要：巢狀物件未用 `@Type()`

```typescript
// ❌ Before：address 永遠是 plain object，驗證無效
export class CreateUserDto {
  @ValidateNested()
  address: AddressDto;
}

// ✅ After
import { Type } from 'class-transformer';

export class CreateUserDto {
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}
```

---

### 🟠 重要：ValidationPipe 未設定 `whitelist`

```typescript
// ❌ Before
app.useGlobalPipes(new ValidationPipe());

// ✅ After
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

**理由**：沒設 `whitelist` 時，攻擊者可夾帶額外欄位。若 Service 用 `{ ...dto }` 往 DB 寫，就會寫入未預期的欄位。

---

### 🟠 重要：DTO 與 Entity 混用

```typescript
// ❌ Before
@Post()
create(@Body() user: User) {  // User 是 Entity
  return this.usersRepo.save(user);
}

// ✅ After
@Post()
create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}

// Service 內部才轉 Entity
async create(dto: CreateUserDto): Promise<User> {
  return this.usersRepo.create({
    email: dto.email,
    passwordHash: await hash(dto.password),
    // ...
  });
}
```

---

### 🟡 建議：Query 數字欄位沒轉型

```typescript
// 🟡 Before（若全域未設 enableImplicitConversion）
export class ListOrdersQueryDto {
  @IsInt()
  @IsOptional()
  page?: number; // 實際收到是 '1'（字串），驗證失敗
}

// ✅ After
export class ListOrdersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;
}

// 或全域設定：
app.useGlobalPipes(new ValidationPipe({
  transform: true,
  transformOptions: { enableImplicitConversion: true },
}));
```

---

### 🟡 建議：重複定義 Update DTO

```typescript
// 🟡 Before：把 CreateDto 全部欄位複製一份改成 @IsOptional()
export class UpdateUserDto {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MinLength(8) password?: string;
  // ...
}

// ✅ After：用 PartialType
import { PartialType } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

---

### 🟡 建議：Swagger 文件缺失

```typescript
// 🟡 Before
export class CreateUserDto {
  @IsEmail()
  email: string;
}

// ✅ After
export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}
```

公開 API 的 DTO 應有 Swagger 裝飾器，方便前端 / 第三方整合。

---

### 🔵 備註：自訂驗證器命名

```typescript
// 🔵 建議
// Decorator 以 `Is` 開頭：IsUniqueEmail, IsValidCoupon
// Constraint class 以 `Is` + `Constraint` 結尾：IsUniqueEmailConstraint
```

---

## 快速判定

- Controller 收 `any` 或無 DTO → 🔴
- 敏感欄位（role、isAdmin、ownerId）可由 body 傳入 → 🔴
- 巢狀 DTO 無 `@Type()` → 🟠
- `ValidationPipe` 無 `whitelist` + `forbidNonWhitelisted` → 🟠
- DTO 與 Entity 混用 → 🟠
- Query 數字欄位無轉型 → 🟡
- Update DTO 未用 `PartialType` → 🟡
- 公開 API DTO 無 Swagger 裝飾器 → 🟡
- 專案混用 class-validator + Zod → 🟡
