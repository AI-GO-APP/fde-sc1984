/**
 * 日期導航輔助工具
 * 方案 A：自動往前翻頁直到找到有資料的訂單日
 */
import type { Page } from '@playwright/test'

/**
 * 等待頁面載入完成（Loading 消失）
 */
export async function waitForDataLoad(page: Page, timeout = 30_000) {
  // 等待「載入資料中...」的 Loading Cover 消失
  await page.waitForFunction(
    () => {
      const cover = document.querySelector('[class*="LoadingCover"]')
      if (cover && (cover as HTMLElement).style.display !== 'none') return false
      // 也檢查內文是否還有「載入中」
      return !document.body.textContent?.includes('載入資料中')
    },
    { timeout },
  ).catch(() => {
    // 超時就繼續，部分頁面可能資料為空
  })
}

/**
 * 在 PageHeader 上翻頁找到有訂單資料的日子
 * 
 * @param page Playwright Page
 * @param contentSelector 用來判斷「有資料」的 CSS 選擇器或文字
 * @param maxDaysBack 最多往回翻幾天（預設 7）
 * @returns 是否成功找到有資料的日期
 */
export async function navigateToDateWithData(
  page: Page,
  options: {
    /** 判斷「有資料」的方法：頁面上能找到此選擇器代表有資料 */
    hasDataSelector?: string
    /** 或者用文字判斷：頁面不包含此文字代表有資料 */
    emptyText?: string
    /** 最多往回翻幾天 */
    maxDaysBack?: number
  } = {},
): Promise<boolean> {
  const { 
    hasDataSelector, 
    emptyText = '尚無',
    maxDaysBack = 7 
  } = options

  for (let i = 0; i < maxDaysBack; i++) {
    await waitForDataLoad(page)
    await page.waitForTimeout(500)

    // 檢查是否有資料
    let hasData = false
    if (hasDataSelector) {
      hasData = await page.locator(hasDataSelector).first().isVisible().catch(() => false)
    } else {
      const bodyText = await page.textContent('body') || ''
      hasData = !bodyText.includes(emptyText)
    }

    if (hasData) return true

    // 點擊「前一天」按鈕
    const prevBtn = page.locator('button[title="前一天"]')
    if (await prevBtn.isVisible()) {
      await prevBtn.click()
      await page.waitForTimeout(300)
    } else {
      break
    }
  }

  return false
}

/**
 * 取得 PageHeader 上目前顯示的日期文字
 */
export async function getCurrentDateText(page: Page): Promise<string> {
  const dateEl = page.locator('header span.text-blue-700, header span.font-bold.text-blue-700')
  if (await dateEl.isVisible()) {
    return (await dateEl.textContent())?.trim() || ''
  }
  return ''
}
