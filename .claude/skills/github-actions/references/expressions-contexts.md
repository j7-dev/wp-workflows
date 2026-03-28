# GitHub Actions Expressions & Contexts Reference

## Expression Syntax

```yaml
${{ <expression> }}
```

Used in: `if:`, `env:` values, `with:` values, `run:` inline, `name:`, `concurrency.group`, and most other YAML string values.

**In `if:` conditions,** the `${{ }}` wrapper is optional:
```yaml
if: github.ref == 'refs/heads/main'
if: ${{ github.ref == 'refs/heads/main' }}  # Same thing
```

---

## Literals

| Type | Examples |
|------|---------|
| boolean | `true`, `false` |
| null | `null` |
| number | `711`, `2.0`, `-9.2`, `0xff`, `-2.99e-2` |
| string | `'single quoted'`, `''` (escaped single quote inside: `''`) |

---

## Operators

| Operator | Description | Notes |
|----------|-------------|-------|
| `( )` | Grouping | |
| `[ ]` | Array index | `array[0]` |
| `.` | Property access | `github.sha` |
| `!` | Logical NOT | |
| `<` `<=` `>` `>=` | Comparison | NaN comparison always false |
| `==` `!=` | Loose equality | Type coercion applied |
| `&&` | Logical AND | |
| `\|\|` | Logical OR | |

**Type coercion in `==` / `!=`:**
- `null` → `0`
- `true` → `1`, `false` → `0`
- string → parsed as JSON number, empty string → `0`, non-numeric → `NaN`
- Array/Object → `NaN`

**String comparison:** Case-insensitive.

---

## Built-in Functions

### String Functions

```yaml
contains(search, item)
# String: substring check (case-insensitive)
contains('Hello world', 'llo')                           # true
contains('Hello world', 'HELLO')                         # true
# Array: element check
contains(github.event.issue.labels.*.name, 'bug')        # true if label 'bug' exists

startsWith(searchString, searchValue)
# Case-insensitive; casts to string
startsWith('Hello world', 'He')                          # true
startsWith('Hello world', 'he')                          # true

endsWith(searchString, searchValue)
# Case-insensitive
endsWith('Hello world', 'ld')                            # true

format(string, value0, value1, ...)
# Replaces {N} placeholders; escape braces with {{ or }}
format('Hello {0} {1}', 'Mona', 'Octocat')              # 'Hello Mona Octocat'
format('{{literal braces}} {0}', 'val')                  # '{literal braces} val'

join(array, separator)
# Concatenates array to string; default separator: ','
join(github.event.issue.labels.*.name, ', ')             # 'bug, help wanted'
join(matrix.os, ' | ')                                   # 'ubuntu-latest | windows-latest'
```

### JSON Functions

```yaml
toJSON(value)
# Pretty-printed JSON string; useful for debugging
toJSON(github.event)
toJSON(job)

fromJSON(value)
# Parse JSON string into object/array/primitive
fromJSON('["18","20","22"]')                             # array
fromJSON(needs.setup.outputs.matrix)                     # for dynamic matrix
fromJSON('true')                                         # boolean true
# Use for type conversion:
continue-on-error: ${{ fromJSON(env.SHOULD_CONTINUE) }}
timeout-minutes: ${{ fromJSON(env.TIMEOUT) }}
```

### File Hash Function

```yaml
hashFiles(path)
# SHA-256 hash of matching files; empty string if no match
# Paths relative to GITHUB_WORKSPACE; case-insensitive on Windows
hashFiles('**/package-lock.json')
hashFiles('**/package-lock.json', '**/yarn.lock')        # multiple patterns
hashFiles('lib/**/*.rb', '!lib/excluded/*.rb')           # with exclusion
```

### Status Check Functions

These override the default `success()` check. They return boolean.

```yaml
success()     # All previous steps/jobs succeeded (DEFAULT behavior in if:)
failure()     # Any previous step failed; for dependent jobs: any ancestor job failed
always()      # Always true, even after cancel — use sparingly
cancelled()   # Workflow was cancelled
```

