---
name: cloudflare-pages-wrangler
description: >
  Cloudflare Pages + Wrangler CLI 完整技術參考（v3+/v4）。
  當任務涉及以下情況時，必須使用此 skill：
  使用 wrangler CLI（pages deploy/dev、deploy、dev、tail、secret put/delete、types、versions、rollback）；
  撰寫或修改 wrangler.toml、wrangler.jsonc、wrangler.json；
  GitHub Actions 中 uses: cloudflare/wrangler-action@v3、uses: cloudflare/pages-action；
  Cloudflare Pages Functions（functions/ 目錄、onRequest、onRequestGet/Post/Put/Delete/Patch/Options、
  _middleware.ts、_worker.js、[param]、[[catchall]]、context.env、context.params、context.request、context.next、context.waitUntil）；
  _routes.json、_headers、_redirects、pages_build_output_dir；
  Pages bindings（KV/R2/D1/Durable Objects/Queues/Services/Hyperdrive/Vectorize/AI/Browser）；
  部署到 Cloudflare Workers（main、compatibility_date、compatibility_flags、routes）；
  Pages 建置設定（build command、build output directory、CF_PAGES_* 系統環境變數）；
  從 Cloudflare Pages 遷移到 Cloudflare Workers（Workers Static Assets）。
  工具：wrangler ^3.x/^4.x、cloudflare/wrangler-action@v3。
---

# Cloudflare Pages + Wrangler CLI

> **文件來源**：https://developers.cloudflare.com/pages、https://developers.cloudflare.com/workers/wrangler
> **適用版本**：Wrangler v3.x / v4.x
> **注意**：Cloudflare 正逐步將 Pages 遷移至 Workers（Workers Static Assets）。現有 Pages 專案仍完整支援，新專案可考慮直接用 Workers + Assets。

---

## 目錄

