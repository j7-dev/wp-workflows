# GitHub Actions Runners Reference

## GitHub-Hosted Runner Labels & Specs

### Linux (x64)

| Label | OS | CPU | RAM | Disk | Notes |
|-------|----|-----|-----|------|-------|
| `ubuntu-latest` | Ubuntu 24.04 | 4* | 16 GB* | 14 GB SSD | Alias for ubuntu-24.04 |
| `ubuntu-24.04` | Ubuntu 24.04 | 4* | 16 GB* | 14 GB SSD | |
| `ubuntu-22.04` | Ubuntu 22.04 | 4* | 16 GB* | 14 GB SSD | |
| `ubuntu-slim` | Ubuntu 24.04 | 1 | 5 GB | 14 GB SSD | Container-based; 15 min max; no Docker-in-Docker |

### Linux (ARM64)

| Label | OS | CPU | RAM | Disk |
|-------|----|-----|-----|------|
| `ubuntu-24.04-arm` | Ubuntu 24.04 | 4* | 16 GB* | 14 GB SSD |
| `ubuntu-22.04-arm` | Ubuntu 22.04 | 4* | 16 GB* | 14 GB SSD |

### Windows (x64)

| Label | OS | CPU | RAM | Disk |
|-------|----|-----|-----|------|
| `windows-latest` | Windows Server 2025 | 4* | 16 GB* | 14 GB SSD |
| `windows-2025` | Windows Server 2025 | 4* | 16 GB* | 14 GB SSD |
| `windows-2022` | Windows Server 2022 | 4* | 16 GB* | 14 GB SSD |

### Windows (ARM64)

| Label | OS | CPU | RAM | Disk |
|-------|----|-----|-----|------|
| `windows-11-arm` | Windows 11 ARM | 4* | 16 GB* | 14 GB SSD |

### macOS (Apple Silicon / ARM64)

| Label | OS | CPU | RAM | Disk | Chip |
|-------|----|-----|-----|------|------|
| `macos-latest` | macOS 15 | 3 | 7 GB | 14 GB SSD | M3 |
| `macos-15` | macOS 15 | 3 | 7 GB | 14 GB SSD | M3 |
| `macos-14` | macOS 14 | 3 | 7 GB | 14 GB SSD | M1 |
| `macos-26` | macOS 26 | 3 | 7 GB | 14 GB SSD | M3 |

### macOS (Intel / x64)

| Label | OS | CPU | RAM | Disk |
|-------|----|-----|-----|------|
| `macos-15-intel` | macOS 15 | 4 | 14 GB | 14 GB SSD |
| `macos-26-intel` | macOS 26 | 4 | 14 GB | 14 GB SSD |

**Specs note:** `*` = Public repos get 4 CPU / 16 GB. Private repos (metered) get 2 CPU / 8 GB.

---

## Runner Syntax

```yaml
# Single label
runs-on: ubuntu-latest

# Multiple labels (ALL must match)
runs-on: [self-hosted, linux, x64, gpu]

# Runner group (Team/Enterprise)
runs-on:
  group: my-runner-group

# Runner group + labels
runs-on:
  group: production-runners
  labels: [ubuntu-latest]

# Dynamic (from matrix)
runs-on: ${{ matrix.os }}

# Dynamic (from context)
runs-on: ${{ github.event_name == 'push' && 'ubuntu-latest' || 'self-hosted' }}
```

---

## Runner Environment Details

### File System

| Variable | Path | Description |
|----------|------|-------------|
| `GITHUB_WORKSPACE` | `/home/runner/work/repo/repo` | Default working directory; checkout destination |
| `RUNNER_TEMP` | `/home/runner/work/_temp` | Temp dir; cleared before/after each job |
| `RUNNER_TOOL_CACHE` | `/opt/hostedtoolcache` | Preinstalled tools (node, python, java...) |
| `HOME` | `/home/runner` | User home directory |

### Administrative Access

- **Linux/macOS:** `sudo` without password
- **Windows:** Administrator account with UAC disabled

### Networking

- Outbound internet access (HTTP/HTTPS/DNS)
- No inbound connections by default
- IP ranges published via GitHub API (`GET /meta`); updated weekly
- Linux/Windows runners: Azure datacenters
- macOS runners: GitHub's proprietary cloud

