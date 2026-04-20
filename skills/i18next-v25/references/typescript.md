# i18next TypeScript 整合指南

> TypeScript 型別安全設定、CustomTypeOptions、enableSelector、常見問題排解

## 目錄

- [基本型別設定](#基本型別設定)
- [CustomTypeOptions 完整參考](#customtypeoptions-完整參考)
- [Step-by-step 設定流程](#step-by-step-設定流程)
- [enableSelector 語法（v25.4+）](#enableselector-語法v254)
- [常見 TypeScript 問題排解](#常見-typescript-問題排解)

---

## 基本型別設定

### 最小設定（單 namespace）

```typescript
// src/types/i18next.d.ts
import 'i18next'
import type enTranslation from '../locales/en/translation.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof enTranslation
    }
  }
}
```

### 多 namespace 設定

```typescript
// src/types/i18next.d.ts
import 'i18next'
import type enTranslation from '../locales/en/translation.json'
import type enCommon from '../locales/en/common.json'
import type enAuth from '../locales/en/auth.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof enTranslation
      common: typeof enCommon
      auth: typeof enAuth
    }
  }
}
```

> 注意：只需要 import **en**（或你的 fallback 語言）的型別。其他語言（zh-TW 等）的 JSON 不需要 import 進型別宣告，因為 key 結構應相同。

---

## CustomTypeOptions 完整參考

```typescript
declare module 'i18next' {
  interface CustomTypeOptions {
    // --- 必要設定 ---

    // 預設 namespace（影響 t('key') 的型別推導）
    defaultNS: 'translation'

    // 所有 namespace 的型別對應
    resources: {
      translation: TranslationResource
      common: CommonResource
    }

    // --- 可選設定 ---

    // 啟用函式選擇器語法（v25.4+）
    // t(($ ) => $.home.title) 而非 t('home.title')
    enableSelector?: boolean  // 預設 false

    // 控制 returnNull 的型別
    // false（預設）：t() 回傳 string，永不回傳 null
    // true：t() 可能回傳 null（v24 已棄用，不建議使用）
    returnNull?: false

    // 控制 t() 回傳型別
    // false（預設）：t() 回傳 string
    // true：t() 回傳 string | string[]（當翻譯值是陣列時）
    returnObjects?: false

    // 用於 joinArrays 選項的型別推導
    joinArrays?: string

    // 允許 t() key 是動態字串（較寬鬆的型別）
    // 開啟後 t() 接受任意 string，型別檢查較弱
    // 不建議開啟
    // allowObjectInHTMLChildren?: boolean
  }
}
```

---

## Step-by-step 設定流程

### 步驟 1：建立翻譯 JSON 檔（確保正確路徑）

```
src/
  locales/
    en/
      translation.json
      common.json
    zh-TW/
      translation.json
      common.json
```

### 步驟 2：確認 tsconfig.json 可解析 JSON

```json
// tsconfig.json
{
  "compilerOptions": {
    "resolveJsonModule": true,   // 必須啟用
    "strict": true,
    "moduleResolution": "bundler"  // 或 "node16"
  }
}
```

### 步驟 3：建立型別宣告檔案

```typescript
// src/types/i18next.d.ts
import 'i18next'
import type en from '../locales/en/translation.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof en
    }
  }
}
```

### 步驟 4：確認宣告檔案被 tsconfig 包含

```json
// tsconfig.json
{
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/types/**/*.d.ts"]
}
```

### 步驟 5：驗證型別生效

```typescript
// 在任意元件中測試
import { useTranslation } from 'react-i18next'

function Test() {
  const { t } = useTranslation()
  // 輸入 t(' 時應出現 autocomplete（VSCode / WebStorm）
  // 輸入不存在的 key 時應出現 TypeScript 錯誤
  return <div>{t('nav.home')}</div>
}
```

---

## enableSelector 語法（v25.4+）

使用函式選擇器代替字串 key，提供更好的 autocomplete 體驗：

### 設定

```typescript
// src/types/i18next.d.ts
import 'i18next'
import type en from '../locales/en/translation.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: typeof en }
    enableSelector: true  // 啟用函式選擇器
  }
}
```

### 初始化時啟用

```typescript
i18next.init({
  // ...其他設定
  // enableSelector 是 TypeScript 型別層級設定，不需要在 init() 中設定
  // 但若要使用 t($ => $.key) 語法，需要確保 v25.4+ 版本
})
```

### 使用

```typescript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()

  // 字串 key（仍可使用）
  const title1 = t('home.title')

  // 函式選擇器（enableSelector: true 後可用）
  // $ 是翻譯資源的型別，IDE 有完整 autocomplete
  const title2 = t(($) => $.home.title)

  return <h1>{title2}</h1>
}
```

### 帶 namespace 的選擇器

```typescript
import { useTranslation } from 'react-i18next'

function Component() {
  const { t } = useTranslation('common')
  // $ 自動對應 common namespace 的型別
  return <button>{t(($) => $.button.save)}</button>
}
```

---

## 常見 TypeScript 問題排解

### 問題 1：t() 回傳型別是 string & string[]（OOM 或型別錯誤）

原因：JSON 中存在陣列值，TypeScript 嘗試計算所有可能的 key 組合導致型別計算爆炸。

解決：

```typescript
// 選項 A：在 CustomTypeOptions 明確設定 returnObjects: false
interface CustomTypeOptions {
  returnObjects: false
  // ...
}

// 選項 B：簡化翻譯 JSON，避免陣列值
// 將陣列拆為具名 key
// 改前：{ "steps": ["Step 1", "Step 2", "Step 3"] }
// 改後：{ "steps": { "1": "Step 1", "2": "Step 2", "3": "Step 3" } }
```

### 問題 2：型別宣告不生效（t() 接受任意字串）

排查清單：

```bash
# 1. 確認 .d.ts 檔案在 tsconfig include 範圍內
# 2. 確認 tsconfig 有 resolveJsonModule: true
# 3. 確認重啟 TypeScript server（VSCode: Ctrl+Shift+P -> "Restart TS Server"）
# 4. 確認 i18next 版本 >= v21（舊版不支援 CustomTypeOptions）
```

### 問題 3：namespace 型別不正確

```typescript
// 問題：t('common:button.save') 顯示型別錯誤
// 解決：確認 resources 中有 common namespace 的型別定義

interface CustomTypeOptions {
  resources: {
    translation: typeof enTranslation
    common: typeof enCommon  // 確認有加這行
  }
}
```

### 問題 4：複數 key 型別錯誤（_one, _other 不被接受）

```typescript
// i18next v21+ 的複數 key（item_one, item_other 等）
// 在 JSON 中定義後，TypeScript 可能對 t('item', { count: n }) 報錯
// 這是已知限制，i18next 型別系統對複數 key 的處理是特殊的
// 解決：使用 @ts-expect-error 或確認使用 v21+ 的型別宣告
```

### 問題 5：JSON 檔案過大導致 TypeScript 很慢

```typescript
// 若翻譯檔案過大（> 1000 keys）導致 IDE 緩慢，可限制型別深度
// 選項 A：分割 namespace，減少單一 namespace 的 key 數量

// 選項 B：使用簡化型別（放棄部分型別安全）
interface CustomTypeOptions {
  defaultNS: 'translation'
  resources: {
    // 只對主要 namespace 定義型別，其他用 Record<string, string>
    translation: typeof enTranslation
    common: Record<string, string>
  }
}
```

### 問題 6：i18n.language 型別是 string 而非 union

```typescript
// i18n.language 型別是 string，若需要 union 型別，需自行 cast
type SupportedLng = 'en' | 'zh-TW'

const { i18n } = useTranslation()
const currentLng = i18n.language as SupportedLng

// 或建立 helper hook
function useCurrentLanguage(): SupportedLng {
  const { i18n } = useTranslation()
  return i18n.language as SupportedLng
}
```

> 來源：https://www.i18next.com/overview/typescript
> 來源：https://react.i18next.com/latest/typescript
