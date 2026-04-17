---
name: prompt-optimization
description: AI 提示詞優化與轉換 playbook：優化模式（診斷問題、改善）與轉換模式（改變用途、保留核心）。供 prompt-optimizer agent 載入。
---

# Prompt Optimization Playbook

AI 提示詞的雙模式改寫 playbook。本 skill 不直接由使用者觸發，而是由 `prompt-optimizer` agent 判斷模式後載入對應章節。

---

## 兩種改寫模式

| 模式 | 何時使用 | 核心思路 | 參考 playbook |
|------|---------|---------|---------------|
| **優化模式**（Mode 1） | 用戶想改善既有提示詞 | 診斷 + 修復（像 code review 找 bug） | [optimization-playbook.md](references/optimization-playbook.md) |
| **轉換模式**（Mode 2） | 用戶想改變用途／平台 | 萃取精華 → 研究目標 → 移植邏輯 | [conversion-playbook.md](references/conversion-playbook.md) |

---

## 共用資源

- **診斷框架（常見問題模式清單）**：[diagnostic-framework.md](references/diagnostic-framework.md)
- **Before / After 實例對照**：[before-after-examples.md](references/before-after-examples.md)

---

## 使用指引

1. Agent 偵測模式後，依模式 Read 對應的 playbook（optimization 或 conversion）。
2. 執行診斷步驟時，Read [diagnostic-framework.md](references/diagnostic-framework.md) 做為 checklist。
3. 需要具體寫法參考時，Read [before-after-examples.md](references/before-after-examples.md)。
4. 遇到歧義時，必須透過主動提問機制回來與用戶對焦（詳見 optimization-playbook 與 conversion-playbook 的「主動提問」章節）。

---

## 輸出格式速查

- **Mode 1 輸出**：原始解析 → 診斷問題（依嚴重度）→ 邊界情境 → 優化後提示詞 → 變更日誌表
- **Mode 2 輸出**：原始解析 → 目標情境調查 → 預判轉換問題 → 轉換後提示詞 → 轉換對照表

完整模板請見各自的 playbook。
