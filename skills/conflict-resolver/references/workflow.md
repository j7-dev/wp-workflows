# Conflict Resolver — 完整工作流程

## 概覽

```
Phase 1: 分支偵察 → Phase 2: 衝突分析與解法規劃 → [用戶確認]
→ Phase 3: 執行解衝突 → Phase 4: 測試驗證 → Phase 5: 推送
```

---

## Phase 1：分支偵察

### 1.1 識別預設分支與衝突分支

```bash
# 確認預設分支
git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@'

# 更新遠端資訊
git fetch --all

# 列出所有遠端分支
git branch -r --no-merged origin/{default-branch}
```

若用戶有指定分支，直接使用；否則掃描所有未合併分支。

### 1.2 逐一偵察每個分支

對每個候選分支執行：

```bash
# 檢測是否有衝突（dry-run merge）
git merge-tree $(git merge-base origin/{default} origin/{branch}) origin/{default} origin/{branch}

# 查看分支的 commit 歷史，理解意圖
git log origin/{default}..origin/{branch} --oneline --no-merges

# 查看分支的完整差異
git diff origin/{default}...origin/{branch}

# 查看分支最近的 commit message（理解開發者意圖）
git log origin/{default}..origin/{branch} --format="%h %s%n%b" --no-merges
```

### 1.3 使用 Serena 分析語意

對每個衝突檔案，使用 Serena MCP 的 `find_referencing_symbols` 和 `get_symbols_overview`：
- 了解衝突代碼被哪些其他模組引用
- 判斷修改影響範圍
- 確認雙方修改的語意是否互相排斥

### 1.4 產出偵察報告

為每個分支記錄：
- **分支名稱**與**用途摘要**（一句話）
- **修改檔案清單**
- **與預設分支的衝突檔案**
- **分支意圖分析**（這個分支想做什麼）

---

## Phase 2：衝突分析與解法規劃

### 2.1 衝突難度分類

對每個衝突檔案，根據以下標準分類：

| 難度 | 標記 | 判斷標準 | 典型情境 |
|------|------|---------|---------|
| 簡單 | `🟢` | 雙方修改不同區域，或僅一方有實質修改 | import 順序、新增不同函式、設定檔新增不同欄位 |
| 中等 | `🟡` | 同區域修改但意圖明確可合併 | 同一函式的不同參數修改、同一 config 的不同設定項 |
| 困難 | `🔴` | 同區域修改且意圖交叉或互斥 | 同一段邏輯被兩方重寫、架構級別的衝突、同一 API 簽名變更 |

### 2.2 解法策略

每個衝突必須選擇以下策略之一：

| 策略 | 適用情境 | 說明 |
|------|---------|------|
| **合併雙方** | 雙方修改互補不衝突 | 保留兩邊的修改，手動整合 |
| **以 A 為主，整合 B** | A 的修改是核心，B 是輔助 | 以 A 為基底，將 B 的意圖融入 |
| **以 B 為主，整合 A** | B 的修改是核心，A 是輔助 | 以 B 為基底，將 A 的意圖融入 |
| **重寫** | 雙方意圖交叉，無法簡單合併 | 理解雙方意圖後重新實作，同時滿足兩邊需求 |

> **禁止策略**：直接 `--ours` 或 `--theirs` 丟棄任何一方。必須理解後決策。

### 2.3 產出解法計劃（提交用戶確認）

```markdown
# 衝突解決計劃

## 總覽
- 衝突分支數量：{N}
- 總衝突檔案數：{M}
- 難度分布：🟢 {x} 個 | 🟡 {y} 個 | 🔴 {z} 個

## 分支 1：{branch-name}
> 意圖：{一句話描述分支目的}

| # | 檔案 | 難度 | 策略 | 說明 |
|---|------|------|------|------|
| 1 | `src/foo.ts` | 🟢 | 合併雙方 | default 加了 import，branch 加了新函式，不衝突 |
| 2 | `src/bar.ts` | 🟡 | 以 branch 為主，整合 default | branch 重構了核心邏輯，default 只加了 logging |
| 3 | `src/baz.ts` | 🔴 | 重寫 | 雙方都改了驗證邏輯，需統一設計 |

### 🔴 困難衝突詳解
**`src/baz.ts`**
- default 分支：將驗證從同步改為非同步
- feature 分支：新增了 3 種驗證規則
- 解法：保留非同步架構 + 整合新驗證規則，需調整規則的回傳型別

## 分支 2：{branch-name}
...

---
**請確認此計劃，或提出修改意見。確認後開始執行。**
```

