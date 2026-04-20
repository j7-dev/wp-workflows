---
name: i18next-v25
description: >
  i18next v25 與 react-i18next v16 的完整技術參考。涵蓋所有初始化設定、API、TypeScript 型別系統、翻譯語法與 React 整合模式。
  當程式碼中出現任何以下情況時，必須使用此 SKILL：
  import i18next、import { useTranslation }、import { Trans }、i18n.use()、i18n.init()、
  t('key')、changeLanguage、I18nextProvider、initReactI18next、LanguageDetector、
  i18next-browser-languagedetector、fallbackLng、翻譯 key、多語言、國際化、i18n、
  locales 目錄、translation.json、zh-TW、en 語言切換。
  此 SKILL 對應 i18next v25.x + react-i18next v16.x，不適用於 v4 或更舊版本。
---

# i18next v25 + react-i18next v16

> **適用版本**：i18next ^25.8.x | react-i18next ^16.5.x | i18next-browser-languagedetector ^8.2.x
> **文件來源**：https://www.i18next.com | https://react.i18next.com
> **最後更新**：2026-03-20

用於管理多語言翻譯的完整解決方案。i18next 為核心引擎，react-i18next 提供 React hooks/components 整合。

---

## 初始化設定（v25 標準模式）

```typescript
// src/i18n.ts
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enTranslation from './locales/en/translation.json'
import zhTWTranslation from './locales/zh-TW/translation.json'

export const defaultNS = 'translation'
export const resources = {
  en: { translation: enTranslation },
  'zh-TW': { translation: zhTWTranslation },
} as const

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh-TW'],
    interpolation: {
      escapeValue: false, // React 已自動處理 XSS，不需要再次 escape
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  })

export default i18next
```

---

## 核心 API 速查

### useTranslation Hook（最常用）

```typescript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t, i18n } = useTranslation()          // 使用 defaultNS
  const { t } = useTranslation('common')         // 指定單一 namespace
  const { t } = useTranslation(['ns1', 'ns2'])   // 多個 namespaces，ns1 為預設
  const { t, ready } = useTranslation('ns1', { useSuspense: false }) // 停用 Suspense

  return <p>{t('greeting')}</p>
}
```

**useTranslation 參數：**

| 參數 | 型別 | 說明 |
|------|------|------|
| `ns` | `string \| string[]` | namespace（可選，預設為 defaultNS） |
| `options.keyPrefix` | `string` | 自動為所有 key 加前綴（v11.12.0+） |
| `options.lng` | `string` | 指定翻譯使用的語言（v12.3.1+） |
| `options.useSuspense` | `boolean` | 是否使用 React Suspense（預設 true） |
| `options.i18n` | `i18next` | 覆寫預設 i18next instance |

**返回值：**
- `t` — 翻譯函式
- `i18n` — i18next 實例（可呼叫 i18n.changeLanguage()）
- `ready` — 翻譯是否已載入（僅在 useSuspense: false 時可用）

### t() 翻譯函式語法

```typescript
// 基本
t('key')
t('section.nested.key')        // 巢狀 key（dot notation）

// 插值
t('hello', { name: 'Alice' }) // JSON: "hello": "Hello, {{name}}!"

// 複數
t('item', { count: 1 })       // JSON: "item_one": "1 item"
t('item', { count: 5 })       // JSON: "item_other": "{{count}} items"

// 預設值
t('key', 'default text')
t('key', { defaultValue: 'default text' })

// namespace
t('common:button.save')       // namespace:key 語法
t('key', { ns: 'common' })    // 選項語法（推薦）

// 返回物件
t('section', { returnObjects: true }) // 返回 JSON 物件

// Context
t('friend', { context: 'male' })   // JSON key: "friend_male"

// 陣列 key（fallback）
t(['specific.key', 'generic.key']) // 從第一個找到的 key 返回
```

### 語言切換

```typescript
const { i18n } = useTranslation()

// 切換語言（返回 Promise）
await i18n.changeLanguage('zh-TW')

// 讀取目前語言
i18n.language          // 'zh-TW'
i18n.languages         // ['zh-TW', 'zh', 'en']（包含 fallback 鏈）

// 直接呼叫（在 React 元件外）
import i18n from './i18n'
i18n.changeLanguage('en')
```

