# WordPress Plugin — Claude Code Plugin

> 專為 WordPress 開發設計的 Claude Code Plugin，內建 **SessionStart hook** 在每次 session 開始時自動注入 orchestrator 心法，搭配完整的 Agent、Skill 與 MCP Server 設定，大幅提升 WordPress 外掛、主題、區塊開發的 AI 輔助效率。

**v2.0.0** — 新增 SessionStart hook 基礎設施與 `using-wp-workflows` / `brainstorming` / `dispatching-parallel-agents` 三個核心 skill（方法論承襲自 [obra/superpowers](https://github.com/obra/superpowers)，在地化為 WP/React/AIBDD 場景）。

## 安裝方式

### 從 Marketplace 安裝

```bash
claude plugin marketplace add j7-dev/wp-workflows
claude plugin install wp-workflows
```

### 從本地目錄安裝

```bash
claude plugin install ./wp-workflows
```

### 更新 Plugin

```bash
claude plugin update wp-workflows@wp-workflows
```

### 移除 Plugin

```bash
claude plugin uninstall wp-workflows
```

### 驗證安裝

```bash
# 列出已安裝的 Plugin
claude plugin list

# 列出可用的 Skill
/skills list

# 列出可用的 Agent
/agent
```

---

## 包含的 Agents

| Agent 名稱           | 說明                                                                    |
| -------------------- | ----------------------------------------------------------------------- |
| `wordpress-master`   | 資深 WordPress / PHP 工程師，處理外掛開發、WooCommerce、REST API 等任務 |
| `wordpress-reviewer` | WordPress 程式碼審查專家，確保符合 WP 編碼標準與最佳實踐                |
| `react-master`       | React / TypeScript 前端工程師，專精 Gutenberg 區塊開發                  |
| `react-reviewer`     | React 程式碼審查，注重效能與可維護性                                    |
| `security-reviewer`  | 資安審查，專注 WordPress 外掛常見漏洞（nonce、SQL Injection、XSS）      |
| `e2e`                | Playwright E2E 測試自動化                                               |
| `planner`            | 任務規劃與架構設計                                                      |
| `clarifier`          | 需求釐清與使用者故事撰寫                                                |
| `doc-updater`        | 文件自動更新                                                            |
| `prompt-optimizer`   | Prompt 優化與改善                                                       |

---

## 包含的 Skills

### WordPress 核心開發

| Skill                   | 指令                          | 說明                                                |
| ----------------------- | ----------------------------- | --------------------------------------------------- |
| WordPress 外掛開發      | `/wp-plugin-development`      | 外掛架構、Hooks、Settings API、安全性、打包發佈     |
| WordPress 主題開發      | `/wp-block-themes`            | FSE Block Theme、theme.json、Templates、Patterns    |
| Gutenberg 區塊開發      | `/wp-block-development`       | 靜態/動態區塊、block.json、屬性序列化、Inner Blocks |
| Interactivity API       | `/wp-interactivity-api`       | 前端互動指令（directives）、Server-Side Rendering   |
| WordPress REST API      | `/wp-rest-api`                | 自訂端點、身份驗證、Custom Post Types               |
| WordPress 效能優化      | `/wp-performance`             | 資料庫查詢、物件快取、Autoload、HTTP API            |
| WordPress Abilities API | `/wp-abilities-api`           | 角色與權限管理                                      |
| WP-CLI 與運維           | `/wp-wpcli-and-ops`           | 自動化部署、Multisite、資料庫操作                   |
| PHPStan                 | `/wp-phpstan`                 | 靜態分析設定、WordPress 型別標註                    |
| WordPress Playground    | `/wp-playground`              | 沙盒環境、Blueprint 設定                            |
| WordPress Design System | `/wpds`                       | WordPress 元件設計系統                              |
| WordPress 路由          | `/wordpress-router`           | 前端路由決策樹                                      |
| WordPress 編碼標準      | `/wordpress-coding-standards` | PHPCS / WPCS 規範                                   |

### 測試

| Skill             | 指令                 | 說明                            |
| ----------------- | -------------------- | ------------------------------- |
| Playwright        | `/playwright`        | 瀏覽器自動化測試                |
| WP E2E Creator    | `/wp-e2e-creator`    | WordPress 專用 E2E 測試工作流程 |

### 通用工作流程

| Skill                 | 指令                             | 說明                                                          |
| --------------------- | -------------------------------- | ------------------------------------------------------------- |
| Orchestrator 心法     | `/using-wp-workflows`            | **v2.0.0 新增**（SessionStart 自動注入）。Orchestrator 心法、agent/skill 快速索引、Red Flags、全域一致性守則 |
| 設計精進              | `/brainstorming`                 | **v2.0.0 新增**。Socratic 對話精煉需求 + HARD-GATE（未獲批禁止實作）+ WP/React 場景模板 |
| 平行委派判斷          | `/dispatching-parallel-agents`   | **v2.0.0 新增**。何時該並行派 agent、何時必須序列化的判斷規範 |
| 需求規劃              | `/plan`                          | 任務分解與實作規劃                                            |
| 新需求                | `/new-requirement`               | 行為發現、API 推導、Entity 推導                               |
| Git Commit            | `/git-commit`                    | 產生符合慣例的 Commit Message                                 |
| 分支收尾              | `/finishing-branch`              | Merge / PR / Keep / Discard 4 選項決策樹 + worktree 清理      |
| 系統化除錯            | `/systematic-debugging`          | 4 階段根因調查流程，含 WP / React / AIBDD 常見 bug 模式對照表 |
| TDD 流程              | `/tdd-workflow`                  | Red → Green → Refactor 執行 playbook，含 Evidence 鐵律         |
| 需求表述              | `/formulation`                   | 需求文件撰寫                                                  |
| React 編碼標準        | `/react-coding-standards`        | React / TypeScript 最佳實踐                                   |
| Refine                | `/refine`                        | Ant Design + Refine 框架開發                                  |

> 💡 **與 obra/superpowers 的關係**：本 Plugin 的 `systematic-debugging`、`finishing-branch`、`tdd-workflow` 的 verification-gate 三項（v1.18.0）、SessionStart hook 架構 + `using-wp-workflows`、`brainstorming`、`dispatching-parallel-agents`（v2.0.0），方法論與基礎設施皆承襲自 `obra/superpowers`，並在地化為 WordPress / React / AIBDD 場景。若同時安裝 superpowers，兩者可平行使用：本 Plugin 提供 WP 領域實作，superpowers 提供通用流程版本。

---

## SessionStart Hook（v2.0.0+）

本 Plugin 在每次 Claude Code session 啟動、`/clear`、或 `/compact` 時，自動執行 `hooks/session-start`，將 `using-wp-workflows` skill 的完整內容注入到 context。這讓 Claude 在第一個回應之前就知道：

- 你是 **orchestrator**，優先委派 agent，不要親自寫 code
- 21 個 agent 的職責與使用時機
- 130+ 個 skill 的快速索引
- 全域一致性守則（檔名/路徑/術語變更必用 `/aho-corasick-skill` 掃描）
- Red Flags 反 rationalization 表

### 跨平台支援

Hook 透過 `hooks/run-hook.cmd` 這個 **polyglot wrapper** 實作，同一個檔案：

- **Windows** — 由 `cmd.exe` 解析，自動偵測 Git Bash（`C:\Program Files\Git\bin\bash.exe`、`C:\Program Files (x86)\Git\bin\bash.exe`、PATH 上的 `bash`）
- **macOS / Linux** — bash 直接執行

若環境沒裝 bash（例如純 Windows 無 Git Bash），hook 會 **silent exit 0**，plugin 仍可正常使用，只是失去自動注入功能。

### 如何停用

若你不想要 session 注入，直接刪除 `hooks/` 目錄即可。其餘 skill / agent 功能不受影響。

### 設計致敬

此 hook 架構（polyglot wrapper、三平台輸出適配、bash 參數替換 JSON 轉義）承襲自 [obra/superpowers](https://github.com/obra/superpowers)。注入內容 (`using-wp-workflows`) 為 wp-workflows 專屬設計。

---

## 包含的 MCP Servers

| MCP Server | 說明                                   |
| ---------- | -------------------------------------- |
| Playwright | 瀏覽器自動化，用於 E2E 測試與截圖      |
| Serena     | 程式碼語意搜尋，快速定位引用關係與符號 |

---

## 專案結構

```
wp-workflows/
├── .claude-plugin/
│   ├── plugin.json            # Claude Code Plugin 主設定
│   └── marketplace.json       # Marketplace 上架設定
├── hooks/                     # SessionStart hook (v2.0.0+)
│   ├── hooks.json             # Hook 事件宣告
│   ├── run-hook.cmd           # 跨平台 polyglot wrapper
│   └── session-start          # 注入 using-wp-workflows 的 bash 實作
├── agents/                    # Agent 定義檔
│   ├── wordpress-master.agent.md
│   ├── wordpress-reviewer.agent.md
│   └── ...
├── skills/                    # Skill 定義檔
│   ├── using-wp-workflows/    # SessionStart 注入的 meta-skill (v2.0.0+)
│   ├── brainstorming/         # Socratic 設計精進 + HARD-GATE (v2.0.0+)
│   ├── dispatching-parallel-agents/  # 平行委派判斷規範 (v2.0.0+)
│   ├── wp-plugin-development/
│   ├── wp-block-development/
│   └── ...
├── workflows/                 # GitHub Copilot coding agent 工作流程（參考用）
└── mcp/
    └── mcp-config.json        # MCP Server 設定
```

---

## 作者

- **j7-dev** — [j7.dev.gg@gmail.com](mailto:j7.dev.gg@gmail.com)
- GitHub: [https://github.com/j7-dev/wp-workflows](https://github.com/j7-dev/wp-workflows)

## 授權

MIT License
