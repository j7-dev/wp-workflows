# 零假設驗收原則（Zero-Assumption Verification）

> **本 reference 是驗收評估的「前置鐵律」。Step 2「對齊產出與 criteria」之前必讀。**

---

## 為什麼要有這條鐵律

驗收評估最致命的失敗模式是「**假設一切正常**」（Optimism Bias）：

- agent 看到「目標元素出現」就打勾，不看畫面其他訊號
- agent 看到「指令成功 exit 0」就 PASS，不看 stdout 中的 warning
- agent 看到「截圖有 UI」就過關，不讀畫面文字內容

這類失敗有個共同點：**只驗「該驗的點」，不掃「畫面/輸出整體所呈現的現實」**。

### 真實案例：金流 E2E 驗收事故

> 用戶讓 agent 驗收第三方金流的 E2E 測試。agent 操作到第三方金流商頁面，
> 畫面**明確寫著「尚未啟用信用卡服務」**，但 agent 仍判 PASS。

**事故根因**：
- agent 的 testable criterion 是「能跳轉到金流商頁面」
- agent 看到頁面 render → 認定 criterion 達成 → PASS
- agent **完全忽略了畫面正文的反向訊號**

**正確做法**：
- 跳轉 PASS 只是**過程訊號**，不是**現實訊號**
- 必須讀取畫面正文，掃描「unavailable / disabled / not enabled / coming soon / 尚未 / 未啟用」等反向訊號
- 任一反向訊號都應觸發 FAIL 或至少 ⚠️ HOLD，不應 PASS

---

## 零假設原則的 4 條鐵律

### 鐵律 1：不假設「沒寫到的就是正常」

驗收 ≠ 只檢查 testable criteria。**畫面/輸出中所有訊息都是證據**。

| ❌ 假設思維 | ✅ 零假設思維 |
|-----------|-------------|
| 「criterion 沒提到錯誤訊息，所以畫面有沒有錯誤訊息不重要」 | 「畫面有錯誤訊息 → 必須記錄並判定影響」 |
| 「我只 check 該 check 的元素」 | 「我先掃整個畫面/輸出，再對齊 criteria」 |
| 「截圖有目標 UI 就 PASS」 | 「目標 UI 周圍有沒有警告/disabled/未啟用文字」 |

### 鐵律 2：不假設「過程訊號 = 現實訊號」

「能進到頁面」「指令 exit 0」「API 回 200」**只是過程訊號**，不代表業務行為真的成功。

| 過程訊號 | 真正要驗的現實訊號 |
|---------|------------------|
| 跳轉到金流頁面 | 金流頁面**真的能下單**（不是「尚未啟用」「服務暫停」） |
| 點擊「送出」按鈕 | 訂單**真的進到後端 DB**（查 DB 確認）|
| API 回 200 | response body 真的符合 schema（不是空陣列、不是 mock）|
| 寄信 API 成功 | 收件人**真的收到信**（查 mailtrap / 收件匣）|
| migration 跑完 | DB schema **真的長對的樣子**（describe table 確認）|

### 鐵律 3：不假設「第三方服務可用」

當驗收涉及外部依賴（金流、寄信、OAuth、第三方 API），**必須顯式驗證該依賴本身的可用性**：

- 第三方頁面正文有沒有「服務暫停 / 尚未啟用 / maintenance / coming soon」
- 第三方 API 有沒有回 503 / 429 / 401（即使你這邊看起來成功）
- 沙箱環境有沒有特殊限制（測試卡號、限額、冷凍狀態）
- 第三方 dashboard / status page 是否顯示異常

**不要假設「沙箱環境一定可用」**——這是金流案例的根本錯誤。

### 鐵律 4：不假設「沒看到的就是沒發生」

驗收必須**主動追證據**，不是「等問題自己跳出來」：

- 不要只等 error toast 出現 → 主動 grep console、network、log
- 不要只看最終頁面 → 主動回查中間步驟的 response body
- 不要只看自己的環境 → 主動查 DB / queue / 第三方狀態

---

## 反向訊號（Negative Signals）關鍵字清單

