---
name: aibdd.auto.typescript.api.control-flow
description: TypeScript API 全自動批次迴圈。掃描 features 目錄，為每個 .feature 展開完整的 4 phase TODO 清單（test-skeleton → red → green → refactor），然後逐一執行直到全數完成。
user-invocable: true
argument-hint: "[features-dir]"
input: features 目錄路徑（含所有 .feature 檔案）
output: 每個 feature 完成完整 API TDD 循環
---

# 指令

你是全自動 BDD API 測試批次執行器。你的工作是：
1. 掃描 feature 檔案
2. 用 TodoWrite 建立完整的任務清單
3. 逐一執行每個任務直到全部完成
4. 不要停下來、不要問問題、不要等待指示

---

# Step 1：掃描 Feature 檔案

讀取以下目錄，找出所有 `.feature` 檔案：

```
${FEATURES_DIR}
```

按檔名排序，記錄完整路徑。

---

# Step 2：用 TodoWrite 建立任務清單

對每個 feature 檔案，建立 4 個 TodoWrite 任務。

格式規則：
- `content`：`{feature 檔名} — {phase 名稱}`
- `activeForm`：`{phase 動詞}：{feature 檔名}`
- `status`：全部設為 `pending`

範例：

```
content: "01-issue-checkout.feature — Test Skeleton"
activeForm: "生成 Test Skeleton：01-issue-checkout.feature"
status: pending

content: "01-issue-checkout.feature — Red"
activeForm: "執行紅燈：01-issue-checkout.feature"
status: pending

content: "01-issue-checkout.feature — Green"
activeForm: "執行綠燈：01-issue-checkout.feature"
status: pending

content: "01-issue-checkout.feature — Refactor"
activeForm: "執行重構：01-issue-checkout.feature"
status: pending
```

---

# Step 3：逐一執行每個任務

## 任務與 Skill 對照表

| 任務 phase | 呼叫的 Skill |
|-----------|-------------|
| Test Skeleton | `/aibdd.auto.typescript.api.test-skeleton` |
| Red | `/aibdd.auto.typescript.api.red` |
| Green | `/aibdd.auto.typescript.api.green` |
| Refactor | `/aibdd.auto.typescript.api.refactor` |

---

# Step 4：最終回歸測試

```bash
pnpm vitest run server/src/__tests__/*.integration.test.ts
```

- 通過 → 全部完成
- 失敗 → 閱讀錯誤、修正、重新執行，直到全部通過

---

# 全自動規則

1. **不要停下來問問題**。遇到問題就自己修正。
2. **不要跳過任何任務**。每個任務都必須完成。
3. **每個 Skill 完成後立即標記 completed**，然後前進到下一個。
4. **一次只有一個任務是 in_progress**。
5. **Skill 是 lazy loading**：每次呼叫都會完整載入該 phase 的規則。

---

# 為什麼用 TodoWrite + Skill 工具

| 機制 | 解決的問題 |
|-----|----------|
| TodoWrite | 任務進度跨 compaction 持久化 |
| Skill 工具 | 每次呼叫都完整載入指令 |
| 逐一執行 | 減少 context 壓力 |
