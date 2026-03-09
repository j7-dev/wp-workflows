---
name: wp-e2e-playwright
description: WordPress plugin E2E testing with Playwright + wp-env. Covers LC bypass, WooCommerce checkout, REST API helpers, global setup/teardown, CI workflow, and the phased approach (Admin SPA → Frontend → Integration). Use when building E2E tests for any WordPress/WooCommerce plugin.
---

# WordPress Plugin E2E Testing with Playwright

Battle-tested patterns for building comprehensive E2E test suites for WordPress plugins using Playwright and `@wordpress/env`.

## When to Use This Skill

- Building E2E tests for a WordPress or WooCommerce plugin
- Setting up `wp-env` + Playwright from scratch
- Implementing license-check (LC) bypass for testing
- Creating WooCommerce checkout flow tests
- Setting up GitHub Actions CI for WordPress E2E
- Debugging Docker + Windows PATH issues

---

## Architecture Overview

```
project-root/
├── .wp-env.json                    # WordPress environment config
├── plugin.php                      # Plugin entry (LC bypass target)
├── plugin.php.e2e-backup           # Auto-created backup (gitignored)
├── tests/
│   └── e2e/
│       ├── package.json            # Isolated npm deps (NOT pnpm)
│       ├── playwright.config.ts    # 3 projects: admin, frontend, integration
│       ├── global-setup.ts         # LC bypass + login + REST API data prep
│       ├── global-teardown.ts      # Restore plugin.php from backup
│       ├── helpers/
│       │   ├── lc-bypass.ts        # plugin.php injection/revert
│       │   ├── admin-page.ts       # Admin SPA HashRouter navigation
│       │   ├── api-client.ts       # REST API CRUD (WP + WC + plugin)
│       │   ├── frontend-setup.ts   # Login-as-user + test data
│       │   └── wc-checkout.ts      # WooCommerce checkout automation
│       ├── fixtures/
│       │   └── test-data.ts        # Constants (names, selectors, URLs)
│       ├── 01-admin/               # Admin SPA tests
│       ├── 02-frontend/            # PHP template tests
│       └── 03-integration/         # Cross-module flow tests
└── .github/workflows/ci.yml        # CI with E2E job
```

---

## Critical Design Decisions

### 1. Isolated npm (NOT pnpm) for E2E Dependencies

**Problem:** Monorepo `workspace:*` dependencies fail in CI standalone checkout. Windows NTFS junctions cause "untrusted mount point" errors with pnpm.

**Solution:** `tests/e2e/package.json` uses npm, completely independent from monorepo:

```json
{
  "private": true,
  "type": "module",
  "dependencies": {
    "@playwright/test": "^1.52.0",
    "@wordpress/e2e-test-utils-playwright": "^1.18.0",
    "@wordpress/env": "^11.1.0"
  }
}
```

### 2. wp-env Must Run From Project Root

`wp-env` reads `.wp-env.json` from CWD. Always run from project root:

```bash
# ✅ Correct — from project root
./tests/e2e/node_modules/.bin/wp-env start

# ❌ Wrong — from tests/e2e/
npx wp-env start  # Can't find .wp-env.json
```

### 3. No WP CLI in Tests — Pure REST API

**Problem:** Docker is not in Node.js `PATH` on Windows. `execSync('npx wp-env run cli ...')` fails.

**Solution:** ALL data setup uses WordPress REST API in `global-setup.ts`:

```typescript
// ✅ Use REST API
const response = await request.get(`${BASE}/wp-json/wp/v2/posts`);

// ❌ Never use execSync in tests
execSync('npx wp-env run cli wp post list');  // FAILS on Windows
```

### 4. Workers Must Be 1

WordPress shares a single database session. Parallel workers cause race conditions:

```typescript
export default defineConfig({
  workers: 1,
  fullyParallel: false,
});
```

---

## LC Bypass Pattern

For plugins with license checks that prevent testing:

### lc-bypass.ts

