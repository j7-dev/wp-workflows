# 評估維度（含 Reality Check 前置維度）

驗收評估從 **1 個前置維度（Reality Check）+ 4 個正交維度**檢視產出。
**Reality Check 是強制前置門檻**——它不過則其他維度都不需評，直接 FAIL。

> 詳細的零假設方法論、反向訊號清單、強制前置動作見 [`zero-assumption-verification.md`](zero-assumption-verification.md)。

---

## 維度 0：Reality Check（現實核對）— 前置鐵律

### 核心問題
> 產出畫面/輸出中**有沒有反向訊號**（錯誤、警告、未啟用、不可用）？
> 涉及的第三方依賴**真的可用**嗎？
> 「過程訊號」（跳轉、200、exit 0）有沒有被誤當「現實訊號」？

### 為什麼放在前面

最致命的驗收事故是「**假設一切正常**」：
- agent 看到目標元素 render → PASS，但**沒讀畫面其他文字**
- agent 看到指令 exit 0 → PASS，但**沒看 stderr 的 warning**
- agent 看到能跳轉到第三方頁 → PASS，但**第三方頁面正文寫著「服務未啟用」**

這類失敗不是 4 大維度其中之一，而是**驗收行為本身偷懶**。
所以必須在 4 大維度之前先過 Reality Check。

### 強制執行動作（必跑，不可省）

1. **全域反向訊號掃描**：對驗收對象（頁面/輸出/檔案）做**整體**讀取，不只目標範圍
   - WEB：截圖 + 讀取整頁可見文字
   - CLI：完整 stdout + stderr
   - API：完整 body + headers + status
   - 文件：Read 整檔
   - 截圖：視覺掃整張圖
2. **反向訊號 grep**：對掃描結果 grep 反向訊號關鍵字清單（見 `zero-assumption-verification.md`）
3. **第三方依賴驗證**：列出所有外部依賴，逐一驗證可用性（status page、dashboard、sandbox 是否啟用）
4. **證據鏈完整性**：多步驟流程必須驗每一步的**最終狀態**（DB、queue、第三方紀錄），不只看跳轉成功

### FAIL 觸發條件

- 掃到任一**阻擋性反向訊號**且與 criterion 直接或間接相關
- 第三方依賴實際**不可用**（沙箱未啟用、服務暫停、credentials 失效）
- 「過程訊號 PASS」但**最終狀態未驗證或驗證失敗**（例：跳轉成功但 DB 沒訂單）
- 驗收者**無法證明已執行掃描動作**（報告中沒有反向訊號掃描結果欄位 = 視同未掃 = FAIL）

### 失敗模式範例

**範例 R1（金流案例 — 真實事故）**：
用戶讓 agent 驗收第三方金流 E2E。agent 操作到金流頁面 render 成功，
但畫面正文**明確寫著「尚未啟用信用卡服務」**，agent 仍判 PASS。
- 缺漏：未掃畫面正文反向訊號
- 訊號：「尚未啟用」是阻擋性反向訊號，與「能完成付款」criterion 直接相關
- 判定：FAIL [Reality Check]
- 正確處置：報告必須記錄此訊號，判定 FAIL，建議「先確認沙箱信用卡服務啟用後再驗」

**範例 R2（過程訊號誤判）**：
用戶要求驗收「下單功能」。agent 模擬點擊結帳 → 看到跳轉成功 → 判 PASS。
- 缺漏：未驗證 DB 訂單狀態，未確認金流 dashboard 有對應交易
- 判定：FAIL [Reality Check]
- 正確處置：補驗 `SELECT * FROM orders WHERE ...` + 第三方交易紀錄

**範例 R3（stderr warning 被忽略）**：
agent 驗收 migration 指令。`exit 0` → 判 PASS。
但 stderr 有 `WARNING: foreign key constraint not enforced`。
- 缺漏：未掃 stderr
- 判定：FAIL [Reality Check]（warning 與 migration 正確性直接相關）

**範例 R4（第三方未驗證）**：
agent 驗收「寄送驗證信」功能。後端 API 回 200 → 判 PASS。
- 缺漏：未確認 mailtrap / 收件匣**真的收到信**
- 判定：FAIL [Reality Check]

### 與其他維度的順序

