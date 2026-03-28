# GitHub Actions Workflow Commands & Environment Variables Reference

## Environment Files (Modern Approach — Always Use These)

### Set Environment Variable (persists to subsequent steps)

```bash
# Bash
echo "MY_VAR=value" >> "$GITHUB_ENV"

# Multiline value
echo "CONTENT<<EOF" >> "$GITHUB_ENV"
echo "line 1" >> "$GITHUB_ENV"
echo "line 2" >> "$GITHUB_ENV"
echo "EOF" >> "$GITHUB_ENV"
```

```powershell
# PowerShell
"MY_VAR=value" >> $env:GITHUB_ENV
```

### Set Step Output (accessible via `steps.<id>.outputs.<name>`)

```bash
# Bash
echo "result=hello" >> "$GITHUB_OUTPUT"
echo "sha=$(git rev-parse HEAD)" >> "$GITHUB_OUTPUT"
echo "json-data=$(cat data.json | jq -c .)" >> "$GITHUB_OUTPUT"

# Multiline output
echo "content<<DELIM" >> "$GITHUB_OUTPUT"
echo "line1" >> "$GITHUB_OUTPUT"
echo "line2" >> "$GITHUB_OUTPUT"
echo "DELIM" >> "$GITHUB_OUTPUT"
```

```powershell
# PowerShell
"result=hello" >> $env:GITHUB_OUTPUT
```

Access in subsequent steps/jobs:
```yaml
${{ steps.STEP_ID.outputs.result }}
${{ needs.JOB_ID.outputs.result }}   # After mapping in job outputs:
# jobs:
#   job1:
#     outputs:
#       result: ${{ steps.STEP_ID.outputs.result }}
```

### Add to System PATH

```bash
echo "/usr/local/bin/mytool" >> "$GITHUB_PATH"
```

```powershell
"/usr/local/bin/mytool" >> $env:GITHUB_PATH
```

Takes effect for subsequent steps in the same job.

### Job Summary (GitHub Flavored Markdown)

```bash
echo "## Build Results" >> "$GITHUB_STEP_SUMMARY"
echo "| Test | Status |" >> "$GITHUB_STEP_SUMMARY"
echo "| ---- | ------ |" >> "$GITHUB_STEP_SUMMARY"
echo "| Unit | ✅ Pass |" >> "$GITHUB_STEP_SUMMARY"
echo "" >> "$GITHUB_STEP_SUMMARY"

# Overwrite (not append):
echo "# Summary" > "$GITHUB_STEP_SUMMARY"
```

```powershell
"## Results" >> $env:GITHUB_STEP_SUMMARY
```

---

## Workflow Commands (echo format)

### Annotations

```bash
# Debug (requires secret ACTIONS_STEP_DEBUG=true)
echo "::debug::Debug message here"

# Notice
echo "::notice::Simple notice"
echo "::notice file=app.js,line=1,col=5,endLine=2,endColumn=10,title=Notice Title::Message"

# Warning
echo "::warning::Simple warning"
echo "::warning file=src/main.ts,line=42,title=Deprecation::Use newMethod() instead"

# Error
echo "::error::Simple error"
echo "::error file=app.js,line=1,col=5,endColumn=10,title=Error Title::Error message"
```

**Annotation parameters:**
- `file` — filename (default: `.github`)
- `line` — start line (default: 1)
- `endLine` — end line
- `col` — start column
- `endColumn` — end column
- `title` — annotation title

### Log Grouping

```bash
echo "::group::Installation"
npm install
npm run build
echo "::endgroup::"
```

Creates collapsible sections in workflow run logs.

### Secret Masking

```bash
# Mask any string from appearing in logs
SECRET_VALUE=$(generate-token)
echo "::add-mask::${SECRET_VALUE}"
echo "secret=${SECRET_VALUE}" >> "$GITHUB_OUTPUT"
```

After masking, the value appears as `***` in all subsequent log output.

**Important:** Mask BEFORE any output that might contain the secret.

### Stop/Resume Command Processing

```bash
# Stop (prevents commands in output from being interpreted)
STOP_TOKEN="my-unique-stop-token-$(date +%s)"
echo "::stop-commands::${STOP_TOKEN}"

# ... output that contains :: syntax ...
cat file-with-colons.txt

# Resume
echo "::${STOP_TOKEN}::"
```

---

## Deprecated Commands (do NOT use)

```bash
# DEPRECATED - use $GITHUB_OUTPUT instead
echo "::set-output name=result::value"

# DEPRECATED - use $GITHUB_ENV instead
echo "::set-env name=MY_VAR::value"

# DEPRECATED - use $GITHUB_PATH instead
echo "::add-path::/new/path"
```

---

## Default Environment Variables

All variables are available in every step of every job.

### GitHub Workflow Identity

| Variable | Example | Description |
|----------|---------|-------------|
| `GITHUB_ACTION` | `__repo-owner_name-of-action` | Current action name |
| `GITHUB_ACTION_PATH` | `/home/runner/work/_actions/...` | Composite action path |
| `GITHUB_ACTION_REPOSITORY` | `actions/checkout` | Action owner/repo |
| `GITHUB_WORKFLOW` | `CI` | Workflow name |
| `GITHUB_WORKFLOW_REF` | `owner/repo/.github/workflows/ci.yml@refs/heads/main` | Full workflow ref |
| `GITHUB_WORKFLOW_SHA` | `abc123...` | Workflow file commit SHA |
| `GITHUB_JOB` | `build` | Current job ID |

