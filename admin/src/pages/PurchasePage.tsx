/**
 * Step 2: 採購管理 — 按供應商分組、需求量vs實際採購量、逐品項到貨
 */
import { useState, useMemo, useEffect, useCallback } from 'react'
import BackButton from '../components/BackButton'
import { useAdminStore } from '../store/useAdminStore'
import {
  updatePurchaseOrderLine,
  markLineReceived,
} from '../api/purchase'
import ConfirmDialog from '../components/ConfirmDialog'
import { shortId } from '../utils/displayHelpers'

type ConfirmTarget = { lineId: string; lineName: string; poId: string; actualQty: number } | null

export default function PurchasePage() {
  const { purchaseOrders, loadAll } = useAdminStore()
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget>(null)
  const [saving, setSaving] = useState(false)
  // 本地編輯：{ lineId: { actualQty, price } }
  const [edits, setEdits] = useState<Record<string, { actualQty?: string; price?: string }>>({})

  useEffect(() => { loadAll().then(() => setLoading(false)) }, [])

  const activePOs = useMemo(() =>
    purchaseOrders
      .filter(po => po.state === 'draft' || po.state === 'done')
      .sort((a, b) => (a.state === 'draft' ? -1 : 1) - (b.state === 'draft' ? -1 : 1)),
    [purchaseOrders],
  )

  const toggleCollapse = (poId: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(poId) ? next.delete(poId) : next.add(poId)
      return next
    })
  }

  const updateEdit = useCallback((lineId: string, field: 'actualQty' | 'price', value: string) => {
    setEdits(prev => ({ ...prev, [lineId]: { ...prev[lineId], [field]: value } }))
  }, [])

  // 儲存單個 line 的編輯（只有單價）
  const saveLine = async (lineId: string, originalPrice: number) => {
    const edit = edits[lineId]
    if (!edit?.price) return
    setSaving(true)
    try {
      await updatePurchaseOrderLine(lineId, {
        price_unit: parseFloat(edit.price) || originalPrice,
      })
      setEdits(prev => { const next = { ...prev }; delete next[lineId]; return next })
      await loadAll(true)
    } finally {
      setSaving(false)
    }
  }

  // 標記到貨前的驗證：實際採購量必須 > 0
  const tryMarkReceived = (lineId: string, lineName: string, poId: string) => {
    const edit = edits[lineId]
    const line = activePOs.flatMap(po => po.lines).find(l => l.id === lineId)
    const actualQty = edit?.actualQty !== undefined
      ? parseFloat(edit.actualQty)
      : (line?.actualQty || 0)

    if (!actualQty || actualQty <= 0) {
      alert('請先填入實際採購量')
      return
    }
    setConfirmTarget({ lineId, lineName, poId, actualQty })
  }

  // 標記到貨（不可逆）
  const handleMarkReceived = async () => {
    if (!confirmTarget) return
    try {
      const po = purchaseOrders.find(p => p.id === confirmTarget.poId)
      if (!po) return

      // 先儲存單價
      const edit = edits[confirmTarget.lineId]
      if (edit?.price) {
        await updatePurchaseOrderLine(confirmTarget.lineId, {
          price_unit: parseFloat(edit.price) || 0,
        })
      }

      await markLineReceived(
        confirmTarget.lineId,
        confirmTarget.poId,
        po.lines,
        confirmTarget.actualQty,
      )
      setEdits(prev => { const next = { ...prev }; delete next[confirmTarget.lineId]; return next })
      await loadAll(true)
    } finally {
      setConfirmTarget(null)
    }
  }

  const totalPending = activePOs
    .filter(po => po.state === 'draft')
    .reduce((sum, po) => sum + po.lines.filter(l => !l.received).length, 0)

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">載入中...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-xl font-bold text-gray-900">採購管理</h1>
            <p className="text-sm text-gray-400">
              {totalPending > 0 ? `${totalPending} 個品項待採購` : '全部品項已到齊'}
            </p>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto space-y-4">
        {activePOs.length === 0 ? (
          <div className="text-center text-gray-400 py-12">尚無採購單。請先在「確認訂單」確認訂單。</div>
        ) : activePOs.map(po => {
          const isCollapsed = collapsed.has(po.id)
          const receivedCount = po.lines.filter(l => l.received).length
          const totalCount = po.lines.length
          const allReceived = receivedCount === totalCount
          const isDraft = po.state === 'draft'

          return (
            <div key={po.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button onClick={() => toggleCollapse(po.id)}
                className="w-full px-4 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{po.supplierName}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      allReceived ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {allReceived ? '全部到齊' : `${receivedCount}/${totalCount} 已到`}
                    </span>
                    {!isDraft && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">已完成</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{shortId(po.name)} · {po.date}</p>
                </div>
                <span className="text-gray-400 text-xl">{isCollapsed ? '▸' : '▾'}</span>
              </button>

              {!isCollapsed && (
                <div className="border-t border-gray-100 px-4 py-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-xs">
                        <th className="py-1 text-left">品名</th>
                        <th className="py-1 text-right w-24">需求量</th>
                        <th className="py-1 text-right w-32">實際採購量</th>
                        <th className="py-1 text-right w-28">單價</th>
                        <th className="py-1 text-right w-24">小計</th>
                        <th className="py-1 text-center w-28">狀態</th>
                      </tr>
                    </thead>
                    <tbody>
                      {po.lines.map(line => {
                        const edit = edits[line.id]
                        const actualQty = edit?.actualQty !== undefined ? parseFloat(edit.actualQty) || 0 : line.actualQty
                        const price = edit?.price !== undefined ? parseFloat(edit.price) || 0 : line.unitPrice
                        const hasEdit = !!(edit?.price)

                        return (
                          <tr key={line.id} className={`border-t border-gray-50 ${line.received ? 'opacity-50' : ''}`}>
                            <td className="py-2 font-medium">{line.name}</td>
                            {/* 需求量：唯讀 + 單位 */}
                            <td className="py-2 text-right text-gray-500">
                              {line.quantity} <span className="text-xs text-gray-400">{line.uom}</span>
                            </td>
                            {/* 實際採購量：可編輯 + 單位 */}
                            <td className="py-2 text-right">
                              {isDraft && !line.received ? (
                                <div className="flex items-center justify-end gap-1">
                                  <input type="number" step="0.01" min="0"
                                    value={edit?.actualQty ?? (line.actualQty || '')}
                                    onChange={e => updateEdit(line.id, 'actualQty', e.target.value)}
                                    placeholder="填入"
                                    className="w-20 text-right border border-gray-200 rounded px-2 py-1 text-sm" />
                                  <span className="text-xs text-gray-400">{line.uom}</span>
                                </div>
                              ) : (
                                <span>{line.actualQty} <span className="text-xs text-gray-400">{line.uom}</span></span>
                              )}
                            </td>
                            {/* 單價：可編輯 */}
                            <td className="py-2 text-right">
                              {isDraft && !line.received ? (
                                <input type="number" step="0.01" min="0"
                                  value={edit?.price ?? String(line.unitPrice)}
                                  onChange={e => updateEdit(line.id, 'price', e.target.value)}
                                  className="w-24 text-right border border-gray-200 rounded px-2 py-1 text-sm" />
                              ) : `$${line.unitPrice}`}
                            </td>
                            {/* 小計 = 實際採購量 × 單價 */}
                            <td className="py-2 text-right font-bold">${Math.round(actualQty * price).toLocaleString()}</td>
                            {/* 狀態按鈕 */}
                            <td className="py-2 text-center">
                              {line.received ? (
                                <span className="text-green-600 font-medium text-xs">✓ 已到</span>
                              ) : isDraft ? (
                                <div className="flex items-center justify-center gap-1">
                                  {hasEdit && (
                                    <button onClick={() => saveLine(line.id, line.unitPrice)}
                                      disabled={saving}
                                      className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium hover:bg-orange-200 disabled:opacity-50">
                                      💾
                                    </button>
                                  )}
                                  <button onClick={() => tryMarkReceived(line.id, line.name, po.id)}
                                    className="px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700">
                                    已採購到
                                  </button>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">待採購</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
        title="確認已採購到？"
        message={`「${confirmTarget?.lineName}」實際採購量 ${confirmTarget?.actualQty}。此操作不可逆。`}
        confirmText="確認到貨"
        variant="warning"
        onConfirm={handleMarkReceived}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  )
}
