/**
 * 共用 Fixture：在每次測試前自動將 Token 注入 localStorage
 */
import { test as base, type Page } from '@playwright/test'
import { getToken } from '../helpers/auth'

// 自訂 fixture，自動將 admin_token 注入瀏覽器
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    const token = getToken()

    // 先前往首頁以建立 origin，再注入 token
    await page.goto('/')
    await page.evaluate((t) => {
      localStorage.setItem('admin_token', t)
    }, token)

    // 重新載入以讓 interceptor 讀取到 token
    await page.reload()
    await page.waitForLoadState('networkidle')

    await use(page)
  },
})

export { expect } from '@playwright/test'
