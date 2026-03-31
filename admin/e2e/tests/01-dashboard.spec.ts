/**
 * 01 - Dashboard E2E 測試（適配單日訂單制 + PageHeader 日期選擇器）
 * 涵蓋：載入、四步驟卡片、日期切換、導航
 */
import { test, expect } from '../fixtures/test-fixtures'
import { getCurrentDateText } from '../helpers/date-navigator'

test.describe('Dashboard — 管理總覽', () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto('/')
    await authedPage.waitForLoadState('domcontentloaded')
  })

  // --- 頁面載入 ---

  test('1.1 載入完成後顯示管理總覽', async ({ authedPage }) => {
    await expect(authedPage.getByText('管理總覽')).toBeVisible()
  })

  test('1.2 PageHeader 顯示日期選擇器（YYYY-MM-DD 格式）', async ({ authedPage }) => {
    const dateText = await getCurrentDateText(authedPage)
    expect(dateText).toMatch(/\d{4}-\d{2}-\d{2}/)
  })

  test('1.3 四階段流程卡片全部呈現', async ({ authedPage }) => {
    const labels = ['確認訂單', '採購管理', '出庫分配', '出貨配送']
    for (const label of labels) {
      await expect(authedPage.getByText(label).first()).toBeVisible()
    }
  })

  // --- 日期切換 ---

  test('1.4 點擊「前一天」箭頭切換日期', async ({ authedPage }) => {
    const dateBefore = await getCurrentDateText(authedPage)
    const prevBtn = authedPage.locator('button[title="前一天"]')
    await prevBtn.click()
    await authedPage.waitForTimeout(1000)
    const dateAfter = await getCurrentDateText(authedPage)
    expect(dateAfter).not.toBe(dateBefore)
  })

  test('1.5 點擊「後一天」箭頭切換日期', async ({ authedPage }) => {
    // 先往前一天
    await authedPage.locator('button[title="前一天"]').click()
    await authedPage.waitForTimeout(500)
    const dateBefore = await getCurrentDateText(authedPage)
    // 再往後一天
    await authedPage.locator('button[title="後一天"]').click()
    await authedPage.waitForTimeout(1000)
    const dateAfter = await getCurrentDateText(authedPage)
    expect(dateAfter).not.toBe(dateBefore)
  })

  // --- 導航 ---

  test('1.6 點擊確認訂單卡片跳轉 /orders', async ({ authedPage }) => {
    await authedPage.getByText('確認訂單').first().click()
    await expect(authedPage).toHaveURL(/\/orders/)
  })

  test('1.7 點擊採購管理卡片跳轉 /purchase', async ({ authedPage }) => {
    await authedPage.getByText('採購管理').first().click()
    await expect(authedPage).toHaveURL(/\/purchase/)
  })

  test('1.8 點擊出庫分配卡片跳轉 /allocation', async ({ authedPage }) => {
    await authedPage.getByText('出庫分配').first().click()
    await expect(authedPage).toHaveURL(/\/allocation/)
  })

  test('1.9 點擊出貨配送卡片跳轉 /delivery', async ({ authedPage }) => {
    await authedPage.getByText('出貨配送').first().click()
    await expect(authedPage).toHaveURL(/\/delivery/)
  })

  // --- 邊界案例 ---

  test('1.10 未知路由重導至 /', async ({ authedPage }) => {
    await authedPage.goto('/totally-fake-route-12345')
    await expect(authedPage).toHaveURL('/')
  })
})
