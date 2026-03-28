# GitHub Actions Common Patterns Reference

## Matrix Strategy

### Basic Matrix

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false          # Don't cancel all jobs if one fails
      max-parallel: 4           # Limit concurrent jobs (default: unlimited)
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: ['18', '20', '22']
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
```

### Matrix Include / Exclude

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest]
    node: [18, 20]
    include:
      # Add property to existing combination
      - os: ubuntu-latest
        node: 20
        coverage: true           # Extra property for this combo only
      # Add entirely new combination (no existing match)
      - os: macos-latest
        node: 20
    exclude:
      # Remove specific combinations
      - os: windows-latest
        node: 18
```

### Dynamic Matrix from Job Output

```yaml
jobs:
  setup:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set.outputs.matrix }}
    steps:
      - id: set
        run: |
          # Build matrix from script/API/file
          echo 'matrix=["18","20","22"]' >> "$GITHUB_OUTPUT"

  build:
    needs: setup
    strategy:
      matrix:
        node: ${{ fromJSON(needs.setup.outputs.matrix) }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
```

### Matrix with `continue-on-error` for Experimental Versions

```yaml
strategy:
  fail-fast: true
  matrix:
    node: [18, 20]
    experimental: [false]
    include:
      - node: 22
        experimental: true
jobs:
  test:
    continue-on-error: ${{ matrix.experimental }}
    runs-on: ubuntu-latest
```

### Accessing Matrix Output Across Jobs

```yaml
jobs:
  define-matrix:
    runs-on: ubuntu-latest
    outputs:
      colors: ${{ steps.colors.outputs.colors }}
    steps:
      - id: colors
        run: echo 'colors=["red","green","blue"]' >> "$GITHUB_OUTPUT"

  produce:
    needs: define-matrix
    strategy:
      matrix:
        color: ${{ fromJSON(needs.define-matrix.outputs.colors) }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.color }}-artifact
          path: output/
```

---

## Job Outputs (Inter-Job Data Transfer)

```yaml
jobs:
  producer:
    runs-on: ubuntu-latest
    outputs:                                              # Declare job outputs
      sha: ${{ steps.get-sha.outputs.sha }}
      version: ${{ steps.parse.outputs.version }}
    steps:
      - id: get-sha
        run: echo "sha=$(git rev-parse --short HEAD)" >> "$GITHUB_OUTPUT"
      - id: parse
        run: |
          VERSION=$(cat package.json | jq -r '.version')
          echo "version=${VERSION}" >> "$GITHUB_OUTPUT"

  consumer:
    needs: producer
    runs-on: ubuntu-latest
    steps:
      - run: echo "SHA=${{ needs.producer.outputs.sha }}"
      - env:
          VERSION: ${{ needs.producer.outputs.version }}
        run: echo "Deploying $VERSION"
```

---

## Concurrency Control

```yaml
# Workflow-level: cancel duplicate runs on same branch
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

# PR-aware: use head_ref for PRs, run_id for other events
concurrency:
  group: ${{ github.workflow }}-${{ github.head_ref || github.run_id }}
  cancel-in-progress: true

# Deployment queue: serialize without canceling
jobs:
  deploy:
    concurrency:
      group: production-deploy
      cancel-in-progress: false

# Conditional: don't cancel release branches
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ !contains(github.ref, 'refs/heads/release') }}
```

**Behavior:**
- Max 1 running + 1 pending per group
- New pending job replaces existing pending
- Group names are case-insensitive
- Available contexts: github, inputs, vars, needs, strategy, matrix

---

## Reusable Workflows

### Called Workflow (`.github/workflows/deploy.yml`)

```yaml
name: Reusable Deploy

on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string             # string | number | boolean
      version:
        required: false
        type: string
        default: 'latest'
      debug:
        type: boolean
        default: false
    secrets:
      deploy-token:
        required: true
    outputs:
      deploy-url:
        description: 'Deployed URL'
        value: ${{ jobs.deploy.outputs.url }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    outputs:
      url: ${{ steps.deploy.outputs.url }}
    environment: ${{ inputs.environment }}
    steps:
      - uses: actions/checkout@v4
      - id: deploy
        run: |
          ./deploy.sh "${{ inputs.environment }}" "${{ inputs.version }}"
          echo "url=https://${{ inputs.environment }}.example.com" >> "$GITHUB_OUTPUT"
        env:
          TOKEN: ${{ secrets.deploy-token }}
          DEBUG: ${{ inputs.debug }}
```

### Caller Workflow

```yaml
jobs:
  # Call by path (same repo)
  deploy-dev:
    uses: ./.github/workflows/deploy.yml
    with:
      environment: dev
      debug: true
    secrets:
      deploy-token: ${{ secrets.DEV_DEPLOY_TOKEN }}

  # Call by ref (external repo)
  deploy-prod:
    uses: org/infra-workflows/.github/workflows/deploy.yml@v2.1.0
    # Using SHA (most secure):
    # uses: org/infra-workflows/.github/workflows/deploy.yml@abc123def456
    with:
      environment: production
    secrets: inherit             # Pass ALL caller secrets to reusable workflow

  # Access output
  post-deploy:
    needs: deploy-prod
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deployed to ${{ needs.deploy-prod.outputs.deploy-url }}"
```

**Constraints:**
- Reusable workflow cannot define its own `strategy.matrix`
- Max 10 nesting levels; max 50 unique reusable workflows per run
- Environment secrets cannot be passed (no `environment` key in `workflow_call`)
- `env` vars from caller are NOT available in called workflow
- Secrets don't auto-propagate through chains (must forward explicitly)
- Called workflow's `runner` billing goes to caller
- `github` context = caller's context

---

