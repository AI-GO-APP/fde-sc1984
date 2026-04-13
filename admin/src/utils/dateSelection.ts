function toYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const LOOKAHEAD_DAYS = 30

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

export function getMondaysOfMonth(year: number, month: number): string[] {
  const result: string[] = []
  // month 以 1 為基底
  const d = new Date(year, month - 1, 1)

  while (d.getMonth() === month - 1) {
    if (d.getDay() === 1) {
      result.push(toYMD(d))
    }
    d.setDate(d.getDate() + 1)
  }

  return result
}
