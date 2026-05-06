# 依專案類型分流的驗收手法

不同專案類型，「驗收動作」差很大。本文件分流四大類，每類給出**具體可執行**的驗收手法。

## 為什麼要分流

驗收 = 對齊產出與 testable criteria。但「對齊」的動作依產出類型不同：

- WEB 應用的 criterion「按鈕能點」→ 驗收動作是「打開瀏覽器點按鈕」
- CLI 工具的 criterion「指令成功」→ 驗收動作是「跑指令看 exit code」
- 桌面 GUI 的 criterion「視窗有 X 元件」→ 驗收動作是「看截圖」
- 純文件的 criterion「結構符合規範」→ 驗收動作是「Read 對照」

用錯動作 = 驗收結果失真。

> **⚠️ 不論哪種類型，都必先執行 Reality Check 前置鐵律**：
> 主動掃描反向訊號 + 驗證第三方依賴 + 走證據鏈到最終狀態。
> 詳見 [`zero-assumption-verification.md`](zero-assumption-verification.md)。

---

## 類型 1：WEB 應用

### 識別特徵
- 專案有 `package.json` + 前端 framework（React/Vue/Next.js/Vite 等）
- 或 PHP/Node.js + 對外 HTTP 服務
- 產出包含 UI 變更、頁面、互動行為

### 首選工具：`playwright-cli` SKILL

```
1. 載入 /playwright-cli SKILL
2. 啟動本地 dev server（依 package.json scripts）
3. 用 playwright-cli 模擬人類操作：
   - 導航到目標頁面
   - 模擬點擊、輸入、提交
   - 斷言畫面元素出現/消失/含特定文字
   - 截圖記錄關鍵節點
4. 對照 testable criteria 逐條驗收
```

### 替代方案：Claude in Chrome

若用戶環境配置了 Claude in Chrome（VS Code extension 或 Browser MCP），可直接讓 Claude 透過 Chrome 操作：
- 適合「dev server 已在跑、用戶要驗收正在開的頁面」場景
- 比 playwright-cli 更輕量，不用啟動隔離環境
- 限制：依賴用戶環境，CI 環境不可用

### 驗收清單（套用到每條 criterion）

| Criterion 類型 | 驗收動作 |
|--------------|---------|
| 頁面存在 | 導航 + screenshot + 確認 200 status |
| 元件 render | DOM 斷言（querySelector + text 比對）|
| 互動成功 | 模擬點擊 → 等待狀態變化 → 斷言新狀態 |
| API 整合 | 模擬操作 → 攔截/觀察 network → 斷言 request/response |
| 錯誤處理 | 注入錯誤 input → 斷言錯誤訊息 |
| 響應式 | 切換 viewport size → 截圖比對 |

### WEB 反向訊號掃描清單（強制執行）

每次截圖後**必跑**：

1. **整頁文字 dump**：用 playwright `page.innerText('body')` 取得整頁文字，**不只截圖**
2. **grep 反向訊號**（中英文）：
   - 服務不可用：`尚未啟用 / 未啟用 / 服務暫停 / 維護中 / coming soon / unavailable / disabled / not enabled`
   - 認證失敗：`未授權 / 權限不足 / 請先登入 / unauthorized / forbidden / 401 / 403`
   - 錯誤：`錯誤 / 失敗 / 異常 / error / failed / exception`
   - 警告：`警告 / 注意 / warning / deprecated`
3. **DOM 屬性掃描**：找所有 `[disabled]`、`[aria-disabled="true"]`、CSS class 含 `error|warning|disabled|unavailable`
4. **Network 掃描**：列出所有 4xx/5xx response，即使是非阻擋性的也要記錄
5. **Console 掃描**：listen `pageerror` + `console.error` + unhandled promise rejection
6. **第三方 iframe / 外連頁面**：跳轉到第三方（金流、OAuth）時，**也要對該頁做整頁文字 dump 與 grep**——
   不是「能跳轉」就 PASS，要驗第三方頁面**內容**沒有反向訊號

### 第三方依賴顯式驗證（金流 / OAuth / 外部 API）

當涉及第三方時：
1. 列出所有第三方依賴（綠界、藍新、Stripe、Google OAuth、AWS S3、SendGrid 等）
2. 對每個依賴：
   - 該服務在當前環境（prod / sandbox / staging）是否啟用 → 查商家後台 / dashboard / status page
   - credentials（API key / secret）是否有效 → 用最小測試請求驗證
   - 若是金流，**測試卡號是否能完成模擬交易**（不是「能跳轉到金流頁」）
