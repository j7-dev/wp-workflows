# GitHub Actions Events Reference

## Event Configuration Format

```yaml
on:
  <event_name>:
    types: [activity_type1, activity_type2]
    branches: ['main', 'releases/**']
    branches-ignore: ['development']
    tags: ['v1.*']
    tags-ignore: ['v2.*']
    paths: ['src/**', '**.ts']
    paths-ignore: ['docs/**', '**.md']
```

**Rules:**
- Cannot use both `branches` and `branches-ignore` for same event
- Cannot use both `tags` and `tags-ignore` for same event
- Cannot use both `paths` and `paths-ignore` for same event
- `branches`/`tags` and `paths` filters are AND-ed (both must match)

---

## Filter Pattern Syntax

```
*          Matches any character except /
**         Matches any character including /
?          Matches any single character
[abc]      Character set (a, b, or c)
!          Negate (must be first character in pattern item)
```

```yaml
branches:
  - 'releases/**'
  - '!releases/**-alpha'    # Exclude alpha releases

paths:
  - '**.js'                 # Any .js file anywhere
  - 'src/**'                # Any file under src/
  - '!docs/**'              # Exclude docs/
```

---

## All Events

### `push`

```yaml
on:
  push:
    branches: ['main', 'releases/**']
    branches-ignore: ['gh-pages']
    tags: ['v*']
    paths: ['src/**']
# GITHUB_SHA: tip commit of the pushed ref
# GITHUB_REF: refs/heads/<branch> or refs/tags/<tag>
# No event if >5000 branches pushed at once
# No event if >3 tags pushed at once
```

### `pull_request`

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review, closed]
    # Default types: opened, synchronize, reopened
    branches: ['main']
    paths: ['src/**']
# GITHUB_SHA: last merge commit on target branch
# GITHUB_REF: refs/pull/<N>/merge
# Fork PRs: no secrets, GITHUB_TOKEN read-only
# No event if PR has merge conflict
```

**Activity types:** `assigned`, `unassigned`, `labeled`, `unlabeled`, `opened`, `edited`, `closed`, `reopened`, `synchronize`, `converted_to_draft`, `locked`, `unlocked`, `enqueued`, `dequeued`, `milestoned`, `demilestoned`, `ready_for_review`, `review_requested`, `review_request_removed`, `auto_merge_enabled`, `auto_merge_disabled`

```yaml
# Detect merged PR
on:
  pull_request:
    types: [closed]
jobs:
  if_merged:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - run: echo "Merged!"
```

### `pull_request_target`

```yaml
on:
  pull_request_target:
    types: [opened, synchronize, reopened]
# Runs against BASE branch context; has access to secrets
# SECURITY RISK: Do NOT checkout PR head and run untrusted code with secrets
# Use for: labeling, commenting on PRs from forks (without running fork code)
```

### `schedule`

```yaml
on:
  schedule:
    - cron: '30 5 * * 1-5'          # Mon-Fri at 05:30 UTC
      timezone: "America/New_York"   # Optional IANA timezone
    - cron: '0 0 * * *'             # Daily midnight UTC
```

**Cron syntax:**
```
┌──────────── minute (0-59)
│ ┌────────── hour (0-23)
│ │ ┌──────── day of month (1-31)
│ │ │ ┌────── month (1-12)
│ │ │ │ ┌──── day of week (0-6, 0=Sunday)
* * * * *
```

**Operators:** `*` (any), `,` (list), `-` (range), `/` (step)

- Minimum interval: 5 minutes
- Auto-disabled after 60 days of inactivity (public repos)
- May be delayed during high load
- `GITHUB_SHA`: last commit on default branch

### `workflow_dispatch`

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options: [dev, staging, prod]
        default: dev
      version:
        description: 'Version tag (optional)'
        required: false
        type: string
        default: ''
      debug:
        description: 'Enable debug mode'
        type: boolean
        default: false
# Access: ${{ inputs.environment }} or ${{ github.event.inputs.environment }}
# Max 25 inputs; max 65,535 chars payload
# Only available on default branch unless overridden
```

**Input types:** `string`, `boolean`, `number`, `choice`, `environment`

**CLI trigger:**
```bash
gh workflow run deploy.yml -f environment=staging -f debug=true
gh workflow run deploy.yml --ref feature-branch
```

### `workflow_call`

```yaml
on:
  workflow_call:
    inputs:
      config-path:
        required: true
        type: string                  # string | number | boolean
      environment:
        required: false
        type: string
        default: "production"
    secrets:
      deploy-token:
        required: true
        description: 'Deployment token'
      optional-secret:
        required: false
    outputs:
      result:
        description: 'Operation result'
        value: ${{ jobs.build.outputs.result }}
# Caller accesses outputs via needs.<job_id>.outputs.<name>
```

### `workflow_run`

