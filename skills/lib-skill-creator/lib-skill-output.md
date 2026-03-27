---
name: lib-skill-output
description: >
  Lib Skill Creator 的 SKILL 產出規範。涵蓋 Phase 4（SKILL 結構設計、SKILL.md 撰寫模板、
  references 檔案規範、frontmatter description 模板）與 Phase 5（自我檢查清單、
  NotebookLM 最佳實踐驗證流程、交付報告模板）。
enable_by_default: true
---

# SKILL 產出規範

## Phase 4｜產出 SKILL

### Step 4.1｜設計 SKILL 結構

根據蒐集到的知識量，設計檔案結構。references 的拆分方式依據 **該領域的知識分布** 決定。

```
# Library 模式
.claude/skills/{套件名}-v{版本}/

# 主題模式
.claude/skills/{主題簡稱}/

# 共通結構
├── SKILL.md              # 核心指引（< 500 行）
└── references/
    ├── api-reference.md   # 完整 API 參考（函式簽名、參數、型別）
    ├── examples.md        # 精選範例集（完整可執行）
    ├── best-practices.md  # 最佳實踐、慣用模式、常見陷阱
    └── {其他}.md          # 依領域特性新增（如 configuration / plugins / migration）
```

**結構設計原則：**
- SKILL.md 控制在 500 行以內，放「AI Agent 最常需要查閱」的資訊
- references/ 放完整細節，讓 Agent 在需要時深入查閱
- 每個 reference 檔案超過 300 行時，加入目錄索引（TOC）
- SKILL.md 中明確指引何時該去讀哪個 reference 檔案
- SKILL 的目標讀者是 **其他 AI Agent**，不是人類初學者

### Step 4.2｜撰寫 SKILL.md

SKILL.md 的 description 必須足夠「pushy」，確保其他 AI Agent 在相關場景下會觸發此 SKILL：

```markdown
---
name: {領域}-v{版本}
description: >
  {領域} v{版本} 的完整技術參考。涵蓋所有 API、型別定義、程式碼範例與最佳實踐。
  當用戶的程式碼涉及 {領域} 或相關的 import 語句時，必須使用此 skill。
  即使用戶沒有明確說出「{領域}」，只要任務涉及 {列出 5-10 個相關關鍵字}，
  也應該使用此 skill 而不是去搜尋 web。
  此 skill 提供的資訊對應 v{版本}，不適用於其他主版本。
---

# {領域} v{版本}

> **適用版本**：v{版本}.x | **文件來源**：{官方文件 URL} | **最後更新**：{日期}

{一段話概述此套件解決什麼問題，核心設計理念}

## 核心 API 速查

{最高頻使用的 5-10 個 API，每個附帶：}
{- 函式簽名（含參數型別）}
{- 一句話說明用途}
{- 最精簡的使用範例（3-5 行）}

## 常用模式

{3-5 個最常見的使用模式，附帶完整程式碼片段}

## 注意事項與陷阱

{從文件中萃取的 warning / caution / deprecated / breaking changes}
{標注每個陷阱的嚴重程度與觸發條件}

## References 導引

| 需求 | 參閱檔案 |
|------|---------|
| 查詢完整 API 簽名與所有參數 | `references/api-reference.md` |
| 需要完整可執行的範例 | `references/examples.md` |
| 瞭解最佳實踐與常見搭配 | `references/best-practices.md` |
| {其他} | `references/{其他}.md` |
```

### Step 4.3｜撰寫 references 檔案

每個 reference 檔案的撰寫規範：

- **目標讀者是 AI Agent**：資訊密度最大化，不需要冗長的動機解釋
- **API reference 格式**：每個 API 條目包含簽名、參數表、回傳值、簡短範例
- **程式碼範例必須完整可執行**：包含所有 import、setup、必要的 type annotation
- **超過 300 行必須加 TOC**
- **標注原始文件 URL**：每個段落結尾標注來源，方便回溯查證
- **範例只取自官方文件**，不可自行捏造

### Step 4.4｜寫入檔案系統

將 SKILL 檔案寫入 `.claude/skills/{領域}-v{版本}/` 目錄。

---

## Phase 5｜驗收與交付

### Step 5.1｜自我檢查清單

交付前，逐項確認：

