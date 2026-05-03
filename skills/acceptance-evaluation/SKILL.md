---
name: acceptance-evaluation
description: 驗收標準對齊評估方法論。給定用戶原始任務需求 + 上游 agent 產出，本 SKILL 提供萃取 testable criteria、4 大評估維度、報告格式、與 reviewer agents 的職責邊界、以及 WEB / 桌面 / CLI / 純文件的驗收手法分流。供 acceptance-evaluator agent 載入；orchestrator 直接 evaluate 簡單任務時也可參考。
---

# 驗收標準對齊評估方法論

## 何時使用本 SKILL

當 orchestrator（main agent）面臨以下情境之一，且需要對「產出是否符合用戶意圖」做明確判定時：

- 多 sub-agent 平行協作後的整合產出
- 高風險或不可逆操作的成果驗收（資料遷移、API 破壞性變更、生產環境動作）
- 多維度驗收任務（功能 + 效能 + 安全 + 文件等多軸）
- 用戶明確要求「驗收 / 評估 / 不能出包」

**不適用**（orchestrator 自行判斷即可）：
- 單一 sub-agent、單一領域、單一驗收維度
- 改錯字、reformat、文件微調
- 純解釋 / 澄清類任務

## 與 reviewer agents 的關係（最重要）

| 角色 | 審查軸 | 例子 |
|------|--------|------|
| `*-reviewer` agents | **Code 品質**（best practice、安全、效能、可維護性） | react-reviewer 看 hook 用法、wordpress-reviewer 看 nonce、security-reviewer 看 OWASP |
| **acceptance-evaluator** | **用戶意圖對齊**（需求覆蓋、邊界完整、off-topic 偵測） | 用戶要 A 結果做了 B 嗎？該包進去的邊界有缺漏嗎？產出有沒有偏題？ |

兩者**正交不重疊**。詳見 `references/scope-boundary.md`。

## 核心流程

### Step 1：建立 testable criteria

從用戶原始任務 + 上下文萃取**可驗收的具體標準**。詳見 `references/extracting-testable-criteria.md`。

> **若 orchestrator dispatch 時已提供 criteria**，直接用；**若未提供**，本 SKILL 教你怎麼自行推導並在報告中標明來源。

### Step 2：對齊產出與 criteria

逐條檢視產出有沒有覆蓋到每一條 criterion，採用 4 大評估維度：

1. **需求覆蓋度**（Coverage）：用戶要的功能/變更**有沒有都做到**
2. **邊界完整性**（Boundary）：邊界 case、錯誤處理、相關連動**有沒有遺漏**
3. **Off-topic 偵測**（On-Topic）：產出**有沒有偏題**或多做了用戶沒要的東西
4. **品質達標**（Quality Floor）：基本可用門檻（不是 code review，是「能 work 嗎」）

詳見 `references/evaluation-dimensions.md`。

### Step 3：依專案類型選驗收手法

不同專案類型的「驗收動作」不同：

| 專案類型 | 驗收手法 |
|---------|---------|
| WEB 應用 | `playwright-cli` SKILL 跑互動 + 截圖；或 Claude in Chrome 直連 |
| 桌面 / GUI 應用 | 要求 orchestrator/用戶提供**截圖**（無法自動化） |
| CLI / API | 跑指令、Read 輸出檔、grep 關鍵字 |
| 純文件 / 規格 | Read 對照、語意一致性檢查 |

詳見 `references/project-type-verification.md`。

### Step 4：產出報告

依標準格式輸出，二元判定 PASS / FAIL，逐條對應 criterion。詳見 `references/report-template.md`。

### Step 5：交回 orchestrator

- **PASS**：結束流程
- **FAIL**：orchestrator 重派原 agent → 修正後再次 spawn 本 SKILL 的使用者（acceptance-evaluator）複審
- **最多 3 輪**迴圈，超過則建議用戶介入

## References 索引

| 檔案 | 用途 | 何時讀 |
|------|------|--------|
| [extracting-testable-criteria.md](references/extracting-testable-criteria.md) | 從用戶任務萃取可驗收標準的方法 | Step 1 必讀 |
| [evaluation-dimensions.md](references/evaluation-dimensions.md) | 4 大評估維度的判斷準則與範例 | Step 2 必讀 |
| [project-type-verification.md](references/project-type-verification.md) | WEB / 桌面 / CLI / 純文件的驗收手法分流 | Step 3 必讀 |
| [report-template.md](references/report-template.md) | 標準報告格式範本 | Step 4 必讀 |
| [scope-boundary.md](references/scope-boundary.md) | 與 reviewer agents 的職責邊界守則 | 遇到「這該不該管」的灰色地帶時讀 |

## 黃金原則

1. **二元判定**：PASS 就 PASS、FAIL 就 FAIL，不允許「大致達標」這種曖昧用詞
2. **對應到 criterion**：每個 FAIL 必須指出對應哪一條沒過
3. **改善建議要具體**：不寫「再仔細看看」這類空話
4. **不越界做 code review**：發現 code 品質問題，標 out-of-scope，建議 orchestrator 補派 reviewer
5. **不主動修改檔案**：只產報告，改的事交給 orchestrator 重派
