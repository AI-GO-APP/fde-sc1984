/**
 * A3 採購定價頁（合併成交價 + 利潤率）— 含確認 Dialog
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { products, suppliers } from '../data/mockData'
import { useStore } from '../store/useStore'
import ConfirmDialog from '../components/ConfirmDialog'

const stateLabel: Record<string, { text: string; color: string }> = {
  pending: { text: '待採購', color: 'bg-gray-100 text-gray-500' },
  priced: { text: '已定價', color: 'bg-blue-100 text-blue-700' },
  stocked: { text: '已入庫', color: 'bg-green-100 text-green-700' },
}

type ConfirmAction = { type: 'price'; productId: string } | { type: 'stock'; productId: string } | { type: 'batchPrice' } | { type: 'batchStock' }

export default function ProcurementPage() {
  const navigate = useNavigate()
  const { procurementItems, updatePurchasePrice, updateActualQty, updateMarkupRate, applyItemPricing, applyAllPricing, stockItem } = useStore()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)

  const supplierGroups = new Map<string, typeof procurementItems>()
  for (const item of procurementItems) {
    const list = supplierGroups.get(item.supplierId) || []
    list.push(item)
    supplierGroups.set(item.supplierId, list)
  }

  const pendingCount = procurementItems.filter(i => i.state === 'pending').length
  const pricedCount = procurementItems.filter(i => i.state === 'priced').length
  const stockedCount = procurementItems.filter(i => i.state === 'stocked').length

  const handleConfirm = () => {
    if (!confirmAction) return
    switch (confirmAction.type) {
      case 'price': applyItemPricing(confirmAction.productId); break
      case 'stock': stockItem(confirmAction.productId); break
      case 'batchPrice': applyAllPricing(); break
      case 'batchStock': procurementItems.filter(i => i.state === 'priced').forEach(i => stockItem(i.productId)); break
    }
    setConfirmAction(null)
  }

  const getDialogProps = () => {
    if (!confirmAction) return { title: '', message: '' }
    switch (confirmAction.type) {
      case 'price': { const item = procurementItems.find(i => i.productId === confirmAction.productId); return { title: `確認定價「${item?.productName}」？`, message: `進貨價 $${item?.purchasePrice} → 售價 $${item?.sellingPrice}（${item?.markupRate}%）` } }
      case 'stock': { const item = procurementItems.find(i => i.productId === confirmAction.productId); return { title: `確認入庫「${item?.productName}」？`, message: `實際量 ${item?.actualQty} ${item?.unit}，定價後將入庫計算。` } }
      case 'batchPrice': return { title: '批次確認所有已填價品項？', message: `將確認 ${procurementItems.filter(i => i.purchasePrice > 0 && i.state === 'pending').length} 個品項的定價。` }
      case 'batchStock': return { title: '批次入庫所有已定價品項？', message: `將入庫 ${pricedCount} 個已定價品項。` }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600">←</button>
          <div>
            <h1 className="text-xl font-bold">採購定價</h1>
            <p className="text-sm text-gray-400">{pendingCount} 待採購 · {pricedCount} 已定價 · {stockedCount} 已入庫</p>
          </div>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && procurementItems.some(i => i.purchasePrice > 0 && i.state === 'pending') && (
            <button onClick={() => setConfirmAction({ type: 'batchPrice' })} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              批次確認已填價品項
            </button>
          )}
          {pricedCount > 0 && (
            <button onClick={() => setConfirmAction({ type: 'batchStock' })} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-green-700">
              批次入庫已定價品項
            </button>
          )}
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {procurementItems.length === 0 ? (
          <div className="text-center text-gray-400 py-12 space-y-2">
            <p>尚無採購品項</p>
            <button onClick={() => navigate('/purchase-list')} className="text-primary hover:underline text-sm">先去產生採購清單 →</button>
          </div>
        ) : (
          Array.from(supplierGroups.entries()).map(([suppId, items]) => {
            const sup = suppliers.find(s => s.id === suppId)
            const groupTotal = items.reduce((sum, i) => sum + i.purchasePrice * i.actualQty, 0)
            return (
              <div key={suppId} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{sup?.ref} {sup?.name}</h3>
                    <p className="text-xs text-gray-400">{items.length} 品項</p>
                  </div>
                  <span className="text-sm font-bold text-gray-600">採購小計: ${Math.round(groupTotal).toLocaleString()}</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500 text-xs">
                      <th className="py-2 px-3 text-left font-medium w-8">#</th>
                      <th className="py-2 px-3 text-left font-medium w-16">編號</th>
                      <th className="py-2 px-3 text-left font-medium">品名</th>
                      <th className="py-2 px-3 text-right font-medium">需求量</th>
                      <th className="py-2 px-3 text-right font-medium">實際量</th>
                      <th className="py-2 px-3 text-left font-medium">單位</th>
                      <th className="py-2 px-3 text-right font-medium">成交價</th>
                      <th className="py-2 px-3 text-right font-medium">利潤率</th>
                      <th className="py-2 px-3 text-right font-medium">售價</th>
                      <th className="py-2 px-3 text-right font-medium">採購小計</th>
                      <th className="py-2 px-3 text-center font-medium">狀態/操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const { text, color } = stateLabel[item.state]
                      const subtotal = item.purchasePrice * item.actualQty
                      const prod = products.find(pp => pp.id === item.productId)
                      return (
                        <tr key={item.productId} className={`border-b border-gray-50 ${item.state === 'stocked' ? 'bg-green-50/30' : ''}`}>
                          <td className="py-2 px-3 text-gray-400 text-xs">{idx + 1}</td>
                          <td className="py-2 px-3 text-gray-400 text-xs font-mono">{prod?.defaultCode}</td>
                          <td className="py-2 px-3 font-medium">{item.productName}</td>
                          <td className="py-2 px-3 text-right text-gray-400">{item.estimatedQty.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right">
                            <input type="number" value={item.actualQty} step="0.01" min="0"
                              onChange={(e) => updateActualQty(item.productId, parseFloat(e.target.value) || 0)}
                              className="w-20 text-right px-1.5 py-1 border border-gray-200 rounded-lg bg-gray-50 text-sm"
                              disabled={item.state === 'stocked'} />
                          </td>
                          <td className="py-2 px-3 text-gray-400">{item.unit}</td>
                          <td className="py-2 px-3 text-right">
                            <input type="number" value={item.purchasePrice || ''} placeholder="$" min="0"
                              onChange={(e) => updatePurchasePrice(item.productId, parseFloat(e.target.value) || 0)}
                              className="w-20 text-right px-1.5 py-1 border border-gray-200 rounded-lg bg-gray-50 text-sm"
                              disabled={item.state === 'stocked'} />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="inline-flex items-center gap-0.5">
                              <input type="number" value={item.markupRate} step="5" min="100"
                                onChange={(e) => updateMarkupRate(item.productId, parseInt(e.target.value) || 130)}
                                className="w-14 text-right px-1 py-1 border border-gray-200 rounded-lg bg-gray-50 text-sm"
                                disabled={item.state === 'stocked'} />
                              <span className="text-gray-400 text-xs">%</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-primary">
                            {item.sellingPrice > 0 ? `$${item.sellingPrice}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-medium">
                            {subtotal > 0 ? `$${Math.round(subtotal).toLocaleString()}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {item.state === 'pending' && item.purchasePrice > 0 ? (
                              <button onClick={() => setConfirmAction({ type: 'price', productId: item.productId })}
                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">確認定價</button>
                            ) : item.state === 'priced' ? (
                              <button onClick={() => setConfirmAction({ type: 'stock', productId: item.productId })}
                                className="px-2 py-1 bg-primary text-white rounded text-xs hover:bg-green-700">入庫</button>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-full text-xs ${color}`}>{text}</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-bold border-t border-gray-200">
                      <td colSpan={3} className="py-2 px-3 text-right">小計</td>
                      <td className="py-2 px-3 text-right text-gray-600">{items.reduce((s, i) => s + i.estimatedQty, 0).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-gray-600">{items.reduce((s, i) => s + i.actualQty, 0).toFixed(2)}</td>
                      <td colSpan={4} className="py-2 px-3"></td>
                      <td className="py-2 px-3 text-right text-primary">${Math.round(groupTotal).toLocaleString()}</td>
                      <td className="py-2 px-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
          })
        )}
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        title={getDialogProps().title}
        message={getDialogProps().message}
        confirmText="確認執行"
        variant={confirmAction?.type === 'stock' || confirmAction?.type === 'batchStock' ? 'warning' : 'info'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}
