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

    // 重新載入（使用 domcontentloaded，不等 API 完成）
    await page.reload()
    await page.waitForLoadState('domcontentloaded')

    // 等待 React 渲染完成（最多等 45 秒）
    await page.waitForFunction(
      () => !document.body.textContent?.includes('載入中'),
      { timeout: 45_000 },
    ).catch(() => {
      // 若超時仍在載入中，繼續測試（部分頁面資料可能尚未到位）
    })

    await use(page)
  },
})

export { expect } from '@playwright/test'