**Required endpoints:**
- `github.com`, `api.github.com`
- `*.actions.githubusercontent.com`
- `*.blob.core.windows.net` (artifacts/cache)
- `ghcr.io`, `*.pkg.github.com` (packages)

---

## Timeouts

| Runner Type | Default | Maximum |
|-------------|---------|---------|
| GitHub-hosted | 6 hours | 6 hours |
| Self-hosted | 6 hours | 5 days (432,000 min) |
| `ubuntu-slim` | 15 min | 15 min |

```yaml
jobs:
  long-job:
    timeout-minutes: 120    # Override job timeout

    steps:
      - timeout-minutes: 10  # Override step timeout
        run: ./long-script.sh
```

---

## Larger Runners (Team/Enterprise Only)

Available machine types:

| Label Pattern | CPU | RAM |
|--------------|-----|-----|
| `ubuntu-latest-4-cores` | 4 | 16 GB |
| `ubuntu-latest-8-cores` | 8 | 32 GB |
| `ubuntu-latest-16-cores` | 16 | 64 GB |
| `ubuntu-latest-32-cores` | 32 | 128 GB |
| `windows-latest-4-cores` | 4 | 16 GB |
| `windows-latest-8-cores` | 8 | 32 GB |
| GPU runners | varies | varies |

Features: Static IP addresses, Azure VNet integration, autoscaling, custom images.

---

## Self-Hosted Runners

### Adding Runners

```yaml
# Workflow targeting self-hosted runner
runs-on: self-hosted                         # Any self-hosted runner
runs-on: [self-hosted, linux]               # Self-hosted Linux runner
runs-on: [self-hosted, linux, x64, gpu]     # Specific labels
```

### Key Differences from GitHub-Hosted

| Aspect | GitHub-Hosted | Self-Hosted |
|--------|--------------|-------------|
| Lifetime | Ephemeral (fresh VM per job) | Persistent |
| Cleanup | Automatic | Manual or scripts |
| Public repos | Safe | UNSAFE (risk of persistent compromise) |
| Cost | Included (public) / metered (private) | Your infrastructure |
| Max job duration | 6 hours | 5 days |

### Security Warning

**Never use self-hosted runners for public repositories.** Any PR author can execute code on your runner and compromise the machine.

### Just-In-Time (JIT) Runners

```bash
./run.sh --jitconfig ${encoded_jit_config}
```

JIT runners perform at most one job then auto-delete. Use for better security isolation.

### Runner Labels

```bash
# Apply custom labels when configuring runner
./config.sh --url https://github.com/owner/repo \
  --token TOKEN \
  --labels gpu,cuda,production
```

### Runner Groups (Org/Enterprise)

Control which repositories can use which runners:

```yaml
runs-on:
  group: production-runners    # Restricts to org-managed runner group
  labels: [linux]
```

---

## Container Jobs

```yaml
jobs:
  containerized:
    runs-on: ubuntu-latest
    container:
      image: node:20-alpine
      credentials:
        username: ${{ github.actor }}
        password: ${{ secrets.GHCR_TOKEN }}
      env:
        NODE_ENV: test
      ports: [8080]
      volumes: ['/data:/data']
      options: --cpus 2
    steps:
      - uses: actions/checkout@v4
      - run: node --version     # Runs inside container
```

**Notes:**
- Steps run inside the container
- `actions/checkout` must be first step (mounts workspace)
- `GITHUB_WORKSPACE` is mounted at `/github/workspace` in container
- Dockerfile must not specify `USER` instruction
- Services also run as containers alongside the job container

---

## Preinstalled Software

GitHub-hosted runners include many tools preinstalled. Key ones:

**Linux (ubuntu-latest):**
- Node.js (multiple versions via nvm)
- Python (multiple versions)
- Java (multiple versions)
- Docker, docker-compose
- Git, curl, wget, jq
- AWS CLI, Azure CLI, GCloud CLI
- GitHub CLI (`gh`)

**macOS (macos-latest):**
- Homebrew
- Xcode
- Node.js, Python, Ruby
- AWS CLI, Azure CLI

**Windows (windows-latest):**
- Chocolatey
- Visual Studio Build Tools
- Node.js, Python, Java
- Docker Desktop
- PowerShell Core

Check current preinstalled software: https://github.com/actions/runner-images
