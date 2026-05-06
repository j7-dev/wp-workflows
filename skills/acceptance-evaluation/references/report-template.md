# 標準驗收評估報告格式

## 為什麼要標準化

驗收報告是 orchestrator 決策的依據（PASS 結束流程 / FAIL 重派）。格式不一致會導致：
- orchestrator 漏看關鍵 FAIL 項
- 多次評估之間無法對齊比較
- 用戶 review 時找不到重點

## 完整模板

```markdown
# 驗收評估報告

**任務**：{用戶原始任務一句話}
**評估對象**：{產出物路徑或描述}
**專案類型**：{WEB / 桌面 / CLI / 文件 / 混合}
**評估迴圈**：第 {N} 輪 / 上限 3 輪
**總體判定**：{✅ PASS / ❌ FAIL}

---

## 反向訊號掃描結果（強制必填 — Reality Check）

> 本欄位記錄驗收過程中**主動掃描**的反向訊號。
> **即使全部 PASS 也必須明示「已執行掃描，未發現反向訊號」**。
> 缺此欄位 = 視同未掃 = 不得 PASS。

### 已執行掃描範圍
- [✓/✗] 整頁/整檔內容（不只目標範圍）
- [✓/✗] stderr / Console / Network errors
- [✓/✗] 第三方依賴可用性（金流、寄信、OAuth、API）
- [✓/✗] 證據鏈到最終狀態（DB、queue、第三方 dashboard）
- [✓/✗] 反向訊號關鍵字 grep（中英文）

### 發現的反向訊號

| 位置 | 訊號內容 | 與 criterion 關係 | 處置 |
|------|---------|------------------|------|
| {例：金流商頁面} | {例：「尚未啟用信用卡服務」} | {例：直接阻擋 C2}| {例：❌ FAIL} |
| ...或 | （若無）| 已掃描，未發現反向訊號 | — |

### 第三方依賴清單與驗證狀態（若涉及）

| 依賴 | 環境 | 可用性驗證 | 證據 |
|------|------|----------|------|
| {例：綠界金流} | sandbox | ✗ 未啟用 | 頁面正文「尚未啟用信用卡服務」|
| {例：SendGrid} | prod | ✓ 可用 | mailtrap 收到測試信 |

---

## Testable Criteria（本次評估使用）

> 本節列出評估所依據的 criteria。若由 orchestrator dispatch 時提供，標明 [orchestrator]；若自行萃取，標明來源與信心度。

| # | Criterion | 來源 | 信心度 |
|---|-----------|------|--------|
| C1 | {具體可驗證敘述} | [explicit] | 100% |
| C2 | {具體可驗證敘述} | [derived] | 80% |
| C3 | {具體可驗證敘述} | [domain] | 60% |
| ... | ... | ... | ... |

---

## 逐條評估

### C1: {Criterion 敘述}
- **判定**：✅ PASS / ❌ FAIL / ⚠️ PASS w/ Note
- **維度**：[Coverage / Boundary / On-Topic / Quality Floor]
- **驗收動作**：{用了哪種手法，例如「playwright-cli 開頁面點按鈕」/「Read CLAUDE.md grep 關鍵字」}
- **觀察**：{具體看到什麼}
- **若 FAIL**：缺漏項是 {X}，建議改善為 {Y}

### C2: ...
（同上格式）

---

## 驗收亮點（Highlights）

> 即使 FAIL，也要列出做對的部分（避免只挑刺）。至少 2-3 點。

- ✅ {正確覆蓋的點 1}
- ✅ {正確覆蓋的點 2}
- ✅ {做得好的設計決策}

---

## 不達標項目摘要（FAIL 時必填）

> 給 orchestrator 看的 punch list。每項對應一條 FAIL criterion + 具體改善動作。

| # | 對應 Criterion | 缺什麼 | 建議改善動作 | 建議重派 agent |
|---|---------------|--------|------------|----------------|
| 1 | C2 | 註冊頁面未實作 | 補建 `/register` 路由 + 對應 component | @zenbu-powers:react-master |
| 2 | C5 | API 重複 email 未處理 | 在 controller 加 unique 檢查 + 回 409 | @zenbu-powers:nestjs-master |
| ... | ... | ... | ... | ... |

---

## Out-of-Scope 觀察（建議跟進，但不影響本次判定）

> 發現但不屬於本 agent 職責範圍的事項。建議 orchestrator 補派對應 reviewer/master。

- 🔍 [Code 品質] {觀察項} → 建議補派 `@zenbu-powers:react-reviewer`
- 🔍 [安全] {觀察項} → 建議補派 `@zenbu-powers:security-reviewer`
- 🔍 [效能] {觀察項} → 建議補派 `@zenbu-powers:wp-performance` SKILL

---

## 評估總結

{1-2 句話總結。PASS 的話強調哪些覆蓋得好；FAIL 的話強調最 critical 的缺漏。}

**下一步**：
- 若 PASS：流程結束，orchestrator 可回報用戶
- 若 FAIL：請 orchestrator 依「不達標項目摘要」重派對應 agent，修正後再 spawn 本 agent 複審
- 若已達 3 輪：建議 orchestrator 升級至用戶介入
```

