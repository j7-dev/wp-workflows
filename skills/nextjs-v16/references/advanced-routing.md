# Advanced Routing: Parallel Routes, Intercepting Routes & Error Handling

## Parallel Routes

### Convention

Named slots with `@folder` convention. Slots are passed as props to the parent layout.

```
app/
  layout.tsx          <- receives { children, analytics, team }
  page.tsx            <- implicit @children slot
  @analytics/page.tsx <- analytics slot
  @team/page.tsx      <- team slot
```

```tsx
// app/layout.tsx
export default function Layout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  team: React.ReactNode;
}) {
  return (
    <>
      {children}
      {analytics}
      {team}
    </>
  );
}
```

### Key Rules

- Slots do NOT affect URL structure (`@analytics/views` = URL `/views`).
- `children` is an implicit slot (same as `@children`).
- If one slot is dynamic at a route level, all slots at that level must be dynamic.

### default.tsx -- REQUIRED in v16

**Breaking change**: All parallel route slots must have explicit `default.tsx` files. Builds fail without them.

- **Soft navigation** (client-side `<Link>`): maintains active state of unmatched slots.
- **Hard navigation** (refresh/direct URL): renders `default.tsx` for unmatched slots.

```tsx
// app/@analytics/default.tsx
export default function Default() {
  return null;
}

// Alternative: trigger not-found
import { notFound } from 'next/navigation';
export default function Default() {
  notFound();
}
```

### Conditional Rendering

```tsx
// app/dashboard/layout.tsx
import { checkUserRole } from '@/lib/auth';

export default function Layout({
  user,
  admin,
}: {
  user: React.ReactNode;
  admin: React.ReactNode;
}) {
  const role = checkUserRole();
  return role === 'admin' ? admin : user;
}
```

### Tab Groups

Add a `layout.tsx` inside a slot for independent navigation:

```tsx
// app/@analytics/layout.tsx
import Link from 'next/link';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav>
        <Link href="/page-views">Page Views</Link>
        <Link href="/visitors">Visitors</Link>
      </nav>
      {children}
    </>
  );
}
```

### useSelectedLayoutSegment with Parallel Routes

```tsx
'use client';
import { useSelectedLayoutSegment } from 'next/navigation';

export default function Layout({ auth }: { auth: React.ReactNode }) {
  const loginSegment = useSelectedLayoutSegment('auth');
}
```

### Independent Loading & Error UI

Each parallel route slot can have its own `loading.tsx` and `error.tsx`.

---

## Intercepting Routes

### Convention

Match route segments at different levels:

| Pattern | Matches |
|---------|---------|
| `(.)folder` | Same level |
| `(..)folder` | One level above |
| `(..)(..)folder` | Two levels above |
| `(...)folder` | Root `app` directory |

Based on **route segments**, not filesystem. `@slot` folders don't count as levels.

### Modal Pattern (Parallel + Intercepting)

File structure:
```
app/
  layout.tsx              <- renders {children} + {auth}
  page.tsx
  @auth/
    default.tsx           <- returns null (REQUIRED in v16)
    (.)login/page.tsx     <- intercepts /login, shows modal
  login/
    page.tsx              <- full login page (hard navigation)
```

Implementation:

```tsx
// app/@auth/default.tsx
export default function Default() {
  return null;
}

// app/@auth/(.)login/page.tsx
import { Modal } from '@/components/modal';
import { Login } from '@/components/login';

export default function Page() {
  return <Modal><Login /></Modal>;
}

// app/login/page.tsx (full page)
import { Login } from '@/components/login';
export default function Page() {
  return <Login />;
}

// app/layout.tsx
import Link from 'next/link';

export default function Layout({
  auth,
  children,
}: {
  auth: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <nav><Link href="/login">Sign In</Link></nav>
      {auth}
      {children}
    </>
  );
}
```

### Modal Component (Client)

```tsx
'use client';
import { useRouter } from 'next/navigation';

export function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={() => router.back()}>Close</button>
        {children}
      </div>
    </div>
  );
}
```

### Closing the Modal

Use a catch-all slot to return null for other routes:
```tsx
// app/@auth/[...catchAll]/page.tsx
export default function CatchAll() {
  return null;
}
```

---

## Error Handling

### error.tsx (Must be Client Component)

Catches errors in the route segment and its children.

```tsx
'use client';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### global-error.tsx

Catches errors in the root layout. Must define its own `<html>` and `<body>`.

```tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
```

### not-found.tsx

Triggered by `notFound()` from `next/navigation`.

```tsx
// app/blog/[slug]/not-found.tsx
export default function NotFound() {
  return <div>404 - Post not found</div>;
}
```

### Expected Errors (Server Actions)

Model expected errors as return values, not thrown exceptions:

```tsx
'use server';
export async function createPost(prevState: any, formData: FormData) {
  const res = await fetch('https://api.example.com/posts', {
    method: 'POST',
    body: JSON.stringify({ title: formData.get('title') }),
  });
  if (!res.ok) {
    return { message: 'Failed to create post' };
  }
}
```

Use with `useActionState`:
```tsx
'use client';
import { useActionState } from 'react';
import { createPost } from '@/app/actions';

export function Form() {
  const [state, formAction, pending] = useActionState(createPost, { message: '' });
  return (
    <form action={formAction}>
      <input name="title" required />
      {state?.message && <p aria-live="polite">{state.message}</p>}
      <button disabled={pending}>Create</button>
    </form>
  );
}
```

### Error Boundaries Don't Catch

- Errors inside event handlers (catch manually with try/catch + useState).
- Errors in the same layout as the error.tsx (use parent error boundary).
- Unhandled promise rejections outside of `startTransition`.

Exception: errors inside `startTransition` from `useTransition` DO bubble to error boundary.