- [ ] 文件地圖中的每一頁都已閱讀（無遺漏、無跳過）
- [ ] SKILL.md 在 500 行以內
- [ ] SKILL.md 的 description 包含足夠的觸發關鍵字（pushy 風格）
- [ ] description 中明確標注適用版本，避免與其他版本混淆
- [ ] references/ 中所有超過 300 行的檔案都有 TOC
- [ ] 所有程式碼範例完整可執行（含 import）
- [ ] 所有程式碼範例來自官方文件（非捏造）
- [ ] 所有 deprecated / breaking changes 都有標注
- [ ] SKILL.md 中有 References 導引表
- [ ] SKILL 的語氣面向 AI Agent（精準、密集、無廢話）

### Step 5.2｜NotebookLM 最佳實踐驗證（必要步驟）

使用 notebook-lm MCP 的 **Claude Code Docs** 筆記本（ID: `de80e438-3645-4d94-8977-ce1f3218cd6e`）驗證產出的 SKILL。

#### 5.2.1｜執行 3 組驗證查詢

使用 `notebook_query` 工具，每組查詢時附上待驗證的 SKILL 內容：

**查詢 1 — Frontmatter 與觸發機制驗證：**
```
驗證以下 SKILL.md 的 frontmatter 是否符合 Claude Code 官方最佳實踐：
- name 欄位是否符合命名規範（lowercase, hyphens, max 64 chars）？
- description 是否包含足夠的自然語言關鍵字？
- 是否需要設定 disable-model-invocation 或 user-invocable？
- 是否應該加入 allowed-tools 限制工具存取？

以下是待驗證的 frontmatter：
{貼上產出的 SKILL.md frontmatter}
```

**查詢 2 — 檔案結構與內容組織驗證：**
```
驗證以下 SKILL 檔案結構是否符合 Claude Code 官方最佳實踐：
- SKILL.md 是否控制在 500 行以內？
- 大型參考內容是否正確分離至 references/ 子檔案？
- SKILL.md 是否有明確指引何時該去讀哪個 reference 檔案？
- 是否應該使用 context: fork 在 subagent 中執行？

以下是待驗證的檔案結構與 SKILL.md 內容摘要：
{貼上產出的檔案結構樹 + SKILL.md 前 50 行}
```

**查詢 3 — 內容品質與 Agent 可用性驗證：**
```
驗證以下 SKILL 內容是否符合 Claude Code 官方建議的品質標準：
- 內容是否面向 AI Agent（精準、密集、無廢話）？
- 程式碼範例是否包含完整 import 與型別標注？
- 是否有善用 string substitutions（$ARGUMENTS 等）？
- references 檔案是否從 SKILL.md 正確引用？

以下是待驗證的 SKILL 內容片段：
{貼上核心 API 速查 + References 導引表段落}
```

#### 5.2.2｜分析驗證結果

| 類別 | 處理方式 |
|------|---------|
| **必須修正** | 違反官方規範的硬性問題 → **立即修正** |
| **建議改善** | 不違反規範但可優化 → **評估後修正** |
| **符合規範** | 已符合最佳實踐 → **不做修改** |

#### 5.2.3｜執行修正
- 對所有「必須修正」項目進行修正，修正後重新寫入檔案
- 對「建議改善」項目逐一評估，修正成本低（< 5 分鐘）則一併修正

#### 5.2.4｜驗證結果回報
```
NotebookLM 最佳實踐驗證結果：

符合規範：{N} 項
已修正：{列出修正項目}
建議改善（已處理）：{列出已處理的建議}
建議改善（暫不處理）：{列出暫不處理的建議與原因}

驗證依據：Claude Code Docs 筆記本（65 份官方文件來源）
```

> **注意**：如果 notebook-lm MCP 不可用或查詢失敗，記錄錯誤原因並告知用戶，改為人工對照 Step 5.1 的自我檢查清單進行驗證。

### Step 5.3｜向用戶呈現成果

```
{領域} v{版本} SKILL 已建立完成

研究統計：
- 文件頁數：{N} 頁（已全部讀取）
- API 條目：{N} 個
- 程式碼範例：{N} 個
- 識別陷阱 / deprecated：{N} 個

品質驗證：
- NotebookLM 最佳實踐驗證：通過（{N} 項符合 / {N} 項已修正）

檔案結構：
.claude/skills/{領域}-v{版本}/
├── SKILL.md ({N} 行)
└── references/
    ├── api-reference.md ({N} 行)
    ├── examples.md ({N} 行)
    └── ...

此 SKILL 可直接被其他 AI Agent 調用，無需再搜尋 web。
```
