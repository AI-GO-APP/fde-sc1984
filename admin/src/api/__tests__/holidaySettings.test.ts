import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockDb = {
  query: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}
vi.mock('../client', () => ({ db: mockDb }))

const { getUpcomingHolidays, fetchUpcomingHolidaysOrThrow, addHoliday, deleteHoliday, importMondaysOfMonth } =
  await import('../holidaySettings')

beforeEach(() => vi.clearAllMocks())

describe('getUpcomingHolidays', () => {
  it('回傳 fromDate 之後的假日', async () => {
    mockDb.query.mockResolvedValue([
      { id: 'h-1', date: '2026-04-07', label: '週一' },
      { id: 'h-2', date: '2026-04-14', label: '週一' },
    ])
    const result = await getUpcomingHolidays('2026-04-02')
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ id: 'h-1', date: '2026-04-07' })
  })

  it('查詢時帶入 fromDate 的 ge filter', async () => {
    mockDb.query.mockResolvedValue([])
    await getUpcomingHolidays('2026-04-02')
    expect(mockDb.query).toHaveBeenCalledWith(
      'x_holiday_settings',
      expect.objectContaining({
        filters: expect.arrayContaining([
          expect.objectContaining({ column: 'date', op: 'ge', value: '2026-04-02' }),
        ]),
      })
    )
  })

  it('無假日時回傳空陣列', async () => {
    mockDb.query.mockResolvedValue([])
    expect(await getUpcomingHolidays('2026-04-02')).toEqual([])
  })

  it('API 失敗時回傳空陣列（不噴錯）', async () => {
    mockDb.query.mockRejectedValue(new Error('fail'))
    expect(await getUpcomingHolidays('2026-04-02')).toEqual([])
  })
})

describe('fetchUpcomingHolidaysOrThrow', () => {
  it('正常時回傳假日陣列', async () => {
    mockDb.query.mockResolvedValue([
      { id: 'h-1', date: '2026-04-07', label: '週一' },
      { id: 'h-2', date: '2026-04-14', label: '週一' },
    ])
    const result = await fetchUpcomingHolidaysOrThrow('2026-04-02')
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ id: 'h-1', date: '2026-04-07', label: '週一' })
  })

  it('API 失敗時 throw（不吞錯）', async () => {
    mockDb.query.mockRejectedValue(new Error('db error'))
    await expect(fetchUpcomingHolidaysOrThrow('2026-04-02')).rejects.toThrow('db error')
  })
})

describe('addHoliday', () => {
  it('POST 正確的 date、label、created_by', async () => {
    mockDb.insert.mockResolvedValue({ id: 'h-new' })
    await addHoliday('2026-04-07', '週一', 'admin')
    expect(mockDb.insert).toHaveBeenCalledWith(
      'x_holiday_settings',
      expect.objectContaining({ date: '2026-04-07', label: '週一', created_by: 'admin' })
    )
  })

  it('回傳新建的假日物件（含 id）', async () => {
    mockDb.insert.mockResolvedValue({ id: 'h-new', date: '2026-04-07', label: '週一' })
    const result = await addHoliday('2026-04-07', '週一', 'admin')
    expect(result.id).toBe('h-new')
  })

  it('insert 時包含 created_at 時間戳', async () => {
    mockDb.insert.mockResolvedValue({ id: 'h-new' })
    await addHoliday('2026-04-07', '週一', 'admin')
    const payload = mockDb.insert.mock.calls[0][1]
    expect(payload.created_at).toBeDefined()
  })
})

describe('deleteHoliday', () => {
  it('呼叫 db.delete 傳入正確 id', async () => {
    mockDb.delete.mockResolvedValue({})
    await deleteHoliday('h-1')
    expect(mockDb.delete).toHaveBeenCalledWith('x_holiday_settings', 'h-1')
  })
})

describe('importMondaysOfMonth', () => {
  it('2026 年 4 月有 4 個週一，呼叫 4 次 addHoliday', async () => {
    mockDb.insert.mockResolvedValue({ id: 'h-x' })
    await importMondaysOfMonth(2026, 4, 'admin')
    expect(mockDb.insert).toHaveBeenCalledTimes(4)
  })

  it('每次 insert 都帶入正確的週一日期', async () => {
    mockDb.insert.mockResolvedValue({ id: 'h-x' })
    await importMondaysOfMonth(2026, 4, 'admin')
    const insertedDates = mockDb.insert.mock.calls.map((c: any) => c[1].date)
    expect(insertedDates).toEqual(['2026-04-06', '2026-04-13', '2026-04-20', '2026-04-27'])
  })

  it('回傳所有建立的假日陣列', async () => {
    mockDb.insert
      .mockResolvedValueOnce({ id: 'h-1' })
      .mockResolvedValueOnce({ id: 'h-2' })
      .mockResolvedValueOnce({ id: 'h-3' })
      .mockResolvedValueOnce({ id: 'h-4' })
    const result = await importMondaysOfMonth(2026, 4, 'admin')
    expect(result).toHaveLength(4)
  })
})
