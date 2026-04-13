import { describe, it, expect, vi, beforeEach } from 'vitest'

// mock db
const mockDb = {
  query: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
}
vi.mock('../client', () => ({ db: mockDb }))

const { getOrderLines } = await import('../saleOrders')

beforeEach(() => vi.clearAllMocks())

// ─── getOrderLines ───

describe('getOrderLines', () => {
  it('查詢時帶入正確的 order_id filter', async () => {
    mockDb.query.mockResolvedValue([])
    await getOrderLines('order-123')
    expect(mockDb.query).toHaveBeenCalledWith(
      'sale_order_lines',
      expect.objectContaining({
        filters: expect.arrayContaining([
          expect.objectContaining({ column: 'order_id', op: 'eq', value: 'order-123' }),
        ]),
      })
    )
  })

  it('正常時回傳訂單明細陣列', async () => {
    mockDb.query.mockResolvedValue([
      { id: 1, name: '產品 A', product_uom_qty: 3 },
      { id: 2, name: '產品 B', product_uom_qty: 5 },
    ])
    const result = await getOrderLines('order-123')
    expect(result).toEqual([
      { id: '1', name: '產品 A', productUomQty: 3 },
      { id: '2', name: '產品 B', productUomQty: 5 },
    ])
  })

  it('無結果時回傳空陣列', async () => {
    mockDb.query.mockResolvedValue([])
    const result = await getOrderLines('order-123')
    expect(result).toEqual([])
  })

  it('API 失敗時回傳空陣列（fail-silent）', async () => {
    mockDb.query.mockRejectedValue(new Error('network error'))
    const result = await getOrderLines('order-123')
    expect(result).toEqual([])
  })
})
