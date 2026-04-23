/**
 * 配送日期選擇工具
 * - 截止時間前：明天起 7 日可選
 * - 截止時間後：後天起 7 日可選（今日截止，明日單不可再下）
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1/open/proxy'
const API_KEY = import.meta.env.VITE_API_KEY || ''

/** 從 x_holiday_settings 取得假日清單，失敗時回傳空陣列 */
export async function fetchHolidays(token: string | null): Promise<string[]> {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const res = await fetch(`${API_BASE}/x_holiday_settings/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        filters: [{ column: 'date', op: 'ge', value: today }],
        select_columns: ['date'],
        limit: 200,
      }),
    })
    if (!res.ok) return []
    const rows: { date: string }[] = await res.json()
    return (rows || []).map(r => r.date).filter(Boolean)
  } catch {
    return []
  }
}

/** 從 x_app_settings 取得 order_cutoff_time（格式 "HH:mm"），失敗回傳 null */
export async function fetchCutoffTime(token: string | null): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/x_app_settings/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        filters: [{ column: 'key', op: 'eq', value: 'order_cutoff_time' }],
        select_columns: ['value'],
        limit: 1,
      }),
    })
    if (!res.ok) return null
    const rows: { value: string }[] = await res.json()
    return rows?.[0]?.value ?? null
  } catch {
    return null
  }
}

/** 純函式：判斷目前台灣時間是否已超過截止時間 */
export function isCutoffPassed(cutoffTime: string | null): boolean {
  if (!cutoffTime) return false
  const nowTW = new Date(Date.now() + 8 * 60 * 60 * 1000)
  const nowMinutes = nowTW.getUTCHours() * 60 + nowTW.getUTCMinutes()
  const [h, m] = cutoffTime.split(':').map(Number)
  return nowMinutes >= h * 60 + m
}

function toYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 純函式：計算最小可選配送日（截止前＝明天；截止後＝後天） */
export function computeMinDeliveryDate(cutoffPassed: boolean): string {
  const d = new Date()
  d.setDate(d.getDate() + (cutoffPassed ? 2 : 1))
  return toYMD(d)
}

const LOOKAHEAD_DAYS = 7

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']

/** 產生可選配送日期（排除假日；截止後從後天起算） */
export function getAvailableOrderDates(today: Date, holidays: string[], cutoffPassed = false): string[] {
  const holidaySet = new Set(holidays)
  const result: string[] = []
  const startOffset = cutoffPassed ? 2 : 1

  for (let i = startOffset; i <= startOffset + LOOKAHEAD_DAYS - 1; i++) {
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
