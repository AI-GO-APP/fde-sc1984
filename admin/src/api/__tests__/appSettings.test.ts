import { describe, it, expect, vi, beforeEach } from 'vitest'

// mock db
const mockDb = {
  query: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
}
vi.mock('../client', () => ({ db: mockDb }))

const { getCutoffTime, updateCutoffTime, getSetting, updateSetting, createCutoffTime } = await import('../appSettings')

beforeEach(() => vi.clearAllMocks())

// ─── 底層：getSetting ───

describe('getSetting', () => {
  it('查詢時帶入正確的 key filter', async () => {
    mockDb.query.mockResolvedValue([])
    await getSetting('some_key')
    expect(mockDb.query).toHaveBeenCalledWith(
      'x_app_settings',
      expect.objectContaining({
        filters: expect.arrayContaining([
          expect.objectContaining({ column: 'key', op: 'eq', value: 'some_key' }),
        ]),
      })
    )
  })

  it('有設定時回傳 { id, value }', async () => {
    mockDb.query.mockResolvedValue([{ id: 'setting-1', key: 'some_key', value: 'some_value' }])
    const result = await getSetting('some_key')
    expect(result).toEqual({ id: 'setting-1', value: 'some_value' })
  })

  it('無結果時回傳 null', async () => {
    mockDb.query.mockResolvedValue([])
    const result = await getSetting('some_key')
    expect(result).toBeNull()
  })

  it('API 失敗時回傳 null（不噴錯）', async () => {
    mockDb.query.mockRejectedValue(new Error('network error'))
    const result = await getSetting('some_key')
    expect(result).toBeNull()
  })
})

// ─── 底層：updateSetting ───

describe('updateSetting', () => {
  it('PATCH 正確的 id、value、updatedBy', async () => {
    mockDb.update.mockResolvedValue({})
    await updateSetting('setting-1', 'new_value', 'admin')
    expect(mockDb.update).toHaveBeenCalledWith(
      'x_app_settings',
      'setting-1',
      expect.objectContaining({ value: 'new_value', updated_by: 'admin' })
    )
  })

  it('寫入時包含 updated_at 時間戳', async () => {
    mockDb.update.mockResolvedValue({})
    await updateSetting('setting-1', 'new_value', 'admin')
    const payload = mockDb.update.mock.calls[0][2]
    expect(payload.updated_at).toBeDefined()
    expect(typeof payload.updated_at).toBe('string')
  })

  it('寫入失敗時 throw', async () => {
    mockDb.update.mockRejectedValue(new Error('db error'))
    await expect(updateSetting('setting-1', 'new_value', 'admin')).rejects.toThrow()
  })
})

// ─── 高層介面：getCutoffTime ───

describe('getCutoffTime', () => {
  it('有設定時回傳 { id, value }', async () => {
    mockDb.query.mockResolvedValue([{ id: 'setting-1', key: 'order_cutoff_time', value: '22:00' }])
    const result = await getCutoffTime()
    expect(result).toEqual({ id: 'setting-1', value: '22:00' })
  })

  it('查詢時帶入正確的 filter', async () => {
    mockDb.query.mockResolvedValue([])
    await getCutoffTime()
    expect(mockDb.query).toHaveBeenCalledWith(
      'x_app_settings',
      expect.objectContaining({
        filters: expect.arrayContaining([
          expect.objectContaining({ column: 'key', op: 'eq', value: 'order_cutoff_time' }),
        ]),
      })
    )
  })

  it('無設定時回傳 null', async () => {
    mockDb.query.mockResolvedValue([])
    const result = await getCutoffTime()
    expect(result).toBeNull()
  })

  it('API 失敗時回傳 null（不噴錯）', async () => {
    mockDb.query.mockRejectedValue(new Error('network error'))
    const result = await getCutoffTime()
    expect(result).toBeNull()
  })
})

// ─── 高層介面：createCutoffTime ───

describe('createCutoffTime', () => {
  it('insert 正確的 key、value、updated_by', async () => {
    mockDb.insert.mockResolvedValue({ id: 'setting-new' })
    await createCutoffTime('22:00', 'admin')
    expect(mockDb.insert).toHaveBeenCalledWith(
      'x_app_settings',
      expect.objectContaining({
        key: 'order_cutoff_time',
        value: '22:00',
        updated_by: 'admin',
      })
    )
  })

  it('回傳含 id 與 value 的物件', async () => {
    mockDb.insert.mockResolvedValue({ id: 'setting-new' })
    const result = await createCutoffTime('22:00', 'admin')
    expect(result).toEqual({ id: 'setting-new', value: '22:00' })
  })

  it('insert 失敗時 throw', async () => {
    mockDb.insert.mockRejectedValue(new Error('db error'))
    await expect(createCutoffTime('22:00', 'admin')).rejects.toThrow()
  })
})

// ─── 高層介面：updateCutoffTime ───

describe('updateCutoffTime', () => {
  it('PATCH 正確的 id 與 value', async () => {
    mockDb.update.mockResolvedValue({})
    await updateCutoffTime('setting-1', '22:00', 'admin')
    expect(mockDb.update).toHaveBeenCalledWith(
      'x_app_settings',
      'setting-1',
      expect.objectContaining({ value: '22:00', updated_by: 'admin' })
    )
  })

  it('寫入時包含 updated_at 時間戳', async () => {
    mockDb.update.mockResolvedValue({})
    await updateCutoffTime('setting-1', '20:00', 'admin')
    const payload = mockDb.update.mock.calls[0][2]
    expect(payload.updated_at).toBeDefined()
    expect(typeof payload.updated_at).toBe('string')
  })
})
