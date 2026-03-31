---
name: conflict-resolver
description: >
  分支衝突解決完整工作流程。涵蓋分支偵察、衝突分類（簡單/中等/困難）、
  解法規劃與用戶確認、測試命令自動偵測、推送策略。
  當 conflict-resolver agent 被啟動時自動載入。
---

# Conflict Resolver Workflow

分支衝突解決的完整操作流程。此 Skill 定義了從偵察到推送的 5 個階段。

**核心原則：只解決衝突，不做合併決策。推回各分支後讓 PR 自行合併。**

## 參考文件

- [workflow.md](references/workflow.md) — 5 階段完整工作流程（偵察 → 分析 → 解決 → 測試 → 推送）
