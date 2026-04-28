---
name: react-hook-form-v7
description: >
  React Hook Form v7 (^7.51+) with @hookform/resolvers v3 (Zod) complete API reference.
  Covers useForm, register, Controller, useController, useFormContext/FormProvider,
  useWatch, useFieldArray, useFormState, handleSubmit, formState, reset, setValue,
  validation modes, Zod resolver integration, TypeScript types, and performance patterns.
  Use this skill whenever code imports from 'react-hook-form' or '@hookform/resolvers',
  uses useForm/register/Controller/useFieldArray/useWatch/useFormContext/FormProvider,
  or involves form validation, form state management, dynamic form fields,
  or schema-based validation with Zod in React.
---

# React Hook Form v7 + @hookform/resolvers v3

Version: `react-hook-form ^7.51.0`, `@hookform/resolvers ^3.3.0`. NOT for v8.

## useForm

```ts
const {
  register, unregister, formState, watch, handleSubmit,
  reset, resetField, setError, clearErrors, setValue,
  setFocus, getValues, getFieldState, trigger, control,
} = useForm<FormValues>(options?)
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `'onSubmit'\|'onBlur'\|'onChange'\|'onTouched'\|'all'` | `'onSubmit'` | Validation before first submit |
| `reValidateMode` | `'onChange'\|'onBlur'\|'onSubmit'` | `'onChange'` | Re-validation after submit |
| `defaultValues` | `FieldValues \| () => Promise<FieldValues>` | - | Cached initial values; supports async |
| `values` | `FieldValues` | - | Reactive external values (overwrites on change) |
| `errors` | `FieldErrors` | - | Server errors (keep ref-stable!) |
| `resetOptions` | `KeepStateOptions` | - | Behavior when values/defaultValues update |
| `resolver` | `Resolver` | - | Schema validation (Zod, Yup, etc.) |
| `context` | `object` | - | Mutable context for resolver's 2nd arg |
| `criteriaMode` | `'firstError'\|'all'` | `'firstError'` | One or all errors per field |
| `shouldFocusError` | `boolean` | `true` | Focus first error on submit |
| `shouldUnregister` | `boolean` | `false` | Remove values on unmount |
| `delayError` | `number` | - | ms delay before showing errors |
| `disabled` | `boolean` | `false` | Disable entire form |
| `validate` | `Function` | - | Form-level validation |

**Mode details:** onSubmit = validate on submit only; onBlur = on blur; onChange = every keystroke (perf impact); onTouched = first blur then onChange; all = blur + change.

**defaultValues rules:** Avoid `undefined` (conflicts with controlled state). Cached on first render -- use `reset()` to update. Included in submission. Supports async function. No prototype objects (Moment, Luxon).

### Zod Resolver

```ts
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email(),
});
type FormValues = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { name: '', email: '' },
});
```

Resolver + built-in validators (required, min) CANNOT coexist on same field. Error keys must be hierarchical: `{ items: [null, { name: err }] }` not `{ 'items.1.name': err }`.

---

## register

```ts
const { onChange, onBlur, name, ref } = register(name: string, options?: RegisterOptions)
```

| Option | Type | Description |
|--------|------|-------------|
| `required` | `boolean\|string` | Must have value |
| `maxLength`/`minLength` | `number\|{value,message}` | Character limits |
| `max`/`min` | `number\|{value,message}` | Numeric limits |
| `pattern` | `RegExp\|{value,message}` | Regex (avoid `/g` flag) |
| `validate` | `Fn\|Record<string,Fn>` | Custom sync/async validation |
| `valueAsNumber` | `boolean` | Cast to Number before validation |
| `valueAsDate` | `boolean` | Cast to Date before validation |
| `setValueAs` | `(v)=>T` | Transform value (ignored if valueAsNumber/Date) |
| `disabled` | `boolean` | Returns `undefined`, omits validation |
| `onChange`/`onBlur` | `(e)=>void` | Custom handlers alongside RHF's |
| `shouldUnregister` | `boolean` | Unregister on unmount (avoid with useFieldArray) |
| `deps` | `string\|string[]` | Re-validate dependent fields |

```tsx
<input {...register('slug', { required: 'Required', pattern: { value: /^[a-z0-9-]+$/, message: 'kebab-case' } })} />
<select {...register('status')}><option value="draft">Draft</option></select>
<input type="number" {...register('order', { valueAsNumber: true })} />
<input {...register('confirm', { validate: (v, fv) => v === fv.password || 'Must match', deps: ['password'] })} />
```

Name format: `name.first` -> `{name:{first:v}}`, `items.0.title` -> `{items:[{title:v}]}`. Dot syntax only, NOT brackets.

Destructured for custom ref: `const { ref, ...rest } = register('x'); <C inputRef={ref} {...rest} />`

---

## Controller / useController

For controlled components (rich text, date pickers, custom selects).

```tsx
<Controller control={control} name="content" rules={{ required: true }}
  render={({ field, fieldState }) => (
    <Editor value={field.value} onChange={field.onChange} onBlur={field.onBlur} ref={field.ref} />
  )}
