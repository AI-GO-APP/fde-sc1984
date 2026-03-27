/**
 * mapProducts / mapCategories 單元測試
 *
 * 重點測試：防禦性去重（相同 id 的 product template 只保留一筆）
 */
import { describe, it, expect, vi } from 'vitest'

// Mock useAuthStore（client.ts import 需要）
vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: {
    getState: () => ({ token: 'mock-token' }),
  },
}))

import { mapProducts, mapCategories, type RawProductTemplate, type RawProductCategory } from '../client'

// === 測試資料 ===

const mockCategories: RawProductCategory[] = [
  { id: 'cat-1', name: 'A高麗類', parent_id: null },
  { id: 'cat-2', name: 'B葉菜類', parent_id: null },
]

function makeTemplate(overrides?: Partial<RawProductTemplate>): RawProductTemplate {
  return {
    id: 'prod-1',
    name: '平地初秋A*',
    categ_id: 'cat-1',
    list_price: 100,
    default_code: 'A005',
    uom_id: '台斤',
    ...overrides,
  }
}

// === 測試 ===

describe('mapProducts', () => {
  const cats = mapCategories(mockCategories)

  it('正常轉換：一筆 template → 一筆 product', () => {
    const raw = [makeTemplate()]
    const result = mapProducts(raw, cats)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('prod-1')
    expect(result[0].name).toBe('平地初秋A*')
    expect(result[0].categoryId).toBe('cat-1')
  })

  it('防禦性去重：3 筆相同 id 的 template → 只保留 1 筆', () => {
    // 模擬 API JOIN 重複回傳的情況
    const raw = [
      makeTemplate(),
      makeTemplate(),
      makeTemplate(),
    ]
    const result = mapProducts(raw, cats)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('prod-1')
    expect(result[0].name).toBe('平地初秋A*')
  })

  it('不同 id 的產品不受去重影響', () => {
    const raw = [
      makeTemplate({ id: 'prod-1', name: '平地初秋A*' }),
      makeTemplate({ id: 'prod-2', name: '平地初秋B' }),
      makeTemplate({ id: 'prod-3', name: '山東白菜原件(進)' }),
    ]
    const result = mapProducts(raw, cats)

    expect(result).toHaveLength(3)
    expect(result.map(p => p.id)).toEqual(['prod-1', 'prod-2', 'prod-3'])
  })

  it('混合情況：不同 id + 重複 id → 正確去重', () => {
    const raw = [
      makeTemplate({ id: 'prod-1', name: '平地初秋A*' }),
      makeTemplate({ id: 'prod-1', name: '平地初秋A*' }), // 重複
      makeTemplate({ id: 'prod-2', name: '平地初秋B' }),
      makeTemplate({ id: 'prod-1', name: '平地初秋A*' }), // 重複
      makeTemplate({ id: 'prod-3', name: '山東白菜' }),
      makeTemplate({ id: 'prod-2', name: '平地初秋B' }),   // 重複
    ]
    const result = mapProducts(raw, cats)

    expect(result).toHaveLength(3)
    expect(result.map(p => p.id)).toEqual(['prod-1', 'prod-2', 'prod-3'])
  })

  it('name 為空的 template 被過濾', () => {
    const raw = [
      makeTemplate({ id: 'prod-1', name: '平地初秋A*' }),
      makeTemplate({ id: 'prod-empty', name: '' }),
    ]
    const result = mapProducts(raw, cats)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('prod-1')
  })

  it('空陣列輸入 → 回傳空陣列', () => {
    const result = mapProducts([], cats)
    expect(result).toHaveLength(0)
  })

  it('categ_id 為 null → fallback 到第一個分類', () => {
    const raw = [makeTemplate({ id: 'prod-nocat', categ_id: null })]
    const result = mapProducts(raw, cats)

    expect(result[0].categoryId).toBe('cat-1')
  })
})

describe('mapCategories', () => {
  it('正常轉換分類', () => {
    const result = mapCategories(mockCategories)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ id: 'cat-1', name: 'A高麗類', code: 'A' })
    expect(result[1]).toEqual({ id: 'cat-2', name: 'B葉菜類', code: 'B' })
  })

  it('name 為空的分類被過濾', () => {
    const raw = [
      { id: 'cat-1', name: 'A高麗類', parent_id: null },
      { id: 'cat-empty', name: '', parent_id: null },
    ]
    const result = mapCategories(raw)

    expect(result).toHaveLength(1)
  })
})
