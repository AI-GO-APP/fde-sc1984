/**
 * 07 - 全站導航 E2E 測試
 * 適配：新路由 (/orders, /purchase, /allocation, /delivery)
 */
import { test, expect } from '../fixtures/test-fixtures'

test.describe('全站導航', () => {
  test('7.1 每頁返回按鈕均回到 Dashboard', async ({ authedPage }) => {
    const pages = ['/orders', '/purchase', '/allocation', '/delivery']
    for (const path of pages) {
      await authedPage.goto(path)
      await authedPage.waitForLoadState('domcontentloaded')
      // 點擊返回（BackButton 是 header 內第一個 button）
      const backBtn = authedPage.locator('header button').first()
      if (await backBtn.isVisible()) {
        await backBtn.click()
        await expect(authedPage).toHaveURL('/')
      }
    }
  })

  test('7.2 未知路由重導至 /', async ({ authedPage }) => {
    await authedPage.goto('/totally-fake-route-12345')
    await expect(authedPage).toHaveURL('/')
  })

  test('7.3 快速切換各頁面不崩潰', async ({ authedPage }) => {
    const routes = ['/', '/orders', '/purchase', '/allocation', '/delivery', '/']
    for (const route of routes) {
      await authedPage.goto(route)
      await authedPage.waitForLoadState('domcontentloaded')
    }
    // 最後應在 Dashboard
    await expect(authedPage.getByText('管理總覽')).toBeVisible()
  })
})
