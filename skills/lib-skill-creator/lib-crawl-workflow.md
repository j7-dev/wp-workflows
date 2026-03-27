---
name: lib-crawl-workflow
description: >
  Lib Skill Creator 的文件爬取與閱讀工作流程。涵蓋兩種輸入模式（Library / 主題）的完整 Phase 流程：
  依賴掃描（Phase 0）、版本定位（Phase 1）、URL 蒐集（Phase 2）、深度閱讀（Phase 3）、
  主題模式定位（Phase T1）、主題蒐集（Phase T2）、交叉驗證（Phase T3）。
  包含使用範例、路徑判斷邏輯、進度追蹤模板。
enable_by_default: true
---

# 文件爬取與閱讀工作流程

## 輸入模式

| 模式 | 輸入 | 範例 |
|------|------|------|
| **A. Library 模式** | 套件名稱（可含版本） | `@tanstack/react-query v4`、`zod v4` |
| **B. 主題模式** | 技術主題、領域、設計模式 | `WordPress REST API`、`OAuth 2.0`、`CQRS pattern` |

## 路徑判斷

| 用戶輸入 | 走哪條路 |
|---------|---------|
| 提供專案（package.json 等） | Phase 0 → 對每個複雜套件走 Phase 1 → 5 |
| 指定特定套件名稱 | Phase 1 → 5（Library 模式） |
| 指定主題 / 領域（非特定套件） | Phase T1 → T3 → Phase 4 → 5（主題模式） |

---

## 使用範例

### 範例 1：React Query v4

用戶專案的 `package.json` 中包含：
```json
"@tanstack/react-query": "^4.36.1"
```

行為：
1. 辨識出目標為 `@tanstack/react-query` **v4 版本**
2. 定位到 v4 版本的官方文件（注意：v5 已釋出，必須找到 v4 文件）
3. 系統性爬取所有 v4 文件頁面（最大深度 2 層，主要專注文件上的 URL）
4. 產出 SKILL 至 `.claude/skills/react-query-v4/`

```
.claude/skills/react-query-v4/
├── SKILL.md
└── references/
    ├── api-reference.md
    ├── examples.md
    ├── best-practices.md
    └── migration-notes.md
```

### 範例 2：主題模式 — WooCommerce Hooks

用戶說：「幫我整理 WooCommerce 的 hooks 做成 SKILL」

行為：
1. 辨識為 **主題模式**（非特定 npm/pip 套件，而是一個技術領域）
2. 搜尋 WooCommerce hooks 的官方文件、開發者文件、Action/Filter 參考
3. 定位到核心資源：WooCommerce Developer Docs、Hook Reference
4. 系統性爬取所有相關文件頁面
5. 產出 SKILL 至 `.claude/skills/woocommerce-hooks/`

---

## Phase 0｜依賴掃描與複雜度分類

當用戶提供專案（而非指定單一套件或主題）時，先執行此 Phase。

### Step 0.1｜讀取依賴清單

從專案根目錄讀取依賴檔案：
- `package.json`（`dependencies` 欄位，**忽略 `devDependencies`**）
- `pyproject.toml`（`[project.dependencies]`，**忽略 dev/test 群組**）
- `composer.json`（`require` 欄位，**忽略 `require-dev`**）
- `go.mod`（`require` 區塊）

> **開發依賴一律跳過**：devDependencies、require-dev、test/lint/build 工具等不影響業務邏輯。

### Step 0.2｜逐一分類複雜度

| 複雜度 | 判定標準 | 處理方式 |
|--------|---------|---------|
| **簡單** | API 表面小（< 10 個主要函式）、用法直覺、純 utility 性質、AI 已有充足知識 | **不建立 SKILL** |
| **複雜** | API 表面大（> 20 個主要函式）、有設定系統或 plugin 機制、有狀態管理/生命週期、版本間有顯著 breaking changes、需理解框架約定、AI 常見錯誤率高 | **需要建立 SKILL** |

### Step 0.3｜回報分類結果並等待確認

```
依賴掃描結果（共 {N} 個生產依賴，已忽略 {M} 個開發依賴）

需要建立 SKILL（複雜）：
  1. {套件名} v{版本} — {一句話說明為何複雜}
  2. ...

不需要建立 SKILL（簡單）：
  - {套件名} — {一句話說明為何簡單}
  ...

已忽略的開發依賴：
  - {套件名}（devDependency）
  ...

請確認上述分類是否正確，或調整後我將開始逐一建立 SKILL。
```

用戶確認後，依序對每個「複雜」套件執行 Phase 1 → Phase 5。

---

## Phase 1｜定位與版本鎖定

### Step 1.1｜確認目標與版本
- 辨識 **套件名稱** 與 **精確版本**
- 若版本為 semver range（如 `^4.36.1`），鎖定主版本號（v4）

### Step 1.2｜搜尋正確版本的文件入口
- 使用 web search 搜尋 `{套件名} v{版本} documentation`
- **版本至關重要**：必須確認找到的是正確版本
- 常見版本化文件 URL 模式：`docs.example.com/v4/`、`v4.docs.example.com/`、GitHub tag

### Step 1.3｜回報定位結果
```
目標確認：{套件名} v{版本}
文件入口：{URL}
版本驗證：{說明如何確認此文件對應正確版本}

開始爬取文件結構...
```

---

## Phase 2｜系統性蒐集文件 URL