```typescript
import fs from 'fs'
import path from 'path'

const PLUGIN_FILE = path.resolve(__dirname, '../../../plugin.php')
const BACKUP_FILE = PLUGIN_FILE + '.e2e-backup'
const MARKER = "/* E2E-LC-BYPASS */"
const INJECTION = `$args['lc'] = false; ${MARKER}`

export function applyLcBypass(): void {
  const content = fs.readFileSync(PLUGIN_FILE, 'utf-8')
  if (content.includes(MARKER)) return // Already applied

  fs.copyFileSync(PLUGIN_FILE, BACKUP_FILE)

  // Find the activation hook pattern and inject before it
  const needle = "Plugin::instance(\$args);"
  const idx = content.indexOf(needle)
  if (idx === -1) throw new Error('Cannot find injection point')

  const modified = content.slice(0, idx) + INJECTION + '\n' + content.slice(idx)
  fs.writeFileSync(PLUGIN_FILE, modified, 'utf-8')
}

export function revertLcBypass(): void {
  if (fs.existsSync(BACKUP_FILE)) {
    fs.copyFileSync(BACKUP_FILE, PLUGIN_FILE)
    fs.unlinkSync(BACKUP_FILE)
  }
}
```

### .gitignore entries

```gitignore
plugin.php.e2e-backup
tests/e2e/.auth/
tests/e2e/test-results/
tests/e2e/playwright-report/
```

---

## Global Setup Pattern

```typescript
// global-setup.ts
import { chromium, FullConfig } from '@playwright/test'
import { applyLcBypass } from './helpers/lc-bypass'

async function globalSetup(config: FullConfig) {
  const BASE = config.projects[0].use.baseURL!

  // 1. Apply LC bypass
  applyLcBypass()

  // 2. Login and save storage state
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto(`${BASE}/wp-login.php`)
  await page.fill('#user_login', 'admin')
  await page.fill('#user_pass', 'password')
  await page.click('#wp-submit')
  await page.waitForURL('**/wp-admin/**')
  await page.context().storageState({ path: '.auth/admin.json' })

  // 3. Flush rewrite rules (visit Permalinks page)
  await page.goto(`${BASE}/wp-admin/options-permalink.php`)
  await page.click('#submit')
  await page.waitForLoadState('networkidle')

  // 4. Clean old test data via REST API
  const request = await page.context().request
  // Delete old courses, chapters, users with E2E prefix...

  // 5. Create fresh test data
  // Use REST API to create courses, chapters, users...

  await browser.close()
}

export default globalSetup
```

---

## REST API Client Pattern

```typescript
// helpers/api-client.ts
import { APIRequestContext } from '@playwright/test'

type ApiOptions = {
  request: APIRequestContext
  baseURL: string
  nonce: string
}

export async function wpGet<T>(
  opts: ApiOptions, endpoint: string, params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${opts.baseURL}/wp-json/${endpoint}`)
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await opts.request.get(url.toString(), {
    headers: { 'X-WP-Nonce': opts.nonce },
  })
  if (!res.ok()) throw new Error(`GET ${endpoint} → ${res.status()}`)
  return res.json()
}

export async function wpPost<T>(
  opts: ApiOptions, endpoint: string, data: Record<string, unknown>
): Promise<T> {
  const res = await opts.request.post(`${opts.baseURL}/wp-json/${endpoint}`, {
    headers: { 'X-WP-Nonce': opts.nonce },
    data,
  })
  if (!res.ok()) throw new Error(`POST ${endpoint} → ${res.status()}`)
  return res.json()
}
```

### Nonce Extraction

```typescript
// Extract nonce from any wp-admin page
async function extractNonce(page: Page): Promise<string> {
  await page.goto(`${BASE}/wp-admin/`)
  const nonce = await page.evaluate(() => {
    return (window as any).wpApiSettings?.nonce
      || document.querySelector('meta[name="wp-nonce"]')?.getAttribute('content')
      || ''
  })
  if (!nonce) throw new Error('Cannot extract WP nonce')
  return nonce
}
```

---

## WooCommerce Checkout Helper

```typescript
// helpers/wc-checkout.ts

