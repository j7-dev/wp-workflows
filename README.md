# zenbu-powers — Claude Code Plugin

> 為 **zenbu org** 量身打造的 Claude Code Plugin。內建 Orchestrator 心法注入、23 個專業 Agent、140+ 個 Skill，覆蓋 WordPress 全棧、React / NestJS / Node.js 現代應用、AIBDD 行為驅動開發三大領域，讓 AI 工程師團隊從第一個 session 就知道如何分工。

**v3.0.0** — 完整支援 AIBDD TypeScript / C# / PHP 三語言整合測試套件；架構升級為模組化 Orchestrator-Agent-Skill 三層委派體系。

---

## 設計哲學

```
你（使用者）
    │
    ▼
Orchestrator（Claude 主窗口）
    │  分析需求、拆解子任務、整合報告
    ├──► Agent Team（平行或序列委派）
    │        ├── wordpress-master   ← PHP / WP 實作
    │        ├── react-master       ← React / TSX 實作
    │        ├── nestjs-master      ← NestJS / TypeScript 實作
    │        ├── security-reviewer  ← 資安審查
    │        └── ...（共 23 個）
    │
    └──► Skills（流程 / 知識 / Library 參考）
             ├── /brainstorming     ← 設計精進
             ├── /tdd-workflow      ← Red→Green→Refactor
             ├── /aibdd-*           ← AIBDD 全自動 BDD 套件
             └── ...（共 140+ 個）
```

**SessionStart hook** 在每次 session 啟動時自動注入 `using-zenbu-powers` 的完整 Orchestrator 心法，包含 Agent 職責索引、Skill 快速查詢、Red Flags 反 rationalization 表與全域一致性守則。Claude 在第一個回應之前就知道如何分工，不需要重複說明。

---

## 安裝方式

### 從 Marketplace 安裝

```bash
claude plugin marketplace add zenbuapps/zenbu-powers
claude plugin install zenbu-powers
```

### 從本地目錄安裝

```bash
claude plugin install ./zenbu-powers
```

### 更新 / 移除

```bash
claude plugin update zenbu-powers@zenbu-powers
claude plugin uninstall zenbu-powers
```

### 驗證安裝

```bash
claude plugin list   # 列出已安裝的 Plugin
/skills list         # 列出可用的 Skill
/agent               # 列出可用的 Agent
```

---

## Agents（23 個）

### WordPress / PHP

| Agent | 說明 |
|---|---|
| `wordpress-master` | 資深 WordPress / PHP 工程師，外掛、主題、WooCommerce、REST API |
| `wordpress-reviewer` | WP 程式碼審查，確保符合 WPCS 編碼標準與最佳實踐 |

### React / Frontend

| Agent | 說明 |
|---|---|
| `react-master` | React 18 / TypeScript，Refine、Ant Design、TanStack Query |
| `react-reviewer` | React 程式碼審查，注重效能、Accessibility、Hooks 設計 |
| `uiux-reviewer` | 以真實使用者視角操作 Playwright，走完業務流程提出體驗改善 |

### NestJS / Node.js

| Agent | 說明 |
|---|---|
| `nestjs-master` | NestJS 10+ / TypeScript，模組化架構、DI、Guards、TypeORM/Prisma |
| `nestjs-reviewer` | NestJS 程式碼審查，不通過自動退回 master 形成審查迴圈 |
| `nodejs-master` | Node.js 20+ / TypeScript，RESTful API、BullMQ、Zod、Prisma |

### 架構 / 設計

| Agent | 說明 |
|---|---|
| `planner` | 複雜功能與重構的實作計畫設計師 |
| `clarifier` | 結構化需求訪談，輸出使用者故事與驗收標準 |
| `ddd-architect` | DDD 重構規劃，識別 Code Smell、排序重構步驟 |
| `tdd-coordinator` | 接收 planner 計畫，強制執行 Red→Green→Refactor 迴圈 |

### 測試 / 品質

