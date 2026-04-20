---
name: docker-compose
description: >
  Docker 與 Docker Compose 完整技術參考（Dockerfile + Compose Specification）。
  當任務涉及以下情況時，必須使用此 skill：
  撰寫或修改 Dockerfile、.dockerignore、docker-compose.yml、docker-compose.yaml、compose.yml、compose.yaml；
  使用指令 docker build、docker run、docker exec、docker compose up/down/build/logs/exec/ps/pull/push/config；
  Dockerfile 指令 FROM、RUN、CMD、LABEL、EXPOSE、ENV、ADD、COPY、ENTRYPOINT、VOLUME、USER、WORKDIR、ARG、
  ONBUILD、STOPSIGNAL、HEALTHCHECK、SHELL、COPY --from、RUN --mount、RUN --network；
  Compose 屬性 services、networks、volumes、configs、secrets、include、profiles、
  image、build、ports、depends_on、healthcheck、environment、env_file、restart、deploy、develop、
  volumes_from、cap_add、extra_hosts、external、driver、driver_opts；
  BuildKit、multi-stage builds、buildx、`# syntax=docker/dockerfile:1`、parser directives；
  Compose profiles、Compose include、watch mode、docker compose watch；
  container healthcheck、restart policy、network driver (bridge/overlay/host/none)、volume types (volume/bind/tmpfs)。
  此 skill 對應 Compose Specification（取代舊的 version 2/3 Compose 格式）與現代 Dockerfile v1 syntax。
---

# Docker & Docker Compose

> **文件來源**：https://docs.docker.com/reference/dockerfile/ 與 https://docs.docker.com/reference/compose-file/
> **適用版本**：Dockerfile `# syntax=docker/dockerfile:1` / Docker Compose Specification（取代 v2/v3 格式）
> **前提**：Docker Engine 20.10+（推薦 24+），Compose v2（`docker compose` 而非 `docker-compose`）

---

## 目錄

