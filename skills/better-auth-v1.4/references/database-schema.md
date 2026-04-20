# Better Auth v1.4 Database Schema 參考

> 對應版本：v1.4.18 | 來源：https://www.better-auth.com/docs/concepts/database

## 目錄

- [核心資料表（必要）](#核心資料表必要)
- [twoFactor Plugin 資料表](#twofactor-plugin-資料表)
- [Drizzle Adapter 設定](#drizzle-adapter-設定)
- [本專案 Drizzle Schema](#本專案-drizzle-schema)
- [CLI 遷移工具](#cli-遷移工具)

---

## 核心資料表（必要）

Better Auth 要求以下四張資料表。Better Auth 的命名慣例使用**單數名稱**（user、session、account、verification），但可透過 schema 物件映射到不同的 Drizzle 表名。

### user 表

| 欄位 | 型別 | 必要 | 說明 |
|------|------|------|------|
| `id` | string (pk) | 是 | 唯一識別碼 |
| `name` | string | 是 | 顯示名稱 |
| `email` | string | 是 | Email（唯一） |
| `emailVerified` | boolean | 是 | Email 是否已驗證 |
| `image` | string | 否 | 頭像 URL |
| `createdAt` | Date | 是 | 建立時間 |
| `updatedAt` | Date | 是 | 更新時間 |
| `twoFactorEnabled` | boolean | twoFactor plugin | 是否啟用 2FA |

### session 表

| 欄位 | 型別 | 必要 | 說明 |
|------|------|------|------|
| `id` | string (pk) | 是 | Session ID |
| `userId` | string (fk→user) | 是 | 關聯用戶 |
| `token` | string | 是 | Session token（唯一） |
| `expiresAt` | Date | 是 | 過期時間 |
| `ipAddress` | string | 否 | 用戶端 IP |
| `userAgent` | string | 否 | 瀏覽器資訊 |
| `createdAt` | Date | 是 | 建立時間 |
| `updatedAt` | Date | 是 | 更新時間 |

### account 表

| 欄位 | 型別 | 必要 | 說明 |
|------|------|------|------|
| `id` | string (pk) | 是 | 帳號 ID |
| `userId` | string (fk→user) | 是 | 關聯用戶 |
| `accountId` | string | 是 | Provider 帳號 ID |
| `providerId` | string | 是 | `"credential"` 或 OAuth provider |
| `accessToken` | string | 否 | OAuth access token |
| `refreshToken` | string | 否 | OAuth refresh token |
| `accessTokenExpiresAt` | Date | 否 | Access token 過期時間 |
| `refreshTokenExpiresAt` | Date | 否 | Refresh token 過期時間 |
| `scope` | string | 否 | OAuth 授權範圍 |
| `idToken` | string | 否 | OAuth ID token |
| `password` | string | 否 | Hashed 密碼（credential auth 使用） |
| `createdAt` | Date | 是 | 建立時間 |
| `updatedAt` | Date | 是 | 更新時間 |

> 密碼以 `scrypt`（OWASP 推薦）雜湊儲存，`providerId` 為 `"credential"`。

### verification 表

| 欄位 | 型別 | 必要 | 說明 |
|------|------|------|------|
| `id` | string (pk) | 是 | 驗證記錄 ID |
| `identifier` | string | 是 | 驗證對象（如 email） |
| `value` | string | 是 | 驗證資料 |
| `expiresAt` | Date | 是 | 過期時間 |
| `createdAt` | Date | 否 | 建立時間 |
| `updatedAt` | Date | 否 | 更新時間 |

---

## twoFactor Plugin 資料表

### two_factor 表

| 欄位 | 型別 | 必要 | 說明 |
|------|------|------|------|
| `id` | string (pk) | 是 | 記錄 ID |
| `userId` | string (fk→user) | 是 | 關聯用戶 |
| `secret` | string | 是 | TOTP secret |
| `backupCodes` | string | 是 | 加密的備用代碼 |

---

## Drizzle Adapter 設定

```typescript
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./database.js";

// 基本設定（Drizzle 自動偵測表名）
const database = drizzleAdapter(db, {
  provider: "pg",  // "pg" | "mysql" | "sqlite"
});

// 使用自訂表名映射（Better Auth 期待 user/session 等單數名稱）
const database = drizzleAdapter(db, {
  provider: "pg",
  schema: {
    user: authUsers,           // 映射 Better Auth 的 "user" 到 authUsers 表
    session: authSessions,
    account: authAccounts,
    verification: authVerifications,
    twoFactor: authTwoFactors, // twoFactor plugin 需要
  },
});

// 使用複數表名（自動加 's'）
const database = drizzleAdapter(db, {
  provider: "pg",
  usePlural: true,  // user → users, session → sessions, etc.
});
```

### drizzleAdapter() 參數

```typescript
drizzleAdapter(
  db: DrizzleInstance,
  options: {
    provider: "pg" | "mysql" | "sqlite",
    schema?: {
      user?: TableConfig,
      session?: TableConfig,
      account?: TableConfig,
      verification?: TableConfig,
      [pluginTable: string]: TableConfig | undefined,
    },
    usePlural?: boolean,
  }
)
```

### Experimental Joins（v1.4 新功能）

啟用資料庫 JOIN 最佳化，可提升 2-3x 效能：

```typescript
export const auth = betterAuth({
  experimental: { joins: true },
  // ...
});
```

需要在 Drizzle schema 中定義 relations。

---

## 本專案 Drizzle Schema

位置：`packages/db/src/schema/auth.ts`

```typescript
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const authUsers = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const authSessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
});

export const authAccounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const authVerifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const authTwoFactors = pgTable("two_factor", {
  id: text("id").primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  userId: text("user_id").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
});
```

---

## CLI 遷移工具

```bash
# 產生 Better Auth 需要的 schema（用於手動參考）
npx auth@latest generate

# 產生 Drizzle migration（本專案使用方式）
pnpm db:generate

# 套用 migration
pnpm db:migrate
```

> 本專案使用 Drizzle migration 管理 schema 變更，不使用 Better Auth CLI 直接 migrate。

---

來源：
- https://www.better-auth.com/docs/concepts/database
- https://www.better-auth.com/docs/adapters/drizzle
