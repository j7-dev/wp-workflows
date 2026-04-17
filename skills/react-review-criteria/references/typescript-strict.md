# TypeScript 型別、安全性、命名與 import 路徑審查項

對應主 SKILL.md 的類別一、二、四、八。

---

## 類別一：TypeScript 型別安全（對照 `react-coding-standards`）

- [ ] **禁止使用 `any`**，需用明確型別或 `unknown`（🔴）
- [ ] `tsconfig.json` 是否啟用 `strict: true`（`noImplicitAny`、`strictNullChecks`、`noUnusedLocals`）（🟠）
- [ ] 型別是否以 `T` 前綴命名（如 `TProduct`、`TProductProps`）（🟡）
- [ ] Enum 是否以 `E` 前綴命名（如 `EProductType`）（🟡）
- [ ] 有限狀態是否使用 `as const` + union type 或 enum，**禁止 magic string**（🟠）
- [ ] 函式返回型別是否明確標註（匯出函式必須標註）（🟠）
- [ ] 非空斷言 `!` 是否有說明注解（🟡）
- [ ] **測試 Mock 型別轉換**：mock 複雜介面（`UseQueryResult`、`UseMutationResult` 等）時，是否使用 `as unknown as Type` 雙重轉型？直接 `as Type` 在 strict mode 下會報 TS2352（🟠）

### Before / After：Mock 型別轉換

```tsx
// 誤用：strict mode 下報 TS2352
const mockResult = { data: [], isLoading: false } as UseQueryResult<TProduct[]>

// 正確：雙重轉型
const mockResult = { data: [], isLoading: false } as unknown as UseQueryResult<TProduct[]>
```

---

## 類別二：安全性

- [ ] **`dangerouslySetInnerHTML`** 是否使用未經消毒的內容（需搭配 DOMPurify）（🔴）
- [ ] **Client-side 是否暴露 API 金鑰或機密**（🔴）
- [ ] **使用者可控 ID** 是否未經授權驗證就直接操作資源（🔴）
- [ ] WordPress nonce 是否正確傳遞，防止 CSRF（🟠）
- [ ] **LLM 信任邊界**：AI 生成內容是否經 `DOMPurify.sanitize()` 再渲染（禁止直接 `dangerouslySetInnerHTML`）（🔴）
- [ ] **Prompt Injection**：使用者輸入流向 LLM API 時是否與系統指令隔離（🟠）

### Before / After：LLM 輸出消毒

```tsx
// 誤用
<div dangerouslySetInnerHTML={{ __html: llmResponse }} />

// 正確
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(llmResponse) }} />
```

---

## 類別四：命名規範

- [ ] 元件：PascalCase（如 `ProductTable`）（🟡）
- [ ] Hook：camelCase + `use` 前綴（如 `useProducts`）（🟠）
- [ ] 型別：PascalCase + `T` 前綴（如 `TProduct`）（🟡）
- [ ] Enum：PascalCase + `E` 前綴（如 `EProductType`）（🟡）
- [ ] 常數：UPPER_SNAKE_CASE（如 `ORDER_STATUS`）（🟡）
- [ ] 函式：動詞-名詞 camelCase（如 `handleDelete`、`fetchProducts`）（🟡）

---

## 類別八：import 路徑

- [ ] 是否使用 `@/` 路徑別名，禁止 `../../../` 深度相對路徑（🟡）
- [ ] import 是否依類型分組：React / 第三方 → 內部模組（🟡）
- [ ] 是否有未使用的 import（🟡）
- [ ] lodash 是否使用具名 import（禁止 `import _ from 'lodash'`）（🟠）
- [ ] **循環依賴**：`atom.tsx` 是否從元件的 barrel export（`index.tsx`）import 常量 / 預設值？若該元件反向 import 了 atom，則形成循環依賴，導致 `ReferenceError: Cannot access 'xxx' before initialization`（🔴）

### 循環依賴偵測

**檢查模式**：`atom.tsx` → `Component/index.tsx` → `atom.tsx`（temporal dead zone）

**修復方式**：將常量/預設值移至 `types.ts` 或 `constants.ts`，atom 檔案只 import 純型別/常量檔案。

**真實案例**：`atom.tsx` 從 `HistoryDrawer/index.tsx` import `defaultHistoryDrawerProps`，而 `HistoryDrawer/index.tsx` 又 import `historyDrawerAtom`，造成頁面白屏。

### Before / After：打破循環

```tsx
// 誤用：atom.tsx
import { defaultHistoryDrawerProps } from './HistoryDrawer'   // 循環！

// 正確：抽到 constants.ts
// constants.ts
export const defaultHistoryDrawerProps: TDrawerProps = { ... }

// atom.tsx
import { defaultHistoryDrawerProps } from './constants'

// HistoryDrawer/index.tsx
import { historyDrawerAtom } from './atom'
import { defaultHistoryDrawerProps } from './constants'
```

### Before / After：lodash import

```tsx
// 誤用：整包引入
import _ from 'lodash'
_.debounce(...)

// 正確：具名引入
import { debounce } from 'lodash-es'
debounce(...)
```
