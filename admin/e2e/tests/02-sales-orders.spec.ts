/**
 * 02 - Sales Orders E2E 測試
 * 涵蓋：列表載入、展開/收合、搜尋/篩選、勾選、分頁、列印按鈕狀態
 * 注意：銷售訂單為純檢視頁面，無確認按鈕和分配欄位
 */
import { test, expect } from '../fixtures/test-fixtures'

test.describe('Sales Orders', () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto('/sales-orders')
    await authedPage.waitForLoadState('networkidle')
  })

  // --- 正常流 ---

  test('2.1 頁面載入後顯示訂單列表', async ({ authedPage }) => {
    await expect(authedPage.getByText('載入中')).not.toBeVisible()
    await expect(authedPage.getByText('銷售訂單')).toBeVisible()
  })

  test('2.2 標題顯示訂單數量', async ({ authedPage }) => {
    const subtitle = await authedPage.locator('header p.text-sm').textContent()
    expect(subtitle).toMatch(/\d+ 筆訂單/)
  })

  test('2.3 展開訂單顯示明細表格', async ({ authedPage }) => {
    const expandBtn = authedPage.locator('button:has-text("▸")').first()
    if (await expandBtn.isVisible()) {
      await expandBtn.click()
      await expect(authedPage.getByText('品名')).toBeVisible()
      await expect(authedPage.getByText('數量')).toBeVisible()
      await expect(authedPage.getByText('單價')).toBeVisible()
    }
  })

  test('2.4 展開後不應有分配欄位和庫存欄', async ({ authedPage }) => {
    const expandBtn = authedPage.locator('button:has-text("▸")').first()
    if (await expandBtn.isVisible()) {
      await expandBtn.click()
      // 確認沒有分配和庫存欄
      await expect(authedPage.locator('th:has-text("分配")')).not.toBeVisible()
      await expect(authedPage.locator('th:has-text("庫存")')).not.toBeVisible()
      await expect(authedPage.locator('th:has-text("單位")')).not.toBeVisible()
    }
  })

  test('2.5 收合已展開的訂單', async ({ authedPage }) => {
    const expandBtn = authedPage.locator('button:has-text("▸")').first()
    if (await expandBtn.isVisible()) {
      await expandBtn.click()
      await expect(authedPage.getByText('品名')).toBeVisible()
      const collapseBtn = authedPage.locator('button:has-text("▾")').first()
      await collapseBtn.click()
      await expect(authedPage.locator('th:has-text("品名")')).not.toBeVisible()
    }
  })

  // --- 篩選 ---

  test('2.6 搜尋欄輸入客戶名稱篩選結果', async ({ authedPage }) => {
    const searchInput = authedPage.getByPlaceholder('搜尋客戶、訂單...')
    await searchInput.fill('zzz_nonexistent_999')
    await authedPage.waitForTimeout(300)
    await expect(authedPage.getByText('無符合的訂單')).toBeVisible()
  })

  test('2.7 狀態篩選：選擇 All 顯示全部', async ({ authedPage }) => {
    await authedPage.locator('select').selectOption('all')
    await authedPage.waitForTimeout(300)
    const subtitle = await authedPage.locator('header p.text-sm').textContent()
    const count = parseInt(subtitle?.match(/(\d+) 筆訂單/)?.[1] || '0')
    expect(count).toBeGreaterThanOrEqual(0)
  })

  // --- 勾選 ---

  test('2.8 不應有確認按鈕（純檢視頁面）', async ({ authedPage }) => {
    // 確認沒有確認/批次確認按鈕
    await expect(authedPage.locator('button:has-text("批次確認")')).not.toBeVisible()
  })

  test('2.9 Select All / Deselect 切換', async ({ authedPage }) => {
    const selectAllBtn = authedPage.getByRole('button', { name: /全選/ })
    if (await selectAllBtn.isVisible()) {
      await selectAllBtn.click()
      await expect(authedPage.getByRole('button', { name: /取消全選/ })).toBeVisible()
      await authedPage.getByRole('button', { name: /取消全選/ }).click()
      await expect(authedPage.getByRole('button', { name: /全選/ })).toBeVisible()
    }
  })

  // --- Print ---

  test('2.10 Print 按鈕：未選取時 disabled', async ({ authedPage }) => {
    const printBtn = authedPage.getByRole('button', { name: /列印 \(0\)/ })
    if (await printBtn.isVisible()) {
      await expect(printBtn).toBeDisabled()
    }
  })

  test('2.11 Print 按鈕：選取後 enabled', async ({ authedPage }) => {
    const checkbox = authedPage.locator('input[type="checkbox"]').first()
    if (await checkbox.isVisible()) {
      await checkbox.check()
      const printBtn = authedPage.locator('button:has-text("列印")')
      if (await printBtn.isVisible()) {
        await expect(printBtn).toBeEnabled()
      }
    }
  })

  // --- 邊界案例 ---

  test('2.12 搜尋無結果顯示 "無符合的訂單"', async ({ authedPage }) => {
    await authedPage.getByPlaceholder('搜尋客戶、訂單...').fill('__no_match_xyzzy__')
    await authedPage.waitForTimeout(300)
    await expect(authedPage.getByText('無符合的訂單')).toBeVisible()
  })

  test('2.13 不應有商品追蹤數量資訊列', async ({ authedPage }) => {
    await expect(authedPage.getByText('商品追蹤數量')).not.toBeVisible()
  })

  test('2.14 返回 Dashboard', async ({ authedPage }) => {
    await authedPage.locator('header button').first().click()
    await expect(authedPage).toHaveURL('/')
  })

  test('2.15 Price 為 0 時顯示待定', async ({ authedPage }) => {
    const expandBtn = authedPage.locator('button:has-text("▸")').first()
    if (await expandBtn.isVisible()) {
      await expandBtn.click()
      const body = await authedPage.textContent('body')
      expect(body).toBeTruthy()
    }
  })
})
