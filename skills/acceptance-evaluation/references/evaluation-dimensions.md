# 4 大評估維度

驗收評估從 4 個正交維度檢視產出。每個維度有自己的判斷準則與失敗模式。

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

## 4 維度的優先順序

當判定衝突時（例如 Coverage 過了但 Off-Topic 翻車），優先順序：

1. **Quality Floor** 不過 → 直接 FAIL（連 work 都沒辦法談對齊）
2. **Coverage** 不過 → FAIL（用戶要的沒做到）
3. **Boundary** 不過 → FAIL（不完整等於沒做完）
4. **Off-Topic** 不過 → FAIL（偏題等於做錯方向）

**全部 4 維度 PASS** → 整體判定 PASS

## 報告中的維度標註

每條評估結果在報告中明確標註是哪個維度：

```
- ❌ FAIL [Coverage]: 用戶要求加註冊頁但產出只有登入頁
- ⚠️ PASS w/ Note [Boundary]: happy path 完整，但建議補錯誤處理（< [derived, 60%] criterion，可選）
- ❌ FAIL [Off-Topic]: 產出修改了 .mcp.json 但用戶任務僅針對 CLAUDE.md
- ✅ PASS [Quality Floor]: markdown 語法正確、結構可讀
```
