# Zod v3 完整 API 參考

来源：https://github.com/colinhacks/zod/blob/v3/README.md

## 目錄

- [Literals](#literals)
- [Arrays](#arrays)
- [Tuples](#tuples)
- [Unions](#unions)
- [Enums](#enums)
- [Records](#records)
- [Maps](#maps)
- [Sets](#sets)
- [Intersections](#intersections)
- [Recursive types](#recursive-types)
- [Promises](#promises)
- [Functions](#functions)
- [Schema methods](#schema-methods)
- [Generic functions](#generic-functions)
- [BigInt](#bigint)

## Literals

```ts
const tuna = z.literal("tuna");
const twelve = z.literal(12);
const twobig = z.literal(2n);
tuna.value; // retrieve literal value
```

## Arrays

```ts
const stringArray = z.array(z.string());
const stringArray2 = z.string().array(); // 等價

z.string().array().min(5);    // 至少 5 項
z.string().array().max(5);    // 最多 5 項
z.string().array().length(5); // 恰好 5 項
z.string().array().nonempty(); // [string, ...string[]]
stringArray.element; // ZodString

// 注意順序！
z.string().optional().array(); // (string | undefined)[]
z.string().array().optional(); // string[] | undefined
```

## Tuples

```ts
const schema = z.tuple([z.string(), z.number()]);
const vt = z.tuple([z.string()]).rest(z.number()); // [string, ...number[]]
```

## Unions

```ts
const stringOrNumber = z.union([z.string(), z.number()]);
const v2 = z.string().or(z.number()); // 等價

const myUnion = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), data: z.string() }),
  z.object({ status: z.literal("failed"), error: z.instanceof(Error) }),
]);
myUnion.options; // [ZodObject<...>, ZodObject<...>]
```

## Enums

```ts
const FishEnum = z.enum(["Salmon", "Tuna", "Trout"]);
type FishEnum = z.infer<typeof FishEnum>; // "Salmon" | "Tuna" | "Trout"

FishEnum.enum.Salmon; // autocomplete
FishEnum.options; // ["Salmon", "Tuna", "Trout"]
FishEnum.extract(["Salmon", "Trout"]);
FishEnum.exclude(["Salmon", "Trout"]);

enum Fruits { Apple, Banana }
const FruitEnum = z.nativeEnum(Fruits);

const Fruits2 = { Apple: "apple", Banana: "banana" } as const;
const FruitEnum2 = z.nativeEnum(Fruits2);
```

## Records

```ts
const UserStore = z.record(z.string(), UserSchema); // Record<string, UserSchema>
const NumberCache = z.record(z.number()); // { [k: string]: number }
```

## Maps

```ts
const m = z.map(z.string(), z.number()); // Map<string, number>
```

## Sets

```ts
const s = z.set(z.number()); // Set<number>
z.set(z.string()).nonempty();
z.set(z.string()).min(5);
z.set(z.string()).max(5);
z.set(z.string()).size(5);
```

## Intersections

```ts
const EP = z.intersection(Person, Employee);
const EP2 = Person.and(Employee); // 等價，推薦用 .merge() 保留 ZodObject 方法
```

## Recursive types

```ts
const baseCategorySchema = z.object({ name: z.string() });
type Category = z.infer<typeof baseCategorySchema> & { subcategories: Category[] };

const categorySchema: z.ZodType<Category> = baseCategorySchema.extend({
  subcategories: z.lazy(() => categorySchema.array()),
});

// JSON 型別
const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Json = z.infer<typeof literalSchema> | { [key: string]: Json } | Json[];
const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
);
```

## Promises

```ts
const numberPromise = z.promise(z.number());
numberPromise.parse(Promise.resolve(3.14)); // => Promise<number>
```

## Instanceof

```ts
class MyClass { }
const MyClassSchema = z.instanceof(MyClass);
MyClassSchema.parse(new MyClass()); // passes
```

## Functions

```ts
const trimmedLength = z
  .function()
  .args(z.string())
  .returns(z.number())
  .implement((x) => x.trim().length);

myFunction.parameters(); // ZodTuple
myFunction.returnType(); // ZodNumber
```

## Preprocess

```ts
// v3.20 後推薦改用 z.coerce
const castToString = z.preprocess((val) => String(val), z.string());
```

## Schema methods

| 方法 | 說明 |
|------|------|
| `.parse(data)` | 失敗拋 ZodError，回傳 deep clone |
| `.parseAsync(data)` | async 版 |
| `.safeParse(data)` | 不拋錯，回傳 {success,data} 或 {success,error} |
| `.safeParseAsync(data)` | alias `.spa`，async 版 |
| `.refine(fn, params?)` | 自訂驗證，回傳 falsy = 失敗 |
| `.superRefine(fn)` | 多 issue，ctx.addIssue，可 abort |
| `.transform(fn)` | 轉換值，可加 ctx.addIssue 驗證 |
| `.pipe(schema)` | 串接 schema |
| `.default(val)` | undefined => 預設值 |
| `.catch(val)` | parse 失敗 => fallback |
| `.optional()` | T | undefined |
| `.nullable()` | T | null |
| `.nullish()` | T | null | undefined |
| `.array()` | T[] |
| `.promise()` | Promise<T> |
| `.or(schema)` | T | U |
| `.and(schema)` | T & U |
| `.brand<B>()` | nominal typing |
| `.readonly()` | Object.freeze + Readonly<T> |
| `.describe(str)` | 加 description 屬性 |

## Generic functions

```ts
// ZodTypeAny 保留子類型
function inferSchema<T extends z.ZodTypeAny>(schema: T) {
  return schema;
}
inferSchema(z.string()); // => ZodString

// parse 時需 cast
function parseData<T extends z.ZodTypeAny>(data: unknown, schema: T) {
  return schema.parse(data) as z.infer<T>;
}
```

## BigInt

```ts
z.bigint().gt(5n);
z.bigint().gte(5n); // alias .min(5n)
z.bigint().lt(5n);
z.bigint().lte(5n); // alias .max(5n)
z.bigint().positive();
z.bigint().nonnegative();
z.bigint().negative();
z.bigint().nonpositive();
z.bigint().multipleOf(5n);
```