**Usage examples:**
```yaml
if: failure()                                    # Run only on failure
if: always()                                     # Always run
if: ${{ !cancelled() }}                          # Run unless explicitly cancelled (safer than always())
if: failure() && steps.deploy.conclusion == 'failure'
if: success() || failure()                       # Run on either result
```

### Object Filter

```yaml
array.*.property           # Extract property from each element
object.*.property          # Extract from object values
# Example:
github.event.issue.labels.*.name    # Array of all label names
```

---

## All Context Objects

### `github` Context

| Property | Type | Description |
|----------|------|-------------|
| `github.action` | string | Current action name / step run ID |
| `github.action_path` | string | Composite action directory path |
| `github.action_ref` | string | Action ref (e.g., `v4`) |
| `github.action_repository` | string | Action owner/repo |
| `github.action_status` | string | Composite action status |
| `github.actor` | string | User/app that triggered workflow |
| `github.actor_id` | string | Numeric actor ID |
| `github.api_url` | string | REST API URL |
| `github.base_ref` | string | PR target branch (PR events only) |
| `github.env` | string | Path to GITHUB_ENV file |
| `github.event` | object | Full webhook payload |
| `github.event_name` | string | Trigger event name |
| `github.event_path` | string | Path to event payload file |
| `github.graphql_url` | string | GraphQL API URL |
| `github.head_ref` | string | PR source branch (PR events only) |
| `github.job` | string | Current job ID (runner only, else null) |
| `github.output` | string | Path to GITHUB_OUTPUT file |
| `github.path` | string | Path to GITHUB_PATH file |
| `github.ref` | string | Full ref (e.g., `refs/heads/main`) |
| `github.ref_name` | string | Short ref name (e.g., `main`, `v1.0`) |
| `github.ref_protected` | boolean | Branch has protection rules |
| `github.ref_type` | string | `branch` or `tag` |
| `github.repository` | string | `owner/repo` |
| `github.repository_id` | string | Numeric repo ID |
| `github.repository_owner` | string | Owner username |
| `github.repository_owner_id` | string | Numeric owner ID |
| `github.repositoryUrl` | string | Git URL |
| `github.retention_days` | string | Log/artifact retention days |
| `github.run_id` | string | Unique run ID (unchanged on re-run) |
| `github.run_number` | string | Sequential run count for this workflow |
| `github.run_attempt` | string | Re-run attempt (starts at 1) |
| `github.secret_source` | string | `None\|Actions\|Codespaces\|Dependabot` |
| `github.server_url` | string | `https://github.com` |
| `github.sha` | string | Commit SHA (varies by event type) |
| `github.token` | string | GITHUB_TOKEN (runner only, else null) |
| `github.triggering_actor` | string | User who triggered current run/re-run |
| `github.workflow` | string | Workflow name or file path |
| `github.workflow_ref` | string | Full ref path to workflow file |
| `github.workflow_sha` | string | Workflow file commit SHA |
| `github.workspace` | string | Default working directory |

### `env` Context

```yaml
env.<env_name>     # string - current value of env var from workflow/job/step
```
**Precedence:** step-level > job-level > workflow-level (same-named vars).

### `vars` Context

```yaml
vars.<var_name>    # string - configuration variable; '' if undefined
```
Set at: organization > repository > environment level (environment-level takes priority).

**Limits:** 48 KB per var; 1,000 org + 500 repo + 100 environment variables; 256 KB combined per run.

### `job` Context

```yaml
job.check_run_id              # number - check run ID
job.container.id              # string - container ID
job.container.network         # string - container network ID
job.services.<id>.id          # string - service container ID
job.services.<id>.network     # string - service network ID
job.services.<id>.ports       # object - port mappings
job.status                    # 'success' | 'failure' | 'cancelled'
```

### `steps` Context

```yaml
steps.<step_id>.outputs.<name>    # string - step output value
steps.<step_id>.conclusion        # 'success'|'failure'|'cancelled'|'skipped' (after continue-on-error)
steps.<step_id>.outcome           # 'success'|'failure'|'cancelled'|'skipped' (before continue-on-error)
# Note: step must have an `id:` to be accessible via steps context
```

