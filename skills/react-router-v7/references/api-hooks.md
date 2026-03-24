# React Router v7 -- Hooks API Reference

> All hooks must be used inside RouterProvider descendants.

## useNavigate()

```ts
import { useNavigate } from "react-router";
type NavigateFunction = { (to: To, options?: NavigateOptions): void; (delta: number): void; };
interface NavigateOptions { replace?: boolean; state?: unknown; relative?: string; flushSync?: boolean; viewTransition?: boolean; }
```

```tsx
const navigate = useNavigate();
navigate("/home");
navigate("/login", { replace: true, state: { from: "/dashboard" } });
navigate(-1);
```

## useParams<P>()
```ts
import { useParams } from "react-router";
function useParams<P = string>(): Readonly<Params<P>>;
```
```tsx
const { id, postId } = useParams<{ id: string; postId: string }>();
```

## useSearchParams(defaultInit?)
```ts
import { useSearchParams } from "react-router";
function useSearchParams(defaultInit?: URLSearchParamsInit): [URLSearchParams, SetURLSearchParams];
```
```tsx
const [searchParams, setSearchParams] = useSearchParams();
const q = searchParams.get("q") ?? "";
setSearchParams({ q: "react", page: "2" });
setSearchParams((prev) => { prev.set("q", "react"); return prev; });
```

## useLocation()
```ts
import { useLocation } from "react-router";
interface Location { pathname: string; search: string; hash: string; state: unknown; key: string; }
```

## useMatch(pattern)
```ts
import { useMatch } from "react-router";
function useMatch<K extends string>(pattern: PathPattern | string): PathMatch<K> | null;
```
```tsx
const match = useMatch("/users/:id");
if (match) console.log(match.params.id);
```

## useMatches()
```ts
import { useMatches } from "react-router";
interface UIMatch<D = unknown, H = unknown> { id: string; pathname: string; params: Params; data: D; handle: H; }
function useMatches(): UIMatch[];
```
```tsx
const matches = useMatches();
const crumbs = matches.filter((m) => m.handle?.crumb).map((m) => m.handle.crumb);
```

## useNavigation()
```ts
import { useNavigation } from "react-router";
interface Navigation {
  state: "idle" | "loading" | "submitting";
  location?: Location;
  formMethod?: string; // v7: UPPERCASE "GET", "POST", "PUT" etc.
  formAction?: string;
  formData?: FormData;
}
```
```tsx
const navigation = useNavigation();
const isSubmitting = navigation.state === "submitting";
const isPost = navigation.formMethod === "POST"; // UPPERCASE in v7!
```

## useLoaderData<T>()
```ts
import { useLoaderData } from "react-router";
function useLoaderData<T = unknown>(): T;
```
```tsx
export async function loader() { return { user: await getUser() }; }
export function Component() {
  const { user } = useLoaderData<typeof loader>();
}
```

## useActionData<T>()
```ts
import { useActionData } from "react-router";
function useActionData<T = unknown>(): T | undefined;
```
```tsx
export async function action({ request }) {
  if (!valid) return { error: "Email required" };
  return null;
}
function MyForm() {
  const actionData = useActionData<typeof action>();
  return <p>{actionData?.error}</p>;
}
```

## useRouteError()
```ts
import { useRouteError, isRouteErrorResponse } from "react-router";
function useRouteError(): unknown;
function isRouteErrorResponse(error: unknown): error is ErrorResponse;
interface ErrorResponse { status: number; statusText: string; data: unknown; }
```
```tsx
function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) return <NotFound />;
    return <p>HTTP {error.status}: {error.statusText}</p>;
  }
  if (error instanceof Error) return <p>Error: {error.message}</p>;
  throw error;
}
```

## useOutletContext<T>()
```ts
import { useOutletContext } from "react-router";
function useOutletContext<T = unknown>(): T;
```
```tsx
function ParentRoute() {
  const [count, setCount] = useState(0);
  return <Outlet context={{ count, setCount }} />;
}
function ChildRoute() {
  const { count, setCount } = useOutletContext<{ count: number; setCount: (n: number) => void }>();
}
```

## useFetcher(opts?)
```ts
import { useFetcher } from "react-router";
interface Fetcher<TData = unknown> {
  state: "idle" | "loading" | "submitting";
  data: TData | undefined;
  Form: typeof Form;
  submit: SubmitFunction;
  load: (href: string) => void;
}
```
```tsx
const fetcher = useFetcher<{ liked: boolean }>();
<fetcher.Form method="post" action="/like">
  <button type="submit">{fetcher.state !== "idle" ? "Saving..." : "Like"}</button>
</fetcher.Form>
fetcher.submit({ id: "123" }, { method: "post", action: "/like" });
fetcher.load("/api/suggestions?q=" + q);
```

## useRouteLoaderData(routeId)
```ts
import { useRouteLoaderData } from "react-router";
function useRouteLoaderData(routeId: string): unknown;
```
```tsx
{ id: "root", path: "/", loader: rootLoader }
const rootData = useRouteLoaderData("root") as Awaited<ReturnType<typeof rootLoader>>;
```