**必須等待用戶確認後才進入 Phase 3。**

---

## Phase 3：執行解衝突

### 3.1 處理順序

按難度排序，先簡單後困難：
1. 先處理所有 🟢 簡單衝突（建立信心 + 減少噪音）
2. 再處理 🟡 中等衝突
3. 最後處理 🔴 困難衝突

### 3.2 逐分支處理流程

```bash
# 1. 切到衝突分支
git checkout {branch-name}

# 2. 確保分支是最新的
git pull origin {branch-name}

# 3. 將預設分支合併進來（觸發衝突）
git merge origin/{default-branch}

# 4. 此時會產生衝突標記，逐檔案解決
# ... 解決衝突 ...

# 5. 標記衝突已解決
git add {resolved-files}

# 6. 使用 /git-commit 提交合併
# commit message 格式：merge({scope}): 合併 {default} 分支，解決 {N} 個衝突
```

### 3.3 解衝突操作原則

- **逐檔案處理**：一次只解一個檔案的衝突，解完立即驗證語法正確
- **保留意圖**：不是機械式合併文字，而是理解雙方想達到的效果後重新組織代碼
- **最小修改**：只修改衝突標記區域，不碰周圍代碼
- **語意驗證**：解完後用 Serena 確認引用關係沒有斷裂

### 3.4 困難衝突（🔴）特殊處理

1. 用 Serena `get_symbols_overview` 取得衝突區域的完整符號結構
2. 用 `find_referencing_symbols` 找出所有引用方
3. 確保重寫後的代碼：
   - 滿足雙方分支的功能需求
   - 不破壞任何引用方的呼叫契約（參數、回傳值、型別）
   - 符合專案現有的程式風格

---

## Phase 4：測試驗證

### 4.1 自動偵測測試命令

按優先順序掃描：

| 來源 | 檢查內容 | 範例 |
|------|---------|------|
| `CLAUDE.md` | 文件中的測試指令 | `npm run test:integration` |
| `package.json` | `scripts.test`、`scripts.test:*` | `npm test`, `npm run test:e2e` |
| `composer.json` | `scripts.test`、`scripts.phpunit` | `composer test` |
| `Makefile` | `test` target | `make test` |
| `pyproject.toml` | `[tool.pytest]` 區塊 | `pytest` |
| 直接偵測 | 常見測試設定檔 | `jest.config.*`、`phpunit.xml`、`vitest.config.*` |

### 4.2 執行測試

```bash
# 在衝突已解決的分支上執行
{detected-test-command}

# 如果有多個測試命令，全部執行
# 優先順序：unit → integration → e2e
```

### 4.3 測試失敗處理

```
測試失敗？
├─ 失敗測試與衝突修改有關
│   ├─ 分析失敗原因
│   ├─ 調整衝突解法
│   ├─ 重新執行測試
│   └─ 最多重試 3 次，超過則標記為「需人類介入」
│
└─ 失敗測試與衝突修改無關（pre-existing failure）
    ├─ 記錄為「既有失敗」
    └─ 不阻擋推送，但在報告中標註
```

如果需要回退：
```bash
git merge --abort   # 如果還在 merge 過程中
# 或
git reset --hard HEAD~1   # 如果已經 commit 了合併
```

---

## Phase 5：推送與結果報告

### 5.1 推送

```bash
# 推送已解決的分支
git push origin {branch-name}
```

### 5.2 結果報告格式

```markdown
# 衝突解決結果報告

## 總覽
- 處理分支數：{N}
- 成功：{X} | 失敗：{Y} | 需人類介入：{Z}
- 處理衝突總數：{M}

## 詳細結果

### ✅ {branch-name-1}
- 衝突數：3（🟢2 🟡1）
- 測試結果：全部通過（47 passed）
- 推送狀態：已推送

### ✅ {branch-name-2}
- 衝突數：5（🟢1 🟡2 🔴2）
- 測試結果：全部通過（62 passed）
- 推送狀態：已推送

### ❌ {branch-name-3}
- 衝突數：2（🔴2）
- 狀態：需人類介入
- 原因：`src/core/auth.ts` 雙方架構級重寫，自動合併無法保證正確性
- 建議：{具體建議}
- 已回退變更

## 後續動作
- 上述成功的分支，PR 應已無衝突，可直接合併
- 標記 ❌ 的分支需要手動處理
```
