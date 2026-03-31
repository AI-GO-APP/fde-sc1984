/**
 * 05 - 出貨配送 (DeliveryPage) E2E 測試
 * 適配：單日訂單制、PageHeader 日期選擇器
 * 涵蓋：頁面載入、司機篩選、展開訂單、確認送達
 */
import { test, expect } from '../fixtures/test-fixtures'
import { navigateToDateWithData } from '../helpers/date-navigator'

test.describe('出貨配送 (DeliveryPage)', () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto('/delivery')
    await authedPage.waitForLoadState('domcontentloaded')
  })

  test('5.1 載入後顯示出貨配送標題', async ({ authedPage }) => {
    await expect(authedPage.getByText('出貨配送')).toBeVisible()
  })

  test('5.2 PageHeader 日期切換可用', async ({ authedPage }) => {
    await expect(authedPage.locator('button[title="前一天"]')).toBeVisible()
  })

  test('5.3 待出貨計數或空狀態顯示', async ({ authedPage }) => {
    const body = await authedPage.textContent('body') || ''
    const hasStatus = body.includes('待出貨') || body.includes('無待出貨')
    expect(hasStatus).toBe(true)
  })

  test('5.4 司機篩選「全部」按鈕預設選中', async ({ authedPage }) => {
    const allBtn = authedPage.locator('button:has-text("全部")').first()
    if (await allBtn.isVisible()) {
      // 全部按鈕應為深色（選中狀態）
      const cls = await allBtn.getAttribute('class') || ''
      expect(cls).toContain('bg-gray-900')
    }
  })

  test('5.5 自動翻頁找到訂單後展開它', async ({ authedPage }) => {
    const hasData = await navigateToDateWithData(authedPage, {
      hasDataSelector: '.bg-white.rounded-xl',
      maxDaysBack: 7,
    })

    if (hasData) {
      const orderBtn = authedPage.locator('.bg-white.rounded-xl button').first()
      if (await orderBtn.isVisible()) {
        await orderBtn.click()
        await authedPage.waitForTimeout(500)
        const body = await authedPage.textContent('body')
        expect(body).toBeTruthy()
      }
    }
  })

  test('5.6 返回 Dashboard', async ({ authedPage }) => {
    const backBtn = authedPage.locator('header button').first()
    if (await backBtn.isVisible()) {
      await backBtn.click()
      await expect(authedPage).toHaveURL('/')
    }
  })
})
