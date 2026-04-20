# Better Auth v1.4 API Reference

> 對應版本：v1.4.18 | 來源：https://www.better-auth.com/docs/

## 目錄

- [betterAuth() 設定選項](#betterauth-設定選項)
- [emailAndPassword 設定](#emailandpassword-設定)
- [session 設定](#session-設定)
- [advanced 設定](#advanced-設定)
- [auth.api 伺服器端方法](#authapi-伺服器端方法)
- [Express 整合 API](#express-整合-api)
- [錯誤處理](#錯誤處理)

---

## betterAuth() 設定選項

```typescript
import { betterAuth } from "better-auth";

const auth = betterAuth({
  // 必要：加密 secret（32+ 字元）
  secret: string,

  // 可選：Auth server 的公開 URL，同 origin 時可省略
  baseURL?: string,

  // 可選：允許的跨域來源（CORS）
  trustedOrigins?: string[],

  // 必要：資料庫設定（見 database-schema.md）
  database: DatabaseAdapter,

  // 可選：Email/Password 認證
  emailAndPassword?: EmailAndPasswordConfig,

  // 可選：OAuth 社群登入
  socialProviders?: SocialProvidersConfig,

  // 可選：Plugin 陣列
  plugins?: Plugin[],

  // 可選：Session 設定
  session?: SessionConfig,

  // 可選：User 自訂欄位
  user?: UserConfig,

  // 可選：進階設定
  advanced?: AdvancedConfig,

  // 可選：實驗性功能
  experimental?: { joins?: boolean },

  // 可選：App 名稱（顯示在 twoFactor TOTP 上）
  appName?: string,
});
```

---

## emailAndPassword 設定

```typescript
emailAndPassword: {
  // 必要：啟用 email/password 認證
  enabled: boolean,

  // 是否要求 email 驗證才能登入（default: false）
  requireEmailVerification?: boolean,

  // 是否停用新用戶註冊（default: false）
  disableSignUp?: boolean,

  // 是否在密碼重設後撤銷所有 session（default: false）
  revokeSessionsOnPasswordReset?: boolean,

  // 密碼最小長度（default: 8）
  minPasswordLength?: number,

  // 密碼最大長度（default: 128）
  maxPasswordLength?: number,

  // 重設密碼 token 有效秒數（default: 3600）
  resetPasswordTokenExpiresIn?: number,

  // 發送 email 驗證信的 callback
  sendVerificationEmail?: (params: {
    user: User,
    url: string,    // 驗證連結（含 token）
    token: string,  // raw token
  }) => Promise<void>,

  // 發送重設密碼信的 callback
  sendResetPassword?: (params: {
    user: User,
    url: string,
    token: string,
  }) => Promise<void>,

  // 密碼 hash 自訂（default: scrypt）
  password?: {
    hash?: (password: string) => Promise<string>,
    verify?: (params: { hash: string, password: string }) => Promise<boolean>,
  },
}
```

---

## session 設定

```typescript
session: {
  // Session 有效期秒數（default: 604800 = 7 天）
  expiresIn?: number,

  // Session 多久後更新一次（default: 86400 = 1 天）
  updateAge?: number,

  // Session 被視為「新鮮」的秒數（default: 86400）
  // 設 0 = 停用 freshness 驗證
  freshAge?: number,

  // 停用自動 session 更新（default: false）
  disableSessionRefresh?: boolean,

  // GET 請求改為 read-only，不自動更新 session
  // 適用於有 read replica 的場景（default: false）
  deferSessionRefresh?: boolean,

  // Cookie 快取設定
  cookieCache?: {
    enabled: boolean,
    maxAge?: number,         // 快取秒數（default: 300）
    strategy?: "compact" | "jwt" | "jwe",  // default: "compact"
    refreshCache?: boolean,  // 快到期前自動更新（default: false）
  },
}
```

---

## advanced 設定

```typescript
advanced: {
  // Cookie 前綴（default: "better-auth"）
  cookiePrefix?: string,

  // 強制使用 Secure cookies（default: 生產環境自動啟用）
  useSecureCookies?: boolean,

  // 跨子域 cookie 共享
  crossSubDomainCookies?: {
    enabled: boolean,
    domain?: string,  // e.g., "example.com"
  },

  // 自訂 cookie 屬性
  cookies?: {
    session_token?: {
      name?: string,
      attributes?: CookieAttributes,
    },
    session_data?: { ... },
    dont_remember?: { ... },
  },

  // ID 生成策略（v1.4 使用 advanced.database.generateId）
  database?: {
    generateId?: ((options: { model: string }) => string | false) | "uuid" | "serial" | false,
  },
}
```

---

## auth.api 伺服器端方法

所有 API 可在 server 端直接呼叫，不需要 HTTP 請求：

```typescript
// 取得當前 session
const session = await auth.api.getSession({
  headers: fromNodeHeaders(req.headers),
});
// 回傳：{ session: SessionObject, user: UserObject } | null

// 以 email 登入
const result = await auth.api.signInEmail({
  body: { email: string, password: string },
  headers?: Headers,
});

// 取得回應 headers（含 Set-Cookie）
const { headers, response } = await auth.api.signUpEmail({
  returnHeaders: true,
  body: { email, password, name },
});

// 驗證 email
await auth.api.verifyEmail({
  query: { token: string },
});
```

### 錯誤處理（Server API）

```typescript
import { APIError, isAPIError } from "better-auth/api";

try {
  await auth.api.signInEmail({ body: { email, password } });
} catch (error) {
  if (isAPIError(error)) {
    console.log(error.message, error.status);
    // error.status: HTTP 狀態碼
    // error.message: 錯誤訊息
  }
}
```

---

## Express 整合 API

### toNodeHandler()

```typescript
import { toNodeHandler } from "better-auth/node";

// 轉換 auth 為 Express handler
const handler = toNodeHandler(auth);

// Express v5 掛載（本專案）
app.all("/api/auth/*splat", handler);
```

### fromNodeHeaders()

```typescript
import { fromNodeHeaders } from "better-auth/node";

// 將 Express IncomingHttpHeaders 轉為 Web API Headers
const headers: Headers = fromNodeHeaders(req.headers);
```

### 包裝為 Express RequestHandler

```typescript
export function createBetterAuthHandler(auth: BetterAuthInstance): RequestHandler {
  const handler = toNodeHandler(auth);
  return (req, res, next) => {
    void Promise.resolve(handler(req, res)).catch(next);
  };
}
```

---

## 錯誤處理

### Client 端錯誤

```typescript
const { data, error } = await authClient.signIn.email({ ... });
if (error) {
  console.log(error.code);      // 錯誤代碼（string）
  console.log(error.message);   // 錯誤訊息
  console.log(error.status);    // HTTP 狀態碼
  console.log(error.statusText);
}

// 取得所有錯誤代碼
const codes = authClient.$ERROR_CODES;
```

### 常見錯誤代碼

| Code | 描述 |
|------|------|
| `INVALID_EMAIL_OR_PASSWORD` | Email 或密碼錯誤 |
| `EMAIL_NOT_VERIFIED` | Email 未驗證 |
| `USER_ALREADY_EXISTS` | Email 已被使用 |
| `SESSION_EXPIRED` | Session 已過期 |
| `INVALID_TWO_FACTOR_COOKIE` | 2FA cookie 無效（見 two-factor.md） |
| `INVALID_TOKEN` | 無效的 token（重設密碼/驗證信） |
| `SIGNUP_DISABLED` | 停用新用戶註冊 |

---

## user 設定

```typescript
user: {
  // 自訂資料表名稱（default: "user"）
  modelName?: string,

  // 自訂欄位對應
  fields?: {
    name?: string,      // DB 欄位名稱
    email?: string,
    image?: string,
    // ...
  },

  // 自訂額外欄位
  additionalFields?: {
    [fieldName: string]: {
      type: "string" | "number" | "boolean" | string[],
      required?: boolean,
      defaultValue?: unknown,
      input?: boolean,  // false = 不允許用戶在註冊時設定
    },
  },
}
```

---

來源：
- https://www.better-auth.com/docs/installation
- https://www.better-auth.com/docs/concepts/session-management
- https://www.better-auth.com/docs/concepts/typescript
- https://www.better-auth.com/docs/concepts/api
- https://www.better-auth.com/docs/integrations/express
- https://www.better-auth.com/docs/authentication/email-password
