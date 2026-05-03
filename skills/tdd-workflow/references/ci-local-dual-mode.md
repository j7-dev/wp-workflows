# CI 與本地雙模式差異處理

tdd-coordinator 必須根據執行環境（GitHub Actions CI 或本地終端）調整工作流程。

**自我識別指令**：啟動後先執行 `printenv GITHUB_ACTIONS`，若結果為 `true` 即為 CI 環境。

---

## Step 1：確認工作環境

### CI 環境（GitHub Actions）

- GitHub Action 已自動 checkout repo 並建立分支
- **不需要**手動建立分支
- 直接在當前工作目錄開始作業即可
- PR 由 GitHub Action 自動建立

### 本地環境

- 基於主分支建立新分支，命名規則：
  - `feature/123-add-user-profile`
  - `fix/456-order-total`
- 預設直接在當前工作目錄切換到新分支（`git switch -c feature/xxx`）即可工作
- 多個下游 sub-agent（test-creator / *-master / *-reviewer）共享當前工作目錄

> **進階模式（opt-in）**：若使用者明確要求 worktree 隔離——例如多功能平行開發、保護主工作目錄不被污染、保留實驗性變更——可改用 `EnterWorktree`。詳見 [team-and-worktree.md](team-and-worktree.md)。預設不主動使用。

---

## Step 7：文件同步與收尾

所有任務完成且審查通過後，依環境處理：

### 共同收尾動作（不分環境）

1. **文件同步**：分派 `@zenbu-powers:doc-updater` 同步更新專案文件（CLAUDE.md、rules、SKILL.md），確保文件反映最新的程式碼變更

### CI 環境收尾

- commit 所有變更（含文件更新）
- GitHub Action 會自動建立 PR
- 向使用者回報：
  - 測試結果摘要
  - 審查結果摘要

### 本地環境收尾

- **保留分支**讓使用者驗收（不自動 merge、不刪分支）
- 向使用者回報：
  - 分支名稱
  - 測試結果摘要
  - 審查結果摘要
- 後續分支處置（merge / PR / 棄用）由使用者透過 `/zenbu-powers:finishing-branch` 或手動操作

> **進階模式（opt-in）**：若有使用 worktree，改用 `ExitWorktree(action: "keep")` 保留 worktree。詳見 [team-and-worktree.md](team-and-worktree.md)。

---

## 環境差異速查表

| 面向 | CI 環境 | 本地環境（預設） |
|------|---------|----------------|
| 建立分支 | 已由 GH Action 處理 | 手動 `git switch -c feature/xxx` 或 `fix/xxx` |
| Worktree | 不需要 | opt-in（預設不使用，使用者明確要求才啟用） |
| PR 建立 | GH Action 自動 | 不自動建立 PR |
| 收尾 | commit 後由 Action 處理 | 保留分支等使用者驗收 |
| 回報對象 | PR 頁面 + 使用者訊息 | 直接回報使用者 |
