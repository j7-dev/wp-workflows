# i18next + react-i18next 完整範例集

> 所有範例均完整可執行，含 import 語句。對應版本：i18next v25, react-i18next v16

## 目錄

- [完整初始化設定](#完整初始化設定)
- [useTranslation Hook 用法](#usetranslation-hook-用法)
- [語言切換元件](#語言切換元件)
- [Trans 元件範例](#trans-元件範例)
- [複數與 Context 範例](#複數與-context-範例)
- [格式化範例](#格式化範例)
- [TypeScript 完整設定](#typescript-完整設定)
- [Suspense 整合](#suspense-整合)
- [I18nextProvider 與多實例](#i18nextprovider-與多實例)
- [事件監聽](#事件監聽)

---

## 完整初始化設定

### i18n.ts（推薦設定）

```typescript
// src/i18n.ts
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 翻譯資源
import enTranslation from './locales/en/translation.json'
import enCommon from './locales/en/common.json'
import zhTWTranslation from './locales/zh-TW/translation.json'
import zhTWCommon from './locales/zh-TW/common.json'

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
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
    // 語言設定
    fallbackLng: 'en',          // 必須設定（預設 'dev' 不正確）
    supportedLngs: ['en', 'zh-TW'],
    lng: undefined,              // 讓 LanguageDetector 決定
    // Namespace 設定
    defaultNS: 'translation',
    ns: ['translation', 'common'],
    // 插值設定
    interpolation: {
      escapeValue: false,        // React 已處理 XSS，必須設為 false
    },
    // 開發設定
    debug: process.env.NODE_ENV === 'development',
    // LanguageDetector 設定
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  })

export default i18next
```

### main.tsx 中載入

```typescript
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n'  // 必須在 App 之前 import
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

## useTranslation Hook 用法

### 基本用法

```typescript
// src/components/HomePage.tsx
import { useTranslation } from 'react-i18next'

export function HomePage() {
  const { t, i18n } = useTranslation()

  return (
    <div>
      <h1>{t('home.title')}</h1>
      <p>{t('home.description')}</p>
      <p>{t('greeting', { name: 'Alice' })}</p>
    </div>
  )
}
```

### 多 Namespace

```typescript
import { useTranslation } from 'react-i18next'

export function SettingsPage() {
  // 同時載入多個 namespace
  const { t } = useTranslation(['common', 'settings'])

  return (
    <div>
      <h1>{t('settings:page.title')}</h1>
      <button>{t('common:button.save')}</button>
      <button>{t('common:button.cancel')}</button>
    </div>
  )
}
```

### 使用 keyPrefix

```typescript
import { useTranslation } from 'react-i18next'

export function LoginForm() {
  // 所有 t() 呼叫自動加上前綴 'auth.login'
  const { t } = useTranslation('translation', { keyPrefix: 'auth.login' })

  return (
    <form>
      <label>{t('email')}</label>     {/* => auth.login.email */}
      <label>{t('password')}</label>  {/* => auth.login.password */}
      <button>{t('submit')}</button>  {/* => auth.login.submit */}
    </form>
  )
}
```

---

## 語言切換元件

```typescript
// src/components/LanguageSwitcher.tsx
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh-TW', label: '繁體中文' },
] as const

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const handleChange = async (lng: string) => {
    await i18n.changeLanguage(lng)
    // localStorage 會自動更新（若 detection.caches 包含 'localStorage'）
  }

  return (
    <div>
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => handleChange(code)}
          disabled={i18n.language === code}
          aria-pressed={i18n.language === code}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
```

### select 版本

```typescript
// src/components/LanguageSelect.tsx
import { useTranslation } from 'react-i18next'

export function LanguageSelect() {
  const { i18n } = useTranslation()

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      <option value="en">English</option>
      <option value="zh-TW">繁體中文</option>
    </select>
  )
}
```

---

## Trans 元件範例

### 基本 Trans

```typescript
// src/components/WelcomeMessage.tsx
import { Trans, useTranslation } from 'react-i18next'

// JSON: { "welcome": "Welcome, <1>{{name}}</1>! <3>Click here</3> to start." }
export function WelcomeMessage({ name }: { name: string }) {
  const { t } = useTranslation()

  return (
    <Trans
      i18nKey="welcome"
      values={{ name }}
      components={[
        <span />,             // index 0（未使用）
        <strong />,           // index 1: <strong>{{name}}</strong>
        <span />,             // index 2（未使用）
        <a href="/start" />,  // index 3: <a>Click here</a>
      ]}
    />
  )
}
```

### 具名元件（推薦）

```typescript
// JSON: { "tos": "By continuing, you agree to our <tos>Terms of Service</tos>." }
import { Trans } from 'react-i18next'

export function TermsNotice() {
  return (
    <Trans
      i18nKey="tos"
      components={{
        tos: <a href="/terms" className="underline" />,
      }}
    />
  )
}
```

### Trans 帶 count（複數）

```typescript
// JSON:
// { "items_one": "You have <bold>{{count}}</bold> item",
//   "items_other": "You have <bold>{{count}}</bold> items" }
import { Trans } from 'react-i18next'

export function ItemCount({ count }: { count: number }) {
  return (
    <Trans
      i18nKey="items"
      count={count}
      components={{ bold: <strong /> }}
    />
  )
}
```

---

## 複數與 Context 範例

### 複數

```typescript
// src/components/MessageCount.tsx
import { useTranslation } from 'react-i18next'

// JSON:
// {
//   "message_zero": "No messages",
//   "message_one": "{{count}} message",
//   "message_other": "{{count}} messages"
// }
export function MessageCount({ count }: { count: number }) {
  const { t } = useTranslation()
  return <span>{t('message', { count })}</span>
}
```

### Context

```typescript
// JSON:
// {
//   "status": "Status: active",
//   "status_paused": "Status: paused",
//   "status_error": "Status: error"
// }
import { useTranslation } from 'react-i18next'

type Status = 'active' | 'paused' | 'error'

export function StatusBadge({ status }: { status: Status }) {
  const { t } = useTranslation()
  return <span>{t('status', { context: status })}</span>
}
```

### Context + 複數組合

```typescript
// JSON:
// {
//   "task_male_one": "{{count}} task assigned to him",
//   "task_male_other": "{{count}} tasks assigned to him",
//   "task_female_one": "{{count}} task assigned to her",
//   "task_female_other": "{{count}} tasks assigned to her"
// }
import { useTranslation } from 'react-i18next'

export function AssignedTasks({
  count,
  gender,
}: {
  count: number
  gender: 'male' | 'female'
}) {
  const { t } = useTranslation()
  return <p>{t('task', { count, context: gender })}</p>
}
```

---

## 格式化範例

### 數字與貨幣

```typescript
// JSON:
// {
//   "price": "Price: {{amount, number}}",
//   "price_usd": "Price: {{amount, number(style: currency; currency: USD)}}"
// }
import { useTranslation } from 'react-i18next'

export function PriceDisplay({ amount }: { amount: number }) {
  const { t } = useTranslation()
  return (
    <div>
      <p>{t('price', { amount })}</p>
      <p>
        {t('price', {
          amount,
          formatParams: { amount: { style: 'currency', currency: 'TWD', locale: 'zh-TW' } },
        })}
      </p>
    </div>
  )
}
```

### 日期時間

```typescript
// JSON:
// {
//   "published": "Published: {{date, datetime}}",
//   "published_short": "Published: {{date, datetime(dateStyle: short)}}"
// }
import { useTranslation } from 'react-i18next'

export function ArticleMeta({ publishedAt }: { publishedAt: Date }) {
  const { t } = useTranslation()
  return <time>{t('published', { date: publishedAt })}</time>
}
```

---

## TypeScript 完整設定

### i18next.d.ts 型別定義

```typescript
// src/types/i18next.d.ts
import 'i18next'
import type enTranslation from '../locales/en/translation.json'
import type enCommon from '../locales/en/common.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    // 預設 namespace（t('key') 使用此 namespace）
    defaultNS: 'translation'
    // 所有 namespace 的型別定義
    resources: {
      translation: typeof enTranslation
      common: typeof enCommon
    }
  }
}
```

### 使用型別安全的 t()

```typescript
// 有了 CustomTypeOptions，t() 有完整型別提示
import { useTranslation } from 'react-i18next'

export function TypedComponent() {
  const { t } = useTranslation()

  // 正確：存在的 key
  t('home.title')           // OK
  t('common:button.save')   // OK

  // 錯誤：不存在的 key（TypeScript 編譯錯誤）
  // t('nonexistent.key')   // Type Error

  return <div>{t('home.title')}</div>
}
```

### enableSelector（v25.4+）— 函式選擇器語法

```typescript
// src/types/i18next.d.ts 額外設定
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: typeof enTranslation }
    // 啟用函式選擇器語法（v25.4+）
    enableSelector: true
  }
}

// 使用
const { t } = useTranslation()
t(($ ) => $.home.title)    // 用 $ 存取翻譯樹（autocomplete 更好用）
```

---

## Suspense 整合

### 帶 Suspense 的設定

```typescript
// 僅在使用動態載入（lazy loading）時需要
// 靜態 resources 物件不需要 Suspense

// 若使用 i18next-http-backend（動態載入）：
import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()  // 此時 useSuspense 預設 true
  return <div>{t('key')}</div>
}

function App() {
  return (
    <Suspense fallback={<div>Loading translations...</div>}>
      <MyComponent />
    </Suspense>
  )
}
```

### 禁用 Suspense

```typescript
// 靜態資源不需要 Suspense 時
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t, ready } = useTranslation('translation', {
    useSuspense: false,
  })

  if (!ready) return <div>Loading...</div>
  return <div>{t('key')}</div>
}
```

---

## I18nextProvider 與多實例

### 多語言實例隔離

```typescript
// src/plugins/plugin-i18n.ts
import { createInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'

const pluginI18n = createInstance()

pluginI18n.use(initReactI18next).init({
  resources: {
    en: { translation: { key: 'Plugin text' } },
  },
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default pluginI18n
```

```typescript
// src/plugins/PluginApp.tsx
import { I18nextProvider, useTranslation } from 'react-i18next'
import pluginI18n from './plugin-i18n'

function PluginComponent() {
  const { t } = useTranslation()  // 使用 Provider 提供的實例
  return <div>{t('key')}</div>
}

export function PluginApp() {
  return (
    <I18nextProvider i18n={pluginI18n}>
      <PluginComponent />
    </I18nextProvider>
  )
}
```

---

## 事件監聽

```typescript
// src/hooks/useI18nEvents.ts
import { useEffect } from 'react'
import i18next from 'i18next'

export function useI18nLanguageChange(
  callback: (lng: string) => void
) {
  useEffect(() => {
    i18next.on('languageChanged', callback)
    return () => {
      i18next.off('languageChanged', callback)
    }
  }, [callback])
}

// 使用
import { useCallback } from 'react'
import { useI18nLanguageChange } from './hooks/useI18nEvents'

export function App() {
  const handleLangChange = useCallback((lng: string) => {
    document.documentElement.lang = lng
    document.documentElement.dir = ['ar', 'he', 'fa'].includes(lng) ? 'rtl' : 'ltr'
  }, [])

  useI18nLanguageChange(handleLangChange)

  return <div>...</div>
}
```

> 來源：https://react.i18next.com/
> 來源：https://www.i18next.com/