```yaml
on:
  workflow_run:
    workflows: ["Build and Test", "Lint"]   # Workflow names (not file names)
    types: [completed]                       # completed | requested | in_progress
    branches: ['main']                       # Optional branch filter
# GITHUB_SHA: last commit on DEFAULT branch (not triggering workflow's SHA)
# GITHUB_REF: default branch
# Has full secret access regardless of upstream trigger
# Max 3 levels of workflow_run chaining
# Check upstream result: ${{ github.event.workflow_run.conclusion }}
```

```yaml
# Conditional on upstream result
jobs:
  on-success:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
  on-failure:
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    runs-on: ubuntu-latest
```

### `release`

```yaml
on:
  release:
    types: [published]
# Activity types: published | unpublished | created | edited | deleted | prereleased | released
# GITHUB_SHA: last commit in tagged release
# GITHUB_REF: refs/tags/<tag_name>
# Draft releases don't trigger created/edited/deleted
```

### `issues`

```yaml
on:
  issues:
    types: [opened, edited, labeled, closed, reopened, milestoned]
# Activity types: assigned, unassigned, labeled, unlabeled, opened, edited,
#   deleted, transferred, pinned, unpinned, closed, reopened,
#   milestoned, demilestoned, typed, untyped
```

### `issue_comment`

```yaml
on:
  issue_comment:
    types: [created, edited, deleted]
# Fires for both issue and PR comments
# Distinguish: if: github.event.issue.pull_request != null
```

### `pull_request_review`

```yaml
on:
  pull_request_review:
    types: [submitted, edited, dismissed]
# Check approval: if: github.event.review.state == 'approved'
```

### `pull_request_review_comment`

```yaml
on:
  pull_request_review_comment:
    types: [created, edited, deleted]
```

### `repository_dispatch`

```yaml
on:
  repository_dispatch:
    types: [build-request, test-complete]
# Trigger via API: POST /repos/{owner}/{repo}/dispatches
# Payload: github.event.client_payload.*
# Max 65,535 chars; max 10 top-level client_payload properties
# event_type max 100 chars
```

```bash
# Trigger via CLI
curl -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/OWNER/REPO/dispatches \
  -d '{"event_type":"build-request","client_payload":{"version":"1.2.3"}}'
```

### `check_run`

```yaml
on:
  check_run:
    types: [created, rerequested, completed, requested_action]
# Note: GitHub Actions-created check suites are ignored (prevents recursion)
```

### `check_suite`

```yaml
on:
  check_suite:
    types: [completed]
# Note: GitHub Actions-created check suites are ignored
```

### `create` / `delete`

```yaml
on:
  create:     # Branch or tag created
  delete:     # Branch or tag deleted
# No event if >3 tags created/deleted at once
```

### `deployment` / `deployment_status`

```yaml
on:
  deployment:           # New deployment created
  deployment_status:    # Deployment status updated (not 'inactive')
```

### `discussion` / `discussion_comment`

```yaml
on:
  discussion:
    types: [created, edited, answered, labeled, category_changed]
  discussion_comment:
    types: [created, edited, deleted]
# Public preview; subject to change
```

### `fork`

```yaml
on:
  fork:    # Repository forked
```

### `gollum`

```yaml
on:
  gollum:  # Wiki page created or updated
```

### `label`

```yaml
on:
  label:
    types: [created, edited, deleted]
# Label management events (not adding labels to issues - that's issues.labeled)
```

### `merge_group`

```yaml
on:
  merge_group:
    types: [checks_requested]
# Required for merge queue integration
# Add alongside pull_request for complete PR validation
```

### `milestone`

```yaml
on:
  milestone:
    types: [created, closed, opened, edited, deleted]
```

### `page_build`

```yaml
on:
  page_build:  # GitHub Pages source pushed
```

### `public`

```yaml
on:
  public:  # Repository changed from private to public
```

### `registry_package`

```yaml
on:
  registry_package:
    types: [published, updated]
```

### `status`

```yaml
on:
  status:  # Commit status changed
# Check state: github.event.state ('error'|'failure'|'pending'|'success')
```

### `watch`

```yaml
on:
  watch:
    types: [started]  # Repository starred
```

### `branch_protection_rule`

```yaml
on:
  branch_protection_rule:
    types: [created, edited, deleted]
```

---

## Multiple Events

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:
  schedule:
    - cron: '0 2 * * *'
```

---

## Event Context Variables Summary

| Event | `github.sha` | `github.ref` |
|-------|-------------|-------------|
| `push` | Pushed commit | Updated ref |
| `pull_request` | Merge commit on target | `refs/pull/<N>/merge` |
| `pull_request_target` | Last commit on default branch | Default branch |
| `workflow_dispatch` | Last commit on selected branch | Selected branch |
| `workflow_run` | Last commit on DEFAULT branch | Default branch |
| `schedule` | Last commit on default branch | Default branch |
| `release` | Tagged commit | `refs/tags/<tag>` |
| `repository_dispatch` | Last commit on default branch | Default branch |
