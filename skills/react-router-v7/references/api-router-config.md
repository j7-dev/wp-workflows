# React Router v7 -- Router Config API Reference

> 文件來源：https://reactrouter.com/start/library/routing

## createBrowserRouter(routes, opts?)

**匯入：**

```ts
import { createBrowserRouter } from "react-router";
```

```ts
function createBrowserRouter(
  routes: RouteObject[],
  opts?: {
    basename?: string;
    future?: FutureConfig;
    hydrationData?: HydrationState;
    window?: Window;
  }
): RemixRouter;
```

```tsx
const router = createBrowserRouter(routes, {
  basename: "/app",
});
```

## createHashRouter(routes, opts?)

```ts
import { createHashRouter } from "react-router";
```

用於無法控制服務器的環境（静態 HTML 部署）。URL 使用 hash (#) 模式。

## RouterProvider

```ts
import { RouterProvider } from "react-router/dom";
```

```tsx
interface RouterProviderProps {
  router: RemixRouter;
  fallbackElement?: ReactNode;
}

<RouterProvider router={router} fallbackElement={<GlobalSpinner />} />
```

## RouteObject 完整屬性表

| 屬性 | 型別 | 說明 |
|------|------|------|
| path | string | URL 路徑模式，支援 :param 與 * (splat) |
| index | boolean | index route，與 children 互斥 |
| element | ReactNode | 渲染的 JSX |
| Component | ComponentType | 優先於 element |
| errorElement | ReactNode | 錯誤渲染 UI |
| ErrorBoundary | ComponentType | 優先於 errorElement |
| HydrateFallback | ComponentType | SSR hydration 期間 fallback |
| loader | LoaderFunction | 路由載入前執行 |
| action | ActionFunction | 處理 Form 提交 |
| children | RouteObject[] | 子路由陣列 |
| lazy | () => Promise<Partial<RouteObject>> | 動態載入路由 |
| id | string | 路由 ID，用於 useRouteLoaderData(id) |
| handle | unknown | 元資料，在 useMatches() 中讀取 |
| shouldRevalidate | ShouldRevalidateFunction | 控制是否重載 loader |

## 路徑匹配規則

```tsx
{ path: "/users" }                // 静態
{ path: "/users/:id" }            // 動態參數 params.id
{ path: "/files/:path*" }         // splat params.path
{ path: "/lang/:locale?/page" }   // 可選參數（v7 支援）
{ index: true, Component: Home }  // index route
{ Component: AuthLayout, children: [...] } // layout route (無 path)
```

## shouldRevalidate

```ts
interface ShouldRevalidateFunctionArgs {
  currentParams: Params;
  currentUrl: URL;
  nextParams: Params;
  nextUrl: URL;
  formMethod?: string;
  formAction?: string;
  formData?: FormData;
  actionResult?: unknown;
  defaultShouldRevalidate: boolean;
}

export function shouldRevalidate({ currentParams, nextParams, defaultShouldRevalidate }) {
  if (currentParams.id !== nextParams.id) return true;
  return defaultShouldRevalidate;
}
```

## redirect(url, init?)

```ts
import { redirect } from "react-router";

throw redirect("/login");
throw redirect("/login", { status: 301 });
return redirect("/dashboard");
```

## TypeScript 型別導入

```ts
import type {
  RouteObject,
  LoaderFunctionArgs,
  ActionFunctionArgs,
  LoaderFunction,
  ActionFunction,
  ShouldRevalidateFunction,
  Params,
  PathMatch,
  UIMatch,
  NavigateFunction,
  Navigation,
  Fetcher,
} from "react-router";
```