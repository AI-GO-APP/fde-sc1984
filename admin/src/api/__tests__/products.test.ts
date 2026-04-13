import { describe, it, expect, vi, beforeEach } from 'vitest'

// mock db
const mockDb = {
  query: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
}
vi.mock('../client', () => ({ db: mockDb }))

const { listProducts } = await import('../products')

beforeEach(() => vi.clearAllMocks())

// ─── listProducts ───

describe('listProducts', () => {
  it('查詢 product_templates 表', async () => {
    mockDb.query.mockResolvedValue([])
    await listProducts()
    expect(mockDb.query).toHaveBeenCalledWith(
      'product_templates',
      expect.anything()
    )
  })

  it('正常時回傳包含 id, name, list_price 的陣列', async () => {
    mockDb.query.mockResolvedValue([
      { id: 10, name: '商品甲', list_price: 250 },
      { id: 11, name: '商品乙', list_price: 480 },
    ])
    const result = await listProducts()
    expect(result).toEqual([
      { id: '10', name: '商品甲', listPrice: 250 },
      { id: '11', name: '商品乙', listPrice: 480 },
    ])
  })

  it('無結果時回傳空陣列', async () => {
    mockDb.query.mockResolvedValue([])
    const result = await listProducts()
    expect(result).toEqual([])
  })

  it('API 失敗時回傳空陣列（fail-silent）', async () => {
    mockDb.query.mockRejectedValue(new Error('network error'))
    const result = await listProducts()
    expect(result).toEqual([])
  })
})
