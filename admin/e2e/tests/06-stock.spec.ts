/**
 * 06 - 日期切換整合測試
 * 驗證：全域日期切換在各頁面間的一致性與快取行為
 */
import { test, expect } from '../fixtures/test-fixtures'
import { getCurrentDateText } from '../helpers/date-navigator'

test.describe('日期切換整合測試', () => {

  test('6.1 Dashboard 切換日期後進入子頁面，日期保持一致', async ({ authedPage }) => {
    await authedPage.goto('/')
    await authedPage.waitForLoadState('domcontentloaded')

    // 往前翻一天
    await authedPage.locator('button[title="前一天"]').click()
    await authedPage.waitForTimeout(1000)
    const dashboardDate = await getCurrentDateText(authedPage)

    // 點進確認訂單
    await authedPage.getByText('確認訂單').first().click()
    await authedPage.waitForLoadState('domcontentloaded')
    await authedPage.waitForTimeout(500)

    const ordersDate = await getCurrentDateText(authedPage)
    expect(ordersDate).toBe(dashboardDate)
  })

  test('6.2 子頁面切換日期後返回 Dashboard，日期保持一致', async ({ authedPage }) => {
    await authedPage.goto('/orders')
    await authedPage.waitForLoadState('domcontentloaded')

    // 往前翻兩天
    await authedPage.locator('button[title="前一天"]').click()
    await authedPage.waitForTimeout(500)
    await authedPage.locator('button[title="前一天"]').click()
    await authedPage.waitForTimeout(1000)
    const ordersDate = await getCurrentDateText(authedPage)

    // 返回 Dashboard
    const backBtn = authedPage.locator('header button').first()
    await backBtn.click()
    await authedPage.waitForLoadState('domcontentloaded')
    await authedPage.waitForTimeout(500)

    const dashboardDate = await getCurrentDateText(authedPage)
    expect(dashboardDate).toBe(ordersDate)
  })

  test('6.3 快取機制：翻到過的日期再翻回來應瞬間呈現', async ({ authedPage }) => {
    await authedPage.goto('/')
    await authedPage.waitForLoadState('domcontentloaded')

    const todayDate = await getCurrentDateText(authedPage)

    // 翻到昨天
    await authedPage.locator('button[title="前一天"]').click()
    await authedPage.waitForTimeout(1500)

    // 翻回今天 — 應從快取秒恢復
    const start = Date.now()
    await authedPage.locator('button[title="後一天"]').click()
    await authedPage.waitForTimeout(300)
    const afterDate = await getCurrentDateText(authedPage)
    const elapsed = Date.now() - start

    expect(afterDate).toBe(todayDate)
    // 快取恢復應在 2 秒內完成（包含渲染時間）
    expect(elapsed).toBeLessThan(2000)
  })
})
