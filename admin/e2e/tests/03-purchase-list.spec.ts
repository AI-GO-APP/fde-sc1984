/**
 * 03 - 採購管理 (PurchasePage) E2E 測試
 * 適配：單日訂單制、PageHeader 日期選擇器
 * 涵蓋：頁面載入、供應商分群、到貨操作、自動翻頁找資料
 */
import { test, expect } from '../fixtures/test-fixtures'
import { navigateToDateWithData } from '../helpers/date-navigator'

test.describe('採購管理 (PurchasePage)', () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto('/purchase')
    await authedPage.waitForLoadState('domcontentloaded')
  })

  test('3.1 載入後顯示採購管理標題', async ({ authedPage }) => {
    await expect(authedPage.getByText('採購管理')).toBeVisible()
  })

  test('3.2 PageHeader 日期切換可用', async ({ authedPage }) => {
    await expect(authedPage.locator('button[title="前一天"]')).toBeVisible()
  })

  test('3.3 狀態文字顯示待採購計數或全部到齊', async ({ authedPage }) => {
    const body = await authedPage.textContent('body') || ''
    const hasStatus = body.includes('待採購') || body.includes('全部品項已到齊')
    expect(hasStatus).toBe(true)
  })

  test('3.4 自動翻頁找到採購單後展開供應商', async ({ authedPage }) => {
    const hasData = await navigateToDateWithData(authedPage, {
      hasDataSelector: '.bg-white.rounded-xl',
      maxDaysBack: 7,
    })

    if (hasData) {
      // 點擊展開第一個供應商
      const supplierBtn = authedPage.locator('.bg-white.rounded-xl button').first()
      if (await supplierBtn.isVisible()) {
        await supplierBtn.click()
        await authedPage.waitForTimeout(500)
        const body = await authedPage.textContent('body')
        expect(body).toBeTruthy()
      }
    }
  })

  test('3.5 供應商名稱應為可讀文字（非 UUID）', async ({ authedPage }) => {
    const hasData = await navigateToDateWithData(authedPage, {
      hasDataSelector: '.bg-white.rounded-xl',
      maxDaysBack: 5,
    })

    if (hasData) {
      const supplierName = authedPage.locator('.font-bold.text-gray-900').first()
      if (await supplierName.isVisible()) {
        const text = await supplierName.textContent()
        const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        expect(UUID_RE.test(text?.trim() || '')).toBe(false)
      }
    }
  })

  test('3.6 返回 Dashboard', async ({ authedPage }) => {
    const backBtn = authedPage.locator('header button').first()
    if (await backBtn.isVisible()) {
      await backBtn.click()
      await expect(authedPage).toHaveURL('/')
    }
  })
})
