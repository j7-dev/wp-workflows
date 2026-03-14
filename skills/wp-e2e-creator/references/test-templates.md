# E2E 測試程式碼模板

## 使用者情境測試模板

```typescript
// tests/e2e/02-frontend/course-access.spec.ts
import { test, expect } from '@playwright/test'
import { loginAs } from '../helpers/frontend-setup'
import { COURSES } from '../fixtures/test-data'

const accessScenarios = [
  {
    role: 'guest',
    setup: async (page) => { /* 不登入 */ },
    expected: 'redirect-to-login',
  },
  {
    role: 'subscriber-not-purchased',
    setup: async (page) => loginAs(page, 'subscriber', 'password'),
    expected: 'show-purchase-prompt',
  },
  {
    role: 'purchased-student',
    setup: async (page) => loginAs(page, 'student_purchased', 'password'),
    expected: 'full-access',
  },
  {
    role: 'expired-student',
    setup: async (page) => loginAs(page, 'student_expired', 'password'),
    expected: 'show-expired-message',
  },
]

for (const scenario of accessScenarios) {
  test(`課程教室存取 — ${scenario.role}`, async ({ page }) => {
    await scenario.setup(page)
    await page.goto(COURSES.PUBLISHED.classroomUrl)

    switch (scenario.expected) {
      case 'redirect-to-login':
        await expect(page).toHaveURL(/wp-login\.php/)
        break
      case 'show-purchase-prompt':
        await expect(page.locator('[data-testid="purchase-prompt"]')).toBeVisible()
        break
      case 'full-access':
        await expect(page.locator('[data-testid="video-player"]')).toBeVisible()
        break
      case 'show-expired-message':
        await expect(page.locator('[data-testid="expired-notice"]')).toBeVisible()
        break
    }
  })
}
```

---

## 邊緣案例測試模板

```typescript
// tests/e2e/03-integration/edge-cases.spec.ts
import { test, expect } from '@playwright/test'
import { wpPost, wpDelete } from '../helpers/api-client'

test.describe('邊緣案例：課程存取控制', () => {

  test('商品刪除後已購買使用者仍保有存取權', async ({ page, request }) => {
    // Arrange：建立課程、購買、刪除 WC 商品
    const courseId = await createTestCourse(request)
    const orderId  = await purchaseCourse(page, courseId)
    await wpDelete(request, `wc/v3/products/${productId}?force=true`)

    // Act：已購買使用者嘗試存取教室
    await loginAs(page, 'student_purchased', 'password')
    await page.goto(`/classroom/${courseId}/`)

    // Assert：仍有存取權（存取記錄不依賴商品存在）
    await expect(page.locator('[data-testid="video-player"]')).toBeVisible()
  })

  test('同時開啟兩個結帳頁面不會重複授予存取權', async ({ browser }) => {
    // 開兩個 browser context 模擬兩個 tab
    const ctx1 = await browser.newContext()
    const ctx2 = await browser.newContext()
    const page1 = await ctx1.newPage()
    const page2 = await ctx2.newPage()

    // 兩個 tab 同時結帳
    await Promise.all([
      completePurchase(page1, COURSES.PUBLISHED.productUrl),
      completePurchase(page2, COURSES.PUBLISHED.productUrl),
    ])

    // Assert：使用者的存取記錄只有一筆（冪等）
    const accessCount = await getAccessCount(page1, COURSES.PUBLISHED.id)
    expect(accessCount).toBe(1)

    await ctx1.close()
    await ctx2.close()
  })

  test('存取到期後立即刷新頁面', async ({ page }) => {
    // Arrange：建立即將到期（1 秒後）的存取記錄
    const expiry = new Date(Date.now() + 1000).toISOString()
    await setAccessExpiry(page, studentId, courseId, expiry)

    // Act：等待到期後刷新
    await loginAs(page, 'student_purchased', 'password')
    await page.goto(`/classroom/${courseId}/`)
    await expect(page.locator('[data-testid="video-player"]')).toBeVisible()

    await page.waitForTimeout(2000)  // 等待到期
    await page.reload()

    // Assert：到期後被拒絕
    await expect(page.locator('[data-testid="expired-notice"]')).toBeVisible()
  })

})
```

---

## API 邊界測試模板

```typescript
// tests/e2e/03-integration/api-edge-cases.spec.ts
test.describe('REST API 邊緣案例', () => {

  test('未授權請求應回傳 401', async ({ request }) => {
    const res = await request.get('/wp-json/plugin/v1/courses', {
      headers: { /* 不帶 nonce */ }
    })
    expect(res.status()).toBe(401)
  })

  test('存取不存在的課程應回傳 404', async ({ request, page }) => {
    await loginAs(page, 'admin', 'password')
    const nonce = await extractNonce(page)

    const res = await request.get('/wp-json/plugin/v1/courses/99999999', {
      headers: { 'X-WP-Nonce': nonce }
    })
    expect(res.status()).toBe(404)
  })

  test('SQL injection 防護', async ({ request, page }) => {
    await loginAs(page, 'admin', 'password')
    const nonce = await extractNonce(page)

    const res = await request.get("/wp-json/plugin/v1/courses?id=1' OR '1'='1", {
      headers: { 'X-WP-Nonce': nonce }
    })
    // 應回傳正常錯誤，不應洩漏資料
    expect(res.status()).toBeOneOf([400, 404])
    const body = await res.text()
    expect(body).not.toContain('wp_')  // 不洩漏資料表名稱
  })

})
```
