# GitHub Actions Workflow YAML Syntax Reference

## Top-Level Keys

```yaml
name: string                    # Display name in Actions tab; default: file path
run-name: string                # Custom run name; supports ${{ github/inputs contexts }}
                                # e.g.: run-name: Deploy to ${{ inputs.env }} by @${{ github.actor }}

on: <event-config>              # Trigger (see events.md)

permissions:                    # GITHUB_TOKEN scopes (workflow-level)
  actions: read | write | none
  artifact-metadata: read | write | none
  attestations: write
  checks: write
  contents: read                # Default: write (main push), read (private), none (fork PR)
  deployments: write
  discussions: write
  id-token: write               # Required for OIDC
  issues: write
  models: read
  packages: write
  pages: write
  pull-requests: write
  repository-projects: write
  security-events: write
  statuses: write
# Shortcuts:
# permissions: read-all | write-all | {}

env:                            # Workflow-level env vars (available to all jobs)
  KEY: value
  SERVER: production

defaults:                       # Default run settings applied to all jobs
  run:
    shell: bash                 # bash | pwsh | python | sh | cmd | powershell
    working-directory: ./src

concurrency:                    # Workflow-level concurrency
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true      # boolean or expression

jobs:
  <job_id>: <job>               # job_id: alphanumeric + _ + - ; must start with letter or _
```

---

## Job-Level Keys (`jobs.<job_id>.*`)

```yaml
jobs:
  my-job:
    name: string                            # Display name
    runs-on: ubuntu-latest                  # Runner label (string or array)
    # Multiple labels (all must match):
    # runs-on: [self-hosted, linux, x64]
    # Group syntax:
    # runs-on:
    #   group: my-runner-group
    #   labels: [ubuntu-latest]

    needs: job1                             # String or array of job IDs
    # needs: [job1, job2]

    if: ${{ github.ref == 'refs/heads/main' }}
    # Available contexts: github, needs, vars, inputs (+ status functions)

    permissions:                            # Job-level GITHUB_TOKEN scopes (same as top-level)
      contents: read
      pull-requests: write

    env:                                    # Job-level env (overrides workflow env)
      KEY: value

    defaults:                               # Job-level defaults
      run:
        shell: pwsh
        working-directory: ./subdir

    concurrency:                            # Job-level concurrency
      group: deploy-${{ github.ref }}
      cancel-in-progress: false

    timeout-minutes: 360                    # Default: 360 (6h); self-hosted max: 5 days; ubuntu-slim: 15 min

    continue-on-error: false               # Boolean or expression; prevents job failure from blocking workflow

    outputs:                               # Job outputs for downstream jobs
      artifact-name: ${{ steps.build.outputs.name }}
      sha: ${{ steps.get-sha.outputs.sha }}

    strategy:
      fail-fast: true                      # Default: true; cancel all matrix jobs if one fails
      max-parallel: 2                      # Default: unlimited
      matrix:
        os: [ubuntu-latest, windows-latest]
        node: [18, 20, 22]
        include:                           # Add extra properties or new combinations
          - os: ubuntu-latest
            node: 20
            experimental: true
        exclude:                           # Remove combinations
          - os: windows-latest
            node: 18
      # Access: ${{ matrix.os }}, ${{ matrix.node }}

    container:                             # Run job steps inside a Docker container
      image: node:20-alpine
      credentials:
        username: ${{ github.actor }}
        password: ${{ secrets.GHCR_TOKEN }}
      env:
        NODE_ENV: test
      ports: [80, 443]
      volumes: ['/data:/data', 'my-volume:/vol']
      options: --cpus 2 --memory 4g

    services:                              # Sidecar Docker containers
      postgres:
        image: postgres:15
        credentials:
          username: ${{ secrets.DOCKER_USER }}
          password: ${{ secrets.DOCKER_PASS }}
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        ports: ['5432:5432']
        volumes: ['/tmp/pg:/var/lib/postgresql/data']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
        options: --health-cmd "redis-cli ping" --health-interval 10s

    steps:
      - <step>
```

