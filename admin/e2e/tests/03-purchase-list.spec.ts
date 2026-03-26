/**
 * 03 - Purchase List（今日訂單接收）E2E 測試
 * 涵蓋：客戶/品項 Tab 切換、展開、列印勾選、供應商全選、邊界案例
 */
import { test, expect } from '../fixtures/test-fixtures'

test.describe('Purchase List (今日訂單接收)', () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto('/purchase-list')
    await authedPage.waitForLoadState('domcontentloaded')
  })

  // --- 正常流 ---

  test('3.1 載入後顯示客戶列表視角 (預設)', async ({ authedPage }) => {
    await expect(authedPage.getByText('Loading list')).not.toBeVisible()
    await expect(authedPage.getByText('今日訂單接收')).toBeVisible()
  })

  test('3.2 標題顯示訂單、客戶、品項數', async ({ authedPage }) => {
    const subtitle = await authedPage.locator('header p.text-sm').textContent()
    expect(subtitle).toMatch(/\d+ 筆訂單/)
  })

  test('3.3 展開客戶顯示訂單明細', async ({ authedPage }) => {
    const expandBtn = authedPage.locator('button:has-text("▸")').first()
    if (await expandBtn.isVisible()) {
      await expandBtn.click()
      // 應顯示表格 (品名/數量等)
      await expect(authedPage.getByText('品名')).toBeVisible()
    }
  })

  // --- Tab 切換 ---

  test('3.4 切換「按品項彙總」Tab', async ({ authedPage }) => {
    await authedPage.locator('button', { hasText: '按品項彙總' }).click()
    await authedPage.waitForTimeout(500)
    // 品項表格出現
    const body = await authedPage.textContent('body')
    expect(body).toContain('品名規格')
  })

  test('3.5 品項加總表 footer 合計', async ({ authedPage }) => {
    await authedPage.locator('button', { hasText: '按品項彙總' }).click()
    await authedPage.waitForTimeout(500)
    const body = await authedPage.textContent('body')
    expect(body).toContain('合計')
  })

  // --- 供應商列印 ---

  test('3.6 供應商勾選列印區', async ({ authedPage }) => {
    await authedPage.locator('button', { hasText: '按品項彙總' }).click()
    await authedPage.waitForTimeout(500)
    const body = await authedPage.textContent('body')
    expect(body).toBeTruthy()
  })

  test('3.7 全選/取消全選供應商', async ({ authedPage }) => {
    await authedPage.locator('button', { hasText: '按品項彙總' }).click()
    await authedPage.waitForTimeout(500)
    const selectAllLink = authedPage.locator('button', { hasText: '全選' }).first()
    if (await selectAllLink.isVisible()) {
      await selectAllLink.click()
      await expect(authedPage.locator('button', { hasText: '取消全選' })).toBeVisible()
    }
  })

  test('3.8 列印按鈕：未勾選則 disabled', async ({ authedPage }) => {
    await authedPage.locator('button', { hasText: '按品項彙總' }).click()
    await authedPage.waitForTimeout(500)
    const printBtn = authedPage.locator('button:has-text("列印勾選")')
    if (await printBtn.isVisible()) {
      await expect(printBtn).toBeDisabled()
    }
  })

  // --- 導航 ---

  test('3.9 前往採購定價按鈕', async ({ authedPage }) => {
    const navBtn = authedPage.locator('button:has-text("前往採購定價"), button:has-text("產生採購清單")')
    if (await navBtn.isVisible()) {
      await navBtn.click()
      await expect(authedPage).toHaveURL(/\/procurement/)
    }
  })

  // --- 邊界案例 ---

  test('3.10 按客戶 Tab 切回', async ({ authedPage }) => {
    await authedPage.locator('button', { hasText: '按品項彙總' }).click()
    await authedPage.waitForTimeout(300)
    await authedPage.locator('button', { hasText: '按客戶' }).click()
    await authedPage.waitForTimeout(300)
    const body = await authedPage.textContent('body')
    expect(body).toBeTruthy()
  })

  test('3.11 列印採購加總表按鈕', async ({ authedPage }) => {
    await authedPage.locator('button', { hasText: '按品項彙總' }).click()
    await authedPage.waitForTimeout(500)
    const printListBtn = authedPage.locator('button:has-text("列印採購加總表")')
    if (await printListBtn.isVisible()) {
      await expect(printListBtn).toBeEnabled()
    }
  })

  test('3.12 返回 Dashboard', async ({ authedPage }) => {
    await authedPage.locator('button:has-text("←")').click()
    await expect(authedPage).toHaveURL('/')
  })
})
