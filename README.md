# WordPress Plugin — GitHub Copilot CLI Plugin

> 專為 WordPress 開發設計的 GitHub Copilot CLI Plugin，內建完整的 Agent、Skill 與 MCP Server 設定，大幅提升 WordPress 外掛、主題、區塊開發的 AI 輔助效率。

## 安裝方式

### 從 GitHub 安裝

```bash
copilot plugin install github.com/j7-dev/wp-workflows
```

### 從本地目錄安裝

```bash
copilot plugin marketplace add j7-dev/wp-workflows
copilot plugin install ./wp-workflows
```

### 驗證安裝

```bash
# 列出已安裝的 Plugin
copilot plugin list

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
| WP E2E Playwright | `/wp-e2e-playwright` | WordPress 專用 E2E 測試工作流程 |

### 通用工作流程

| Skill          | 指令                      | 說明                            |
| -------------- | ------------------------- | ------------------------------- |
| 專案分析       | `/analyze`                | 快速分析專案結構與技術棧        |
| 需求規劃       | `/plan`                   | 任務分解與實作規劃              |
| 新需求         | `/new-requirement`        | 行為發現、API 推導、Entity 推導 |
| Git Commit     | `/git-commit`             | 產生符合慣例的 Commit Message   |
| 需求表述       | `/formulation`            | 需求文件撰寫                    |
| React 編碼標準 | `/react-coding-standards` | React / TypeScript 最佳實踐     |
| Refine         | `/refine`                 | Ant Design + Refine 框架開發    |
| Skill Creator  | `/skill-creator`          | 建立自訂 Copilot Skill          |

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
├── plugin.json                 # Copilot Plugin 主設定
├── .github/
│   └── plugin/
│       └── marketplace.json    # Marketplace 上架設定
├── agents/                     # Agent 定義檔
│   ├── wordpress-master.agent.md
│   ├── wordpress-reviewer.agent.md
│   └── ...
├── skills/                     # Skill 定義檔
│   ├── wp-plugin-development/
│   ├── wp-block-development/
│   └── ...
└── mcp/
    └── mcp-config.json         # MCP Server 設定
```

---

## 作者

- **j7-dev** — [j7.dev.gg@gmail.com](mailto:j7.dev.gg@gmail.com)
- GitHub: [https://github.com/j7-dev/wp-workflows](https://github.com/j7-dev/wp-workflows)

## 授權

MIT License
