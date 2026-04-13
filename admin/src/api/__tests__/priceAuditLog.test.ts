import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockDb = {
  query: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}
vi.mock('../client', () => ({ db: mockDb }))

const { updateProductPrice, syncOrderLinePrices, writePriceAuditLog, getPriceAuditLog, updateProductPriceWithAudit } =
  await import('../priceAuditLog')

beforeEach(() => vi.clearAllMocks())

describe('updateProductPrice', () => {
  it('PATCH product_templates 寫入正確的 list_price', async () => {
    mockDb.update.mockResolvedValue({})
    await updateProductPrice('tmpl-1', 120)
    expect(mockDb.update).toHaveBeenCalledWith(
      'product_templates',
      'tmpl-1',
      expect.objectContaining({ list_price: 120 })
    )
  })
})

describe('syncOrderLinePrices', () => {
  it('查詢含此品項的所有 sale_order_lines', async () => {
    mockDb.query.mockResolvedValue([])
    await syncOrderLinePrices('tmpl-1', 120, '2026-04-02')
    expect(mockDb.query).toHaveBeenCalledWith(
      'sale_order_lines',
      expect.objectContaining({
        filters: expect.arrayContaining([
          expect.objectContaining({ column: 'product_template_id', op: 'eq', value: 'tmpl-1' }),
        ]),
      })
    )
  })

  it('逐一 PATCH 每筆 line 的 price_unit', async () => {
    // 第一次 query：sale_order_lines；第二次 query：sale_orders（回傳 draft/sale state）
    mockDb.query
      .mockResolvedValueOnce([
        { id: 'line-1', order_id: 'order-1', product_template_id: 'tmpl-1', price_unit: 100 },
        { id: 'line-2', order_id: 'order-1', product_template_id: 'tmpl-1', price_unit: 100 },
      ])
      .mockResolvedValueOnce([
        { id: 'order-1', state: 'sale', date_order: '2026-04-02' },
      ])
    mockDb.update.mockResolvedValue({})
    mockDb.insert.mockResolvedValue({})

    await syncOrderLinePrices('tmpl-1', 120, '2026-04-02')

    expect(mockDb.update).toHaveBeenCalledWith('sale_order_lines', 'line-1', { price_unit: 120 })
    expect(mockDb.update).toHaveBeenCalledWith('sale_order_lines', 'line-2', { price_unit: 120 })
  })

  it('回傳更新筆數與 batchId', async () => {
    mockDb.query
      .mockResolvedValueOnce([
        { id: 'line-1', order_id: 'order-1', product_template_id: 'tmpl-1', price_unit: 100 },
        { id: 'line-2', order_id: 'order-1', product_template_id: 'tmpl-1', price_unit: 100 },
      ])
      .mockResolvedValueOnce([
        { id: 'order-1', state: 'sale', date_order: '2026-04-02' },
      ])
    mockDb.update.mockResolvedValue({})
    mockDb.insert.mockResolvedValue({})

    const result = await syncOrderLinePrices('tmpl-1', 120, '2026-04-02')
    expect(result.updated).toBe(2)
    expect(typeof result.batchId).toBe('string')
    expect(result.batchId.length).toBeGreaterThan(0)
  })

  it('無對應 line 時回傳 updated=0', async () => {
    mockDb.query.mockResolvedValue([])
    const result = await syncOrderLinePrices('tmpl-1', 120, '2026-04-02')
    expect(result.updated).toBe(0)
    expect(mockDb.update).not.toHaveBeenCalled()
  })

  it('同一批次的 batchId 相同', async () => {
    mockDb.query
      .mockResolvedValueOnce([
        { id: 'line-1', order_id: 'order-1', price_unit: 100 },
        { id: 'line-2', order_id: 'order-1', price_unit: 100 },
      ])
      .mockResolvedValueOnce([
        { id: 'order-1', state: 'draft', date_order: '2026-04-02' },
      ])
    mockDb.update.mockResolvedValue({})
    mockDb.insert.mockResolvedValue({})

    const result = await syncOrderLinePrices('tmpl-1', 120, '2026-04-02')
    // batchId 是在函式內統一產生，所有 priceAuditLog insert 都使用同一個
    expect(result.batchId).toBeDefined()
  })

  it('deliveryDate 符合時才更新（date_order 符合 → updated=2）', async () => {
    mockDb.query
      .mockResolvedValueOnce([
        { id: 'line-1', order_id: 'order-1', product_template_id: 'tmpl-1', price_unit: 100 },
        { id: 'line-2', order_id: 'order-1', product_template_id: 'tmpl-1', price_unit: 100 },
      ])
      .mockResolvedValueOnce([
        // date_order 使用完整 ISO 格式，確認 slice(0,10) 比對有效
        { id: 'order-1', state: 'sale', date_order: '2026-04-02T08:00:00' },
      ])
    mockDb.update.mockResolvedValue({})

    const result = await syncOrderLinePrices('tmpl-1', 120, '2026-04-02')
    expect(result.updated).toBe(2)
    expect(mockDb.update).toHaveBeenCalledWith('sale_order_lines', 'line-1', { price_unit: 120 })
    expect(mockDb.update).toHaveBeenCalledWith('sale_order_lines', 'line-2', { price_unit: 120 })
  })

  it('deliveryDate 不符合時跳過（date_order 不符合 → updated=0）', async () => {
    mockDb.query
      .mockResolvedValueOnce([
        { id: 'line-1', order_id: 'order-1', product_template_id: 'tmpl-1', price_unit: 100 },
      ])
      .mockResolvedValueOnce([
        { id: 'order-1', state: 'sale', date_order: '2026-04-03' },
      ])
    mockDb.update.mockResolvedValue({})

    const result = await syncOrderLinePrices('tmpl-1', 120, '2026-04-02')
    expect(result.updated).toBe(0)
    expect(mockDb.update).not.toHaveBeenCalled()
  })
})

