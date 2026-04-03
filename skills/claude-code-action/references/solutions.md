# claude-code-action: Complete Solutions & Workflow Examples

## Automatic PR Code Review (Basic)

```yaml
name: Claude Auto Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            REPO: ${{ github.repository }}
            PR NUMBER: ${{ github.event.pull_request.number }}

            Please review this pull request with a focus on:
            - Code quality and best practices
            - Potential bugs or issues
            - Security implications
            - Performance considerations

            Note: The PR branch is already checked out in the current working directory.

            Use `gh pr comment` for top-level feedback.
            Use `mcp__github_inline_comment__create_inline_comment` (with `confirmed: true`) to highlight specific code issues.
            Only post GitHub comments - don't submit review text as messages.
          claude_args: |
            --allowedTools "mcp__github_inline_comment__create_inline_comment,Bash(gh pr comment:*),Bash(gh pr diff:*),Bash(gh pr view:*)"
```

## Automatic PR Code Review (With Progress Tracking)

```yaml
name: Claude Auto Review with Tracking
on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          track_progress: "true"
          prompt: |
            REPO: ${{ github.repository }}
            PR NUMBER: ${{ github.event.pull_request.number }}

            Please review this pull request and provide detailed feedback
            using inline comments for specific issues.
          claude_args: |
            --allowedTools "mcp__github_inline_comment__create_inline_comment,Bash(gh pr comment:*),Bash(gh pr diff:*),Bash(gh pr view:*)"
```

## Path-Specific Security Review

```yaml
name: Review Critical Files
on:
  pull_request:
    types: [opened, synchronize]
    paths:
      - "src/auth/**"
      - "src/api/**"
      - "config/security.yml"

jobs:
  security-review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            REPO: ${{ github.repository }}
            PR NUMBER: ${{ github.event.pull_request.number }}

            This PR modifies critical authentication or API files.
            Provide a security-focused review:
            - Authentication and authorization flows
            - Input validation and sanitization
            - SQL injection or XSS vulnerabilities
            - API security best practices
          claude_args: |
            --allowedTools "mcp__github_inline_comment__create_inline_comment,Bash(gh pr comment:*)"
```

## First-Time Contributor Review

```yaml
name: External Contributor Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  external-review:
    if: github.event.pull_request.author_association == 'FIRST_TIME_CONTRIBUTOR'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            REPO: ${{ github.repository }}
            PR NUMBER: ${{ github.event.pull_request.number }}
            CONTRIBUTOR: ${{ github.event.pull_request.user.login }}

            This is a first-time contribution from @${{ github.event.pull_request.user.login }}.
            Provide a comprehensive review:
            - Compliance with project coding standards
            - Proper test coverage
            - Documentation for new features
            - Potential breaking changes
            - License header requirements

            Be welcoming but thorough.
          claude_args: |
            --allowedTools "mcp__github_inline_comment__create_inline_comment,Bash(gh pr comment:*),Bash(gh pr view:*)"
```

## Scheduled Repository Maintenance

```yaml
name: Weekly Maintenance
on:
  schedule:
    - cron: "0 0 * * 0"  # Every Sunday at midnight
  workflow_dispatch:

jobs:
  maintenance:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            REPO: ${{ github.repository }}

            Perform weekly repository maintenance:
            1. Check for outdated dependencies in package.json
            2. Scan for security vulnerabilities using `npm audit`
            3. Review open issues older than 90 days
            4. Check for TODO comments in recent commits
            5. Verify README.md examples still work

            Create a single issue summarizing any findings.
          claude_args: |
            --allowedTools "Read,Bash(npm:*),Bash(gh issue:*),Bash(git:*)"
```

## Issue Auto-Triage and Labeling

```yaml
name: Issue Triage
on:
  issues:
    types: [opened]

jobs:
  triage:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            REPO: ${{ github.repository }}
            ISSUE NUMBER: ${{ github.event.issue.number }}
            TITLE: ${{ github.event.issue.title }}
            BODY: ${{ github.event.issue.body }}
            AUTHOR: ${{ github.event.issue.user.login }}

            Analyze this new issue:
            1. Determine if it's a bug report, feature request, or question
            2. Assess priority (critical, high, medium, low)
            3. Check if it duplicates existing issues

            Use `./scripts/gh.sh` for GitHub interactions.
            Apply labels: `./scripts/edit-issue-labels.sh --add-label "label1" --add-label "label2"`
            If duplicate, post a comment mentioning original issue.
          claude_args: |
            --allowedTools "Bash(./scripts/gh.sh:*),Bash(./scripts/edit-issue-labels.sh:*)"
```

## Documentation Sync on API Changes

