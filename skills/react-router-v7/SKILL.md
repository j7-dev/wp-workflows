---
name: react-router-v7
description: >
  React Router v7 完整技術參考，對應 react-router ^7.1.5。
  **版本判斷優先**：使用前先讀 package.json——
  若 pin 為 `react-router ^7.x`（注意是 `react-router`，不是 `react-router-dom`），
  使用此 skill；若 pin 為 `react-router-dom ^6.x`，改用 react-router-v6 skill。
  涵蓋 createBrowserRouter、RouterProvider、useNavigate、useParams、useLoaderData、
  useActionData、useNavigation、useFetcher、useMatches、useRouteError、useOutletContext、
  Link、NavLink、Form、Outlet、Await、ScrollRestoration、Navigate、isRouteErrorResponse、
  lazy route、layout route、loader/action 函式、deferred data、streaming、
  route params、search params、navigation state 等 v7 API。
  ⚠️ 許多 hook 名稱（useNavigate、useParams、Link 等）v6/v7 共用，但底層行為與 import
  來源不同——不可單憑 hook 名稱觸發本 skill，必須先確認專案為 v7。
  此 skill 對應 v7.x SPA/Library 模式，不適用於 v6 或 Framework 模式（SSR）。
---

# React Router v7

> 適用版本：react-router ^7.1.5 | 文件來源：https://reactrouter.com/home | 最後更新：2026-03-20

React Router v7 提供三種使用模式：

| 模式 | 說明 | 使用情境 |
|------|------|---------|
| **Declarative** | BrowserRouter + Routes + Route | 最簡單，無 data loading |
| **Data** | createBrowserRouter + RouterProvider | SPA with loaders/actions（本 SKILL 重點） |
| **Framework** | Vite plugin + file-based routing | SSR/RSC，本 SKILL 不涵蓋 |

本專案使用 **Data Mode**（createBrowserRouter + RouterProvider）。
## Quick Setup (Data Mode SPA)

```tsx
// main.tsx
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    loader: rootLoader,
    children: [
      { index: true, Component: Home },
      {
        path: "users/:id",
        Component: UserDetail,
        loader: userLoader,
        action: userAction,
        ErrorBoundary: UserError,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);
```

**v7 重要：** RouterProvider 必須從 react-router/dom 匯入，createBrowserRouter 從 react-router 匯入。
## RouteObject 介面

```tsx
interface RouteObject {
  // 路徑匹配
  path?: string;          // "/users/:id"，無 path = pathless layout route
  index?: boolean;        // true = index route，不可同時有 children

  // 渲染
  element?: ReactNode;           // JSX element
  Component?: ComponentType;     // 類別或函式元件（優先於 element）
  errorElement?: ReactNode;      // 錯誤 UI
  ErrorBoundary?: ComponentType; // 錯誤元件（優先於 errorElement）
  HydrateFallback?: ComponentType; // SSR hydration loading UI

  // 資料
  loader?: LoaderFunction;
  action?: ActionFunction;
  shouldRevalidate?: ShouldRevalidateFunction;

  // 子路由
  children?: RouteObject[];

  // 延遲載入
  lazy?: () => Promise<Partial<RouteObject>>;

  // 元資料
  id?: string;            // 用於 useMatches / useRouteLoaderData
  handle?: unknown;       // 任意元資料，可在 useMatches 中讀取
}
```

## Loader 與 Action 簽名

```tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";

// Loader — 路由渲染前執行，返回資料（v7：不需要 json()）
export async function loader({ params, request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const user = await getUser(params.id);
  if (!user) throw new Response("Not Found", { status: 404 });
  return { user, q }; // v7 直接回傳物件，不需 json()
}

// Action — 處理 Form 提交（POST/PUT/PATCH/DELETE）
export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  await updateUser(params.id, { name });
  return redirect("/users"); // redirect() 從 react-router 匯入
}
```
## Hooks 速查表

| Hook | 回傳型別 | 用途 |
|------|---------|------|
| useNavigate() | NavigateFunction | 程式化導航 |
| useParams<P>() | Readonly<Params<P>> | URL 路徑參數 |
| useSearchParams() | [URLSearchParams, SetURLSearchParams] | Query string 讀寫 |
| useLocation() | Location | 當前 location 物件 |
| useMatch(pattern) | PathMatch | null | 匹配特定 pattern |
| useMatches() | UIMatch[] | 所有匹配路由的堆疊 |
| useNavigation() | Navigation | 全域 navigation 狀態 |
| useLoaderData<T>() | T | 當前路由 loader 資料 |
| useActionData<T>() | T | undefined | 最近一次 action 資料 |
| useRouteError() | unknown | ErrorBoundary 中的錯誤 |
| useOutletContext<T>() | T | 父路由傳給 Outlet 的 context |
| useFetcher() | Fetcher | 非導航的 loader/action 調用 |
| useRouteLoaderData(id) | unknown | 任意路由的 loader 資料 |

## 常用 Hook 範例

