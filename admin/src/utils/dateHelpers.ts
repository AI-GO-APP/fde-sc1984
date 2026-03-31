/**
 * 計算指定目標日期的 02:00 ~ 02:00 (UTC+8) Odoo UTC 範圍
 * @param dateStr 目標日期字串 'YYYY-MM-DD'
 * @returns { start: string, end: string } UTC 格式 'YYYY-MM-DD HH:mm:ss'
 */
export function getOrderDateBounds(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  
  // 目標日 00:00 UTC
  const targetMidnight = new Date(Date.UTC(y, m - 1, d))
  // targetMidnight 往前推 30 小時 = T-2 的 18:00 UTC (等同台灣時間 T-1 的 02:00)
  const startUTC = new Date(targetMidnight.getTime() - 30 * 60 * 60 * 1000)
  // targetMidnight 往前推 6 小時 = T-1 的 18:00 UTC (等同台灣時間 T 的 02:00)
  const endUTC = new Date(targetMidnight.getTime() - 6 * 60 * 60 * 1000)
  
  return {
    start: startUTC.toISOString().replace('T', ' ').substring(0, 19),
    end: endUTC.toISOString().replace('T', ' ').substring(0, 19)
  }
}

/**
 * 取得下一個或上一個日期的字串
 */
export function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  
  // 修正時區偏移以確保 toISOString 回傳預期的地方日期字串 (或者手動 format)
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().split('T')[0]
}

/**
 * 取得今天的當地日期字串 YYYY-MM-DD
 */
export function getTodayDateStr(): string {
  const now = new Date()
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return localDate.toISOString().split('T')[0]
}
