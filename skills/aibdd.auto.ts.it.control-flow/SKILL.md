---
name: aibdd.auto.ts.it.control-flow
description: >
  React IT 全自動批次迴圈。掃描 features 目錄，為每個 .feature 展開完整的
  5 phase TODO 清單（schema-analysis → step-template → red → green → refactor），
  然後逐一執行直到全數完成。當使用者說「control-flow」「批次執行」時觸發。
---

# React IT 全自動批次執行器

掃描 feature 檔案 → 建立 TodoWrite 任務清單 → 逐一執行 5 phase。

---

## Step 0：環境前置檢查

驗證前端專案是否已初始化：
- `package.json` 含 vitest, @testing-library/react, msw
- `vitest.config.ts` 存在
- `src/test/setup.ts` 存在

**不存在** → 詢問使用者「偵測到尚未建立 React IT 測試基礎建設，是否先執行 `/zenbu-powers:aibdd.auto.ts.it.starter`？」→ 使用者確認後觸發，完成後再繼續。

**存在** → 直接進入 Step 1。

---

## Step 1：掃描 Feature 檔案

讀取 `${FRONTEND_FEATURES_DIR}`（通常是 `specs/features/` 或 `frontend/specs/features/`），找出所有 `.feature` 檔案。

### 排序策略

**若 `${FRONTEND_FEATURES_DIR}` 下存在 `句型.md`**，讀取其中的「覆蓋矩陣」或「操作清單」，以該文件列出的操作順序作為 feature 排序依據。此順序通常反映業務流程的依賴關係（核心功能 → 延伸功能）。

**若無 `句型.md`**，依以下啟發規則排序：
1. 掃描每個 feature 的 Background / Given 步驟，識別前置依賴
2. 無前置依賴的排最前，依賴最多的排最後
3. 同等依賴數量時，command（寫入）優先於 query（讀取）

**排序結果展示給使用者確認後再建立任務清單。**

---

## Step 2：建立 TodoWrite 任務清單

對每個 feature 檔案，建立 **5 個任務**：

```
TodoWrite([
  { content: "{feature} — Schema Analysis", status: "pending" },
  { content: "{feature} — Step Template",   status: "pending" },
  { content: "{feature} — Red",             status: "pending" },
  { content: "{feature} — Green",           status: "pending" },
  { content: "{feature} — Refactor",        status: "pending" },
  ...
])
```

---

## Step 3：逐一執行

```
標記 → in_progress
    ↓
使用 Skill 工具呼叫對應 skill（帶入 feature file 路徑作為 args）
    ↓
標記 → completed
    ↓
前進到下一個 pending
```

### Skill 對照表

| 任務 phase | 呼叫的 Skill |
|-----------|-------------|
| Schema Analysis | `/zenbu-powers:aibdd.auto.ts.it.schema-analysis` |
| Step Template | `/zenbu-powers:aibdd.auto.ts.it.step-template` |
| Red | `/zenbu-powers:aibdd.auto.ts.it.red` |
| Green | `/zenbu-powers:aibdd.auto.ts.it.green` |
| Refactor | `/zenbu-powers:aibdd.auto.ts.it.refactor` |

**注意**：Red skill 內部已包含 Schema Analysis 和 Step Template 的委派調用，但 control-flow 將它們顯式拆為 5 個 phase，以便在中途可暫停和觀察進度。

---

## Step 4：最終回歸測試

所有任務 completed 後，執行完整回歸測試：

```bash
npx vitest run
```

- 通過 → 全部完成
- 失敗 → 閱讀錯誤、修正、重新執行

---

## 變體路由

此 skill 是 TypeScript + IT 變體，對應 `arguments.yml`：

```yaml
tech_stack: typescript
test_strategy: it
```

若統一核心 `/zenbu-powers:aibdd-auto-control-flow` 被觸發且讀到上述設定，會委派到本 skill。

| tech_stack | test_strategy | 測試命令 | phase 數 |
|-----------|---------------|---------|----------|
| typescript | it | `npx vitest run` | 5（含 schema-analysis + step-template） |

---

## 規則

1. **不要停下來問問題。** 遇到問題自己修正。
2. **不要跳過任何任務。** 每個 feature 的 5 phase 都必須完成。
3. **一次只有一個 in_progress。**
4. **Skill 是 lazy loading。** 每次呼叫都完整載入該 phase 規則，不受 compaction 影響。
5. **測試保護下推進。** Red 階段必須看到失敗，Green 階段必須看到通過，Refactor 階段測試保持綠燈。

---

## 完成條件

- [ ] 所有 feature 的 5 phase 都 completed
- [ ] `npx vitest run` 回歸測試全數通過
- [ ] `npx tsc --noEmit` 型別檢查通過
- [ ] 無殘留 TODO 註解