驗收任何產出時，**必須**主動掃描以下訊號。任一命中 → 不可 PASS，至少 ⚠️ HOLD 等用戶/orchestrator 釐清。

### 通用反向訊號（中文 + 英文）

| 類別 | 中文關鍵字 | 英文關鍵字 |
|------|-----------|-----------|
| **服務不可用** | 尚未啟用、未啟用、未開通、服務暫停、暫不提供、維護中、即將推出 | not enabled, not available, unavailable, disabled, suspended, maintenance, coming soon, deprecated |
| **權限/認證問題** | 未授權、權限不足、請先登入、Session 過期、無效 token | unauthorized, forbidden, permission denied, access denied, invalid token, expired |
| **錯誤狀態** | 錯誤、失敗、異常、無法、錯誤碼、發生錯誤 | error, failed, failure, exception, cannot, unable to, issue detected |
| **警告** | 警告、注意、請注意、不建議、即將過期 | warning, caution, note, deprecated, will be removed |
| **空狀態（可疑）** | 找不到、查無資料、暫無紀錄、尚無、空 | not found, no results, no data, empty, none |
| **狀態凍結** | 凍結、鎖定、停用、封鎖、限制 | frozen, locked, blocked, restricted, throttled |
| **超限** | 配額、達上限、超過限制、用量耗盡 | quota, limit exceeded, rate limited, throttled |

### Web/UI 特定反向訊號

- 元素 `disabled` 屬性為 true
- CSS class 含 `disabled`、`error`、`warning`、`unavailable`、`pending`
- 紅色 / 黃色提示框（toast、alert、banner）
- HTTP status 4xx / 5xx
- Console 有 error 或 unhandled promise rejection
- Network 有 failed request（即使是非阻擋性的）

### CLI/API 特定反向訊號

- exit code ≠ 0
- stderr 非空（即使 exit 0）
- stdout 含 `WARNING`, `ERROR`, `FAIL`, `DEPRECATED`, `DOWN`, `UNHEALTHY`
- HTTP status ≠ 2xx
- response body 含 `error`, `code`, `message` 欄位且為非空
- log 等級 WARN / ERROR / FATAL

### 文件/規格特定反向訊號

- TODO、FIXME、XXX、TBD、待補、待確認
- 未閉合 code block / list
- broken link（href 對應檔案不存在）
- 範例程式碼語法錯誤
- 自相矛盾的敘述（前後段衝突）

---

## 強制驗收前置動作（Mandatory Pre-Check）

**驗收 4 大維度之前，必須跑完以下 reality check：**

### Pre-Check 1：全域反向訊號掃描

對驗收對象做**整體**掃描（不是只看 criterion 提到的範圍）：

| 對象類型 | 強制掃描動作 |
|---------|-------------|
| **WEB 頁面** | 截圖 → 讀取**整頁所有可見文字**（不只目標元件）→ grep 反向訊號清單 |
| **CLI 輸出** | 完整讀取 stdout + stderr → grep 反向訊號清單 |
| **API response** | 讀取完整 body + headers → 檢查 status / error 欄位 |
| **文件產出** | Read 整檔（不只用戶要求修改的段落）→ grep 反向訊號清單 |
| **截圖** | 視覺掃描整張圖（不只目標區域）→ 標出所有可見的警告/錯誤訊息 |

### Pre-Check 2：第三方依賴顯式驗證

若驗收涉及外部服務，**必須**：

1. 列出所有第三方依賴（金流、寄信、OAuth、API、CDN、analytics 等）
2. 對每個依賴單獨驗證可用性：
   - 該服務的 status page / dashboard 是否正常
   - 該服務在當前環境（prod / sandbox / staging）是否啟用
   - 該服務的 API key / credentials 是否有效
3. 若無法驗證 → 在報告中明確標註「第三方依賴可用性未驗證，PASS 結論不涵蓋此面向」

### Pre-Check 3：證據鏈完整性檢查

對涉及多步驟流程的驗收（例如下單、註冊、付款），**必須**驗證**每一步**的最終狀態：

