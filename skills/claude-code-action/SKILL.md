---
name: claude-code-action
description: >
  Complete API reference for anthropics/claude-code-action GitHub Action (v1.0).
  Use this skill when configuring, writing, or debugging GitHub Actions workflows
  that use Claude for PR review, issue handling, code automation, or any @claude
  mention-based interaction. Also covers cloud provider auth (Bedrock/Vertex/Foundry),
  MCP server integration, structured outputs, commit signing, and security configuration.
  Trigger whenever user mentions claude-code-action, GitHub Action for Claude, @claude
  in workflows, automated PR review with Claude, or claude CI/CD automation.
---

# claude-code-action v1.0 API Reference

Source: https://github.com/anthropics/claude-code-action  
Built on: `anthropics/claude-code-base-action`  
Runtime: Bun 1.3.6

## Action Reference

```yaml
uses: anthropics/claude-code-action@v1
```

## Inputs

### Authentication (one required)

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `anthropic_api_key` | string | - | Anthropic API key. Required for direct API. Not needed for Bedrock/Vertex/Foundry |
| `claude_code_oauth_token` | string | - | OAuth token alternative. Pro/Max users: `claude setup-token` |
| `github_token` | string | - | Custom GitHub App token. Only use when connecting your own GitHub App. Default: built-in Claude App |
| `use_bedrock` | bool | `"false"` | Use Amazon Bedrock + OIDC auth |
| `use_vertex` | bool | `"false"` | Use Google Vertex AI + OIDC auth |
| `use_foundry` | bool | `"false"` | Use Microsoft Foundry + OIDC auth |

### Core Behavior

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `prompt` | string | `""` | Instructions for Claude. If provided → automation mode (runs immediately). If absent → interactive mode (waits for @claude mentions) |
| `trigger_phrase` | string | `"@claude"` | Phrase to look for in comments, issue/PR bodies, and issue titles |
| `assignee_trigger` | string | - | Assignee username that triggers the action (issue assignment) |
| `label_trigger` | string | `"claude"` | Label that triggers the action when applied to an issue |
| `track_progress` | bool | `"false"` | Force tag mode with tracking comments. Works with: `pull_request` (opened, synchronize, ready_for_review, reopened) and `issues` (opened, edited, labeled, assigned) events |
| `use_sticky_comment` | bool | `"false"` | Use one comment for all PR feedback (only with claude[bot] auth, not custom github_token) |
| `classify_inline_comments` | bool | `"true"` | Buffer inline comments without `confirmed: true`, classify via Haiku after session ends. Set `"false"` to post all immediately |
| `include_fix_links` | bool | `"true"` | Include "Fix this" links in PR code review feedback |

### Claude CLI Configuration

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `claude_args` | string | `""` | Additional CLI arguments passed directly to Claude CLI (e.g., `--max-turns 10 --model ...`) |
| `settings` | string | `""` | Claude Code settings as JSON string or path to settings JSON file |
| `plugins` | string | `""` | Newline-separated plugin names to install (e.g., `code-review@claude-code-plugins`) |
| `plugin_marketplaces` | string | `""` | Newline-separated marketplace Git URLs to add before plugin installation |

