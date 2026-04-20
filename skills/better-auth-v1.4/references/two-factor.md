# Better Auth v1.4 Two-Factor Authentication (2FA) Plugin

> 對應版本：v1.4.18 | 來源：https://better-auth.com/docs/plugins/2fa

## 目錄

- [Server Plugin 設定](#server-plugin-設定)
- [Database Schema 要求](#database-schema-要求)
- [Client Plugin 設定](#client-plugin-設定)
- [Client 方法完整列表](#client-方法完整列表)
- [Server Endpoints](#server-endpoints)
- [2FA 啟用流程](#2fa-啟用流程)
- [2FA 登入流程](#2fa-登入流程)
- [備用代碼流程](#備用代碼流程)
- [安全性注意事項](#安全性注意事項)

---

## Server Plugin 設定

```typescript
import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";

export const auth = betterAuth({
  appName: "My App",  // 顯示在 authenticator app 中的 issuer
  plugins: [
    twoFactor({
      // TOTP 設定
      totpOptions?: {
        digits?: number,   // OTP 位數（default: 6）
        period?: number,   // 有效秒數（default: 30）
      },

      // OTP（email/SMS）設定（可選）
      otpOptions?: {
        sendOTP: async ({ user, otp }: { user: User, otp: string }, ctx) => Promise<void>,
        period?: number,         // OTP 有效秒數（default: 300 = 5 分鐘）
        storeOTP?: "database",  // 儲存位置
      },

      // 備用代碼設定
      backupCodeOptions?: {
        amount?: number,  // 備用代碼數量（default: 10）
        length?: number,  // 每個代碼長度（default: 8）
      },

      // 啟用時是否跳過驗證（default: false，即啟用時需要輸入 TOTP 確認）
      skipVerificationOnEnable?: boolean,

      // 自訂 issuer（覆蓋 appName）
      issuer?: string,
    }),
  ],
});
```

---

## Database Schema 要求

啟用 twoFactor plugin 後需要：

1. `user` 表新增 `twoFactorEnabled` 欄位（boolean）
2. 新增 `two_factor` 資料表

```typescript
// user 表需要額外欄位
twoFactorEnabled: boolean("two_factor_enabled").default(false)

// 需要新增 two_factor 表
export const authTwoFactors = pgTable("two_factor", {
  id: text("id").primaryKey(),
  secret: text("secret").notNull(),       // TOTP secret
  backupCodes: text("backup_codes").notNull(), // 加密的備用代碼
  userId: text("user_id").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
});
```

在 drizzleAdapter 的 schema 中必須包含 twoFactor 映射：

```typescript
database: drizzleAdapter(db, {
  provider: "pg",
  schema: {
    user: authUsers,
    session: authSessions,
    account: authAccounts,
    verification: authVerifications,
    twoFactor: authTwoFactors,  // 必須加入
  },
}),
```

---

## Client Plugin 設定

```typescript
import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    twoFactorClient({
      // 2FA 驗證頁的路徑（用戶登入後需要 2FA 時跳轉到此路徑）
      twoFactorPage?: string,  // e.g., "/two-factor"

      // 全域 2FA 跳轉 callback（可用來替代 twoFactorPage 做程式化跳轉）
      onTwoFactorRedirect?: () => void,
    }),
  ],
});
```

---

## Client 方法完整列表

### twoFactor.enable()

啟用 2FA（含 TOTP 驗證確認）：

```typescript
const { data, error } = await authClient.twoFactor.enable({
  password: string,   // 用戶當前密碼（必要）
  issuer?: string,    // Authenticator app 顯示名稱（覆蓋 appName）
});
// data: { totpURI: string } — 可用來生成 QR code
```

### twoFactor.disable()

停用 2FA：

```typescript
const { data, error } = await authClient.twoFactor.disable({
  password: string,  // 用戶當前密碼（必要）
});
```

### twoFactor.getTotpUri()

取得 TOTP URI（用於顯示 QR code，不需要先啟用 2FA）：

```typescript
const { data, error } = await authClient.twoFactor.getTotpUri({
  password: string,  // 用戶當前密碼（必要）
});
// data: { totpURI: string }
// totpURI 格式: otpauth://totp/AppName:user@email.com?secret=XXX&issuer=AppName
```

### twoFactor.verifyTotp()

驗證 TOTP 代碼（登入時使用）：

```typescript
const { data, error } = await authClient.twoFactor.verifyTotp({
  code: string,         // 6 位數 TOTP 代碼
  trustDevice?: boolean, // true = 此裝置 30 天內不再要求 2FA（default: false）
});
```

### twoFactor.sendOtp()

發送 OTP（需要設定 otpOptions.sendOTP）：

```typescript
const { data, error } = await authClient.twoFactor.sendOtp({
  trustDevice?: boolean,
});
```

### twoFactor.verifyOtp()

驗證 OTP 代碼：

```typescript
const { data, error } = await authClient.twoFactor.verifyOtp({
  code: string,
  trustDevice?: boolean,
});
```

### twoFactor.generateBackupCodes()

重新生成備用代碼（會讓舊代碼失效）：

```typescript
const { data, error } = await authClient.twoFactor.generateBackupCodes({
  password: string,  // 用戶當前密碼（必要）
});
// data: { backupCodes: string[] }
```

### twoFactor.verifyBackupCode()

使用備用代碼登入（每個代碼只能用一次）：

```typescript
const { data, error } = await authClient.twoFactor.verifyBackupCode({
  code: string,            // 備用代碼
  trustDevice?: boolean,
  disableSession?: boolean, // default: false
});
```

---

## Server Endpoints

| Endpoint | Method | 說明 |
|----------|--------|------|
| `/api/auth/two-factor/enable` | POST | 啟用 2FA |
| `/api/auth/two-factor/disable` | POST | 停用 2FA |
| `/api/auth/two-factor/verify-totp` | POST | 驗證 TOTP 代碼 |
| `/api/auth/two-factor/get-totp-uri` | POST | 取得 TOTP URI |
| `/api/auth/two-factor/send-otp` | POST | 發送 OTP |
| `/api/auth/two-factor/verify-otp` | POST | 驗證 OTP |
| `/api/auth/two-factor/generate-backup-codes` | POST | 生成備用代碼 |
| `/api/auth/two-factor/verify-backup-code` | POST | 驗證備用代碼 |

---

## 2FA 啟用流程

完整的 TOTP 啟用 UX 流程：

```typescript
// Step 1: 取得 TOTP URI
const { data: uriData } = await authClient.twoFactor.getTotpUri({
  password: userPassword,
});
// 使用 uriData.totpURI 顯示 QR code（如 qrcode.react）

// Step 2: 用戶掃描 QR code 後，輸入 authenticator app 的代碼確認
// twoFactor.enable() 內部會驗證 TOTP 代碼才真正啟用
const { data, error } = await authClient.twoFactor.enable({
  password: userPassword,
  issuer: "My App Name",
});
if (error) {
  // 處理錯誤（如密碼錯誤）
  console.error(error.message);
}
// 啟用成功後建議顯示備用代碼

// Step 3: 生成並顯示備用代碼（讓用戶保存）
const { data: backupData } = await authClient.twoFactor.generateBackupCodes({
  password: userPassword,
});
// backupData.backupCodes: string[] — 每個代碼只能用一次
```

---

## 2FA 登入流程

```typescript
// Step 1: 正常登入
const { data, error } = await authClient.signIn.email({
  email: "user@example.com",
  password: "password",
});

// 如果設定了 twoFactorPage，會自動跳轉
// 如果使用 onTwoFactorRedirect callback，會觸發 callback
// data 中會有 twoFactorRedirect: true 的標記

// Step 2: 在 2FA 頁面，用戶輸入 authenticator app 的代碼
const { data: verifyData, error: verifyError } = await authClient.twoFactor.verifyTotp({
  code: "123456",
  trustDevice: true,  // 信任此裝置 30 天
});

if (verifyError) {
  // INVALID_TWO_FACTOR_COOKIE：2FA cookie 已過期或無效，需要重新登入
  console.error(verifyError.message);
}
```

---

## 備用代碼流程

```typescript
// 當用戶無法使用 authenticator app 時使用備用代碼
const { data, error } = await authClient.twoFactor.verifyBackupCode({
  code: "ABC123DE",  // 8 字元備用代碼（格式依 backupCodeOptions.length 設定）
  trustDevice: false,
});
// 每個備用代碼只能用一次，用完後從資料庫刪除
```

---

## 安全性注意事項

1. **密碼驗證**：所有 2FA 設定操作（enable、disable、generateBackupCodes、getTotpUri）都需要用戶當前密碼，防止 CSRF 和 session hijacking 攻擊。

2. **TOTP Cookie**：登入後系統設置 `twoFactorPending` cookie（有效期短），`verifyTotp` 消費此 cookie。Cookie 失效後需重新登入才能再次驗證。常見錯誤 `INVALID_TWO_FACTOR_COOKIE` 表示需要重新觸發登入流程。

3. **備用代碼加密**：備用代碼在資料庫中加密儲存（`backupCodes` 欄位），每個代碼使用後即失效（one-time use）。

4. **裝置信任**：`trustDevice: true` 在 `twoFactor_cookie` 中記錄信任的裝置，有效期 30 天。信任期間該裝置登入時不需要再次 2FA 驗證。

5. **skipVerificationOnEnable**：預設為 `false`（需要輸入 TOTP 確認才能啟用）。設為 `true` 可跳過此驗證，但降低安全性（不建議）。

---

來源：
- https://better-auth.com/docs/plugins/2fa
- https://better-auth.com/blog/1-4
