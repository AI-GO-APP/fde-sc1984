/**
 * 配送日期選擇工具
 * 產生明天起 30 天的可選日期（排除假日）
 */

function toYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const LOOKAHEAD_DAYS = 30

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']

/** 產生可選配送日期（明天起，排除假日） */
export function getAvailableOrderDates(today: Date, holidays: string[]): string[] {
  const holidaySet = new Set(holidays)
  const result: string[] = []

  for (let i = 1; i <= LOOKAHEAD_DAYS; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const ymd = toYMD(d)
    if (!holidaySet.has(ymd)) {
      result.push(ymd)
    }
  }

  return result
}

/** 將 YYYY-MM-DD 格式化為「YYYY-MM-DD（週幾）」的顯示文字 */
export function formatDateOption(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${ymd}（${DAY_NAMES[date.getDay()]}）`
}
