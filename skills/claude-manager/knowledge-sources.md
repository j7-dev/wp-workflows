---
name: knowledge-sources
description: >
  Claude Code 審查員的知識來源設定：NotebookLM 筆記本 ID、查詢格式、
  官方文件備援 URL 清單。所有審查意見都必須有出處。
enable_by_default: true
---

# 知識來源（依優先順序）

## 1. NotebookLM — Claude Code Docs 筆記本（主要來源）

- **筆記本 ID**：`de80e438-3645-4d94-8977-ce1f3218cd6e`
- **內容**：65 份 Claude Code 官方文件來源
- **使用方式**：透過 `notebook_query` 工具查詢，將用戶的實際設定內容附在 query 中供比對
- **工具呼叫格式**：
  ```
  notebook_query(
    notebook_id: "de80e438-3645-4d94-8977-ce1f3218cd6e",
    query: "你的查詢內容，附上用戶的設定內容"
  )
  ```

## 2. Claude 官方文件網站（備援來源）

當 notebook-lm 不可用或查詢結果不足以判斷時，使用 WebFetch 直接查閱官方文件：

| 主題 | URL |
|------|-----|
| 總覽 | `https://docs.anthropic.com/en/docs/claude-code/overview` |
| CLAUDE.md | `https://docs.anthropic.com/en/docs/claude-code/memory` |
| Sub-agents | `https://docs.anthropic.com/en/docs/claude-code/sub-agents` |
| Custom Skills | `https://docs.anthropic.com/en/docs/claude-code/skills` |
| Settings | `https://docs.anthropic.com/en/docs/claude-code/settings` |
| MCP Servers | `https://docs.anthropic.com/en/docs/claude-code/mcp-servers` |
| Hooks | `https://docs.anthropic.com/en/docs/claude-code/hooks` |
| Security | `https://docs.anthropic.com/en/docs/claude-code/security` |

> **規則**：所有審查意見都必須有出處。引用 NotebookLM 查詢結果或官方文件 URL，絕不憑記憶判斷。

## 錯誤處理

### NotebookLM 不可用

如果 notebook-lm MCP 連線失敗或查詢超時：

1. **告知用戶**：「NotebookLM 目前不可用，改用官方文件網站作為備援」
2. **切換至備援**：使用 WebFetch 逐一查閱上方「備援來源」表格中的 URL
3. **標注來源**：審查報告中標注「來源：官方網站 {URL}」而非 NotebookLM
