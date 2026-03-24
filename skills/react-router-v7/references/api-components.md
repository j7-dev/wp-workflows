# React Router v7 -- Components API Reference

## Link

```ts
import { Link } from "react-router";
interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: To;
  relative?: "route" | "path";
  replace?: boolean;
  state?: unknown;
  preventScrollReset?: boolean;
  reloadDocument?: boolean;
  viewTransition?: boolean;
}
```

```tsx
<Link to="/users/123">Profile</Link>
<Link to="../" relative="path">Up</Link>
<Link to="/home" replace state={{ from: "/dashboard" }}>Home</Link>
```

## NavLink

```ts
import { NavLink } from "react-router";
interface NavLinkProps extends Omit<LinkProps, "className" | "style" | "children"> {
  children?: React.ReactNode | ((props: NavLinkRenderProps) => React.ReactNode);
  className?: string | ((props: NavLinkRenderProps) => string | undefined);
  style?: React.CSSProperties | ((props: NavLinkRenderProps) => React.CSSProperties);
  end?: boolean;
  caseSensitive?: boolean;
}
interface NavLinkRenderProps { isActive: boolean; isPending: boolean; isTransitioning: boolean; }
```

```tsx
<NavLink to="/users" className={({ isActive }) => isActive ? "active" : ""}>Users</NavLink>
<NavLink to="/home" end>
  {({ isActive, isPending }) => (
    <span className={isPending ? "pending" : isActive ? "active" : ""}>Home</span>
  )}
</NavLink>
// end prop: active only at exact path match
<NavLink to="/" end>Home</NavLink>
```

## Form

```ts
import { Form } from "react-router";
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  method?: "get" | "post" | "put" | "patch" | "delete";
  action?: string;
  encType?: string;
  navigate?: boolean;
  fetcherKey?: string;
  replace?: boolean;
  preventScrollReset?: boolean;
}
```

```tsx
// POST to current route action
<Form method="post">
  <input name="email" type="email" />
  <button type="submit">Submit</button>
</Form>
// GET search (updates URL)
<Form method="get" action="/search">
  <input name="q" />
  <button>Search</button>
</Form>
```

## Outlet

```ts
import { Outlet } from "react-router";
interface OutletProps { context?: unknown; }
```

```tsx
function RootLayout() {
  const [theme, setTheme] = useState("light");
  return <><Header /><Outlet context={{ theme, setTheme }} /><Footer /></>;
}
```

## Navigate

```ts
import { Navigate } from "react-router";
interface NavigateProps { to: To; replace?: boolean; state?: unknown; relative?: string; }
```

```tsx
function ProtectedPage() {
  const user = useUser();
  if (!user) return <Navigate to="/login" replace />;
  return <Dashboard />;
}
```

## Await

```ts
import { Await } from "react-router";
interface AwaitProps<R> {
  resolve: Promise<R> | R;
  children: React.ReactNode | ((value: R) => React.ReactNode);
  errorElement?: React.ReactNode;
}
```

```tsx
export async function loader() {
  const critical = await getCritical();
  const slow = getSlowData();
  return { critical, slow };
}
function Component() {
  const { slow } = useLoaderData<typeof loader>();
  return (
    <Suspense fallback={<Spinner />}>
      <Await resolve={slow} errorElement={<p>Error</p>}>
        {(data) => <SlowSection data={data} />}
      </Await>
    </Suspense>
  );
}
```

## ScrollRestoration

```ts
import { ScrollRestoration } from "react-router/dom";
interface ScrollRestorationProps {
  getKey?: (location: Location, matches: UIMatch[]) => string;
  nonce?: string;
}
```

```tsx
<ScrollRestoration getKey={(location) => location.pathname} />
```