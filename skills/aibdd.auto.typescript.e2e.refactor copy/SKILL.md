---
name: aibdd.auto.typescript.e2e.refactor
description: TypeScript E2E Stage 5：重構階段。在測試保護下改善程式碼品質，小步前進，嚴格遵守 /aibdd.auto.typescript.code-quality 規範。可被 /typescript-e2e 調用，也可獨立使用。
user-invocable: true
argument-hint: "[feature-file]"
input: tests/steps/**/*.ts, src/components/**/*.tsx, src/pages/**/*.tsx, src/hooks/**/*.ts
output: 重構後的程式碼（測試持續通過）
---

# 角色

TDD 重構者。在保持測試通過（綠燈）的前提下，改善程式碼品質。

---

# 入口條件

## 被 /typescript-e2e 調用

接收目標程式碼路徑，確認目前是綠燈後進入重構流程。

## 獨立使用

1. 詢問目標範圍（Feature 相關的程式碼）
2. 執行 `npx cucumber-js --tags "not @ignore"` 確認目前是綠燈
3. 進入重構流程

---

# 重構流程

```
1. 執行測試，確認目前是綠燈
   → npx cucumber-js --tags "not @ignore"
2. 識別一個小的重構點
3. 執行重構
4. 執行測試，確認仍是綠燈
   → npx cucumber-js --tags "not @ignore"
5. 若失敗，立即回滾
6. 重複步驟 2-5
```

---

# 核心原則

## 1. 測試保護原則

每次重構後立即執行測試，確保全部通過。若失敗則立即回滾。

**測試指令**：
```bash
npx cucumber-js --tags "not @ignore"
```

## 2. 小步前進原則

一次只做一個小重構，避免一次改動過多。

**重構粒度範例**：
- 提取一個共用函式
- 重命名一個變數或函式
- 消除一個重複片段
- 將 magic string 提取為常數
- 提取自訂 hook

## 3. 不強行重構原則

只在真正有改善空間時才重構。程式碼已清晰簡潔時保持原樣。

## 4. 清除測試 Warnings

盡可能清除所有測試 warnings，保持測試輸出乾淨。

---

# 遵守規範

重構時**嚴格遵守** /aibdd.auto.typescript.code-quality 的每一條規範（RE-LOAD SKILL /aibdd.auto.typescript.code-quality）：

- SOLID 設計原則
- Step Definition 組織規範
- StepDef Meta 註記清理規範
- 日誌實踐規範
- 程式架構規範
- 程式碼品質規範

---

# 重構檢查清單

## 流程
- [ ] 重構前測試是綠燈
- [ ] 每次小重構後執行測試
- [ ] 重構後測試仍是綠燈
- [ ] 所有測試 warnings 已清除

## 規範遵守
- [ ] 嚴格遵守 /aibdd.auto.typescript.code-quality 的每一條規範

## 常見重構方向

### Step Definition 層
- 提取共用的 Given 步驟到共用模組
- 統一 Custom World 的使用模式
- 消除重複的 status mapping 邏輯
- 改善 DataTable 解析的可讀性
- 提取共用的 getUserId helper

### React 元件層
- 提取共用元件
- 使用自訂 hook 封裝邏輯
- 消除重複的 JSX 結構
- 優化 props 介面

### API Client 層
- 統一錯誤處理模式
- 使用 Zod schema 驗證回應
- 提取共用的 fetch wrapper

### MSW / Test Support 層
- 統一 fixture 格式
- 提取共用的 handler factory
- 優化 spy 驗證邏輯

---

# 完成條件

- 所有識別的重構點已處理（或確認無需重構）
- `npx cucumber-js --tags "not @ignore"` 所有測試通過
- 所有測試 warnings 已清除
- 程式碼符合 /aibdd.auto.typescript.code-quality 的所有規範
