# Change Categories

拿到 `git diff` 後，第一件事是判斷「這個變更是否值得記錄到文件」。
以下四個維度是判斷依據，依序檢查每個 diff 是否命中任一條目。
命中 = 需要同步文件；未命中 = 跳過。

---

## Category 1: New Feature (新增功能)

以下類型的「新增」必須同步到文件：

- 新增的 `class`、`interface`、`enum`、`trait`
- 新增的 WordPress `action` / `filter` hook
- 新增的 REST API 端點（`register_rest_route` 或新增 controller）
- 新增的 WP-CLI 指令
- 新增的 Gutenberg 區塊
- 新增的設定選項或管理介面
- 新增的服務層 / 依賴注入容器註冊

**記錄位置**：
- 公開介面 / 核心 class → `CLAUDE.md` 的「核心 class 列表」
- Hook → `CLAUDE.md` + `.claude/rules/hooks.md`（若存在）
- REST API 端點 → `CLAUDE.md` + `.claude/rules/api.md`（若存在）

---

## Category 2: Modification / Refactor (修改 / 重構)

以下類型的「變更」必須同步：

- 重新命名的 `class`、`method`、`namespace`
- 移動的檔案或目錄（影響 import / use 路徑）
- 改變的方法簽名（參數、回傳型別、可見性）
- 改變的架構層（如從 `Infrastructure` 移到 `Domain`）
- 更新的依賴注入方式
- 更新的 Hook 名稱或優先順序

**記錄位置**：
- 命名空間變更 → `CLAUDE.md` 的架構圖與命名空間段落
- 架構層變更 → `.claude/rules/architecture.md`（若存在）
- 方法簽名變更 → 若該 class 在文件中有列出，更新其描述

**注意**：重構的全域一致性檢查 → 見 `update-rules.md` 的「全域一致性」段落。

---

## Category 3: Removal (移除)

以下類型的「刪除」必須同步（從文件中移除對應內容）：

- 已廢棄的 `class`、`method`、`hook`
- 移除的功能或端點
- 刪除的設定選項
- 移除的 CLI 指令

**記錄位置**：在文件中找到對應條目並刪除。若有 migration guide，加上「已廢棄於 vX」註記。

---

## Category 4: Architectural Adjustment (架構調整)

以下類型的「架構變動」必須同步：

- 目錄結構變更（新增 / 重組子模組）
- 新增的設計模式（Repository、Strategy、Observer 等）
- 引入的新依賴或工具（Composer、npm 套件）
- 變更的建構流程或測試指令
- 變更的環境需求（PHP / Node 版本、WP 版本）

**記錄位置**：
- 目錄結構 → `CLAUDE.md` 的專案架構圖
- 設計模式 / 新依賴 → `.claude/rules/architecture.md`（若存在）
- 建構 / 測試指令 → `CLAUDE.md` 的「建構指令」段落

---

## Ignore these changes (不需同步文件)

- 單純的錯字修正
- 內部變數重新命名（未改變公開 API）
- 純註解 / 文件字串調整（除非改變公開行為描述）
- 測試檔案內部重構（未改變測試策略）
- 格式化 / linter 調整（未改變邏輯）

---

## 變更摘要清單格式

分類完畢後整理成以下格式傳給下一階段（比對與更新）：

```
## 變更摘要

### 新增功能
- [檔案路徑] 新增 class `Foo\Bar\Baz`，職責：...
- [檔案路徑] 新增 hook `my_plugin/after_save`，用途：...

### 修改 / 重構
- [檔案路徑] 重命名 `OldClass` → `NewClass`（影響 N 處引用）
- [檔案路徑] 方法簽名變更：`doSomething($arg)` → `doSomething($arg, $options = [])`

### 移除
- [檔案路徑] 移除 `DeprecatedService`（已由 `NewService` 取代）

### 架構調整
- 新增目錄 `src/Domain/Events/`
- 引入 `symfony/event-dispatcher` 依賴
```
