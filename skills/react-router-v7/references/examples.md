# React Router v7 -- Complete Examples

> All examples use react-router v7 Data Mode.

## Example 1: Full App Setup

```tsx
// main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import RootLayout, { loader as rootLoader } from "./routes/root";
import Home from "./routes/home";
import UserDetail, { loader as userLoader, action as userAction } from "./routes/user";

const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    loader: rootLoader,
    children: [
      { index: true, Component: Home },
      { path: "users/:id", Component: UserDetail, loader: userLoader, action: userAction },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode><RouterProvider router={router} /></StrictMode>
);
```

## Example 2: Loader with Error Handling

```tsx
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRouteError, isRouteErrorResponse } from "react-router";

export async function loader({ params }: LoaderFunctionArgs) {
  const res = await fetch("/api/users/" + params.id);
  if (!res.ok) throw new Response("Not Found", { status: res.status });
  return { user: await res.json() };
}

export function Component() {
  const { user } = useLoaderData<typeof loader>();
  return <div><h1>{user.name}</h1><p>{user.email}</p></div>;
}

export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404)
    return <h1>User not found</h1>;
  if (error instanceof Error) return <p>Error: {error.message}</p>;
  return <p>Unknown error</p>;
}
```

## Example 3: Form Action with Validation

```tsx
import { Form, useActionData, useNavigation, redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  const fd = await request.formData();
  const title = fd.get("title") as string;
  const errors: Record<string, string> = {};
  if (!title) errors.title = "Title is required";
  if (Object.keys(errors).length > 0) return { errors };
  const post = await createPost({ title });
  return redirect("/posts/" + post.id);
}

export function Component() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  return (
    <Form method="post">
      <input name="title" />
      {actionData?.errors?.title && <p>{actionData.errors.title}</p>}
      <button disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Create"}</button>
    </Form>
  );
}
```

## Example 4: Auth Guard Pattern

```tsx
import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

export async function requireUser({ request }: LoaderFunctionArgs) {
  const user = await getSession(request.headers.get("Cookie"));
  if (!user) {
    const from = new URL(request.url).pathname;
    throw redirect("/login?from=" + encodeURIComponent(from));
  }
  return user;
}

// Protected route loader
export async function loader(args: LoaderFunctionArgs) {
  const user = await requireUser(args);
  return { user, data: await getDashboardData(user.id) };
}
```

## Example 5: Lazy Loading

```tsx
const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      {
        path: "admin",
        lazy: async () => {
          const m = await import("./routes/admin");
          return { Component: m.default, loader: m.loader };
        },
      },
    ],
  },
]);
```

## Example 6: Deferred Data (Streaming)

```tsx
import { Suspense } from "react";
import { Await, useLoaderData } from "react-router";

export async function loader() {
  const user = await getUser();       // blocks
  const activity = getActivity();     // Promise, not awaited
  return { user, activity };
}

export function Component() {
  const { user, activity } = useLoaderData<typeof loader>();
  return (
    <div>
      <h1>{user.name}</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <Await resolve={activity} errorElement={<p>Failed</p>}>
          {(items) => <ActivityList items={items} />}
        </Await>
      </Suspense>
    </div>
  );
}
```

## Example 7: useFetcher Optimistic UI

```tsx
import { useFetcher } from "react-router";

function LikeButton({ postId, liked, count }: Props) {
  const fetcher = useFetcher<{ liked: boolean; count: number }>();
  const isLiked = fetcher.data?.liked ?? liked;
  const likeCount = fetcher.data?.count ?? count;
  return (
    <fetcher.Form method="post" action="/api/like">
      <input type="hidden" name="postId" value={postId} />
      <button type="submit" aria-pressed={isLiked}>
        {isLiked ? "Unlike" : "Like"} ({likeCount})
      </button>
    </fetcher.Form>
  );
}
```

## Example 8: Breadcrumb via useMatches

```tsx
// In route config:
{ handle: { crumb: "Users" }, ... }
{ handle: { crumb: (data: any) => data.user.name }, loader: userLoader, ... }

// Breadcrumb component
function Breadcrumb() {
  const matches = useMatches();
  return (
    <nav>
      {matches
        .filter((m) => m.handle?.crumb)
        .map((m, i) => (
          <span key={m.id}>
            {i > 0 && " / "}
            {typeof m.handle.crumb === "function" ? m.handle.crumb(m.data) : m.handle.crumb}
          </span>
        ))}
    </nav>
  );
}
```