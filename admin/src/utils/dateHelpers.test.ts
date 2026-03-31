import { getOrderDateBounds, shiftDate } from './dateHelpers'
import { describe, it, expect } from 'vitest'

describe('getOrderDateBounds', () => {
  it('應該能正確計算 02:00 切換的 UTC 邊界', () => {
    // 假設我們在看 2026-03-20 的訂單
    // 預期的結單範圍為台灣時間 (UTC+8) 的 2026-03-19 02:00:00 到 2026-03-20 02:00:00
    // 等同於 UTC 的 2026-03-18 18:00:00 到 2026-03-19 18:00:00
    const { start, end } = getOrderDateBounds('2026-03-20')
    expect(start).toBe('2026-03-18 18:00:00')
    expect(end).toBe('2026-03-19 18:00:00')
  })

  it('跨月測試：3月初的邊界', () => {
    // 假設目標日為 2026-03-01
    // 台灣時間 2/28 02:00:00 ~ 3/1 02:00:00
    // 對應 UTC 2/27 18:00:00 ~ 2/28 18:00:00
    const { start, end } = getOrderDateBounds('2026-03-01')
    expect(start).toBe('2026-02-27 18:00:00')
    expect(end).toBe('2026-02-28 18:00:00')
  })
})

describe('shiftDate', () => {
  it('能正確切換回上一天', () => {
    expect(shiftDate('2026-03-20', -1)).toBe('2026-03-19')
  })

  it('能正確跨月向後', () => {
    expect(shiftDate('2026-02-28', 1)).toBe('2026-03-01') // 2026非閏年
  })
})
