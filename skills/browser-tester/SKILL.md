---
name: "browser-tester"
description: "Git diff 驅動的瀏覽器模擬人工測試工作流程。分析程式碼變更、映射影響範圍、使用 playwright-cli 執行瀏覽器測試、錄製影片截圖、產出測試報告。"
---

# /browser-tester — Diff 驅動瀏覽器模擬測試

根據 git diff 自動判斷受影響頁面，使用 playwright-cli 模擬人類操作，錄製影片並截圖重點。

---

## Phase 0: 前置檢查

### 0.1 設定 playwright-cli

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
"$PWCLI" --version
```

**如果 `$PWCLI --version` 失敗** → 輸出以下訊息並**中斷所有操作**：

```
playwright-cli 不可用。請確認：
1. Node.js / npm 已安裝
2. npx 在 PATH 中
```

### 0.2 偵測環境

```bash
IS_CI=$(printenv GITHUB_ACTIONS || echo "false")
```

記住 `IS_CI` 值，後續決定報告模式（本地 vs CI）。

### 0.3 決定測試目標 URL

按以下優先級取得 `BASE_URL`：

1. **用戶 prompt 中明確提供的 URL**
2. **環境變數**：依序檢查 `APP_URL`、`SITE_URL`、`WP_URL`、`BASE_URL`
3. **專案配置推斷**：
   - `.env` 中的 URL 相關設定
   - `package.json` 的 `scripts.dev` / `scripts.start` 中的 port
   - `.wp-env.json` 中的設定（WordPress 項目）
   - `docker-compose.yml` 中的 port mapping
4. **localhost 探測**：嘗試 `http://localhost:3000`、`:5173`、`:8080`、`:8888`

**如果無法確定 URL** → 向用戶詢問，或中斷操作。

### 0.4 建立產出目錄

```bash
mkdir -p output/playwright/browser-test/videos
mkdir -p output/playwright/browser-test/screenshots
```

---

## Phase 1: Diff 分析

### 1.1 取得變更檔案

```bash
# 取得預設分支名稱
DEFAULT_BRANCH=$(git remote show origin 2>/dev/null | grep 'HEAD branch' | awk '{print $NF}')
DEFAULT_BRANCH=${DEFAULT_BRANCH:-master}

# 取得變更檔案清單（含統計）
git diff "origin/${DEFAULT_BRANCH}...HEAD" --name-only --stat
```

### 1.2 分類變更檔案

將每個變更檔案歸入以下類別：

| 類別 | 特徵路徑模式 | 測試策略 |
|------|------------|---------|
| **API 變更** | `routes/` `controllers/` `services/` `api/` `endpoints/` `rest-api/` | 導航到**所有**呼叫該 API 的頁面 |
| **UI 頁面變更** | `pages/` `views/` `screens/` `templates/` `admin/` | 導航到**所有**修改到的頁面 |
| **UI 組件變更** | `components/` `widgets/` `blocks/` `partials/` | 導航到**其中一個**使用該組件的頁面 |
| **非前端變更** | `migrations/` `config/` `tests/` `.github/` `docs/` styles-only | **跳過**瀏覽器測試 |

### 1.3 無可測變更處理

如果所有變更都歸類為「非前端變更」：

```
測試結果：無瀏覽器可測變更
變更摘要：
- {列出變更檔案}
- 這些變更不涉及前端頁面或 API，無需瀏覽器測試
```

輸出此報告後結束。

---

## Phase 2: 影響範圍映射

### 2.1 使用 Serena MCP（優先路徑）

如果 Serena MCP 可用：

1. 對每個變更的 API/元件，使用 `find_referencing_symbols` 找到引用它的程式碼
2. 追蹤引用鏈直到找到**頁面級元件**或**路由定義**
3. 從路由配置映射到實際 URL：
   - **React Router**：讀取 `createBrowserRouter` / `<Route>` 定義
   - **WordPress**：讀取 `add_menu_page` / `add_submenu_page` 註冊
   - **Next.js**：依照 `pages/` 或 `app/` 目錄結構推斷

### 2.2 啟發式映射（備援路徑）

Serena 不可用時：

1. 使用 `grep` 搜尋 import/require 語句找到引用檔案
2. 根據檔案路徑模式推斷頁面 URL：
   - `pages/orders/index.tsx` → `/orders`
   - `admin/class-settings-page.php` → `/wp-admin/admin.php?page=settings`
3. 搜尋路由配置檔案匹配元件名稱到 URL

### 2.3 測試範圍決策

| 變更類別 | 測試範圍 |
|---------|---------|
| API 變更 | 導航到**所有**呼叫該 API 的頁面，逐一測試 |
| UI 頁面變更 | 導航到**所有**被修改的頁面，逐一測試 |
| UI 組件變更 | 導航到**其中一個**使用該組件的頁面測試 |

### 2.4 輸出測試計畫

在執行測試前，先整理出測試計畫：

```
## 測試計畫

### 變更摘要
- API 變更：{N} 個檔案
- UI 頁面變更：{N} 個檔案
- UI 組件變更：{N} 個檔案

### 測試目標
1. {URL} — {變更類型} — {預期行為}
2. {URL} — {變更類型} — {預期行為}
...
```

---

## Phase 3: 測試執行

對測試計畫中的每個目標 URL 執行以下流程。

### 3.1 單頁測試流程