3. 任一未驗證 → 報告中明示「第三方 X 可用性未驗證」，PASS 結論不涵蓋此面向

### 證據鏈（多步驟流程）

例如「下單 → 付款 → 確認訂單」流程：
- ❌ 不及格：跳轉到金流頁 → 截圖 → PASS
- ✅ 合格：跳轉 + 第三方頁無反向訊號 + 提交測試卡 + 跳回商家頁 + **查 DB 訂單表** + **查金流商交易紀錄** + **查確認信寄送紀錄**

### CI 環境注意

CI 中沒有 GUI，必須用 headless mode（playwright-cli 預設支援）。Claude in Chrome 在 CI 不可用。

---

## 類型 2：桌面 / GUI 應用

### 識別特徵
- Electron / Tauri / Qt / WPF / WinForms / SwiftUI / .NET MAUI
- Native mobile（iOS / Android）
- 任何「需要打開視窗才能看到結果」的應用

### 限制：無法完全自動化驗收

桌面 GUI 沒有像 playwright 這種廣泛通用的自動化方案。本 agent **必須要求 orchestrator 或用戶提供截圖**。

### 驗收流程

```
1. 確認 orchestrator dispatch 時是否附了截圖
2. 沒附 → 回報 orchestrator：「驗收需要 X 個畫面截圖：
   - 主視窗初始狀態
   - 操作 Y 後的中間狀態
   - 完成後的最終狀態
   請補齊後再 spawn 本 agent」
3. 收到截圖 → 用 Read 工具讀圖（multimodal）→ 視覺對照 criteria
4. 文字訊息類 criterion（如錯誤訊息文字）也可請用戶補貼上
```

### 例外：可自動化的桌面測試

部分專案配置了 GUI 自動化測試框架（如 `windows-use`、Appium、Robot Framework），且 orchestrator 在 dispatch 時點明：
- 載入對應 SKILL（如 `windows-use`）
- 跑自動化驗收
- 不需手動截圖

但這要 orchestrator 明確指示，**不要 acceptance-evaluator 自行假設專案有自動化測試**。

### 驗收清單

| Criterion 類型 | 驗收動作 |
|--------------|---------|
| 視窗 render | 看截圖確認視窗存在、無破版 |
| 元件存在 | 截圖中找出目標元件（按鈕、輸入框、圖示）|
| 文案正確 | 截圖中比對文字（注意 i18n） |
| 操作流程 | 多張截圖對照狀態轉移 |
| 錯誤訊息 | 觸發錯誤後的截圖 |

### 桌面反向訊號掃描清單

讀截圖時（用 Read multimodal）**必須**：

1. **視覺掃整張圖**，不只目標區域
2. 列出所有可見文字，特別注意：
   - 紅色/黃色提示框、tooltip、modal
   - 任何「錯誤、警告、未啟用、停用、需要升級、需要設定」字樣
   - title bar / status bar 是否有異常標示
   - 任何 disabled / greyed out 的元件
3. 若截圖中**有目標元件但同畫面有反向訊號**，必須優先記錄反向訊號

---

## 類型 3：CLI / API / Backend Service

### 識別特徵
- 純 backend 專案（無 GUI）
- CLI 工具（`bin/` 下的可執行檔）
- REST API、GraphQL、gRPC service
- 後台 worker、cron job

### 工具：直接跑 + Read 輸出

```
1. CLI：跑指令 → 觀察 stdout/stderr/exit code
2. API：用 curl / httpie / fetch 打請求 → 對照 response schema
3. Backend service：啟動服務 → 跑客戶端 → 觀察行為與日誌
4. Worker：觸發 job → 觀察 queue 狀態與輸出
```

### 驗收清單

| Criterion 類型 | 驗收動作 |
|--------------|---------|
| 指令成功 | `bash -c '<cmd>'; echo "exit=$?"` 確認 exit code |
| 輸出格式 | grep / jq 對 stdout 做斷言 |
| API response | curl + jq 比對 JSON schema |
| 副作用 | 跑前後狀態對比（檔案存在性、DB row 數、queue 長度）|
| 錯誤處理 | 故意傳錯誤 input → 斷言錯誤碼與訊息 |
| 效能 | 跑指令 + `time`，但**只看「是否超過 criterion 提的閾值」**，不做效能優化建議（那是 reviewer 的事）|

### CLI / API 反向訊號掃描清單（強制執行）

1. **完整 stdout** 不只看最後一行，整段 grep：
   - `WARNING / ERROR / FAIL / FATAL / DEPRECATED / DOWN / UNHEALTHY / RETRY`
   - `failed / cannot / unable to / refused`
