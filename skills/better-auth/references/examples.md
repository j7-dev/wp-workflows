# Better Auth v1.4 實作範例

> 本檔案範例取自本專案 server/src/auth/better-auth.ts 與官方文件

## Server 設定核心範例

```typescript
// createBetterAuthInstance(db, config)
import { betterAuth } from 'better-auth';
import { twoFactor } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: ['https://app.example.com'],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user: authUsers, session: authSessions,
              account: authAccounts, verification: authVerifications,
              twoFactor: authTwoFactors },
  }),
  emailAndPassword: { enabled: true, disableSignUp: false },
  plugins: [twoFactor()],
  advanced: { useSecureCookies: false }, // HTTP 環境
});
```

## Express 掛載（v5 語法）

```typescript
import { toNodeHandler } from 'better-auth/node';

// 必須在 express.json() 之前！
app.all('/api/auth/*splat', toNodeHandler(auth));
app.use(express.json());
```

## Session 解析（本專案 helper）

```typescript
// 本專案實作（server/src/auth/better-auth.ts）
export async function resolveBetterAuthSession(
  auth: BetterAuthInstance,
  req: Request,
): Promise<BetterAuthSessionResult | null> {
  const headers = new Headers();
  for (const [key, raw] of Object.entries(req.headers)) {
    if (!raw) continue;
    if (Array.isArray(raw)) { for (const v of raw) headers.append(key, v); }
    else headers.set(key, raw);
  }
  const api = (auth as any).api;
  const sessionValue = await api.getSession({ headers });
  // ... extract session + user from sessionValue
}
```

## 前端 authClient 設定

```typescript
import { createAuthClient } from 'better-auth/react';
import { twoFactorClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  plugins: [twoFactorClient({ twoFactorPage: '/two-factor' })],
});
```

## 登入 / 登出

```typescript
// 登入（含 2FA 自動跳轉）
const { data, error } = await authClient.signIn.email({ email, password });

// 登出
await authClient.signOut({ fetchOptions: { onSuccess: () => navigate('/login') } });
```

## 2FA 驗證頁

```typescript
// 在 /two-factor 頁面
const { error } = await authClient.twoFactor.verifyTotp({
  code: '123456',
  trustDevice: true, // 30 天內免再次驗證
});
if (error?.code === 'INVALID_TWO_FACTOR_COOKIE') navigate('/login');
```

## 2FA 啟用流程（設定頁）

```typescript
// Step 1: 取得 TOTP URI 顯示 QR code
const { data } = await authClient.twoFactor.getTotpUri({ password });
// data.totpURI → 傳給 qrcode.react 顯示

// Step 2: 用戶掃描 QR code 後確認啟用
await authClient.twoFactor.enable({ password, issuer: 'My App' });

// Step 3: 生成備用代碼供用戶保存
const { data: bc } = await authClient.twoFactor.generateBackupCodes({ password });
// bc.backupCodes: string[]
```

## React useSession Hook

```typescript
const { data: session, isPending, error } = authClient.useSession();
// session: { user: { id, name, email, twoFactorEnabled }, session: { id, userId, expiresAt } }
```

---
來源：本專案 server/src/auth/better-auth.ts + 官方文件
