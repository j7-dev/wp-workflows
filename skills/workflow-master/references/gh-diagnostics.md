# gh CLI 診斷模式

> 使用 `gh` CLI 查看線上 workflow runs、runners、PR checks、issues 狀態。

## Workflow Runs

```bash
# 列出最近的 workflow runs
gh run list
gh run list --limit 20

# 篩選特定 workflow
gh run list --workflow ci.yml
gh run list --workflow "Build and Test"

# 篩選狀態
gh run list --status failure
gh run list --status in_progress
gh run list --status queued

# 篩選分支
gh run list --branch main
gh run list --branch feature/xxx

# 查看特定 run 詳情
gh run view <run-id>

# 查看失敗的 log
gh run view <run-id> --log-failed

# 查看完整 log
gh run view <run-id> --log

# 查看特定 job 的 log
gh run view <run-id> --job <job-id> --log

# 即時監看執行中的 run
gh run watch <run-id>

# 重新執行失敗的 jobs
gh run rerun <run-id> --failed

# 重新執行全部 jobs
gh run rerun <run-id>

# 開啟 debug logging 重跑
gh run rerun <run-id> --debug

# 取消執行中的 run
gh run cancel <run-id>

# 下載 artifacts
gh run download <run-id>
gh run download <run-id> -n <artifact-name>
```

## Workflow 管理

```bash
# 列出所有 workflows
gh workflow list
gh workflow list --all  # 包含 disabled

# 查看特定 workflow
gh workflow view <workflow-id>
gh workflow view ci.yml

# 手動觸發 workflow_dispatch
gh workflow run ci.yml
gh workflow run ci.yml --ref feature-branch
gh workflow run ci.yml -f environment=staging -f debug=true

# 啟用/停用 workflow
gh workflow enable <workflow-id>
gh workflow disable <workflow-id>
```

## PR Checks

```bash
# 查看 PR 的所有 checks
gh pr checks <pr-number>

# 等待 checks 完成
gh pr checks <pr-number> --watch

# 查看失敗的 checks
gh pr checks <pr-number> --fail-fast

# 查看 PR 的 review 狀態
gh pr view <pr-number>
gh pr view <pr-number> --json reviews,statusCheckRollup

# JSON 格式取得詳細 check 資訊
gh pr view <pr-number> --json statusCheckRollup --jq '.statusCheckRollup[] | select(.conclusion == "FAILURE") | {name: .name, url: .detailsUrl}'
```

## Issue 管理

```bash
# 列出 open issues
gh issue list

# 篩選標籤
gh issue list --label "bug"
gh issue list --label "ci/cd"

# 搜尋 issue
gh issue list --search "workflow failure"

# 查看特定 issue
gh issue view <issue-number>

# 建立 issue（報告 workflow 問題）
gh issue create --title "CI: workflow failure in build job" \
  --body "## Description\n\nThe build job fails on..." \
  --label "bug,ci/cd"
```

## Runners

```bash
# 列出 self-hosted runners（需 admin 權限）
gh api repos/{owner}/{repo}/actions/runners --jq '.runners[] | {name, status, os, labels: [.labels[].name]}'

# 查看 runner 使用量
gh api repos/{owner}/{repo}/actions/runs --jq '[.workflow_runs[] | select(.status == "in_progress")] | length'

# 查看 GitHub-hosted runner 用量（org 級別）
gh api orgs/{org}/settings/billing/actions --jq '{total_minutes_used, total_paid_minutes_used, included_minutes}'
```

## Repository Secrets & Variables

```bash
# 列出 secrets（只能看到名稱，不能看值）
gh secret list

# 設定 secret
gh secret set MY_SECRET
gh secret set MY_SECRET --body "value"
gh secret set MY_SECRET < secret-file.txt

# 列出 variables
gh variable list

# 設定 variable
gh variable set MY_VAR --body "value"

# Environment-specific
gh secret list --env production
gh secret set MY_SECRET --env production
```

## 進階 JSON 查詢模式

```bash
# 最近 5 次失敗的 run，取得 job 名稱和錯誤
gh run list --status failure --limit 5 --json databaseId,displayTitle,conclusion,createdAt \
  --jq '.[] | "\(.databaseId) | \(.displayTitle) | \(.conclusion) | \(.createdAt)"'

# 特定 run 的所有 jobs 和狀態
gh run view <run-id> --json jobs \
  --jq '.jobs[] | "\(.name): \(.conclusion) (\(.steps | map(select(.conclusion == "failure")) | length) failed steps)"'

# 找出最近哪個 commit 開始失敗
gh run list --workflow ci.yml --limit 20 --json headSha,conclusion,createdAt \
  --jq '.[] | "\(.headSha[:8]) \(.conclusion) \(.createdAt)"'

# 查看 workflow 執行時間趨勢
gh run list --workflow ci.yml --limit 10 --json databaseId,createdAt,updatedAt \
  --jq '.[] | {id: .databaseId, duration: ((.updatedAt | fromdateiso8601) - (.createdAt | fromdateiso8601))}'
```

## 常用診斷組合

### 1. 快速診斷最近的失敗
```bash
# 找到最近一次失敗
RUN_ID=$(gh run list --status failure --limit 1 --json databaseId --jq '.[0].databaseId')
# 查看失敗 log
gh run view "$RUN_ID" --log-failed
```

### 2. 比較成功 vs 失敗的 run
```bash
# 最近一次成功
gh run view $(gh run list --status success --limit 1 --json databaseId --jq '.[0].databaseId')
# 最近一次失敗
gh run view $(gh run list --status failure --limit 1 --json databaseId --jq '.[0].databaseId')
```

### 3. 監控特定 PR 的 CI 狀態
```bash
gh pr checks <pr-number> --watch --fail-fast
```

### 4. 批次重跑失敗
```bash
gh run list --status failure --limit 5 --json databaseId --jq '.[].databaseId' | \
  xargs -I{} gh run rerun {} --failed
```
