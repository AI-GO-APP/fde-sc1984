import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockDb = {
  query: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}
vi.mock('../client', () => ({ db: mockDb }))

const { getDriverCustomerMappings, addDriverCustomerMapping, deleteDriverCustomerMapping, getCustomersByDriver } =
  await import('../driverCustomer')

beforeEach(() => vi.clearAllMocks())

describe('getDriverCustomerMappings', () => {
  it('回傳格式化後的關聯清單', async () => {
    mockDb.query.mockResolvedValue([
      { id: 'dc-1', driver_id: 'drv-1', customer_id: 'cust-1' },
      { id: 'dc-2', driver_id: 'drv-1', customer_id: 'cust-2' },
    ])
    const result = await getDriverCustomerMappings()
    expect(result).toEqual([
      { id: 'dc-1', driverId: 'drv-1', customerId: 'cust-1' },
      { id: 'dc-2', driverId: 'drv-1', customerId: 'cust-2' },
    ])
  })

  it('查詢時帶入正確的 select_columns', async () => {
    mockDb.query.mockResolvedValue([])
    await getDriverCustomerMappings()
    expect(mockDb.query).toHaveBeenCalledWith(
      'x_driver_customer',
      expect.objectContaining({
        select_columns: expect.arrayContaining(['id', 'driver_id', 'customer_id']),
      })
    )
  })

  it('driver_id 為 [id, name] 陣列時正確取出 id', async () => {
    mockDb.query.mockResolvedValue([
      { id: 'dc-1', driver_id: ['drv-1', '王司機'], customer_id: ['cust-1', '陳先生'] },
    ])
    const result = await getDriverCustomerMappings()
    expect(result[0].driverId).toBe('drv-1')
    expect(result[0].customerId).toBe('cust-1')
  })

  it('API 失敗時回傳空陣列', async () => {
    mockDb.query.mockRejectedValue(new Error('fail'))
    expect(await getDriverCustomerMappings()).toEqual([])
  })
})

describe('addDriverCustomerMapping', () => {
  it('POST 正確的 driver_id、customer_id、created_by', async () => {
    mockDb.insert.mockResolvedValue({ id: 'dc-new' })
    await addDriverCustomerMapping('drv-1', 'cust-1', 'admin')
    expect(mockDb.insert).toHaveBeenCalledWith(
      'x_driver_customer',
      expect.objectContaining({ driver_id: 'drv-1', customer_id: 'cust-1', created_by: 'admin' })
    )
  })

  it('insert 時包含 created_at 時間戳', async () => {
    mockDb.insert.mockResolvedValue({ id: 'dc-new' })
    await addDriverCustomerMapping('drv-1', 'cust-1', 'admin')
    const payload = mockDb.insert.mock.calls[0][1]
    expect(payload.created_at).toBeDefined()
  })

  it('回傳格式化後的新關聯物件', async () => {
    mockDb.insert.mockResolvedValue({ id: 'dc-new', driver_id: 'drv-1', customer_id: 'cust-1' })
    const result = await addDriverCustomerMapping('drv-1', 'cust-1', 'admin')
    expect(result).toMatchObject({ id: 'dc-new', driverId: 'drv-1', customerId: 'cust-1' })
  })
})

describe('deleteDriverCustomerMapping', () => {
  it('呼叫 db.delete 傳入正確 id', async () => {
    mockDb.delete.mockResolvedValue({})
    await deleteDriverCustomerMapping('dc-1')
    expect(mockDb.delete).toHaveBeenCalledWith('x_driver_customer', 'dc-1')
  })
})

describe('getCustomersByDriver', () => {
  const mappings = [
    { id: 'dc-1', driverId: 'drv-1', customerId: 'cust-1' },
    { id: 'dc-2', driverId: 'drv-1', customerId: 'cust-2' },
    { id: 'dc-3', driverId: 'drv-2', customerId: 'cust-3' },
  ]

  it('回傳指定司機的客戶 ID 陣列', () => {
    const result = getCustomersByDriver('drv-1', mappings)
    expect(result).toEqual(['cust-1', 'cust-2'])
  })

  it('司機無對應客戶時回傳空陣列', () => {
    expect(getCustomersByDriver('drv-99', mappings)).toEqual([])
  })

  it('mappings 為空陣列時回傳空陣列', () => {
    expect(getCustomersByDriver('drv-1', [])).toEqual([])
  })

  it('不同司機的客戶不混入', () => {
    const result = getCustomersByDriver('drv-2', mappings)
    expect(result).toEqual(['cust-3'])
    expect(result).not.toContain('cust-1')
  })
})