| Agent | 說明 |
|---|---|
| `browser-tester` | git diff 驅動的瀏覽器模擬測試，錄製影片與截圖 |
| `test-creator` | 通用測試工程師，E2E + 整合測試完整覆蓋 |
| `security-reviewer` | OWASP Top 10、WordPress XSS/SQL Injection/CSRF、依賴漏洞 |

### DevOps / CI

| Agent | 說明 |
|---|---|
| `workflow-master` | GitHub Actions 製作、除錯、優化，支援 act 本地驗證 |
| `conflict-resolver` | 分析衝突分支意圖，規劃最佳解法後推回各分支 |

### 文件 / 知識管理

| Agent | 說明 |
|---|---|
| `doc-manager` | 協調子代理全面管理 CLAUDE.md、rules、specs 文件體系 |
| `doc-updater` | 功能實作後自動同步 CLAUDE.md 與 rules |
| `lib-skill-creator` | 爬取官方文件，萃取為 API reference 級別的 SKILL |
| `markdown-creator` | 將 PDF/Word/HTML/圖片轉換為高品質 Markdown |
| `claude-manager` | Claude Code 設定最佳實踐審查（CLAUDE.md、settings、hooks） |
| `prompt-optimizer` | Prompt 診斷優化與跨用途轉換 |

---

## Skills（140+ 個）

### Orchestrator 流程（必讀）

| Skill | 說明 |
|---|---|
| `/using-zenbu-powers` | Orchestrator 心法、Agent/Skill 索引、Red Flags（SessionStart 自動注入） |
| `/brainstorming` | Socratic 對話精煉需求 + HARD-GATE（未獲批准禁止實作） |
| `/dispatching-parallel-agents` | 何時並行派 agent、何時必須序列化的判斷規範 |
| `/clarify-loop` | 需求釐清迴圈 |
| `/plan` | 任務分解與實作規劃 |
| `/systematic-debugging` | 4 階段根因調查，含 WP / React / AIBDD 常見 bug 對照表 |
| `/tdd-workflow` | Red → Green → Refactor 執行 playbook，含 Evidence 鐵律 |
| `/finishing-branch` | Merge / PR / Keep / Discard 決策樹 + worktree 清理 |

### AIBDD — AI 行為驅動開發（全自動 BDD 套件）

AIBDD 是 zenbu-powers 的核心差異化能力。從 BDD 分析到整合測試，全程由 skill 驅動，支援 **TypeScript / PHP / C#** 三種語言。

#### 分析與設計

| Skill | 說明 |
|---|---|
| `/aibdd-kickoff` | AIBDD 開發啟動儀式 |
| `/aibdd-discovery` | 行為發現與 Domain 探索 |
| `/aibdd-core` | AIBDD 核心概念與架構 |
| `/aibdd-specformula` | Spec 撰寫公式 |
| `/aibdd-form-feature-spec` | Feature Spec 表單 |
| `/aibdd-form-entity-spec` | Entity Spec 表單 |
| `/aibdd-form-api-spec` | API Spec 表單 |
| `/aibdd-form-bdd-analysis` | BDD 分析表單 |
| `/aibdd-form-activity` | Activity 設計表單 |
| `/aibdd-composition-analysis` | 組合分析 |
| `/aibdd-consistency-analyzer` | 一致性驗證 |

#### 通用自動化（語言無關）

| Skill | 說明 |
|---|---|
| `/aibdd-auto-red` | 自動產生失敗測試 |
| `/aibdd-auto-green` | 自動實作讓測試通過 |
| `/aibdd-auto-refactor` | 自動重構 |
| `/aibdd-auto-control-flow` | 控制流程自動化 |
| `/aibdd-carry-on-engineering-plan` | 續接工程計畫 |
| `/aibdd-auto-backend-starter` | 後端起手式 |
| `/aibdd-auto-frontend-nextjs-pages` | Next.js 頁面自動化 |
| `/aibdd-auto-frontend-msw-api-layer` | MSW API 層自動化 |
| `/aibdd-auto-frontend-apifirst-msw-starter` | API First MSW 起手式 |