```tsx
// useNavigate
const navigate = useNavigate();
navigate("/users/123");
navigate(-1);
navigate("/login", { replace: true });

// useParams
const { id } = useParams<{ id: string }>();

// useSearchParams
const [searchParams, setSearchParams] = useSearchParams();
const q = searchParams.get("q") ?? "";
setSearchParams({ q: "new" });

// useLoaderData — TypeScript 推斷（v7 推詮）
export async function loader() { return { user: await getUser() }; }
export function Component() {
  const { user } = useLoaderData<typeof loader>();
}

// useNavigation — v7 UPPERCASE formMethod
const navigation = useNavigation();
const isSubmitting = navigation.state === "submitting";
const isPost = navigation.formMethod === "POST"; // v7 為大寫

// useRouteError + isRouteErrorResponse
import { isRouteErrorResponse, useRouteError } from "react-router";
function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return <p>{error.status} {error.statusText}</p>;
  }
  throw error;
}

// useFetcher — 非導航的 data 操作
const fetcher = useFetcher();
// fetcher.state: "idle" | "loading" | "submitting"
// fetcher.data: action 回傳値
```
## 常用模式

### Layout Route（巢狀佈局）

```tsx
{
  path: "/",
  Component: RootLayout,
  children: [
    { index: true, Component: Home },
    { path: "about", Component: About },
  ],
}

function RootLayout() {
  return (
    <>
      <Nav />
      <Outlet />
    </>
  );
}
```

### Lazy Loading（程式碼分割）

```tsx
{
  path: "/dashboard",
  lazy: async () => {
    const { Component, loader } = await import("./Dashboard");
    return { Component, loader };
  },
}
```

### Auth Guard（Loader 中重定向）

```tsx
export async function protectedLoader({ request }: LoaderFunctionArgs) {
  const user = await getUser();
  if (!user) {
    const params = new URLSearchParams({ from: new URL(request.url).pathname });
    throw redirect("/login?" + params.toString());
  }
  return { user };
}
```

### Deferred Data（defer 已棄用，用原生 Promise）

```tsx
// v7：loader 直接回傳含 Promise 的物件（不需 defer()）
export async function loader() {
  const critical = await getCritical();
  const slowData = getSlowData(); // 不 await，傳 Promise
  return { critical, slowData };
}

function Component() {
  const { critical, slowData } = useLoaderData<typeof loader>();
  return (
    <>
      <p>{critical}</p>
      <Suspense fallback={<Spinner />}>
        <Await resolve={slowData}>
          {(data) => <SlowComponent data={data} />}
        </Await>
      </Suspense>
    </>
  );
}
```
### Form Validation（Action 返回錯誤）

```tsx
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  if (!email.includes("@")) {
    return { errors: { email: "Invalid email" } };
  }
  await createUser({ email });
  return redirect("/dashboard");
}

function SignupForm() {
  const actionData = useActionData<typeof action>();
  return (
    <Form method="post">
      <input name="email" />
      {actionData?.errors?.email && <p>{actionData.errors.email}</p>}
      <button type="submit">Sign Up</button>
    </Form>
  );
}
```

## v6 → v7 重大變更

| 項目 | v6 | v7 |
|------|-----|-----|
| 套件名稱 | react-router-dom | react-router |
| RouterProvider 匯入 | react-router-dom | react-router/dom |
| json() helper | 需要 | 已棄用，直接回傳物件 |
| defer() helper | 需要 | 已棄用，直接回傳含 Promise 物件 |
| formMethod 大小寫 | 小寫 post | 大寫 POST |
| Future flags | 需手動啟用 | v7 已全部成為預設行為 |

## 關鍵陥阱

1. **RouterProvider 匯入路徑錯誤**：必須從 react-router/dom 匯入，從 react-router 匯入會 runtime 報錯。

2. **formMethod 大小寫**：navigation.formMethod === "post" 在 v7 永遠為 false，必須用 "POST"。

3. **勿在 loader 中使用 json()**：v7 中 json() 已棄用，直接 return { data } 即可。

4. **useLoaderData 型別推斷**：使用 useLoaderData<typeof loader>() 而非手動指定型別。

5. **ErrorBoundary vs errorElement**：優先使用 ErrorBoundary（元件），避免在同一路由混用兩者。

6. **index route 不可有 path**：{ index: true, Component: Home } 不可同時設定 path。

7. **Await 需要 Suspense 包裹**：<Await> 必須包在 <Suspense> 內，否則 React 會報錯。

## References 導引

| 需求 | 參閱檔案 |
|------|---------|
| createBrowserRouter 所有選項、RouteObject 完整屬性 | references/api-router-config.md |
| 所有 Hook 的完整 TypeScript 簽名與參數 | references/api-hooks.md |
| Link、NavLink、Form、Outlet、Await 等元件 Props | references/api-components.md |
| v6 → v7 完整遷移步驟與 future flags | references/migration-v6-to-v7.md |
| 完整可執行的整合範例 | references/examples.md |