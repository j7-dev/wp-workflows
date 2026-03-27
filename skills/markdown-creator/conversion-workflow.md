---
name: markdown-creator.conversion-workflow
description: >
  markitdown MCP server 啟動、輸入辨識、內容轉換、JS-heavy 網站備援的完整流程。
  涵蓋 Phase 1（環境準備）與 Phase 2（內容轉換）。
enable_by_default: true
---

# 轉換工作流程（Phase 1-2）

## Phase 1：環境準備與輸入辨識

### Step 1.1：啟動 markitdown MCP Server

```bash
# 在背景啟動 markitdown MCP server（HTTP 模式）
markitdown-mcp --http --host 127.0.0.1 --port 3001 &
```

等待伺服器就緒（約 2-3 秒），然後驗證：

```bash
curl -s http://127.0.0.1:3001/mcp -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","id":1}' || echo "Server not ready, retrying..."
```

> **安裝備援**：如果 `markitdown-mcp` 未安裝：
> ```bash
> pip install "markitdown[all]"
> # 或
> uv pip install "markitdown[all]"
> ```

> **Port 衝突**：如果 port 3001 已被佔用：
> ```bash
> # Windows：找到並關閉佔用 port 3001 的程序
> for /f "tokens=5" %a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do taskkill /F /PID %a
> # 然後重新啟動
> markitdown-mcp --http --host 127.0.0.1 --port 3001 &
> ```

### Step 1.2：辨識輸入類型

| 輸入類型 | 辨識方式 | 處理方式 |
|---------|---------|---------|
| URL | 以 `http://` 或 `https://` 開頭 | 直接傳給 markitdown 轉換 |
| 本地檔案路徑 | 路徑指向實際存在的檔案 | 傳給 markitdown 轉換 |
| 原始文字/資料 | 不是 URL 也不是檔案路徑 | 儲存為暫存 `.html` 或 `.txt` 檔後轉換 |

---

## Phase 2：內容轉換

### Step 2.1：使用 markitdown MCP 轉換

透過 markitdown MCP server 呼叫轉換工具。使用 MCP JSON-RPC 協議：

```bash
# 列出可用工具
curl -s http://127.0.0.1:3001/mcp -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# 呼叫轉換工具（工具名稱可能為 convert_to_markdown 或 convert）
curl -s http://127.0.0.1:3001/mcp -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"convert_to_markdown","arguments":{"uri":"<URL_OR_FILE_PATH>"}},"id":2}'
```

> **如果 MCP JSON-RPC 呼叫失敗，使用 markitdown CLI 作為備援：**
> ```bash
> markitdown "<URL_OR_FILE_PATH>"
> ```

### Step 2.2：檢查轉換結果品質

轉換完成後，檢查結果：

- 內容是否完整（不應為空或過短）
- 結構是否合理（標題層級、列表、表格）
- 圖片引用是否存在

### Step 2.3：JS-heavy 網站備援

如果轉換結果不佳（內容缺失、只有導航元素、缺少主要文章內容），使用 Playwright MCP 作為備援：

1. 使用 `browser_navigate` 開啟目標網頁
2. 使用 `browser_wait_for` 等待動態內容載入（等待 `networkidle` 或特定元素）
3. 使用 `browser_snapshot` 取得頁面的 accessibility snapshot
4. 使用 `browser_evaluate` 取得 `document.documentElement.outerHTML`
5. 將完整 HTML 儲存為暫存檔案
6. 再次使用 markitdown 轉換 HTML 檔案
7. 使用 `browser_close` 關閉瀏覽器
