---
name: aibdd.auto.csharp.it.control-flow
description: >
  C# IT 全自動批次迴圈。掃描 features 目錄，為每個 .feature 展開 5 phase TODO 清單
  （schema-analysis → step-template → red → green → refactor），逐一執行直到全數完成。
  當使用者說「control-flow」「批次執行」時觸發。
---

# C# IT 全自動批次執行器

掃描 feature 檔案 → 建立 TodoWrite 任務清單 → 逐一執行每個 feature 的 5 phases。

## Step 0：環境前置檢查

驗證 C# IT 骨架是否存在：
- `*.sln` 存在
- `src/${ProjectName}/${ProjectName}.csproj` 存在
- `tests/${ProjectName}.IntegrationTests/${ProjectName}.IntegrationTests.csproj` 存在
- `tests/${ProjectName}.IntegrationTests/CustomWebApplicationFactory.cs` 存在
- `tests/${ProjectName}.IntegrationTests/Hooks/TestHooks.cs` 存在
- Docker Desktop 運行中（`docker info`）

**不存在** → 詢問使用者「偵測到尚未建立 C# IT 骨架，是否先執行 `/aibdd.auto.csharp.it.starter`？」→ 使用者確認後觸發 starter，完成後繼續。

**存在** → 進入 Step 1。

---

## Step 1：掃描 Feature 檔案

讀取 `${FEATURE_SPECS_DIR}`，找出所有 `.feature` 檔案。

### 排序策略

**若 `${FEATURE_SPECS_DIR}` 下存在 `句型.md`**，讀取其「覆蓋矩陣」或「操作清單」，以該文件的操作順序作為 feature 排序依據。此順序反映業務流程依賴（核心 → 延伸）。

**若無 `句型.md`**，啟發規則：
1. 掃描每個 feature 的 Background / Given 步驟，識別前置依賴
2. 無依賴排最前，依賴最多排最後
3. 同等依賴：command 優先於 query

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
Mark → in_progress
    ↓
Skill tool 呼叫對應 skill（帶入 feature file 路徑）
    ↓
Mark → completed
    ↓
前進到下一個 pending
```

### Skill 路由表

| Phase | 呼叫的 Skill |
|-------|-------------|
| Schema Analysis | `/aibdd.auto.csharp.it.schema-analysis` |
| Step Template | `/aibdd.auto.csharp.it.step-template` |
| Red | `/aibdd.auto.csharp.it.red` |
| Green | `/aibdd.auto.csharp.it.green` |
| Refactor | `/aibdd.auto.csharp.it.refactor` |

每個 skill 自我包含（self-contained），不需要額外路由。

---

## Step 4：最終回歸測試

所有任務 completed 後執行：

```bash
dotnet test --filter "Category!=Ignore"
```

- 通過 → 全部完成 🎉
- 失敗 → 閱讀錯誤、修正、重跑

---

## 規則

1. **不要停下來問問題。** 遇到問題自己修正。
2. **不要跳過任何任務。** 每個 feature 的 5 phase 都必須完成。
3. **一次只有一個 in_progress。**
4. **Skill 是 lazy loading。** 每次呼叫都完整載入該 phase 規則，不受 compaction 影響。
5. **順序嚴格：** schema-analysis → step-template → red → green → refactor，不可跳過。

---

## 測試命令總覽

```bash
# 特定 feature（開發迭代用）
dotnet test --filter "FullyQualifiedName~LessonProgress"

# 特定 scenario（最快）
dotnet test --filter "DisplayName~更新課程進度"

# 全部非 @ignore（回歸測試）
dotnet test --filter "Category!=Ignore"

# 全部（含 ignore）
dotnet test
```

## 完成條件

- [ ] 所有 feature 的 5 phases 都 completed
- [ ] 最終回歸測試 `dotnet test --filter "Category!=Ignore"` 全綠
- [ ] 沒有遺留 PendingStepException / NotImplementedException
- [ ] `dotnet build -warnaserror` 無警告（可選）