```yaml
name: Sync API Documentation
on:
  pull_request:
    types: [opened, synchronize]
    paths:
      - "src/api/**/*.ts"
      - "src/routes/**/*.ts"

jobs:
  doc-sync:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.ref }}
          fetch-depth: 0

      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            REPO: ${{ github.repository }}
            PR NUMBER: ${{ github.event.pull_request.number }}

            This PR modifies API endpoints. Please:
            1. Review API changes in src/api and src/routes
            2. Update API.md to document new or changed endpoints
            3. Update OpenAPI spec if needed
            4. Commit documentation updates to this PR branch.
          claude_args: |
            --allowedTools "Read,Write,Edit,Bash(git:*)"
```

## OWASP Security Review

```yaml
name: Security Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  security:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            REPO: ${{ github.repository }}
            PR NUMBER: ${{ github.event.pull_request.number }}

            Perform comprehensive security review:

            OWASP Top 10:
            - SQL Injection, XSS, Broken Auth, Sensitive Data Exposure
            - XXE, Broken Access Control, Security Misconfiguration, CSRF
            - Known Vulnerable Components, Insufficient Logging

            Additional:
            - Hardcoded secrets/credentials
            - Insecure cryptographic practices
            - SSRF, race conditions, TOCTOU issues

            Rate severity: CRITICAL, HIGH, MEDIUM, LOW, NONE.
          claude_args: |
            --allowedTools "mcp__github_inline_comment__create_inline_comment,Bash(gh pr comment:*),Bash(gh pr diff:*)"
```

## Structured Output: Flaky Test Detection

```yaml
name: Analyze Test Failure
on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]

jobs:
  analyze:
    if: github.event.workflow_run.conclusion == 'failure'
    runs-on: ubuntu-latest
    steps:
      - name: Detect flaky tests
        id: analyze
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            Check the CI logs and determine if this is a flaky test.
            Return: is_flaky (boolean), confidence (0-1), summary (string)
          claude_args: |
            --json-schema '{"type":"object","properties":{"is_flaky":{"type":"boolean"},"confidence":{"type":"number"},"summary":{"type":"string"}},"required":["is_flaky"]}'

      - name: Retry if flaky
        if: fromJSON(steps.analyze.outputs.structured_output).is_flaky == true
        run: gh workflow run CI
```

## CI Debug Helper (with actions: read)

```yaml
name: Claude CI Helper
on:
  issue_comment:
    types: [created]

permissions:
  contents: write
  pull-requests: write
  issues: write
  actions: read  # Required for CI access
  id-token: write

jobs:
  claude-ci-helper:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          additional_permissions: |
            actions: read
          # Claude can now respond to "@claude why did the CI fail?"
```

## Custom App with Bedrock

```yaml
name: Claude with Bedrock
on:
  issue_comment:
    types: [created]

permissions:
  id-token: write
  contents: write
  pull-requests: write
  issues: write

jobs:
  claude:
    runs-on: ubuntu-latest
    steps:
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}
          aws-region: us-west-2

      - name: Generate GitHub App token
        id: app-token
        uses: actions/create-github-app-token@v2
        with:
          app-id: ${{ secrets.APP_ID }}
          private-key: ${{ secrets.APP_PRIVATE_KEY }}

      - uses: anthropics/claude-code-action@v1
        with:
          use_bedrock: "true"
          github_token: ${{ steps.app-token.outputs.token }}
          claude_args: |
            --model anthropic.claude-4-0-sonnet-20250805-v1:0
```

## Prompt Template Variables

Available GitHub Actions context variables for use in `prompt`:

```
${{ github.repository }}                          # org/repo
${{ github.event.pull_request.number }}           # PR number
${{ github.event.pull_request.title }}            # PR title
${{ github.event.pull_request.body }}             # PR description
${{ github.event.pull_request.user.login }}       # PR author
${{ github.event.pull_request.author_association }}  # OWNER/MEMBER/CONTRIBUTOR/etc
${{ github.event.issue.number }}                  # Issue number
${{ github.event.issue.title }}                   # Issue title
${{ github.event.issue.body }}                    # Issue body
${{ github.event.issue.user.login }}              # Issue author
${{ github.event.comment.body }}                  # Comment text
${{ github.actor }}                               # User who triggered workflow
${{ github.base_ref }}                            # Base branch
${{ github.head_ref }}                            # Head branch
```

## Common Tool Permission Patterns

```yaml
# PR comments only
--allowedTools "Bash(gh pr comment:*)"

# PR review with inline comments
--allowedTools "mcp__github_inline_comment__create_inline_comment,Bash(gh pr comment:*),Bash(gh pr diff:*),Bash(gh pr view:*)"

# File editing + git
--allowedTools "Read,Write,Edit,Bash(git:*)"

# Full development workflow
--allowedTools "Read,Write,Edit,Bash(npm:*),Bash(git:*),Bash(gh:*)"

# Node.js testing
--allowedTools "Read,Write,Edit,Bash(npm install),Bash(npm run test),Bash(npm run build)"

# Issue management
--allowedTools "Bash(./scripts/gh.sh:*),Bash(./scripts/edit-issue-labels.sh:*)"

# Disable specific tools
--disallowedTools "TaskOutput,KillTask,WebSearch"
```
