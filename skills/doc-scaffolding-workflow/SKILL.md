---
name: doc-scaffolding-workflow
description: 文件初建 playbook：全新專案 CLAUDE.md / rules / specs 的建立流程與模板。供 doc-manager agent 在 greenfield 場景載入。
---

# Doc Scaffolding Workflow — 文件初建 Playbook

本 skill 是 **Greenfield 場景**（全新或未經文件化的專案）的文件建立流程總覽。

當 `@zenbu-powers:doc-manager` 判定為 greenfield（`.claude/CLAUDE.md` 存在但 `specs/` 不存在；或透過其他啟發式判斷）時，載入本 skill 並依 references/ 順序執行。

---

## 核心原則

1. **面向 AI Agent 撰寫**：語氣精準、資訊密集、省略入門解說。目標讀者是其他 AI Agent，不是人類初學者。
2. **嚴禁捏造內容**：所有寫入文件的技術細節必須來自實際讀取的代碼。不確定的內容標注 `[待確認]`。
3. **嚴禁跳過任何檔案**：使用 serena MCP 讀取時，每一個原始碼檔案都必須實際讀取。
4. **依賴版本必須準確**：從 lock file 或設定檔讀取，不可猜測。
5. **單一 CLAUDE.md 不超過 500 行**、**每個 rules 檔案不超過 300 行**，過長就拆分。

---

## 執行流程（高層次）

```
Step A：判斷階段（references/decision-tree.md）
  → 確認走 greenfield 還是 incremental

Step B：Serena Onboarding（references/serena-onboarding.md）
  → 確保語意化閱讀環境就緒

Step C：初始化主文件（references/initial-setup.md）
  → CLAUDE.md 補強 + rules 建立 + specs 草稿

Step D：套用標準模板（references/templates.md）
  → 確保所有文件符合 Claude Code 規範
```

---

## References 索引

| 檔案                             | 時機                        | 內容                                                                  |
| -------------------------------- | --------------------------- | --------------------------------------------------------------------- |
| `references/decision-tree.md`    | 流程開始前                  | greenfield vs incremental 判斷決策樹                                  |
| `references/serena-onboarding.md`| Step 0                      | `.serena` 目錄檢查 + MCP onboarding 實務                              |
| `references/initial-setup.md`    | Step 1（主流程）            | 逐檔讀 → CLAUDE.md 補強 → rules 建立 → specs 草稿                     |
| `references/templates.md`        | Step 1 / Step 3             | CLAUDE.md、rule.md、SKILL.md 等標準模板                               |

---

## 關鍵交接點

- **Library SKILL**：scaffolding 過程中若發現複雜依賴，委派 `@zenbu-powers:lib-skill-creator`。
- **Specs 完善**：specs 草稿完成後，委派 `@zenbu-powers:clarifier` 進行 discovery / clarify-loop。
- **合規審查**：所有文件就緒後，由 doc-manager 呼叫 `@zenbu-powers:claude-manager` 做合規審查。
- **Incremental 場景**：本 skill 不負責增量更新；該場景由 doc-manager 直接委派給 `@zenbu-powers:doc-updater` agent。

---

## 錯誤處理簡表

| 情境                         | 處理方式                                           |
| ---------------------------- | -------------------------------------------------- |
| serena MCP 不可用            | 降級為 bash/Read 工具逐一讀取檔案，警告效率下降     |
| `.serena` onboarding 失敗    | 報告錯誤，繼續使用 bash 方式讀取                    |
| 專案過大（>500 檔案）        | 先取目錄結構概覽，再依優先順序讀取（入口→設定→核心）|
| 依賴檔案不存在               | 跳過 library SKILL 評估，在報告中標注               |
| 便條紙無法從代碼解答         | 標注為 `[待確認]`，列出需用戶釐清的項目             |