## 範例：精簡版報告（PASS）

```markdown
# 驗收評估報告

**任務**：優化 CLAUDE.md
**評估對象**：C:\Users\user\.claude\CLAUDE.md
**專案類型**：純文件
**評估迴圈**：第 1 輪 / 上限 3 輪
**總體判定**：✅ PASS

---

## Testable Criteria

| # | Criterion | 來源 | 信心度 |
|---|-----------|------|--------|
| C1 | CLAUDE.md 必須有實際修改 | [explicit] | 100% |
| C2 | 行數應減少或維持（不應變得更冗長） | [derived] | 80% |
| C3 | markdown 語法無新引入瑕疵 | [domain] | 90% |
| C4 | 結構保持可讀 | [derived] | 70% |

---

## 逐條評估

### C1: CLAUDE.md 必須有實際修改
- **判定**：✅ PASS
- **維度**：[Coverage]
- **驗收動作**：Read 檔案 + 比對 git diff
- **觀察**：檔案從 28 行擴展到 ~52 行，新增「任務執行原則」與優化現有結構

### C2: 行數應減少或維持
- **判定**：⚠️ PASS w/ Note
- **維度**：[Coverage]
- **驗收動作**：wc -l 對比前後
- **觀察**：行數略增（28 → 52），但這是因為用戶要求補上 4 條任務執行原則。考慮到內容增加是合理的，本項視為 PASS。仍遠低於官方 200 行門檻。

### C3: markdown 語法無新引入瑕疵
- **判定**：✅ PASS
- **維度**：[Quality Floor]
- **驗收動作**：Read 全檔 + 檢視 inline code、blockquote、list 結構
- **觀察**：所有 inline code 反引號正確配對；無未閉合 code block；blockquote 與 list 結構正常

### C4: 結構保持可讀
- **判定**：✅ PASS
- **維度**：[Coverage]
- **驗收動作**：Read 比對 header 層級
- **觀察**：H1/H2/H3 層級清晰，4 個主要區塊（角色、任務執行原則、派發模式、子節）並列良好

---

## 驗收亮點

- ✅ 反引號未配對的語法瑕疵被修正
- ✅ Guard rail 機制正確設置，避免「全自主性」失控
- ✅ 與 zenbu-powers skill 的職責邊界宣告清晰

---

## Out-of-Scope 觀察

- 🔍 [可選] 個人偏好區塊（git/環境/工作風格）尚未補齊。用戶已知悉並選擇暫不加。

---

## 評估總結

CLAUDE.md 優化任務達標。林北的所有改動對齊用戶意圖，無 off-topic 修改，markdown 語法乾淨。

**下一步**：流程結束，回報用戶完成。
```

## 範例：精簡版報告（FAIL）

```markdown
# 驗收評估報告

**任務**：建立 acceptance-evaluator agent + 配套 skill
**評估對象**：agents/acceptance-evaluator.agent.md + skills/acceptance-evaluation/
**專案類型**：純文件
**評估迴圈**：第 1 輪 / 上限 3 輪
**總體判定**：❌ FAIL

---

## Testable Criteria

| # | Criterion | 來源 | 信心度 |
|---|-----------|------|--------|
| C1 | agent 檔案存在於指定路徑 | [explicit] | 100% |
| C2 | agent body < 150 行 | [orchestrator] | 100% |
| C3 | skill 包含 5 個 references | [orchestrator] | 100% |
| C4 | references 包含 WEB/桌面/CLI 驗收分流 | [explicit] | 100% |
| C5 | CLAUDE.md 已寫入驗收評估區塊 | [explicit] | 100% |

---

## 逐條評估

### C1: agent 檔案存在
- **判定**：✅ PASS
- ...

### C5: CLAUDE.md 已寫入驗收評估區塊
- **判定**：❌ FAIL
- **維度**：[Coverage]
- **驗收動作**：Read CLAUDE.md grep "驗收評估"
- **觀察**：未找到對應區塊。Task #4 似乎被跳過。
- **若 FAIL**：缺漏項是 CLAUDE.md 中的「驗收評估」區塊，建議補上條件觸發規則 + acceptance-evaluator 引用。

---

## 不達標項目摘要

| # | 對應 Criterion | 缺什麼 | 建議改善動作 | 建議重派 agent |
|---|---------------|--------|------------|----------------|
| 1 | C5 | CLAUDE.md 未寫入驗收評估區塊 | 補加 `## 驗收評估` 含條件觸發規則 | orchestrator 自行處理（簡單寫入）|

---

## 評估總結