2. **stderr 必看**，即使 exit 0：
   - 很多工具用 stderr 輸出 warning，會被「exit 0 → PASS」誤判遮蔽
   - 例：`migration completed (exit 0)` 但 stderr 有 `WARNING: foreign key not enforced`
3. **HTTP response**：
   - status code（4xx/5xx 直接 FAIL）
   - body 含 `error / errors / code / message` 欄位且非空 → FAIL
   - 即使 200，也要看 body 是否含業務層面的失敗訊號（`{"success": false, ...}`）
4. **副作用驗證**：
   - DB：跑 `SELECT` 確認資料真的進去
   - Queue：確認 job enqueued 且狀態正確
   - 檔案系統：確認檔案真的建立 + 內容正確
5. **第三方 API 顯式驗證**：
   - 不要只看自己這邊的 API 成功
   - 要查第三方的回應 / dashboard / log
   - sandbox 環境特別注意「服務未啟用 / 限額 / 凍結」等狀態

---

## 類型 4：純文件 / 規格 / 設定檔

### 識別特徵
- 產出是 Markdown、YAML、JSON、TOML、`.feature`、`.dbml` 等純文字檔
- 沒有可執行行為，只有「結構與內容」

### 工具：Read + grep + 結構驗證

```
1. Read 產出檔
2. 對照 testable criteria 做語意檢查
3. 結構檢查：
   - Markdown：用 markdown linter 思維（headers 層級、list 對齊、link 是否壞）
   - YAML/JSON：parse 檢查
   - .feature：Gherkin 語法
4. 內容檢查：
   - 關鍵字 grep（用戶要求加 X，grep "X"）
   - 段落結構對齊用戶意圖
```

### 驗收清單

| Criterion 類型 | 驗收動作 |
|--------------|---------|
| 區塊存在 | grep header / 關鍵字 |
| 結構符合 | 用 Read 檢視層級、列表、表格 |
| 一致性 | 與其他相關文件交叉比對（aho-corasick-skill 可批次掃描）|
| 連結有效 | 對 markdown link 確認目標檔案存在（用 Glob）|
| 語意正確 | 仔細 Read，對照用戶意圖判斷敘述是否準確 |

### 文件反向訊號掃描清單（強制執行）

1. **未完成標記** grep：`TODO / FIXME / XXX / TBD / 待補 / 待確認 / @todo`
2. **語法瑕疵**：
   - 未閉合 code block（``` 數量為奇數）
   - 未閉合 list / table
   - broken link（href 對應檔案不存在 → Glob 驗證）
3. **內容矛盾**：
   - 前後段相互衝突（例：開頭說「禁止 X」結尾又允許 X）
   - 與其他相關文件的描述不一致
4. **過時痕跡**：
   - 引用已不存在的 agent / skill / 檔案路徑
   - 引用已 deprecate 的 API / 設定欄位

### 範例：本次任務（優化 CLAUDE.md）的驗收

如果用戶任務是「優化 CLAUDE.md」：
- C1: 檔案存在性 → Read 確認檔案還在
- C2: 行數縮減或維持 → wc -l 比對前後
- C3: markdown 語法正確 → Read 檢視 code block / link
- C4: 結構保持可讀 → 看 header 層級
- C5: 包含用戶要求的元素 → grep 關鍵字

---

## 多類型混合專案

實務上很多專案是混合的（例如 WordPress plugin = PHP backend + JS frontend + Block UI）。

### 處理原則

1. **依 criterion 分流**：每條 criterion 看它涉及哪一類，套對應驗收手法
2. **不要試圖用一種方法驗所有 criterion**：例如 PHP backend 用 CLI 驗、Block UI 用 playwright 驗
3. **報告中明確標註每條 criterion 用了哪種驗收手法**：方便 orchestrator/用戶 review

### 範例

WordPress Plugin 專案：
- C1 [PHP backend]: REST API 端點回傳正確 JSON → CLI/curl 驗
- C2 [Block UI]: Gutenberg block 能 render → playwright-cli 啟 wp-env 驗
- C3 [文件]: README.md 更新 → Read 對照
- C4 [設定]: plugin.php header 正確 → grep 驗證

---

## 不確定專案類型時

**先問 orchestrator**，不要硬猜。

回報模板：
```
無法判定專案類型，需要 orchestrator 釐清：
- 主要產出物路徑：?
- 是否有 GUI / WEB UI？
- 是否需要啟動 dev server / wp-env？
- 用戶環境是否有 Claude in Chrome / 自動化測試框架？
```

> 唯一例外：如果產出明顯是純文件（路徑只有 `.md`），可直接用類型 4 處理。
