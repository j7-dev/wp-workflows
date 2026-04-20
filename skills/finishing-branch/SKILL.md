---
name: finishing-branch
description: >
  開發分支收尾決策樹。當實作完成、所有測試通過後使用，引導使用者在 Merge / PR / Keep / Discard 4 個選項中做出選擇，並執行對應的 git + worktree 清理流程。
  與 zenbu-powers:git-commit 互補：git-commit 處理「commit 訊息產出」，本 skill 處理「commit 之後到底要 merge / 開 PR / 保留 / 丟掉」。
  改寫自 obra/superpowers 的 finishing-a-development-branch skill，整合 zenbu-powers 的 worktree 與 CI 雙模式。
---

# 開發分支收尾劇本

## 核心原則

驗證測試 → 呈現選項 → 執行選擇 → 清理 worktree。

**不替使用者做決定**：4 個選項一律呈現，等使用者選。

---

## 何時使用

- TDD 循環完成（Green Gate 過、Reviewer 全放行）
- 在 worktree 裡完成一個 feature 的實作
- 修完 bug 想決定怎麼整合
- 使用者問「要 PR 還是直接 merge？」

**上游觸發者：**

- `@zenbu-powers:tdd-coordinator` 收尾階段
- 使用者直接呼叫

---

## 流程

### Step 1：驗證測試

呈現選項之前，**必須**確認測試全綠。

```bash
# 根據專案類型擇一執行
npx wp-env run tests-cli vendor/bin/phpunit 2>&1; echo "EXIT_CODE=$?"
npx playwright test 2>&1; echo "EXIT_CODE=$?"
npx vitest run 2>&1; echo "EXIT_CODE=$?"
```

**若測試失敗：**

```text
測試未全綠（N failures），不得進入收尾流程：

[貼失敗清單與 EXIT_CODE]

請先修復測試，或回 @zenbu-powers:tdd-coordinator 重跑 Green Gate。
```

**停在這裡，不進 Step 2。**

> 🚨 必須符合 [verification-gate.md](../tdd-workflow/references/verification-gate.md) 的 Evidence 鐵律：貼命令輸出，不得用「應該過了」帶過。

### Step 2：判定 Base Branch

```bash
# 嘗試常見的 base branch
git merge-base HEAD main 2>/dev/null \
  || git merge-base HEAD master 2>/dev/null \
  || git merge-base HEAD develop 2>/dev/null
```

若無法自動判定，問使用者：「這個分支從哪一個 base 切出來的？」

### Step 3：偵測環境（CI vs 本地）

```bash
printenv GITHUB_ACTIONS
```

- `true` → CI 模式（沒有互動，預設 commit + push + 開 PR）
- 空值 / 不存在 → 本地模式，呈現 4 選項

### Step 4：呈現選項（本地模式）

精確呈現以下 4 個選項，**不加說明**：

```text
實作完成。接下來怎麼處理？

1. 在本地 merge 回 <base-branch>
2. Push 後開 Pull Request
3. 保留分支不動（之後再處理）
4. 丟棄這次工作

請選擇編號。
```

### Step 5：執行選擇

#### Option 1：本地 Merge

```bash
git checkout <base-branch>
git pull
git merge <feature-branch>

# 在 merged 結果上重跑測試（必須）
<test command>; echo "EXIT_CODE=$?"
```

**測試過了才執行：**

```bash
git branch -d <feature-branch>
```

接著：清理 worktree（Step 6）

#### Option 2：Push 並開 PR

```bash
git push -u origin <feature-branch>
```

呼叫 `@zenbu-powers:git-commit` 確認所有 commit 訊息符合 conventional commits，然後：

```bash
gh pr create --title "<type>(<scope>): <description>" --body "$(cat <<'EOF'
## Summary
- <2-3 個 bullet 描述變更>

## Test Plan
- [ ] <驗證步驟>

## 相關 specs
- <若有 specs/ 變更，列出相關 feature/api 路徑>
EOF
)"
```