### `runner` Context

```yaml
runner.name           # string - runner name
runner.os             # 'Linux' | 'Windows' | 'macOS'
runner.arch           # 'X86' | 'X64' | 'ARM' | 'ARM64'
runner.temp           # string - temp dir path (cleared before/after job)
runner.tool_cache     # string - preinstalled tools path (GitHub-hosted)
runner.debug          # string - '1' if debug logging enabled
runner.environment    # 'github-hosted' | 'self-hosted'
```

### `secrets` Context

```yaml
secrets.GITHUB_TOKEN          # Auto-created per run
secrets.<secret_name>         # string - '' if not set
```
Auto-redacted in logs. Not available in composite actions (pass as inputs).

### `strategy` Context (matrix jobs only)

```yaml
strategy.fail-fast     # boolean
strategy.job-index     # number (0-based position in matrix)
strategy.job-total     # number (total matrix jobs)
strategy.max-parallel  # number
```

### `matrix` Context (matrix jobs only)

```yaml
matrix.<property_name>   # user-defined matrix dimension value
```

### `needs` Context

```yaml
needs.<job_id>.outputs.<name>   # string - dependent job output
needs.<job_id>.result           # 'success' | 'failure' | 'cancelled' | 'skipped'
```
Only contains DIRECT dependencies (not transitive).

### `inputs` Context

```yaml
inputs.<name>    # string | number | boolean - from workflow_dispatch or workflow_call
```
Only available in `workflow_dispatch` or `workflow_call` triggered workflows.

### `jobs` Context (reusable workflows only)

```yaml
jobs.<job_id>.result              # 'success' | 'failure' | 'cancelled' | 'skipped'
jobs.<job_id>.outputs.<name>      # string
```
Only available in reusable workflows for defining `on.workflow_call.outputs.value`.

---

## Context Availability by Location

| Workflow Section | Available Contexts |
|-----------------|-------------------|
| `run-name` | github, inputs, vars |
| `on.workflow_call.inputs.<id>.default` | github, inputs, vars |
| `on.workflow_call.outputs.<id>.value` | github, jobs, vars, inputs |
| `jobs.<id>.if` | github, needs, vars, inputs (+ status fns) |
| `jobs.<id>.name` | github, needs, strategy, matrix, vars, inputs |
| `jobs.<id>.runs-on` | github, needs, strategy, matrix, vars, inputs |
| `jobs.<id>.env` | github, needs, strategy, matrix, vars, secrets, inputs |
| `jobs.<id>.concurrency` | github, needs, strategy, matrix, inputs, vars |
| `jobs.<id>.outputs.<id>` | github, needs, strategy, matrix, job, runner, env, vars, secrets, steps, inputs |
| `jobs.<id>.steps.if` | all + status functions + hashFiles |
| `jobs.<id>.steps.run` | github, needs, strategy, matrix, job, runner, env, vars, secrets, steps, inputs |
| `jobs.<id>.steps.with` | github, needs, strategy, matrix, job, runner, env, vars, secrets, steps, inputs |
| `jobs.<id>.steps.env` | github, needs, strategy, matrix, job, runner, env, vars, secrets, steps, inputs |

---

## Common Expression Patterns

```yaml
# Branch check
if: github.ref == 'refs/heads/main'
if: startsWith(github.ref, 'refs/tags/v')
if: github.ref_name == 'main'

# Event check
if: github.event_name == 'push'
if: github.event_name != 'pull_request'

# PR check
if: github.event.pull_request.merged == true
if: github.event.review.state == 'approved'
if: github.event.issue.pull_request != null   # is PR (not issue)

# Actor check
if: github.actor == 'dependabot[bot]'
if: contains(fromJSON('["user1","user2"]'), github.actor)

# Matrix conditional
if: matrix.os == 'ubuntu-latest'
if: matrix.experimental == true

# Step result check
if: steps.build.outcome == 'success'
if: steps.build.conclusion != 'skipped'

# Needs result check
if: needs.build.result == 'success'
if: contains(needs.*.result, 'failure')

# Dynamic env URL
run: echo "$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
```
