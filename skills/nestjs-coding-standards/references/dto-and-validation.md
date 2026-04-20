# DTO 與輸入驗證

## 為什麼需要 DTO？

- **型別安全**：Controller 方法明確知道收到什麼
- **執行期驗證**：`class-validator` 裝飾器保證輸入合法
- **自動轉型**：`class-transformer` 把 JSON 字串變成實際類別實例
- **API 文件**：`@nestjs/swagger` 從 DTO 自動生成 OpenAPI

---

## class-validator 基本用法

```typescript
// dto/create-user.dto.ts
import {
  IsEmail, IsString, IsInt, IsOptional,
  MinLength, MaxLength, Min, Max,
  IsEnum, IsUrl, IsDateString, Matches,
  ValidateNested, IsArray, ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  Admin = 'admin',
  User = 'user',
}

export class AddressDto {
  @IsString()
  @MinLength(1)
  city: string;

  @IsString()
  street: string;
}

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/[A-Z]/, { message: '密碼必須包含大寫字母' })
  @Matches(/[0-9]/, { message: '密碼必須包含數字' })
  password: string;

  @IsInt()
  @Min(18)
  @Max(150)
  age: number;

  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  tags: string[];
}
```

---

## 巢狀物件必須 `@Type()` + `@ValidateNested()`

```typescript
// ❌ 會失效：class-transformer 不知道要把 plain object 轉成 AddressDto
export class CreateUserDto {
  @ValidateNested()
  address: AddressDto;  // ❌ 收到的是 plain object
}

// ✅ 正確
import { Type } from 'class-transformer';

export class CreateUserDto {
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}
```

---

## 陣列的巢狀驗證

```typescript
export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class OrderItemDto {
  @IsInt()
  productId: number;

  @IsInt()
  @Min(1)
  quantity: number;
}
```

---

## Query / Param 驗證

```typescript
// dto/list-orders.query.dto.ts
export class ListOrdersQueryDto {
  @IsOptional()
  @Type(() => Number)  // query string 都是字串，要手動轉
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}

@Get()
list(@Query() query: ListOrdersQueryDto) {
  return this.ordersService.list(query);
}
```

> 若全域 `ValidationPipe` 設定了 `transform: true` + `transformOptions: { enableImplicitConversion: true }`，基本型別（number、boolean）不需要 `@Type()`。複雜轉換仍然要。

---

## 全域 ValidationPipe 設定

```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,                 // 自動剝除 DTO 未定義的屬性
  forbidNonWhitelisted: true,       // 有未定義屬性就拒絕（回 400）
  transform: true,                  // 自動把 plain object 轉 DTO 實例
  transformOptions: {
    enableImplicitConversion: true, // query string → number/boolean 自動轉
  },
  disableErrorMessages: process.env.NODE_ENV === 'production', // 生產環境隱藏細節
}));
```

---

## 共用的 Partial 模式（Update DTO）

```typescript
import { PartialType } from '@nestjs/swagger';
// 或 import { PartialType } from '@nestjs/mapped-types';

export class UpdateUserDto extends PartialType(CreateUserDto) {}

// 所有欄位變可選（@IsOptional() 自動套用）
```

其他工具：

```typescript
import { PickType, OmitType, IntersectionType } from '@nestjs/swagger';

export class LoginDto extends PickType(CreateUserDto, ['email', 'password']) {}
export class UpdateProfileDto extends OmitType(CreateUserDto, ['password']) {}
```

---

## Zod 替代方案（nestjs-zod）

若專案統一用 Zod，可用 `nestjs-zod`：

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(64),
  age: z.number().int().min(18).max(150),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}

// Controller 用法完全一樣
@Post()
create(@Body() dto: CreateUserDto) { /* dto 已是 typed 且驗證過 */ }

// main.ts
import { ZodValidationPipe } from 'nestjs-zod';
app.useGlobalPipes(new ZodValidationPipe());
```

**選擇準則**：
- 既有 NestJS 專案：用 class-validator（官方標配、Swagger 整合好）
- 全棧都用 Zod：用 nestjs-zod（schema 與前端共用）
- **絕不混用**：同一專案只能選一種

---

## 自訂驗證器

```typescript
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, registerDecorator, ValidationOptions } from 'class-validator';

@ValidatorConstraint({ async: true })
export class IsEmailUnique implements ValidatorConstraintInterface {
  constructor(private readonly usersRepo: UsersRepository) {}

  async validate(email: string): Promise<boolean> {
    const user = await this.usersRepo.findByEmail(email);
    return !user;
  }

  defaultMessage(): string {
    return 'Email already exists';
  }
}

export function IsUniqueEmail(options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      validator: IsEmailUnique,
    });
  };
}

// 使用
export class CreateUserDto {
  @IsEmail()
  @IsUniqueEmail()
  email: string;
}
```

---

## 常見陷阱

- ❌ 忘記 `@Type()` → 巢狀 DTO 不會被轉型，驗證永遠通過
- ❌ Query string 數字欄位忘記 `@Type(() => Number)` → 驗證 `@IsInt()` 會失敗（因為是字串）
- ❌ 用 `interface` 當 DTO → 沒有 runtime 資訊，裝飾器失效
- ❌ Body 內含敏感欄位（如 `role: admin`）沒設 `whitelist: true` → 權限繞過
- ❌ Production 未關閉 `disableErrorMessages` → 洩漏驗證邏輯細節
