# next-intl v4 ICU MessageFormat and Translation Methods Reference

## Message Structure

Messages are JSON objects with nested namespaces:

```json
{
  "auth": {
    "SignUp": {
      "title": "Sign up",
      "form": {
        "placeholder": "Enter your name",
        "submit": "Submit"
      }
    }
  }
}
```

Access with dot-separated namespace:
```typescript
const t = useTranslations('auth.SignUp');
t('title');           // "Sign up"
t('form.placeholder'); // "Enter your name"
```

Namespace keys cannot contain `.` (reserved for nesting). All other characters are valid.

---

## ICU MessageFormat Syntax

### Static

```json
{ "hello": "Hello world!" }
```

### Interpolation

```json
{ "greeting": "Hello {name}!" }
```
```typescript
t('greeting', { name: 'Jane' }); // "Hello Jane!"
```

Constraint: argument names must be alphanumeric + underscores. No dashes.

### Cardinal Plural

```json
{
  "items": "You have {count, plural, =0 {no items} =1 {one item} other {# items}}."
}
```
```typescript
t('items', { count: 0 });    // "You have no items."
t('items', { count: 1 });    // "You have one item."
t('items', { count: 3580 }); // "You have 3,580 items."
```

`#` is replaced with the locale-formatted number value.

Available tags:
| Tag | Usage |
|-----|-------|
| `zero` | Zero-item grammar (Arabic, Latvian, Welsh) |
| `one` | Singular (English, German, most languages) |
| `two` | Dual (Arabic, Welsh) |
| `few` | Small numbers (Arabic, Croatian, Polish) |
| `many` | Large numbers (Arabic, Croatian, Polish) |
| `other` | **Required** default case |
| `=N` | Exact numeric match (e.g., `=0`, `=42`) |

### Ordinal

```json
{
  "rank": "It's your {year, selectordinal, one {#st} two {#nd} few {#rd} other {#th}} birthday!"
}
```
Same tags as cardinal plural.

### Select

```json
{
  "pronoun": "{gender, select, female {She} male {He} other {They}} is online."
}
```
```typescript
t('pronoun', { gender: 'female' }); // "She is online."
```

Rules:
- `other` case is **mandatory**
- Values must be alphanumeric + underscores (no dashes)
- For values with dashes, map before passing:
  ```typescript
  t('label', { locale: locale.replaceAll('-', '_') });
  ```

### Nested Syntax

Plural, select, and other blocks can be nested:

```json
{
  "msg": "{gender, select, female {{count, plural, one {She has # item} other {She has # items}}} other {{count, plural, one {They have # item} other {They have # items}}}}"
}
```

### Escaping

Single quotes escape special characters:

```json
{ "escaped": "Use single quotes to show literal '{name}'" }
```
Output: `Use single quotes to show literal {name}`

To display a literal single quote, double it: `''`

---

## Translation Function Methods

### t(key, values?)

Returns a `string`.

```typescript
const t = useTranslations('Page');

t('title');                            // plain string
t('greeting', { name: 'Jane' });       // with interpolation
t('items', { count: 5 });              // with plural
```

### t.rich(key, values)

Returns `ReactNode`. Used for embedding React elements in translations.

```json
{
  "tos": "Please accept <link>the terms</link>.",
  "multiline": "Hello,<br></br>how are you?",
  "nested": "This is <bold><italic>very</italic> important</bold>."
}
```
```typescript
t.rich('tos', {
  link: (chunks) => <a href="/terms">{chunks}</a>,
});
// -> <>Please accept <a href="/terms">the terms</a>.</>

t.rich('multiline', {
  br: () => <br />,  // self-closing tag
});

t.rich('nested', {
  bold: (chunks) => <strong>{chunks}</strong>,
  italic: (chunks) => <em>{chunks}</em>,
});
```

#### Reusable RichText component pattern

```typescript
// components/RichText.tsx
import { ReactNode } from 'react';

type Tag = 'p' | 'b' | 'i' | 'br';
type Props = {
  children(tags: Record<Tag, (chunks: ReactNode) => ReactNode>): ReactNode;
};

export default function RichText({ children }: Props) {
  return (
    <div className="prose">
      {children({
        p: (chunks) => <p>{chunks}</p>,
        b: (chunks) => <b className="font-semibold">{chunks}</b>,
        i: (chunks) => <i className="italic">{chunks}</i>,
        br: () => <br />,
      })}
    </div>
  );
}
```

```typescript
// Usage
<RichText>{(tags) => t.rich('description', tags)}</RichText>

// Merging shared + dynamic tags
<RichText>
  {(tags) => t.rich('bio', { ...tags, username: user.name })}
</RichText>
```

### t.markup(key, values)

Returns a `string` with HTML markup. Tag functions accept and return strings (not ReactNode).

```json
{ "important": "This is <bold>important</bold>" }
```
```typescript
t.markup('important', {
  bold: (chunks) => `<b>${chunks}</b>`,
});
// Returns: 'This is <b>important</b>'
```

### t.raw(key)

Returns the raw JSON value (string, boolean, object, array).

```json
{ "content": "<h1>Headline</h1><p>Raw HTML content</p>" }
```
```typescript
<div dangerouslySetInnerHTML={{ __html: t.raw('content') }} />
```

Security: always sanitize content passed to `dangerouslySetInnerHTML`.

### t.has(key)

Returns `boolean` indicating if a key exists in messages.

```typescript
t.has('title');   // true
t.has('unknown'); // false
```

---

## Iterating Message Keys

### Static iteration (recommended)

```typescript
const t = useTranslations('Stats');
const items = [
  { title: t('revenue.title'), value: t('revenue.value') },
  { title: t('users.title'), value: t('users.value') },
];
```

### Dynamic iteration with useMessages

```typescript
import { useTranslations, useMessages } from 'next-intl';

function Stats() {
  const t = useTranslations('Stats');
  const messages = useMessages();
  const keys = Object.keys(messages.Stats as Record<string, unknown>);

  return keys.map((key) => (
    <div key={key}>
      <h3>{t(`${key}.title`)}</h3>
      <p>{t(`${key}.value`)}</p>
    </div>
  ));
}
```

---

## Number and Date Formatting in Messages

### Number in messages

```json
{
  "basic": "Count: {value, number}",
  "percent": "Rate: {value, number, percent}",
  "skeleton": "Precise: {value, number, ::.##}"
}
```

Custom format:
```json
{ "price": "Price: {amount, number, currency}" }
```
```typescript
t('price', { amount: 99.99 }, {
  number: {
    currency: { style: 'currency', currency: 'EUR' }
  }
});
```

### Date in messages

```json
{
  "ordered": "Ordered on {date, date, short}",
  "time": "At {time, time, short}",
  "skeleton": "On {date, date, ::yyyyMMMd}"
}
```

Built-in formats: `full`, `long`, `medium`, `short`.
Skeleton patterns with `::` prefix follow Unicode ICU spec.

---

## Converting Flat Keys to Nested

For message files using flat dot-separated keys:

```typescript
import { set } from 'lodash';

const flat = {
  'nav.home': 'Home',
  'nav.about': 'About',
  'contact.form.name': 'Name'
};

const nested = Object.entries(flat).reduce(
  (acc, [key, value]) => set(acc, key, value),
  {}
);
// { nav: { home: 'Home', about: 'About' }, contact: { form: { name: 'Name' } } }
```
