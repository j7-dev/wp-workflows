# Better Auth v1.4 Client SDK 參考

> 對應版本：v1.4.18 | 來源：https://www.better-auth.com/docs/concepts/client

## 目錄

- [createAuthClient() 設定](#createauthclient-設定)
- [認證方法](#認證方法)
- [Session 管理](#session-management)
- [React Hooks](#react-hooks)
- [TypeScript 型別推斷](#typescript-型別推斷)
- [Plugin Client 整合](#plugin-client-整合)
- [錯誤處理](#錯誤處理)

---

## createAuthClient() 設定

```typescript
// React 版本（推薦，含 React hooks）
import { createAuthClient } from "better-auth/react";

// 純 JS/TS 版本（無 React hooks）
import { createAuthClient } from "better-auth/client";

// 框架特定版本
import { createAuthClient } from "better-auth/vue";
import { createAuthClient } from "better-auth/svelte";
import { createAuthClient } from "better-auth/solid";

const authClient = createAuthClient({
  // 可選：Auth server URL（同 origin 時可省略）
  baseURL?: string,

  // 可選：fetch 相關設定
  fetchOptions?: FetchOptions,

  // 可選：停用預設 fetch plugins（React Native/Expo 需要）
  disableDefaultFetchPlugins?: boolean,

  // 可選：Client plugins 陣列
  plugins?: ClientPlugin[],
});
```

---

## 認證方法

### authClient.signUp.email()

```typescript
const { data, error } = await authClient.signUp.email({
  email: string,           // 必要
  password: string,        // 必要（min: 8, max: 128）
  name: string,            // 必要：顯示名稱
  image?: string,          // 可選：頭像 URL
  callbackURL?: string,    // 可選：email 驗證完成後跳轉路徑

  // fetchOptions callback
  fetchOptions?: {
    onRequest?: () => void,
    onSuccess?: () => void,
    onError?: (context: { error: AuthError }) => void,
  },
});
// data: { user: User, session?: Session } | null
// error: AuthError | null
```

### authClient.signIn.email()

```typescript
const { data, error } = await authClient.signIn.email({
  email: string,          // 必要
  password: string,       // 必要
  rememberMe?: boolean,   // 瀏覽器關閉後是否保留 session（default: true）
  callbackURL?: string,   // email 驗證後跳轉路徑

  fetchOptions?: {
    onRequest?: () => void,
    onSuccess?: () => void,
    onError?: (context: { error: AuthError }) => void,
  },
});
// 若啟用 2FA，data 含 twoFactorRedirect: true
// data: { user: User, session: Session } | null
// error: AuthError | null
```

### authClient.signIn.social()

```typescript
const { data, error } = await authClient.signIn.social({
  provider: string,             // "github" | "google" | "apple" | ...
  callbackURL?: string,         // 成功後跳轉路徑（default: "/"）
  errorCallbackURL?: string,    // 錯誤後跳轉路徑
  newUserCallbackURL?: string,  // 新用戶（首次登入）跳轉路徑
  disableRedirect?: boolean,    // 跳過自動跳轉（default: false）
});
```

### authClient.signOut()

```typescript
await authClient.signOut({
  fetchOptions?: {
    onSuccess?: () => void,  // 常用來跳轉回首頁
  },
});

// 範例
await authClient.signOut({
  fetchOptions: {
    onSuccess: () => { router.push("/login"); },
  },
});
```

### authClient.updateUser()

```typescript
const { data, error } = await authClient.updateUser({
  name?: string,
  image?: string,
  // 其他 additionalFields
});
```

### authClient.changePassword()

```typescript
const { data, error } = await authClient.changePassword({
  currentPassword: string,
  newPassword: string,
  revokeOtherSessions?: boolean,  // 是否撤銷其他 session（default: false）
});
```

### authClient.requestPasswordReset()

> 注意：v1.4 將 `forgotPassword` 重命名為 `requestPasswordReset`

```typescript
const { data, error } = await authClient.requestPasswordReset({
  email: string,
  redirectTo?: string,  // 重設密碼頁的完整 URL
});
```

### authClient.resetPassword()

```typescript
const { data, error } = await authClient.resetPassword({
  newPassword: string,
  token: string,        // URL 中的 token 參數
});
```

---

## Session Management

### authClient.getSession()

非 hook 版本（async function）：

```typescript
const { data, error } = await authClient.getSession();
// data: { session: Session, user: User } | null
```

### authClient.listSessions()

列出所有 active session：

```typescript
const { data, error } = await authClient.listSessions();
// data: Session[]
```

### authClient.revokeSession()

撤銷指定 session：

```typescript
const { data, error } = await authClient.revokeSession({
  token: string,  // session token
});
```

### authClient.revokeOtherSessions()

撤銷除當前 session 以外的所有 session：

```typescript
const { data, error } = await authClient.revokeOtherSessions();
```

### authClient.revokeSessions()

撤銷所有 session（包含當前）：

```typescript
const { data, error } = await authClient.revokeSessions();
```

---

## React Hooks

### authClient.useSession()

```typescript
import { authClient } from "@/lib/auth-client";

function MyComponent() {
  const {
    data: session,   // { session: Session, user: User } | null
    isPending,       // boolean — loading 狀態
    error,           // AuthError | null
    refetch,         // () => void — 手動刷新 session
  } = authClient.useSession();

  if (isPending) return <LoadingSpinner />;
  if (!session) return <LoginButton />;

  return (
    <div>
      <p>Welcome {session.user.name}</p>
      <p>Email: {session.user.email}</p>
      {session.user.twoFactorEnabled && <p>2FA enabled</p>}
    </div>
  );
}
```

---

## TypeScript 型別推斷

### 從 auth instance 推斷型別

```typescript
// server/src/auth/better-auth.ts
export const auth = betterAuth({ ... });

// 推斷 Session 型別
type Session = typeof auth.$Infer.Session;
// Session = {
//   session: { id, userId, expiresAt, token, ipAddress, userAgent, ... },
//   user: { id, name, email, emailVerified, image, twoFactorEnabled, ... }
// }
```

### 從 client 推斷型別

```typescript
export const authClient = createAuthClient({ ... });
type ClientSession = typeof authClient.$Infer.Session;
```

### 推斷 additionalFields（monorepo）

```typescript
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
// authClient 現在能推斷 auth instance 中定義的 additionalFields
```

---

## Plugin Client 整合

### twoFactorClient（本專案使用）

```typescript
import { twoFactorClient } from "better-auth/client/plugins";

const authClient = createAuthClient({
  plugins: [
    twoFactorClient({
      twoFactorPage: "/two-factor",
      onTwoFactorRedirect?: () => void,
    }),
  ],
});

// 使用 twoFactor 方法（見 two-factor.md）
authClient.twoFactor.enable(...)
authClient.twoFactor.verifyTotp(...)
// ...
```

### inferAdditionalFields

```typescript
import { inferAdditionalFields } from "better-auth/client/plugins";

const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
    // 或手動定義（跨 repo）
    inferAdditionalFields({
      user: {
        customField: { type: "string" },
      },
    }),
  ],
});
```

---

## 錯誤處理

```typescript
const { data, error } = await authClient.signIn.email({ email, password });

if (error) {
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      showError("Email 或密碼錯誤");
      break;
    case "EMAIL_NOT_VERIFIED":
      showError("請先驗證 Email");
      break;
    case "SIGNUP_DISABLED":
      showError("目前不開放新用戶註冊");
      break;
    default:
      showError(error.message);
  }
}

// 取得所有錯誤代碼（TypeScript 自動補全）
const codes = authClient.$ERROR_CODES;
```

### 停用 signal（避免不必要的 re-render）

```typescript
// 當 endpoint 不影響 session 狀態時
await authClient.someAction({
  fetchOptions: {
    disableSignal: true,
  },
});
```

---

來源：
- https://www.better-auth.com/docs/concepts/client
- https://www.better-auth.com/docs/basic-usage
- https://www.better-auth.com/docs/concepts/typescript
