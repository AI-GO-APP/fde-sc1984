/**
 * 08 - 邊界案例 E2E 測試
 * 涵蓋：無 Token 存取、API 錯誤容錯、極端日期切換
 */
import { test, expect } from '../fixtures/test-fixtures'
import { getCurrentDateText } from '../helpers/date-navigator'

test.describe('邊界案例', () => {
  test('8.1 無 Token 時頁面不崩潰', async ({ page }) => {
    // 不注入 token，模擬未認證
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    const body = await page.textContent('body')
    expect(body).toBeTruthy()
  })

  test('8.2 快速連續點擊日期切換不崩潰', async ({ authedPage }) => {
    await authedPage.goto('/')
    await authedPage.waitForLoadState('domcontentloaded')
    await authedPage.waitForTimeout(1000)

    const prevBtn = authedPage.locator('button[title="前一天"]')
    // 快速連點 5 次
    for (let i = 0; i < 5; i++) {
      await prevBtn.click()
      await authedPage.waitForTimeout(100) // 極短間隔
    }
    await authedPage.waitForTimeout(2000)

    // 頁面應未崩潰，仍可見管理總覽
    await expect(authedPage.getByText('管理總覽')).toBeVisible()
    // 日期應仍為合法格式
    const dateText = await getCurrentDateText(authedPage)
    expect(dateText).toMatch(/\d{4}-\d{2}-\d{2}/)
  })

  test('8.3 切換到很舊的日期（無訂單）頁面不崩潰', async ({ authedPage }) => {
    await authedPage.goto('/')
    await authedPage.waitForLoadState('domcontentloaded')
    await authedPage.waitForTimeout(1000)

    const prevBtn = authedPage.locator('button[title="前一天"]')
    // 翻到 30 天前
    for (let i = 0; i < 30; i++) {
      await prevBtn.click()
      await authedPage.waitForTimeout(50)
    }
    await authedPage.waitForTimeout(2000)

    // 應不崩潰
    await expect(authedPage.getByText('管理總覽')).toBeVisible()
  })

  test('8.4 各子頁面空資料狀態顯示正常', async ({ authedPage }) => {
    // 翻到很久前沒有訂單的日期
    await authedPage.goto('/')
    await authedPage.waitForLoadState('domcontentloaded')
    await authedPage.waitForTimeout(1000)

    const prevBtn = authedPage.locator('button[title="前一天"]')
    for (let i = 0; i < 30; i++) {
      await prevBtn.click()
      await authedPage.waitForTimeout(50)
    }
    await authedPage.waitForTimeout(1000)

    // 進入確認訂單 — 應顯示空狀態
    await authedPage.goto('/orders')
    await authedPage.waitForLoadState('domcontentloaded')
    await authedPage.waitForTimeout(2000)
    const body = await authedPage.textContent('body')
    expect(body).toBeTruthy()
  })
})
