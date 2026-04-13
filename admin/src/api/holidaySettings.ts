import { db } from './client'
import { getMondaysOfMonth } from '../utils/dateSelection'
import { TABLES } from './tables'

interface Holiday {
  id: string
  date: string
  label: string
}

export async function getUpcomingHolidays(fromDate: string): Promise<Holiday[]> {
  try {
    const rows = await db.query<any>(TABLES.HOLIDAY_SETTINGS, {
      filters: [{ column: 'date', op: 'ge', value: fromDate }],
    })
    return (rows || []).map((r: any) => ({
      id: String(r.id),
      date: String(r.date),
      label: String(r.label),
    }))
  } catch {
    return []
  }
}

/**
 * 給 UI 用的版本：失敗時 throw，讓 UI 可以顯示錯誤。
 * （getUpcomingHolidays 靜默回傳空陣列，適合背景預載；此版本適合需要感知錯誤的場景）
 */
export async function fetchUpcomingHolidaysOrThrow(fromDate: string): Promise<Holiday[]> {
  const rows = await db.query<any>(TABLES.HOLIDAY_SETTINGS, {
    filters: [{ column: 'date', op: 'ge', value: fromDate }],
    order_by: [{ column: 'date', direction: 'asc' }],
    select_columns: ['id', 'date', 'label'],
  })
  return (rows || []).map((r: any) => ({
    id: String(r.id),
    date: String(r.date),
    label: String(r.label || ''),
  }))
}

/**
 * 新增假日。寫入失敗時會 throw，呼叫端必須自行 catch 並顯示錯誤訊息。
 */
export async function addHoliday(date: string, label: string, createdBy: string): Promise<Holiday> {
  try {
    const row = await db.insert<any>(TABLES.HOLIDAY_SETTINGS, {
      date,
      label,
      created_by: createdBy,
      created_at: new Date().toISOString(),
    })
    return {
      id: String(row.id),
      date: row.date ?? date,
      label: row.label ?? label,
    }
  } catch (err) {
    throw new Error(`addHoliday 失敗：無法新增假日（date=${date}）`, { cause: err })
  }
}

/**
 * 刪除假日。寫入失敗時會 throw，呼叫端必須自行 catch 並顯示錯誤訊息。
 */
export async function deleteHoliday(id: string): Promise<void> {
  try {
    await db.delete(TABLES.HOLIDAY_SETTINGS, id)
  } catch (err) {
    throw new Error(`deleteHoliday 失敗：無法刪除假日（id=${id}）`, { cause: err })
  }
}

export async function importMondaysOfMonth(year: number, month: number, createdBy: string): Promise<Holiday[]> {
  const mondays = getMondaysOfMonth(year, month)
  const results = await Promise.allSettled(
    mondays.map(date => addHoliday(date, '週一', createdBy))
  )
  return results
    .filter((r): r is PromiseFulfilledResult<Holiday> => r.status === 'fulfilled')
    .map(r => r.value)
}
