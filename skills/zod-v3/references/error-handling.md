# Zod v3 Error Handling

> 來源：https://github.com/colinhacks/zod/blob/v3/README.md#error-handling

## ZodError 結構

ZodError 繼承自 Error，包含 `issues` 陣列：

```ts
const result = z.object({ name: z.string() }).safeParse({ name: 12 });

if (!result.success) {
  result.error.issues;
  /* [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "number",
      "path": ["name"],
      "message": "Expected string, received number"
    }
  ] */
}
```

## ZodIssueCode 列表

```ts
z.ZodIssueCode.invalid_type      // 型別不符
z.ZodIssueCode.invalid_literal   // literal 不符
z.ZodIssueCode.unrecognized_keys // 未知 key（strict 模式）
z.ZodIssueCode.invalid_union     // union 所有選項都失敗
z.ZodIssueCode.invalid_enum_value // enum 值不符
z.ZodIssueCode.invalid_arguments // function args 不符
z.ZodIssueCode.invalid_return_type // function return 不符
z.ZodIssueCode.invalid_date      // date 無效
z.ZodIssueCode.invalid_string    // string validation 不符
z.ZodIssueCode.too_small         // min 不符
z.ZodIssueCode.too_big           // max 不符
z.ZodIssueCode.invalid_intersection_types
z.ZodIssueCode.not_multiple_of
z.ZodIssueCode.not_finite
z.ZodIssueCode.custom            // .refine / .superRefine 自訂
```

## Error formatting

### `.flatten()`

```ts
const result = MySchema.safeParse(badData);
if (!result.success) {
  const flat = result.error.flatten();
  // flat.formErrors: string[]  （schema 頂層錯誤）
  // flat.fieldErrors: Record<string, string[]>  （各欄位錯誤）

  // 範例
  flat.fieldErrors; // { name: ["Expected string"], age: ["Expected number"] }
}
```

### `.format()`

```ts
const formatted = result.error.format();
// {
//   _errors: [],
//   name: { _errors: ["Expected string"] },
//   address: { city: { _errors: ["Required"] } }
// }

formatted.name?._errors; // ["Expected string"]
```

## Custom error messages

```ts
// Per-validator
z.string().min(5, { message: "Too short" });
z.number().int({ message: "Must be integer" });

// Per-schema
z.string({
  required_error: "Name is required",
  invalid_type_error: "Name must be a string",
});
```

## Custom errorMap

```ts
import { z, ZodErrorMap, ZodIssueCode } from "zod";

const customErrorMap: ZodErrorMap = (issue, ctx) => {
  if (issue.code === ZodIssueCode.invalid_type) {
    if (issue.expected === "string") {
      return { message: "This field must be a string" };
    }
  }
  return { message: ctx.defaultError };
};

// Global error map
z.setErrorMap(customErrorMap);

// Per-schema error map
const schema = z.string({ errorMap: customErrorMap });
```

## superRefine 自訂 issue

```ts
const schema = z.array(z.string()).superRefine((val, ctx) => {
  if (val.length > 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_big,
      maximum: 3,
      type: "array",
      inclusive: true,
      message: "Too many items",
    });
  }
  if (val.length !== new Set(val).size) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "No duplicates allowed",
    });
  }
});
```

## transform 中驗證並 abort

```ts
const NumberInString = z.string().transform((val, ctx) => {
  const parsed = parseInt(val);
  if (isNaN(parsed)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Not a number",
    });
    return z.NEVER; // 特殊 never symbol，中止 transform
  }
  return parsed;
});
```

## zod-validation-error（推薦的 user-facing 錯誤格式化）

> ZodError 的預設訊息設計給開發者，不適合直接展示給用戶。
> 建議使用 `zod-validation-error` 套件將 ZodError 轉為人類可讀的訊息。

```ts
import { fromZodError } from "zod-validation-error";

const result = schema.safeParse(badData);
if (!result.success) {
  const validationError = fromZodError(result.error);
  console.log(validationError.message);
  // => Validation error: Expected string, received number at "name"
}
```
