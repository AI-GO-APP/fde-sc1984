/**
 * 訂單明細編輯 + 稽核記錄
 */
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useUIStore } from '../store/useUIStore'
import { getOrderLines } from '../api/saleOrders'
import { updateOrderLineWithAudit, getOrderAuditLog } from '../api/orderAuditLog'
import { getAdminUser } from '../api/auth'

interface OrderLine {
  id: string
  name: string
  productUomQty: number
}

interface AuditRecord {
  id: string
  orderId: string
  field: string
  oldValue: string
  newValue: string
  changedBy: string
  changedAt: string
  note: string
}

export default function OrderEditPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { withLoading, toast } = useUIStore()
  const [lines, setLines] = useState<OrderLine[]>([])
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [auditLog, setAuditLog] = useState<AuditRecord[]>([])

  const currentUser = getAdminUser()?.name || '未知使用者'

  const load = async () => {
    if (!orderId) return
    const rows = await getOrderLines(orderId)
    setLines(rows)
    const log = await getOrderAuditLog(orderId)
    setAuditLog(log as AuditRecord[])
  }

  useEffect(() => { load() }, [orderId])

  const handleSave = async (line: OrderLine) => {
    const raw = edits[line.id]
    if (raw === undefined) return
    const newQty = parseFloat(raw)
    if (isNaN(newQty)) {
      toast('error', '請輸入有效數量')
      return
    }
    await withLoading(async () => {
      await updateOrderLineWithAudit(line.id, orderId!, line.productUomQty, newQty, currentUser)
      setEdits(prev => {
        const next = { ...prev }
        delete next[line.id]
        return next
      })
      await load()
    }, '儲存中...', '已儲存')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader title={`訂單明細編輯`} showBack>
        <p className="text-sm text-gray-400 pt-1">訂單 ID：{orderId}</p>
      </PageHeader>

      <div className="p-6 max-w-[1200px] mx-auto w-full space-y-6">
        {/* 明細編輯 */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="font-medium text-gray-700">訂單明細</p>
          </div>
          {lines.length === 0 ? (
            <div className="text-center text-gray-400 py-10">無明細資料</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">品名</th>
                  <th className="px-4 py-3 text-right w-36">下單數量</th>
                  <th className="px-4 py-3 text-right w-48">修改數量</th>
                  <th className="px-4 py-3 text-right w-24">操作</th>
                </tr>
              </thead>
              <tbody>
                {lines.map(line => (
                  <tr key={line.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{line.name}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{line.productUomQty}</td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={edits[line.id] ?? ''}
                        placeholder={String(line.productUomQty)}
                        onChange={e => setEdits(prev => ({ ...prev, [line.id]: e.target.value }))}
                        className="w-28 text-right border border-gray-200 rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleSave(line)}
                        disabled={edits[line.id] === undefined}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
                        儲存
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 稽核記錄 */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="font-medium text-gray-700">稽核記錄</p>
          </div>
          {auditLog.length === 0 ? (
            <div className="text-center text-gray-400 py-10">尚無稽核記錄</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">欄位</th>
                  <th className="px-4 py-3 text-right">舊值</th>
                  <th className="px-4 py-3 text-right">新值</th>
                  <th className="px-4 py-3 text-left">操作者</th>
                  <th className="px-4 py-3 text-left">時間</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map(r => (
                  <tr key={r.id} className="border-t border-gray-50">
                    <td className="px-4 py-2 text-gray-600">{r.field}</td>
                    <td className="px-4 py-2 text-right text-red-500">{r.oldValue}</td>
                    <td className="px-4 py-2 text-right text-green-600">{r.newValue}</td>
                    <td className="px-4 py-2 text-gray-500">{r.changedBy}</td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      {new Date(r.changedAt).toLocaleString('zh-TW')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
