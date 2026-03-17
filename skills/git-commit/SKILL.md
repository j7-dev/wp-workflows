---
name: git-commit
description: 'Execute git commit with conventional commit message analysis, intelligent staging, and message generation. Use when user asks to commit changes, create a git commit, or mentions "/commit". Supports: (1) Auto-detecting type and scope from changes, (2) Generating conventional commit messages from diff, (3) Interactive commit with optional type/scope/description overrides, (4) Intelligent file staging for logical grouping'
model: haiku
license: MIT
allowed-tools: Bash
---

# Git Commit with Conventional Commits

## Overview

Create standardized, semantic git commits using the Conventional Commits specification. Analyze the actual diff to determine appropriate type, scope, and message.

## Conventional Commit Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Commit Types

| Type       | Purpose                        |
| ---------- | ------------------------------ |
| `feat`     | New feature                    |
| `fix`      | Bug fix                        |
| `docs`     | Documentation only             |
| `style`    | Formatting/style (no logic)    |
| `refactor` | Code refactor (no feature/fix) |
| `perf`     | Performance improvement        |
| `test`     | Add/update tests               |
| `build`    | Build system/dependencies      |
| `ci`       | CI/config changes              |
| `chore`    | Maintenance/misc               |
| `revert`   | Revert commit                  |

## Breaking Changes

```
# Exclamation mark after type/scope
feat!: remove deprecated endpoint

# BREAKING CHANGE footer
feat: allow config to extend other configs

BREAKING CHANGE: `extends` key behavior changed
```

## Default Behavior

**若此 SKILL 被呼叫但沒有其他 prompt 說明時：**

### 單一 commit（變更集中、邏輯一致）

若所有異動屬於同一個 type/scope/目的，做一次原子 commit：
1. 自動 `git add .` 暫存所有異動
2. 分析 diff 確定 commit type/scope
3. 產出繁體中文 conventional commit message
4. 執行 commit

### 多個 commit（變更分散、跨越多個關注點）

**當變更檔案較多，且涉及不同 type 或不相關的 scope 時，必須拆分為多個原子 commit，不可全部擠進同一個 commit。**

#### 判斷是否需要拆分

觀察 `git status` 與 `git diff` 的結果，若符合以下任一條件即應拆分：

- 同時存在 **不同 commit type** 的變更（例如：`feat` + `fix` + `docs`）
- 變更橫跨 **不相關的 scope**（例如：auth 模組 + 購物車模組）
- 有 **測試檔案**（`*.test.*`、`*.spec.*`）與對應的生產程式碼同時異動
- 有 **設定檔** 或 **CI/build 腳本** 與功能程式碼混在一起
- 有 **文件** 與程式碼同時異動

#### 拆分流程

1. 先執行 `git status --porcelain` 與 `git diff` 取得完整變更清單
2. 將所有異動檔案**按 type + scope 分組**，規劃 commit 清單（先在腦中或顯示給使用者確認）
3. 建議的分組順序：
   - `build` / `ci` / `chore`（基礎建設）先 commit
   - `feat` / `fix` / `refactor`（功能本體）接著 commit
   - `test`（測試）緊跟在對應功能後
   - `docs`（文件）最後 commit
4. 逐一 `git add <specific files>` 只 stage 當前 commit 的檔案
5. 執行 commit，完成後繼續下一個分組，直到所有變更都已 commit

#### 範例拆分情境

```
# 變更清單：
M  src/auth/login.ts          → feat(auth)
M  src/auth/login.test.ts     → test(auth)
M  src/cart/checkout.ts       → fix(cart)
M  docs/api.md                → docs
M  .github/workflows/ci.yml   → ci

# 拆成 4 個 commit：
1. ci: 更新 CI workflow 設定
2. feat(auth): 實作登入邏輯
3. test(auth): 新增登入單元測試
4. fix(cart): 修正結帳流程問題
5. docs: 更新 API 文件
```

## Workflow

### 1. Analyze Diff

```bash
# If files are staged, use staged diff
git diff --staged

# If nothing staged, use working tree diff
git diff

# Also check status
git status --porcelain
```

### 2. Stage Files (if needed)

If nothing is staged or you want to group changes differently:

```bash
# Stage specific files
git add path/to/file1 path/to/file2

# Stage by pattern
git add *.test.*
git add src/components/*

# Interactive staging
git add -p
```

**Never commit secrets** (.env, credentials.json, private keys).

### 3. Generate Commit Message

Analyze the diff to determine:

- **Type**: What kind of change is this?
- **Scope**: What area/module is affected?
- **Description**: One-line summary of what changed (present tense, imperative mood, <72 chars)

產出的 commit 以繁體中文為主

### 4. Execute Commit

```bash
# Single line
git commit -m "<type>[scope]: <description>"

# Multi-line with body/footer
git commit -m "$(cat <<'EOF'
<type>[scope]: <description>

<optional body>

<optional footer>
EOF
)"
```

## Best Practices

- One logical change per commit
- Present tense: "add" not "added"
- Imperative mood: "fix bug" not "fixes bug"
- Reference issues: `Closes #123`, `Refs #456`
- Keep description under 72 characters

## Git Safety Protocol

- NEVER update git config
- NEVER run destructive commands (--force, hard reset) without explicit request
- NEVER skip hooks (--no-verify) unless user asks
- NEVER force push to main/master
- If commit fails due to hooks, fix and create NEW commit (don't amend)
