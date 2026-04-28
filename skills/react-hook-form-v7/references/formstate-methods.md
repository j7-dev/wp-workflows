# formState Methods — Detailed API Reference

## Table of Contents

1. [setValue](#setvalue)
2. [getValues](#getvalues)
3. [reset](#reset)
4. [resetField](#resetfield)
5. [setError](#seterror)
6. [clearErrors](#clearerrors)
7. [trigger](#trigger)
8. [setFocus](#setfocus)
9. [getFieldState](#getfieldstate)
10. [unregister](#unregister)
11. [control](#control)

---

## setValue

```ts
setValue(
  name: Path<FormValues>,
  value: PathValue<FormValues, Path<FormValues>>,
  options?: {
    shouldValidate?: boolean;   // trigger validation after set
    shouldDirty?: boolean;      // mark field as dirty
    shouldTouch?: boolean;      // mark field as touched
  }
): void
```

### Behavior

- Does NOT trigger re-render unless watched or subscribed.
- Does NOT affect `formState.isDirty` unless `shouldDirty: true`.
- Works with nested paths: `setValue('user.address.city', 'Taipei')`.
- Works with array paths: `setValue('items.0.name', 'Widget')`.
- Setting entire nested object: `setValue('translations.zh-TW', { title: 'X', excerpt: 'Y' })`.

### Rules

- If the field is registered, the value is validated against registered rules (when `shouldValidate: true`).
- Avoid calling setValue inside Controller's render -- use field.onChange instead.
- When used with `shouldDirty`, the field is compared against its defaultValue.

### Common Patterns

```ts
// Update a field after user action
setValue('slug', slugify(title), { shouldValidate: true });

// Programmatically check/uncheck
setValue('isPublished', true, { shouldDirty: true });

// Clear an optional field
setValue('featuredImageUrl', '', { shouldDirty: true });

// Set nested translation
setValue(`translations.${locale}.seoTitle`, newTitle, { shouldDirty: true });

// Replace entire array
setValue('tags', ['tag1', 'tag2'], { shouldDirty: true });
```

---

## getValues

```ts
// All values
getValues(): FormValues

// Single field
getValues(name: string): any

// Multiple fields
getValues(names: string[]): any[]
```

### Behavior

- Returns current form values.
- Does NOT trigger re-render or create subscriptions (unlike `watch`).
- Returns the latest value even if the component hasn't re-rendered.
- Useful in event handlers and imperative logic.

### When to Use getValues vs watch

| Scenario | Use |
|----------|-----|
| Display value in JSX | `watch('name')` |
| Read value in onClick handler | `getValues('name')` |
| Read value in onSubmit | Use the `data` parameter from handleSubmit |
| Conditional rendering | `watch('type')` or `useWatch` |
| Compute derived value for display | `watch` or `useWatch` |
| One-time read for API call | `getValues()` |

---

## reset

```ts
reset(
  values?: FormValues | ResetAction<FormValues>,
  options?: KeepStateOptions
): void
```

### KeepStateOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `keepDirtyValues` | `boolean` | `false` | Keep values user has modified |
| `keepErrors` | `boolean` | `false` | Keep current errors |
| `keepDirty` | `boolean` | `false` | Keep dirty state |
| `keepValues` | `boolean` | `false` | Keep all current values |
| `keepDefaultValues` | `boolean` | `false` | Keep current defaultValues |
| `keepIsSubmitted` | `boolean` | `false` | Keep isSubmitted state |
| `keepIsSubmitSuccessful` | `boolean` | `false` | Keep isSubmitSuccessful |
| `keepTouched` | `boolean` | `false` | Keep touched state |
| `keepIsValid` | `boolean` | `false` | Keep isValid temporarily |
| `keepSubmitCount` | `boolean` | `false` | Keep submitCount |

### Common Patterns

```ts
// Full reset to defaults
reset();

// Reset with new data (e.g., after fetching from API)
reset({
  slug: article.slug,
  status: article.status,
  translations: buildTranslations(article),
});

// Reset but keep user's dirty values (server sync without losing edits)
reset(serverData, { keepDirtyValues: true });

// Reset after successful submit
useEffect(() => {
  if (formState.isSubmitSuccessful) {
    reset(undefined, { keepValues: true });
  }
}, [formState.isSubmitSuccessful, reset]);

// Reset with async default values on useForm
const { reset } = useForm({
  defaultValues: async () => {
    const data = await fetchArticle(id);
    return mapToFormValues(data);
  },
});
```

### Rules

- Calling `reset()` without arguments resets to the original `defaultValues`.
- After `reset(newValues)`, `newValues` become the new `defaultValues`.
- `reset` is referentially stable -- safe to use in useEffect deps.
- Use in the edit-form loading pattern: fetch data, then call `reset(data)`.

---

## resetField

```ts
resetField(
  name: string,
  options?: {
    keepDirty?: boolean;
    keepTouched?: boolean;
    keepError?: boolean;
    defaultValue?: any;
  }
): void
```

Resets a single field to its default value. Optionally overrides the default.

```ts
resetField('email');
resetField('email', { defaultValue: 'new@example.com' });
resetField('email', { keepDirty: true }); // reset value but keep dirty flag
```

---

## setError

```ts
setError(
  name: string,
  error: { type: string; message?: string; types?: Record<string, string> },
  options?: { shouldFocus?: boolean }
): void
```

### Important Notes

- `setError` does NOT prevent form submission.
- `setError` does NOT affect `formState.isValid` (isValid is derived from validation only).
- Use for server-side error mapping or custom validation messages.
- Errors set via `setError` are cleared by the next successful validation.

### Error Types

```ts
// Field-level error
setError('email', {
  type: 'manual',
  message: 'This email is already registered',
});

// Root-level error (form-wide)
setError('root', {
  type: 'serverError',
  message: 'Server returned 500',
});

// Named root error
setError('root.apiError', {
  type: 'custom',
  message: 'API rate limit exceeded',
});

// With focus
setError('username', {
  type: 'manual',
  message: 'Username taken',
}, { shouldFocus: true });

// Multiple types (requires criteriaMode: 'all')
setError('password', {
  types: {
    minLength: 'Must be at least 8 characters',
    uppercase: 'Must contain uppercase letter',
  },
});
```

### Server Error Mapping Pattern

```ts
const onSubmit = async (data: FormValues) => {
  try {
    await apiSave(data);
  } catch (err) {
    if (err instanceof ApiError && err.fieldErrors) {
      // Map server validation errors to form fields
      Object.entries(err.fieldErrors).forEach(([field, message]) => {
        setError(field as keyof FormValues, {
          type: 'server',
          message: String(message),
        });
      });
    } else {
      setError('root.serverError', {
        type: 'server',
        message: err instanceof Error ? err.message : 'Save failed',
      });
    }
  }
};
```

---

## clearErrors

```ts
clearErrors(): void                          // clear all
clearErrors(name: string): void              // clear one field
clearErrors(names: string[]): void           // clear multiple
```

```ts
clearErrors();
clearErrors('email');
clearErrors(['email', 'password']);
```

---

## trigger

```ts
trigger(): Promise<boolean>                  // validate all
trigger(name: string): Promise<boolean>      // validate one
trigger(names: string[]): Promise<boolean>   // validate multiple
```

Manually trigger validation. Returns `true` if valid.

```ts
// Validate before proceeding to next step
const handleNext = async () => {
  const isStepValid = await trigger(['name', 'email', 'phone']);
  if (isStepValid) setStep(step + 1);
};

// Validate single field on custom event
const handleBlur = async () => {
  await trigger('slug');
};
```

---

## setFocus

```ts
setFocus(name: string, options?: { shouldSelect?: boolean }): void
```

Focus a registered input by name. Only works with inputs that have a DOM ref.

```ts
setFocus('email');
setFocus('firstName', { shouldSelect: true }); // focus + select text
```

---

## getFieldState

```ts
getFieldState(name: string, formState?: FormState): {
  invalid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  isValidating: boolean;
  error?: FieldError;
}
```

Get state for a specific field. Must pass formState from useForm when used
outside of subscribed context.

```ts
const { getFieldState, formState } = useForm();

// Must read formState first to subscribe
const { isDirty, error } = getFieldState('email', formState);
```

---

## unregister

```ts
unregister(
  name: string | string[],
  options?: {
    keepDirty?: boolean;
    keepTouched?: boolean;
    keepIsValid?: boolean;
    keepError?: boolean;
    keepValue?: boolean;
    keepDefaultValue?: boolean;
  }
): void
```

Remove input registration and its value from form state.

```ts
unregister('temporaryField');
unregister(['field1', 'field2']);
unregister('field', { keepValue: true }); // unregister but keep value in form data
```

---

## control

```ts
const { control } = useForm();
```

The `control` object is passed to Controller, useController, useFieldArray, and useWatch
to connect them to the form instance.

- Referentially stable across renders.
- Required prop for controlled components.
- Optional when using FormProvider (hooks auto-detect context).

```tsx
<Controller control={control} name="field" render={...} />

const { fields } = useFieldArray({ control, name: 'items' });
const value = useWatch({ control, name: 'field' });
const { field } = useController({ control, name: 'field' });
```
