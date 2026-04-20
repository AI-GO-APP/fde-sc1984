/**
 * C3 購物車 / 下單確認頁
 * 購物車按配送日期分組，每個日期有獨立的送出按鈕
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useAuthStore } from '../store/useAuthStore'
import { useUIStore } from '../store/useUIStore'
import ConfirmDialog from '../components/ConfirmDialog'
import { formatDateOption } from '../utils/dateSelection'

const ORDER_VALIDATE_URL = '/order/validate'

export default function CartPage() {
  const navigate = useNavigate()
  const { cart, updateCartQty, updateCartNote, removeFromCart, submitOrderForDate, liveProducts } = useStore()
  const { logout, token } = useAuthStore()
  const { showLoading, hideLoading, toast } = useUIStore()

  // 每個日期組的備註
  const [groupNotes, setGroupNotes] = useState<Record<string, string>>({})
  // 正在確認送出的日期（null = 未開啟）
  const [confirmingDate, setConfirmingDate] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  // 已送出成功的日期
  const [submittedDates, setSubmittedDates] = useState<string[]>([])

  const getProduct = (productId: string) =>
    liveProducts.find(p => p.id === productId)

  // 依配送日期分組，各組按日期升冪排序
  const dateGroups: { date: string; items: typeof cart }[] = (() => {
    const groups: Record<string, typeof cart> = {}
    for (const item of cart) {
      const key = item.deliveryDate || ''
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    }
    return Object.entries(groups)
      .sort(([a], [b]) => {
        if (!a) return 1
        if (!b) return -1
        return a.localeCompare(b)
      })
      .map(([date, items]) => ({ date, items }))
  })()

  const handleSubmit = async (date: string) => {
    setConfirmingDate(null)
    showLoading('驗證訂單中...')
    setErrors(prev => ({ ...prev, [date]: '' }))
    try {
      // 驗證日期
      try {
        const validateRes = await fetch(ORDER_VALIDATE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ delivery_date: date }),
        })
        if (!validateRes.ok) {
          if (validateRes.status < 500) {
            const errData = await validateRes.json().catch(() => ({}))
            const msg = (errData as { message?: string }).message || '驗證失敗，無法送出訂單'
            toast('error', msg)
            setErrors(prev => ({ ...prev, [date]: msg }))
            hideLoading()
            return
          }
        } else {
          const validateData = await validateRes.json()
          if (!validateData.allowed) {
            const msg = validateData.message || '無法送出訂單'
            toast('error', msg)
            setErrors(prev => ({ ...prev, [date]: msg }))
            hideLoading()
            return
          }
        }
      } catch {
        // validate 不存在或網路錯誤，不阻擋
      }

      showLoading('建立訂單中...')
      await submitOrderForDate(date, groupNotes[date] || '', step => showLoading(step))
      hideLoading()
      toast('success', `${formatDateOption(date)} 訂單已送出！`)
      setSubmittedDates(prev => [...prev, date])
    } catch (err) {
      hideLoading()
      const msg = err instanceof Error ? err.message : '下單失敗'
      toast('error', msg)
      setErrors(prev => ({ ...prev, [date]: msg }))
    }
  }

  // 全部已送出
  if (cart.length === 0 && submittedDates.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-xs">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">訂單已送出！</h2>
          <p className="text-gray-500">共 {submittedDates.length} 筆訂單已寫入系統</p>
          <div className="space-y-2 pt-4">
            <button onClick={() => navigate('/orders')} className="w-full py-3 bg-primary text-white rounded-xl font-bold">查看訂單</button>
            <button onClick={() => { setSubmittedDates([]); navigate('/order') }} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">繼續點餐</button>
          </div>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <span className="text-5xl">🛒</span>
          <p className="text-gray-500">購物車是空的</p>
          <button onClick={() => navigate('/order')} className="px-6 py-2 bg-primary text-white rounded-xl font-medium">去點餐</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/order')} className="text-gray-400 hover:text-gray-600">←</button>
          <h1 className="text-lg font-bold">確認訂單</h1>
          <span className="text-sm text-gray-400">({cart.length} 項)</span>
        </div>
        <button onClick={() => { logout(); navigate('/login') }} className="ml-auto text-sm text-gray-400 hover:text-red-500 transition-colors">
          登出
        </button>
      </header>

      <div className="px-4 py-4 space-y-4">
        {dateGroups.map(({ date, items }) => {
          const dateLabel = date ? formatDateOption(date) : '⚠️ 未指定配送日期'
          const groupNote = groupNotes[date] || ''
          const groupErr = errors[date]
          const alreadySubmitted = submittedDates.includes(date)

          return (
            <div key={date} className={`rounded-2xl border overflow-hidden ${alreadySubmitted ? 'opacity-50' : 'border-gray-100'}`}>
              {/* 日期標頭 */}
              <div className="bg-green-50 border-b border-green-100 px-4 py-3 flex items-center justify-between">
                <span className="font-bold text-green-800 text-sm">📅 {dateLabel}</span>
                {alreadySubmitted && <span className="text-xs text-green-600 font-medium">✅ 已送出</span>}
                <span className="text-xs text-gray-500">{items.length} 項</span>
              </div>

              {/* 品項列表 */}
              <div className="bg-white space-y-0 divide-y divide-gray-50">
                {items.map(({ productId, qty, note, deliveryDate }) => {
                  const product = getProduct(productId)
                  return (
                    <div key={productId} className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-gray-900">{product?.name || productId}</span>
                          <span className="text-sm text-gray-400 ml-2">{product?.unit || ''}</span>
                        </div>
                        <button onClick={() => removeFromCart(productId, deliveryDate)} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-500 w-10">數量</label>
                        <input type="number" value={qty} min={0} step={0.1}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value)
                            if (!isNaN(val)) updateCartQty(productId, deliveryDate, val)
                          }}
                          className="w-24 text-center px-2 py-1 border border-gray-200 rounded-lg bg-gray-50 font-medium" />
                        <span className="text-sm text-gray-400">{product?.unit || '單位'}</span>
                      </div>
                      <input placeholder="備註（如：去頭尾、切小丁）" value={note}
                        onChange={(e) => updateCartNote(productId, deliveryDate, e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 placeholder:text-gray-300" />
                    </div>
                  )
                })}
              </div>

              {/* 訂單備註 + 送出 */}
              {!alreadySubmitted && (
                <div className="bg-white border-t border-gray-100 p-4 space-y-3">
                  <textarea
                    placeholder="訂單備註（如：需要保冰配送）"
                    value={groupNote}
                    onChange={(e) => setGroupNotes(prev => ({ ...prev, [date]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm placeholder:text-gray-300"
                    rows={2}
                  />
                  {groupErr && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
                      ⚠️ {groupErr}
                    </div>
                  )}
                  <button
                    onClick={() => setConfirmingDate(date)}
                    disabled={!date}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    確定送出（{items.length} 項）
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ConfirmDialog
        open={confirmingDate !== null}
        title="確認送出訂單？"
        message={confirmingDate
          ? `將送出 ${dateGroups.find(g => g.date === confirmingDate)?.items.length ?? 0} 項品項，配送日期：${formatDateOption(confirmingDate)}。送出後訂單將寫入系統。`
          : ''}
        confirmText="確認送出"
        variant="info"
        onConfirm={() => confirmingDate && handleSubmit(confirmingDate)}
        onCancel={() => setConfirmingDate(null)}
      />
    </div>
  )
}