1. [專案檔案結構](#專案檔案結構)
2. [wrangler 設定檔](#wrangler-設定檔)
3. [Pages 建置設定](#pages-建置設定)
4. [Pages Functions 檔案路由](#pages-functions-檔案路由)
5. [Pages Functions Context](#pages-functions-context)
6. [Pages Functions Bindings](#pages-functions-bindings)
7. [_middleware、_routes.json、_headers、_redirects](#_middleware_routesjson_headers_redirects)
8. [進階模式 _worker.js](#進階模式-_workerjs)
9. [Wrangler CLI：Pages 命令](#wrangler-clipages-命令)
10. [Wrangler CLI：Workers 命令](#wrangler-cliworkers-命令)
11. [GitHub Actions 整合](#github-actions-整合)
12. [Environments / Secrets / 變數](#environments--secrets--變數)
13. [常見陷阱](#常見陷阱)

---

## 專案檔案結構

典型 Pages 專案（例如 Next.js / Astro / Vite）：

```
my-project/
├── wrangler.jsonc          # Pages/Workers 設定
├── functions/              # Pages Functions（可選）
│   ├── api/
│   │   ├── users.ts         # → /api/users
│   │   └── users/[id].ts    # → /api/users/:id
│   ├── [[catchall]].ts      # catch-all
│   └── _middleware.ts       # 全域 middleware
├── public/                  # 靜態資源（build output）
│   ├── _headers             # 自訂 response header
│   └── _redirects           # URL redirect
└── package.json
```

Workers（Workers Static Assets 寫法）：

```
my-worker/
├── wrangler.jsonc
├── src/
│   └── index.ts            # fetch handler
├── public/                  # 靜態資源（ASSETS binding）
└── package.json
```

---

## wrangler 設定檔

### 格式

支援三種格式，**Cloudflare 建議 `wrangler.jsonc`**（支援註解、較新功能先行支援）：

- `wrangler.jsonc` / `wrangler.json`（v3.91+）
- `wrangler.toml`

### 必填欄位

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "my-worker",                   // 英數 + dash，最多 255（workers.dev 最多 63）
  "main": "src/index.ts",                // Worker entry（assets-only 可省）
  "compatibility_date": "2026-04-01"     // yyyy-mm-dd
}
```

### 頂層常用欄位（Inheritable）

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2026-04-01",
  "compatibility_flags": ["nodejs_compat"],
  "account_id": "abc123",                // 或 CLOUDFLARE_ACCOUNT_ID env
  "workers_dev": false,                   // 關閉 *.workers.dev subdomain
  "preview_urls": true,
  "route": {                              // 單一 route
    "pattern": "api.example.com/*",
    "zone_name": "example.com"
  },
  "routes": [                             // 或多個
    { "pattern": "shop.example.com", "custom_domain": true },
    { "pattern": "api.example.com/*", "zone_id": "abc" }
  ],
  "tsconfig": "./tsconfig.json",
  "triggers": {
    "crons": ["0 * * * *"]                // 每小時
  },
  "minify": true,
  "keep_names": false,
  "no_bundle": false,
  "rules": [                              // 自訂 module import rules
    { "type": "Text", "globs": ["**/*.md"], "fallthrough": true }
  ],
  "build": {
    "command": "npm run build",
    "cwd": "worker",
    "watch_dir": "worker"
  },
  "dev": {
    "ip": "0.0.0.0",
    "port": 8787,
    "inspector_port": 9229,
    "local_protocol": "http",
    "upstream_protocol": "https",
    "enable_containers": true,
    "container_engine": "/var/run/docker.sock"
  },
  "limits": {
    "cpu_ms": 50,                         // max: 300000 (5min)
    "subrequests": 150
  },
  "observability": {
    "enabled": true,
    "head_sampling_rate": 0.1             // 0~1
  },
  "assets": {
    "directory": "./public",
    "binding": "ASSETS",
    "html_handling": "force-trailing-slash",   // auto-trailing-slash | drop-trailing-slash | none
    "not_found_handling": "404-page",           // none | single-page-application | 404-page
    "run_worker_first": ["/api/*", "!/api/docs/*"]
  },
  "placement": { "mode": "smart" },
  "logpush": true,
  "tail_consumers": [{ "service": "log-aggregator" }],
  "send_metrics": true,
  "keep_vars": false,                     // deploy 時保留 dashboard 設定的變數
  "migrations": [                         // Durable Objects
    { "tag": "v1", "new_classes": ["Counter"] }
  ]
}
```

### Pages 專案專用

```jsonc
{
  "name": "my-pages-site",
  "compatibility_date": "2026-04-01",
  "pages_build_output_dir": "./dist",     // Pages 專屬
  "vars": { "API_URL": "https://api.example.com" },
  "kv_namespaces": [
    { "binding": "SESSIONS", "id": "abc123" }
  ]
}
```

### Bindings（不繼承，每個 env 需重複宣告）

```jsonc
{
  "vars": {
    "NODE_ENV": "production"
  },
  "kv_namespaces": [
    { "binding": "CACHE", "id": "abc", "preview_id": "def" }
  ],
  "r2_buckets": [
    { "binding": "MEDIA", "bucket_name": "my-media", "preview_bucket_name": "my-media-dev" }
  ],
  "d1_databases": [
    { "binding": "DB", "database_name": "prod-db", "database_id": "uuid", "migrations_dir": "migrations" }
  ],
  "queues": {
    "producers": [{ "binding": "MY_QUEUE", "queue": "my-queue" }],
    "consumers": [{
      "queue": "my-queue",
      "max_batch_size": 10,
      "max_batch_timeout": 30,
      "max_retries": 3,
      "dead_letter_queue": "dlq"
    }]
  },
  "durable_objects": {
    "bindings": [
      { "name": "COUNTER", "class_name": "Counter", "script_name": "other-worker" }
    ]
  },
  "services": [
    { "binding": "BACKEND", "service": "backend-worker", "environment": "production" }
  ],
  "hyperdrive": [{ "binding": "HYPERDRIVE", "id": "abc" }],
  "vectorize": [{ "binding": "VEC", "index_name": "my-index" }],
  "ai": { "binding": "AI" },
  "browser": { "binding": "BROWSER" },
  "mtls_certificates": [{ "binding": "CERT", "certificate_id": "abc" }],
  "analytics_engine_datasets": [{ "binding": "EVENTS", "dataset": "events" }],
  "images": { "binding": "IMAGES" }
}
```

### Route 類型

```jsonc
// Custom Domain（不用設 zone_id）
"routes": [{ "pattern": "shop.example.com", "custom_domain": true }]

// Zone ID route
"routes": [{ "pattern": "sub.example.com/*", "zone_id": "abc" }]

// Zone name route
"routes": [{ "pattern": "sub.example.com/*", "zone_name": "example.com" }]

// Simple（workers.dev 開啟時）
"route": "example.com/*"
```

### Environments（命名環境）

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2026-04-01",
  "route": "example.com/*",
  "kv_namespaces": [{ "binding": "CACHE", "id": "prod-kv" }],

  "env": {
    "staging": {
      "name": "my-worker-staging",
      "route": "staging.example.com/*",
      "kv_namespaces": [{ "binding": "CACHE", "id": "staging-kv" }]
    },
    "preview": {
      "name": "my-worker-preview",
      "workers_dev": true,
      "kv_namespaces": [{ "binding": "CACHE", "id": "preview-kv" }]
    }
  }
}
```

部署：`wrangler deploy --env staging`。

**注意**：bindings 不繼承，每個 `env` 都要重新宣告。

---

## Pages 建置設定

Dashboard（或 `wrangler.jsonc`）上的設定：

| 項目 | 說明 | 範例 |
|------|------|------|
| Build command | 建置指令 | `npm run build` |
| Build output directory | 靜態產物目錄 | `dist` / `build` / `.output/public` |
| Root directory | 專案根（monorepo 子目錄） | `apps/web` |

### Cloudflare 自動注入的環境變數（build 期）

| 變數 | 值 |
|------|-----|
| `CI` | `true` |
| `CF_PAGES` | `1` |
| `CF_PAGES_COMMIT_SHA` | Git commit hash |
| `CF_PAGES_BRANCH` | 當前分支名 |
| `CF_PAGES_URL` | 當次部署的 URL |

範例用途：

```js
// next.config.js
const isPreview = process.env.CF_PAGES_BRANCH !== 'main';
module.exports = {
  env: { IS_PREVIEW: isPreview },
};
```

### 常見框架預設

| 框架 | Build command | Output dir |
|------|---------------|-----------|
| Astro | `npm run build` | `dist` |
| Next.js (static) | `npm run build` | `out` |
| Next.js (next-on-pages) | `npx @cloudflare/next-on-pages@1` | `.vercel/output/static` |
| Vite (Vue/React) | `npm run build` | `dist` |
| SvelteKit | `npm run build` | `.svelte-kit/cloudflare` |
| Nuxt 3 | `npm run build` | `.output/public` |
| Remix | `npm run build` | `public` |

---

## Pages Functions 檔案路由

把 `functions/` 目錄放在專案根，結構即對應 URL：

| 檔案 | 路由 |
|------|------|
| `functions/index.ts` | `/` |
| `functions/about.ts` | `/about` |
| `functions/api/users.ts` | `/api/users` |
| `functions/api/users/[id].ts` | `/api/users/:id` |
| `functions/api/[[path]].ts` | `/api/*`（catch-all） |
| `functions/_middleware.ts` | 套用到同目錄與子目錄的所有請求 |

### 動態參數

```typescript
// functions/users/[user].ts
export const onRequest: PagesFunction = (context) => {
  const { user } = context.params;           // string（單段）
  return new Response(`User: ${user}`);
};

// functions/users/[[path]].ts
export const onRequest: PagesFunction = (context) => {
  const path = context.params.path;          // string[]（多段）
  return new Response(`Path: ${path.join('/')}`);
};
```

### HTTP 方法專屬 handler

```typescript
// functions/api/users.ts
export const onRequestGet: PagesFunction = async (ctx) => {
  return Response.json({ users: [] });
};

export const onRequestPost: PagesFunction = async (ctx) => {
  const body = await ctx.request.json();
  return Response.json({ created: body });
};

export const onRequestDelete: PagesFunction = async (ctx) => {
  return new Response(null, { status: 204 });
};

// 其他：onRequestPut / onRequestPatch / onRequestHead / onRequestOptions
```

### Fallback onRequest

```typescript
// 未匹配方法時的 fallback
export const onRequest: PagesFunction = async (ctx) => {
  return new Response('Method Not Allowed', { status: 405 });
};
```

---

## Pages Functions Context

`context` 是每個 handler 的第一個參數，包含：

```typescript
interface EventContext<Env, P extends string, Data> {
  request: Request;            // 標準 Fetch API Request
  functionPath: string;         // 路由路徑（/api/users）
  waitUntil: (p: Promise<any>) => void;   // 非阻塞背景工作
  passThroughOnException: () => void;      // 例外時 fallback 到 asset
  next: (input?, init?) => Promise<Response>;  // 傳遞到下個 handler / asset
  env: Env & { ASSETS: Fetcher };          // 所有 bindings
  params: Params<P>;            // 路由參數
  data: Data;                   // middleware 之間傳遞資料
}

type PagesFunction<Env = unknown, P extends string = any, Data extends Record<string, unknown> = Record<string, unknown>> =
  (context: EventContext<Env, P, Data>) => Response | Promise<Response>;
```

### 使用範例

```typescript
interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  API_KEY: string;              // 來自 vars / secrets
  ASSETS: Fetcher;
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env, waitUntil } = ctx;

  const cached = await env.CACHE.get('key');
  if (cached) return new Response(cached);

  const result = await env.DB.prepare('SELECT * FROM users').all();
  const body = JSON.stringify(result.results);

  // 背景寫入快取，不阻塞 response
  waitUntil(env.CACHE.put('key', body, { expirationTtl: 60 }));

  return new Response(body, { headers: { 'content-type': 'application/json' } });
};
```

---

## Pages Functions Bindings

各 binding 在 `context.env` 下取用：

```typescript
// KV
await env.CACHE.get('key');
await env.CACHE.put('key', 'value', { expirationTtl: 60 });
await env.CACHE.delete('key');
await env.CACHE.list({ prefix: 'user:' });

// R2
const object = await env.MEDIA.get('path/to/file.jpg');
await env.MEDIA.put('path/to/file.jpg', request.body);
await env.MEDIA.delete('path/to/file.jpg');

// D1（SQLite）
const stmt = env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId);
const { results } = await stmt.all();
const row = await stmt.first();
await env.DB.batch([stmt1, stmt2]);

// Durable Objects
const id = env.COUNTER.idFromName('global');
const stub = env.COUNTER.get(id);
const res = await stub.fetch('https://do/increment');

// Queues（producer）
await env.MY_QUEUE.send({ task: 'process' });
await env.MY_QUEUE.sendBatch([{ body: {...} }, { body: {...} }]);

// Service binding（呼叫其他 Worker）
const res = await env.BACKEND.fetch(request);

// AI
const result = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
  prompt: 'Hello',
});

// Vectorize
const matches = await env.VEC.query(vector, { topK: 5 });

// Hyperdrive（Postgres connection pooling）
import { Client } from 'pg';
const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
await client.connect();
```

### vars vs secrets

- **`vars`**（在 `wrangler.jsonc`）：明碼，適合非敏感設定。
- **`secrets`**：加密，只能透過 `wrangler secret put` 或 Dashboard 設定，不放在 code 或 config。

---

## _middleware、_routes.json、_headers、_redirects

### _middleware.ts（Pages Functions）

```typescript
// functions/_middleware.ts
const authMiddleware: PagesFunction = async (ctx) => {
  const token = ctx.request.headers.get('Authorization');
  if (!token) return new Response('Unauthorized', { status: 401 });

  // 驗證 token...
  ctx.data.user = { id: '123' };             // 傳遞給下一個 handler

  return ctx.next();                          // 呼叫下個 middleware 或 route handler
};

const logMiddleware: PagesFunction = async (ctx) => {
  const start = Date.now();
  const res = await ctx.next();
  console.log(`${ctx.request.method} ${ctx.request.url} ${Date.now() - start}ms`);
  return res;
};

// 多個 middleware
export const onRequest = [logMiddleware, authMiddleware];
```

### _routes.json（控制哪些路徑走 Function）

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/images/*", "/static/*"]
}
```

放在 `build output directory` 根目錄。限制：include 至少 1 條，總規則 ≤ 100，單條 ≤ 100 字元。

### public/_headers

```
# 應用到所有路徑
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

# 特定路徑
/api/*
  Access-Control-Allow-Origin: *
  Cache-Control: no-store

/static/*
  Cache-Control: public, max-age=31536000, immutable
```

### public/_redirects

```
# 基本 redirect（301）
/old-path    /new-path
/blog/*      /posts/:splat      301

# status code
/removed     /                  410
/moved       /new-location      302

# Placeholder
/users/:id   /profile/:id

# 強制（忽略存在的檔案）
/about!      /team.html         200
```

---

## 進階模式 _worker.js

關閉檔案路由，自己寫完整 Worker：

```typescript
// public/_worker.js 或 src/_worker.ts → build → output/_worker.js
interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // API 路徑
    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env, ctx);
    }

    // 其他 fallback 到靜態資源
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
```

放在 `build output` 目錄即啟用。此模式下 `functions/` 目錄會被忽略。

---

## Wrangler CLI：Pages 命令

### 安裝

```bash
npm install -g wrangler
# 或專案內
npm install --save-dev wrangler
npx wrangler --version
```

### Pages 專案管理

```bash
# 建立專案（互動式，會問 name 與 production branch）
npx wrangler pages project create <PROJECT_NAME>
npx wrangler pages project create my-site --production-branch=main

# 列出所有專案
npx wrangler pages project list

# 刪除
npx wrangler pages project delete <PROJECT_NAME>
```

### Direct Upload 部署

```bash
# 部署到 production
npx wrangler pages deploy <BUILD_OUTPUT_DIR> \
  --project-name=my-site \
  --branch=main \
  --commit-hash=$(git rev-parse HEAD) \
  --commit-message="$(git log -1 --pretty=%B)" \
  --commit-dirty=false \
  --compatibility-date=2026-04-01 \
  --compatibility-flags=nodejs_compat

# 部署到預覽環境
npx wrangler pages deploy ./dist --project-name=my-site --branch=feature-xyz
```

常用 flag：

| Flag | 說明 |
|------|------|
| `--project-name` | 專案名（cache 過就可省） |
| `--branch` | 分支名（production-branch 會推到正式） |
| `--commit-hash` | 關聯 commit |
| `--commit-message` | 關聯 commit msg |
| `--commit-dirty` | 本地 working tree 非乾淨時 |
| `--compatibility-date` | 覆寫 wrangler.jsonc |
| `--compatibility-flags` | 覆寫 wrangler.jsonc |

### 本地開發

```bash
# 本地啟動（含 Functions + 靜態檔）
npx wrangler pages dev <BUILD_OUTPUT_DIR>

# 搭配 framework dev server（proxy 模式）
npx wrangler pages dev -- npm run dev        # 啟動自己的 dev server
npx wrangler pages dev --proxy 3000 -- npm run dev

# 指定 port / local bindings
npx wrangler pages dev ./dist --port=8788 \
  --kv=MY_KV --r2=MY_BUCKET --d1=DB \
  --service=BACKEND=backend-worker \
  --local
```

### Deployment / 日誌

```bash
npx wrangler pages deployment list --project-name=my-site

npx wrangler pages deployment tail --project-name=my-site
npx wrangler pages deployment tail <DEPLOYMENT_ID>

# 下載 wrangler 設定
npx wrangler pages download config <PROJECT_NAME>
```

### Functions 本地建置（少用，`pages dev` 自動處理）

```bash
npx wrangler pages functions build
npx wrangler pages functions optimize-routes
```

---

## Wrangler CLI：Workers 命令

### 認證

```bash
npx wrangler login                      # 瀏覽器 OAuth
npx wrangler logout
npx wrangler whoami
```

環境變數替代：`CLOUDFLARE_API_TOKEN` 與 `CLOUDFLARE_ACCOUNT_ID`（CI/CD 常用）。

### 部署

```bash
npx wrangler deploy                     # 預設
npx wrangler deploy src/index.ts        # 指定 entry
npx wrangler deploy --env staging
npx wrangler deploy --name my-worker --compatibility-date=2026-04-01
npx wrangler deploy --dry-run --outdir=./dist   # 只編譯不部署
npx wrangler deploy --minify
```

常用 flag：

| Flag | 說明 |
|------|------|
| `--name` | 覆寫 worker 名稱 |
| `--env` | 使用特定 env |
| `--outdir` | 輸出 build 產物 |
| `--compatibility-date` | 覆寫 |
| `--compatibility-flags` | 覆寫 |
| `--var KEY:VALUE` | 覆寫 var |
| `--define KEY:VALUE` | 編譯時替換（如 `esbuild define`） |
| `--triggers / --schedule` | cron 設定 |
| `--routes / --route` | 覆寫 route |
| `--domain` | 加 custom domain |
| `--keep-vars` | deploy 時不覆寫 dashboard 的變數 |
| `--minify` | 壓縮 |
| `--dry-run` | 不真的部署 |
| `--tag`, `--message` | 版本標籤與訊息 |

### 本地開發

```bash
npx wrangler dev                        # 本地預覽 (localhost:8787)
npx wrangler dev --remote               # 使用實際 Cloudflare 網路執行
npx wrangler dev --test-scheduled       # 開啟 /__scheduled 路徑測試 cron
npx wrangler dev --ip=0.0.0.0 --port=8888 --local-protocol=http
npx wrangler dev --var API_KEY:xxx --define VERSION:'"1.0"'
npx wrangler dev --https-key-path=./key.pem --https-cert-path=./cert.pem
```

### Secrets

```bash
# 放入 / 更新（會 prompt 輸入）
npx wrangler secret put MY_SECRET
echo "value" | npx wrangler secret put MY_SECRET

# 特定 env
npx wrangler secret put MY_SECRET --env staging

# 刪除
npx wrangler secret delete MY_SECRET

# 列出
npx wrangler secret list

# 批次（從 JSON stdin）
cat secrets.json | npx wrangler secret bulk
# secrets.json: { "KEY1": "VAL1", "KEY2": "VAL2" }

# Pages 專案
npx wrangler pages secret put MY_SECRET --project-name=my-site
npx wrangler pages secret list --project-name=my-site
```

### Versions & Deployments（v3.40+）

```bash
# 上傳新版本（不立即部署）
npx wrangler versions upload --tag v1.2.3 --message "new feature"

# 將特定 version 100% 推到 traffic
npx wrangler versions deploy <VERSION_ID>@100% --yes

# 漸進部署
npx wrangler versions deploy <OLD>@90% <NEW>@10% --yes

# 列出 10 個最新 version
npx wrangler versions list
npx wrangler versions view <VERSION_ID>

# Rollback
npx wrangler rollback <VERSION_ID> --message "rollback to stable"
npx wrangler rollback                   # 預設 rollback 至上一版

# 看 deployments
npx wrangler deployments list
npx wrangler deployments status
```

### 生成型別

```bash
# 由 wrangler.jsonc 生成 Env 型別 + runtime types
npx wrangler types
npx wrangler types --env=staging
npx wrangler types --env-interface=MyEnv ./worker-configuration.d.ts

# CI 檢查
npx wrangler types --check         # exit 0 若最新
```

### 其他

```bash
npx wrangler init my-worker              # 建立新專案（會改呼叫 create-cloudflare）
npx wrangler delete                       # 刪除 Worker
npx wrangler tail                         # 即時 log
npx wrangler tail --format=pretty --status=error
npx wrangler docs                         # 開文件
npx wrangler check startup                # CPU profile 冷啟動

# Storage（KV / R2 / D1 等都有 sub-command，例子）
npx wrangler kv:namespace create MY_KV
npx wrangler kv:namespace list
npx wrangler kv:key put --binding=MY_KV "key" "value"
npx wrangler kv:key get --binding=MY_KV "key"

npx wrangler r2 bucket create my-bucket
npx wrangler r2 object put my-bucket/key --file=./file.txt

npx wrangler d1 create my-db
npx wrangler d1 execute my-db --file=./schema.sql
npx wrangler d1 execute my-db --command "SELECT * FROM users"
npx wrangler d1 migrations apply my-db
```

### 環境變數影響 Wrangler 行為

| 變數 | 用途 |
|------|------|
| `CLOUDFLARE_API_TOKEN` | CI 認證（取代 OAuth） |
| `CLOUDFLARE_ACCOUNT_ID` | 帳號 ID |
| `WRANGLER_LOG` | 除錯 log level |
| `CLOUDFLARE_ENV` | 設定 env（等於 `--env`） |

---

## GitHub Actions 整合

### 用 `cloudflare/wrangler-action@v3`

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci

      - run: npm run build

      - name: Deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          # Pages 部署
          command: pages deploy ./dist --project-name=my-site --branch=${{ github.head_ref || github.ref_name }}
          # 或 Workers 部署：
          # command: deploy --env production
```

### 關鍵 action 輸入

| 輸入 | 說明 |
|------|------|
| `apiToken` | 必填（或用 `CLOUDFLARE_API_TOKEN` secret） |
| `accountId` | 帳號 ID |
| `workingDirectory` | 執行目錄（monorepo 子專案） |
| `wranglerVersion` | 指定 wrangler 版本 |
| `command` | wrangler 子命令（如 `deploy`、`pages deploy`） |
| `secrets` | 寫入 secret（多行 KEY=value） |
| `preCommands` | 部署前執行 |
| `postCommands` | 部署後執行 |

### 拆 PR Preview 的典型 workflow

```yaml
- name: Deploy
  id: deploy
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    command: pages deploy ./dist --project-name=my-site --branch=${{ github.head_ref || github.ref_name }}

- name: Comment PR
  if: github.event_name == 'pull_request'
  uses: thollander/actions-comment-pull-request@v2
  with:
    message: |
      Preview URL: ${{ steps.deploy.outputs.deployment-url }}
```

action outputs：`deployment-url`、`pages-deployment-alias-url`、`command-output`、`command-stderr`。

---

## Environments / Secrets / 變數

### 優先序（從高到低）

1. `wrangler deploy --var KEY:VAL`（CLI 覆寫）
2. `wrangler.jsonc` 的 `env.<name>` 下同名 binding
3. Secrets（`wrangler secret put`）
4. Dashboard 設定的 vars（除非 `keep_vars: false`，部署會被覆蓋）
5. `wrangler.jsonc` 頂層 `vars`

### 本地 dev 的變數

`.dev.vars` 檔（類 `.env`）會被 `wrangler dev` 自動載入：

```
# .dev.vars
API_KEY=dev-key
DATABASE_URL=postgres://localhost
```

加入 `.gitignore`。

---

## 常見陷阱

| 症狀 | 原因 | 解法 |
|------|------|------|
| `wrangler deploy` 後 Dashboard 變數消失 | 預設會覆寫 | 加 `"keep_vars": true` 或在 `wrangler.jsonc` 也宣告 `vars` |
| Pages Functions 不執行 | `functions/` 目錄位置錯 | 放在 **專案根**（非 output dir） |
| `_headers` 沒生效 | 沒放在 build output dir | 放在 `dist/_headers` 而非 `public/_headers`（除非 framework copy 過去） |
| 部署的 Worker 無法讀到 binding | `env.<name>` 下未重新宣告 | bindings 不繼承 |
| `compatibility_date` 太舊 | nodejs_compat 或 new API 不可用 | 更新並加 flag |
| GitHub Actions 權限不足 | API token 權限不夠 | Token 需要 `Account - Cloudflare Pages:Edit` + `User - User Details:Read` |
| `pages dev` binding 空的 | 沒傳 `--kv` / 沒在 `wrangler.jsonc` | 用 flag 或 config 補上 |
| `D1` query 回 null | `.first()` vs `.all()` 用錯 | `.first()` 回單筆, `.all()` 回 `{ results: [] }` |
| `workers_dev: true` 意外暴露 | 沒關閉預設 *.workers.dev | 明確設 `"workers_dev": false` |
| Functions 跑到 timeout | 單次 CPU 超過 `limits.cpu_ms` | 拉長或分散到 Queue |
| Preview URL 沒自動產生 | `preview_urls: false` | 設回 true |

---

## 遷移資訊：Pages → Workers Static Assets

Cloudflare 的未來方向是把 Pages 的能力合併到 Workers（搭配 Static Assets）。Workers Static Assets 有：
- 更快的部署（無 build pipeline 限制）
- 完整 Workers 所有 binding + Smart Placement
- `assets` 設定取代 `pages_build_output_dir`

遷移重點（參考 Cloudflare 官方 guide）：
1. `wrangler.jsonc` 改用 `"main"` + `"assets.directory"` 取代 `"pages_build_output_dir"`
2. Functions 的 file-based routing **不再支援**，必須改寫 `export default { fetch }`
3. `_redirects` / `_headers` 需改為 `assets.html_handling` 或在 Worker 內處理
4. `_middleware.ts` 沒有對應，改用 Worker 中間層邏輯
5. 部署指令從 `wrangler pages deploy` 改為 `wrangler deploy`

詳見：https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/
