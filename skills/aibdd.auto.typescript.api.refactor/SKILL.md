---
name: aibdd.auto.typescript.api.refactor
description: TypeScript API Stage 4：重構階段。在測試保護下改善程式碼品質，小步前進，嚴格遵守 /aibdd.auto.typescript.api.code-quality 規範。可被 /aibdd.auto.typescript.api.control-flow 調用，也可獨立使用。
user-invocable: true
argument-hint: "[feature-file]"
input: server/src/__tests__/{domain}.integration.test.ts, server/src/routes/{domain}.ts, server/src/services/{domain}.ts
output: 重構後的程式碼（測試持續通過）
---

# 角色

TDD 重構者。在保持測試通過（綠燈）的前提下，改善程式碼品質。

---

# 入口條件

## 被 /aibdd.auto.typescript.api.control-flow 調用

接收目標程式碼路徑，確認目前是綠燈後進入重構流程。

## 獨立使用

1. 詢問目標範圍（Feature 相關的程式碼）
2. 執行 `pnpm vitest run server/src/__tests__/*.integration.test.ts` 確認目前是綠燈
3. 進入重構流程

---

# 重構流程

```
1. 執行測試，確認目前是綠燈
   → pnpm vitest run server/src/__tests__/*.integration.test.ts
2. 識別一個小的重構點
3. 執行重構
4. 執行測試，確認仍是綠燈
   → pnpm vitest run server/src/__tests__/*.integration.test.ts
5. 若失敗，立即回滾
6. 重複步驟 2-5
```

---

# 核心原則

## 1. 測試保護原則

每次重構後立即執行測試，確保全部通過。若失敗則立即回滾。

**測試指令**：
```bash
pnpm vitest run server/src/__tests__/*.integration.test.ts
```

## 2. 小步前進原則

一次只做一個小重構，避免一次改動過多。

**重構粒度範例**：
- 提取一個共用函式
- 重命名一個變數或函式
- 消除一個重複片段
- 將 magic string 提取為常數
- 提取 Service 中的共用邏輯
- 統一錯誤處理模式

## 3. 不強行重構原則

只在真正有改善空間時才重構。程式碼已清晰簡潔時保持原樣。

## 4. 清除測試 Warnings

盡可能清除所有測試 warnings，保持測試輸出乾淨。

---

# 遵守規範

重構時**嚴格遵守** /aibdd.auto.typescript.api.code-quality 的每一條規範（RE-LOAD SKILL /aibdd.auto.typescript.api.code-quality）：

- 三層架構規範（Route → Service → DB）
- SOLID 設計原則
- Company Scoping 規範
- Error Handling 規範
- 命名與型別規範
- 測試程式碼品質規範

---

# 重構檢查清單

## 流程
- [ ] 重構前測試是綠燈
- [ ] 每次小重構後執行測試
- [ ] 重構後測試仍是綠燈
- [ ] 所有測試 warnings 已清除

## 規範遵守
- [ ] 嚴格遵守 /aibdd.auto.typescript.api.code-quality 的每一條規範

## 常見重構方向

### Route Handler 層
- 提取共用的參數解析邏輯
- 統一 response 格式
- 使用 validation middleware（Zod）
- 移除重複的 actor 檢查

### Service 層
- 提取共用的查詢邏輯
- 統一錯誤拋出模式
- 消除重複的 company scoping 檢查
- 提取共用的 authorization 邏輯

### DB / Repository 層
- 提取共用的 query builder 片段
- 統一 `.returning()` 的使用模式

### 測試程式碼
- 提取共用的 Factory 方法
- 統一測試 setup/teardown
- 消除重複的 assertion 模式
- 提取共用的 helper functions

---

# 完成條件

- 所有識別的重構點已處理（或確認無需重構）
- `pnpm vitest run server/src/__tests__/*.integration.test.ts` 所有測試通過
- 所有測試 warnings 已清除
- 程式碼符合 /aibdd.auto.typescript.api.code-quality 的所有規範
