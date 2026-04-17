# Red → Green → Refactor 循環詳細規則

本文件定義 tdd-coordinator 執行 TDD 三階段的操作細節、Gate 驗證條件、重試策略與失敗處理。

---

## 階段 1：🔴 Red — 產生失敗的測試

### Step 2：分派 Test Creator

- 將 planner 計劃中的「測試策略」與「架構變更」section 傳給 `@wp-workflows:test-creator`
- test-creator 根據 `specs/` 目錄的規格產生完整測試骨架
- 測試骨架包含：整合測試（PHPUnit）和/或 E2E 測試（Playwright），視功能性質決定

### Step 3：🚨 Red Gate — 驗證測試存在且全部失敗

執行測試命令（根據專案類型選擇）：

```bash
# PHP 整合測試
npx wp-env run tests-cli vendor/bin/phpunit 2>&1; echo "EXIT_CODE=$?"

# E2E 測試
npx playwright test 2>&1; echo "EXIT_CODE=$?"

# Node.js 測試
npx vitest run 2>&1; echo "EXIT_CODE=$?"
```

**驗證條件（全部必須滿足）：**

1. 測試檔案存在（至少 1 個新的測試檔案被 test-creator 建立）
2. 測試命令的 exit code ≠ 0（測試必須失敗，代表 Red 狀態）
3. 失敗原因是「斷言失敗」或「類別/方法不存在」，而非語法錯誤或環境問題

**若 Red Gate 不通過：**

- 若無測試檔案 → 退回 Step 2，要求 test-creator 重新產生
- 若測試全部通過（exit code = 0）→ 測試可能沒有真正的斷言，退回 test-creator 修正
- 若是環境錯誤（不是測試失敗）→ 嘗試修復環境，再重跑
- 最多重試 **2 次**，仍然失敗 → 中止並回報失敗原因

---

## 階段 2：🟢 Green — 最小實作讓測試通過

### Step 4：建立代理團隊，分派實作任務

細節見 [team-and-worktree.md](team-and-worktree.md)。重點：

- 根據計劃指定的技術棧組建代理團隊，tdd-coordinator 擔任 **Team Lead**
- 使用 `TeamCreate` 加入 Teammates，將實作計劃拆解為 Task List（含依賴關係）
- **每個實作任務都必須對應至少一個已存在的測試**；若測試不存在，先回 Step 2 補測試
- 建議團隊規模：3-5 個 Teammates，每人 5-6 個任務

### Step 5：🚨 Green Gate — 驗證測試全部通過

在所有 Developer Teammates 完成任務後，執行與 Red Gate 相同的測試命令。

**驗證條件：**

- 測試命令的 exit code = 0（所有測試通過）

**若 Green Gate 不通過：**

- 將失敗的測試資訊透過 `SendMessage` 退回給對應的 Developer Teammate
- Developer Teammate 修正後，重新執行 Green Gate
- 最多重試 **3 次**，仍然失敗 → 中止並回報失敗原因，列出仍然失敗的測試清單

---

## 階段 3：🔵 Refactor — 審查與優化

### Step 6：分派 Reviewer

- Reviewer Teammates 在同一工作目錄中進行審查
- **審查前必須確認所有測試通過** — 測試失敗的程式碼不進入審查流程
- 審查不通過時，透過 `SendMessage` 退回給對應的 Developer Teammate 修正
- 修正後重新通過 Green Gate，再進行審查

**審查團隊組成（根據專案技術棧選擇）：**

- `@wp-workflows:wordpress-reviewer` — PHP/WordPress 程式碼審查
- `@wp-workflows:react-reviewer` — React/TypeScript 程式碼審查
- `@wp-workflows:security-reviewer` — 安全性審查（**WordPress Plugin 專案必須包含**，與其他 reviewer 平行執行）

---

## 失敗處理表

| 失敗情境 | 處理方式 |
|----------|----------|
| test-creator 無法產生測試（`./specs/` 不存在） | 中止，回報「缺少 `./specs/` 規格，請先用 @wp-workflows:clarifier 產生」 |
| Red Gate 不通過（無測試檔案） | 退回 test-creator，最多重試 2 次 |
| Red Gate 不通過（測試全部通過） | test-creator 的斷言有誤，退回修正 |
| Green Gate 不通過（測試失敗） | 退回 Developer Teammate，最多重試 3 次 |
| 重試次數耗盡 | 中止整個流程，保留當前變更（本地保留 worktree / CI commit 現狀），回報失敗清單供人工介入 |
| Reviewer 退回修改 | 退回 Developer，修正後重過 Green Gate 再審查 |

---

## 核心 Agent 依賴

**TDD 流程：**
- `@wp-workflows:test-creator` — 第一棒，強制呼叫，負責在實作前產生所有測試骨架；如果沒有產生測試，必須交代原因

**開發團隊（依專案技術棧選擇）：**
- `@wp-workflows:wordpress-master` — WordPress/PHP 實作
- `@wp-workflows:react-master` — React/TypeScript 前端實作
- `@wp-workflows:nodejs-master` — Node.js 後端實作

**審查團隊（依專案技術棧選擇）：**
- `@wp-workflows:wordpress-reviewer` — WordPress/PHP 程式碼審查
- `@wp-workflows:react-reviewer` — React/TypeScript 程式碼審查
- `@wp-workflows:security-reviewer` — 安全性審查（WordPress Plugin 專案必須）

**收尾：**
- `@wp-workflows:doc-updater` — 完成後同步更新專案文件