```
[Reality Check] ─→ 通過 ─→ 4 大維度評估 ─→ 全 PASS → PASS
       │
       └── 不通過 ─→ 直接 FAIL，不繼續評其他維度
```

> **理由**：Reality Check 不通過代表「現實狀態本身不對」，
> 此時討論「需求覆蓋」「邊界完整」沒有意義——前提就崩了。

---

## 維度 1：需求覆蓋度（Coverage）

### 核心問題
> 用戶在原始任務中明確或隱含要求的事項，產出**有沒有都做到**？

### 判斷流程

1. 把 testable criteria 中的 [explicit] 與 [orchestrator] 條目挑出（這些是「必須覆蓋」的）
2. 對每條 criterion 檢視產出，判定：
   - ✅ **完整覆蓋**：產出明確完成此項
   - ⚠️ **部分覆蓋**：產出做了一部分但缺漏（要列出缺什麼）
   - ❌ **未覆蓋**：產出完全沒處理此項

### FAIL 觸發條件
- 任一 [explicit] 或 [orchestrator] criterion 為「未覆蓋」
- 多條（≥ 2）為「部分覆蓋」且未在報告中註明缺漏

### 失敗模式範例

**範例 A**：用戶要求「加登入 + 註冊功能」，產出只做了登入
- 缺漏 criterion: 「C2 [explicit]: 註冊頁面必須存在」
- 判定: FAIL - Coverage

**範例 A2（multi-phase 序列）**：用戶要求「分三個 phase 完成 X」，產出「Phase 1 完成等待繼續確認」
- 缺漏 criterion: Phase 2、Phase 3 未執行
- 判定: FAIL - Coverage（multi-phase 局部完成）
- 詳細執行規範：見 `agents/acceptance-evaluator.agent.md` 的「驗收前置鐵律 5：Multi-Phase / Multi-Step 完成度（No Partial PASS）」——這是「並列功能項目」（範例 A）的「序列 phase 場景特化版」

**範例 B**：用戶要求「優化 CLAUDE.md 並加入個人偏好」，產出只優化了結構但沒加入個人偏好
- 缺漏 criterion: 「C2 [explicit]: 加入個人偏好區塊」
- 判定: FAIL - Coverage

---

## 維度 2：邊界完整性（Boundary）

### 核心問題
> 該包進去的邊界 case、錯誤處理、相關連動**有沒有遺漏**？

### 判斷流程

1. 對 [derived] criteria 中涉及邊界的條目逐一檢視
2. 從以下 5 類邊界檢查產出：
   - **錯誤路徑**（error path）：失敗、例外、回滾
   - **邊界值**（boundary values）：空值、最大/最小、超長、特殊字元
   - **狀態轉移**（state transition）：未登入 → 登入、初始化 → 銷毀
   - **連動效應**（side effects）：A 改了，B/C 是否要連動更新
   - **權限與授權**（auth）：誰能做、誰不能做

### FAIL 觸發條件
- 產出只覆蓋 happy path，完全沒處理錯誤路徑
- 涉及狀態變更但沒處理回滾或失敗 fallback
- 連動效應未處理導致系統不一致（例如改了 A 表 schema 但忘了改 B 表的外鍵）

### 失敗模式範例

**範例 C**：用戶要求「加 API 端點 POST /users」，產出做了 happy path 但沒處理重複 email、空欄位驗證
- 缺漏: 邊界值處理
- 判定: FAIL - Boundary

**範例 D**：用戶要求「重命名 agent 檔案 X 為 Y」，產出改了檔名但沒同步更新 .mcp.json、CLAUDE.md 中的引用
- 缺漏: 連動效應
- 判定: FAIL - Boundary（這也是 zenbu-powers 全域一致性紀律的核心場景）

---

## 維度 3：Off-Topic 偵測（On-Topic）

### 核心問題
> 產出**有沒有偏題**？或多做了用戶**沒要**的東西？

### 為什麼這條重要

「多做」不見得是好事：
- 多做的部分可能引入新風險（沒驗證的 code、沒測過的修改）
- 多做的部分可能違反用戶意圖（用戶要最小改動，agent 卻大幅重構）
- 多做的部分稀釋了核心交付的注意力

### 判斷流程

