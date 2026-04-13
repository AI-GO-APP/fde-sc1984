import { describe, it, expect } from 'vitest'
import { getAvailableOrderDates, getMondaysOfMonth } from '../dateSelection'

// ── getAvailableOrderDates ──

describe('getAvailableOrderDates', () => {
  it('無假日時回傳明天起 30 天', () => {
    const today = new Date('2026-04-02')
    const dates = getAvailableOrderDates(today, [])
    expect(dates).toHaveLength(30)
    expect(dates[0]).toBe('2026-04-03')
    expect(dates[29]).toBe('2026-05-02')
  })

  it('不包含今天', () => {
    const today = new Date('2026-04-02')
    const dates = getAvailableOrderDates(today, [])
    expect(dates).not.toContain('2026-04-02')
  })

  it('排除假日後天數減少', () => {
    const today = new Date('2026-04-02')
    const holidays = ['2026-04-03', '2026-04-04']
    const dates = getAvailableOrderDates(today, holidays)
    expect(dates).toHaveLength(28)
    expect(dates).not.toContain('2026-04-03')
    expect(dates).not.toContain('2026-04-04')
  })

  it('假日在 30 天範圍外 → 不影響結果', () => {
    const today = new Date('2026-04-02')
    const holidays = ['2026-06-01'] // 超過 30 天
    const dates = getAvailableOrderDates(today, holidays)
    expect(dates).toHaveLength(30)
  })

  it('所有日期都被設為假日 → 回傳空陣列', () => {
    const today = new Date('2026-04-02')
    // 產生未來 30 天清單作為假日
    const holidays = Array.from({ length: 30 }, (_, i) => {
      const d = new Date('2026-04-03')
      d.setDate(d.getDate() + i)
      return d.toISOString().split('T')[0]
    })
    const dates = getAvailableOrderDates(today, holidays)
    expect(dates).toHaveLength(0)
  })

  it('回傳的日期格式為 YYYY-MM-DD', () => {
    const today = new Date('2026-04-02')
    const dates = getAvailableOrderDates(today, [])
    dates.forEach(d => {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  it('跨月份時日期正確', () => {
    const today = new Date('2026-04-25')
    const dates = getAvailableOrderDates(today, [])
    expect(dates[0]).toBe('2026-04-26')
    expect(dates).toContain('2026-05-01')
    expect(dates).toContain('2026-05-25')
  })
})

// ── getMondaysOfMonth ──

describe('getMondaysOfMonth', () => {
  it('2026 年 4 月的所有週一', () => {
    // 2026-04: 週一為 4/6, 4/13, 4/20, 4/27
    const mondays = getMondaysOfMonth(2026, 4)
    expect(mondays).toEqual(['2026-04-06', '2026-04-13', '2026-04-20', '2026-04-27'])
  })

  it('2026 年 2 月的所有週一', () => {
    // 2026-02: 週一為 2/2, 2/9, 2/16, 2/23
    const mondays = getMondaysOfMonth(2026, 2)
    expect(mondays).toEqual(['2026-02-02', '2026-02-09', '2026-02-16', '2026-02-23'])
  })

  it('回傳陣列中所有日期都是週一（weekday === 1）', () => {
    const mondays = getMondaysOfMonth(2026, 4)
    mondays.forEach(d => {
      expect(new Date(d).getDay()).toBe(1)
    })
  })

  it('回傳的日期格式為 YYYY-MM-DD', () => {
    const mondays = getMondaysOfMonth(2026, 4)
    mondays.forEach(d => {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  it('月份以 1 為基底（1=一月，12=十二月）', () => {
    const dec = getMondaysOfMonth(2026, 12)
    dec.forEach(d => expect(d.startsWith('2026-12')).toBe(true))
  })
})