/>
```

**useController** for reusable controlled components:
```tsx
const { field, fieldState: { error } } = useController({ name, control, rules: { required: true } });
```

**Props:** name (required), control (optional with FormProvider), rules, shouldUnregister, disabled, defaultValue (prefer useForm's defaultValues).

**field returns:** `{ onChange, onBlur, value, name, ref, disabled }`. onChange value must NOT be undefined.

**fieldState returns:** `{ invalid, isTouched, isDirty, error }`.

---

## formState

Proxy-based -- only accessed properties trigger re-renders.

| Property | Type | Description |
|----------|------|-------------|
| `isDirty` | `boolean` | Any field differs from defaultValues |
| `dirtyFields` | `object` | Map of modified fields |
| `touchedFields` | `object` | Map of interacted fields |
| `isSubmitted` | `boolean` | Submitted (stays true until reset) |
| `isSubmitSuccessful` | `boolean` | Submitted without runtime error |
| `isSubmitting` | `boolean` | Currently submitting |
| `isLoading` | `boolean` | Loading async defaultValues |
| `submitCount` | `number` | Total submits |
| `isValid` | `boolean` | No errors. setError does NOT affect this. |
| `errors` | `FieldErrors` | Errors by field name |

**Error shape:** `errors.field?.message`, `errors.field?.type`, `errors.nested?.child?.message`, `errors.items?.[0]?.name?.message`, `errors.items?.root?.message`.

```tsx
{errors.slug && <p className="text-xs text-red-600">{errors.slug.message}</p>}
```

---

## handleSubmit

```ts
handleSubmit(onValid: SubmitHandler<T>, onInvalid?: SubmitErrorHandler<T>)
```
```tsx
<form onSubmit={handleSubmit(onSubmit, onError)}>
// Outside form: onClick={() => handleSubmit(onSubmit)()}
// isSubmitting managed automatically during async onSubmit
```

---

## watch / useWatch

```ts
watch();                 // all    | watch('name');          // single
watch(['a','b']);         // multi  | watch((v,{name})=>{})  // callback (no re-render)
```

**useWatch** isolates re-renders to the subscribing component:
```tsx
const val = useWatch({ control, name: 'price', defaultValue: 0 });
```

---

## FormProvider / useFormContext

Share methods without prop drilling.
```tsx
const methods = useForm<T>({ ... });
<FormProvider {...methods}><form>...</form></FormProvider>

// In nested component:
const { register, formState: { errors } } = useFormContext<T>();
```

---

## useFieldArray

```ts
const { fields, append, prepend, insert, swap, move, update, replace, remove } =
  useFieldArray({ control, name: 'items' });