export async function addToCartAndCheckout(page: Page, productUrl: string) {
  // Navigate to product page
  await page.goto(productUrl)
  await page.click('button[name="add-to-cart"], .single_add_to_cart_button')
  await page.waitForURL('**/cart/**')

  // Go to checkout
  await page.goto(`${BASE}/checkout/`)

  // Fill billing (minimal for BACS)
  await page.fill('#billing_first_name', 'Test')
  await page.fill('#billing_last_name', 'User')
  await page.fill('#billing_email', 'test@example.com')
  await page.fill('#billing_phone', '0912345678')

  // Select BACS
  await page.click('#payment_method_bacs')
  await page.click('#place_order')

  // Wait for order-received page
  await page.waitForURL('**/order-received/**')

  // Extract order number from URL (WC 9.x safe)
  const url = page.url()
  const match = url.match(/order-received\/(\d+)/)
  return match ? parseInt(match[1]) : null
}

// Complete order via REST API (admin marks as completed)
export async function completeOrder(opts: ApiOptions, orderId: number) {
  return wpPost(opts, `wc/v3/orders/${orderId}`, {
    status: 'completed',
  })
}
```

---

## Playwright Config (3 Projects)

```typescript
export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,

  timeout: 30_000,
  expect: { timeout: 5_000 },

  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  use: {
    baseURL: process.env.WP_BASE_URL || 'http://localhost:8889',
    storageState: '.auth/admin.json',
    locale: 'zh-TW',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'admin',
      testDir: './01-admin',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'frontend',
      testDir: './02-frontend',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'integration',
      testDir: './03-integration',
      timeout: 120_000,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
```

---

## Phased Approach

### Phase 1: Admin SPA Tests

Test React admin panel (HashRouter `/#/route`):

```typescript
// Navigate to admin SPA page
async function gotoAdminPage(page: Page, hash: string) {
  await page.goto(`/wp-admin/admin.php?page=power-course#${hash}`)
  await page.waitForSelector('.ant-pro-table, .ant-card, .ant-form', {
    timeout: 15_000,
  })
}
```

**What to test:**
- Page loads without console errors
- ProTable renders with data rows
- CRUD operations (create, edit, delete)
- Tab navigation and form submission
- Settings page save/load

### Phase 2: Frontend Template Tests

Test PHP-rendered pages with logged-in users:

```typescript
// Login as specific user role
async function loginAs(page: Page, username: string, password: string) {
  await page.goto('/wp-login.php')
  await page.fill('#user_login', username)
  await page.fill('#user_pass', password)
  await page.click('#wp-submit')
  await page.waitForURL('**/wp-admin/**')
}
```

**What to test:**
- Course product page rendering (pricing, teacher info, chapters)
- Classroom page (video player, chapter list, progress)
- Access denied pages (not purchased, expired, not launched)
- My Account course list

### Phase 3: Integration Tests

End-to-end flows spanning multiple modules:

**What to test:**
- Purchase → access grant → classroom → progress tracking
- Expire date types (unlimited, timestamp, subscription)
- Access control (grant/revoke/expire)
- Role permissions (admin vs subscriber vs guest)
- Plugin dependency (all plugins coexist)
- PHP error scanning (no fatal errors on any page)

---

## GitHub Actions CI Workflow

```yaml
e2e:
  runs-on: ubuntu-latest
  timeout-minutes: 60
  steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install E2E dependencies
      run: npm ci
      working-directory: tests/e2e

    - name: Cache Playwright browsers
      uses: actions/cache@v4
      with:
        path: ~/.cache/ms-playwright
        key: pw-${{ runner.os }}-${{ hashFiles('tests/e2e/package-lock.json') }}

    - name: Install Playwright chromium
      run: npx playwright install --with-deps chromium
      working-directory: tests/e2e

    - name: Cache wp-env
      uses: actions/cache@v4
      with:
        path: ~/.wp-env
        key: wp-env-${{ runner.os }}-${{ hashFiles('.wp-env.json') }}

    - name: Start wp-env
      run: ./tests/e2e/node_modules/.bin/wp-env start

    - name: Run E2E tests
      run: npx playwright test
      working-directory: tests/e2e

    - name: Upload artifacts
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: playwright-report
        path: |
          tests/e2e/playwright-report/
          tests/e2e/test-results/

    - name: Restore plugin.php
      if: always()
      run: |
        if [ -f plugin.php.e2e-backup ]; then
          cp plugin.php.e2e-backup plugin.php
        fi

    - name: Stop wp-env
      if: always()
      run: ./tests/e2e/node_modules/.bin/wp-env stop
