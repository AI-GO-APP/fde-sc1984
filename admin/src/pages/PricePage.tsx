/**
 * 品項價格管理 — 顯示售價、更新價格、查看價格稽核記錄
 */
import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import { useUIStore } from '../store/useUIStore'
import { listProducts } from '../api/products'
import { updateProductPriceWithAudit, getPriceAuditLog } from '../api/priceAuditLog'
import { getAdminUser } from '../api/auth'

interface Product {
  id: string
  name: string
  listPrice: number
}

interface PriceAuditRecord {
  id: string
  productTmplId: string
  oldPrice: number
  newPrice: number
  updatedBy: string
  updatedAt: string
  batchId: string
}

export default function PricePage() {
  const { withLoading, toast } = useUIStore()
  const [products, setProducts] = useState<Product[]>([])
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [auditLog, setAuditLog] = useState<PriceAuditRecord[]>([])
  const [search, setSearch] = useState('')
  const [deliveryDate, setDeliveryDate] = useState<string>('')

  const currentUser = getAdminUser()?.name || '未知使用者'

  const load = async () => {
    const rows = await listProducts()
    setProducts(rows)
  }

  useEffect(() => { load() }, [])

  const loadAudit = async (productTmplId: string) => {
    const log = await getPriceAuditLog(productTmplId)
    setAuditLog(log as PriceAuditRecord[])
  }

  const handleSelect = (id: string) => {
    setSelectedId(id)
    loadAudit(id)
  }

  const handleSave = async (product: Product) => {
    const raw = edits[product.id]
    if (raw === undefined) return
    const newPrice = parseFloat(raw)
    if (isNaN(newPrice) || newPrice < 0) {
      toast('error', '請輸入有效價格')
      return
    }
    await withLoading(async () => {
      const { updated } = await updateProductPriceWithAudit(product.id, product.listPrice, newPrice, currentUser, deliveryDate)
      setEdits(prev => {
        const next = { ...prev }
        delete next[product.id]
        return next
      })
      await load()
      if (selectedId === product.id) await loadAudit(product.id)
      toast('success', `價格已更新，同步更新 ${updated} 筆訂單明細`)
    }, '更新中...')
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedProduct = selectedId ? products.find(p => p.id === selectedId) : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader title="品項價格管理" showBack />

      <div className="p-6 max-w-[1400px] mx-auto w-full space-y-4">
        <div className="flex gap-3 flex-wrap items-center">
          <input
            type="text"
            placeholder="搜尋品名..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 max-w-xs bg-white"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">配送日期</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={e => setDeliveryDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
            />
            {!deliveryDate && (
              <span className="text-xs text-amber-600">請選擇配送日期才能更新價格</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 產品列表 */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="font-medium text-gray-700">品項列表（{filtered.length} 筆）</p>
            </div>
            {filtered.length === 0 ? (
              <div className="text-center text-gray-400 py-10">無品項資料</div>
            ) : (
              <div className="overflow-y-auto max-h-[600px]">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-400 text-xs sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">品名</th>
                      <th className="px-4 py-3 text-right w-28">目前售價</th>
                      <th className="px-4 py-3 text-right w-36">新價格</th>
                      <th className="px-4 py-3 text-right w-20">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr
                        key={p.id}
                        onClick={() => handleSelect(p.id)}
                        className={`border-t border-gray-50 cursor-pointer transition-colors ${
                          selectedId === p.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}>
                        <td className="px-4 py-3 font-medium">{p.name}</td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {p.listPrice.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={edits[p.id] ?? ''}
                            placeholder={String(p.listPrice)}
                            onChange={e => setEdits(prev => ({ ...prev, [p.id]: e.target.value }))}
                            className="w-24 text-right border border-gray-200 rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleSave(p)}
                            disabled={edits[p.id] === undefined || !deliveryDate}
                            title={!deliveryDate ? '請先選擇配送日期' : undefined}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
                            更新
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 價格稽核記錄 */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="font-medium text-gray-700">
                {selectedProduct ? `${selectedProduct.name} — 價格稽核記錄` : '選取品項以查看稽核記錄'}
              </p>
            </div>
            {!selectedId ? (
              <div className="text-center text-gray-400 py-10">請點選左側品項</div>
            ) : auditLog.length === 0 ? (
              <div className="text-center text-gray-400 py-10">此品項尚無價格稽核記錄</div>
            ) : (
              <div className="overflow-y-auto max-h-[600px]">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-400 text-xs sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-right">舊售價</th>
                      <th className="px-4 py-3 text-right">新售價</th>
                      <th className="px-4 py-3 text-left">操作者</th>
                      <th className="px-4 py-3 text-left">時間</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog.map(r => (
                      <tr key={r.id} className="border-t border-gray-50">
                        <td className="px-4 py-2 text-right text-red-500">{r.oldPrice.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right text-green-600">{r.newPrice.toLocaleString()}</td>
                        <td className="px-4 py-2 text-gray-500">{r.updatedBy}</td>
                        <td className="px-4 py-2 text-gray-400 text-xs">
                          {new Date(r.updatedAt).toLocaleString('zh-TW')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
