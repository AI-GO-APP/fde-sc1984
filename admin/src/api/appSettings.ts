import { db } from './client'
import { TABLES } from './tables'

interface AppSetting {
  id: string
  value: string
}

export const APP_SETTING_KEYS = {
  ORDER_CUTOFF_TIME: 'order_cutoff_time',
} as const

// ─── 底層 ───

export async function getSetting(key: string): Promise<AppSetting | null> {
  try {
    const rows = await db.query<any>(TABLES.APP_SETTINGS, {
      filters: [{ column: 'key', op: 'eq', value: key }],
    })
    if (!rows || rows.length === 0) return null
    const row = rows[0]
    return { id: String(row.id), value: String(row.value) }
  } catch {
    return null
  }
}

export async function updateSetting(id: string, value: string, updatedBy: string): Promise<void> {
  try {
    await db.update(TABLES.APP_SETTINGS, id, {
      value,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    })
  } catch (err) {
    throw new Error(`updateSetting 失敗：無法更新設定（id=${id}）`, { cause: err })
  }
}

// ─── 高層介面（保留既有呼叫相容性）───

export async function getCutoffTime(): Promise<AppSetting | null> {
  return getSetting(APP_SETTING_KEYS.ORDER_CUTOFF_TIME)
}

/**
 * 更新截止時間設定。
 * 寫入失敗時會 throw，呼叫端必須自行 catch 並顯示錯誤訊息。
 * （讀取失敗靜默回 null；寫入失敗 throw，讓 UI 感知）
 */
export async function updateCutoffTime(id: string, time: string, updatedBy: string): Promise<void> {
  return updateSetting(id, time, updatedBy)
}

/**
 * 首次建立截止時間設定（x_app_settings 尚無此 key 時使用）
 * 建立後回傳 { id, value }
 * @throws 建立失敗時 throw
 */
export async function createCutoffTime(time: string, createdBy: string): Promise<{ id: string; value: string }> {
  const row = await db.insert<{ id: string }>(TABLES.APP_SETTINGS, {
    key: APP_SETTING_KEYS.ORDER_CUTOFF_TIME,
    value: time,
    updated_by: createdBy,
    updated_at: new Date().toISOString(),
  })
  return { id: String(row.id), value: time }
}
