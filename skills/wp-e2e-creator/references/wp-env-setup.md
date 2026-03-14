# wp-env + Playwright 環境設定

## 目錄結構

```
project-root/
├── .wp-env.json
├── tests/
│   └── e2e/
│       ├── package.json            # 獨立 npm（非 pnpm）
│       ├── playwright.config.ts
│       ├── global-setup.ts         # 建立測試資料（各角色使用者）
│       ├── global-teardown.ts      # 還原環境
│       ├── helpers/
│       │   ├── api-client.ts       # REST API CRUD 工具
│       │   ├── frontend-setup.ts   # 角色登入輔助
│       │   ├── lc-bypass.ts        # License check 繞過（若需要）
│       │   └── wc-checkout.ts      # WooCommerce 結帳自動化
│       ├── fixtures/
│       │   └── test-data.ts        # 測試常數（URL、選擇器、名稱）
│       ├── 01-admin/               # Admin SPA 測試
│       ├── 02-frontend/            # 前端頁面測試（各角色情境）
│       └── 03-integration/         # 端對端整合測試（含邊緣案例）
```

---

## Global Setup：建立所有角色的測試使用者

```typescript
// global-setup.ts
async function globalSetup(config: FullConfig) {
  const BASE = config.projects[0].use.baseURL!
  const browser = await chromium.launch()
  const page = await browser.newPage()

  // 管理員登入
  await page.goto(`${BASE}/wp-login.php`)
  await page.fill('#user_login', 'admin')
  await page.fill('#user_pass', 'password')
  await page.click('#wp-submit')
  await page.context().storageState({ path: '.auth/admin.json' })

  const nonce = await extractNonce(page)
  const opts = { request: page.context().request, baseURL: BASE, nonce }

  // 清除舊測試資料
  await cleanTestData(opts)

  // 建立各角色使用者（對應邊緣案例矩陣）
  await wpPost(opts, 'wp/v2/users', {
    username: 'student_purchased', password: 'password', email: 'purchased@test.com',
    roles: ['subscriber'],
  })
  await wpPost(opts, 'wp/v2/users', {
    username: 'student_expired', password: 'password', email: 'expired@test.com',
    roles: ['subscriber'],
  })

  // 建立測試課程
  const course = await wpPost(opts, 'plugin/v1/courses', {
    title: '[E2E] 測試課程',
    status: 'publish',
  })

  // 授予 purchased 使用者存取（有效）
  await wpPost(opts, `plugin/v1/courses/${course.id}/enroll`, {
    user_id: purchasedUserId,
    expire_date: null,  // 無限期
  })

  // 授予 expired 使用者存取（已過期）
  await wpPost(opts, `plugin/v1/courses/${course.id}/enroll`, {
    user_id: expiredUserId,
    expire_date: '2020-01-01T00:00:00',  // 過去的日期
  })

  await browser.close()
}
```

---

## REST API Client

```typescript
// helpers/api-client.ts
type ApiOptions = { request: APIRequestContext; baseURL: string; nonce: string }

export async function wpGet<T>(opts: ApiOptions, endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${opts.baseURL}/wp-json/${endpoint}`)
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await opts.request.get(url.toString(), { headers: { 'X-WP-Nonce': opts.nonce } })
  if (!res.ok()) throw new Error(`GET ${endpoint} → ${res.status()}`)
  return res.json()
}

export async function wpPost<T>(opts: ApiOptions, endpoint: string, data: Record<string, unknown>): Promise<T> {
  const res = await opts.request.post(`${opts.baseURL}/wp-json/${endpoint}`, {
    headers: { 'X-WP-Nonce': opts.nonce },
    data,
  })
  if (!res.ok()) throw new Error(`POST ${endpoint} → ${res.status()}`)
  return res.json()
}

export async function wpDelete(opts: ApiOptions, endpoint: string): Promise<void> {
  const res = await opts.request.delete(`${opts.baseURL}/wp-json/${endpoint}`, {
    headers: { 'X-WP-Nonce': opts.nonce },
  })
  if (!res.ok()) throw new Error(`DELETE ${endpoint} → ${res.status()}`)
}

// 從 wp-admin 提取 nonce
export async function extractNonce(page: Page): Promise<string> {
  await page.goto(`${page.context().browser()?.newContext}/wp-admin/`)
  return page.evaluate(() => (window as any).wpApiSettings?.nonce ?? '')
}
```

---

## License Check Bypass（若有 LC 機制）

```typescript
// helpers/lc-bypass.ts
const PLUGIN_FILE = path.resolve(__dirname, '../../../plugin.php')
const BACKUP_FILE = PLUGIN_FILE + '.e2e-backup'
const MARKER = "/* E2E-LC-BYPASS */"
const INJECTION = `$args['lc'] = false; ${MARKER}`

export function applyLcBypass(): void {
  const content = fs.readFileSync(PLUGIN_FILE, 'utf-8')
  if (content.includes(MARKER)) return
  fs.copyFileSync(PLUGIN_FILE, BACKUP_FILE)
  const needle = "Plugin::instance($args);"
  const idx = content.indexOf(needle)
  if (idx === -1) throw new Error('找不到 LC bypass 注入點')
  fs.writeFileSync(PLUGIN_FILE, content.slice(0, idx) + INJECTION + '\n' + content.slice(idx))
}

export function revertLcBypass(): void {
  if (fs.existsSync(BACKUP_FILE)) {
    fs.copyFileSync(BACKUP_FILE, PLUGIN_FILE)
    fs.unlinkSync(BACKUP_FILE)
  }
}
```
