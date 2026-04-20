# Greenfield vs Incremental 判斷決策樹

doc-manager 在真正執行前，必須先判斷專案處於哪個階段，才能決定是自行執行 scaffolding 流程、還是把任務交給 `@zenbu-powers:doc-updater`。

---

## 快速判斷表

| 條件                                        | 階段           | 行動                                                        |
| ------------------------------------------- | -------------- | ----------------------------------------------------------- |
| `.claude/CLAUDE.md` 不存在                  | 前置未完成     | ⛔ 中斷，提醒用戶執行 `/init`                                |
| `.claude/CLAUDE.md` 存在 + `specs/` 不存在  | **Greenfield** | 載入本 skill references，由 doc-manager 自行執行            |
| `.claude/CLAUDE.md` + `specs/` 同時存在     | **Incremental**| 委派給 `@zenbu-powers:doc-updater`                          |
| `.claude/CLAUDE.md` 存在 + `.claude/rules/` 不存在 | 混合狀態 | 先用 scaffolding 流程補建 rules，再視 specs 狀態接續處理    |

---

## 詳細決策邏輯

```
Step 1：檢查前置
├─ `.claude/CLAUDE.md` 不存在？
│   └─ ⛔ 中斷，要求用戶先 /init
│
└─ 存在 → 繼續

Step 2：判斷主階段
├─ `specs/` 存在？
│   │
│   ├─ 是 → Incremental 階段
│   │   └─ 委派 @zenbu-powers:doc-updater
│   │       • 傳入 git log / diff 摘要
│   │       • doc-updater 自行決定更新範圍
│   │
│   └─ 否 → Greenfield 階段
│       └─ doc-manager 自行執行
│           1. 載入 references/serena-onboarding.md
│           2. 載入 references/initial-setup.md
│           3. 載入 references/templates.md
│           4. 完成後委派 clarifier + claude-manager

Step 3：Library SKILL 評估（兩階段通用）
└─ 呼叫 @zenbu-powers:lib-skill-creator 掃描依賴
    • 簡單依賴 → 略過
    • 複雜依賴 → lib-skill-creator 建立對應 SKILL

Step 4：合規審查（兩階段通用，不可跳過）
└─ 呼叫 @zenbu-powers:claude-manager 對所有產出審查
    • 🔴 必須修正 → 立即修正
    • 🟡 建議改善 → 評估後修正
    • 🟢 符合規範 → 通過
    • 最大迭代 3 次
```

---

## 啟發式補充

以下訊號可作為判斷的輔助依據（不取代上表的硬性規則）：

- **git log 歷史短**（< 3 commits）→ 偏向 greenfield
- **`.claude/rules/` 為空或只有 1 個 rule** → 偏向 greenfield
- **`specs/` 內只有 `arguments.yml` 沒有任何 `.feature`** → 視為 greenfield，需補建 specs
- **最近 3 commits 涉及多個新增檔案且無對應 spec 變更** → 即使已是 incremental 階段，也建議順便掃一遍補完

---

## 邊界情境

| 情境                                             | 處理方式                                                       |
| ------------------------------------------------ | -------------------------------------------------------------- |
| 非 git repo                                      | 跳過所有 git 相關檢查，視為 greenfield                         |
| 有 `specs/` 但內容幾乎為空                       | 走 greenfield 流程，但保留已有檔案，增量填充                   |
| 用戶明確指定「完整重建」                         | 依用戶指令走 greenfield，但執行前備份現有 specs                |
| 用戶明確指定「只同步變更」                       | 強制走 incremental，委派給 doc-updater                         |
