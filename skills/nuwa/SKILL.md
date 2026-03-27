---
name: nuwa
description: >
  Agent 工廠。根據黃金法則創建符合最佳實踐的薄殼 Agent + 配套 Skills。
  當用戶需要「建立 agent」、「新增 agent」、「create agent」、「設計 agent」、
  「agent 工廠」、「造一個 agent」時使用此 skill。
user-invocable: true
---

# /nuwa — Agent 工廠

女媧捏土造人，此 skill 捏 YAML 造 Agent。

根據 **Agent 設計黃金法則**，引導用戶完成 Agent 創建：產出一個 **< 150 行的薄殼 Agent** 與 **配套 Skill files**。

---

## 黃金法則（創建過程中隨時檢驗）

| # | 法則 | 檢驗標準 |
|---|------|---------|
| 1 | **Agent 是人設，Skill 是劇本** | Agent 只寫 WHO/WHEN/WHERE，Skill 寫 HOW/WHAT |
| 2 | **150 行紅線** | Agent body（不含 frontmatter）不得超過 150 行 |
| 3 | **一個 Agent 一個職責** | 不跨越「寫 / 審 / 部署 / 規劃」多個領域 |
| 4 | **交接協議要顯式** | 必須寫清「完成 → 交給誰」「失敗 → 怎麼處理」 |
| 5 | **回環通訊用 Agent Team** | C → B 回環只有 SendMessage 能做到，單向鏈用 subagent |

---

## 工作流程

### Phase 1：需求蒐集

使用 `/clarify-loop` 的提問格式，依序澄清以下項目（一次一題，附推薦選項）：

1. **Agent 名稱與角色** — 這個 Agent 是誰？做什麼？（例：code-reviewer、test-writer）
2. **職責邊界** — 它只做一件事嗎？如果跨越多個職責，必須建議拆分
3. **Workflow 定位** — 它在哪條流水線上？前面誰交接給它？它完成後交給誰？
4. **回環需求** — 是否需要 A → B → A 的回環？（決定用 subagent 還是 Agent Team）
5. **技術棧 / 領域** — 這個 Agent 需要什麼專業知識？（決定配哪些 skills）
6. **已有 Skills** — 檢查 `skills/` 目錄，列出可複用的現有 skills
7. **需要新 Skills** — 確認哪些知識需要新建 skill files
8. **Model 選擇** — opus（複雜推理）/ sonnet（快速執行）/ haiku（輕量任務）
9. **MCP Servers** — 是否需要 serena、playwright、notebook-lm 等 MCP 工具？
10. **Permission Mode** — default / acceptEdits / dontAsk / bypassPermissions / plan

> 可推斷的項目直接填入，不佔提問額度。最多問 10 題。

### Phase 2：設計審查

蒐集完畢後，產出設計摘要讓用戶確認：

```
## Agent 設計摘要

- **名稱**: {name}
- **角色**: {一句話描述}
- **Model**: {model}
- **MCP**: {列出 MCP servers}
- **職責**: {單一職責描述}
- **上游**: {誰交接給它} → **本 Agent** → **下游**: {它交給誰}
- **失敗處理**: {失敗時怎麼辦}

### 將使用的 Skills
- 既有: {列出}
- 新建: {列出，含簡述}

### 黃金法則自檢
- [ ] 單一職責 ✅/❌
- [ ] < 150 行 ✅（預估 ~XX 行）
- [ ] 交接協議完整 ✅/❌
- [ ] 通訊模式正確（subagent/team）✅/❌
```

**必須等用戶確認後才進入 Phase 3。**

### Phase 3：生成 Agent

依照 `references/agent-template.md` 的模板生成 Agent 檔案。

**輸出路徑**: `agents/{name}.agent.md`

**生成後立即驗證**：
1. 計算行數，確認 < 150 行
2. 檢查是否包含交接協議
3. 檢查 description 是否足夠精準（Claude 靠這個決定何時委派）
4. 檢查 skills 列表是否完整

### Phase 4：生成配套 Skills

對每個需要新建的 skill：

1. 在 `skills/{agent-name}/` 目錄下創建
2. 使用標準 frontmatter 格式
3. 將所有 HOW/WHAT 內容放入 skill
4. 依照 `references/skill-extraction-guide.md` 判斷分類

**Skill 結構**：
```
skills/{agent-name}/
  SKILL.md                    # 入口：skill 概述 + reference 索引
  references/
    {topic-a}.md              # 具體知識/流程 A
    {topic-b}.md              # 具體知識/流程 B
```

### Phase 5：最終驗證

逐條對照黃金法則，輸出驗證報告：

```
## 女媧驗收報告

### Agent: {name}.agent.md
- 總行數: XX 行 {✅ < 150 / ❌ 超標}
- 職責數: 1 {✅ 單一 / ❌ 需拆分}
- 交接協議: {✅ 完整 / ❌ 缺少}
- 通訊模式: {subagent/team} {✅ 正確 / ❌ 需調整}
- description 精準度: {✅ 可匹配 / ❌ 太模糊}

### 配套 Skills
- {skill-1}: XX 行 {✅ < 500 / ❌ 超標}
- {skill-2}: XX 行 {✅ < 500 / ❌ 超標}

### 結論: {PASS / FAIL + 原因}
```

---

## 參考文件

- `references/agent-template.md` — Agent 薄殼模板（含 frontmatter 完整欄位說明）
- `references/skill-extraction-guide.md` — Agent vs Skill 內容分類決策樹
- `references/handoff-patterns.md` — Workflow 交接模式（單向鏈 / 回環 / Hub-Spoke）
