---
name: audit-scope
description: >
  Claude Code 設定審查的 7 大範圍：CLAUDE.md、Agent、Skill、Settings、Rules、MCP、Hooks。
  每種類型包含檔案路徑、審查重點清單、notebook_query 查詢模板。
enable_by_default: true
---

# 審查範圍

依優先順序逐項審查。每種設定類型都有對應的審查重點與 notebook_query 查詢模板。

## 1. CLAUDE.md

**檔案路徑**：`CLAUDE.md`

**審查重點**：
- 結構是否清晰（分區明確、有標題層級）
- 內容密度是否適當（不過長、不過短，避免塞入整份教學）
- 是否包含專案關鍵資訊（建構指令、測試指令、程式碼風格、架構概述）
- 語氣是否面向 AI Agent（精準、指令式），而非人類教學
- 是否有過時或與程式碼不一致的內容
- 是否有不該放在 CLAUDE.md 的內容（應拆分到 `.claude/rules/` 的 glob-specific 規則）

**notebook_query 模板**：
```
審查以下 CLAUDE.md 是否符合 Claude Code 官方最佳實踐：
- CLAUDE.md 的建議用途、結構、內容密度標準是什麼？
- 哪些內容應該放在 CLAUDE.md，哪些應該拆到 .claude/rules/ 下？
- 有沒有反模式需要注意（例如太長、塞入 system prompt 風格的內容）？

以下是待審查的 CLAUDE.md 內容：
{貼上 CLAUDE.md 完整內容}
```

---

## 2. Agent 定義

**檔案路徑**：`agents/*.agent.md`

**審查重點**：
- frontmatter 格式是否正確（name、description、model 為必填）
- `name` 是否符合命名規範（lowercase, hyphens）
- `description` 是否包含足夠的自然語言觸發關鍵字
- `model` 選擇是否合理（opus 用於需要深度推理的任務，sonnet 用於常規任務，haiku 用於簡單任務）
- `mcpServers` 宣告是否必要（全域已有的 MCP 是否重複掛載）
- `skills` 引用是否存在且正確
- body 結構是否清晰，有無過度冗長
- 是否有與其他 agent 功能重疊的問題

**notebook_query 模板**：
```
審查以下 Claude Code Agent 定義是否符合官方最佳實踐：
- agent frontmatter 的格式規範（name、description、model、mcpServers、skills）
- description 的撰寫建議：如何讓 Claude 正確觸發此 agent？
- model 選擇的官方建議（opus vs sonnet vs haiku 適用場景）
- agent body 的結構建議

以下是待審查的 agent 定義：
{貼上 agent 的 frontmatter + body 前 50 行}
```

---

## 3. Skill 定義

**檔案路徑**：`skills/*/SKILL.md`、`.github/skills/*/SKILL.md`

**審查重點**：
- frontmatter 格式（name、description、user-invocable 等）
- `description` 是否包含觸發關鍵字
- SKILL.md 是否控制在合理行數內
- 是否善用 `$ARGUMENTS` 做動態替換
- 大型內容是否正確拆分至 `references/` 子目錄
- `allowed-tools` 是否適當限制
- 內容是否面向 AI Agent（精準密集），而非人類教學

**notebook_query 模板**：
```
審查以下 Claude Code Skill 定義是否符合官方最佳實踐：
- SKILL.md frontmatter 的格式規範（name、description、user-invocable、allowed-tools 等）
- description 的觸發機制：如何寫才能讓 Claude 正確辨識並啟用？
- SKILL.md 的行數限制與內容組織建議
- $ARGUMENTS 的使用方式與最佳實踐
- references/ 子目錄的拆分時機與引用方式

以下是待審查的 SKILL 定義：
{貼上 SKILL.md frontmatter + 前 50 行}
```

---

## 4. Claude 設定

**檔案路徑**：`.claude/settings.json`、`.claude/settings.local.json`

**審查重點**：
- 權限設定是否合理（allowedTools、blockedTools）
- 是否有過度寬鬆的權限（如允許所有 Bash 指令）
- 安全性設定是否適當
- 是否有廢棄或無效的設定項

