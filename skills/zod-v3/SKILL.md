---
name: zod-v3
description: >
  Zod v3 完整 TypeScript schema 驗證參考。涵蓋所有 API、型別定義、程式碼範例。
  適用版本 zod ^3.x（本專案 ^3.24.2），不適用於 v4（v4 已發布 API 有顯著差異）。
  當程式碼涉及 zod、z.object、z.string、z.number、z.infer、ZodError、
  safeParse、z.union、z.enum、z.discriminatedUnion、z.refine、z.transform、
  z.coerce、parseAsync、ZodType、z.nativeEnum、runtime validation 時，
  必須使用此 skill。Zod v4 已發布但本專案用 v3，API 不同。
---

# Zod v3

> **版本**：^3.x（本專案 ^3.24.2）| **來源**：https://github.com/colinhacks/zod/tree/v3
>
> **重要**：Zod v4 於 2025 年發布，有 breaking changes。本 SKILL 僅涵蓋 v3。

Zod 是 TypeScript-first schema 宣告與驗證函式庫。零依賴、Immutable API（方法回傳新實例）。

## 核心 API 速查

### Primitives

```ts
import { z } from "zod";

z.string()    // string
z.number()    // number
z.boolean()   // boolean
z.date()      // Date
z.bigint()    // bigint
z.undefined() // undefined
z.null()      // null
z.void()      // accepts undefined
z.any()       // any
z.unknown()   // unknown
z.never()     // never
z.symbol()    // symbol
z.nan()       // NaN
```

### Object + Parsing + Type inference

```ts
import { z } from "zod";

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
});

type User = z.infer<typeof UserSchema>; // { id: string; name: string; email: string }
type UserInput  = z.input<typeof UserSchema>;  // 輸入型別（transform 之前）
type UserOutput = z.output<typeof UserSchema>; // 輸出型別（同 z.infer）

// Parse（throws ZodError，回傳 deep clone）
const user = UserSchema.parse(rawData);

// Safe parse（never throws）
const result = UserSchema.safeParse(rawData);
if (result.success) {
  result.data; // User
} else {
  result.error; // ZodError
}

// Async variants
await UserSchema.parseAsync(data);
const r = await UserSchema.safeParseAsync(data); // alias: .spa(data)
```

### String validators

```ts
z.string().min(5)            // >= 5 字元
z.string().max(5)            // <= 5 字元
z.string().length(5)         // 恰好 5 字元
z.string().email()           // email
z.string().url()             // URL
z.string().uuid()            // UUID
z.string().cuid()            // CUID
z.string().cuid2()           // CUID2
z.string().ulid()            // ULID
z.string().nanoid()          // NanoID
z.string().regex(/regex/)    // 正則
z.string().includes("sub")   // 包含
z.string().startsWith("x")  // 開頭
z.string().endsWith("x")    // 結尾
z.string().datetime()        // ISO 8601（預設只允許 Z）
z.string().datetime({ offset: true })  // 允許 timezone offset
z.string().datetime({ local: true })   // 允許無 timezone
z.string().datetime({ precision: 3 }) // 限制毫秒精度
z.string().date()            // YYYY-MM-DD（since 3.23）
z.string().time()            // HH:mm:ss（since 3.23）
z.string().ip()              // IPv4 或 IPv6
z.string().ip({ version: "v4" })
z.string().ip({ version: "v6" })
z.string().cidr()            // CIDR（since 3.23）
z.string().emoji()
z.string().base64()          // since 3.23
z.string().duration()        // ISO 8601 duration（since 3.23）
// Transforms
z.string().trim()
z.string().toLowerCase()
z.string().toUpperCase()
// Custom error messages
z.string().min(5, { message: "Too short" });
z.string({
  required_error: "Name is required",
  invalid_type_error: "Name must be a string",
});
```

### Number validators

```ts
z.number().gt(5)         // > 5
z.number().gte(5)        // >= 5（alias: .min(5)）
z.number().lt(5)         // < 5
z.number().lte(5)        // <= 5（alias: .max(5)）
z.number().int()         // 整數
z.number().positive()    // > 0
z.number().nonnegative() // >= 0
z.number().negative()    // < 0
z.number().nonpositive() // <= 0
z.number().multipleOf(5) // 5 的倍數（alias: .step(5)）
z.number().finite()      // 非 Infinity / -Infinity
z.number().safe()        // MIN_SAFE_INTEGER ~ MAX_SAFE_INTEGER
```

### Optional / Nullable / Default

```ts
z.string().optional()           // string | undefined
z.string().nullable()           // string | null
z.string().nullish()            // string | null | undefined
z.string().default("tuna")      // undefined => "tuna"
z.string().default(Math.random) // 每次執行函式
z.string().catch("fallback")    // parse 失敗時回傳 fallback
z.string().optional().unwrap()  // 取出內部 ZodString
```

### Coercion

```ts
z.coerce.string()   // String(input)
z.coerce.number()   // Number(input)
z.coerce.boolean()  // Boolean(input) 注意: "false" => true
z.coerce.bigint()   // BigInt(input)
z.coerce.date()     // new Date(input)
// 可接續鏈接 validators
z.coerce.string().email().min(5);
z.coerce.date().min(new Date("1900-01-01"));
```

