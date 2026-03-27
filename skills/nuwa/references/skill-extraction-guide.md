# Agent vs Skill 內容分類決策樹

## 快速判斷：這段內容該放哪裡？

```
這段內容是...

├─ 描述「你是誰」（角色、性格、原則）
│   → 放 Agent
│
├─ 描述「何時啟動」（觸發條件）
│   → 放 Agent frontmatter.description
│
├─ 描述「交給誰」（交接對象、失敗處理）
│   → 放 Agent
│
├─ 描述「用什麼工具」（MCP、Skills 清單）
│   → 放 Agent
│
├─ 描述「原則級別的品質要求」（如 "禁止 any"、"必須通過 lint"）
│   → 放 Agent
│
├─ 描述「怎麼做」（step-by-step 流程）
│   → 放 Skill ★
│
├─ 包含程式碼範例（do/don't patterns）
│   → 放 Skill ★
│
├─ 包含技術棧細節（API reference、framework 用法）
│   → 放 Skill ★
│
├─ 包含決策邏輯樹（if X then Y else Z）
│   → 放 Skill ★
│
├─ 包含驗證規則清單（review checklist）
│   → 放 Skill ★
│
└─ 包含模板或範本（output template）
    → 放 Skill ★
```

---

## 詳細分類表

### 留在 Agent（WHO / WHEN / WHERE）

| 內容類型 | 範例 | 行數預算 |
|---------|------|---------|
| 角色身份 | 「你是一位 10 年經驗的 React 工程師」 | ~5 行 |
| 性格特質 | 「對品質要求極高，遵循 SOLID 原則」 | ~5 行 |
| 原則級別準則 | 「TypeScript strict mode，禁止 any」 | ~10 行 |
| 禁止事項 | 「禁止跳過測試」「禁止自訂 fetch」 | ~5 行 |
| Skill 清單 | 「`/react-coding-standards` — 編碼規範」 | ~10 行 |
| 交接協議 | 「完成 → @reviewer」「失敗 → 回報 coordinator」 | ~15 行 |
| 啟動行為 | 「讀取 CLAUDE.md、探索專案結構」 | ~10 行 |

### 移到 Skill（HOW / WHAT）

| 內容類型 | 範例 | 建議 Skill 名稱 |
|---------|------|----------------|
| 開發規則 + 程式碼範例 | Rule 1: 使用 strict mode... `❌ bad` `✅ good` | `{agent}-dev-rules` |
| 技術棧參考 | React 18 + Vite + Ant Design 完整配置 | `{agent}-tech-stack` 或複用既有 |
| 操作流程 | Phase 1: 讀取需求 → Phase 2: 設計... | `{agent}-workflow` |
| Review Checklist | 安全性 10 項、效能 8 項、可讀性 6 項 | `{agent}-review-criteria` |
| 測試指引 | PHPUnit 設定、test pattern 範例 | `{agent}-testing` |
| 除錯指引 | 常見錯誤 + 解法 | `{agent}-debugging` |
| 輸出模板 | 報告格式、diff 格式 | `{agent}-output-format` |
| 錯誤處理表 | 情境 → 錯誤 → 解法 mapping | 合併至 workflow skill |

---

## 邊界案例

### Q: 技術棧列表（如 React 18 + Vite + Ant Design）放哪裡？

**A:** 分兩層：
- **Agent**: 一行式摘要（`核心：React 18、TypeScript 5+`）→ 讓 Agent 知道自己的技術範圍
- **Skill**: 完整配置細節、版本要求、整合模式 → 實際開發時查閱

### Q: 「禁止使用 any」算原則還是規則？

**A:** 原則。一句話能說清楚的留在 Agent。
如果需要附帶 5 個程式碼範例解釋為什麼 → 範例部分移到 Skill。

### Q: 品質 Gate（交付前必須通過 tsc + eslint + test）放哪裡？

**A:** Gate 本身（一行式清單）留在 Agent。
Gate 的詳細執行步驟和錯誤處理 → 移到 Skill。

### Q: Skill 太小（< 30 行）值得獨立嗎？

**A:** 不值得。合併到相近的 skill（如 testing + debugging 合併為 `dev-workflow`）。
獨立 skill 的最小建議行數：50 行。

### Q: 已存在的全域 Skill（如 react-coding-standards）涵蓋了部分內容？

**A:** 直接複用，不要重複建立。在 Agent 的 skills 列表中引用即可。
只有全域 skill 未涵蓋的部分才建新的 agent-specific skill。