```bash
# 1. 開啟頁面
"$PWCLI" open "${BASE_URL}${path}" --headed

# 2. 開始錄影（必須在所有操作之前）
"$PWCLI" video-start

# 3. 取得頁面元素參考
"$PWCLI" snapshot

# 4. 執行測試操作（見 3.2 各類型操作指引）
# ...

# 5. 截圖重點時刻（見 3.3 截圖指引）
"$PWCLI" screenshot

# 6. 檢查 console 錯誤
"$PWCLI" console warning

# 7. 檢查網路請求
"$PWCLI" network

# 8. 停止錄影並儲存
"$PWCLI" video-stop --filename "output/playwright/browser-test/videos/${scenario_name}.webm"
```

### 3.2 各變更類型的測試操作

#### API 變更測試

1. 導航到呼叫該 API 的頁面
2. 觸發 API 呼叫的操作（填表單、點按鈕、切換篩選等）
3. 等待 API 回應
4. 驗證：頁面是否正確顯示回應結果（成功通知、資料更新、錯誤訊息）
5. 檢查 `network` 確認 API 請求狀態碼

#### UI 頁面變更測試

1. 導航到修改的頁面
2. 檢視頁面佈局和視覺呈現
3. 與頁面上的互動元素互動（按鈕、連結、表單）
4. 導航到相關子頁面
5. 驗證：頁面渲染正常、互動功能正確

#### UI 組件變更測試

1. 導航到包含該組件的頁面
2. 找到組件在頁面上的位置
3. 與組件互動（如果可互動）
4. 驗證：組件渲染正常、互動行為正確

### 3.3 截圖重點時刻

截圖只截**重點部分**，不截整頁：

| 變更類型 | 截圖重點 |
|---------|---------|
| API 變更 | API 發出後，成功的回應通知（toast / alert / 資料更新） |
| UI 頁面 | 頁面上**變更的區域**（使用元素截圖 `screenshot <ref>`） |
| UI 組件 | 頁面上**顯示該變更組件的區域**（使用元素截圖 `screenshot <ref>`） |

截圖儲存：
```bash
"$PWCLI" screenshot          # 全頁截圖（備用）
"$PWCLI" screenshot e15      # 元素截圖（優先）
# 截圖自動儲存到當前目錄，手動移至：
# output/playwright/browser-test/screenshots/{scenario}-{step}.png
```

### 3.4 Re-snapshot 時機

以下操作後必須重新 `snapshot`：
- 導航到新頁面
- 點擊引發 DOM 大幅變更的元素（modal、tab、accordion）
- 表單提交後頁面重載
- SPA 路由切換

### 3.5 測試結果判定

每個頁面測試結束後，判定結果：

| 結果 | 條件 |
|------|------|
| **通過** | 頁面正常渲染 + 無 console error + 無 network 失敗 + 互動行為正確 |
| **警告** | 有 console warning 但無 error，功能正常 |
| **失敗** | console error / network 4xx-5xx / 頁面崩潰 / 互動異常 |

---

## Phase 4: 報告生成

### 4.1 本地模式報告

直接在終端輸出結構化報告：

```markdown
# 瀏覽器模擬測試報告

## 測試摘要
- **測試日期**：{YYYY-MM-DD}
- **變更來源**：`git diff origin/{branch}...HEAD`
- **測試頁數**：{N} 頁
- **結果**：✅ {pass} 通過 / ⚠️ {warn} 警告 / ❌ {fail} 失敗

## 變更分析
| 類型 | 檔案數 | 測試範圍 |
|------|--------|---------|
| API 變更 | {n} | 所有呼叫頁面 |
| UI 頁面 | {n} | 所有修改頁面 |
| UI 組件 | {n} | 各一個頁面 |

## 測試結果明細

### {頁面名稱} ({URL})
- **變更類型**：{API/頁面/組件}
- **結果**：✅/⚠️/❌
- **操作步驟**：
  1. {step}
  2. {step}
- **影片**：`output/playwright/browser-test/videos/{name}.webm`
- **截圖**：`output/playwright/browser-test/screenshots/{name}.png`
- **Console 錯誤**：{有/無}（詳情見影片）
- **Network 異常**：{有/無}（詳情見影片）

## 產出物
- 影片：`output/playwright/browser-test/videos/`
- 截圖：`output/playwright/browser-test/screenshots/`
```

### 4.2 CI 模式報告

當 `GITHUB_ACTIONS=true` 時，額外執行 CI 報告流程。

詳細步驟參考：`references/ci-reporting.md`

核心流程：
1. 整理影片和截圖路徑
2. 提取 PR/Issue number
3. 使用 `gh` CLI 發佈 comment
4. 影片和截圖需包含在 GitHub Actions artifact 中（由 workflow 配置 `actions/upload-artifact`）

---

## 錯誤處理

| 錯誤情境 | 處理方式 |
|---------|---------|
| playwright-cli 不可用 | 輸出安裝指引，**中斷操作** |
| 測試 URL 不可達 | 輸出提示（啟動 dev server / 提供 URL），**中斷操作** |
| 頁面載入超時 | 記錄為失敗，繼續測試下一個頁面 |
| `video-start` 失敗 | 記錄警告，改用連續截圖模式，繼續測試 |
| 元素參考過期 | 重新 `snapshot`，重試操作 |
| 無法映射 URL | 記錄為「無法映射」，跳過該檔案 |
| git diff 為空 | 輸出「無變更」報告，正常結束 |
| Serena 不可用 | 降級到啟發式映射，繼續測試 |
