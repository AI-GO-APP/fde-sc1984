/**
 * Step 2: 採購定價 — 產生 PO + 編輯價格 + 確認定價 (draft → purchase)
 */
import { useState, useEffect, useCallback } from 'react'
import BackButton from '../components/BackButton'
import { useAdminStore } from '../store/useAdminStore'
import { updatePurchaseOrderState, updatePurchaseOrderLine, generatePurchaseOrder } from '../api/purchase'
import ConfirmDialog from '../components/ConfirmDialog'
import { shortId } from '../utils/displayHelpers'

const stateConfig: Record<string, { label: string; color: string }> = {
  draft:    { label: '待定價', color: 'bg-orange-100 text-orange-700' },
  sent:     { label: '已詢價', color: 'bg-yellow-100 text-yellow-700' },
  purchase: { label: '已確認', color: 'bg-green-100 text-green-700' },
  done:     { label: '已完成', color: 'bg-gray-100 text-gray-500' },
  cancel:   { label: '已取消', color: 'bg-red-100 text-red-500' },
}

type ConfirmAction = { type: 'generate' } | { type: 'confirmPO'; poId: string } | { type: 'savePO'; poId: string }

export default function PurchasePage() {
  const { saleOrders, purchaseOrders, loadAll } = useAdminStore()
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  // 每張 PO 的本地編輯狀態：{ lineId: { qty, price } }
  const [edits, setEdits] = useState<Record<string, Record<string, { qty: string; price: string }>>>({})

  useEffect(() => { loadAll().then(() => setLoading(false)) }, [])

  // 可產生採購單的訂單（state=sale）
  const confirmedSaleOrders = saleOrders.filter(o => o.state === 'sale')

  const updateLineEdit = useCallback((poId: string, lineId: string, field: 'qty' | 'price', value: string) => {
    setEdits(prev => ({
      ...prev,
      [poId]: {
        ...prev[poId],
        [lineId]: { ...prev[poId]?.[lineId], [field]: value },
      },
    }))
  }, [])

  const hasEdits = (poId: string) => {
    const poEdits = edits[poId]
    return poEdits && Object.keys(poEdits).length > 0
  }

  // 儲存某張 PO 的編輯
  const handleSave = async (poId: string) => {
    const poEdits = edits[poId]
    if (!poEdits) return
    setSaving(true)
    try {
      const po = purchaseOrders.find(p => p.id === poId)
      if (!po) return
      const promises = Object.entries(poEdits).map(([lineId, edit]) => {
        const originalLine = po.lines.find(l => l.id === lineId)
        if (!originalLine) return Promise.resolve()
        const data: any = {}
        if (edit.qty !== undefined) data.product_qty = parseFloat(edit.qty) || originalLine.quantity
        if (edit.price !== undefined) data.price_unit = parseFloat(edit.price) || originalLine.unitPrice
        return updatePurchaseOrderLine(lineId, data)
      })
      await Promise.all(promises)
      setEdits(prev => { const next = { ...prev }; delete next[poId]; return next })
      await loadAll(true)
    } finally {
      setSaving(false)
    }
  }

  // 產生採購單
  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await generatePurchaseOrder(confirmedSaleOrders)
      await loadAll(true)
    } catch (err) {
      alert('產生採購單失敗：' + (err instanceof Error ? err.message : '未知錯誤'))
    } finally {
      setGenerating(false)
      setConfirmAction(null)
    }
  }

  // 確認定價
  const handleConfirmPO = async (poId: string) => {
    try {
      await updatePurchaseOrderState(poId, 'purchase')
      await loadAll(true)
    } finally {
      setConfirmAction(null)
    }
  }

  const handleConfirm = async () => {
    if (!confirmAction) return
    switch (confirmAction.type) {
      case 'generate': return handleGenerate()
      case 'confirmPO': return handleConfirmPO(confirmAction.poId)
      case 'savePO': return handleSave(confirmAction.poId).then(() => setConfirmAction(null))
    }
  }

  const getDialogProps = () => {
    if (!confirmAction) return { title: '', message: '', confirmText: '' }
    switch (confirmAction.type) {
      case 'generate':
        return {
          title: '產生採購單？',
          message: `將從 ${confirmedSaleOrders.length} 筆已確認訂單彙總品項需求，建立新採購單。`,
          confirmText: '產生',
        }
      case 'confirmPO':
        return {
          title: '確認採購定價？',
          message: '此操作不可逆。確認後採購單將進入「等待收貨」階段。',
          confirmText: '確認定價',
        }
      case 'savePO':
        return {
          title: '儲存修改？',
          message: '將更新此採購單的數量與單價。',
          confirmText: '儲存',
        }
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">載入中...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-xl font-bold text-gray-900">採購定價</h1>
            <p className="text-sm text-gray-400">{purchaseOrders.length} 張採購單</p>
          </div>
        </div>
        <button
          onClick={() => setConfirmAction({ type: 'generate' })}
          disabled={generating || confirmedSaleOrders.length === 0}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            confirmedSaleOrders.length > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {generating ? '產生中...' : confirmedSaleOrders.length > 0
            ? `產生採購單（${confirmedSaleOrders.length} 筆訂單）`
            : '無可用訂單'}
        </button>
      </header>

      <div className="p-6 max-w-5xl mx-auto space-y-4">
        {purchaseOrders.length === 0 ? (
          <div className="text-center text-gray-400 py-12">尚無採購單，請先確認訂單後產生採購單。</div>
        ) : purchaseOrders.map(po => {
          const config = stateConfig[po.state] || stateConfig.draft
          const isExpanded = expanded === po.id
          const isDraft = po.state === 'draft'
          const poEdits = edits[po.id] || {}

          return (
            <div key={po.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button onClick={() => setExpanded(isExpanded ? null : po.id)}
                className="w-full px-4 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{shortId(po.name)}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>
                  </div>
                  <p className="text-sm text-gray-400">{po.date} · {po.lines.length} 品項 · {po.supplierName}</p>
                </div>
                <span className="text-gray-400 text-xl">{isExpanded ? '▾' : '▸'}</span>
              </button>
              {isExpanded && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-xs">
                        <th className="py-1 text-left">品名</th>
                        <th className="py-1 text-right w-28">數量</th>
                        <th className="py-1 text-right w-28">單價</th>
                        <th className="py-1 text-right w-24">小計</th>
                      </tr>
                    </thead>
                    <tbody>
                      {po.lines.map(line => {
                        const edit = poEdits[line.id]
                        const qty = edit?.qty !== undefined ? parseFloat(edit.qty) || 0 : line.quantity
                        const price = edit?.price !== undefined ? parseFloat(edit.price) || 0 : line.unitPrice
                        return (
                          <tr key={line.id} className="border-t border-gray-50">
                            <td className="py-1.5 font-medium">{line.name}</td>
                            <td className="py-1.5 text-right">
                              {isDraft ? (
                                <input type="number" step="0.01"
                                  value={edit?.qty ?? String(line.quantity)}
                                  onChange={e => updateLineEdit(po.id, line.id, 'qty', e.target.value)}
                                  className="w-24 text-right border border-gray-200 rounded px-2 py-1 text-sm" />
                              ) : line.quantity}
                            </td>
                            <td className="py-1.5 text-right">
                              {isDraft ? (
                                <input type="number" step="0.01"
                                  value={edit?.price ?? String(line.unitPrice)}
                                  onChange={e => updateLineEdit(po.id, line.id, 'price', e.target.value)}
                                  className="w-24 text-right border border-gray-200 rounded px-2 py-1 text-sm" />
                              ) : `$${line.unitPrice}`}
                            </td>
                            <td className="py-1.5 text-right font-bold">${(qty * price).toLocaleString()}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {isDraft && (
                    <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                      {hasEdits(po.id) && (
                        <button onClick={() => handleSave(po.id)} disabled={saving}
                          className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
                          {saving ? '儲存中...' : '💾 儲存修改'}
                        </button>
                      )}
                      <button onClick={() => setConfirmAction({ type: 'confirmPO', poId: po.id })}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                        ✓ 確認定價
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        title={getDialogProps().title}
        message={getDialogProps().message}
        confirmText={getDialogProps().confirmText}
        variant={confirmAction?.type === 'confirmPO' ? 'warning' : 'info'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}
