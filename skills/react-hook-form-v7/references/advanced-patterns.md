# Advanced Patterns

## Table of Contents

1. [Multi-Step / Wizard Forms](#multi-step-wizard-forms)
2. [Conditional Fields](#conditional-fields)
3. [Dependent Selects](#dependent-selects)
4. [Nested Controller (Rich Text + JSON)](#nested-controller-rich-text--json)
5. [Custom Controlled Components with useController](#custom-controlled-components)
6. [Form Composition with FormProvider](#form-composition)
7. [Server Actions (Next.js App Router)](#server-actions)
8. [Manual Submission (Outside Form)](#manual-submission)
9. [Reactive Values from Server](#reactive-values)
10. [Programmatic setValue with Side Effects](#programmatic-setvalue)
11. [Dynamic Validation Based on Other Fields](#dynamic-validation)
12. [Gallery / Sortable Array Fields](#gallery-sortable-array)
13. [ref Forwarding for Custom Components](#ref-forwarding)

---

## Multi-Step Wizard Forms

Use FormProvider to share state across steps. Each step component accesses
form methods via useFormContext.

```tsx
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

const schema = z.object({
  // Step 1
  name: z.string().min(1),
  email: z.string().email(),
  // Step 2
  address: z.string().min(1),
  city: z.string().min(1),
  // Step 3
  cardNumber: z.string().min(16),
});

type FormValues = z.infer<typeof schema>;

function WizardForm() {
  const [step, setStep] = useState(0);
  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', address: '', city: '', cardNumber: '' },
    mode: 'onTouched', // validate on blur for better UX in wizards
  });

  const onSubmit = async (data: FormValues) => {
    await saveOrder(data);
  };

  // Validate current step fields before advancing
  const nextStep = async () => {
    const fieldsPerStep: Record<number, (keyof FormValues)[]> = {
      0: ['name', 'email'],
      1: ['address', 'city'],
    };
    const valid = await methods.trigger(fieldsPerStep[step]);
    if (valid) setStep((s) => s + 1);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {step === 0 && <StepPersonal />}
        {step === 1 && <StepAddress />}
        {step === 2 && <StepPayment />}
        <div className="flex gap-2 mt-4">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
          )}
          {step < 2 ? (
            <button type="button" onClick={nextStep}>Next</button>
          ) : (
            <button type="submit">Submit</button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

function StepPersonal() {
  const { register, formState: { errors } } = useFormContext<FormValues>();
  return (
    <div className="space-y-3">
      <input {...register('name')} placeholder="Name" />
      {errors.name && <p className="text-red-600 text-xs">{errors.name.message}</p>}
      <input {...register('email')} placeholder="Email" />
      {errors.email && <p className="text-red-600 text-xs">{errors.email.message}</p>}
    </div>
  );
}
```

---

## Conditional Fields

Fields that appear/disappear based on other field values.
With `shouldUnregister: false` (default), hidden field values persist in form data.
With `shouldUnregister: true`, they are removed when unmounted.

```tsx
function ConditionalForm() {
  const { register, watch, control } = useForm<{
    hasDiscount: boolean;
    discountCode: string;
    discountType: 'percentage' | 'fixed';
  }>({
    defaultValues: { hasDiscount: false, discountCode: '', discountType: 'percentage' },
  });

  const hasDiscount = watch('hasDiscount');

  return (
    <form>
      <label>
        <input type="checkbox" {...register('hasDiscount')} />
        Has discount
      </label>

      {hasDiscount && (
        <>
          <input
            {...register('discountCode', { required: 'Code required when discount enabled' })}
            placeholder="Discount code"
          />
          <select {...register('discountType')}>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </>
      )}
    </form>
  );
}
```

Use `useWatch` for render-isolated conditional checks in child components:

```tsx
function DiscountFields({ control }: { control: Control }) {
  const hasDiscount = useWatch({ control, name: 'hasDiscount' });
  if (!hasDiscount) return null;
  return <DiscountInputs />;
}
```

---

## Dependent Selects

Second select options depend on first select value.

```tsx
function DependentSelects() {
  const { register, watch, setValue } = useForm({
    defaultValues: { country: '', city: '' },
  });

  const country = watch('country');

  const cities: Record<string, string[]> = {
    tw: ['Taipei', 'Kaohsiung', 'Taichung'],
    jp: ['Tokyo', 'Osaka', 'Kyoto'],
  };

  // Reset city when country changes
  useEffect(() => {
    setValue('city', '', { shouldValidate: false });
  }, [country, setValue]);

  return (
    <>
      <select {...register('country')}>
        <option value="">Select country</option>
        <option value="tw">Taiwan</option>
        <option value="jp">Japan</option>
      </select>
      <select {...register('city')} disabled={!country}>
        <option value="">Select city</option>
        {(cities[country] ?? []).map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </>
  );
}
```

---

## Nested Controller (Rich Text + JSON)

Pattern used in this project for TipTap editor that outputs both HTML and JSON:

```tsx
<Controller
  control={control}
  name={`translations.${locale}.contentHtml`}
  render={({ field: htmlField }) => (
    <Controller
      control={control}
      name={`translations.${locale}.contentJson`}
      render={({ field: jsonField }) => (
        <TiptapEditor
          value={{ html: htmlField.value ?? '', json: jsonField.value ?? {} }}
          onChange={(v) => {
            htmlField.onChange(v.html);
            jsonField.onChange(v.json);
          }}
        />
      )}
    />
  )}
/>
```

---

## Custom Controlled Components

Create reusable controlled inputs with useController:

```tsx
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

interface SelectFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  options: { value: string; label: string }[];
  required?: boolean;
}

function SelectField<T extends FieldValues>({
  control, name, label, options, required,
}: SelectFieldProps<T>) {
  const {
    field,
    fieldState: { error },
  } = useController({
    control,
    name,
    rules: required ? { required: `${label} is required` } : undefined,
  });

  return (
    <div>
      <label className="label">{label}</label>
      <select
        className="input text-sm"
        value={field.value as string}
        onChange={field.onChange}
        onBlur={field.onBlur}
        ref={field.ref}
        disabled={field.disabled}
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 mt-1">{error.message}</p>}
    </div>
  );
}
```

---

## Form Composition

Split large forms into sections, each receiving register/control via context:

```tsx
// Parent
function ProductForm() {
  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: getDefaults(),
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <BasicInfoSection />
        <PricingSection />
        <InventorySection />
        <SeoSection />
      </form>
    </FormProvider>
  );
}

// Section component
function PricingSection() {
  const { register, formState: { errors } } = useFormContext<ProductFormValues>();
  return (
    <div className="card p-4 space-y-3">
      <h3 className="text-sm font-semibold">Pricing</h3>
      <input type="number" {...register('price', { valueAsNumber: true })} />
      {errors.price && <p className="text-xs text-red-600">{errors.price.message}</p>}
      <input type="number" {...register('compareAtPrice', { valueAsNumber: true })} />
    </div>
  );
}
```

---

## Server Actions (Next.js App Router)

React Hook Form works with Server Actions by calling the action in onSubmit:

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createArticle } from './actions';

const schema = z.object({ title: z.string().min(1), body: z.string().min(10) });
type FormValues = z.infer<typeof schema>;

export function ArticleForm() {
  const {
    register, handleSubmit, setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', body: '' },
  });

  const onSubmit = async (data: FormValues) => {
    const result = await createArticle(data);
    if (result.error) {
      // Map server errors to form fields
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, message]) => {
          setError(field as keyof FormValues, { type: 'server', message });
        });
      } else {
        setError('root.serverError', { type: 'server', message: result.error });
      }
      return;
    }
    // Success handling
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      {errors.title && <p>{errors.title.message}</p>}
      <textarea {...register('body')} />
      {errors.body && <p>{errors.body.message}</p>}
      {errors.root?.serverError && <p>{errors.root.serverError.message}</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
```

---

## Manual Submission (Outside Form)

```tsx
function FormWithExternalButtons() {
  const { handleSubmit, getValues } = useForm();

  // Direct invoke without form element
  const handleSaveDraft = () => {
    const values = getValues();
    saveDraft(values); // no validation
  };

  const handlePublish = () => {
    handleSubmit(async (data) => {
      await publish(data); // with validation
    })();
  };

  return (
    <>
      <form>{/* inputs */}</form>
      <div className="toolbar">
        <button onClick={handleSaveDraft}>Save Draft</button>
        <button onClick={handlePublish}>Publish</button>
      </div>
    </>
  );
}
```

---

## Reactive Values from Server

Use the `values` prop to sync form with external data:

```tsx
function EditForm({ id }: { id: string }) {
  const { data } = useFetchArticle(id);

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: getDefaults(),
    values: data, // form updates when data changes
    resetOptions: {
      keepDirtyValues: true, // preserve user edits
    },
  });
}
```

---

## Programmatic setValue with Side Effects

```tsx
// AI panel applies changes
const handleAiApply = (changes: Change[]) => {
  for (const c of changes) {
    if (c.kind === 'set-title') {
      setValue(`translations.${locale}.title`, c.value, { shouldDirty: true });
    } else if (c.kind === 'set-content') {
      setValue(`translations.${locale}.contentHtml`, c.value, { shouldDirty: true });
      setValue(`translations.${locale}.contentJson`, {}, { shouldDirty: true });
    }
  }
};

// Auto-generate slug from title
const onGenerateSlug = () => {
  const title = getValues('translations.zh-TW.title');
  if (!title?.trim()) return;
  setValue('slug', slugify(title), { shouldValidate: true });
};
```

---

## Dynamic Validation Based on Other Fields

```tsx
// Using register's validate with formValues access
<input {...register('endDate', {
  validate: (value, formValues) => {
    if (!value) return true;
    return new Date(value) > new Date(formValues.startDate) || 'End date must be after start';
  },
  deps: ['startDate'], // re-validate when startDate changes
})} />

// Using Zod's refine for cross-field validation
const schema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
});
```

---

## Gallery / Sortable Array Fields

Pattern for managing ordered media galleries without useFieldArray
(when items are managed via setValue for more control):

```tsx
function GalleryManager() {
  const { setValue, getValues, watch } = useForm<{ gallery: { url: string; order: number }[] }>();
  const gallery = watch('gallery');

  const addImage = (url: string) => {
    const curr = getValues('gallery') ?? [];
    const nextOrder = curr.length ? Math.max(...curr.map(g => g.order)) + 1 : 0;
    setValue('gallery', [...curr, { url, order: nextOrder }], { shouldDirty: true });
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const curr = getValues('gallery') ?? [];
    const target = idx + dir;
    if (target < 0 || target >= curr.length) return;
    const next = [...curr];
    [next[idx], next[target]] = [next[target], next[idx]];
    setValue('gallery', next.map((g, i) => ({ ...g, order: i })), { shouldDirty: true });
  };

  const removeItem = (idx: number) => {
    const curr = getValues('gallery') ?? [];
    setValue(
      'gallery',
      curr.filter((_, i) => i !== idx).map((g, i) => ({ ...g, order: i })),
      { shouldDirty: true },
    );
  };
}
```

---

## ref Forwarding for Custom Components

When a custom input does not expose `ref` via standard props:

```tsx
// Option 1: Destructure register and pass ref to custom prop
const { onChange, onBlur, name, ref } = register('field');
<CustomInput
  onChange={onChange}
  onBlur={onBlur}
  name={name}
  inputRef={ref}   // or innerRef, etc.
/>

// Option 2: Use forwardRef in the custom component
const CustomInput = React.forwardRef<HTMLInputElement, Props>((props, ref) => (
  <input ref={ref} {...props} />
));

// Option 3: Use Controller for components that cannot accept ref at all
<Controller
  control={control}
  name="field"
  render={({ field }) => (
    <ThirdPartyInput value={field.value} onChange={field.onChange} />
  )}
/>
```
