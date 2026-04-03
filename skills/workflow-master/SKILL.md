---
name: workflow-master
description: >
  GitHub Actions workflow 除錯、審計與優化的完整工作流程。
  涵蓋系統性診斷決策樹、act 本地驗證模式、gh CLI 線上診斷命令、
  以及常見 workflow 反模式與修正方案。
  當 workflow-master agent 執行除錯、審計或優化任務時載入此 skill。
---

# Workflow Master Skill

## Reference Files

- `references/debugging-workflow.md` — 系統性除錯流程：診斷決策樹、錯誤分類、根因分析步驟
- `references/act-local-testing.md` — act 命令完整參考：安裝、事件模擬、secrets、Docker 搭配、限制
- `references/gh-diagnostics.md` — gh CLI 診斷模式：查看 runs/runners/checks/issues/PRs
- `references/anti-patterns.md` — 常見 workflow 反模式：安全、效能、邏輯衝突、最佳實踐

Read the relevant reference file(s) based on the task at hand.

## Quick Decision: Which Reference?

```
任務是...
├─ workflow 跑失敗，要找原因 → references/debugging-workflow.md
├─ 想在本地先驗證 workflow → references/act-local-testing.md
├─ 想查線上 run/runner/PR 狀態 → references/gh-diagnostics.md
├─ 審查 workflow 合理性 / 優化 → references/anti-patterns.md
├─ 寫新 workflow → /github-actions（API reference）+ references/anti-patterns.md
└─ 配置 claude-code-action → /claude-code-action
```
