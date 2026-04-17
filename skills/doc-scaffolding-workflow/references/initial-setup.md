# 全新專案文件初始化流程

當 `decision-tree.md` 判定為 **Greenfield** 階段時，執行本流程。

前提：`.claude/CLAUDE.md` 已由 `/init` 建立、Serena MCP 已完成 onboarding（見 `serena-onboarding.md`）。

---

## Step 1：全面讀取原始碼（嚴禁跳過）

### 1-1 取得專案全景

```
呼叫 mcp__serena__list_dir（relative_path="."，recursive=true）
識別：
  • 入口檔（main, index, bootstrap, plugin-main）
  • 設定檔（*.json, *.toml, *.yml, *.env.example）
  • 核心模組目錄
  • 測試目錄
```

### 1-2 按優先順序逐檔讀取

```
優先順序：
  1. 入口檔 + 設定檔（掌握技術棧與架構）
  2. 核心模組（掌握主要業務邏輯）
  3. 公開 API / 匯出介面（掌握對外契約）
  4. 測試檔（掌握預期行為）
  5. 工具與輔助檔（補細節）
```

**對每個檔案記錄**：
- 職責（一句話）
- 匯出介面（class / function / hook / component）
- 依賴關係（import / use 了哪些其他模組）
- 關鍵 pattern（設計模式、命名慣例、架構風格）

### 1-3 大型專案（> 500 檔案）策略

- 先讀目錄結構概覽 + 每個目錄的 1-2 個代表檔
- 識別「重複性高」的目錄（如 `components/`、`routes/`），抽樣讀取即可
- 主要花時間在「骨幹檔案」而非鋪墊檔

---

## Step 2：補強 `.claude/CLAUDE.md`

`/init` 通常只建立骨架；本步驟用實際讀到的代碼補完細節。

### 2-1 必備章節（參見 `templates.md`）

1. **專案定位**：一句話說清楚這是什麼
2. **技術棧**：從 lock file / 設定檔精確讀取版本
3. **架構概覽**：主要目錄 + 每個目錄的職責（1 行）
4. **開發慣例**：命名、測試、分支、commit 風格
5. **關鍵檔案索引**：指向最該讀的 3-5 個檔案
6. **既有工具與 Skills**：指向 `.claude/rules/` 與 `.claude/skills/`

### 2-2 撰寫原則

- 每個技術細節**必須**來自實際讀到的代碼
- 不確定的內容 → 標注 `[待確認]`
- 單一 CLAUDE.md **不超過 500 行**；超過就拆到 rules 或 SKILL
- 面向 AI Agent：精準、密集、無鋪墊

---

## Step 3：建立 `.claude/rules/*.rule.md`（按技術棧分類）

### 3-1 偵測技術棧 → 生成對應 rule

| 偵測到的技術棧     | 生成的檔案                                                 |
| ------------------ | ---------------------------------------------------------- |
| React / TypeScript | `.claude/rules/react.rule.md`（globs: `**/*.ts,**/*.tsx`） |
| WordPress / PHP    | `.claude/rules/wordpress.rule.md`（globs: `**/*.php`）     |
| Vue / Nuxt         | `.claude/rules/vue.rule.md`（globs: `**/*.vue,**/*.ts`）   |
| Go                 | `.claude/rules/go.rule.md`（globs: `**/*.go`）             |
| Python             | `.claude/rules/python.rule.md`（globs: `**/*.py`）         |
| Node.js（通用）    | `.claude/rules/nodejs.rule.md`（globs: `**/*.js,**/*.ts`） |
| C# / .NET          | `.claude/rules/csharp.rule.md`（globs: `**/*.cs`）         |

每個 rule 檔**必須**有 `globs` frontmatter（見 `templates.md`）。

### 3-2 Rule 內容

每個 rule 應包含：
- 該語言/框架特有的命名慣例
- 架構/分層規則（如 hook / component 放哪）
- 測試要求（若有）
- 禁止事項（從代碼中看到的 anti-pattern）
- 每個 rule 檔**不超過 300 行**，超過就再細分

---

## Step 4：Specs 草稿（交給 clarifier 完善）

### 4-1 從代碼提取規格資訊

從已讀的代碼中識別：
- 業務邏輯（class、service、handler）
- 資料模型（entity、schema、DB table）
- API 端點（REST、GraphQL、CLI 指令、WordPress hook）
- 業務規則（validator、constraint、pre/postcondition）

### 4-2 標記便條紙

凡是**無法從代碼直接佐證**的資訊，標為便條紙 `[便條紙: XXX]`：
- 預期的用戶旅程
- 性能/安全目標
- 非功能性需求

便條紙**必須**能從代碼中找到佐證位置，否則改標 `[待確認]`。

### 4-3 委派 clarifier

```
呼叫 @wp-workflows:clarifier
傳入：
  • specs 草稿路徑
  • 已識別的便條紙清單
讓 clarifier 透過 discovery / clarify-loop 完善
```

---

## Step 5：Library SKILL 評估

```
呼叫 @wp-workflows:lib-skill-creator
傳入：專案根目錄路徑
讓 lib-skill-creator 掃描：
  • package.json（dependencies，忽略 devDependencies）
  • composer.json（require，忽略 require-dev）
  • pyproject.toml（[project.dependencies]）
  • go.mod（require）
自動建立對應 SKILL 至 .claude/skills/
```

---

## Step 6：合規審查（必須執行，不可跳過）

```
呼叫 @wp-workflows:claude-manager
傳入：
  • .claude/CLAUDE.md
  • .claude/rules/*.rule.md
  • .claude/skills/*/SKILL.md
  • .claude/settings.json（若存在）
  • .mcp.json（若存在）
最大迭代 3 輪，超過則呈現剩餘問題給用戶
```

---

## 回報格式（每步完成時）

```
✅ Step {N}：{步驟名}
- 模式：Greenfield
- 已處理：{具體產出}
- 發現：{關鍵 finding}
```

全流程完成後產出總結報告（見 `SKILL.md` 或 doc-manager body 的總結模板）。
