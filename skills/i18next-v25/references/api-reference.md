# i18next v25 完整 API 參考

> 對應 i18next instance 的所有方法與屬性

## 目錄

- [初始化方法](#初始化方法)
- [翻譯方法](#翻譯方法)
- [語言管理](#語言管理)
- [Namespace 與資源載入](#namespace-與資源載入)
- [資源管理](#資源管理)
- [事件系統](#事件系統)
- [實例管理](#實例管理)

---

## 初始化方法

### i18next.use(module)

載入 plugin。可鏈式呼叫。必須在 init() 之前呼叫。

```typescript
i18next
  .use(LanguageDetector)   // 語言偵測 plugin
  .use(initReactI18next)   // React 整合 plugin
  .use(Backend)            // 後端資源載入 plugin
  .init(options)
```

### i18next.init(options, callback?)

```typescript
// 簽名
init(options: InitOptions, callback?: (err: any, t: TFunction) => void): Promise<TFunction>
```

初始化 i18next。返回 Promise，resolve 值為 t 函式。

```typescript
// Promise 模式
const t = await i18next.init({ ... })

// Callback 模式
i18next.init({ ... }, (err, t) => {
  if (err) return console.error(err)
  t('key')
})
```

---

## 翻譯方法

### i18next.t(key, options?)

主要翻譯函式。

```typescript
// 基本
i18next.t('key')

// 插值
i18next.t('key', { name: 'Alice', count: 3 })

// namespace
i18next.t('ns:key')
i18next.t('key', { ns: 'myNamespace' })

// 預設值
i18next.t('key', { defaultValue: 'fallback text' })
i18next.t('key', 'fallback text')    // 簡短語法

// 複數
i18next.t('item', { count: 1 })   // -> item_one
i18next.t('item', { count: 5 })   // -> item_other

// Context
i18next.t('friend', { context: 'male' })  // -> friend_male

// 返回物件
i18next.t('section', { returnObjects: true })

// 陣列 fallback
i18next.t(['specific', 'generic'])  // 嘗試 specific，找不到才用 generic

// 返回詳細資訊
i18next.t('key', { returnDetails: true })
// { res: 'translation', usedKey: 'key', usedLng: 'en', usedNS: 'translation' }
```

### i18next.getFixedT(lng?, ns?, keyPrefix?)

```typescript
// 簽名
getFixedT(lng: string | null, ns: string | null, keyPrefix?: string): TFunction
```

返回綁定了預設 language/namespace/keyPrefix 的 t 函式。

```typescript
// 固定語言
const tDe = i18next.getFixedT('de')
tDe('key')  // 永遠返回德文翻譯

// 固定 namespace
const tCommon = i18next.getFixedT(null, 'common')
tCommon('button.save')

// 固定 keyPrefix
const tUser = i18next.getFixedT(null, null, 'user')
tUser('name')  // 等於 t('user.name')
```

### i18next.exists(key, options?)

```typescript
// 簽名
exists(key: string | string[], options?: TOptions): boolean
```

```typescript
i18next.exists('key')  // true / false
i18next.exists('ns:key')
i18next.exists('key', { lng: 'de' })
```

---

## 語言管理

### i18next.changeLanguage(lng?, callback?)

```typescript
// 簽名
changeLanguage(lng?: string, callback?: Function): Promise<TFunction>
```

切換當前語言。不傳 lng 則重新執行 LanguageDetector。

```typescript
await i18next.changeLanguage('zh-TW')

i18next.changeLanguage('en', (err, t) => {
  if (err) return console.error(err)
  t('key')
})

// 重新偵測語言
i18next.changeLanguage()
```

### i18next.language

```typescript
i18next.language: string  // 當前活躍的語言代碼，如 'zh-TW'
```

### i18next.languages

```typescript
i18next.languages: string[]  // 翻譯查找鏈，如 ['zh-TW', 'zh', 'en']
```

包含主語言、less-specific 變體、fallback。

### i18next.loadLanguages(lngs, callback?)

```typescript
// 簽名
loadLanguages(lngs: string | string[], callback?: Function): Promise<void>
```

按需載入額外語言（需要 backend plugin）。

### i18next.dir(lng?)

```typescript
// 簽名
dir(lng?: string): 'ltr' | 'rtl'
```

```typescript
i18next.dir()        // 當前語言的文字方向
i18next.dir('ar')    // 'rtl'
i18next.dir('en')    // 'ltr'
```

---

## Namespace 與資源載入

### i18next.loadNamespaces(ns, callback?)

```typescript
// 簽名
loadNamespaces(ns: string | string[], callback?: Function): Promise<void>
```

按需載入額外 namespace（需要 backend plugin）。

```typescript
await i18next.loadNamespaces(['common', 'admin'])
```

### i18next.setDefaultNamespace(ns)

動態更改預設 namespace。

### i18next.hasLoadedNamespace(ns, options?)

```typescript
// 簽名
hasLoadedNamespace(ns: string, options?: object): boolean
```

### i18next.reloadResources(lngs?, ns?, callback?)

重新從 backend 載入資源。

```typescript
await i18next.reloadResources()                       // 全部重載
await i18next.reloadResources(['en', 'zh-TW'])       // 指定語言
await i18next.reloadResources(null, 'common')         // 指定 namespace
await i18next.reloadResources(['en'], ['common'])     // 指定語言 + namespace
```

---

## 資源管理

### i18next.addResourceBundle(lng, ns, resources, deep?, overwrite?)

```typescript
// 簽名
addResourceBundle(
  lng: string,
  ns: string,
  resources: object,
  deep?: boolean,     // 深度合併（預設 false）
  overwrite?: boolean // 覆蓋現有（預設 false）
): i18next
```

```typescript
i18next.addResourceBundle('en', 'common', {
  button: { save: 'Save', cancel: 'Cancel' }
}, true, true)
```

### i18next.addResource(lng, ns, key, value, options?)

動態新增單一翻譯。

```typescript
i18next.addResource('en', 'translation', 'newKey', 'New translation')
```

### i18next.addResources(lng, ns, resources)

動態新增多個翻譯。

```typescript
i18next.addResources('en', 'translation', {
  'key1': 'Translation 1',
  'key2': 'Translation 2',
})
```

### i18next.removeResourceBundle(lng, ns)

移除整個 namespace bundle。

### i18next.hasResourceBundle(lng, ns)

```typescript
// 簽名
hasResourceBundle(lng: string, ns: string): boolean
```

### i18next.getResourceBundle(lng, ns)

返回完整 namespace 的翻譯物件。

### i18next.getResource(lng, ns, key, options?)

取得單一翻譯值。

```typescript
i18next.getResource('en', 'translation', 'greeting')
```

### i18next.getDataByLanguage(lng)

返回指定語言的所有翻譯資料。

---

## 事件系統

### i18next.on(event, callback) / i18next.off(event, callback)

支援的事件：

| 事件名 | 觸發時機 | Callback 參數 |
|--------|---------|--------------|
| initialized | init() 完成 | (options) |
| languageChanged | 語言切換完成 | (lng) |
| loaded | 資源載入完成 | (loaded) |
| failedLoading | 資源載入失敗 | (lng, ns, msg) |
| missingKey | 找不到翻譯 key | (lngs, namespace, key, res) |

Store 事件（透過 i18next.store.on()）：

| 事件名 | 觸發時機 |
|--------|---------|
| added | 新增 resource bundle |
| removed | 移除 resource bundle |

```typescript
i18next.on('languageChanged', (lng: string) => {
  document.documentElement.lang = lng
  document.documentElement.dir = i18next.dir(lng)
})

i18next.on('missingKey', (lngs, ns, key) => {
  console.warn(`Missing key: ${ns}:${key}`)
})

// 移除監聽
const handler = (lng: string) => { /* ... */ }
i18next.on('languageChanged', handler)
i18next.off('languageChanged', handler)
```

---

## 實例管理

### i18next.createInstance(options?, callback?)

建立獨立的新 i18next 實例（不共享 store 和 plugins）。

```typescript
const myI18n = i18next.createInstance()
await myI18n.use(initReactI18next).init({
  resources: { en: { translation: { /* ... */ } } },
  lng: 'en',
})
```

### i18next.cloneInstance(options?)

克隆當前實例（共享 store 和 plugins）。

```typescript
const cloned = i18next.cloneInstance()
const forked = i18next.cloneInstance({ forkResourceStore: true }) // 獨立 resource store
```

### i18next.isInitialized

```typescript
i18next.isInitialized: boolean  // 實例是否已初始化完成
```

### i18next.isInitializedResolve（v25+）

```typescript
i18next.isInitializedResolve: Promise<TFunction>
```

等待初始化完成的 Promise，在 init() 之前就可以 await。

```typescript
const t = await i18next.isInitializedResolve
t('key')
```
