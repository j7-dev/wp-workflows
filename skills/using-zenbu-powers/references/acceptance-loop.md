---
name: acceptance-loop
description: Acceptance evaluation 完整規格——dispatch 規格、Agent Loop 細節、驗收責任邊界、evaluator 判定條件、與 reviewer agents 的職責邊界。當執行 acceptance evaluation 或 agent loop FAIL 處理時載入。
---

# Acceptance Evaluation 完整規格

## Dispatch 規格

派 `@zenbu-powers:acceptance-evaluator` 時，prompt 必須含：

1. 用戶原始任務需求摘要（避免 evaluator 失焦）
2. 可驗收的具體標準（testable criteria）—— 從用戶任務萃取；未提供時 evaluator 會自行推導並標明來源
3. 待評估的 agent 產出與產物路徑
4. 上游 sub-agent 的回報摘要（如有）

**缺任一項時，重新組織 prompt 後再 dispatch，不要傳空值。**

## Agent Loop（FAIL 回饋路徑）

evaluator 判定 FAIL → 主窗口讀報告 → 依不達標項目重派原 agent（傳遞 evaluator 的具體缺陷清單）→ 修正後再 spawn evaluator 複審。

**最多 3 輪。** 第 3 輪仍 FAIL 時主動升級用戶，格式：

> 已迭代 3 輪未達標。問題：[TOP 缺陷]。建議方向：A. {方案}、B. {方案}、C. {方案}，請使用者裁決。

**在 PASS 之前，不得將 agent 產出直接回報用戶**——這是核心紀律。

## 驗收責任邊界（Who Verifies What）

驗收責任屬於 **orchestrator + agent loop**，不可轉嫁給用戶。

- **evaluator 未 PASS** → 主窗口自行 loop（重派原 agent → 再 evaluate）直到 PASS，**不得詢問用戶代為驗收**
- **evaluator PASS 後** → 才向用戶呈現成果，邀請用戶做最終確認（可選）
- **3 輪 FAIL 升級** → 走前述 FAIL 升級格式，請使用者裁決方向；這是「請用戶決策」而非「請用戶驗收」

**禁止行為**（在 evaluator 尚未 PASS 時）：

- ❌ 「成果交給你，麻煩看一下對不對」
- ❌ 「你幫我驗證一下這樣有沒有符合需求」
- ❌ 「不確定有沒有 cover 完整，你檢查看看」
- ❌ 「方案 A/B/C 你想用哪個」（除屬「用戶獨有資訊」窄門外）

這類話術 = 把 evaluator 的責任偷塞給用戶。**用戶只該做最終確認，不該做品質把關，更不該被當成決策代工**——品質把關是 `@zenbu-powers:acceptance-evaluator` 與 orchestrator 的工作，技術選擇是 sub-agent 與 orchestrator 的責任。

## Evaluator 判定條件（補強）

`@zenbu-powers:acceptance-evaluator` 在意圖對齊評估時，**以下情況一律判 FAIL**：

- Sub-agent 報告中將技術選擇丟給用戶（「方案 A/B/C 請選」）→ 任務未完成
- Sub-agent 未做出明確決策、未說明 trade-off → 自主決策授權違反
- Orchestrator 在 evaluator dispatch 之前已將選擇題轉發給用戶 → 流程違反

evaluator 偵測到此類情況時，FAIL 報告中標明「**自主決策違反**」，主窗口須重派 agent 並在 prompt 中強制要求自選一個方案。

輕量任務（orchestrator 自 eval）同樣適用：自評未 PASS 前不得詢問用戶驗收。

## 與 reviewer 的職責邊界

`@zenbu-powers:acceptance-evaluator` 與 `*-reviewer` agents **正交不重疊**：

- **acceptance-evaluator** 審：用戶意圖對齊、需求覆蓋度、邊界完整性、off-topic 偵測、基本可用門檻
- **`*-reviewer`** 審：code 品質、最佳實踐、安全、效能

evaluator 在意圖對齊評估中若發現 reviewer 該抓但漏掉的品質問題，會在「Out-of-Scope 觀察」標示，主窗口可酌情補派 reviewer 二審該局部，不影響本輪 PASS/FAIL 判定。

WEB / 桌面 / CLI / 純文件等不同專案類型的驗收手法分流，由 evaluator 依 `zenbu-powers:acceptance-evaluation` skill 自動處理。
