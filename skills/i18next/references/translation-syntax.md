# i18next 翻譯語法詳解

> 涵蓋所有翻譯函式特性：複數、context、格式化、巢狀、interpolation

## 目錄

- [基本翻譯](#基本翻譯)
- [Interpolation 插值](#interpolation-插值)
- [複數規則](#複數規則)
- [Context 上下文](#context-上下文)
- [巢狀翻譯](#巢狀翻譯)
- [格式化（Formatting）](#格式化formatting)
- [返回值控制](#返回值控制)
- [翻譯檔案組織](#翻譯檔案組織)

---

## 基本翻譯

```typescript
t('title')  // simple key
t('nav.home')  // nested key
t('common:button.save')  // namespace:key
t('key', { ns: 'common' })  // options namespace
t('missing', 'Default text')  // default value
t(['specific', 'generic'])  // array fallback
```

---

## Interpolation 插值

### 基本插值

```typescript
// JSON: { "greeting": "Hello, {{name}}!" }
t('greeting', { name: 'Alice' })  // => "Hello, Alice!"

// 多個變數
// JSON: { "msg": "{{count}} items in {{place}}" }
t('msg', { count: 3, place: 'cart' })
```

### 跳脫與 HTML（React 必讀）

```typescript
// React 專案必須設定 escapeValue: false
// i18next 預設會 HTML encode 插值，React 自己處理 XSS
i18next.init({
  interpolation: { escapeValue: false }  // 必須設定
})

// 若需要渲染 HTML，使用 Trans component（見 SKILL.md）
// 不要在 t() 插值中直接放 HTML 字串
```

### 自訂插值符號

```typescript
i18next.init({
  interpolation: {
    prefix: '[[',   // 預設 '{{'
    suffix: ']]',   // 預設 '}}'
    // JSON: { "key": "Hello, [[name]]!" }
  }
})
```

### formatParams

```typescript
// JSON: { "key": "Price: {{price, currency}}" }
// 配合 Format plugin 或 Intl formatter 使用
t('key', { price: 9.99, formatParams: { price: { currency: 'USD' } } })
```

---

## 複數規則

### CLDR 複數類別（v21+ 格式）

i18next v21+ 使用 CLDR 複數規則，後綴格式：`_zero`, `_one`, `_two`, `_few`, `_many`, `_other`

```json
{
  "item_zero": "No items",
  "item_one": "{{count}} item",
  "item_other": "{{count}} items"
}
```

```typescript
t('item', { count: 0 })   // => "No items"
t('item', { count: 1 })   // => "1 item"
t('item', { count: 5 })   // => "5 items"
```

### 語言複數規則

| 語言 | 支援的複數類別 |
|------|-------------|
| English (en) | `_one`, `_other` |
| Chinese (zh-TW) | `_other`（中文無複數，只用 `_other`） |
| Arabic (ar) | `_zero`, `_one`, `_two`, `_few`, `_many`, `_other` |
| Russian (ru) | `_one`, `_few`, `_many`, `_other` |

```json
// zh-TW: 只需要 _other
{
  "item_other": "{{count}} 個項目"
}
```

### 序數複數（Ordinal）

```typescript
// 需指定 ordinal: true
t('position', { count: 1, ordinal: true })

// JSON:
// { "position_one": "{{count}}st", "position_two": "{{count}}nd",
//   "position_few": "{{count}}rd", "position_other": "{{count}}th" }
```

### 舊版複數格式（v20 以前）

```json
// 舊格式（不建議，v21+ 仍相容）
{
  "item": "{{count}} item",
  "item_plural": "{{count}} items"
}
```

---

## Context 上下文

Context 用來根據語境選擇不同翻譯，常見用途：性別、狀態。

### 基本 context

```json
{
  "friend": "A friend",
  "friend_male": "A boyfriend",
  "friend_female": "A girlfriend"
}
```

```typescript
t('friend')                        // => "A friend"
t('friend', { context: 'male' })   // => "A boyfriend"
t('friend', { context: 'female' }) // => "A girlfriend"
```

### Context 與複數組合

key 格式：`{key}_{context}_{plural}`

```json
{
  "itemWithGender_male_one": "{{count}} male item",
  "itemWithGender_male_other": "{{count}} male items",
  "itemWithGender_female_one": "{{count}} female item",
  "itemWithGender_female_other": "{{count}} female items"
}
```

```typescript
t('itemWithGender', { context: 'male', count: 1 })   // => "1 male item"
t('itemWithGender', { context: 'female', count: 3 })  // => "3 female items"
```

---

## 巢狀翻譯

使用 `$t()` 在翻譯值中引用其他翻譯 key。

### 基本巢狀

```json
{
  "button": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "dialog": {
    "confirm": "Click $t(button.save) to confirm"
  }
}
```

```typescript
t('dialog.confirm')  // => "Click Save to confirm"
```

### 帶參數的巢狀

```json
{
  "greeting": "Hello, {{name}}!",
  "welcome": "$t(greeting, {"name": "{{user}}"})"
}
```

```typescript
t('welcome', { user: 'Alice' })  // => "Hello, Alice!"
```

### 跨 namespace 巢狀

```json
{
  "message": "$t(common:button.save) changes"
}
```

---

## 格式化（Formatting）

### Intl 格式化（v21.3.0+ 內建）

i18next v21.3.0+ 內建基於 `Intl` API 的格式化，不需要額外 plugin。

格式化語法：`{{value, formatType(options)}}`

#### 數字格式化

```json
{
  "price": "Price: {{amount, number}}",
  "percent": "{{value, number(style: percent)}}",
  "currency_display": "{{amount, number(style: currency; currency: USD)}}"
}
```

```typescript
t('price', { amount: 1234.56 })
// => "Price: 1,234.56" (en locale)

t('percent', { value: 0.75 })
// => "75%"

t('currency_display', { amount: 9.99 })
// => "$9.99"
```

#### 貨幣格式化（推薦用法）

```typescript
// 使用 formatParams 傳遞格式化選項
t('price', {
  amount: 9.99,
  formatParams: {
    amount: { style: 'currency', currency: 'USD', locale: 'en-US' }
  }
})
```

#### 日期時間格式化

```json
{
  "created": "Created: {{date, datetime}}",
  "date_short": "{{date, datetime(dateStyle: short)}}",
  "date_full": "{{date, datetime(dateStyle: full; timeStyle: short)}}"
}
```

```typescript
t('created', { date: new Date() })
// => "Created: 3/20/2026, 10:30:00 AM" (en-US)

t('date_short', { date: new Date() })
// => "3/20/2026"
```

#### 相對時間格式化

```json
{
  "ago": "{{val, relativetime}}",
  "ago_day": "{{val, relativetime(range: day)}}"
}
```

```typescript
t('ago', { val: -3, range: 'day' })
// => "3 days ago"

t('ago_day', { val: -1 })
// => "yesterday"
```

#### 列表格式化

```json
{
  "items_list": "{{val, list}}",
  "items_disjunction": "{{val, list(type: disjunction)}}"
}
```

```typescript
t('items_list', { val: ['Apple', 'Banana', 'Cherry'] })
// => "Apple, Banana, and Cherry" (en)

t('items_disjunction', { val: ['A', 'B'] })
// => "A or B"
```

### 自訂格式化函式

```typescript
i18next.init({
  interpolation: {
    format: (value, format, lng) => {
      if (format === 'uppercase') return value.toUpperCase()
      if (format === 'lowercase') return value.toLowerCase()
      return value
    }
  }
})
// JSON: { "key": "{{name, uppercase}}" }
// t('key', { name: 'hello' }) => "HELLO"
```

---

## 返回值控制

### returnObjects — 返回物件

```typescript
// JSON: { "nested": { "a": "A", "b": "B" } }
t('nested', { returnObjects: true })
// => { a: 'A', b: 'B' }

// 全域設定
i18next.init({ returnObjects: true })
```

### joinArrays — 陣列串接

```typescript
// JSON: { "list": ["item1", "item2", "item3"] }
t('list', { joinArrays: ', ' })
// => "item1, item2, item3"

// 全域設定
i18next.init({ joinArrays: '
' })
```

### returnDetails — 詳細返回

```typescript
// 返回包含翻譯來源資訊的物件（v21.3.0+）
t('key', { returnDetails: true })
// => { res: 'translated text', usedKey: 'key', exactUsedKey: 'key',
//      usedLng: 'en', usedNS: 'translation', usedParams: {...} }
```

### returnNull — 缺少 key 時的行為

```typescript
// 預設：缺少 key 時回傳 key 字串
// returnNull: true 時缺少 key 回傳 null（已於 v24 棄用）
// 建議：使用 defaultValue 處理缺失 key
t('missing.key', 'Fallback text')
```

---

## 翻譯檔案組織

### 建議目錄結構

```
src/
  locales/
    en/
      translation.json    # 預設 namespace
      common.json         # 共用文字（按鈕、標籤等）
      auth.json           # 認證相關
      dashboard.json      # 功能模組
    zh-TW/
      translation.json
      common.json
      auth.json
      dashboard.json
```

### 多 namespace 初始化

```typescript
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import enTranslation from './locales/en/translation.json'
import enCommon from './locales/en/common.json'
import zhTWTranslation from './locales/zh-TW/translation.json'
import zhTWCommon from './locales/zh-TW/common.json'

i18next.use(initReactI18next).init({
  resources: {
    en: {
      translation: enTranslation,
      common: enCommon,
    },
    'zh-TW': {
      translation: zhTWTranslation,
      common: zhTWCommon,
    },
  },
  defaultNS: 'translation',
  ns: ['translation', 'common'],
  fallbackLng: 'en',
  supportedLngs: ['en', 'zh-TW'],
  interpolation: { escapeValue: false },
})
```

### 使用多 namespace

```typescript
// useTranslation 接受單一或陣列
const { t } = useTranslation('common')
const { t } = useTranslation(['common', 'auth'])

// 在翻譯 key 中指定 namespace
t('button.save')          // 使用 hook 指定的 namespace
t('auth:login.title')     // 明確指定 namespace
```

### JSON 檔案最佳實踐

```json
// 使用巢狀結構按功能分組
{
  "nav": {
    "home": "Home",
    "settings": "Settings"
  },
  "button": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "confirm": "Confirm"
  },
  "error": {
    "required": "This field is required",
    "invalid_email": "Invalid email address"
  }
}
```

> 來源：https://www.i18next.com/translation-function/essentials
> 來源：https://www.i18next.com/translation-function/interpolation
> 來源：https://www.i18next.com/translation-function/plurals
> 來源：https://www.i18next.com/translation-function/context
> 來源：https://www.i18next.com/translation-function/nesting
> 来源：https://www.i18next.com/translation-function/formatting
