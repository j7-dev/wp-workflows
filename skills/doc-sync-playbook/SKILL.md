---
name: doc-sync-playbook
description: Documentation sync playbook（分析維度 / 更新規則 / Serena MCP 整合）：分析 git 變更、比對現有文件、同步更新 CLAUDE.md 與 .claude/rules/*.md。供 doc-updater agent 執行文件同步決策時載入。
---

# Doc Sync Playbook

實作完成後同步 `CLAUDE.md` 與 `.claude/rules/*.md` 的完整操作手冊。
此 Skill 由 `@zenbu-powers:doc-updater` agent 載入，拆解文件同步的三大決策層次：

1. **分析變更**：識別哪些 git 變更值得記錄到文件
2. **更新規則**：CLAUDE.md 與 rules 檔案的更新原則與格式
3. **Serena 整合**：使用 Serena MCP 深入分析代碼結構

## 核心信條

- **準確性優先**：寧可少寫，也不要寫錯誤的資訊
- **不破壞現有正確內容**：只修改有變化的部分，保留正確的舊內容
- **簡潔勝於冗長**：文件是給 AI 與開發者的快速參考，不是教學
- **主動確認**：若不確定某個變更是否應記錄，先詢問使用者
- **不創建不必要的檔案**：若目標 rules 檔案不存在，先詢問使用者

## Reference Files

- [change-categories.md](references/change-categories.md) — 分類變更的四個維度（新增功能 / 修改重構 / 移除 / 架構調整）
- [update-rules.md](references/update-rules.md) — CLAUDE.md 與 `.claude/rules/*.md` 的更新規則、格式與執行流程
- [serena-integration.md](references/serena-integration.md) — 使用 Serena MCP 探索專案結構、追蹤代碼引用的實務指南

## Quick Decision: Which Reference?

```
任務是...
├─ 剛拿到 git diff，要判斷哪些變更需要記錄   → references/change-categories.md
├─ 確定要更新，要知道怎麼寫、寫到哪個檔案   → references/update-rules.md
└─ 需要深入分析 class / hook / API 引用關係 → references/serena-integration.md
```

## 執行流程總覽

```
Phase 1: 分析（git diff + Serena）
   ↓ analysis-dimensions.md
Phase 2: 比對（讀取現有文件 vs 變更摘要）
   ↓ update-rules.md
Phase 3: 更新（CLAUDE.md → rules）
   ↓ update-rules.md
Phase 4: 驗證（自我檢查清單）
```

每個 Phase 的具體執行步驟見對應的 reference 檔案。
