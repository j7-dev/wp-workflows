---
name: markdown-creator
description: >
  Markdown 轉換的完整工作流程。涵蓋 markitdown MCP 轉換、圖片處理與上傳、
  SVG/Mermaid 渲染、輸出品質處理與清理。
  支援 PDF、Word、PowerPoint、Excel、HTML、圖片、音訊等格式。
  供 markdown-creator agent 執行文件轉換時載入。
---

# Markdown Creator

將任意格式的資料轉換為高品質 Markdown，妥善處理所有圖片嵌入。

## Reference Files

- `references/conversion-workflow.md` — Phase 1-2：markitdown MCP server 啟動、輸入辨識、內容轉換、JS-heavy 網站備援
- `references/image-processing.md` — Phase 3：掃描圖片引用、驗證可存取性、下載非公開圖片、上傳至 GitHub Issue CDN、替換引用
- `references/svg-mermaid-rendering.md` — Phase 3.6：Inline SVG / Mermaid 圖表的 playwright-cli 渲染流程、中文字型支援
- `references/output-and-cleanup.md` — Phase 4：最終品質處理、檔案儲存、MCP server 關閉、暫存檔清理、結果回報

Read the relevant reference file(s) based on the task at hand.

## Quick Decision: Which Reference?

```
任務是...
├─ 啟動 MCP / 辨識輸入 / 轉換內容 → references/conversion-workflow.md
├─ 處理圖片引用 / 上傳至 CDN → references/image-processing.md
├─ 渲染 inline SVG 或 Mermaid → references/svg-mermaid-rendering.md
└─ 品質檢查 / 儲存 / 清理 / 回報 → references/output-and-cleanup.md
```

## Execution Flow

```
Phase 1-2: 轉換（markitdown MCP + JS-heavy 備援）
   ↓ references/conversion-workflow.md
Phase 3: 圖片處理（掃描 → 驗證 → 上傳 → 替換）
   ↓ references/image-processing.md
Phase 3.6: SVG / Mermaid 渲染（playwright-cli）
   ↓ references/svg-mermaid-rendering.md
Phase 4: 輸出與清理（品質 → 儲存 → 關閉 → 回報）
   ↓ references/output-and-cleanup.md
```
