---
name: claude-manager
description: >
  Claude Code 官方最佳實踐審查的完整工作流程與知識來源。涵蓋 7 大審查範圍
  （CLAUDE.md、Agent、Skill、Settings、Rules、MCP、Hooks）、審查工作流程、
  知識來源設定。供 claude-manager agent 執行設定審查時載入。
---

# Claude Manager

掃描專案中所有 Claude Code 相關設定檔，逐一比對官方文件規範，
產出嚴重性分級的審查報告與 before/after diff 建議。

## Reference Files

- `references/knowledge-sources.md` — NotebookLM 筆記本 ID、查詢格式、官方文件備援 URL 清單、錯誤處理
- `references/audit-scope.md` — 7 大審查範圍（CLAUDE.md / Agent / Skill / Settings / Rules / MCP / Hooks）的審查重點清單與 notebook_query 模板
- `references/audit-workflow.md` — 完整工作流程：模式判定 → 環境掃描 → 逐項審查 → 報告產出 → 修正執行

Read the relevant reference file(s) based on the task at hand.

## Quick Decision: Which Reference?

```
任務是...
├─ 需要查詢官方規範 / NotebookLM 設定 → references/knowledge-sources.md
├─ 確認某類設定的審查重點 → references/audit-scope.md
└─ 執行完整審查流程 / 產出報告 → references/audit-workflow.md
```

## Execution Flow

```
Phase 0: 模式判定（全面 / 單項 / 即時）
   ↓ references/audit-workflow.md
Phase 1: 環境掃描（列出所有設定檔）
   ↓ references/audit-workflow.md + references/audit-scope.md
Phase 2: 逐項審查（比對官方規範）
   ↓ references/audit-scope.md + references/knowledge-sources.md
Phase 3: 報告產出（🔴/🟡/🔵 嚴重性分級）
   ↓ references/audit-workflow.md
Phase 4: 修正執行（用戶確認後）
   ↓ references/audit-workflow.md
```