#### TypeScript 整合測試（ts.it）

完整覆蓋 Red / Green / Refactor / Control-Flow / Schema-Analysis 等階段，以及 Command / Query / Aggregate / ReadModel / Success-Failure 各類 Handler。

#### PHP 整合測試（php.it）

同上，PHP 語言版本，含 Test Skeleton 產生。

#### C# 整合測試（csharp.it）

同上，C# 語言版本。

### WordPress

| Skill | 說明 |
|---|---|
| `/wp-plugin-development` | 外掛架構、Hooks、Settings API、安全性、打包發佈 |
| `/wp-block-development` | 靜態/動態區塊、block.json、Inner Blocks |
| `/wp-block-themes` | FSE Block Theme、theme.json、Templates、Patterns |
| `/wp-interactivity-api` | Directives、Server-Side Rendering |
| `/wp-rest-api` | 自訂端點、身份驗證、Custom Post Types |
| `/wp-performance` | 資料庫查詢、物件快取、Autoload 優化 |
| `/wp-abilities-api` | 角色與權限管理 |
| `/wp-wpcli-and-ops` | 自動化部署、Multisite、資料庫操作 |
| `/wp-phpstan` | 靜態分析設定、WordPress 型別標註 |
| `/wp-playground` | 沙盒環境、Blueprint 設定 |
| `/wp-integration-testing` | WP 整合測試 |
| `/wp-e2e-creator` | WordPress 專用 E2E 測試工作流程 |
| `/wp-project-triage` | WP 專案健康檢查 |
| `/wp-mcp-adapter` | WP MCP 適配器 |
| `/wordpress-router` | 前端路由決策樹 |
| `/wordpress-coding-standards` | PHPCS / WPCS 規範 |
| `/wordpress-review-criteria` | WP 審查標準 |
| `/woocommerce-hpos` | WooCommerce HPOS 高效能訂單存儲 |
| `/wpds` | WordPress 元件設計系統 |
| `/vite-for-wp-v0-12` | Vite for WordPress |

### React / 前端框架

| Skill | 說明 |
|---|---|
| `/react-coding-standards` | React / TypeScript 最佳實踐 |
| `/react-review-criteria` | React 審查標準 |
| `/react-master` | React 開發主技能 |
| `/react-router-v6` / `/react-router-v7` | React Router |
| `/refine-v4` | Ant Design + Refine 框架開發 |
| `/ant-design-pro-v2` | Ant Design Pro |
| `/react-flow-v12` | React Flow 流程圖 |
| `/tanstack-query-v4` / `/tanstack-query-v5` | TanStack Query 資料請求 |
| `/frontend-design` | 前端設計原則 |
| `/zenbuapps-design-system` | Zenbu 設計系統 |
| `/blocknote-v0-30` | BlockNote 富文本編輯器 |
| `/i18next-v25` | i18next 國際化 |
| `/vidstack-hls-v1` | Vidstack HLS 影片播放 |
| `/tailwindcss-v3` / `/tailwindcss-v4` | Tailwind CSS |
| `/pdf-lib-v1-17` | PDF 操作 |

### NestJS / Node.js / 後端

| Skill | 說明 |
|---|---|
| `/nestjs-v11` | NestJS 11 開發參考 |
| `/nestjs-coding-standards` | NestJS 編碼標準 |
| `/nestjs-review-criteria` | NestJS 審查標準 |
| `/nodejs-master` | Node.js 開發主技能 |
| `/typeorm-v0-3` | TypeORM v0.3 |
| `/drizzle-orm-v0-38` | Drizzle ORM v0.38 |
| `/bullmq-v5` | BullMQ v5 任務佇列 |
| `/zod-v3` | Zod v3 資料驗證 |
| `/better-auth-v1-4` | Better Auth v1.4 |
| `/docker-compose` | Docker Compose |

### DevOps / CI / 工具

