import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockDb = {
  query: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}
vi.mock('../client', () => ({ db: mockDb }))

const { writeOrderAuditLog, getOrderAuditLog, updateOrderLineWithAudit } =
  await import('../orderAuditLog')

beforeEach(() => vi.clearAllMocks())

describe('writeOrderAuditLog', () => {
  it('POST 完整的稽核紀錄欄位', async () => {
    mockDb.insert.mockResolvedValue({ id: 'log-1' })
    await writeOrderAuditLog({
      orderId: 'order-1',
      field: 'product_uom_qty',
      oldValue: '5',
      newValue: '3',
      changedBy: 'admin',
      changedAt: '2026-04-02T10:00:00',
      note: '',
    })
    expect(mockDb.insert).toHaveBeenCalledWith(
      'x_order_audit_log',
      expect.objectContaining({
        order_id: 'order-1',
        field: 'product_uom_qty',
        old_value: '5',
        new_value: '3',
        changed_by: 'admin',
        changed_at: '2026-04-02T10:00:00',
      })
    )
  })

  it('若未傳 changedAt 則自動補上當前時間', async () => {
    mockDb.insert.mockResolvedValue({ id: 'log-1' })
    await writeOrderAuditLog({
      orderId: 'order-1',
      field: 'product_uom_qty',
      oldValue: '5',
      newValue: '3',
      changedBy: 'admin',
    })
    const payload = mockDb.insert.mock.calls[0][1]
    expect(payload.changed_at).toBeDefined()
    expect(typeof payload.changed_at).toBe('string')
  })
})

describe('getOrderAuditLog', () => {
  it('查詢時帶入正確的 order_id filter', async () => {
    mockDb.query.mockResolvedValue([])
    await getOrderAuditLog('order-1')
    expect(mockDb.query).toHaveBeenCalledWith(
      'x_order_audit_log',
      expect.objectContaining({
        filters: expect.arrayContaining([
          expect.objectContaining({ column: 'order_id', op: 'eq', value: 'order-1' }),
        ]),
      })
    )
  })

  it('結果依 changed_at 降冪排列（最新在前）', async () => {
    mockDb.query.mockResolvedValue([
      { id: 'log-1', changed_at: '2026-04-02T09:00:00' },
      { id: 'log-2', changed_at: '2026-04-02T11:00:00' },
      { id: 'log-3', changed_at: '2026-04-02T10:00:00' },
    ])
    const result = await getOrderAuditLog('order-1')
    expect(result[0].id).toBe('log-2')
    expect(result[1].id).toBe('log-3')
    expect(result[2].id).toBe('log-1')
  })

  it('無紀錄時回傳空陣列', async () => {
    mockDb.query.mockResolvedValue([])
    expect(await getOrderAuditLog('order-1')).toEqual([])
  })

  it('API 失敗時回傳空陣列', async () => {
    mockDb.query.mockRejectedValue(new Error('fail'))
    expect(await getOrderAuditLog('order-1')).toEqual([])
  })
})

describe('updateOrderLineWithAudit', () => {
  it('先 PATCH 明細數量，再寫入稽核紀錄', async () => {
    mockDb.update.mockResolvedValue({})
    mockDb.insert.mockResolvedValue({ id: 'log-1' })

    await updateOrderLineWithAudit('line-1', 'order-1', 5, 3, 'admin')

    expect(mockDb.update).toHaveBeenCalledWith(
      'sale_order_lines',
      'line-1',
      { product_uom_qty: 3 }
    )
    expect(mockDb.insert).toHaveBeenCalledWith(
      'x_order_audit_log',
      expect.objectContaining({
        order_id: 'order-1',
        old_value: '5',
        new_value: '3',
        changed_by: 'admin',
      })
    )
  })

  it('update 失敗時不寫入稽核（錯誤向上拋）', async () => {
    mockDb.update.mockRejectedValue(new Error('update failed'))
    await expect(
      updateOrderLineWithAudit('line-1', 'order-1', 5, 3, 'admin')
    ).rejects.toThrow()
    expect(mockDb.insert).not.toHaveBeenCalled()
  })

  it('新舊數量相同時仍執行（由呼叫端決定是否呼叫）', async () => {
    mockDb.update.mockResolvedValue({})
    mockDb.insert.mockResolvedValue({ id: 'log-1' })
    await updateOrderLineWithAudit('line-1', 'order-1', 5, 5, 'admin')
    expect(mockDb.update).toHaveBeenCalled()
    expect(mockDb.insert).toHaveBeenCalled()
  })

  it('update 成功但 audit log insert 失敗 → 函式不 throw（降級處理），且有 console.warn 被呼叫', async () => {
    mockDb.update.mockResolvedValue({})
    mockDb.insert.mockRejectedValue(new Error('insert failed'))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(
      updateOrderLineWithAudit('line-1', 'order-1', 5, 3, 'admin')
    ).resolves.toBeUndefined()

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[orderAuditLog]'),
      expect.any(Error)
    )
    warnSpy.mockRestore()
  })
})
