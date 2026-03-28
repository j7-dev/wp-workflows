---
name: github-actions
description: |
  Complete GitHub Actions technical reference at API-reference depth. Use this skill whenever the task involves:
  - Writing or editing .github/workflows/*.yml files
  - GitHub Actions CI/CD pipeline configuration
  - workflow_dispatch, workflow_call, workflow_run triggers
  - Actions expressions (${{ }}), contexts (github, env, secrets, needs, matrix...)
  - Composite actions, JavaScript actions, Docker container actions
  - Reusable workflows, matrix strategy, concurrency control
  - GITHUB_TOKEN permissions, secrets, OIDC authentication
  - actions/cache, actions/checkout, artifacts, job outputs
  - Runner configuration (github-hosted, self-hosted, larger runners)
  - Security hardening of GitHub Actions workflows
  Use this skill proactively for ANY task touching CI/CD pipelines or GitHub Actions.
---

# GitHub Actions Complete Reference

## Table of Contents (Reference Files)

- `references/syntax.md` — Workflow YAML syntax: top-level, job-level, step-level keys; permissions; shells
- `references/events.md` — All trigger events, filter patterns, activity types
- `references/expressions-contexts.md` — Expression syntax, all built-in functions, all context objects
- `references/workflow-commands.md` — Workflow commands, env files, annotations, GITHUB_* env vars
- `references/patterns.md` — Matrix, concurrency, reusable workflows, job outputs, caching, artifacts
- `references/security.md` — GITHUB_TOKEN, OIDC, secrets, security best practices
- `references/runners.md` — Runner labels, specs, limits table

Read the relevant reference file(s) based on the task at hand.

---

## Quick Decision Guide

| Task | Read |
|------|------|
| Write/fix a workflow YAML file | syntax.md |
| Configure triggers (on:, push, PR, schedule) | events.md |
| Use ${{ }}, contexts, if conditions | expressions-contexts.md |
| Set env vars, step outputs, annotations | workflow-commands.md |
| Matrix, caching, artifacts, reusable workflows | patterns.md |
| GITHUB_TOKEN, secrets, OIDC, security | security.md |
| Pick a runner, troubleshoot runner issues | runners.md |

---

## Fast Reference: Key Syntax Skeleton

```yaml
name: string
run-name: string                  # supports ${{ github/inputs contexts }}
on: <events>                      # See references/events.md
permissions: <scopes>             # See references/security.md
env:
  KEY: value
defaults:
  run:
    shell: bash
    working-directory: ./
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
jobs:
  job-id:
    name: string
    runs-on: ubuntu-latest
    needs: [other-job]
    if: ${{ github.ref == 'refs/heads/main' }}
    permissions: <scopes>
    env: {}
    timeout-minutes: 360
    continue-on-error: false
    outputs:
      key: ${{ steps.step-id.outputs.value }}
    strategy:
      matrix:
        node: [18, 20]
      fail-fast: true
      max-parallel: 2
    container:
      image: node:20
    services:
      postgres:
        image: postgres:15
        ports: ['5432:5432']
    steps:
      - id: step-id
        name: string
        if: ${{ success() }}
        uses: actions/checkout@v4
        with:
          ref: main
        env:
          KEY: value
        continue-on-error: false
        timeout-minutes: 5
      - run: |
          echo "shell command"
        shell: bash
        working-directory: ./subdir
```

---

## Fast Reference: Common One-Liners

```bash
# Set output
echo "key=value" >> "$GITHUB_OUTPUT"

# Set env var for next steps
echo "MY_VAR=value" >> "$GITHUB_ENV"

# Add to PATH
echo "/usr/local/bin/tool" >> "$GITHUB_PATH"

# Step summary
echo "## Result" >> "$GITHUB_STEP_SUMMARY"

# Mask secret value
echo "::add-mask::${SENSITIVE}"

# Debug annotation
echo "::debug::message"

# Warning annotation
echo "::warning file=app.js,line=1::message"

# Error annotation
echo "::error file=app.js,line=1,col=5::message"
```

---

## Fast Reference: Most Used Contexts

```yaml
# Trigger info
${{ github.event_name }}          # push | pull_request | workflow_dispatch ...
${{ github.ref }}                 # refs/heads/main
${{ github.ref_name }}            # main
${{ github.sha }}                 # commit SHA
${{ github.actor }}               # username
${{ github.repository }}          # owner/repo
${{ github.workflow }}            # workflow name
${{ github.run_id }}              # unique run ID
${{ github.run_number }}          # sequential run #

# Job/step info
${{ job.status }}                 # success | failure | cancelled
${{ steps.STEP_ID.outputs.KEY }}  # step output
${{ steps.STEP_ID.conclusion }}   # after continue-on-error
${{ steps.STEP_ID.outcome }}      # before continue-on-error

# Runner
${{ runner.os }}                  # Linux | Windows | macOS
${{ runner.arch }}                # X64 | ARM64 ...

# PR-specific
${{ github.head_ref }}            # source branch
${{ github.base_ref }}            # target branch

# Needs (dependent jobs)
${{ needs.JOB_ID.outputs.KEY }}
${{ needs.JOB_ID.result }}        # success | failure | cancelled | skipped

# Matrix
${{ matrix.PROPERTY }}

# Inputs (workflow_dispatch / workflow_call)
${{ inputs.PARAM_NAME }}

# Secrets & vars
${{ secrets.MY_SECRET }}
${{ vars.MY_VAR }}
```

---

## Fast Reference: Status Functions

```yaml
if: success()         # default - all previous steps succeeded
if: failure()         # any previous step/dependency failed
if: always()          # always run (even cancelled)
if: cancelled()       # workflow was cancelled
if: ${{ !cancelled() }}  # run unless cancelled (safer than always())

# Combining
if: failure() && steps.deploy.conclusion == 'failure'
if: always() && github.ref == 'refs/heads/main'
```

---

## Fast Reference: Official Actions

| Action | Version | Purpose |
|--------|---------|---------|
| `actions/checkout` | v4 | Clone repository |
| `actions/setup-node` | v4 | Install Node.js (`cache: npm\|yarn\|pnpm`) |
| `actions/setup-python` | v5 | Install Python (`cache: pip\|pipenv\|poetry`) |
| `actions/setup-java` | v4 | Install Java |
| `actions/setup-go` | v5 | Install Go |
| `actions/cache` | v4 | File caching |
| `actions/upload-artifact` | v4 | Upload artifacts |
| `actions/download-artifact` | v4 | Download artifacts |
| `actions/github-script` | v7 | GitHub API via JS |
| `docker/login-action` | v3 | Docker registry login |
| `docker/build-push-action` | v6 | Build & push Docker image |

---

## Fast Reference: Key Limits

| Limit | Value |
|-------|-------|
| Jobs per run | 500 |
| Steps per job | 100 |
| Job timeout (GitHub-hosted) | 6 hours |
| Matrix combinations | 256 |
| Reusable workflow nesting | 10 levels |
| workflow_run chain | 3 levels |
| Secret size | 48 KB |
| Cache per repo | 10 GB |
| Cache eviction | 7 days unused |
| Artifact retention | 90 days default |
| Schedule minimum | 5 minutes |

For full details on any topic, read the relevant file in `references/`.