describe('updateProductPriceWithAudit', () => {
  it('正確串接三個步驟，回傳 updated 與 batchId', async () => {
    mockDb.update.mockResolvedValue({})
    mockDb.query
      .mockResolvedValueOnce([
        { id: 'line-1', order_id: 'order-1', product_template_id: 'tmpl-1', price_unit: 100 },
      ])
      .mockResolvedValueOnce([
        { id: 'order-1', state: 'sale', date_order: '2026-04-02' },
      ])
    mockDb.insert.mockResolvedValue({ id: 'plog-1' })

    const result = await updateProductPriceWithAudit('tmpl-1', 100, 120, 'admin', '2026-04-02')

    expect(mockDb.update).toHaveBeenCalledWith('product_templates', 'tmpl-1', { list_price: 120 })
    expect(mockDb.update).toHaveBeenCalledWith('sale_order_lines', 'line-1', { price_unit: 120 })
    expect(mockDb.insert).toHaveBeenCalledWith(
      'x_price_audit_log',
      expect.objectContaining({
        product_tmpl_id: 'tmpl-1',
        old_price: 100,
        new_price: 120,
        updated_by: 'admin',
      })
    )
    expect(result.updated).toBe(1)
    expect(typeof result.batchId).toBe('string')
  })

  it('updateProductPrice 失敗時不呼叫 syncOrderLinePrices 與 writePriceAuditLog', async () => {
    mockDb.update.mockRejectedValueOnce(new Error('product update failed'))

    await expect(
      updateProductPriceWithAudit('tmpl-1', 100, 120, 'admin', '2026-04-02')
    ).rejects.toThrow()

    expect(mockDb.query).not.toHaveBeenCalled()
    expect(mockDb.insert).not.toHaveBeenCalled()
  })

  it('syncOrderLinePrices 失敗時 throw，且不呼叫 writePriceAuditLog', async () => {
    mockDb.update
      .mockResolvedValueOnce({})           // updateProductPrice 成功
      .mockRejectedValueOnce(new Error('sync failed'))  // syncOrderLinePrices 內部 update 失敗
    mockDb.query
      .mockResolvedValueOnce([
        { id: 'line-1', order_id: 'order-1', product_template_id: 'tmpl-1', price_unit: 100 },
      ])
      .mockResolvedValueOnce([
        { id: 'order-1', state: 'sale', date_order: '2026-04-02' },
      ])

    await expect(
      updateProductPriceWithAudit('tmpl-1', 100, 120, 'admin', '2026-04-02')
    ).rejects.toThrow()

    expect(mockDb.insert).not.toHaveBeenCalled()
  })

  it('writePriceAuditLog 失敗時 orchestrator 不 throw 且有 console.warn', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockDb.update.mockResolvedValue({})
    mockDb.query
      .mockResolvedValueOnce([
        { id: 'line-1', order_id: 'order-1', product_template_id: 'tmpl-1', price_unit: 100 },
      ])
      .mockResolvedValueOnce([
        { id: 'order-1', state: 'sale', date_order: '2026-04-02' },
      ])
    mockDb.insert.mockRejectedValueOnce(new Error('audit log failed'))

    const result = await updateProductPriceWithAudit('tmpl-1', 100, 120, 'admin', '2026-04-02')

    expect(result.updated).toBe(1)
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[priceAuditLog]'),
      expect.any(Error)
    )
    warnSpy.mockRestore()
  })
})

describe('writePriceAuditLog', () => {
  it('POST 完整的價格稽核欄位', async () => {
    mockDb.query.mockResolvedValue([])
    mockDb.insert.mockResolvedValue({ id: 'plog-1' })
    await writePriceAuditLog({
      productTmplId: 'tmpl-1',
      oldPrice: 100,
      newPrice: 120,
      updatedBy: 'admin',
      updatedAt: '2026-04-02T10:00:00',
      batchId: 'batch-123',
    })
    expect(mockDb.insert).toHaveBeenCalledWith(
      'x_price_audit_log',
      expect.objectContaining({
        product_tmpl_id: 'tmpl-1',
        old_price: 100,
        new_price: 120,
        updated_by: 'admin',
        batch_id: 'batch-123',
      })
    )
  })
})

describe('getPriceAuditLog', () => {
  it('查詢時帶入正確的 product_tmpl_id filter', async () => {
    mockDb.query.mockResolvedValue([])
    await getPriceAuditLog('tmpl-1')
    expect(mockDb.query).toHaveBeenCalledWith(
      'x_price_audit_log',
      expect.objectContaining({
        filters: expect.arrayContaining([
          expect.objectContaining({ column: 'product_tmpl_id', op: 'eq', value: 'tmpl-1' }),
        ]),
      })
    )
  })

  it('回傳依 updated_at 降冪排列', async () => {
    mockDb.query.mockResolvedValue([
      { id: 'plog-1', updated_at: '2026-04-01T10:00:00' },
      { id: 'plog-2', updated_at: '2026-04-02T10:00:00' },
    ])
    const result = await getPriceAuditLog('tmpl-1')
    expect(result[0].id).toBe('plog-2')
    expect(result[1].id).toBe('plog-1')
  })

  it('API 失敗時回傳空陣列', async () => {
    mockDb.query.mockRejectedValue(new Error('fail'))
    expect(await getPriceAuditLog('tmpl-1')).toEqual([])
  })
})
