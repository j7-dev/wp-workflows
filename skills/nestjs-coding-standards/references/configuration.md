# 設定管理（ConfigService）

## 為什麼不直接用 `process.env`？

- 沒有型別安全（`process.env.PORT` 是 `string | undefined`）
- 沒有預設值管理
- 難以在測試中覆蓋
- 多環境（dev/staging/prod）設定容易散落

---

## 基本設定

```bash
pnpm add @nestjs/config
```

### `.env` 檔案

```bash
# .env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
REDIS_URL=redis://localhost:6379

JWT_SECRET=super-secret-min-32-chars-long
JWT_EXPIRATION=1h

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
```

### `.env` 必須 gitignore

```gitignore
# .gitignore
.env
.env.local
.env.*.local
```

但 `.env.example` **必須** commit（作為 schema 範本，不含機密）。

---

## 載入 ConfigModule

```typescript
// app.module.ts
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,              // 全域可注入，不用每個 Module imports
      envFilePath: ['.env.local', '.env'],
      validationSchema,            // 見下方 Joi / Zod 驗證
      validate: validateConfig,    // 或用函式驗證
      load: [appConfig, dbConfig], // 結構化設定
      cache: true,                 // 啟動後不再讀檔
    }),
  ],
})
export class AppModule {}
```

---

## 結構化設定（推薦）

不要散落在 `ConfigService.get('DB_HOST')`，改用 typed config object：

```typescript
// config/app.config.ts
import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
}));

// config/database.config.ts
export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true',
  poolSize: parseInt(process.env.DB_POOL_SIZE ?? '10', 10),
}));

// config/jwt.config.ts
export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiration: process.env.JWT_EXPIRATION ?? '1h',
}));
```

```typescript
// app.module.ts
ConfigModule.forRoot({
  isGlobal: true,
  load: [appConfig, databaseConfig, jwtConfig],
});
```

---

## 型別安全注入

```typescript
import { ConfigType } from '@nestjs/config';
import { jwtConfig } from '@/config/jwt.config';

@Injectable()
export class AuthService {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwt: ConfigType<typeof jwtConfig>,
  ) {}

  sign(payload: unknown) {
    return this.jwtService.sign(payload, {
      secret: this.jwt.secret,        // ✅ 有型別
      expiresIn: this.jwt.expiration, // ✅ 有型別
    });
  }
}
```

---

## 驗證（Joi）

```typescript
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'staging', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRATION: Joi.string().default('1h'),
  REDIS_URL: Joi.string().uri().required(),
});

// app.module.ts
ConfigModule.forRoot({
  isGlobal: true,
  validationSchema,
  validationOptions: {
    abortEarly: false,  // 顯示全部錯誤
    allowUnknown: true,
  },
});
```

啟動時若設定不合法會立刻中斷，避免 runtime 才爆。

---

## 驗證（Zod 替代）

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRATION: z.string().default('1h'),
});

export function validateConfig(raw: Record<string, unknown>) {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Config validation failed:\n${JSON.stringify(result.error.format(), null, 2)}`);
  }
  return result.data;
}

// app.module.ts
ConfigModule.forRoot({ validate: validateConfig });
```

---

## 非同步 Module 整合

結合 `ConfigService` 的 async factory：

```typescript
// app.module.ts
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    url: config.get<string>('DATABASE_URL'),
    ssl: config.get<boolean>('database.ssl'),
    autoLoadEntities: true,
    synchronize: config.get('NODE_ENV') === 'development', // ⚠️ 生產必須 false
  }),
}),

JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [jwtConfig.KEY],
  useFactory: (jwt: ConfigType<typeof jwtConfig>) => ({
    secret: jwt.secret,
    signOptions: { expiresIn: jwt.expiration },
  }),
}),
```

---

## 多環境

```bash
.env                  # 預設（commit 空殼或 .env.example）
.env.development
.env.test
.env.staging
.env.production
.env.local            # 個人覆寫（gitignore）
```

```typescript
ConfigModule.forRoot({
  envFilePath: [
    `.env.${process.env.NODE_ENV}.local`,
    `.env.${process.env.NODE_ENV}`,
    `.env.local`,
    `.env`,
  ],
});
```

---

## 機密管理（生產環境）

### ❌ 禁止

- 把 `.env.production` commit 進 repo
- 把密碼 hardcode 在程式碼
- 用明文傳給 log / 錯誤訊息

### ✅ 推薦

- **AWS Secrets Manager / SSM Parameter Store**：從環境取得 secret id，runtime 取值
- **HashiCorp Vault**：企業級
- **Doppler / Infisical**：SaaS 選項
- **K8s Secret + Sealed Secret**：K8s 環境
- **GitHub Actions secrets**：CI/CD 環境

範例：從 AWS SSM 載入

```typescript
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

export async function loadSecretsFromSSM() {
  const client = new SSMClient({ region: process.env.AWS_REGION });
  const { Parameter } = await client.send(new GetParameterCommand({
    Name: `/myapp/${process.env.NODE_ENV}/jwt_secret`,
    WithDecryption: true,
  }));
  process.env.JWT_SECRET = Parameter?.Value;
}

// main.ts
await loadSecretsFromSSM();
const app = await NestFactory.create(AppModule);
```

---

## 測試覆蓋

```typescript
describe('AuthService', () => {
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: jwtConfig.KEY,
          useValue: {
            secret: 'test-secret-min-32-chars-xxxxxxxxx',
            expiration: '15m',
          } satisfies ConfigType<typeof jwtConfig>,
        },
      ],
    }).compile();
  });
});
```

---

## 常見反模式

- ❌ `process.env.XXX` 散落在程式碼各處
- ❌ 未驗證設定就啟動（常見 runtime 爆）
- ❌ `.env` 被 commit 到 repo（機密洩漏）
- ❌ `synchronize: true` 用於生產環境（會破壞 schema）
- ❌ 在 Controller / Service 直接寫 default 值（應集中於 config 檔）
- ❌ `get('X')` 沒指定型別（拿到 `any`）
