import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockDb = {
  query: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}
vi.mock('../client', () => ({ db: mockDb }))

const { listSupplierMappings, addSupplierMapping, deleteSupplierMapping } =
  await import('../supplierMapping')

beforeEach(() => vi.clearAllMocks())

describe('listSupplierMappings', () => {
  it('回傳格式化後的對應清單（含 id）', async () => {
    mockDb.query.mockResolvedValue([
      { id: 'sm-1', product_tmpl_id: 'tmpl-1', supplier_id: 'sup-1' },
      { id: 'sm-2', product_tmpl_id: 'tmpl-2', supplier_id: 'sup-2' },
    ])
    const result = await listSupplierMappings()
    expect(result).toEqual([
      { id: 'sm-1', productTemplateId: 'tmpl-1', supplierId: 'sup-1' },
      { id: 'sm-2', productTemplateId: 'tmpl-2', supplierId: 'sup-2' },
    ])
  })

  it('product_tmpl_id 為 [id, name] 陣列時正確取出 id', async () => {
    mockDb.query.mockResolvedValue([
      { id: 'sm-1', product_tmpl_id: ['tmpl-1', '番茄'], supplier_id: ['sup-1', '大盛'] },
    ])
    const result = await listSupplierMappings()
    expect(result[0].productTemplateId).toBe('tmpl-1')
    expect(result[0].supplierId).toBe('sup-1')
  })

  it('查詢時包含 id 欄位', async () => {
    mockDb.query.mockResolvedValue([])
    await listSupplierMappings()
    expect(mockDb.query).toHaveBeenCalledWith(
      'product_supplierinfo',
      expect.objectContaining({
        select_columns: expect.arrayContaining(['id', 'product_tmpl_id', 'supplier_id']),
      })
    )
  })

  it('API 失敗時回傳空陣列', async () => {
    mockDb.query.mockRejectedValue(new Error('fail'))
    expect(await listSupplierMappings()).toEqual([])
  })
})

describe('addSupplierMapping', () => {
  it('POST 正確的 product_tmpl_id 與 supplier_id', async () => {
    mockDb.insert.mockResolvedValue({ id: 'sm-new' })
    await addSupplierMapping('tmpl-1', 'sup-1')
    expect(mockDb.insert).toHaveBeenCalledWith(
      'product_supplierinfo',
      { product_tmpl_id: 'tmpl-1', supplier_id: 'sup-1' }
    )
  })

  it('回傳含 id 的新對應物件', async () => {
    mockDb.insert.mockResolvedValue({ id: 'sm-new', product_tmpl_id: 'tmpl-1', supplier_id: 'sup-1' })
    const result = await addSupplierMapping('tmpl-1', 'sup-1')
    expect(result.id).toBe('sm-new')
    expect(result.productTemplateId).toBe('tmpl-1')
    expect(result.supplierId).toBe('sup-1')
  })
})

describe('deleteSupplierMapping', () => {
  it('呼叫 db.delete 傳入正確 id', async () => {
    mockDb.delete.mockResolvedValue({})
    await deleteSupplierMapping('sm-1')
    expect(mockDb.delete).toHaveBeenCalledWith('product_supplierinfo', 'sm-1')
  })
})
