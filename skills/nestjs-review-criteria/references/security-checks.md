# 安全性審查

## Checklist

### 認證與授權
- [ ] 所有需登入端點有 `@UseGuards(JwtAuthGuard)` 或同級保護
- [ ] 授權檢查粒度到方法層級（`@Roles()` / `@Permissions()`）
- [ ] JWT secret 至少 32 字元，來自 `ConfigService`
- [ ] Token expiration 合理（access token ≤ 1h，refresh token 有輪替）
- [ ] 密碼 hash 使用 bcrypt / argon2（不是 md5 / sha1）
- [ ] 登入失敗不洩漏「帳號不存在」vs「密碼錯誤」（統一 401）

### 輸入驗證
- [ ] 所有外部輸入經 DTO 驗證
- [ ] `ValidationPipe` 全域設定 `whitelist: true` + `forbidNonWhitelisted: true`
- [ ] 敏感欄位（`role`、`isAdmin`、`ownerId`）不可由 body 設定
- [ ] 檔案上傳限制大小（`MaxFileSizeValidator`）與類型（`FileTypeValidator`）
- [ ] 無字串拼接 SQL（使用 ORM / parameterized query）

### 設定與機密
- [ ] 不直接讀 `process.env`，使用 `ConfigService`
- [ ] `.env` 被 `.gitignore` 排除
- [ ] `.env.example` commit 但不含真實 secret
- [ ] Production 環境 `TypeORM.synchronize` / `Prisma.db push --accept-data-loss` 為 false
- [ ] Production 關閉 Swagger（或限 IP / 需認證）
- [ ] 啟動時驗證必要環境變數（Joi / Zod schema）

### HTTP 層
- [ ] 啟用 `helmet` middleware
- [ ] CORS 白名單限制（不用 `*`）
- [ ] rate limiting（`@nestjs/throttler`）
- [ ] 啟用 `app.enableShutdownHooks()` 優雅關閉

### 敏感資訊
- [ ] 錯誤回應不洩漏 stack trace / SQL / 檔案路徑
- [ ] 日誌不記錄密碼 / token / 完整信用卡號
- [ ] API 回應不含密碼 hash / 內部 ID

---

## 常見問題與嚴重性

### 🔴 嚴重：未保護的敏感端點

```typescript
// ❌ Before
@Controller('admin/users')
export class AdminUsersController {
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.usersService.delete(+id);
  }
}

// ✅ After
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminUsersController {
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.delete(id);
  }
}
```

---

### 🔴 嚴重：密碼用 md5 / sha1 / 明文

```typescript
// ❌ Before
const hash = crypto.createHash('md5').update(password).digest('hex');

// ✅ After
import * as bcrypt from 'bcrypt';
const hash = await bcrypt.hash(password, 12);
const valid = await bcrypt.compare(password, hash);

// 或 argon2（更現代）
import * as argon2 from 'argon2';
const hash = await argon2.hash(password);
```

---

### 🔴 嚴重：JWT secret 弱 / 寫死

```typescript
// ❌ Before
JwtModule.register({
  secret: 'secret', // 🔥
  // 或
  secret: process.env.JWT_SECRET || 'fallback-secret', // 🔥
})

// ✅ After
JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    secret: config.getOrThrow<string>('JWT_SECRET'), // 無值直接 throw
    signOptions: { expiresIn: '15m' },
  }),
});

// ConfigModule 啟動時驗證
validationSchema: Joi.object({
  JWT_SECRET: Joi.string().min(32).required(),
}),
```

---

### 🔴 嚴重：SQL 注入

```typescript
// ❌ Before
async findByEmail(email: string) {
  return this.dataSource.query(`SELECT * FROM users WHERE email = '${email}'`);
}

// ✅ After
async findByEmail(email: string): Promise<User | null> {
  return this.repo.findOne({ where: { email } });
  // 或 parameterized
  return this.dataSource.query(
    'SELECT * FROM users WHERE email = $1',
    [email],
  );
}
```

---

### 🔴 嚴重：CORS 全開

```typescript
// ❌ Before
app.enableCors({ origin: '*' });

// ✅ After
app.enableCors({
  origin: config.get<string[]>('CORS_ORIGINS'),
  credentials: true,
});
```

**注意**：若 API 用 cookie 認證，`origin: '*'` + `credentials: true` 瀏覽器會拒絕。

---

### 🟠 重要：未啟用 helmet / rate limiting

```typescript
// ✅ main.ts
import helmet from 'helmet';

app.use(helmet());

// app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
```

---

### 🟠 重要：登入時機攻擊可區分帳號

```typescript
// ❌ Before
async validate(email: string, password: string) {
  const user = await this.usersRepo.findByEmail(email);
  if (!user) throw new UnauthorizedException('User not found');
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedException('Invalid password');
  return user;
}

// ✅ After：統一錯誤訊息 + 固定時間比對
async validate(email: string, password: string) {
  const user = await this.usersRepo.findByEmail(email);
  const hash = user?.passwordHash ?? '$2b$12$invalidhashfordummycompare';
  const valid = await bcrypt.compare(password, hash);
  if (!user || !valid) {
    throw new UnauthorizedException('Invalid credentials');
  }
  return user;
}
```

---

### 🟠 重要：檔案上傳無限制

```typescript
// ❌ Before
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
upload(@UploadedFile() file: Express.Multer.File) {
  return this.storage.save(file);
}

// ✅ After
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
upload(
  @UploadedFile(new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
      new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
    ],
  }))
  file: Express.Multer.File,
) {
  return this.storage.save(file);
}
```

---

### 🟠 重要：日誌洩漏密碼 / token

```typescript
// ❌ Before
this.logger.log(`Login attempt: ${JSON.stringify(dto)}`); // 可能含 password

// ✅ After
this.logger.log(`Login attempt for email: ${dto.email}`); // 只記非敏感欄位
```

---

### 🟡 建議：API 回應含 passwordHash

```typescript
// 🟡 Before
@Get(':id')
findOne(@Param('id') id: number): Promise<User> {
  return this.usersRepo.findById(id); // 回傳含 passwordHash
}

// ✅ After：使用 class-transformer 的 @Exclude
@Entity()
export class User {
  @Column()
  @Exclude()
  passwordHash: string;
}

// main.ts
app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

// 或明確 Response DTO
class UserResponseDto {
  id: number;
  email: string;
  // 不含 passwordHash
}
```

---

### 🟡 建議：Production 仍啟用 Swagger

```typescript
// 🟡 Before
SwaggerModule.setup('api', app, document);

// ✅ After
if (config.get('NODE_ENV') !== 'production') {
  SwaggerModule.setup('api', app, document);
}
// 或加認證
```

---

### 🔵 備註：缺 CSP / HSTS

`helmet()` 預設會加 CSP / HSTS，確認沒被覆蓋。

---

## 快速判定

- 敏感端點無 Guard → 🔴
- 密碼用 md5/sha1/明文 → 🔴
- JWT secret < 32 字元 / 寫死 / fallback → 🔴
- 字串拼接 SQL → 🔴
- CORS `origin: '*'` + 認證 API → 🔴
- 無 helmet / rate limiting → 🟠
- 登入錯誤訊息區分帳號/密碼 → 🟠
- 檔案上傳無大小/類型限制 → 🟠
- 日誌含密碼/token → 🟠
- API 回傳 passwordHash → 🟡
- Production 啟用 Swagger 無認證 → 🟡
