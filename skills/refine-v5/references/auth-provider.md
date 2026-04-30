# Refine v5 Auth Provider & Authentication Reference

> Source: https://refine.dev/core/docs/authentication/

## Table of Contents

- [AuthProvider Interface](#authprovider-interface)
- [Return Types](#return-types)
- [Complete Implementation](#complete-implementation)
- [Authentication Hooks](#authentication-hooks)
- [Authenticated Component](#authenticated-component)
- [AuthPage Component](#authpage-component)

---

## AuthProvider Interface

```typescript
import type { AuthProvider } from "@refinedev/core";

const authProvider: AuthProvider = {
  // Required
  login:    async (params) => AuthActionResponse,
  check:    async (params) => CheckResponse,
  logout:   async (params) => AuthActionResponse,
  onError:  async (error) => OnErrorResponse,

  // Optional
  register:        async (params) => AuthActionResponse,
  forgotPassword:  async (params) => AuthActionResponse,
  updatePassword:  async (params) => AuthActionResponse,
  getPermissions:  async (params) => unknown,
  getIdentity:     async (params) => unknown,
};
```

---

## Return Types

```typescript
type AuthActionResponse = {
  success: boolean;
  redirectTo?: string;
  error?: Error;               // { name: string, message: string }
  [key: string]: unknown;      // custom data
};

type CheckResponse = {
  authenticated: boolean;
  redirectTo?: string;
  logout?: boolean;            // trigger logout on auth failure
  error?: Error;
};

type OnErrorResponse = {
  redirectTo?: string;
  logout?: boolean;
  error?: Error;
};
```

---

## Complete Implementation

```typescript
import type { AuthProvider } from "@refinedev/core";

const API_URL = "https://api.example.com";

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const { token, user } = await response.json();
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      return { success: true, redirectTo: "/" };
    }

    return {
      success: false,
      error: { name: "Login Failed", message: "Invalid credentials" },
    };
  },

  check: async () => {
    const token = localStorage.getItem("token");
    if (token) {
      return { authenticated: true };
    }
    return {
      authenticated: false,
      logout: true,
      redirectTo: "/login",
      error: { name: "Unauthorized", message: "Please login" },
    };
  },

  logout: async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return { success: true, redirectTo: "/login" };
  },

  onError: async (error) => {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return { logout: true, redirectTo: "/login", error };
    }
    return {};
  },

  getIdentity: async () => {
    const user = localStorage.getItem("user");
    if (user) {
      const parsed = JSON.parse(user);
      return { id: parsed.id, name: parsed.name, avatar: parsed.avatar };
    }
    return null;
  },

  getPermissions: async () => {
    const user = localStorage.getItem("user");
    if (user) {
      return JSON.parse(user).roles; // string[]
    }
    return null;
  },

  register: async ({ email, password }) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      return { success: true, redirectTo: "/login" };
    }
    return {
      success: false,
      error: { name: "Register Error", message: "Registration failed" },
    };
  },

  forgotPassword: async ({ email }) => {
    // Send password reset email
    return { success: true, redirectTo: "/login" };
  },

  updatePassword: async ({ password, token }) => {
    // Update password with reset token
    return { success: true, redirectTo: "/login" };
  },
};
```

---

## Authentication Hooks

### useLogin

```tsx
import { useLogin } from "@refinedev/core";

const { mutate: login, isLoading } = useLogin<{ email: string; password: string }>();

login({ email: "user@example.com", password: "secret" });
```

### useLogout

```tsx
const { mutate: logout } = useLogout();
logout(); // calls authProvider.logout()
```

### useIsAuthenticated

```tsx
const { data, isLoading, isError } = useIsAuthenticated();
// data: { authenticated: boolean, redirectTo?: string }
```

### useGetIdentity

```tsx
const { data: identity } = useGetIdentity<{ name: string; avatar: string }>();
// identity: { name: "John", avatar: "https://..." }
```

### usePermissions

```tsx
const { data: permissions } = usePermissions<string[]>();
// permissions: ["admin", "editor"]
```

### useOnError

```tsx
const { mutate: onError } = useOnError();
// Used internally by data hooks to handle API errors
```

### useRegister

```tsx
const { mutate: register } = useRegister<{ email: string; password: string }>();
register({ email: "new@example.com", password: "secret" });
```

### useForgotPassword

```tsx
const { mutate: forgotPassword } = useForgotPassword<{ email: string }>();
forgotPassword({ email: "user@example.com" });
```

### useUpdatePassword

```tsx
const { mutate: updatePassword } = useUpdatePassword<{ password: string; token: string }>();
updatePassword({ password: "newSecret", token: resetToken });
```

---

## Authenticated Component

Conditionally renders content based on auth state. Wraps `useIsAuthenticated`.

```tsx
import { Authenticated } from "@refinedev/core";

// Basic -- redirects to login if not authenticated
<Authenticated key="dashboard">
  <DashboardPage />
</Authenticated>

// With loading and fallback
<Authenticated
  key="protected"
  loading={<Spinner />}
  fallback={<div>Access denied</div>}
>
  <ProtectedContent />
</Authenticated>

// Custom redirect
<Authenticated key="admin" redirectOnFail="/login" appendCurrentPathToQuery>
  <AdminPanel />
</Authenticated>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `key` | `string` | **required** | Unique key to force remount on auth changes |
| `children` | `ReactNode` | -- | Authenticated content |
| `fallback` | `ReactNode` | -- | Unauthenticated content (disables redirect) |
| `loading` | `ReactNode` | -- | Loading state content |
| `redirectOnFail` | `string \| boolean` | `true` | Redirect path or use auth provider's |
| `appendCurrentPathToQuery` | `boolean` | `true` | Add current path to redirect URL |
| `params` | `any` | -- | Additional params for `check` method |

---

## AuthPage Component

Pre-built auth pages (login/register/forgot/update password).

```tsx
import { AuthPage } from "@refinedev/antd"; // or @refinedev/mui, etc.

// Login page
<AuthPage type="login" />

// Register page
<AuthPage type="register" />

// Forgot password page
<AuthPage type="forgotPassword" />

// Update password page
<AuthPage type="updatePassword" />

// Customized
<AuthPage
  type="login"
  title={<CustomLogo />}
  formProps={{ initialValues: { email: "demo@example.com" } }}
  renderContent={(content, title) => (
    <div>
      {title}
      {content}
      <Link to="/register">Create account</Link>
    </div>
  )}
/>
```
