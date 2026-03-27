---
name: markdown-creator.image-processing
description: >
  圖片處理完整流程：掃描圖片引用、驗證可存取性、下載非公開圖片、
  上傳至 GitHub Issue 取得永久 URL、替換 Markdown 中的圖片引用。
enable_by_default: true
---

# 圖片處理流程（Phase 3）

**這是核心差異化步驟——必須處理每一張圖片。**

## Step 3.1：掃描圖片引用

解析轉換後的 Markdown，找出所有圖片引用：

```
# Markdown 格式
![alt text](image_url)

# HTML 格式（可能殘留在轉換結果中）
<img src="image_url" alt="alt text">
```

同時處理：
- 相對路徑圖片：根據來源 URL 的 base URL 轉為絕對路徑
- Data URI 圖片（`data:image/...`）：解碼並儲存為檔案

同時偵測以下非 URL 型視覺內容：
- Inline SVG：`<svg` 開頭的 HTML 標籤（整個 SVG block）
- Mermaid 代碼區塊：` ```mermaid ` 圍欄代碼
- 其他可渲染內容：`<canvas>`、Base64 background-image 等

## Step 3.2：驗證圖片可存取性

對每張圖片 URL 進行可存取性檢測：

```bash
curl -s -o /dev/null -w "%{http_code}" "<IMAGE_URL>"
```

分類結果：

| HTTP 狀態碼 | 分類 | 處理方式 |
|------------|------|---------|
| 200 | 公開可存取 | 直接保留 URL |
| 301/302 | 重導向 | 追蹤重導向後重新檢測 |
| 403/401 | 需要授權 | 下載並上傳至 GitHub Issue |
| 404 | 不存在 | 標記為遺失，嘗試從原始頁面重新擷取 |
| 本地路徑 | 本地檔案 | 上傳至 GitHub Issue |
| data: URI | 內嵌資料 | 解碼儲存後上傳至 GitHub Issue |
| Inline SVG | `<svg` 標籤（無獨立 URL） | 建立暫存 HTML → Playwright 渲染 → 截圖 → 上傳 GitHub Issue |
| Mermaid 圖表 | ` ```mermaid ` 代碼區塊 | 建立含 Mermaid.js 的暫存 HTML → Playwright 渲染 → 截圖 → 上傳 GitHub Issue |

## Step 3.3：下載非公開圖片

對於無法公開存取的圖片，先下載到本地：

```bash
mkdir -p /tmp/markdown-creator-images

# 下載圖片（帶 Referer header 以繞過 hotlink 保護）
curl -L -o "/tmp/markdown-creator-images/img_001.png" \
  -H "Referer: <SOURCE_PAGE_URL>" \
  "<IMAGE_URL>"
```

如果 curl 下載失敗（需要 cookie/session），使用 Playwright MCP：

1. 使用 `browser_navigate` 開啟圖片 URL
2. 使用 `browser_take_screenshot` 擷取圖片（備援方案）
3. 或使用 `browser_evaluate` 搭配 fetch API 下載圖片 blob

## Step 3.4：上傳至 GitHub Issue 取得永久 URL

**核心流程：透過 GitHub Issue 介面上傳圖片，取得 GitHub CDN URL。**

```
上傳結果的 URL 格式：
https://github.com/user-attachments/assets/{uuid}
```

**詳細步驟：**

1. **取得 GitHub repo 資訊**：
   ```bash
   gh repo view --json nameWithOwner -q '.nameWithOwner'
   ```

2. **使用 Playwright MCP 開啟 GitHub Issue 頁面**：
   - `browser_navigate` 到 `https://github.com/{owner}/{repo}/issues/new`
   - `browser_wait_for` 等待頁面載入完成

3. **取得頁面快照找到上傳區域**：
   - `browser_snapshot` 取得頁面結構
   - 找到 issue body 的 textarea 元素

4. **上傳圖片檔案**：
   - `browser_click` 點擊 textarea 使其獲得焦點
   - 找到頁面中的檔案上傳 input（通常是隱藏的 `<input type="file">`）
   - `browser_file_upload` 上傳圖片檔案到該 input

5. **等待上傳完成**：
   - `browser_wait_for` 等待上傳處理完成（通常 3-5 秒）
   - GitHub 會在 textarea 中自動插入 `![image](https://github.com/user-attachments/assets/{uuid})`

6. **擷取上傳後的 CDN URL**：
   - `browser_evaluate` 讀取 textarea 的值
   - 使用正則表達式提取 URL：`https://github.com/user-attachments/assets/[a-f0-9-]+`

7. **不要送出 Issue**：只取得圖片 URL，不要點擊 Submit

8. **批次處理**：如果有多張圖片，可以在同一個 Issue 頁面依序上傳所有圖片

> **GitHub Issue 上傳失敗時的備援方案：**
> ```bash
> # 方案 A：使用 GitHub Gist
> gh gist create --public "/tmp/markdown-creator-images/img_001.png"
> # 從輸出中取得 raw URL
>
> # 方案 B：commit 到 repo 的 assets branch
> git checkout --orphan assets 2>/dev/null || git checkout assets
> cp /tmp/markdown-creator-images/* ./assets/
> git add assets/
> git commit -m "Add image assets for markdown conversion"
> git push origin assets
> # URL: https://raw.githubusercontent.com/{owner}/{repo}/assets/assets/img_001.png
> ```

## Step 3.5：替換 Markdown 中的圖片引用

將所有非公開圖片的引用替換為上傳後的 GitHub CDN URL：

```markdown
# 替換前
![alt text](https://private-server.com/image.png)

# 替換後
![alt text](https://github.com/user-attachments/assets/abc123-def456)
```