接著：清理 worktree（Step 6）

> ⚠️ 預設**不**使用 `--force`、不跳 hook（無 `--no-verify`）。

#### Option 3：保留不動

回報：

```text
分支 <name> 保留中。worktree 在 <path>，需要時可用 EnterWorktree 回來繼續。
```

**不清理 worktree。**

#### Option 4：丟棄

**先要求二次確認：**

```text
此操作將永久刪除：
- 分支 <name>
- 所有 commit：<commit list>
- worktree：<path>

請輸入 "discard" 確認。
```

等使用者輸入精確字串「discard」才繼續。任何其他輸入（包括「yes」「ok」）都不算數。

確認後：

```bash
git checkout <base-branch>
git branch -D <feature-branch>
```

接著：清理 worktree（Step 6）

### Step 6：清理 Worktree

**Options 1, 2, 4 才清理。Option 3 保留。**

```bash
# 確認當前是否在 worktree 內
git worktree list | grep $(git branch --show-current)
```

若在 worktree 內：

```bash
git worktree remove <worktree-path>
# 或使用 ExitWorktree 工具（Claude Code 內建）
```

---

## CI 模式（GitHub Actions）

無互動環境，直接走「Push + 開 PR」：

1. 確認測試全綠（貼證據）
2. 確認所有變更已 commit（必要時呼叫 `@zenbu-powers:git-commit`）
3. `git push -u origin <feature-branch>`
4. `gh pr create` 開 PR（同 Option 2 範本）
5. 由 GitHub Actions 後續自動化處理

---

## 快速對照

| 選項 | Merge | Push | 保留 worktree | 清理分支 | 適用情境 |
|---|---|---|---|---|---|
| 1. 本地 merge | ✓ | - | - | ✓ | 個人專案、無 review 需求 |
| 2. 開 PR | - | ✓ | ✓ | - | 團隊協作、需要 review |
| 3. 保留不動 | - | - | ✓ | - | 還想繼續改 / 等回頭處理 |
| 4. 丟棄 | - | - | - | ✓ (force) | 確認此路不通 |

---

## 常見錯誤

| 錯誤 | 後果 | 修法 |
|---|---|---|
| 跳過測試驗證 | merge 進壞 code、開出紅色 PR | 一律先跑測試貼證據 |
| 開放式問句（「接下來想做什麼？」） | 使用者選擇困難 | 給精確 4 個編號選項 |
| 自動清理 worktree | Option 2/3 仍需要 worktree 但被砍 | 只在 Option 1 / 4 清理 |
| Option 4 無二次確認 | 誤刪未推遠端的 commit | 必須輸入「discard」字串 |
| Force push 沒徵詢 | 覆蓋遠端歷史 | 預設禁止 `--force`，要用必須使用者明說 |
| 使用 `--no-verify` 跳 hook | hook 設計就是擋壞 commit | 預設禁止，hook 失敗請修問題不是繞過 |

---

## Red Flags

**絕不：**

- 在測試紅燈時繼續收尾
- merge 後不重跑測試就刪分支
- 沒輸入「discard」就執行 Option 4
- 預設使用 `--force` push
- 自動跳 git hook

**永遠：**

- 先驗證測試（貼命令輸出）
- 精確 4 個選項
- Option 4 要求字串確認
- 只在 Option 1 / 4 清理 worktree

---

## 整合

**上游呼叫：**

- `@zenbu-powers:tdd-coordinator` 在 Reviewer 全放行後呼叫本 skill 收尾
- 使用者直接喊「收尾」「開 PR」「合 main」

**搭配使用：**

- `zenbu-powers:git-commit` — Step 5 Option 2 開 PR 前，確認 commit 訊息品質
- `zenbu-powers:tdd-workflow` references/verification-gate.md — Step 1 測試證據格式
- `zenbu-powers:tdd-workflow` references/ci-local-dual-mode.md — CI 模式行為對照
- `superpowers:finishing-a-development-branch` — 通用版本，可平行使用