```

---

## Stale Data Cleanup Pattern

WordPress keeps deleted posts in trash. Old chapters with same slugs get `-2` suffix. **Always force-delete in setup:**

```typescript
// Clean all custom post types before creating new test data
async function cleanOldChapters(request: APIRequestContext, nonce: string, base: string) {
  for (const status of ['publish', 'draft', 'trash', 'pending', 'private']) {
    const posts = await request.get(
      `${base}/wp-json/wp/v2/pc_chapter?status=${status}&per_page=100`,
      { headers: { 'X-WP-Nonce': nonce } }
    )
    const items = await posts.json()
    for (const p of items) {
      await request.delete(
        `${base}/wp-json/wp/v2/pc_chapter/${p.id}?force=true`,
        { headers: { 'X-WP-Nonce': nonce } }
      )
    }
  }
}
```

---

## Windows-Specific Issues

### Docker PATH

Windows Docker Desktop doesn't add itself to system PATH. Set in every PowerShell session:

```powershell
$env:PATH = "C:\Program Files\Docker\Docker\resources\bin;" + $env:PATH
```

### PowerShell Syntax

Use semicolons, not `&&`, when chaining commands with `$env:` variables:

```powershell
# ✅ Correct
$env:PATH = "..."; cd project; npx wp-env start

# ❌ Wrong — causes ParserError
$env:PATH = "..." && cd project
```

### pnpm NTFS Junctions

All pnpm junctions on Windows return "untrusted mount point". Use npm for E2E deps.

---

## Troubleshooting Checklist

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Cannot connect to Docker` | Docker not running | Start Docker Desktop |
| `wp-env: command not found` | wp-env not installed | `npm install` in `tests/e2e/` |
| `spawn UNKNOWN` in global-setup | Using execSync with Docker | Switch to REST API calls |
| Chapter URLs return 404 | Rewrite rules not flushed | Visit Permalinks page in setup |
| `parent_course_id` missing | Old chapters from previous run | Force-delete all pc_chapter posts |
| Order number extraction fails | WC 9.x changed DOM | Extract from URL, not DOM |
| DaisyUI modal button invisible | `opacity-0` CSS class | Use `page.keyboard.press('Escape')` |
| Test flaky on CI | Missing `waitForLoadState` | Add `networkidle` or selector waits |

---

## Best Practices Summary

1. **Isolated deps** — Use npm in `tests/e2e/`, never mix with monorepo pnpm
2. **REST API for data** — Never use WP CLI or execSync in test code
3. **Force cleanup** — Delete ALL statuses (publish, draft, trash) before creating
4. **URL-based extraction** — Extract order numbers from URL, not DOM
5. **LC bypass safety** — Backup, inject, and restore with `if: always()` in CI
6. **3-project split** — Admin (30s) / Frontend (30s) / Integration (120s)
7. **Single worker** — WordPress can't handle parallel sessions
8. **Nonce from wp-admin** — Extract `wpApiSettings.nonce` after admin login
9. **Rewrite flush** — Always visit Permalinks page in global setup
10. **Idempotent tests** — Each test creates its own data, cleans up after
