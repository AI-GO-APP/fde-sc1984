import { describe, it, expect } from 'vitest'
import { isBeforeCutoff } from '../orderValidation'

describe('isBeforeCutoff', () => {
  // ── 基本判斷 ──

  it('目前時間在截止前 → 回傳 true', () => {
    const now = new Date('2026-04-02T13:00:00')
    expect(isBeforeCutoff('22:00', now)).toBe(true)
  })

  it('目前時間在截止後 → 回傳 false', () => {
    const now = new Date('2026-04-02T23:00:00')
    expect(isBeforeCutoff('22:00', now)).toBe(false)
  })

  it('目前時間等於截止時間（整點） → 回傳 false', () => {
    const now = new Date('2026-04-02T22:00:00')
    expect(isBeforeCutoff('22:00', now)).toBe(false)
  })

  // ── 分鐘邊界 ──

  it('截止 22:30，目前 22:29 → 回傳 true', () => {
    const now = new Date('2026-04-02T22:29:00')
    expect(isBeforeCutoff('22:30', now)).toBe(true)
  })

  it('截止 22:30，目前 22:30 → 回傳 false', () => {
    const now = new Date('2026-04-02T22:30:00')
    expect(isBeforeCutoff('22:30', now)).toBe(false)
  })

  it('截止 22:30，目前 22:31 → 回傳 false', () => {
    const now = new Date('2026-04-02T22:31:00')
    expect(isBeforeCutoff('22:30', now)).toBe(false)
  })

  // ── 凌晨截止 ──

  it('截止 00:00（午夜），目前 23:59 → 回傳 true', () => {
    const now = new Date('2026-04-02T23:59:00')
    expect(isBeforeCutoff('00:00', now)).toBe(true)
  })

  it('截止 00:00（午夜），目前 00:01 → 回傳 false', () => {
    const now = new Date('2026-04-02T00:01:00')
    expect(isBeforeCutoff('00:00', now)).toBe(false)
  })

  // ── 格式相容 ──

  it('cutoffTime 格式 HH:MM（含前導零） → 正確解析', () => {
    const now = new Date('2026-04-02T08:00:00')
    expect(isBeforeCutoff('09:00', now)).toBe(true)
    expect(isBeforeCutoff('07:00', now)).toBe(false)
  })
})
