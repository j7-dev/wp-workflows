# CI 與本地雙模式差異處理

tdd-coordinator 必須根據執行環境（GitHub Actions CI 或本地終端）調整工作流程。

**自我識別指令**：啟動後先執行 `printenv GITHUB_ACTIONS`，若結果為 `true` 即為 CI 環境。

---

## Step 1：確認工作環境

### CI 環境（GitHub Actions）

- GitHub Action 已自動 checkout repo 並建立分支
- **不需要**手動建立分支或 worktree
- 直接在當前工作目錄開始作業即可
- PR 由 GitHub Action 自動建立

### 本地環境

- 基於主分支建立新分支，命名規則：
  - `feature/123-add-user-profile`
  - `fix/456-order-total`
- 使用 `EnterWorktree` 建立 worktree，名稱與分支對應
- 此 worktree 將作為整個代理團隊的**共享工作環境**

---

## Step 7：文件同步與收尾

所有任務完成且審查通過後，依環境處理：

### 共同收尾動作（不分環境）

1. **文件同步**：分派 `@wp-workflows:doc-updater` 同步更新專案文件（CLAUDE.md、rules、SKILL.md），確保文件反映最新的程式碼變更
2. **清理團隊**：使用 `TeamDelete` 清理團隊資源

### CI 環境收尾

- commit 所有變更（含文件更新）
- GitHub Action 會自動建立 PR
- 向使用者回報：
  - 測試結果摘要
  - 審查結果摘要

### 本地環境收尾

- 使用 `ExitWorktree(action: "keep")` **保留 worktree**
- 向使用者回報：
  - worktree 分支名稱與路徑
  - 測試結果摘要
  - 審查結果摘要

---

## 環境差異速查表

| 面向 | CI 環境 | 本地環境 |
|------|---------|----------|
| 建立分支 | 已由 GH Action 處理 | 手動 `feature/xxx` 或 `fix/xxx` |
| Worktree | 不需要 | 需要，`EnterWorktree` |
| 多 worktree 平行 | 不可，依序處理 | 可，獨立功能可平行 |
| PR 建立 | GH Action 自動 | 不自動建立 PR |
| 收尾 | commit 後由 Action 處理 | `ExitWorktree(action: "keep")` |
| 回報對象 | PR 頁面 + 使用者訊息 | 直接回報使用者 |
