---
name: markdown-creator.output-and-cleanup
description: >
  最終 Markdown 品質處理、檔案儲存、markitdown MCP server 關閉、暫存檔清理、結果回報模板。
enable_by_default: true
---

# 輸出與清理（Phase 4）

## Step 4.1：最終 Markdown 品質處理

- 修正多餘的連續空行（最多保留一個空行）
- 統一標題層級（確保從 `#` 開始，層級連續）
- 修正損壞的 Markdown 語法（未閉合的連結、表格格式等）
- 確保所有圖片引用都有 alt 文字（無 alt 的補上 `image`）
- 清理殘留的 HTML 標籤（盡量轉為 Markdown 等效語法）

## Step 4.2：儲存結果

將最終的 Markdown 儲存到用戶指定的路徑。如果用戶未指定：

| 輸入來源 | 預設輸出檔名 |
|---------|------------|
| URL | 網頁標題（sanitized）+ `.md` |
| PDF/DOCX 等檔案 | 原始檔名 + `.md`（如 `report.pdf` → `report.md`） |
| 原始文字 | `output.md` |

## Step 4.3：關閉 markitdown MCP Server

**無論轉換成功或失敗，都必須在最後關閉 markitdown MCP server：**

```bash
# Windows：透過 port 找到 PID 並關閉
for /f "tokens=5" %a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do taskkill /F /PID %a 2>NUL

# 或直接關閉所有 markitdown-mcp 程序
taskkill /F /IM markitdown-mcp.exe 2>NUL

# 驗證已關閉
netstat -ano | findstr :3001 || echo "Server stopped successfully"
```

## Step 4.4：清理暫存檔案

```bash
# 清理暫存圖片目錄
rm -rf /tmp/markdown-creator-images 2>/dev/null
# 清理暫存 HTML 檔案
rm -f /tmp/markitdown_temp_*.html 2>/dev/null
```

## Step 4.5：回報結果

```
✅ 轉換完成

📄 輸入：{原始來源（URL/檔案路徑）}
📝 輸出：{輸出檔案路徑}
🖼️ 圖片處理：
  - {N} 張公開圖片（直接嵌入）
  - {M} 張非公開圖片（已上傳至 GitHub Issue）
  - {K} 張圖片處理失敗（已標記）
📊 Markdown 行數：{L} 行
🔌 markitdown MCP server 已關閉
```

---

## 錯誤處理總表

| 情境 | 處理方式 |
|------|---------|
| `markitdown-mcp` 未安裝 | 嘗試 `pip install "markitdown[all]"` 安裝後重試 |
| Port 3001 被佔用 | 先關閉佔用的程序，再啟動 markitdown-mcp |
| URL 無法存取（SSL 錯誤、timeout） | 使用 Playwright MCP 載入頁面後取得 HTML 轉換 |
| 轉換結果為空或不完整 | 改用 Playwright 取得完整頁面 HTML 後重試 |
| 圖片下載失敗 | 嘗試帶 Referer header → 使用 Playwright → 標記為 `[⚠️ 圖片無法下載]` |
| GitHub Issue 圖片上傳失敗 | 備援：`gh gist create --public` 或 commit 到 assets branch |
| markitdown MCP server 啟動失敗 | 備援：直接使用 `markitdown` CLI 指令轉換 |
| 檔案過大（> 100MB） | 告知用戶檔案過大，建議拆分後再轉換 |
| 多頁 PDF | 完整轉換所有頁面，使用 `---` 分隔各頁 |
| Inline SVG 渲染失敗 | 保留原始 SVG 代碼，標記 `[⚠️ SVG 渲染失敗]` |
| Mermaid 渲染失敗 | 備援：`https://mermaid.ink/img/{base64}` API → 仍失敗則保留代碼區塊 |
| 中文字型載入失敗 | 回退 Google Fonts → Microsoft JhengHei → 最終警告用戶 |
| 截圖解析度不足 | 使用 `browser_evaluate` 設定 `deviceScaleFactor: 2` 提高 DPI |