### Step 2.1｜使用 Playwright MCP 開啟文件網站
- 在第一次指令中明確提及「Playwright MCP」以確保正確觸發 MCP 工具而非 bash fallback
- 等待頁面完全載入後，取得頁面的 accessibility snapshot

### Step 2.2｜蒐集側邊欄導航結構（最大深度 2 層）
1. **解析側邊欄**：從 accessibility snapshot 中辨識所有導航連結
2. **展開摺疊區塊**：逐一點擊展開至最多 2 層深
3. **記錄完整 URL 清單**：每個頁面的標題與 URL 配對
4. **追蹤巢狀深度**：記錄每個 URL 在文件樹中的層級（L1 → L2）
5. **辨識版本**：確認所有連結指向正確版本

### Step 2.3｜建立文件地圖

```
{領域} v{版本} 文件地圖（共 {N} 頁）
├── 入門指南 (Getting Started)
│   ├── 安裝與設定 - {url}
│   └── 基本概念 - {url}
├── 核心 API (Core API)
│   ├── API A - {url}
│   └── API B - {url}
├── Guides / Recipes
│   └── ...
├── 進階主題 (Advanced)
│   └── ...
└── 其他 (FAQ / Troubleshooting / Migration)
    └── ...
```

---

## Phase 3｜深度閱讀（嚴禁跳過）

### Step 3.1｜逐頁閱讀

**嚴禁跳過任何一頁文件。每一頁都必須實際讀取。**

研究範圍 = 該領域的 **全部文件**，包含所有程式碼範例。

對文件地圖中的每一個 URL：
1. 使用 Playwright MCP 或 web_fetch 取得完整頁面內容
2. 以 **API reference 級別** 提取：
   - **API 簽名**：函式名稱、參數（含型別與預設值）、回傳值型別
   - **Options / Config 物件**：所有可選欄位、型別、預設值、說明
   - **程式碼範例**：每一個範例都要完整保留（含 import 語句）
   - **TypeScript 型別定義**：interface / type 定義
   - **注意事項**：warning / note / caution / deprecated / since 標記
   - **與其他 API 的關聯**

### Step 3.2｜閱讀進度追蹤

```
[done] 安裝與設定 - 已讀取，3 個範例
[done] useQuery - 已讀取，完整 API + 8 個範例
[wip]  useMutation - 讀取中...
[todo] useQueryClient - 待讀取
[fail] 某頁 - 無法存取（已改用 web_fetch 重試）
```

每讀完 5-10 頁，向用戶回報進度。

### Step 3.3｜知識分類

| 分類 | 內容 | 放置位置 |
|------|------|---------|
| 核心概念與架構 | 設計理念、概念模型、運作原理 | SKILL.md 主體 |
| API 完整清單 | 每個函式/方法的簽名、參數、回傳值 | references/api-reference.md |
| 程式碼範例 | 完整可執行範例，含 import | references/examples.md |
| 最佳實踐與慣用模式 | 官方建議、常見搭配 | references/best-practices.md |
| 常見錯誤與陷阱 | deprecated、breaking changes | SKILL.md + references/ |
| 設定與客製化 | 設定檔選項、plugin 系統 | references/ 依情況分檔 |

---

## 主題模式工作流程（Phase T1 → T3）

> 當用戶提供的是一個 **主題/領域**（非特定套件）時，走此路徑。完成 Phase T3 後接續 Phase 4 → 5。

### Phase T1｜主題定位與資源搜尋

#### Step T1.1｜解析主題範圍
- 辨識 **主題名稱** 與 **範圍邊界**
- 判斷主題類型：技術標準、框架特定功能、設計模式、工具用法
- 若主題過於模糊，主動提問讓用戶縮小範圍

#### Step T1.2｜搜尋權威來源（依優先順序）
1. **官方文件**：該技術/框架的官方開發者文件
2. **規格標準**：RFC、W3C spec、OpenAPI spec 等
3. **官方部落格/指南**：核心團隊撰寫的 best practices
4. **權威社群資源**：MDN、DigitalOcean、Auth0 docs 等

> **排除低品質來源**：不採用個人部落格、Stack Overflow 答案、未經驗證的 Medium 文章。

#### Step T1.3｜回報定位結果
```
主題確認：{主題名稱}
識別到的權威來源：
  1. {來源名稱} — {URL}（官方文件）
  2. {來源名稱} — {URL}（開發者指南）
研究範圍：{一句話說明將涵蓋哪些面向}

開始爬取文件結構...
```

### Phase T2｜系統性蒐集與閱讀

運作方式與 Library 模式的 Phase 2 + Phase 3 相同，差異在於：
- **來源為多個網站**，需逐一爬取每個權威來源
- **不需要版本鎖定**（除非主題本身有版本概念）
- **知識提取重點**：核心概念、用法與語法、程式碼範例、最佳實踐、常見陷阱、與其他技術的整合

### Phase T3｜知識整理與交叉驗證

#### Step T3.1｜交叉驗證
- 多個來源對同一概念有不同說法時，以**官方文件為準**
- 標注有爭議或不確定的內容為 `[待確認]`
- 移除重複內容，保留解釋最清楚的版本

#### Step T3.2｜設計 SKILL 目錄結構
主題模式的 SKILL 目錄名稱使用 **主題簡稱**（無版本號），例如：
- `.claude/skills/woocommerce-hooks/`
- `.claude/skills/oauth2/`
- `.claude/skills/docker-multistage/`

完成 Phase T3 後，進入 Phase 4 產出 SKILL（參見 `/lib-skill-output`）。
