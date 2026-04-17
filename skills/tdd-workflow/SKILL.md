---
name: tdd-workflow
description: TDD 執行協調 playbook（Red→Green→Refactor 循環 / Issue 拆分 / Team & Worktree 管理 / CI 與本地雙模式），供 tdd-coordinator agent 執行 TDD 流程協調時載入。
---

# TDD 執行協調 Playbook

這份 Skill 定義 **tdd-coordinator** 在接到 planner 計劃後的完整執行流程。

**核心原則**：沒有測試就沒有開發。任何實作任務在測試產生並驗證為 Red 狀態之前，絕對不得分派給開發 Agent。

## 執行總覽（7 步驟，不得跳過）

| 步驟 | 階段 | 動作 | 詳見 |
|------|------|------|------|
| 1 | 準備 | 確認工作環境（CI / 本地） | [ci-local-dual-mode.md](references/ci-local-dual-mode.md) |
| 2 | Red | 分派 `@wp-workflows:test-creator` 產生測試骨架 | [red-green-refactor-cycle.md](references/red-green-refactor-cycle.md) |
| 3 | Red Gate | 驗證測試存在且全部失敗 | [red-green-refactor-cycle.md](references/red-green-refactor-cycle.md) |
| 4 | Green | 建立代理團隊，分派實作任務 | [team-and-worktree.md](references/team-and-worktree.md) |
| 5 | Green Gate | 驗證測試全部通過 | [red-green-refactor-cycle.md](references/red-green-refactor-cycle.md) |
| 6 | Refactor | 分派 Reviewer 審查 | [red-green-refactor-cycle.md](references/red-green-refactor-cycle.md) |
| 7 | 收尾 | 文件同步、清理團隊、回報 | [ci-local-dual-mode.md](references/ci-local-dual-mode.md) |

## 參考文件索引

- [red-green-refactor-cycle.md](references/red-green-refactor-cycle.md)
  Red / Green / Refactor 三階段的詳細執行規則、Gate 驗證條件、重試策略、失敗處理表。

- [issue-splitting.md](references/issue-splitting.md)
  Issue 拆分準則（8 條）、Sub-Issue Body 範本、代理團隊路由規則。

- [team-and-worktree.md](references/team-and-worktree.md)
  Team 建立、Worktree 共享規則、Task List 依賴管理、併發衝突避免。

- [ci-local-dual-mode.md](references/ci-local-dual-mode.md)
  CI（GitHub Actions）與本地環境的差異處理（分支、worktree、PR、收尾）。

## 載入時機

- tdd-coordinator agent 啟動時自動載入（`enable_by_default: true`）
- 執行到特定階段時，優先 Read 對應的 reference 檔案取得細節規則
