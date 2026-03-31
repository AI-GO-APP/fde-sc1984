/**
 * Step 3: 入庫收貨 — 逐張 PO 確認收貨 (purchase → done)
 */
import { useState, useEffect } from 'react'
import BackButton from '../components/BackButton'
import { useAdminStore } from '../store/useAdminStore'
import { updatePurchaseOrderState } from '../api/purchase'
import ConfirmDialog from '../components/ConfirmDialog'
import { shortId } from '../utils/displayHelpers'

export default function ReceivingPage() {
  const { purchaseOrders, loadPurchases } = useAdminStore()
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  useEffect(() => { loadPurchases().then(() => setLoading(false)) }, [])

  // 只顯示 state=purchase 的（可收貨），但也允許看 done 的
  const receivable = purchaseOrders.filter(o => o.state === 'purchase' || o.state === 'done')
    .sort((a, b) => (a.state === 'purchase' ? -1 : 1) - (b.state === 'purchase' ? -1 : 1))

  const handleConfirm = async () => {
    if (!confirmId) return
    try {
      await updatePurchaseOrderState(confirmId, 'done')
      await loadPurchases(true)
    } finally {
      setConfirmId(null)
    }
  }

  const confirmPO = purchaseOrders.find(o => o.id === confirmId)

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">載入中...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-xl font-bold text-gray-900">入庫收貨</h1>
            <p className="text-sm text-gray-400">
              {purchaseOrders.filter(o => o.state === 'purchase').length} 筆待收貨
            </p>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-5xl mx-auto space-y-3">
        {receivable.length === 0 ? (
          <div className="text-center text-gray-400 py-12">目前沒有待收貨的採購單</div>
        ) : receivable.map(po => {
          const isExpanded = expanded === po.id
          const canReceive = po.state === 'purchase'
          return (
            <div key={po.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button onClick={() => setExpanded(isExpanded ? null : po.id)}
                className="w-full px-4 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{shortId(po.name)}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${canReceive ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                      {canReceive ? '待收貨' : '已入庫'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{po.date} · {po.lines.length} 品項 · {po.supplierName}</p>
                </div>
                <div className="flex items-center gap-2">
                  {canReceive && (
                    <button onClick={e => { e.stopPropagation(); setConfirmId(po.id) }}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                      確認收貨
                    </button>
                  )}
                  <span className="text-gray-400 text-xl">{isExpanded ? '▾' : '▸'}</span>
                </div>
              </button>
              {isExpanded && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-xs">
                        <th className="py-1 text-left">品名</th>
                        <th className="py-1 text-right">數量</th>
                        <th className="py-1 text-right">單價</th>
                        <th className="py-1 text-right">小計</th>
                      </tr>
                    </thead>
                    <tbody>
                      {po.lines.map(line => (
                        <tr key={line.id} className="border-t border-gray-50">
                          <td className="py-1.5 font-medium">{line.name}</td>
                          <td className="py-1.5 text-right">{line.quantity}</td>
                          <td className="py-1.5 text-right text-gray-500">${line.unitPrice}</td>
                          <td className="py-1.5 text-right font-bold">${line.subtotal.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ConfirmDialog
        open={!!confirmId}
        title="確認收貨入庫？"
        message={`採購單 ${shortId(confirmPO?.name)} 將標記為「已入庫」。此操作不可逆。`}
        confirmText="確認收貨"
        variant="warning"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  )
}
