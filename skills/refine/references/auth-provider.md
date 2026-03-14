# Auth Provider 完整介面

## 介面定義

```typescript
interface AuthProvider {
  login: (params: { email?: string; username?: string; password?: string; [key: string]: unknown }) => Promise<AuthActionResponse>;
  check: (params?: unknown) => Promise<CheckResponse>;
  logout: (params?: unknown) => Promise<AuthActionResponse>;
  onError: (error: unknown) => Promise<OnErrorResponse>;

  // 選用
  register?: (params: unknown) => Promise<AuthActionResponse>;
  forgotPassword?: (params: unknown) => Promise<AuthActionResponse>;
  updatePassword?: (params: unknown) => Promise<AuthActionResponse>;
  getPermissions?: (params?: unknown) => Promise<unknown>;
  getIdentity?: (params?: unknown) => Promise<unknown>;
}
```

## 回傳類型

```typescript
type AuthActionResponse = {
  success: boolean;
  redirectTo?: string;
  error?: { message: string; name: string };
};

type CheckResponse = {
  authenticated: boolean;
  redirectTo?: string;    // 未認證時重導向
  logout?: boolean;       // 是否登出
  error?: Error;
};

type OnErrorResponse = {
  logout?: boolean;
  redirectTo?: string;
  error?: Error;
};
```

## 使用 Hooks

```typescript
import { useLogin, useLogout, useIsAuthenticated, useGetIdentity } from "@refinedev/core";

const { mutate: login } = useLogin();
const { mutate: logout } = useLogout();
const { data: authData } = useIsAuthenticated();
const { data: identity } = useGetIdentity<{ name: string; email: string }>();
```

## 範例實作

```typescript
const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const { token } = await response.json();
      localStorage.setItem("token", token);
      return { success: true, redirectTo: "/" };
    }

    return {
      success: false,
      error: { name: "LoginError", message: "帳號或密碼錯誤" },
    };
  },

  check: async () => {
    const token = localStorage.getItem("token");
    return token
      ? { authenticated: true }
      : { authenticated: false, redirectTo: "/login", logout: true };
  },

  logout: async () => {
    localStorage.removeItem("token");
    return { success: true, redirectTo: "/login" };
  },

  onError: async (error: any) => {
    if (error?.statusCode === 401) {
      return { logout: true, redirectTo: "/login" };
    }
    return {};
  },

  getIdentity: async () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    // 從 token 或 API 取得使用者資訊
    return { name: "使用者", email: "user@example.com" };
  },
};
```
