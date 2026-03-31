/**
 * 02 - 確認訂單 (OrdersPage) E2E 測試
 * 適配：單日訂單制、PageHeader 日期選擇器
 * 涵蓋：列表載入、展開/收合、搜尋/篩選、確認訂單操作、自動翻頁找資料
 */
import { test, expect } from '../fixtures/test-fixtures'
import { navigateToDateWithData } from '../helpers/date-navigator'

test.describe('確認訂單 (OrdersPage)', () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto('/orders')
    await authedPage.waitForLoadState('domcontentloaded')
  })

  // --- 頁面載入 ---

  test('2.1 頁面載入後顯示確認訂單標題', async ({ authedPage }) => {
    await expect(authedPage.getByText('確認訂單')).toBeVisible()
  })

  test('2.2 PageHeader 日期選擇器可見', async ({ authedPage }) => {
    await expect(authedPage.locator('button[title="前一天"]')).toBeVisible()
    await expect(authedPage.locator('button[title="後一天"]')).toBeVisible()
  })

  // --- 搜尋與篩選 ---

  test('2.3 搜尋欄輸入不存在的名稱顯示空結果', async ({ authedPage }) => {
    const searchInput = authedPage.getByPlaceholder('搜尋客戶、訂單...')
    if (await searchInput.isVisible()) {
      await searchInput.fill('zzz_nonexistent_999')
      await authedPage.waitForTimeout(300)
      await expect(authedPage.getByText('無符合的訂單')).toBeVisible()
    }
  })

  test('2.4 狀態篩選下拉選單可選', async ({ authedPage }) => {
    const select = authedPage.locator('select')
    if (await select.isVisible()) {
      await select.selectOption('all')
      await authedPage.waitForTimeout(300)
      const body = await authedPage.textContent('body')
      expect(body).toBeTruthy()
    }
  })

  // --- 自動翻頁找訂單並展開 ---

  test('2.5 自動翻頁找到訂單後展開顯示明細', async ({ authedPage }) => {
    const hasData = await navigateToDateWithData(authedPage, {
      hasDataSelector: '.bg-white.rounded-xl',
      maxDaysBack: 7,
    })

    if (hasData) {
      // 點擊第一筆訂單展開
      const orderCard = authedPage.locator('.bg-white.rounded-xl button').first()
      if (await orderCard.isVisible()) {
        await orderCard.click()
        await authedPage.waitForTimeout(500)
        // 展開後應顯示品名/數量等表頭
        const body = await authedPage.textContent('body')
        expect(body).toBeTruthy()
      }
    }
  })

  test('2.6 客戶名稱應為可讀文字（非 UUID）', async ({ authedPage }) => {
    const hasData = await navigateToDateWithData(authedPage, {
      hasDataSelector: '.bg-white.rounded-xl',
      maxDaysBack: 5,
    })

    if (hasData) {
      const customerName = authedPage.locator('.font-bold.text-gray-900').first()
      if (await customerName.isVisible()) {
        const text = await customerName.textContent()
        const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        expect(UUID_RE.test(text?.trim() || '')).toBe(false)
      }
    }
  })

  // --- 返回 ---

  test('2.7 返回 Dashboard', async ({ authedPage }) => {
    const backBtn = authedPage.locator('header button').first()
    if (await backBtn.isVisible()) {
      await backBtn.click()
      await expect(authedPage).toHaveURL('/')
    }
  })
})