agent + skill 部分達標，但 CLAUDE.md 整合未完成。屬於可快速修正的單點缺漏，建議 orchestrator 直接補上後再 spawn 本 agent 複審。

**下一步**：補上 CLAUDE.md 區塊 → 重新 spawn acceptance-evaluator → 預期第 2 輪 PASS。
```

## 報告寫作守則

1. **反向訊號掃描結果必填**：缺此欄位的報告視同未掃，不得 PASS（這是 Reality Check 鐵律）
2. **二元判定**：每條 criterion 必須給明確 ✅/❌（⚠️ 限「邊界 case 但不阻擋」場景）
3. **可執行的改善建議**：不寫「再仔細看看」，要寫「在 X 檔案的 Y 函式加入 Z 檢查」
4. **保留正向回饋**：即使整體 FAIL，也要列亮點（避免打擊產出者士氣 + 避免後續修改誤砍正確部分）
5. **out-of-scope 明確隔離**：code 品質問題標 out-of-scope，**不影響 PASS/FAIL**
6. **建議重派對象具體**：punch list 中標明該回到哪個 agent（master / reviewer / orchestrator）

## 範例：金流 E2E 驗收報告（FAIL — Reality Check 觸發）

> 這是真實事故的「正確」報告寫法（對照原本 agent 把它判 PASS 的失誤）。

```markdown
# 驗收評估報告

**任務**：驗收第三方金流（綠界）信用卡付款 E2E 測試
**評估對象**：tests/e2e/payment-ecpay.spec.ts + 實際跑 playwright 互動
**專案類型**：WEB（含第三方金流）
**評估迴圈**：第 1 輪 / 上限 3 輪
**總體判定**：❌ FAIL

---

## 反向訊號掃描結果（強制必填）

### 已執行掃描範圍
- [✓] 整頁可見文字（包含跳轉到綠界後的頁面正文）
- [✓] Console / Network errors
- [✓] 第三方依賴可用性
- [✓] 證據鏈到最終狀態（DB orders 表、綠界 dashboard）
- [✓] 反向訊號關鍵字 grep

### 發現的反向訊號

| 位置 | 訊號內容 | 與 criterion 關係 | 處置 |
|------|---------|------------------|------|
| 綠界金流頁面正文 | 「尚未啟用信用卡服務」 | 直接阻擋 C2（能完成付款）| ❌ FAIL |
| 綠界商家後台 | 信用卡商品狀態 = 申請中 | 印證上述訊號 | 確認非 UI bug |

### 第三方依賴清單與驗證狀態

| 依賴 | 環境 | 可用性驗證 | 證據 |
|------|------|----------|------|
| 綠界金流 | sandbox | ✗ 信用卡服務未啟用 | 頁面正文 + 商家後台 |

---

## Testable Criteria

| # | Criterion | 來源 | 信心度 |
|---|-----------|------|--------|
| C1 | 點擊結帳能跳轉到綠界金流頁 | [explicit] | 100% |
| C2 | 在綠界輸入測試卡能完成付款 | [explicit] | 100% |
| C3 | 付款成功後跳回商家頁顯示成功 | [explicit] | 100% |
| C4 | DB orders 表 status 更新為 paid | [derived] | 90% |

---

## 逐條評估

### C1: 跳轉到綠界
- **判定**：✅ PASS
- **維度**：[Coverage]
- **觀察**：點擊結帳能正確跳轉到綠界 sandbox 頁面

### C2: 完成付款
- **判定**：❌ FAIL
- **維度**：[Reality Check]（前置鐵律觸發）
- **驗收動作**：playwright `page.innerText('body')` 取得綠界頁面整頁文字
- **觀察**：頁面正文明確顯示「尚未啟用信用卡服務」。**雖然頁面 render 成功，但服務本身不可用**——這是過程訊號（跳轉成功）與現實訊號（服務未啟用）的衝突，依鐵律必信反向訊號
- **若 FAIL**：建議先到綠界商家後台啟用信用卡服務，再重跑 E2E

### C3, C4: 未驗證
- **判定**：—（前置鐵律 FAIL，後續不評）
- 因 C2 在第三方頁面就被卡住，C3/C4 無法到達

---

## 不達標項目摘要

| # | 對應 Criterion | 缺什麼 | 建議改善動作 | 建議重派 agent |
|---|---------------|--------|------------|----------------|
| 1 | C2 | 綠界沙箱信用卡服務未啟用 | 到綠界商家後台啟用信用卡商品（非程式碼問題）| orchestrator 通知用戶處理外部設定 |

---

## 評估總結

⚠️ **這不是 code bug，是第三方依賴環境問題**——但身為驗收者必須**FAIL**，
因為驗收的是「能完成付款」而非「能跳轉」。
過去事故中 agent 因看到頁面 render 就 PASS，遮蔽了真實問題，造成上線後付款失敗。

**下一步**：用戶到綠界商家後台啟用信用卡服務 → 重新 spawn 本 agent 複審。
```