```
不及格示範：
  Step 1: 點擊結帳 → ✅ 跳轉成功 → 驗收結束 ❌ 不夠

合格示範：
  Step 1: 點擊結帳 → ✅ 跳轉到金流頁面
  Step 2: 金流頁面正文無反向訊號 → ✅ 服務可用
  Step 3: 填寫測試卡 → ✅ 提交成功
  Step 4: 跳回商家頁面 → ✅ 顯示成功訊息
  Step 5: 查 DB 訂單表 → ✅ 訂單狀態 = paid
  Step 6: 查金流商 dashboard → ✅ 對應交易紀錄存在
  → 完整證據鏈 PASS
```

---

## 反向訊號出現時的處置矩陣

掃描到反向訊號時的判定邏輯：

| 反向訊號類別 | 與 criterion 關係 | 處置 |
|------------|------------------|------|
| 阻擋性（服務不可用、認證失敗、錯誤訊息） | 直接相關 | ❌ FAIL [Reality Check] |
| 阻擋性 | 間接相關（影響 criterion 的前提） | ❌ FAIL [Reality Check] |
| 阻擋性 | 完全無關（其他模組的錯誤） | ⚠️ PASS w/ Note，列入 out-of-scope |
| 警告性（deprecated, warning） | 與 criterion 相關 | ⚠️ PASS w/ Note，要求說明 |
| 警告性 | 與 criterion 無關 | ⚠️ 在報告中提及，不影響判定 |
| 空狀態（可疑） | 與 criterion 直接相關 | ❌ FAIL [Reality Check]（除非 criterion 明示「應為空」）|
| 空狀態 | 預期狀態 | ✅ PASS |

### 黃金法則

> **「畫面有反向訊號」 ＞ 「criterion 看起來達成」**
>
> 當兩者衝突時，**永遠相信反向訊號**，不要相信「criterion 看起來達成」。
>
> 因為 criterion 可能萃取偏差、可能漏列邊界，但畫面/輸出中的反向訊號**是真實狀態的直接證據**。

---

## 報告中的反向訊號記錄欄位

每份驗收報告**必須**有以下欄位（即使全部 PASS 也要明示「未發現反向訊號」）：

```markdown
## 反向訊號掃描結果（強制必填）

> 本欄位記錄驗收過程中**主動掃描**到的所有反向訊號。
> 即使全部 PASS，也必須明示「已執行掃描，未發現反向訊號」。

### 已掃描範圍
- [✓] 整頁可見文字（不只目標元件）
- [✓] Console 訊息
- [✓] Network 請求狀態
- [✓] 第三方依賴可用性
- [✓] DB / queue 最終狀態

### 發現的反向訊號
| 位置 | 訊號內容 | 與 criterion 關係 | 處置 |
|------|---------|------------------|------|
| 金流商頁面 | "尚未啟用信用卡服務" | 直接阻擋 C2（能完成付款）| ❌ FAIL |
| Console | "Warning: deprecated API" | 與 criterion 無關 | ⚠️ 記錄但不影響判定 |
| ...或 | （若無）| 已掃描，未發現反向訊號 | — |
```

---

## 自我檢查清單（驗收結束前必過）

驗收完成、寫報告之前，問自己：

- [ ] 我有沒有讀**整頁/整份輸出**，不只目標範圍？
- [ ] 我有沒有 grep 過反向訊號關鍵字清單？
- [ ] 我有沒有驗證第三方依賴的**現實可用性**（不是只看自己這邊跳轉成功）？
- [ ] 我有沒有走完整證據鏈到**最終狀態**（DB、queue、第三方 dashboard）？
- [ ] 我下 PASS 的依據是「主動驗證到正確狀態」還是「沒看到錯誤」？
  - 後者是失職——「沒看到」可能是**沒去看**

任一項答「沒有」 → 不可下 PASS，先補完掃描。

---

## 與其他 reference 的關係

- **本 reference**（zero-assumption-verification）：規範**驗收前的鐵律與心法**
- `evaluation-dimensions.md`：4 大維度的判斷準則（含 Reality Check 維度）
- `project-type-verification.md`：每類專案的反向訊號清單與驗收手法
- `report-template.md`：報告格式中的「反向訊號掃描結果」必填欄位

執行順序：**本 reference 鐵律 → Pre-Check 三步 → 套 4 維度 → 寫報告**。
