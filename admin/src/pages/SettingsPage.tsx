/**
 * 系統設定頁
 * - 截止時間設定（x_app_settings）
 * - 假日管理（x_holiday_settings）
 */
import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import { useUIStore } from '../store/useUIStore'
import {
  getCutoffTime,
  updateCutoffTime,
  createCutoffTime,
} from '../api/appSettings'
import {
  fetchUpcomingHolidaysOrThrow,
  addHoliday,
  deleteHoliday,
  importMondaysOfMonth,
} from '../api/holidaySettings'

// ─── 型別 ───

interface Holiday {
  id: string
  date: string
  label: string
}

// ─── 主頁面 ───

export default function SettingsPage() {
  const { toast } = useUIStore()

  // 截止時間
  const [cutoffId, setCutoffId] = useState<string | null>(null)
  const [cutoffTime, setCutoffTime] = useState('14:00')
  const [cutoffLoading, setCutoffLoading] = useState(true)
  const [cutoffSaving, setCutoffSaving] = useState(false)

  // 假日
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [holidaysLoading, setHolidaysLoading] = useState(true)
  const [newDate, setNewDate] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [addingHoliday, setAddingHoliday] = useState(false)
  const [importingMondays, setImportingMondays] = useState(false)

  // ─── 載入截止時間 ───
  useEffect(() => {
    setCutoffLoading(true)
    getCutoffTime()
      .then(setting => {
        if (setting) {
          setCutoffId(setting.id)
          setCutoffTime(setting.value)
        }
      })
      .catch(() => toast('error', '截止時間載入失敗'))
      .finally(() => setCutoffLoading(false))
  }, [toast])

  // ─── 載入假日 ───
  const loadHolidays = () => {
    setHolidaysLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    fetchUpcomingHolidaysOrThrow(today)
      .then(rows => setHolidays(rows.sort((a, b) => a.date.localeCompare(b.date))))
      .catch(() => toast('error', '假日清單載入失敗'))
      .finally(() => setHolidaysLoading(false))
  }

  useEffect(() => { loadHolidays() }, [])

  // ─── 儲存截止時間 ───
  const handleSaveCutoff = async () => {
    setCutoffSaving(true)
    try {
      if (cutoffId) {
        await updateCutoffTime(cutoffId, cutoffTime, 'admin')
      } else {
        // 尚無設定：透過 API 層建立
        const result = await createCutoffTime(cutoffTime, 'admin')
        setCutoffId(result.id)
      }
      toast('success', `截止時間已儲存為 ${cutoffTime}`)
    } catch {
      toast('error', '截止時間儲存失敗，請稍後再試')
    } finally {
      setCutoffSaving(false)
    }
  }

  // ─── 新增假日 ───
  const handleAddHoliday = async () => {
    if (!newDate) { toast('error', '請選擇假日日期'); return }
    const label = newLabel.trim() || '假日'
    setAddingHoliday(true)
    try {
      const created = await addHoliday(newDate, label, 'admin')
      setHolidays(prev => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)))
      setNewDate('')
      setNewLabel('')
      toast('success', `已新增假日：${newDate}`)
    } catch {
      toast('error', '新增假日失敗，請稍後再試')
    } finally {
      setAddingHoliday(false)
    }
  }

  // ─── 刪除假日 ───
  const handleDeleteHoliday = async (id: string, date: string) => {
    try {
      await deleteHoliday(id)
      setHolidays(prev => prev.filter(h => h.id !== id))
      toast('success', `已刪除假日：${date}`)
    } catch {
      toast('error', '刪除假日失敗，請稍後再試')
    }
  }

  // ─── 匯入本月週一 ───
  const handleImportMondays = async () => {
    setImportingMondays(true)
    const now = new Date()
    try {
      const created = await importMondaysOfMonth(now.getFullYear(), now.getMonth() + 1, 'admin')
      if (created.length > 0) {
        loadHolidays()
        toast('success', `已匯入 ${created.length} 個週一假日`)
      } else {
        toast('success', '本月週一已全數存在，無需重複匯入')
      }
    } catch {
      toast('error', '匯入週一假日失敗')
    } finally {
      setImportingMondays(false)
    }
  }

  // ─── 渲染 ───

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader title="系統設定" showBack />

      <div className="p-6 max-w-2xl mx-auto w-full space-y-6">

        {/* 截止時間設定 */}
        <section className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">截止時間設定</h2>
          <p className="text-sm text-gray-500">超過此時間後，當日訂單將無法送出。</p>

          {cutoffLoading ? (
            <p className="text-sm text-gray-400">載入中...</p>
          ) : (
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={cutoffTime}
                onChange={e => setCutoffTime(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSaveCutoff}
                disabled={cutoffSaving}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {cutoffSaving ? '儲存中...' : '儲存'}
              </button>
            </div>
          )}
        </section>

        {/* 假日管理 */}
        <section className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">假日管理</h2>
            <button
              onClick={handleImportMondays}
              disabled={importingMondays}
              className="px-3 py-1.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50"
            >
              {importingMondays ? '匯入中...' : '匯入本月週一'}
            </button>
          </div>
          <p className="text-sm text-gray-500">設定後，訂購頁面的配送日期選擇器將自動排除這些日期。</p>

          {/* 新增表單 */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="說明（如：元旦）"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
            />
            <button
              onClick={handleAddHoliday}
              disabled={addingHoliday || !newDate}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {addingHoliday ? '新增中...' : '新增'}
            </button>
          </div>

          {/* 假日清單 */}
          {holidaysLoading ? (
            <p className="text-sm text-gray-400">載入中...</p>
          ) : holidays.length === 0 ? (
            <p className="text-sm text-gray-400">目前無設定假日</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {holidays.map(h => (
                <li key={h.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <span className="font-medium text-gray-800 text-sm">{h.date}</span>
                    <span className="text-gray-400 text-xs ml-2">{h.label}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteHoliday(h.id, h.date)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                  >
                    刪除
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>
    </div>
  )
}
