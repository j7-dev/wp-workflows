# Zod v3 完整範例集

> 所有範例來自官方文件。

## 目錄

- [Form validation](#form-validation)
- [API Payload 驗證](#api-payload-驗證)
- [Query string coercion](#query-string-coercion)
- [Discriminated union（API response）](#discriminated-union)
- [Recursive schema](#recursive-schema)
- [Generic function](#generic-function)
- [Async validation](#async-validation)
- [Server route 驗證](#server-route-驗證)
- [React Hook Form 整合](#react-hook-form-整合)

## Form validation

```ts
import { z } from "zod";

const RegistrationForm = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(8),
  confirmPassword: z.string(),
  age: z.number().int().min(18),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegistrationForm = z.infer<typeof RegistrationForm>;

const result = RegistrationForm.safeParse(formData);
if (!result.success) {
  const errors = result.error.flatten().fieldErrors;
}
```

## API Payload 驗證

```ts
import { z } from "zod";

const CreateUserSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email(),
  role: z.enum(["admin", "user", "guest"]).default("user"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
type CreateUserInput = z.infer<typeof CreateUserSchema>;

async function createUser(req: Request, res: Response) {
  const result = CreateUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }
  const input: CreateUserInput = result.data;
}
```

## Query string coercion

```ts
import { z } from "zod";

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});
```

## Discriminated union

```ts
import { z } from "zod";

const ApiResponse = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("success"),
    data: z.object({ id: z.string() }),
  }),
  z.object({
    type: z.literal("error"),
    message: z.string(),
  }),
]);
type ApiResponse = z.infer<typeof ApiResponse>;
```

## Recursive schema

```ts
import { z } from "zod";

const CategoryBase = z.object({ id: z.string(), name: z.string() });
type Category = z.infer<typeof CategoryBase> & { children: Category[] };

const CategorySchema: z.ZodType<Category> = CategoryBase.extend({
  children: z.lazy(() => CategorySchema.array()),
});
```

## Generic function

```ts
import { z } from "zod";

function safeParse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: result.error.flatten().fieldErrors };
}
```

## Async validation

```ts
import { z } from "zod";

const UniqueEmailSchema = z.object({
  email: z.string().email().refine(
    async (email) => {
      const exists = await checkEmailExists(email);
      return !exists;
    },
    { message: "Email already in use" }
  ),
});

const result = await UniqueEmailSchema.safeParseAsync(formData);
```

## Server route 驗證

```ts
import { z } from "zod";

const CreateAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  adapter: z.enum(["claude-local", "opencode-local"]),
  budget: z.object({
    limit: z.number().positive(),
    currency: z.enum(["USD", "TWD"]).default("USD"),
  }).optional(),
});

function validateBody(schema: z.ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).json({ errors: result.error.flatten() });
    }
    req.body = result.data;
    next();
  };
}
```

## React Hook Form 整合

```ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});
type FormValues = z.infer<typeof formSchema>;

function MyForm() {
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema) });
  const onSubmit = (data: FormValues) => { /* fully typed */ };
  return <form onSubmit={form.handleSubmit(onSubmit)}>{/* ... */}</form>;
}
```
