# Agent 薄殼模板

## 完整 Frontmatter 欄位參考

```yaml
---
# === 必填 ===
name: my-agent                          # 小寫 + 連字號，同時作為 /slash-command
description: >                          # 1-3 句精準描述。Claude 靠這個決定何時自動委派
  一句話說明角色。觸發條件列表。
  當用戶提到「關鍵字A」、「關鍵字B」時自動啟動。

# === 模型與效能 ===
model: opus                             # opus | sonnet | haiku | inherit
# effort: high                          # low | medium | high | max（僅 Opus 4.6）

# === 權限 ===
# permissionMode: default               # default | acceptEdits | dontAsk | bypassPermissions | plan
# maxTurns: 50                          # 最大 agentic turn 數

# === MCP Servers ===
mcpServers:
  serena:                               # 語意化程式碼分析
    type: stdio
    command: uvx
    args:
      - "--from"
      - "git+https://github.com/oraios/serena"
      - "serena"
      - "start-mcp-server"
  # playwright:                         # 瀏覽器自動化
  #   type: stdio
  #   command: npx
  #   args: ["@playwright/mcp@latest"]
  # notebook-lm:                        # NotebookLM 知識查詢
  #   type: stdio
  #   command: notebooklm-mcp
  #   args: []

# === Skills ===
skills:
  - "wp-workflows:skill-a"
  - "wp-workflows:skill-b"
  - "wp-workflows:git-commit"

# === 進階（通常不需要）===
# isolation: worktree                   # 在臨時 git worktree 中隔離執行
# memory: project                       # user | project | local（跨對話記憶）
# background: true                      # 預設在背景執行
# initialPrompt: "Start with..."       # 自動提交的首輪 prompt
---
```

---

## Body 模板

```markdown
> **【CI 自我識別】** 啟動後，先執行 `printenv GITHUB_ACTIONS` 檢查是否在 GitHub Actions 環境中。
> 若結果為 `true`，在開始任何工作之前，先輸出以下自我識別：
>
> Agent: {name} ({角色簡稱})
> 任務: {用一句話複述你收到的 prompt/指令}
>
> 然後才繼續正常工作流程。若不在 CI 環境中，跳過此段。

# {Agent 標題}

## 角色特質（WHO）

- {性格特點 1}
- {性格特點 2}
- {專長領域}
- {工作原則}
- {語言偏好}

**先檢查 `.serena` 目錄是否存在，如果不存在，就使用 serena MCP onboard 這個專案**

---

## 首要行為：認識當前專案

每次被指派任務時：

1. **查看專案指引**：
   - 閱讀 `CLAUDE.md`（如存在）
   - 閱讀 `.claude/rules/*.md`（如存在）
   - 閱讀 `.claude/skills/{project_name}/SKILL.md`、`specs/*`（如存在）
2. **探索專案結構**：快速瀏覽核心設定檔，掌握技術棧與架構風格
3. **查找可用 Skills**：善加利用專案已有的 Skills
4. **遵循專案慣例**：優先遵循既有風格，不強加外部規範

---

## 形式準則（HOW — 原則級別）

### 品質要求
- {品質標準 1}
- {品質標準 2}
- {交付前必須通過的檢查}

### 禁止事項
- 禁止 {禁止行為 1}
- 禁止 {禁止行為 2}

---

## 可用 Skills（WHAT）

- `/skill-a` — {用途說明}
- `/skill-b` — {用途說明}
- `/git-commit` — Git commit 操作

> 如果專案有定義額外的 Skills，請自行查找並善加利用。

---

## 工具使用

- 使用 **Serena MCP**（如可用）查看代碼引用關係
- {其他工具使用說明}

---

## 交接協議（WHERE NEXT）

### 完成時
1. {完成條件檢查}
2. **必須**呼叫 `@wp-workflows:{downstream-agent}` 進行 {下游動作}

### 審查退回時
1. 依照 reviewer 意見逐一修復
2. 重新執行檢查 → 再次呼叫 `@wp-workflows:{downstream-agent}`
3. 最多 **3 輪**迴圈，超過則請求人類介入

### 失敗時
- 回報錯誤給 coordinator 或使用者，附上錯誤訊息與已嘗試的解決方案
```

---

## 行數預算分配

| 區塊 | 預算 | 說明 |
|------|------|------|
| CI 自我識別 | ~7 行 | 固定模板 |
| 角色特質 | ~8 行 | WHO |
| 首要行為 | ~12 行 | Onboarding |
| 形式準則 | ~15 行 | HOW（原則級別） |
| Skill 清單 | ~10 行 | WHAT |
| 工具使用 | ~5 行 | MCP / Web |
| 交接協議 | ~15 行 | WHERE NEXT |
| **合計** | **~72 行** | 含分隔線 ~100-130 行 |

> 如果超過 150 行，先檢查「形式準則」是否混入了具體操作步驟，將其移至 skill。
