# i18next 完整設定選項

> 對應 `i18next.init(options)` 的所有設定參數

## 目錄

- [語言設定](#語言設定)
- [Namespace 設定](#namespace-設定)
- [Resources 設定](#resources-設定)
- [缺失 Key 處理](#缺失-key-處理)
- [翻譯預設值](#翻譯預設值)
- [Interpolation 設定](#interpolation-設定)
- [Plugin 設定](#plugin-設定)
- [其他設定](#其他設定)
- [LanguageDetector 設定](#languagedetector-設定)
- [React 整合設定](#react-整合設定)

---

## 語言設定

| 選項 | 型別 | 預設值 | 說明 |
|------|------|--------|------|
| `lng` | `string` | `undefined` | 強制指定語言（會覆蓋 LanguageDetector） |
| `fallbackLng` | `string \| string[] \| false` | `'dev'` | 翻譯找不到時的備用語言。**注意：預設 'dev' 表示會顯示 key，必須明確設定** |
| `supportedLngs` | `string[] \| false` | `false` | 允許的語言清單。LanguageDetector 會從偵測到的語言中選最佳匹配 |
| `nonExplicitSupportedLngs` | `boolean` | `false` | true 表示若 'en' 在 supportedLngs，則 'en-US' 也視為支援 |
| `load` | `'all' \| 'currentOnly' \| 'languageOnly'` | `'all'` | 語言代碼載入策略。'currentOnly' 只載入 'en-US'；'languageOnly' 只載入 'en' |
| `preload` | `string[] \| false` | `false` | 初始化時預先載入的語言 |
| `lowerCaseLng` | `boolean` | `false` | 將語言代碼全部小寫（'en-US' → 'en-us'） |
| `cleanCode` | `boolean` | `false` | 只小寫主語言部分（'EN-US' → 'en-US'） |

## Namespace 設定

| 選項 | 型別 | 預設值 | 說明 |
|------|------|--------|------|
| `ns` | `string \| string[]` | `'translation'` | 要載入的 namespace（s） |
| `defaultNS` | `string \| string[]` | `'translation'` | t() 函式預設使用的 namespace |
| `fallbackNS` | `string \| string[] \| false` | `false` | 主 namespace 找不到 key 時的備用 namespace |

## Resources 設定

| 選項 | 型別 | 預設值 | 說明 |
|------|------|--------|------|
| `resources` | `object` | `undefined` | 直接嵌入翻譯資源（格式：`{ lng: { ns: { key: value } } }`） |
| `partialBundledLanguages` | `boolean` | `false` | 允許部分語言用 resources 嵌入，其餘從 backend 載入 |

## 缺失 Key 處理

| 選項 | 型別 | 預設值 | 說明 |
|------|------|--------|------|
| `saveMissing` | `boolean` | `false` | 找不到 key 時呼叫 missingKeyHandler |
| `saveMissingTo` | `'current' \| 'all' \| 'fallback'` | `'fallback'` | 儲存缺失 key 的目標語言 |
| `saveMissingPlurals` | `boolean` | `true` | 同時儲存所有複數形式 |
| `missingKeyHandler` | `function \| false` | `false` | `(lngs, ns, key, fallbackValue, updateMissing, options) => void` |
| `parseMissingKeyHandler` | `function` | `noop` | 轉換缺失 key 的顯示值：`(key, defaultValue) => string` |
| `appendNamespaceToMissingKey` | `boolean` | `false` | 在缺失 key 前加上 namespace |
| `missingInterpolationHandler` | `function` | `noop` | 插值變數未定義時呼叫：`(text, value, options) => string` |
| `missingKeyNoValueFallbackToKey` | `boolean` | `false` | 阻止以 key 作為預設顯示值 |

## 翻譯預設值

| 選項 | 型別 | 預設值 | 說明 |
|------|------|--------|------|
| `returnNull` | `boolean` | `false` | 允許 null 作為有效翻譯值 |
| `returnEmptyString` | `boolean` | `true` | 允許空字串作為有效翻譯值 |
| `returnObjects` | `boolean` | `false` | 允許返回 object（而非 string） |
| `returnDetails` | `boolean` | `false` | 返回包含 language/namespace/key/value 的詳細物件 |
| `joinArrays` | `string \| false` | `false` | 用指定字元串接陣列翻譯 |
| `postProcess` | `string \| string[] \| false` | `false` | 預設套用的 post-processor |
| `skipInterpolation` | `boolean` | `false` | 跳過插值，直接返回原始字串 |

## Interpolation 設定

傳入 `interpolation` 物件：

```typescript
interpolation: {
  escapeValue: false,        // React 專案必須設 false
  prefix: '{{',             // 插值開頭（預設 '{{'）
  suffix: '}}',             // 插值結尾（預設 '}}'）
  unescapePrefix: '-',      // 不 escape 的前綴（預設 '-'，用法：{{- var}}）
  formatSeparator: ',',     // 格式分隔符（預設 ','，用法：{{val, number}}）
  defaultVariables: {},     // 全域插值變數
  maxReplaces: 1000,        // 最大替換次數（防止無限迴圈）
  skipOnVariables: true,    // 防止插值變數內再次插值
}
```

## Plugin 設定

| 選項 | 型別 | 說明 |
|------|------|------|
| `detection` | `object` | i18next-browser-languagedetector 設定（見下方） |
| `backend` | `object` | backend plugin 設定 |
| `cache` | `object` | cache plugin 設定 |

## 其他設定

| 選項 | 型別 | 預設值 | 說明 |
|------|------|--------|------|
| `debug` | `boolean` | `false` | 開啟 console 詳細日誌 |
| `keySeparator` | `string \| false` | `'.'` | 巢狀 key 分隔符。設 false 停用巢狀 |
| `nsSeparator` | `string \| false` | `':'` | namespace 與 key 的分隔符 |
| `pluralSeparator` | `string` | `'_'` | 複數 key 分隔符（key_one, key_other） |
| `contextSeparator` | `string` | `'_'` | Context key 分隔符（key_male） |
| `ignoreJSONStructure` | `boolean` | `true` | 巢狀路徑找不到時，嘗試 flat key 查詢 |
| `initAsync` | `boolean` | `true` | 非同步載入資源。設 false 可同步初始化（需 sync backend） |
| `maxParallelReads` | `number` | `10` | 最大並行 backend 請求數 |
| `enableSelector` | `boolean \| 'optimize'` | `false` | 啟用 TypeScript selector 語法（v25.4+） |

---

## LanguageDetector 設定

安裝：`npm install i18next-browser-languagedetector`

```typescript
import LanguageDetector from 'i18next-browser-languagedetector'

i18next
  .use(LanguageDetector)
  .init({
    detection: {
      // 偵測順序（依序嘗試）
      order: ['localStorage', 'navigator', 'htmlTag', 'querystring', 'cookie', 'path', 'subdomain'],

      // 各偵測方式的 key 名稱
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      lookupSessionStorage: 'i18nextLng',
      lookupFromPathIndex: 0,        // URL 路徑的語言位置（/en/page → index 0）
      lookupFromSubdomainIndex: 0,   // 子網域位置（en.site.com → index 0）
      lookupHash: 'lng',             // URL hash 查詢 key

      // 快取設定
      caches: ['localStorage'],      // 使用哪些方式快取語言選擇
      excludeCacheFor: ['cimode'],   // 這些語言不快取

      // Cookie 設定
      cookieMinutes: 10080,          // cookie 有效期（分鐘，預設 7 天）
      cookieDomain: 'myDomain',
      cookieOptions: { path: '/', sameSite: 'strict' },

      // HTML 元素
      htmlTag: document.documentElement, // <html lang="...">

      // 語言代碼轉換
      convertDetectedLanguage: 'Iso15897',
      // 或自訂函式：
      // convertDetectedLanguage: (lng) => lng.replace('-', '_'),
    }
  })
```

### 自訂 Detector

```typescript
const myDetector = {
  name: 'myCustomDetector',
  lookup(options: object) {
    // 返回偵測到的語言代碼
    return window.myCustomLang || undefined
  },
  cacheUserLanguage(lng: string, options: object) {
    // 快取語言選擇
    window.myCustomLang = lng
  }
}

const detector = new LanguageDetector()
detector.addDetector(myDetector)

i18next.use(detector).init({
  detection: {
    order: ['myCustomDetector', 'localStorage', 'navigator'],
  }
})
```

---

## React 整合設定

在 `init()` 的 `react` key 下設定：

```typescript
i18next.init({
  react: {
    bindI18n: 'languageChanged',          // 觸發 re-render 的事件（預設）
    bindI18nStore: '',                     // store 事件觸發 re-render
    transEmptyNodeValue: '',              // Trans 空節點的返回值
    transSupportBasicHtmlNodes: true,     // 支援基本 HTML 元素（br, strong, i, p）
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'], // 保留的基本 HTML 元素
    useSuspense: true,                    // 全域 Suspense 設定
    transWrapTextNodes: '',               // 文字節點包裹元素
    defaultTransParent: 'div',            // React < v16 的 Trans 父元素
    transDefaultProps: undefined,         // Trans 的全域預設 props
  }
})
```