1. 列出產出中「**沒對應到任何 testable criterion**」的部分
2. 對每個 off-criterion 部分判定：
   - ✅ **必要前置**：為了完成 criterion 必須順便做（例如修 bug 順手加 import）
   - ⚠️ **善意溢出**：合理但用戶沒要（例如順手 reformat 鄰近 code）
   - ❌ **完全偏題**：與用戶任務無關甚至衝突（例如用戶要修 A，agent 改了 B）

### FAIL 觸發條件
- 任一「完全偏題」的修改
- 多項「善意溢出」且用戶有明示「最小改動」

### 失敗模式範例

**範例 E**：用戶說「修這個 typo」，agent 順手把整個函式重構了
- 判定: FAIL - Off-Topic（除非用戶明示授權重構）

**範例 F**：用戶要求「優化 CLAUDE.md」，agent 順手改了 .mcp.json
- 判定: FAIL - Off-Topic（除非有正當的連動理由並標明）

---

## 維度 4：品質達標（Quality Floor）

### 核心問題
> 產出有沒有達到**基本可用**的門檻？

### ⚠️ 重要：這不是 code review

這個維度只看「**能 work 嗎**」「**有沒有明顯破壞性瑕疵**」，不評斷 best practice、可維護性、效能優化——那是 reviewer 的事。

### 判斷流程

| 產出類型 | 「品質達標」的最低要求 |
|---------|---------------------|
| Code | 語法正確（能 parse）、import 完整、能跑起來 |
| 文件 / Markdown | 語法正確（無 broken link、無未閉合 code block）、結構可讀 |
| 設定檔（JSON/YAML） | 格式正確、能被工具 parse |
| UI / 截圖 | 沒有破版、沒有明顯錯誤訊息、能看到目標元素 |
| API 回應 | 符合宣稱的 schema、HTTP status 合理 |

### FAIL 觸發條件
- 產出有 **showstopper** 級瑕疵（語法錯誤、broken link、JSON parse fail）
- 產出宣稱「已完成」但實際無法執行 / 開啟 / parse

### 失敗模式範例

**範例 G**：產出 markdown 但有未閉合的 code block 導致下半段全變代碼塊
- 判定: FAIL - Quality Floor

**範例 H**：產出 PHP 檔但有語法錯誤導致整個 plugin load 失敗
- 判定: FAIL - Quality Floor

### 與 reviewer 的邊界

**這些屬於 reviewer 的事，acceptance-evaluator 不該管：**
- 「用了 var 而不是 let / const」
- 「沒寫 type annotation」
- 「函式太長應該拆」
- 「應該用更 idiomatic 的寫法」

**遇到這類問題的處理**：在報告末段「out-of-scope 觀察」中提及，建議 orchestrator 補派對應 reviewer。**不影響 PASS / FAIL 判定**。

---

## 維度的優先順序（含 Reality Check）

當判定衝突時，優先順序：

0. **Reality Check** 不過 → **直接 FAIL**（現實本身不對，談對齊沒意義）⚠️ 前置鐵律
1. **Quality Floor** 不過 → FAIL（連 work 都沒辦法談對齊）
2. **Coverage** 不過 → FAIL（用戶要的沒做到）
3. **Boundary** 不過 → FAIL（不完整等於沒做完）
4. **Off-Topic** 不過 → FAIL（偏題等於做錯方向）

**Reality Check + 4 維度全 PASS** → 整體判定 PASS

> 注意：Reality Check 不只是「沒看到問題」，而是「主動掃描後確認沒問題」。
> 報告中**必須**有反向訊號掃描結果欄位明示已執行掃描，否則視同未過 Reality Check。

## 報告中的維度標註

每條評估結果在報告中明確標註是哪個維度：

```
- ❌ FAIL [Reality Check]: 金流頁面正文「尚未啟用信用卡服務」，第三方依賴不可用
- ❌ FAIL [Coverage]: 用戶要求加註冊頁但產出只有登入頁
- ⚠️ PASS w/ Note [Boundary]: happy path 完整，但建議補錯誤處理（< [derived, 60%] criterion，可選）
- ❌ FAIL [Off-Topic]: 產出修改了 .mcp.json 但用戶任務僅針對 CLAUDE.md
- ✅ PASS [Quality Floor]: markdown 語法正確、結構可讀
- ✅ PASS [Reality Check]: 已掃描整頁文字、stderr、第三方 dashboard，未發現反向訊號
```