### Actor & Trigger

| Variable | Example | Description |
|----------|---------|-------------|
| `GITHUB_ACTOR` | `octocat` | User who triggered workflow |
| `GITHUB_ACTOR_ID` | `1234567` | Numeric actor ID |
| `GITHUB_TRIGGERING_ACTOR` | `octocat` | User who initiated run (may differ on re-run) |
| `GITHUB_EVENT_NAME` | `push` | Trigger event type |
| `GITHUB_EVENT_PATH` | `/github/workflow/event.json` | Path to webhook payload |

### Repository

| Variable | Example | Description |
|----------|---------|-------------|
| `GITHUB_REPOSITORY` | `octocat/Hello-World` | owner/repo |
| `GITHUB_REPOSITORY_ID` | `123456789` | Numeric repo ID |
| `GITHUB_REPOSITORY_OWNER` | `octocat` | Owner username |
| `GITHUB_REPOSITORY_OWNER_ID` | `1234567` | Numeric owner ID |

### Git Reference

| Variable | Example | Description |
|----------|---------|-------------|
| `GITHUB_REF` | `refs/heads/main` | Full ref that triggered workflow |
| `GITHUB_REF_NAME` | `main` | Short ref name |
| `GITHUB_REF_TYPE` | `branch` | `branch` or `tag` |
| `GITHUB_REF_PROTECTED` | `true` | Branch has protection rules |
| `GITHUB_SHA` | `abc123...` | Commit SHA |
| `GITHUB_BASE_REF` | `main` | PR target branch (PR events only) |
| `GITHUB_HEAD_REF` | `feature/my-branch` | PR source branch (PR events only) |

### Run Info

| Variable | Example | Description |
|----------|---------|-------------|
| `GITHUB_RUN_ID` | `1658821493` | Unique run ID (unchanged on re-run) |
| `GITHUB_RUN_NUMBER` | `42` | Sequential run count for this workflow |
| `GITHUB_RUN_ATTEMPT` | `1` | Re-run attempt number |
| `GITHUB_RETENTION_DAYS` | `90` | Log/artifact retention |

### Paths & URLs

| Variable | Example | Description |
|----------|---------|-------------|
| `GITHUB_WORKSPACE` | `/home/runner/work/repo/repo` | Default working directory |
| `GITHUB_ENV` | `/home/runner/work/_temp/...` | Path to env vars file (unique per step) |
| `GITHUB_OUTPUT` | `/home/runner/work/_temp/...` | Path to outputs file (unique per step) |
| `GITHUB_PATH` | `/home/runner/work/_temp/...` | Path to PATH file (unique per step) |
| `GITHUB_STEP_SUMMARY` | `/home/runner/work/_temp/...` | Path to summary file (unique per step) |
| `GITHUB_SERVER_URL` | `https://github.com` | GitHub URL |
| `GITHUB_API_URL` | `https://api.github.com` | REST API URL |
| `GITHUB_GRAPHQL_URL` | `https://api.github.com/graphql` | GraphQL URL |

### Runner

| Variable | Example | Description |
|----------|---------|-------------|
| `RUNNER_OS` | `Linux` | `Linux` \| `Windows` \| `macOS` |
| `RUNNER_ARCH` | `X64` | `X86` \| `X64` \| `ARM` \| `ARM64` |
| `RUNNER_NAME` | `GitHub Actions 2` | Runner name |
| `RUNNER_ENVIRONMENT` | `github-hosted` | `github-hosted` \| `self-hosted` |
| `RUNNER_DEBUG` | `1` | Set to `1` when debug logging enabled |
| `RUNNER_TEMP` | `/home/runner/work/_temp` | Temp dir (cleared before/after job) |
| `RUNNER_TOOL_CACHE` | `/opt/hostedtoolcache` | Preinstalled tools path |

### Always Set

| Variable | Value | Description |
|----------|-------|-------------|
| `CI` | `true` | Always true in GitHub Actions |
| `GITHUB_ACTIONS` | `true` | Always true in GitHub Actions |

---

## Construct Workflow Run URL

```bash
echo "$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
# https://github.com/owner/repo/actions/runs/1234567890
```

---

## Accessing Variables in Different Contexts

```yaml
steps:
  # Shell-native (processed on runner)
  - run: echo "$GITHUB_REF"                    # Linux/macOS bash
  - run: echo "$env:GITHUB_REF"                # Windows PowerShell
  - run: Write-Host $env:GITHUB_REF            # PowerShell

  # Context expression (processed before sent to runner, works anywhere)
  - run: echo "${{ github.ref }}"
  - if: github.ref == 'refs/heads/main'
  - name: Deploy to ${{ vars.DEPLOY_ENV }}

  # env context (for vars defined in workflow YAML)
  - env:
      MY_VAR: ${{ github.sha }}
    run: echo "$MY_VAR"                         # Access as shell var
  - if: env.MY_VAR == 'expected'               # Access via context
```

**Key rule:** Parts NOT sent to runner (like `if:`, `name:`, `runs-on:`) must use context expressions `${{ }}`. Parts sent to runner (`run:` commands) can use either shell syntax or context expressions.
