---
name: better-auth-v1.4
description: >
  Better Auth v1.4 完整技術參考。當程式碼出現 import from 'better-auth'、
  'better-auth/plugins'、'better-auth/adapters/drizzle'、'better-auth/node'、
  'better-auth/react'、'better-auth/client' 等任何 better-auth 相關 import，
  或任何涉及 betterAuth()、createAuthClient()、twoFactor()、drizzleAdapter()、
  toNodeHandler()、authClient.signIn、authClient.signUp、authClient.signOut、
  authClient.twoFactor、auth.api.getSession、session management、TOTP、2FA、
  twoFactorEnabled、BetterAuthSessionResult 的任務，必須使用此 skill。
  此 skill 涵蓋 v1.4.18 的完整 API，包含 Express 整合、Drizzle adapter、
  twoFactor plugin、client SDK、TypeScript 型別。不適用於 v0.x 或 v2.x。
---

# Better Auth v1.4

> **適用版本**：v1.4.x（專案鎖定 1.4.18）
> **文件來源**：https://www.better-auth.com/docs/
> **最後更新**：2025-03

框架無關的 TypeScript 認證框架，提供 email/password、social login、2FA、session 管理、plugin 系統。此專案以 `authenticated` 模式（Better Auth）與 `local_trusted` 模式（無 auth，loopback only）雙模式運行。

## 環境變數

```
BETTER_AUTH_SECRET=<32+ char random string>   # 必要
BETTER_AUTH_URL=http://localhost:3100          # 若與 API 同 origin 可省略
```

生成 secret：`openssl rand -base64 32`

## 核心 API 速查

### betterAuth() — Server 初始化

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins";

export const auth = betterAuth({
  baseURL: "https://example.com",          // 可省略（同 origin）
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: ["https://example.com"], // CORS 白名單
  database: drizzleAdapter(db, {
    provider: "pg",                        // "pg" | "mysql" | "sqlite"
    schema: {
      user: authUsers,
      session: authSessions,
      account: authAccounts,
      verification: authVerifications,
      twoFactor: authTwoFactors,           // twoFactor plugin 需要
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    disableSignUp: false,                  // 可設 true 禁止新註冊
    minPasswordLength: 8,                  // default: 8
    maxPasswordLength: 128,               // default: 128
  },
  plugins: [twoFactor()],
  advanced: {
    useSecureCookies: false,              // HTTP-only 部署時設 false
    cookiePrefix: "better-auth",          // default
  },
});
```

### toNodeHandler() — Express 掛載

```typescript
import { toNodeHandler } from "better-auth/node";
import { fromNodeHeaders } from "better-auth/node";

// Express v4
app.all("/api/auth/*", toNodeHandler(auth));
// Express v5（使用 named catch-all）
app.all("/api/auth/*splat", toNodeHandler(auth));

// 重要：express.json() 必須在 toNodeHandler 之後
app.use(express.json());
```

### Session 解析（Server 端）

```typescript
import { fromNodeHeaders } from "better-auth/node";

// 直接用 auth.api
const session = await auth.api.getSession({
  headers: fromNodeHeaders(req.headers),
});
// session: { session: { id, userId, expiresAt, ... }, user: { id, email, name, ... } } | null
```

### createAuthClient() — 前端 Client

```typescript
import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3100", // 同 origin 可省略
  plugins: [
    twoFactorClient({
      twoFactorPage: "/two-factor",  // 2FA 驗證頁路徑
    }),
  ],
});
```

## 常用模式

### 1. 登入 / 登出 / 註冊

```typescript
// 註冊
const { data, error } = await authClient.signUp.email({
  email: "user@example.com",
  password: "password123",
  name: "John Doe",
});

// 登入（rememberMe default: true）
const { data, error } = await authClient.signIn.email({
  email: "user@example.com",
  password: "password123",
  rememberMe: true,
});

// 登出
await authClient.signOut();
```

### 2. React Session Hook

```typescript
import { authClient } from "@/lib/auth-client";

