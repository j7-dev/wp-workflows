# 文件標準模板

本 reference 提供 greenfield 流程所需的所有文件模板。使用時依實際內容填充，**嚴禁保留 `{占位符}`**。

---

## 1. `.claude/CLAUDE.md` 模板

```markdown
# {專案名稱}

{一句話專案定位：這是什麼、解決什麼問題}

---

## 技術棧

| 類別       | 選擇                    | 版本          |
| ---------- | ----------------------- | ------------- |
| Runtime    | {Node.js / PHP / Python}| {x.y.z}       |
| 框架       | {React / Laravel / ...} | {x.y.z}       |
| 資料庫     | {MySQL / PostgreSQL}    | {x.y}         |
| ORM / DB   | {Drizzle / Eloquent}    | {x.y.z}       |
| 測試       | {Jest / PHPUnit}        | {x.y.z}       |
| 建置       | {Vite / Webpack}        | {x.y.z}       |

（版本**必須**從 lock file / 設定檔讀取，不可猜測）

---

## 架構概覽

```
{專案根}/
  ├── src/
  │   ├── {主要目錄 1}/    # {一句話職責}
  │   ├── {主要目錄 2}/    # {一句話職責}
  │   └── ...
  ├── tests/               # {測試策略}
  ├── specs/               # BDD 規格（由 /aibdd-discovery 管理）
  └── .claude/             # Claude Code 文件
```

---

## 開發慣例

- **命名**：{camelCase / snake_case / PascalCase}
- **測試**：{TDD / BDD / 純單元測試}；覆蓋率目標 {XX%}
- **Commit**：{Conventional Commits / 自訂格式}
- **分支**：{Git Flow / Trunk-based}

---

## 關鍵檔案索引

- `{入口檔路徑}` — {作用}
- `{核心設定檔}` — {作用}
- `{關鍵模組入口}` — {作用}

---

## 既有工具

- `.claude/rules/` — 語言/框架層級規則
- `.claude/skills/` — Library 與工作流 skills
- `specs/` — BDD 規格與便條紙

---

## 快速上手（For AI Agents）

1. 先讀本檔
2. 讀 `.claude/rules/*.rule.md`
3. 讀 `specs/` 了解業務
4. 需要時載入 `.claude/skills/{相關 skill}`
```

---

## 2. `.claude/rules/*.rule.md` 模板

```markdown
---
globs: {具體 glob，如 **/*.ts,**/*.tsx}
description: {該 rule 一句話說明}
---

# {技術棧} 開發規則

## 命名慣例

- {檔案命名}：{範例}
- {變數/函式}：{範例}
- {類別}：{範例}

---

## 架構規則

- {目錄結構規範}
- {分層職責}
- {禁止的跨層引用}

---

## 測試要求

- {測試檔位置}
- {測試命名}
- {覆蓋率要求}

---

## 禁止事項

- 禁止 {anti-pattern 1}：{原因}
- 禁止 {anti-pattern 2}：{原因}

---

## 範例參考

- 好的範例：`{檔案路徑}`
- 壞的範例（已重構）：`{commit hash}`
```

**重點**：
- `globs` 是 rule **自動生效**的條件，必填
- 內容**必須**來自實際代碼觀察，不是通用知識
- 每個 rule 檔 **不超過 300 行**

---

## 3. `.claude/skills/{lib}-v{ver}/SKILL.md` 模板

Library SKILL 由 `@zenbu-powers:lib-skill-creator` 自動產出，本 skill 不直接寫。但 doc-manager 在驗證時需確認格式：

```markdown
---
name: {library-name}-v{major}
description: {一句話說明：這個 SKILL 何時被觸發}
---

# {Library Name} v{Version}

{簡述}

## 安裝

{安裝指令}

## 核心 API

### {API 1}

{簽名 + 範例}

### {API 2}

{簽名 + 範例}

## 常見 Pattern

- {Pattern 1}
- {Pattern 2}

## 常見陷阱

- {陷阱 1}
- {陷阱 2}
```

---

## 4. `specs/arguments.yml` 模板（若專案使用 aibdd）

由 `@zenbu-powers:aibdd-kickoff` 互動產出，doc-manager 不直接建立，但可偵測：

```yaml
project_name: {name}
tech_stack:
  backend: {python-e2e / java-e2e / csharp-it / python-ut / nodejs-it / php-it}
  frontend: {nextjs / react-vite / none}
test_strategy: {E2E / IT / UT}
paths:
  features: {specs/features/}
  backend_src: {backend/src/}
  frontend_src: {frontend/src/}
```

---

## 5. `.claude/settings.json` 最小範本（若不存在）

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(ls:*)",
      "Bash(git status:*)"
    ]
  }
}
```

---

## 模板共通守則

1. **不留占位符**：交付時 `{XXX}` 必須被具體內容取代
2. **版本精確**：從 lock file 讀取，不猜
3. **面向 AI Agent**：精準、密集、無鋪墊
4. **行數控制**：CLAUDE.md < 500、rule < 300、SKILL < 不限（但 references 分散）
5. **禁止捏造**：所有示例、路徑、API **必須**來自專案實際代碼