---

## Step-Level Keys (`jobs.<job_id>.steps[*].*`)

```yaml
steps:
  # Action step
  - id: step-id                            # For ${{ steps.step-id.outputs.x }} and ${{ steps.step-id.conclusion }}
    name: Display name in logs
    if: ${{ success() && matrix.os == 'ubuntu-latest' }}
    uses: owner/action-repo@v4             # Action reference
    # Reference formats:
    # uses: actions/checkout@v4            # Tag
    # uses: actions/checkout@SHA           # Commit SHA (most secure)
    # uses: actions/checkout@main          # Branch (mutable, avoid)
    # uses: ./.github/actions/my-action   # Local composite action
    # uses: docker://alpine:3.8           # Docker image
    with:                                  # Action inputs
      ref: main
      token: ${{ secrets.GITHUB_TOKEN }}
      fetch-depth: 0
    env:                                   # Step-level env (overrides job/workflow env)
      NODE_ENV: test
    continue-on-error: false
    timeout-minutes: 10

  # Run step (shell command)
  - name: Build
    run: |
      npm ci
      npm run build
    shell: bash                            # Override default shell
    working-directory: ./packages/app
    env:
      BUILD_MODE: production
    id: build
    if: ${{ steps.check.outputs.should-build == 'true' }}
    continue-on-error: false
    timeout-minutes: 30
```

---

## Shell Options

| Platform | Shell | Value | Command Template |
|----------|-------|-------|-----------------|
| Linux/macOS | Bash (default) | `bash` | `bash --noprofile --norc -eo pipefail {0}` |
| All | PowerShell Core | `pwsh` | `pwsh -command ". '{0}'"` |
| All | Python | `python` | `python {0}` |
| Linux/macOS | sh | `sh` | `sh -e {0}` |
| Windows | cmd | `cmd` | `%ComSpec% /D /E:ON /V:OFF /S /C "CALL "{0}""` |
| Windows | PowerShell | `powershell` | `powershell -command ". '{0}'"` |
| All | Custom | `{cmd} {0}` | Any command with `{0}` placeholder |

**Default shell by runner OS:**
- Linux: bash
- Windows: PowerShell Core (pwsh)
- macOS: bash

---

## Permissions Table

| Permission | Allows | Typical Use |
|------------|--------|-------------|
| `actions` | Manage Actions | Cancel workflow runs |
| `checks` | Manage check runs/suites | Post check results |
| `contents` | Repo contents, releases, commits | Read code, create tags |
| `deployments` | Manage deployments | Deploy status |
| `discussions` | GitHub Discussions | Post to discussions |
| `id-token` | Request OIDC JWT | Keyless cloud auth |
| `issues` | Manage issues | Create/label issues |
| `packages` | GitHub Packages | Publish packages |
| `pages` | GitHub Pages | Deploy to Pages |
| `pull-requests` | Manage PRs | Comment, merge PRs |
| `security-events` | Security advisories/alerts | Code scanning |
| `statuses` | Commit statuses | Set CI status |

**Default permissions by trigger:**

| Event | `contents` | `pull-requests` | Notes |
|-------|-----------|-----------------|-------|
| Push to main/non-fork | `write` | `none` | Org policy may restrict |
| Fork PR (`pull_request`) | `read` | `none` | No write access, no secrets |
| `pull_request_target` | `write` | `write` | Has secrets; security risk |
| `workflow_run` | `write` | `write` | Has full access |

---

## Complete Minimal Workflow Examples

### CI on Push/PR

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
      - run: npm ci
      - run: npm test
```

### Matrix Build

```yaml
name: Test Matrix
on: [push]
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: ['18', '20']
        exclude:
          - os: macos-latest
            node: '18'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: node --version
```