1. [Dockerfile 指令速查](#dockerfile-指令速查)
2. [FROM 與 Multi-stage Build](#from-與-multi-stage-build)
3. [RUN 與 BuildKit Mount](#run-與-buildkit-mount)
4. [CMD vs ENTRYPOINT](#cmd-vs-entrypoint)
5. [COPY vs ADD](#copy-vs-add)
6. [ENV / ARG](#env--arg)
7. [HEALTHCHECK 與其他](#healthcheck-與其他)
8. [Parser Directives](#parser-directives)
9. [.dockerignore](#dockerignore)
10. [Compose 頂層結構](#compose-頂層結構)
11. [Services 完整屬性](#services-完整屬性)
12. [Networks / Volumes / Configs / Secrets](#networks--volumes--configs--secrets)
13. [Profiles 與 Include](#profiles-與-include)
14. [Environment Variable 與 Interpolation](#environment-variable-與-interpolation)
15. [常用 CLI 命令](#常用-cli-命令)
16. [最佳實踐](#最佳實踐)

---

## Dockerfile 指令速查

| 指令 | 用途 |
|------|------|
| `FROM` | 起始基底映像 |
| `RUN` | 建構期執行命令，產生新 layer |
| `CMD` | 預設執行命令（runtime） |
| `LABEL` | 中繼資料 key=value |
| `EXPOSE` | 文件化對外 port（不實際發布） |
| `ENV` | 設定環境變數（image + runtime） |
| `ADD` | 複製（支援 URL、Git、auto-extract tar） |
| `COPY` | 複製（建議預設使用） |
| `ENTRYPOINT` | 預設執行檔（不易被 CLI 覆寫） |
| `VOLUME` | 宣告 mount 點 |
| `USER` | 切換執行使用者 |
| `WORKDIR` | 切換工作目錄 |
| `ARG` | 建構期變數（`docker build --build-arg`） |
| `ONBUILD` | 作為基底映像時才觸發的指令 |
| `STOPSIGNAL` | 停止訊號（預設 SIGTERM） |
| `HEALTHCHECK` | 健康檢查 |
| `SHELL` | 變更 shell 形式指令的 shell |

---

## FROM 與 Multi-stage Build

```dockerfile
# syntax=docker/dockerfile:1
FROM [--platform=<platform>] <image>[:<tag>|@<digest>] [AS <name>]
```

### 範例

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### 技巧

- 只有 `ARG` 可以出現在 `FROM` 之前，用於參數化 base image：

  ```dockerfile
  ARG NODE_VERSION=22
  FROM node:${NODE_VERSION}-alpine
  ```

- `--platform` 支援跨平台：`--platform=$BUILDPLATFORM` 或 `--platform=linux/amd64`。

- Multi-stage 可 `COPY --from=<stage_name>`、`COPY --from=<image>` 或 `COPY --from=<build_context_name>`。

- 只構建特定 stage：`docker build --target builder .`

- **Automatic platform ARGs**（BuildKit 自動提供，需先宣告才可用）：
  - `TARGETPLATFORM`、`TARGETOS`、`TARGETARCH`、`TARGETVARIANT`
  - `BUILDPLATFORM`、`BUILDOS`、`BUILDARCH`、`BUILDVARIANT`

---

## RUN 與 BuildKit Mount

### 基本語法

```dockerfile
# Shell form（呼叫 /bin/sh -c）
RUN apt-get update && apt-get install -y curl

# Exec form（不走 shell）
RUN ["apt-get", "install", "-y", "curl"]
```

### Heredoc（BuildKit）

```dockerfile
RUN <<EOF
apt-get update
apt-get install -y curl
rm -rf /var/lib/apt/lists/*
EOF
```

### `--mount=type=cache`（持久化快取）

```dockerfile
# Node
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Go
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -o /app ./cmd

# apt（需 sharing=locked）
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y curl
```

`cache` 選項：`id`, `target|dst`, `ro|readonly`, `sharing`（`shared|private|locked`）, `from`, `source`, `mode`, `uid`, `gid`。

### `--mount=type=bind`（來自 build context / 其他 stage）

```dockerfile
RUN --mount=type=bind,source=.,target=/src \
    cp /src/config.json /etc/app/

RUN --mount=type=bind,from=build,source=/out,target=/in \
    cp /in/app /usr/local/bin/
```

### `--mount=type=secret`（密鑰不進入映像）

```dockerfile
RUN --mount=type=secret,id=npm_token,target=/root/.npmrc \
    npm install

# 對應 build：
# docker build --secret id=npm_token,src=./npm_token.txt .
```

選項：`id`, `target|dst`, `env`, `required`, `mode`, `uid`, `gid`。

### `--mount=type=ssh`

```dockerfile
RUN --mount=type=ssh \
    git clone git@github.com:private/repo.git

# docker build --ssh default=$SSH_AUTH_SOCK .
```

### `--mount=type=tmpfs`

```dockerfile
RUN --mount=type=tmpfs,target=/tmp,size=1g \
    some_command
```

### `--network`

```dockerfile
RUN --network=default    # 預設，有網路
RUN --network=none       # 斷網
RUN --network=host       # host 網路（需 entitlement）
```

### `--security`（需 entitlement）

```dockerfile
RUN --security=insecure  # 特殊權限
```

---

## CMD vs ENTRYPOINT

### 三種形式

```dockerfile
# 1. ENTRYPOINT exec form + CMD default args（最推薦）
ENTRYPOINT ["node"]
CMD ["dist/main.js"]
# docker run my-image --inspect     → node --inspect dist/main.js
# docker run my-image script.js     → node script.js

# 2. 只有 CMD
CMD ["node", "dist/main.js"]
# docker run my-image               → node dist/main.js
# docker run my-image bash           → bash（完全覆蓋）

# 3. 只有 ENTRYPOINT
ENTRYPOINT ["node", "dist/main.js"]
# CLI 參數都被 append
```

### 組合行為表

| 情境 | 無 ENTRYPOINT | `ENTRYPOINT exec_e p1` (shell) | `ENTRYPOINT ["exec_e", "p1"]` (exec) |
|------|---------------|-------------------------------|------------------------------------|
| 無 CMD | error | `/bin/sh -c exec_e p1` | `exec_e p1` |
| `CMD ["exec_c", "p1_c"]` | `exec_c p1_c` | `/bin/sh -c exec_e p1` | `exec_e p1 exec_c p1_c` |
| `CMD exec_c p1_c` (shell) | `/bin/sh -c exec_c p1_c` | `/bin/sh -c exec_e p1` | `exec_e p1 /bin/sh -c exec_c p1_c` |

**Exec form 優勢**：
- 無 shell fork，signal 直接傳給進程（重要！）
- 無 shell 字串展開（可預期）
- **Shell form 會把你的進程變成 `/bin/sh -c` 的子進程，收不到 SIGTERM**

**要用 signal-safe 的 `tini`**：`docker run --init` 或 Dockerfile 裡 `ENTRYPOINT ["/tini", "--", ...]`。

---

## COPY vs ADD

### 選擇準則

- **預設用 COPY**，只在需要以下時才用 ADD：
  - 從 URL 下載（且真的需要）
  - 自動解壓 tar
  - 從 Git 拉取

### COPY 選項

```dockerfile
COPY [--from=<stage|image|context>] [--chmod=<perms>] [--chown=<user:group>] [--link] [--parents] [--exclude=<path>] <src>... <dest>
```

```dockerfile
# 基本
COPY package.json package-lock.json ./
COPY ./src /app/src

# 從其他 stage
COPY --from=builder /app/dist ./dist

# 從第三方 image
COPY --from=nginx:latest /etc/nginx/nginx.conf /etc/nginx/nginx.conf

# 權限
COPY --chmod=755 entrypoint.sh /usr/local/bin/
COPY --chown=node:node . /app

# 保留目錄結構
COPY --parents ./src/a.txt ./src/b.txt /dest/
# 保留目錄：/dest/src/a.txt, /dest/src/b.txt

# 排除
COPY --exclude=*.md --exclude=*.test.ts . /app

# --link（獨立 layer，變更前面 layer 不會使此 COPY 失效，加速重建）
COPY --link /static /var/www
```

### ADD 選項

```dockerfile
ADD [--checksum=<hash>] [--chmod=<perms>] [--chown=<user:group>] [--keep-git-dir=<bool>] [--link] [--unpack=<bool>] [--exclude=<path>] <src>... <dest>
```

```dockerfile
# URL（搭配 checksum）
ADD --checksum=sha256:beefdead... https://example.com/bin.tar.gz /opt/

# Git
ADD --keep-git-dir=true https://github.com/user/repo.git /app
ADD git@github.com:user/repo.git#branch:subdir /app

# Tar 自動解壓（本地）
ADD app.tar.gz /app/
```

---

## ENV / ARG

### ARG（build-time）

```dockerfile
ARG NODE_VERSION=22
ARG API_URL

# Usage
FROM node:${NODE_VERSION}-alpine
RUN echo "build API: ${API_URL}"

# docker build --build-arg API_URL=https://api.example.com .
```

- `ARG` 不會進入最終 image
- 作用域：在 stage 內（宣告 `FROM` 之後才可用）
- **Predefined proxy ARGs**：`HTTP_PROXY`、`HTTPS_PROXY`、`NO_PROXY` 等自動可用。

### ENV（runtime）

```dockerfile
ENV NODE_ENV=production
ENV DB_HOST="localhost" DB_PORT=5432
ENV LOG_LEVEL=info \
    CACHE_TTL=3600
```

- 會進入最終 image，容器啟動時也會有
- `ENV` 覆寫 `ARG`（若同名）
- **不可用來存放 secret**（會出現在 `docker inspect`）

### 變數展開（bash-like）

```dockerfile
${var:-default}    # 若 var 未設或空，用 default
${var-default}     # 若 var 未設，用 default
${var:+alt}        # 若 var 已設且非空，用 alt
${var+alt}         # 若 var 已設，用 alt
```

支援於：`ADD`、`COPY`、`ENV`、`EXPOSE`、`FROM`、`LABEL`、`STOPSIGNAL`、`USER`、`VOLUME`、`WORKDIR`、`ONBUILD`。

---

## HEALTHCHECK 與其他

### HEALTHCHECK

```dockerfile
HEALTHCHECK [--interval=30s] [--timeout=30s] [--start-period=0s] [--start-interval=5s] [--retries=3] \
  CMD <command>

# 範例
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 關閉繼承自 base image 的 healthcheck
HEALTHCHECK NONE
```

Exit code：`0` = healthy, `1` = unhealthy, `2` = reserved。

### VOLUME

```dockerfile
VOLUME ["/data", "/var/log"]
VOLUME /data
```

- 宣告 mount point
- 無法指定 host path（那是 `docker run -v` 的事）
- 建立後任何該路徑的內容在新 layer 會被丟棄（舊 builder）/ 保留（BuildKit）

### USER

```dockerfile
RUN addgroup -S app && adduser -S -G app app
USER app

# 或 UID
USER 1000:1000
```

### WORKDIR

```dockerfile
WORKDIR /app
WORKDIR subdir    # 相對 → /app/subdir
WORKDIR $DIR      # 支援變數
```

### STOPSIGNAL

```dockerfile
STOPSIGNAL SIGTERM
STOPSIGNAL 15
```

### SHELL

```dockerfile
SHELL ["/bin/bash", "-ec"]
SHELL ["powershell", "-Command"]
```

### ONBUILD

```dockerfile
ONBUILD COPY . /app
ONBUILD RUN npm install
# 僅當此 image 作為其他 Dockerfile 的 FROM 時才觸發
```

### EXPOSE

```dockerfile
EXPOSE 80
EXPOSE 80/tcp 443/tcp
EXPOSE 53/udp
```

**只是文件化**，不實際 publish（需 `docker run -p`）。

### LABEL

```dockerfile
LABEL maintainer="team@example.com"
LABEL org.opencontainers.image.source="https://github.com/user/repo" \
      org.opencontainers.image.version="1.0.0"
```

---

## Parser Directives

置於 Dockerfile 最頂端（空行之前）：

```dockerfile
# syntax=docker/dockerfile:1
# escape=\
# check=skip=JSONArgsRecommended
```

### `# syntax`（推薦）

```dockerfile
# syntax=docker/dockerfile:1         # 最新穩定
# syntax=docker/dockerfile:1-labs    # 實驗功能
```

啟用最新 BuildKit 前端特性（如 heredoc、`RUN --mount`、`--parents`）。

### `# escape`

```dockerfile
# escape=`     # Windows PowerShell 用反引號當 escape
```

### `# check`

```dockerfile
# check=skip=<CheckName1,CheckName2|all>
# check=error=true
```

控制 `docker build --check` 的 linter。

---

## .dockerignore

```
# 忽略
node_modules
.git
.vscode
*.log
dist
coverage

# 例外
!dist/index.html
```

放在 build context 根目錄，邏輯類似 `.gitignore`。減少 context 大小、避免複製 secret。

---

## Compose 頂層結構

```yaml
name: my-app            # 專案名（可被 COMPOSE_PROJECT_NAME 環境變數覆蓋）

services:
  web:
    image: nginx
  api:
    build: ./api

networks:
  default:
    driver: bridge

volumes:
  db-data:

configs:
  nginx-conf:
    file: ./nginx.conf

secrets:
  db-password:
    file: ./secrets/db-password.txt

include:
  - path: common.compose.yaml
    env_file: .env.common

x-common: &common       # YAML anchor（可被 services 引用）
  restart: unless-stopped
```

> **注意**：`version: "3.x"` 屬性已廢棄，現代 Compose 不需要。

---

## Services 完整屬性

### image / build

```yaml
services:
  api:
    image: node:22-alpine             # 直接拉取
  backend:
    build: ./backend                   # 等同 context
  worker:
    build:
      context: ./worker
      dockerfile: Dockerfile.prod
      args:
        NODE_VERSION: "22"
        BUILD_DATE: "2026-04-20"
      target: runtime                  # multi-stage 目標 stage
      secrets:
        - npm_token
      cache_from:
        - type=registry,ref=myregistry/cache:latest
      cache_to:
        - type=local,dest=/tmp/buildcache
      platforms:
        - linux/amd64
        - linux/arm64
      network: host
      shm_size: '2gb'
      labels:
        com.example.description: "Build label"
      tags:
        - myregistry/worker:1.0.0
      pull: true
```

### command / entrypoint

```yaml
command: node dist/main.js
command: ["node", "dist/main.js"]
command: []                           # 清空（使用 image 的 CMD）

entrypoint: /docker-entrypoint.sh
entrypoint:
  - /usr/bin/tini
  - --
  - node
  - dist/main.js
```

### environment / env_file

```yaml
environment:
  NODE_ENV: production
  DB_HOST: db
  CACHE_TTL: "3600"                   # 建議加引號

environment:
  - NODE_ENV=production
  - DB_PASSWORD                        # 從 shell 繼承

env_file: .env

env_file:
  - ./.env.common
  - ./.env.local

env_file:
  - path: ./.env.production
    required: true
    format: raw                       # 不做變數展開
    encoding: utf-8
```

### ports / expose

```yaml
# 短語法
ports:
  - "3000"
  - "8000:8000"
  - "127.0.0.1:5432:5432"
  - "6060:6060/udp"
  - "9000-9002:9000-9002"

# 長語法
ports:
  - name: web
    target: 80
    published: "8080"
    host_ip: 127.0.0.1
    protocol: tcp
    app_protocol: http
    mode: host                        # host=每台機器暴露一次; ingress=Swarm 負載平衡

expose:
  - "3000"                             # 僅對同一網路內的服務可見
  - "8080-8085/tcp"
```

### depends_on

```yaml
# 短語法（僅等 started）
depends_on:
  - db
  - redis

# 長語法（推薦）
depends_on:
  db:
    condition: service_healthy         # 等 healthcheck 通過
    restart: true                      # db 重啟時自動重啟本服務
  redis:
    condition: service_started         # 預設
    required: false                    # 缺 redis 也啟動
  migrate:
    condition: service_completed_successfully   # 等 exit 0
```

### healthcheck

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  # test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER"]
  # test: "curl -f http://localhost/ || exit 1"          # 等同 CMD-SHELL
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s                     # 啟動期寬限（不計入 retries）
  start_interval: 5s                    # 啟動期內的檢查頻率
  # disable: true                       # 停用

# test 格式：
# ["CMD", cmd, arg...]     → exec form
# ["CMD-SHELL", cmd]        → shell form
# ["NONE"]                  → 停用繼承自 image 的 healthcheck
```

### volumes

```yaml
# 短語法
volumes:
  - db-data:/var/lib/postgresql/data    # 命名 volume
  - ./config:/etc/app/config:ro          # bind mount + 唯讀
  - /var/run/docker.sock:/var/run/docker.sock

# 長語法
volumes:
  - type: volume
    source: db-data
    target: /var/lib/postgresql/data
    volume:
      nocopy: true
      subpath: sub/dir
  - type: bind
    source: /host/path
    target: /container/path
    read_only: true
    bind:
      propagation: shared
      create_host_path: true
      selinux: z
  - type: tmpfs
    target: /app/cache
    tmpfs:
      size: 100000000
      mode: 0755
  - type: image
    source: myimage:tag
    target: /vendor
    image:
      subpath: /data
```

### deploy

```yaml
deploy:
  mode: replicated                     # replicated | global
  replicas: 3
  restart_policy:
    condition: on-failure               # none | on-failure | any
    delay: 5s
    max_attempts: 3
    window: 120s
  update_config:
    parallelism: 1
    delay: 10s
    order: start-first                  # stop-first | start-first
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
      pids: 100
    reservations:
      cpus: '0.25'
      memory: 256M
  labels:
    com.example.foo: bar
  placement:
    constraints:
      - node.role == manager
```

在 `docker compose up` 下，`deploy.resources` 以 `mem_limit`/`cpus` 形式生效；`mode`、`replicas`、`restart_policy`、`placement` 等主要用於 Swarm。

### develop.watch（Compose Watch）

```yaml
develop:
  watch:
    - path: ./src
      action: sync                      # sync | rebuild | sync+restart
      target: /app/src                   # sync 時 container 內目標
    - path: ./package.json
      action: rebuild
    - path: ./public
      action: sync+restart
      target: /app/public
      ignore:
        - "*.log"
```

搭配 `docker compose watch` 啟用。

### restart

```yaml
restart: "no"                           # 預設，不重啟
restart: always                         # 一律重啟
restart: on-failure                     # 失敗才重啟
restart: on-failure:3                   # 失敗最多重啟 3 次
restart: unless-stopped                 # 除非手動停止
```

### 其他常用

```yaml
container_name: my-api                  # 固定名（不可 scale）
hostname: api.local
domainname: example.com
user: "1000:1000"
working_dir: /app
init: true                              # 加入 tini 作 PID 1

labels:
  com.example.service: api
  com.example.team: platform

pid: "host"                             # 共用 host PID namespace
# pid: "service:other-service"

networks:
  - backend
  - frontend
# 或長語法
networks:
  backend:
    aliases: [api, my-api]
    ipv4_address: 172.28.0.5
    ipv6_address: 2001:db8::5
    priority: 1000
    interface_name: eth0

extra_hosts:
  - "host.docker.internal=host-gateway"
  - "somehost=192.168.1.10"

dns:
  - 8.8.8.8
  - 1.1.1.1

dns_search:
  - example.com

tmpfs:
  - /run
  - /tmp

ulimits:
  nofile:
    soft: 20000
    hard: 40000

cap_add: [NET_ADMIN, SYS_TIME]
cap_drop: [ALL]
privileged: false
read_only: true
security_opt:
  - no-new-privileges:true
  - seccomp:default.json

sysctls:
  net.core.somaxconn: "1024"

mem_limit: 512m
cpus: '0.5'
cpu_shares: 512
shm_size: '1gb'
stop_grace_period: 30s
stop_signal: SIGINT

logging:
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"

profiles:
  - debug                               # 僅在 --profile debug 時啟動

pull_policy: always                     # always | never | missing | build | daily | weekly | every_12h

platform: linux/amd64

runtime: nvidia                          # GPU

devices:
  - "/dev/ttyUSB0:/dev/ttyUSB0"
  - "/dev/nvidia0"

configs:
  - source: nginx-conf
    target: /etc/nginx/nginx.conf
    uid: "0"
    gid: "0"
    mode: 0440

secrets:
  - source: db-password
    target: /run/secrets/db-password
    uid: "1000"
    gid: "1000"
    mode: 0400
```

### extends（多檔案共享）

```yaml
# common.yaml
services:
  webapp:
    image: myapp
    environment:
      DEBUG: "0"

# docker-compose.yml
services:
  web:
    extends:
      file: common.yaml
      service: webapp
    environment:
      DEBUG: "1"                        # 覆蓋
```

---

## Networks / Volumes / Configs / Secrets

### Networks 頂層

```yaml
networks:
  backend:
    driver: bridge                      # bridge | host | overlay | none | custom
    driver_opts:
      com.docker.network.bridge.host_binding_ipv4: "127.0.0.1"
    attachable: true                    # 允許 standalone container 加入 (overlay)
    enable_ipv4: true
    enable_ipv6: true
    internal: false                     # 無外部網路連線
    labels:
      com.example.network: backend
    ipam:
      driver: default
      config:
        - subnet: 172.28.0.0/16
          ip_range: 172.28.5.0/24
          gateway: 172.28.5.254
          aux_addresses:
            host1: 172.28.1.5
    name: my-backend-net                # 不加 project 前綴

  existing-net:
    external: true                      # 已存在的外部網路
    name: my-existing-net
```

### Volumes 頂層

```yaml
volumes:
  db-data:                              # 空（使用預設 driver）
  logs:
    driver: local
    driver_opts:
      type: nfs
      o: "addr=10.0.0.1,nolock,soft,rw"
      device: ":/exports/logs"
    labels:
      com.example.vol: data
    name: my-db-data
  existing-vol:
    external: true
    name: actual-volume-name
```

### Configs / Secrets 頂層

```yaml
configs:
  nginx-conf:
    file: ./config/nginx.conf
  # 或
  redis-conf:
    content: |
      maxmemory 256mb
      maxmemory-policy allkeys-lru
  # 或外部
  external-conf:
    external: true
    name: real_config_name

secrets:
  db-password:
    file: ./secrets/db-password.txt
  api-key:
    environment: API_KEY                # 從環境變數取值
  external-secret:
    external: true
```

---

## Profiles 與 Include

### Profiles（條件式啟動）

```yaml
services:
  app:
    image: myapp
  debug-ui:
    image: phpmyadmin
    profiles: ["debug"]
  mail:
    image: mailhog
    profiles: ["debug", "dev"]
```

```bash
docker compose up                       # 只起 app
docker compose --profile debug up       # app + debug-ui + mail
docker compose --profile debug --profile dev up
```

### Include

```yaml
include:
  - path: common.compose.yaml
  - path: ./compose/database.yaml
    env_file: ./compose/database.env
  - path: ./compose/cache.yaml
    project_directory: ./cache
```

---

## Environment Variable 與 Interpolation

### Compose 檔內變數展開

```yaml
services:
  web:
    image: ${REGISTRY:-docker.io}/nginx:${VERSION:-latest}
    environment:
      API_URL: ${API_URL}
      BACKEND_HOST: ${HOST:?HOST required}     # 未設就報錯
      DEBUG: "${DEBUG-0}"                       # 未設用 0
```

| 語法 | 意義 |
|------|------|
| `${VAR}` | 必須存在（若未設則空字串） |
| `${VAR:-default}` | 未設或空時用 default |
| `${VAR-default}` | 未設時用 default（空字串則保留） |
| `${VAR:?err}` | 未設或空則錯誤（err 為訊息） |
| `${VAR?err}` | 未設則錯誤 |
| `${VAR:+alt}` | 已設且非空則用 alt |
| `${VAR+alt}` | 已設則用 alt |

### 變數來源（優先序由高到低）

1. 命令列 `-e` / `--env` 傳入
2. Shell 環境變數
3. `.env` 檔（Compose 專案根目錄）
4. `environment` 區塊內定義

`.env` 範例：

```
NODE_ENV=production
DB_PASSWORD=secret
COMPOSE_PROJECT_NAME=myapp
```

### 多檔案 merge

```bash
docker compose -f compose.yaml -f compose.prod.yaml up
```

後者覆蓋前者同 key。

---

## 常用 CLI 命令

### Docker（單容器）

```bash
docker build -t myapp:1.0 .
docker build --build-arg NODE_VERSION=22 --target runtime -t myapp:prod .
docker build --secret id=npm,src=./npm_token.txt .
docker build --ssh default=$SSH_AUTH_SOCK .

docker run -d --name web -p 8080:80 --restart unless-stopped nginx
docker run --rm -it --env NODE_ENV=dev -v $(pwd):/app node:22 bash
docker run --init ...

docker exec -it web sh
docker logs -f --tail=100 web
docker inspect web
docker stats
docker ps -a
docker image prune -a
docker system prune --volumes
```

### Docker Compose（v2）

```bash
docker compose up -d                        # 背景啟動
docker compose up --build                   # 重新 build 再啟動
docker compose up --remove-orphans          # 清掉已從 compose 移除的服務
docker compose up -d web api                # 僅啟動指定服務

docker compose down                         # 停止並移除 container
docker compose down -v                      # 連同 volume 一起移除
docker compose down --rmi all               # 連同 image

docker compose build [SERVICE]
docker compose pull                          # 拉取所有 image
docker compose push

docker compose logs -f web                   # 追蹤 log
docker compose exec web sh                   # 進入運行中 container
docker compose run --rm web npm test         # 臨時 run

docker compose ps                            # 顯示狀態
docker compose top                           # 所有進程
docker compose config                        # 驗證 + 顯示展開後的 compose
docker compose config --services             # 列出服務名

docker compose watch                         # 啟用 develop.watch
docker compose restart web
docker compose stop / start / kill
docker compose pause / unpause
docker compose cp web:/app/log.txt ./
docker compose events
docker compose version
```

### buildx（多平台 / advanced builder）

```bash
docker buildx create --use --name multi
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:1.0 --push .
docker buildx build --cache-from type=gha --cache-to type=gha,mode=max .
docker buildx bake                          # 用 docker-bake.hcl
```

---

## 最佳實踐

### Dockerfile

1. **用 `# syntax=docker/dockerfile:1`** 啟用 BuildKit 特性。
2. **Multi-stage 分離 build 與 runtime**；final stage 只要必要檔案。
3. **Layer 順序穩定先放，常變放後面**：`COPY package*.json`（穩定依賴）→ `RUN npm ci` → `COPY . .`。
4. **合併 `RUN` 並清快取**：
   ```dockerfile
   RUN apt-get update && apt-get install -y --no-install-recommends curl \
       && rm -rf /var/lib/apt/lists/*
   ```
5. **用 exec form** 確保 signal 傳遞。
6. **用非 root user**：`USER node`。
7. **`--mount=type=cache`** 加速 pkg manager。
8. **`.dockerignore`** 排除 `node_modules`、`.git`、`dist`。
9. **Pin base image tag**：`node:22.11-alpine3.20` 而非 `node:latest`；生產建議用 digest `@sha256:...`。
10. **寫 HEALTHCHECK**。
11. **用 `--init` 或 `tini`** 處理 zombie process + signal。
12. **不要放 secret 在 ENV/ARG**，用 `--secret`、`--mount=type=secret` 或 Compose `secrets`。

### Docker Compose

1. **別用 `version:`** —— Compose Spec 不需要。
2. **明確 `depends_on` + `condition: service_healthy`**，避免啟動競態。
3. **為每個服務寫 healthcheck**（包括 PG、Redis）：
   ```yaml
   healthcheck:
     test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER"]
     interval: 5s
     timeout: 3s
     retries: 5
   ```
4. **Volumes 用 named volume** 比 bind mount 更穩定（除非開發期要 live reload）。
5. **把 dev / prod 分檔**：`compose.yaml`（共同）+ `compose.override.yaml`（dev，自動載入）+ `compose.prod.yaml`（`-f` 指定）。
6. **`profiles`** 管理選用服務（debug、seed、mail 等）。
7. **`env_file`** 分層：`.env.common` + `.env.${ENV}`。
8. **`restart: unless-stopped`** 對長期執行的 service。
9. **`stop_grace_period`** 給 app 時間 graceful shutdown。
10. **Compose Watch** 取代 `docker compose up --build` + nodemon 的複雜流程。

---

## 常見陷阱

| 症狀 | 原因 | 解法 |
|------|------|------|
| `SIGTERM` 沒作用，容器要 10 秒才停 | ENTRYPOINT shell form 吃掉 signal | 改 exec form 或用 `tini` / `--init` |
| `.env` 變數未載入 | 檔名或位置錯 | 必須在 compose 檔同目錄；或 `env_file` 指定 |
| build 卡在 `COPY . .` | `.dockerignore` 未排除 `node_modules` | 加入 `.dockerignore` |
| 多次 build 卻沒用快取 | `apt-get update` 與 install 分兩行 | 合併到同 `RUN` |
| ARG 在 FROM 之後無法使用 | ARG 作用域限 stage 內 | 在該 stage 內再宣告 `ARG` |
| Compose 裡 `command` 被 shell split | 用 string form | 改 exec（YAML list）form |
| Network 無法互通 | services 不在同一 network | 明確加 `networks` |
| Volume 權限問題 | named volume 首次由 root 建立 | `user:` + 預先 `chown`、或使用 bind mount |
| Healthcheck 一直失敗 | `curl`/`wget` 沒裝在 image 裡 | alpine 需 `apk add curl`，或用 `CMD-SHELL` + `wget -q --spider` / `node -e` |