**notebook_query 模板**：
```
審查以下 Claude Code settings.json 是否符合官方最佳實踐：
- settings.json 支援哪些設定項？各自的用途與建議值是什麼？
- allowedTools / blockedTools 的權限安全建議
- 專案層級 vs 用戶層級設定的區分原則
- 有哪些常見的設定錯誤或反模式？

以下是待審查的 settings.json 內容：
{貼上 settings.json 完整內容}
```

---

## 5. 專案規則

**檔案路徑**：`.claude/rules/*.md`

**審查重點**：
- 每個 rule 檔案是否有 `globs` frontmatter（指定適用檔案範圍）
- rule 內容是否與 CLAUDE.md 衝突或重複
- rule 是否太過通用（應放在 CLAUDE.md）或太過具體（應放在程式碼註解）
- 命名是否語義化

**notebook_query 模板**：
```
審查以下 Claude Code Rules 設定是否符合官方最佳實踐：
- .claude/rules/*.md 的格式規範（globs frontmatter 的用法）
- Rules 與 CLAUDE.md 的分工原則
- Rules 的命名建議與內容組織
- 常見的 Rules 反模式

以下是待審查的 Rules 檔案列表與內容：
{貼上所有 rules 檔案名與 frontmatter}
```

---

## 6. MCP 設定

**檔案路徑**：`.mcp.json`

**審查重點**：
- MCP server 設定格式是否正確（type、command、args、env）
- 環境變數是否有硬編碼敏感資訊（API Key、Token 應使用 env 引用）
- server 指令路徑是否正確
- 是否有未使用或重複的 MCP server
- stdio vs sse 類型是否正確使用

**notebook_query 模板**：
```
審查以下 Claude Code MCP 設定是否符合官方最佳實踐：
- .mcp.json 的格式規範與支援的設定項
- MCP server 的 type（stdio / sse）適用場景
- 環境變數的安全處理方式
- 常見的 MCP 設定錯誤

以下是待審查的 .mcp.json 內容：
{貼上 .mcp.json 完整內容}
```

---

## 7. Hooks 設定

**檔案路徑**：`.claude/hooks.json`

**審查重點**：
- hook 事件類型是否正確（PreToolUse、PostToolUse、Notification 等）
- hook 指令是否安全（不應有破壞性指令）
- hook 是否有合理的超時設定
- 是否有不必要的 hook 影響效能

**notebook_query 模板**：
```
審查以下 Claude Code Hooks 設定是否符合官方最佳實踐：
- hooks.json 支援哪些事件類型？各自的觸發時機是什麼？
- hook 指令的安全性建議
- hook 的效能影響與超時設定
- 常見的 Hooks 反模式

以下是待審查的 hooks.json 內容：
{貼上 hooks.json 完整內容}
```

---

## 特殊場景處理

### 審查 Agent 的 model 選擇

model 選擇需要理解 agent 的用途才能判斷，參考以下指引：

| model | 適用場景 |
|-------|---------|
| `opus` | 需要深度推理、複雜分析、跨多檔案理解的任務 |
| `sonnet` | 常規開發、程式碼生成、文件更新等日常任務 |
| `haiku` | 簡單查詢、格式化、分類等輕量任務 |

### 審查 Agent 的 mcpServers

- 如果 MCP server 已在全域 `.mcp.json` 中設定，agent 中的 `mcpServers` 宣告可能是多餘的
- 但某些 agent 明確需要特定 MCP（如 `serena` 用於程式碼分析），此時宣告是合理的
- 對照全域 `.mcp.json` 與 agent 的 `mcpServers`，檢查是否有不必要的重複

### 審查 CLAUDE.md vs Rules 的分工

- **CLAUDE.md**：全專案通用的資訊（建構指令、架構概述、程式碼風格）
- **Rules**：針對特定檔案類型的規則（透過 `globs` 限定適用範圍）
- 如果 CLAUDE.md 中有只適用於特定檔案類型的規則，建議遷移到 `.claude/rules/`
