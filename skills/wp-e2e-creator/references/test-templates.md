# E2E 測試程式碼模板（核心業務流程）

> ⚠️ **本檔案僅提供「核心業務流程」測試範例。**
> 邊緣案例、權限矩陣、API 邊界測試屬於整合測試範疇，請改用 `wp-integration-testing` skill。

E2E 測試只覆蓋兩個分組：

- 🔥 **冒煙測試（`@smoke`）** — 1 分鐘內，最關鍵路徑
- ✅ **快樂路徑（`@happy`）** — 標準使用者完整流程

---

## 冒煙測試模板

冒煙測試只驗證「環境沒炸」與「最關鍵的價值交付」。每個 spec 的冒煙測試應該在數秒內完成。

```typescript
// tests/e2e/smoke/smoke.spec.ts
import { test, expect } from '@playwright/test'

test.setTimeout(60_000)

test.describe('🔥 冒煙測試', () => {

  test('@smoke 首頁可以正常載入', async ({ page }) => {
    await page.goto('/', { timeout: 30_000 })
    await expect(page).toHaveTitle(/.+/)
  })

  test('@smoke wp-admin 登入頁面可以正常載入', async ({ page }) => {
    await page.goto('/wp-login.php', { timeout: 30_000 })
    await expect(page.locator('#loginform')).toBeVisible({ timeout: 10_000 })
  })

  test('@smoke 已購買使用者可以進入課程教室', async ({ page }) => {
    await loginAs(page, 'student_purchased', 'password')
    await page.goto('/classroom/course-1/', { timeout: 30_000 })
    await expect(page.locator('[data-testid="video-player"]')).toBeVisible({ timeout: 10_000 })
  })

})
```

---

## 快樂路徑模板（核心業務流程）

每個核心業務流程一個 spec 檔案，從使用者進入到拿到價值的最短路徑。

```typescript
// tests/e2e/happy/course-purchase.spec.ts
import { test, expect } from '@playwright/test'
import { loginAs } from '../helpers/frontend-setup'
import { COURSES } from '../fixtures/test-data'

test.setTimeout(60_000)

test.describe('✅ 課程購買快樂路徑', () => {

  test('@happy 使用者可以完成課程購買並進入教室', async ({ page }) => {
    // Arrange：以一般使用者身份登入
    await loginAs(page, 'student', 'password')

    // Act 1：瀏覽課程商品頁
    await page.goto(COURSES.PUBLISHED.productUrl, { timeout: 30_000 })
    await expect(page.locator('h1.product_title')).toBeVisible({ timeout: 10_000 })

    // Act 2：加入購物車
    await page.locator('button.single_add_to_cart_button').click()
    await expect(page.locator('.woocommerce-message')).toBeVisible({ timeout: 10_000 })

    // Act 3：前往結帳並完成付款
    await page.goto('/checkout/', { timeout: 30_000 })
    await page.locator('#place_order').click()
    await expect(page).toHaveURL(/order-received/, { timeout: 30_000 })

    // Assert：使用者可以進入課程教室並看到影片播放器
    await page.goto(COURSES.PUBLISHED.classroomUrl, { timeout: 30_000 })
    await expect(page.locator('[data-testid="video-player"]')).toBeVisible({ timeout: 10_000 })
  })

})
```

---

## 多步驟流程模板（含 API 前置資料準備）

當核心業務流程需要複雜的前置資料（課程、訂單、會員等），用 REST API 建立，避免在 UI 上點來點去浪費時間。

```typescript
// tests/e2e/happy/course-completion.spec.ts
import { test, expect, Browser } from '@playwright/test'
import { loginAs } from '../helpers/frontend-setup'
import { wpPost, wpDelete } from '../helpers/api-client'

test.setTimeout(60_000)

async function setupApiWithLongTimeout(browser: Browser) {
  const context = await browser.newContext({
    storageState: 'tests/e2e/.auth/admin.json',
    ignoreHTTPSErrors: true,
    serviceWorkers: 'block',
  })
  context.setDefaultTimeout(60_000)
  return context.request
}

test.describe('✅ 課程學習完成快樂路徑', () => {
  let courseId: number
  let chapterId: number

  test.beforeAll(async ({ browser }) => {
    // 用 REST API 建立測試資料（不依賴 UI）
    const api = await setupApiWithLongTimeout(browser)
    const course = await wpPost(api, 'wp/v2/course', { title: '測試課程', status: 'publish' })
    courseId = course.id
    const chapter = await wpPost(api, 'wp/v2/chapter', {
      title: '第一章',
      status: 'publish',
      parent: courseId,
    })
    chapterId = chapter.id
  })

  test.afterAll(async ({ browser }) => {
    const api = await setupApiWithLongTimeout(browser)
    await wpDelete(api, `wp/v2/chapter/${chapterId}?force=true`)
    await wpDelete(api, `wp/v2/course/${courseId}?force=true`)
  })

  test('@happy 已購買使用者完成章節後可以看到進度更新', async ({ page }) => {
    await loginAs(page, 'student_purchased', 'password')

    // 進入章節頁
    await page.goto(`/classroom/${courseId}/chapter/${chapterId}/`, { timeout: 30_000 })
    await expect(page.locator('[data-testid="chapter-content"]')).toBeVisible({ timeout: 10_000 })

    // 標記章節完成
    await page.locator('[data-testid="mark-complete"]').click()
    await expect(page.locator('[data-testid="completed-badge"]')).toBeVisible({ timeout: 10_000 })

    // 回到課程頁，確認進度顯示為 100%
    await page.goto(`/classroom/${courseId}/`, { timeout: 30_000 })
    await expect(page.locator('[data-testid="progress-bar"]')).toContainText('100%')
  })

})
```

---

## 寫測試時的禁區

下列情境**絕對不要**寫進 E2E spec，請改寫整合測試：

```typescript
// ❌ 禁止：權限矩陣覆蓋
for (const role of ['guest', 'subscriber', 'admin', 'expired']) {
  test(`${role} 存取課程`, ...)
}

// ❌ 禁止：邊界值與特殊輸入
test('課程標題包含 XSS 字串', ...)
test('課程價格為 0', ...)
test('Unicode 與 Emoji 標題', ...)

// ❌ 禁止：API 邊界
test('未授權請求應回傳 401', ...)
test('SQL injection 防護', ...)

// ❌ 禁止：並發與競態條件
test('兩個 tab 同時結帳', ...)
test('到期前後刷新頁面', ...)
```

> 這些情境的測試價值很高，但成本應該由整合測試承擔。E2E 跑這些東西只會慢、不穩、難維護。