### Branch & Git

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `base_branch` | string | repo default | Base branch for creating new branches |
| `branch_prefix` | string | `"claude/"` | Prefix for Claude-created branches. Use `"claude-"` for dash format |
| `branch_name_template` | string | `""` | Template with variables: `{{prefix}}`, `{{entityType}}`, `{{entityNumber}}`, `{{timestamp}}`, `{{sha}}`, `{{label}}`, `{{description}}`. Default: `{{prefix}}{{entityType}}-{{entityNumber}}-{{timestamp}}` |
| `use_commit_signing` | bool | `"false"` | Sign commits via GitHub API (verified badge, no complex git ops like rebase) |
| `ssh_signing_key` | string | `""` | SSH private key for commit signing via git CLI (supports rebase/cherry-pick). Takes precedence over `use_commit_signing` |
| `bot_id` | string | `"41898282"` | GitHub user ID for git operations (Claude's default). Required with `ssh_signing_key` for verified commits |
| `bot_name` | string | `"claude[bot]"` | GitHub username for git operations |

### Permissions & Access

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `additional_permissions` | string | `""` | Extra GitHub permissions (e.g., `actions: read` for CI log access) |
| `allowed_bots` | string | `""` | Comma-separated bot usernames or `"*"` to allow all bots. WARNING: `"*"` on public repos allows external Apps |
| `allowed_non_write_users` | string | `""` | RISKY: Comma-separated usernames or `"*"` to bypass write permission check. Requires `github_token` input. Only for minimal-permission workflows |
| `include_comments_by_actor` | string | `""` | Comma-separated actors to INCLUDE in comments. Supports `*[bot]` wildcard. Empty = include all |
| `exclude_comments_by_actor` | string | `""` | Comma-separated actors to EXCLUDE from comments. Supports `*[bot]`, `renovate[bot]`. Exclusion takes priority |

### Output & Debug

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `display_report` | bool | `"false"` | Show Claude Code Report in GitHub Step Summary. WARNING: outputs Claude-authored content publicly |
| `show_full_output` | bool | `"false"` | Show full JSON output including tool results. WARNING: may expose secrets/credentials in public repo logs |

### Custom Executables

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `path_to_claude_code_executable` | string | `""` | Custom Claude Code binary path. Skips auto-install. For Nix/custom containers |
| `path_to_bun_executable` | string | `""` | Custom Bun binary path. Skips auto-install |

## Outputs

| Output | Description |
|--------|-------------|
| `execution_file` | Path to Claude Code execution output file |
| `branch_name` | Branch created by Claude for this execution |
| `github_token` | GitHub token used by the action (Claude App token if available) |
| `structured_output` | JSON string of all structured output fields when `--json-schema` is in `claude_args`. Access with `fromJSON(steps.id.outputs.structured_output).field_name` |
| `session_id` | Claude Code session ID. Use with `--resume` to continue conversation |

## Deprecated Inputs (v0.x → v1.0 migration)

| Old Input | Migration |
|-----------|-----------|
| `mode` | Remove. Auto-detected from workflow context |
| `direct_prompt` | Use `prompt` |
| `override_prompt` | Use `prompt` with GitHub context variables |
| `custom_instructions` | Use `claude_args: "--system-prompt 'Your instructions'"` |
| `max_turns` | Use `claude_args: "--max-turns 5"` |
| `model` | Use `claude_args: "--model claude-sonnet-4-5"` |
| `fallback_model` | Use `claude_args` or `settings` |
| `allowed_tools` | Use `claude_args: "--allowedTools Edit,Read,Write"` |
| `disallowed_tools` | Use `claude_args: "--disallowedTools WebSearch"` |
| `mcp_config` | Use `claude_args: "--mcp-config '{...}'"` |
| `claude_env` | Use `settings` with `"env"` object |

## Mode Detection

| Condition | Mode | Behavior |
|-----------|------|----------|
| `prompt` input provided | Automation mode | Executes immediately without @claude mention |
| No `prompt` input | Interactive mode | Waits for `trigger_phrase` in comments |

## Supported Events

- `pull_request` / `pull_request_target` — opened, synchronize, ready_for_review, reopened
- `issue_comment` — created
- `pull_request_review_comment` — created
- `pull_request_review` — submitted
- `issues` — opened, assigned, labeled
- `repository_dispatch` — custom events
- `schedule` — cron-based automation
- `workflow_dispatch` — manual triggers

## Branch Behavior

| Trigger Context | Behavior |
|-----------------|----------|
| Open PR | Pushes directly to existing PR branch |
| Closed/merged PR | Creates new branch |
| Issue | Always creates new branch |
| Clone depth (PR) | `--depth=20` |
| Clone depth (new branch) | `--depth=1` |

## Default Tools Available

By default, Claude has access to:
- File operations: read, edit, commit files; read-only git commands
- Comment management: create/update PR comments
- Basic GitHub API operations

NOT available by default:
- `Bash` (arbitrary command execution)
- `WebSearch`

Enable with `claude_args: "--allowedTools Bash(npm:*),Bash(git:*)"` or disable with `--disallowedTools`.

## Complete Workflow Template

```yaml
name: Claude Assistant
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned, labeled]
  pull_request_review:
    types: [submitted]

permissions:
  contents: write
  pull-requests: write
  issues: write
  id-token: write  # Required for OIDC / Claude App

jobs:
  claude-response:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          trigger_phrase: "@claude"
```

## Structured Outputs

Use `--json-schema` in `claude_args` to get validated JSON output:

```yaml
- name: Detect flaky tests
  id: analyze
  uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    prompt: |
      Check CI logs. Return: is_flaky (bool), confidence (0-1), summary (string)
    claude_args: |
      --json-schema '{"type":"object","properties":{"is_flaky":{"type":"boolean"},"confidence":{"type":"number"},"summary":{"type":"string"}},"required":["is_flaky"]}'

- name: Use result
  if: fromJSON(steps.analyze.outputs.structured_output).is_flaky == true
  run: |
    CONFIDENCE=${{ fromJSON(steps.analyze.outputs.structured_output).confidence }}
    echo "${{ steps.analyze.outputs.structured_output }}" | jq -r '.summary'
```

Note: Composite actions cannot expose dynamic outputs. All fields bundled in single `structured_output` JSON string.

## MCP Server Integration

### Inline config

```yaml
claude_args: |
  --mcp-config '{"mcpServers": {"sequential-thinking": {"command": "npx", "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]}}}'
  --allowedTools mcp__sequential-thinking__sequentialthinking
```

### Config file with secrets

```yaml
- name: Create MCP Config
  run: |
    cat > /tmp/mcp-config.json << 'EOF'
    {
      "mcpServers": {
        "custom-server": {
          "command": "npx",
          "args": ["-y", "@example/server"],
          "env": {
            "API_KEY": "${{ secrets.CUSTOM_API_KEY }}"
          }
        }
      }
    }
    EOF

- uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    claude_args: --mcp-config /tmp/mcp-config.json
```

### Python MCP server (uv)

```yaml
claude_args: |
  --mcp-config '{"mcpServers":{"my-server":{"type":"stdio","command":"uv","args":["--directory","${{ github.workspace }}/mcp_servers/","run","server.py"]}}}'
```

### Multiple configs (merged)

```yaml
claude_args: |
  --mcp-config /tmp/config1.json
  --mcp-config /tmp/config2.json
  --mcp-config '{"mcpServers": {"inline-server": {...}}}'
```

Built-in MCP servers (auto-configured):
- `mcp__github_inline_comment__create_inline_comment` — inline PR comments
- `mcp__github_ci__get_ci_status`, `get_workflow_run_details`, `download_job_log` — when `actions: read` enabled

Custom servers override built-in servers with same name.

## CI/CD Integration (actions: read)

```yaml
permissions:
  contents: write
  pull-requests: write
  issues: write
  actions: read  # Enables CI log access

steps:
  - uses: anthropics/claude-code-action@v1
    with:
      anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
      additional_permissions: |
        actions: read
```

Available after enabling: `mcp__github_ci__get_ci_status`, `mcp__github_ci__get_workflow_run_details`, `mcp__github_ci__download_job_log`

## Cloud Provider Authentication

### Amazon Bedrock (OIDC)

```yaml
permissions:
  id-token: write

steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}
      aws-region: us-west-2

  - uses: anthropics/claude-code-action@v1
    with:
      use_bedrock: "true"
      claude_args: --model anthropic.claude-4-0-sonnet-20250805-v1:0
```

### Google Vertex AI (OIDC)

```yaml
permissions:
  id-token: write

steps:
  - uses: google-github-actions/auth@v2
    with:
      workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
      service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

  - uses: anthropics/claude-code-action@v1
    with:
      use_vertex: "true"
      claude_args: --model claude-4-0-sonnet@20250805
```

### Microsoft Foundry (OIDC)

```yaml
steps:
  - uses: azure/login@v2
    with:
      client-id: ${{ secrets.AZURE_CLIENT_ID }}
      tenant-id: ${{ secrets.AZURE_TENANT_ID }}
      subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

  - uses: anthropics/claude-code-action@v1
    with:
      use_foundry: "true"
      claude_args: --model claude-sonnet-4-5
    env:
      ANTHROPIC_FOUNDRY_BASE_URL: https://my-resource.services.ai.azure.com
```

## Environment Variables (via `settings` input)

```yaml
settings: |
  {
    "env": {
      "NODE_ENV": "test",
      "DATABASE_URL": "postgres://test:test@localhost:5432/test_db"
    },
    "model": "claude-opus-4-1-20250805",
    "permissions": {
      "allow": ["Bash", "Read"],
      "deny": ["WebFetch"]
    },
    "hooks": {
      "PreToolUse": [{
        "matcher": "Bash",
        "hooks": [{"type": "command", "command": "echo Running bash..."}]
      }]
    }
  }
```

`enableAllProjectMcpServers` is always set to `true` by the action.  
`.mcp.json` in repo root is auto-detected (tools still need `--allowedTools`).

## Commit Signing

### Option 1: GitHub API (simple, no rebase support)

```yaml
use_commit_signing: "true"
```

### Option 2: SSH key (full git CLI support)

```yaml
# 1. Generate: ssh-keygen -t ed25519 -f ~/.ssh/signing_key -N ""
# 2. Add public key to GitHub: Settings → SSH keys → Signing Key
# 3. Add private key to repo secret: SSH_SIGNING_KEY

ssh_signing_key: ${{ secrets.SSH_SIGNING_KEY }}
bot_id: "12345678"      # gh api users/YOUR_USERNAME --jq '.id'
bot_name: "my-bot[bot]"
```

`ssh_signing_key` takes precedence over `use_commit_signing`.

## Security Reference

| Feature | Detail |
|---------|--------|
| Trigger access | Users with write access only (by default) |
| Bot access | Blocked by default. Use `allowed_bots` to allow specific bots |
| Token scope | Short-lived, repository-scoped, auto-revoked |
| `allowed_non_write_users` | Bypasses security. Only with `github_token` input. Linux only with bubblewrap isolation |
| `show_full_output` | Auto-enabled in GitHub Actions debug mode (`ACTIONS_STEP_DEBUG: true`) |
| PR creation | Claude never creates PRs. Pushes to branch + provides link |
| Workflow file edits | GitHub App does NOT have workflow write permission |
| Multi-repo | Sandboxed to current repo only |

### Environment scrubbing (allowed_non_write_users)

When `allowed_non_write_users` is set, Claude scrubs Anthropic/cloud/GitHub Actions secrets from subprocess environments. On Linux with bubblewrap: PID-namespace isolation. Set `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB: 0` to opt out.

Limit script call frequency with `CLAUDE_CODE_SCRIPT_CAPS`:
```yaml
env:
  CLAUDE_CODE_SCRIPT_CAPS: '{"edit-issue-labels.sh": 2}'  # Max 2 calls
```

## inline_comment Tool

```yaml
# Post immediately (pass confirmed: true)
mcp__github_inline_comment__create_inline_comment  # with confirmed: true

# Buffered + classified (default classify_inline_comments: true)
mcp__github_inline_comment__create_inline_comment  # without confirmed: true
# → Haiku classifies after session: real review comments post, test/probe filtered
```

## Custom GitHub App Setup

Minimum permissions required for custom GitHub App:
- Contents: Read & Write
- Issues: Read & Write
- Pull Requests: Read & Write

```yaml
steps:
  - name: Generate GitHub App token
    id: app-token
    uses: actions/create-github-app-token@v1
    with:
      app-id: ${{ secrets.APP_ID }}
      private-key: ${{ secrets.APP_PRIVATE_KEY }}

  - uses: anthropics/claude-code-action@v1
    with:
      anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
      github_token: ${{ steps.app-token.outputs.token }}
```

Note: `use_sticky_comment` requires claude[bot] auth. Custom `github_token` disables sticky comment updates.

## Limitations

- Cannot submit formal PR reviews (only comments)
- Cannot approve PRs
- Cannot create PRs (pushes to branch + provides pre-filled link)
- Cannot merge/rebase branches (unless explicitly enabled via `--allowedTools`)
- Cannot modify workflow files (`.github/workflows/`)
- Shallow clone by default (depth=20 for PRs, depth=1 for new branches)
- `github-actions` bot cannot trigger subsequent GitHub Actions (use PAT)
- Cannot assign @claude in private org repos (not an org member)
- No cross-repository access (token sandboxed to current repo)

## Extended Reference

Detailed solutions and workflow examples: see `./references/solutions.md`