## 常用模式

### Object Schema 操作

```ts
const User = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().nonnegative().optional(),
  role: z.enum(["admin", "user", "guest"]),
});
type User = z.infer<typeof User>;

// 衍生 schema
User.pick({ id: true, name: true })          // 只保留
User.omit({ id: true })                      // 移除
User.partial()                               // 所有欄位 optional
User.partial({ age: true })                  // 指定欄位 optional
User.required()                              // 所有欄位 required
User.deepPartial()                           // 深層 partial
User.extend({ posts: z.array(z.string()) })  // 新增欄位
User.merge(OtherSchema)                      // 合併（B 欄位覆蓋 A）
User.shape.name                              // ZodString
User.keyof()                                 // ZodEnum<["id", "name", ...]>

// Unknown keys 行為（預設 strip）
schema.strip()              // 移除未知 key（預設）
schema.passthrough()        // 保留未知 key
schema.strict()             // 有未知 key 就拋 ZodError
schema.catchall(z.number()) // 未知 key 必須通過此 schema
```

### Discriminated Union（API Response 最佳實踐）

```ts
const ApiResponse = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), data: z.string() }),
  z.object({ status: z.literal("error"), error: z.string() }),
  z.object({ status: z.literal("pending") }),
]);
type ApiResponse = z.infer<typeof ApiResponse>;

// 合併兩個 discriminated union
const AB = z.discriminatedUnion("type", [
  ...SchemaA.options,
  ...SchemaB.options,
]);
```

### Transform + Refinement + Pipe

```ts
// 字串轉數字（query param 驗證常用）
const QueryAge = z.string().transform((val, ctx) => {
  const parsed = parseInt(val, 10);
  if (isNaN(parsed)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must be a number" });
    return z.NEVER; // 型別為 never，不影響推導
  }
  return parsed;
}); // z.infer<typeof QueryAge> => number

// refine：自訂驗證（回傳 falsy = 失敗）
const PasswordForm = z.object({
  password: z.string().min(8),
  confirm: z.string(),
}).refine((data) => data.password === data.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});

// superRefine：多個 issue + abort early
z.number().superRefine((val, ctx) => {
  if (val < 10) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: ">= 10 required", fatal: true });
    return z.NEVER;
  }
});

// pipe：chain schemas
z.string().transform((val) => val.length).pipe(z.number().min(5));
```

### safeParse 完整錯誤處理

```ts
const result = UserSchema.safeParse(rawInput);
if (!result.success) {
  const flat = result.error.flatten();
  // flat.formErrors: string[]
  // flat.fieldErrors: { name?: string[], email?: string[], ... }

  const formatted = result.error.format();
  // { _errors: [], name: { _errors: ["Expected string"] } }

  return { success: false, errors: flat.fieldErrors };
}
return { success: true, data: result.data };
```

## 注意事項與陷阱

### 陷阱 1： 呼叫順序影響型別

```ts
z.string().optional().array(); // (string | undefined)[]
z.string().array().optional(); // string[] | undefined
```

### 陷阱 2： 使用 Boolean()

```ts
z.coerce.boolean().parse("false"); // => true（陷阱！字串 "false" 是 truthy）
z.coerce.boolean().parse(0);       // => false
// 精確布林值轉換改用 z.preprocess 或 z.enum 配 transform
```

### 陷阱 3：Transform 後無法使用原始型別方法

```ts
z.string().transform(v => v.length).email(); // TypeError
z.string().email().transform(v => v.split("@")[1]); // 正確
```

### 陷阱 4：Async refinement/transform 必須用 parseAsync

```ts
const schema = z.string().refine(async (val) => checkInDB(val));
await schema.parseAsync(value);  // 正確
schema.parse(value);             // 錯誤！同步拋出
```

### 陷阱 5： 回傳 output 型別

```ts
const schema = z.string().transform(v => v.length);
type T   = z.infer<typeof schema>;  // number（output，非 string）
type In  = z.input<typeof schema>;  // string
type Out = z.output<typeof schema>; // number
```

### 陷阱 6： 預設 strip 未知 key

```ts
const schema = z.object({ name: z.string() });
schema.parse({ name: "A", extra: 1 }); // => { name: "A" }（extra 被移除）
schema.strict().parse({ name: "A", extra: 1 }); // => throws ZodError
```

### v3 vs v4 重大差異（避免混淆）

| 特性 | v3（本專案） | v4 |
|------|-------------|----|
| Bundle size | ~8KB gzipped | ~2KB core gzipped |
|  | since 3.23 | 原生 |
| discriminatedUnion | 限 z.literal discriminator | 支援更多型別 |
| Error issues 格式 | 穩定 | 有調整 |
|  額外模式 | strip/passthrough/strict | 新增 looseObject, strictObject |
|  | RFC 2822 | 更嚴格 |

## References 導引

| 需求 | 參閱檔案 |
|------|----------|
| 完整 API（Arrays/Tuples/Records/Maps/Sets/Unions/Enums/Functions/Preprocess/Recursive） |  |
| ZodError 結構、flatten/format、自訂 errorMap、ZodIssueCode 完整列表 |  |
| 完整可執行範例（form validation、API payload 驗證、Generic functions） |  |
