# act 本地測試參考

> [act](https://github.com/nektos/act) — 在本地使用 Docker 模擬 GitHub Actions workflow。

## 安裝

```bash
# macOS
brew install act

# Windows (scoop)
scoop install act

# Windows (choco)
choco install act-cli

# Linux
curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

## 基本用法

```bash
# 列出所有 workflow 中的 jobs
act -l

# 列出特定事件的 jobs
act push -l
act pull_request -l

# 執行預設事件（push）的所有 jobs
act

# 執行特定事件
act push
act pull_request
act workflow_dispatch

# 執行特定 job
act -j <job-name>

# 執行特定 workflow 檔案
act -W .github/workflows/ci.yml
```

## 事件模擬

```bash
# 使用自訂事件 payload
act pull_request -e event.json

# event.json 範例
{
  "pull_request": {
    "number": 1,
    "head": { "ref": "feature-branch" },
    "base": { "ref": "main" },
    "body": "PR description"
  },
  "action": "opened"
}

# workflow_dispatch with inputs
act workflow_dispatch -e dispatch.json

# dispatch.json 範例
{
  "inputs": {
    "environment": "staging",
    "debug": "true"
  }
}
```

## Secrets 與環境變數

```bash
# 從 .env 檔案載入 secrets
act -s GITHUB_TOKEN=ghp_xxx

# 從 .secrets 檔案載入（格式同 .env）
act --secret-file .secrets

# 設定環境變數
act --env MY_VAR=value
act --env-file .env

# 設定 GitHub token（很多 action 需要）
act -s GITHUB_TOKEN="$(gh auth token)"
```

## Docker 相關

```bash
# 使用特定 runner image（預設 medium）
act -P ubuntu-latest=catthehacker/ubuntu:act-latest      # full image (~12GB)
act -P ubuntu-latest=catthehacker/ubuntu:act-22.04       # specific version
act -P ubuntu-latest=ghcr.io/catthehacker/ubuntu:act-latest

# Image 大小選擇
# Micro (~200MB) — 最快，缺很多工具
act -P ubuntu-latest=node:16-buster-slim

# Medium (~500MB) — 預設，夠用於大多數場景
# act 預設使用此 image

# Full (~12GB) — 最接近 GitHub hosted runner
act -P ubuntu-latest=catthehacker/ubuntu:full-latest

# 使用本地 Docker 容器服務
act --container-daemon-socket /var/run/docker.sock

# 綁定掛載工作目錄（加速，避免複製）
act --bind
```

## 常用旗標

```bash
# 乾跑模式（不實際執行，只顯示會做什麼）
act -n

# 詳細輸出
act -v

# 指定 platform 映射
act -P ubuntu-22.04=catthehacker/ubuntu:act-22.04
act -P ubuntu-20.04=catthehacker/ubuntu:act-20.04

# 指定架構
act --container-architecture linux/amd64

# 跳過特定 step（透過 env）
act --env ACT=true
# 然後在 workflow 中: if: ${{ !env.ACT }}

# 設定 artifact 伺服器
act --artifact-server-path /tmp/artifacts
```

## act 的限制（重要）

| 功能 | act 支援 | 說明 |
|------|---------|------|
| `actions/checkout` | ✅ | 正常運作 |
| `actions/cache` | ⚠️ | 需要 `--artifact-server-path` |
| `actions/upload-artifact` | ⚠️ | 同上 |
| `services` (containers) | ✅ | 需要 Docker Compose |
| `container:` (job container) | ✅ | 正常運作 |
| `GITHUB_TOKEN` | ⚠️ | 需手動傳入 `-s GITHUB_TOKEN=xxx` |
| `secrets.*` | ⚠️ | 需手動傳入 |
| `permissions:` | ❌ | act 忽略，不會限制 token 權限 |
| `concurrency:` | ❌ | act 不支援 |
| `environment:` | ⚠️ | 部分支援，不走 approval flow |
| `reusable workflows` | ⚠️ | 本地檔案可以，remote ref 不行 |
| GitHub-hosted runner 工具 | ⚠️ | 取決於 image 大小 |
| `OIDC token` | ❌ | 無法模擬 |
| macOS/Windows runner | ❌ | act 只支援 Linux container |

## 實用組合範例

```bash
# 完整模擬 PR 事件，帶 secrets，用 full image
act pull_request \
  -e pr-event.json \
  -s GITHUB_TOKEN="$(gh auth token)" \
  -s NPM_TOKEN="$NPM_TOKEN" \
  -P ubuntu-latest=catthehacker/ubuntu:full-latest \
  --artifact-server-path /tmp/artifacts \
  -j build

# 快速驗證語法和邏輯（乾跑）
act push -n -l

# 只跑特定 workflow 的特定 job
act push -W .github/workflows/test.yml -j unit-test
```

## .actrc 設定檔

在專案根目錄建立 `.actrc` 省去重複旗標：

```
-P ubuntu-latest=catthehacker/ubuntu:act-latest
-P ubuntu-22.04=catthehacker/ubuntu:act-22.04
--secret-file .secrets
--env-file .env
--artifact-server-path /tmp/artifacts
```

## act 除錯技巧

```bash
# 進入容器互動式 shell（debug 用）
# 在 step 加入：
- run: sleep 3600
# 然後 docker exec -it <container> bash

# 查看 act 使用的 Docker containers
docker ps --filter "label=com.github.nektos.act"

# 清除 act 的 Docker 快取
docker system prune --filter "label=com.github.nektos.act"
```