## Caching (`actions/cache@v4`)

```yaml
- name: Cache npm dependencies
  id: cache-npm
  uses: actions/cache@v4
  with:
    path: |                          # Required: paths to cache
      ~/.npm
      node_modules
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |                  # Fallback keys (most to least specific)
      ${{ runner.os }}-npm-
      ${{ runner.os }}-
    enableCrossOsArchive: false      # Allow Windows/Linux cross-OS cache access
    fail-on-cache-miss: false        # Fail job if no cache found
    lookup-only: false               # Only check if cache exists, don't restore
    save-always: false               # Save cache even if job fails

- name: Install only on cache miss
  if: steps.cache-npm.outputs.cache-hit != 'true'
  run: npm ci

# Output: cache-hit (boolean string 'true'|'false')
```

### Cache Key Strategies by Ecosystem

```yaml
# npm
key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
path: ~/.npm

# yarn
key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
path: ~/.yarn/cache

# pnpm
key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
path: ~/.local/share/pnpm/store

# pip
key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements*.txt') }}
path: ~/.cache/pip

# Poetry
key: ${{ runner.os }}-poetry-${{ hashFiles('**/poetry.lock') }}
path: ~/.cache/pypoetry

# Maven
key: ${{ runner.os }}-maven-${{ hashFiles('**/pom.xml') }}
path: ~/.m2/repository

# Gradle
key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
path: |
  ~/.gradle/caches
  ~/.gradle/wrapper

# Go modules
key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
path: ~/go/pkg/mod

# Ruby gems
key: ${{ runner.os }}-gems-${{ hashFiles('**/Gemfile.lock') }}
path: vendor/bundle

# Rust/Cargo
key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}
path: |
  ~/.cargo/bin/
  ~/.cargo/registry/index/
  ~/.cargo/registry/cache/
  ~/.cargo/git/db/
  target/
```

### Integrated Caching via Setup Actions

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'           # npm | yarn | pnpm (auto-handles cache key + path)

- uses: actions/setup-python@v5
  with:
    python-version: '3.12'
    cache: 'pip'           # pip | pipenv | poetry

- uses: actions/setup-java@v4
  with:
    java-version: '21'
    distribution: 'temurin'
    cache: 'maven'         # maven | gradle | sbt

- uses: actions/setup-go@v5
  with:
    go-version: '1.22'
    cache: true            # true = use go.sum for key
```

**Cache Limits:**
- 10 GB per repository (expandable for paid plans)
- 7-day eviction for unused caches (LRU policy)
- 200 uploads/min, 1,500 downloads/min per repo
- Fork PRs can read but not write to parent repo cache
- Scope: current branch → default branch → base branch (for PRs)

---

## Artifacts

### Upload

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: build-output-${{ github.run_id }}
    path: |
      dist/
      !dist/**/*.map        # Exclude source maps
      coverage/
    retention-days: 7       # Default: 90; max determined by repo setting
    if-no-files-found: error  # error | warn (default) | ignore
    compression-level: 6    # 0 (none) to 9 (max); default 6
    overwrite: false        # Overwrite if artifact exists
```

### Download

```yaml
- uses: actions/download-artifact@v4
  with:
    name: build-output-${{ github.run_id }}  # Omit to download ALL artifacts
    path: ./downloaded                         # Default: current directory
    merge-multiple: false   # Merge multiple artifacts into single dir
    run-id: ${{ github.run_id }}              # Download from specific run

# After download, files are at ./downloaded/
```

### Cross-Job Artifact Pattern

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      - run: ./deploy-dist.sh
```

---

## Conditional Job Execution

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build

  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: npm test

  deploy:
    needs: [build, test]
    if: |
      github.ref == 'refs/heads/main' &&
      needs.test.result == 'success'
    runs-on: ubuntu-latest
    steps:
      - run: ./deploy.sh

  notify:
    needs: [build, test, deploy]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - run: |
          echo "Build: ${{ needs.build.result }}"
          echo "Test: ${{ needs.test.result }}"
          echo "Deploy: ${{ needs.deploy.result }}"
```

**Skipped jobs:** If a job's `if` evaluates false, it is marked `skipped` (counts as `success` for required checks and PR merging). Downstream jobs that `needs` a skipped job will also be skipped unless they have `if: always()`.

---

## Composite Actions Pattern

```yaml
# .github/actions/setup-env/action.yml
name: 'Setup Environment'
description: 'Install dependencies and configure environment'
inputs:
  node-version:
    required: false
    default: '20'
  install-cmd:
    required: false
    default: 'npm ci'
outputs:
  cache-hit:
    description: 'Whether cache was hit'
    value: ${{ steps.cache.outputs.cache-hit }}
runs:
  using: composite
  steps:
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: npm
    - id: cache
      uses: actions/cache@v4
      with:
        path: node_modules
        key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
    - if: steps.cache.outputs.cache-hit != 'true'
      run: ${{ inputs.install-cmd }}
      shell: bash
```

```yaml
# Usage in workflow
steps:
  - uses: ./.github/actions/setup-env
    with:
      node-version: '20'
```

---

## Deployment Workflow Pattern

```yaml
name: Deploy
on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [dev, staging, prod]
        default: dev

concurrency:
  group: deploy-${{ github.event.inputs.environment || 'main' }}
  cancel-in-progress: false   # Queue deployments

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: ${{ github.event.inputs.environment || 'production' }}
      url: ${{ steps.deploy.outputs.url }}
    permissions:
      contents: read
      id-token: write          # For OIDC
    steps:
      - uses: actions/checkout@v4
      - id: deploy
        run: |
          echo "url=https://app.example.com" >> "$GITHUB_OUTPUT"
```