```

| Method | Signature | Description |
|--------|-----------|-------------|
| `fields` | `(obj & {id:string})[]` | Items with auto-id for key |
| `append` | `(obj\|obj[], focusOpts?)` | Add to end |
| `prepend` | `(obj\|obj[], focusOpts?)` | Add to start |
| `insert` | `(idx, obj\|obj[], focusOpts?)` | At position |
| `swap`/`move` | `(from, to)` | Reorder |
| `update` | `(idx, obj)` | Replace (unmounts/remounts) |
| `replace` | `(obj[])` | Replace entire array |
| `remove` | `(idx?\|idx[]?)` | Remove; no arg = all |

**Rules:** Use `field.id` as key (NOT index). Data must be complete (not `{}`). Don't stack operations in one handler. Flat arrays unsupported. Validation via `rules` prop, errors at `errors?.items?.root`.

```tsx
{fields.map((field, index) => (
  <div key={field.id}><input {...register(`items.${index}.name`)} /></div>
))}
```

---

## setValue / getValues / reset

**setValue:** `setValue(name, value, { shouldValidate?, shouldDirty?, shouldTouch? })`
```ts
setValue('status', 'published', { shouldDirty: true });
setValue('translations.zh-TW.title', 'New', { shouldDirty: true });
```

**getValues:** No re-render. `getValues()`, `getValues('name')`, `getValues(['a','b'])`

**reset:** `reset(values?, keepStateOptions?)`. No args = reset to defaultValues. After `reset(newValues)`, newValues become new defaults. Ref-stable, safe in useEffect deps.
```ts
reset({ slug: data.slug, status: data.status }); // load from API
```
KeepStateOptions: keepDirty, keepDirtyValues, keepErrors, keepIsSubmitted, keepTouched, keepValues, keepDefaultValues, keepSubmitCount.

**resetField:** `resetField('name')`, `resetField('name', { defaultValue: 'x' })`

---

## setError / clearErrors / trigger

```ts
setError('email', { type: 'server', message: 'Already exists' });
setError('root.serverError', { type: '500', message: 'Server error' });
// setError does NOT affect isValid
clearErrors(); clearErrors('email'); clearErrors(['a','b']);
await trigger(); await trigger('email'); await trigger(['a','b']); // returns boolean
```

---

## useFormState

Isolate formState subscriptions:
```tsx
const { isSubmitting } = useFormState({ control });
```

---

## TypeScript

```ts
import type { UseFormReturn, FieldValues, FieldErrors, FieldPath, Control,
  SubmitHandler, RegisterOptions, UseControllerProps } from 'react-hook-form';

interface Props { control: Control<FormValues>; name: FieldPath<FormValues>; }
type Methods = UseFormReturn<FormValues>;
```

---

## Performance

1. Prefer `register` (uncontrolled) over Controller.
2. Use `useWatch` in children, not `watch` in parent.
3. Use `useFormState` in isolated components (buttons, error summaries).
4. Avoid `mode: 'onChange'` unless needed.
5. Destructure useForm return for useEffect deps: `const { reset } = useForm()`.

---

## Pitfalls

1. defaultValues cached after init -- use `reset()` to update.
2. `undefined` defaultValue causes controlled/uncontrolled warnings.
3. Resolver + register validation cannot coexist per field.
4. Disabled inputs return `undefined` -- use `readOnly` to keep value.
5. Controller onChange must never receive `undefined`.
6. useFieldArray key must be `field.id`, never index.
7. Don't stack useFieldArray operations in one handler.
8. `setError` does NOT affect `isValid`.
9. Cannot remove register options with `{}` -- use `{ required: false }`.

---

## References

- [references/advanced-patterns.md](references/advanced-patterns.md) -- Multi-step forms, conditional fields, nested Controller, Server Actions, form composition, gallery arrays, ref forwarding
- [references/formstate-methods.md](references/formstate-methods.md) -- Detailed setValue/getValues/reset/setError/clearErrors/trigger/getFieldState/unregister API with full signatures and patterns