function Component() {
  const { data: session, isPending, error } = authClient.useSession();
  if (isPending) return <Loading />;
  if (!session) return <NotLoggedIn />;
  return <div>Welcome {session.user.name}</div>;
}
```

### 3. TOTP 2FA 流程（Enable）

```typescript
// Step 1: 取得 TOTP URI 供掃描 QR code
const { data } = await authClient.twoFactor.getTotpUri({
  password: "current-password",
});
// data.totpURI → 傳給 QR code library 顯示

// Step 2: 用戶掃描後輸入驗證碼確認啟用
const { data, error } = await authClient.twoFactor.enable({
  password: "current-password",
  issuer: "My App",  // 顯示在 authenticator app 上的名稱
});
```

### 4. TOTP 2FA 流程（Login 驗證）

```typescript
// 登入後如果需要 2FA，signIn 會觸發 twoFactorRedirect
const { data, error } = await authClient.signIn.email({ email, password });

// 在 2FA 頁面驗證
const { data, error } = await authClient.twoFactor.verifyTotp({
  code: "123456",
  trustDevice: true,  // 30 天內此裝置不再要求 2FA
});
```

### 5. Server 端 Session 解析（本專案模式）

```typescript
// 本專案在 server/src/auth/better-auth.ts 實作的 helper
export async function resolveBetterAuthSession(
  auth: BetterAuthInstance,
  req: Request,
): Promise<BetterAuthSessionResult | null> {
  const api = (auth as unknown as { api?: { getSession?: (input: unknown) => Promise<unknown> } }).api;
  if (!api?.getSession) return null;
  const sessionValue = await api.getSession({ headers: fromExpressHeaders(req) });
  // 回傳 { session: { id, userId }, user: { id, email, name, twoFactorEnabled } }
}
```

## 注意事項與陷阱

### express.json() 順序

`express.json()` 必須放在 `toNodeHandler()` 之後，否則 client API 會卡住。

```typescript
// 正確
app.all("/api/auth/*splat", toNodeHandler(auth)); // 先掛 auth
app.use(express.json());                          // 後掛 json parser

// 錯誤（會導致 client API pending 卡住）
app.use(express.json());
app.all("/api/auth/*splat", toNodeHandler(auth));
```

### Express v4 vs v5 路由差異

```typescript
// Express v4
app.all("/api/auth/*", toNodeHandler(auth));

// Express v5（本專案使用 Express 5）
app.all("/api/auth/*splat", toNodeHandler(auth));
```

### HTTP 環境下的 Secure Cookie

```typescript
// 當 public URL 使用 http:// 時必須設定
advanced: { useSecureCookies: false }
```

### v1.4 Breaking Changes（從 v1.3 升級注意）

- `authClient.forgotPassword` 已重命名為 `authClient.requestPasswordReset`
- `sendChangeEmailVerification` 已從 changeEmail flow 移除
- `accountInfo` endpoint 從 POST 改為 GET
- Plugin callbacks 現在使用 `ctx` 而非 `request` 參數
- `advanced.generateId` 已棄用，改用 `advanced.database.generateId`
- Passkey plugin 已移至獨立套件 `@better-auth/passkey`

### twoFactor plugin 需要額外的 DB 表

DB schema 必須包含 `two_factor` 表。`user` 表需增加 `twoFactorEnabled` 欄位。
詳見 `references/database-schema.md`。

## TypeScript 型別

```typescript
// Server 端型別推斷
type Session = typeof auth.$Infer.Session;
// { session: { id, userId, expiresAt, ... }, user: { id, email, name, twoFactorEnabled, ... } }

// 本專案自訂型別（server/src/auth/better-auth.ts）
type BetterAuthSessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  twoFactorEnabled?: boolean;
};

type BetterAuthSessionResult = {
  session: { id: string; userId: string } | null;
  user: BetterAuthSessionUser | null;
};

// BetterAuthInstance 型別
type BetterAuthInstance = ReturnType<typeof betterAuth>;
```

## References 導引

| 需求 | 參閱檔案 |
|------|---------|
| 完整 betterAuth() 所有設定選項 | `references/api-reference.md` |
| Drizzle adapter 與 DB schema 設定 | `references/database-schema.md` |
| twoFactor plugin 完整 API | `references/two-factor.md` |
| Client SDK 所有 methods 與 React hooks | `references/client-sdk.md` |
| 程式碼範例（本專案實作） | `references/examples.md` |