---

## Trans 元件（含 React 節點的翻譯）

用於翻譯含有 HTML 標籤或 React 元件的複雜內容：

```tsx
import { Trans } from 'react-i18next'

// 基本
<Trans i18nKey="welcome">Welcome to <strong>the app</strong></Trans>
// JSON: "welcome": "Welcome to <1>the app</1>"

// 插值 + 元件（index 對應子節點位置）
<Trans i18nKey="userMessages" count={count}>
  Hello <strong>{{name}}</strong>, you have {{count}} messages.
  <Link to="/msgs">Go to messages</Link>.
</Trans>
// JSON _one: "Hello <1>{{name}}</1>, you have {{count}} message. <3>Go to messages</3>."
// JSON _other: "Hello <1>{{name}}</1>, you have {{count}} messages. <3>Go to messages</3>."

// Named components（更清晰，推薦）
<Trans
  i18nKey="myKey"
  defaults="Click <lnk>here</lnk> to <b>continue</b>"
  components={{ lnk: <a href="/path" />, b: <strong /> }}
/>
// JSON: "myKey": "Click <lnk>here</lnk> to <b>continue</b>"
```

**Trans Props：**

| Prop | 型別 | 說明 |
|------|------|------|
| `i18nKey` | `string` | 翻譯 key（支援 ns:key 格式） |
| `ns` | `string` | namespace |
| `count` | `number` | 複數用；v16.4.0+ 可自動推斷 |
| `context` | `string` | Context 值 |
| `defaults` | `string` | 預設翻譯內容 |
| `values` | `object` | 插值變數 |
| `components` | `array \| object` | React 元件對應（index 或 named） |
| `tOptions` | `object` | 傳遞給底層 t() 的選項 |
| `shouldUnescape` | `boolean` | 解碼 HTML entities |

---

## TypeScript 型別設定（v25）

在 `src/@types/i18next.d.ts` 建立宣告：

```typescript
// src/@types/i18next.d.ts
import { resources, defaultNS } from '../i18n'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    resources: typeof resources['en']
    // v25.4+ 啟用 selector 語法（$ => $.key）
    // enableSelector: true
  }
}
```

啟用後，t() 會自動推斷所有合法的 key 並提供 autocomplete。

---

## 翻譯檔案結構

```json
// src/locales/en/translation.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "greeting": "Hello, {{name}}!",
  "item_one": "{{count}} item",
  "item_other": "{{count}} items",
  "friend_male": "A boyfriend",
  "friend_female": "A girlfriend"
}
```

```json
// src/locales/zh-TW/translation.json
{
  "common": {
    "save": "儲存",
    "cancel": "取消"
  },
  "greeting": "你好，{{name}}！",
  "item_other": "{{count}} 個項目",
  "friend_male": "男朋友",
  "friend_female": "女朋友"
}
```

---

## 常見陷阱

- **`escapeValue: false` 是 React 必要設定**：React 本身已 escape，若不關閉會導致 HTML entity 出現在畫面上
- **複數 key 命名**：v21+ 使用 `_one` / `_other`（舊版為 `_1` / `_2`）；zh-TW 只有 `_other` 形式
- **`fallbackLng: 'dev'` 是預設值**：必須明確設定 `fallbackLng: 'en'` 或適當語言
- **`useTranslation` 只能在 functional component 中使用**
- **Trans 不處理語言切換**：只做一次性插值；語言切換後需確保父元件 re-render
- **TypeScript 需要 strict 模式**：`strict: true` 且 `skipLibCheck: true`
- **`keyPrefix` 不能與 `ns:key` 混用**：使用 keyPrefix 時，`t('ns:key')` 無法正常運作

---

## References 導引

| 需求 | 參閱檔案 |
|------|---------|
| 完整 init() 設定選項 + LanguageDetector 設定 | `references/configuration.md` |
| 所有 i18next API 方法（instance、events、resource management） | `references/api-reference.md` |
| 翻譯語法詳解（複數規則、context、格式化、巢狀、interpolation） | `references/translation-syntax.md` |
| 完整可執行範例（Provider、語言切換元件、withTranslation HOC） | `references/examples.md` |
| TypeScript 完整設定 + 常見問題排查 | `references/typescript.md` |