| Skill | 說明 |
|---|---|
| `/github-actions` | GitHub Actions 工作流程 |
| `/workflow-master` | CI/CD pipeline 製作與除錯 |
| `/claude-code-action` | Claude Code GitHub Action |
| `/cloudflare-pages-wrangler` | Cloudflare Pages 部署 |
| `/octokit-rest-v21` | Octokit REST API |
| `/issue-creator` | GitHub Issue 自動建立 |
| `/aho-corasick-skill` | 批次字串掃描（全域一致性必用） |

### 測試 / 品質

| Skill | 說明 |
|---|---|
| `/tdd-workflow` | TDD 完整執行 playbook |
| `/test-creation-playbook` | 測試建立 playbook |
| `/browser-tester` | 瀏覽器自動化測試 |
| `/security-review-criteria` | 資安審查標準 |
| `/uiux-review-playbook` | UIUX 審查 playbook |
| `/ddd-refactoring` | DDD 重構 playbook |

### 工作流程

| Skill | 說明 |
|---|---|
| `/git-commit` | 產生符合慣例的 Commit Message |
| `/finishing-branch` | 分支收尾決策樹 |
| `/conflict-resolver` | 衝突解決流程 |
| `/prompt-optimization` | Prompt 優化 |
| `/notebooklm` | NotebookLM 知識庫整合 |
| `/nuwa` | Nuwa 角色設定 |
| `/doc-sync-playbook` | 文件同步 playbook |
| `/doc-scaffolding-workflow` | 文件鷹架建立流程 |

---

## SessionStart Hook

每次 Claude Code session 啟動、`/clear`、或 `/compact` 時，自動執行 `hooks/session-start`，注入 Orchestrator 完整心法。

### 跨平台支援

Hook 透過 `hooks/run-hook.cmd` 這個 polyglot wrapper 實作：

- **Windows** — `cmd.exe` 解析，自動偵測 Git Bash
- **macOS / Linux** — bash 直接執行

若環境無 bash，hook 會 silent exit 0，plugin 其餘功能不受影響。

### 停用方式

刪除 `hooks/` 目錄即可，其餘 skill / agent 不受影響。

---

## MCP Servers

| MCP Server | 說明 |
|---|---|
| Playwright | 瀏覽器自動化，用於 E2E 測試與截圖 |
| Serena | 程式碼語意搜尋，快速定位引用關係與符號 |

---

## 專案結構

```
zenbu-powers/
├── .claude-plugin/
│   ├── plugin.json            # Claude Code Plugin 主設定
│   └── marketplace.json       # Marketplace 上架設定
├── hooks/                     # SessionStart hook
│   ├── hooks.json             # Hook 事件宣告
│   ├── run-hook.cmd           # 跨平台 polyglot wrapper
│   └── session-start          # 注入 using-zenbu-powers 的 bash 實作
├── agents/                    # 23 個 Agent 定義檔
│   ├── wordpress-master.agent.md
│   ├── nestjs-master.agent.md
│   └── ...
├── skills/                    # 140+ 個 Skill 定義檔
│   ├── using-zenbu-powers/    # Orchestrator meta-skill（SessionStart 注入）
│   ├── brainstorming/         # Socratic 設計精進 + HARD-GATE
│   ├── aibdd-*/               # AIBDD 全自動 BDD 套件
│   ├── wp-*/                  # WordPress 全棧 skills
│   └── ...
├── workflows/                 # GitHub Copilot coding agent 工作流程（參考用）
└── mcp/
    └── mcp-config.json        # MCP Server 設定
```

---

## 致謝

`systematic-debugging`、`finishing-branch`、`tdd-workflow` 的 verification-gate 設計，以及 SessionStart hook 架構（polyglot wrapper、三平台輸出適配），方法論承襲自 [obra/superpowers](https://github.com/obra/superpowers)，並在地化為 zenbu org 的技術棧場景。

---

## 作者

- **j7-dev** — [j7.dev.gg@gmail.com](mailto:j7.dev.gg@gmail.com)
- GitHub: [https://github.com/zenbuapps/zenbu-powers](https://github.com/zenbuapps/zenbu-powers)

## 授權

MIT License
