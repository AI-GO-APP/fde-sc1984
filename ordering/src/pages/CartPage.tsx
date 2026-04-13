/**
 * C3 購物車 / 下單確認頁
 * 串接真實 API — 建立 sale_order + sale_order_lines
 * 優化：分步驟進度回饋、Dialog loading 狀態、配送日期選擇 + /order/validate
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useAuthStore } from '../store/useAuthStore'
import { useUIStore } from '../store/useUIStore'
import ConfirmDialog from '../components/ConfirmDialog'
import { getAvailableOrderDates, formatDateOption } from '../utils/dateSelection'

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1/open/proxy'
const API_KEY = import.meta.env.VITE_API_KEY || ''

// /order/validate 走相對路徑（由 Vite proxy 轉發至 ordering backend port 3001）
// 不使用 VITE_API_BASE（那是 AI GO proxy 的路徑）
const ORDER_VALIDATE_URL = '/order/validate'

/** 從 x_holiday_settings 取得假日清單，失敗時回傳空陣列 */
async function fetchHolidays(token: string | null): Promise<string[]> {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const res = await fetch(`${API_BASE}/x_holiday_settings/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        filters: [{ column: 'date', op: 'ge', value: today }],
        select_columns: ['date'],
        limit: 200,
      }),
    })
    if (!res.ok) return []
    const rows: { date: string }[] = await res.json()
    return (rows || []).map(r => r.date).filter(Boolean)
  } catch {
    return []
  }
}

export default function CartPage() {
  const navigate = useNavigate()
  const { cart, updateCartQty, updateCartNote, removeFromCart, submitOrderAsync, liveProducts } = useStore()
  const { logout, token } = useAuthStore()
  const { showLoading, hideLoading, toast } = useUIStore()
  const [orderNote, setOrderNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 配送日期
  const [selectedDate, setSelectedDate] = useState('')
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [datesLoading, setDatesLoading] = useState(true)

  useEffect(() => {
    setDatesLoading(true)
    fetchHolidays(token).then(holidays => {
      const dates = getAvailableOrderDates(new Date(), holidays)
      setAvailableDates(dates)
      if (dates.length > 0) setSelectedDate(dates[0])
    }).finally(() => setDatesLoading(false))
  }, [token])

  // 用 LIVE 產品資料（若有），否則 fallback 至 productId
  const getProduct = (productId: string) =>
    liveProducts.find(p => p.id === productId)

  const cartProducts = cart.map(item => ({
    ...item,
    product: getProduct(item.productId),
  }))

  const handleSubmit = async () => {
    setShowConfirm(false)
    showLoading('驗證訂單中...')
    setError(null)
    try {
      // 1. 呼叫 /order/validate 驗證日期是否可下單
      try {
        const validateRes = await fetch(ORDER_VALIDATE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ delivery_date: selectedDate }),
        })

        if (!validateRes.ok) {
          if (validateRes.status >= 500) {
            // 伺服器錯誤：告知使用者但仍放行（fail-open，避免 server 問題擋單）
            console.warn('[CartPage] /order/validate 伺服器錯誤，放行下單', validateRes.status)
            // 繼續下單
          } else {
            // 4xx：伺服器明確拒絕（401, 403, 422 等）
            const errData = await validateRes.json().catch(() => ({}))
            const msg = (errData as any).message || '驗證失敗，無法送出訂單'
            toast('error', msg)
            setError(msg)
            hideLoading()
            return
          }
        } else {
          const validateData = await validateRes.json()
          if (!validateData.allowed) {
            const msg = validateData.message || '無法送出訂單'
            toast('error', msg)
            setError(msg)
            hideLoading()
            return
          }
        }
      } catch {
        // /order/validate 不存在或網路錯誤，不阻擋下單
      }

      // 2. 建立訂單
      showLoading('建立訂單中...')
      await submitOrderAsync(orderNote, (step) => showLoading(step), selectedDate)
      hideLoading()
      toast('success', '訂單已送出！')
      setSubmitted(true)
    } catch (err) {
      hideLoading()
      const msg = err instanceof Error ? err.message : '下單失敗'
      toast('error', msg)
      setError(msg)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-xs">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">訂單已送出！</h2>
          <p className="text-gray-500">我們會在備好後通知您</p>
          <div className="space-y-2 pt-4">
            <button onClick={() => navigate('/orders')} className="w-full py-3 bg-primary text-white rounded-xl font-bold">查看訂單</button>
            <button onClick={() => { setSubmitted(false); navigate('/order') }} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">繼續點餐</button>
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
    <div className="min-h-screen bg-gray-50 pb-28">
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

      <div className="px-4 py-4 space-y-3">
        {cartProducts.map(({ product, qty, note, productId }) => (
          <div key={productId} className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-medium text-gray-900">{product?.name || productId}</span>
                <span className="text-sm text-gray-400 ml-2">{product?.unit || ''}</span>
              </div>
              <button onClick={() => removeFromCart(productId)} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-500 w-10">數量</label>
              <input type="number" value={qty} min={0} step={0.1}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  if (!isNaN(val)) updateCartQty(productId, val)
                }}
                className="w-24 text-center px-2 py-1 border border-gray-200 rounded-lg bg-gray-50 font-medium" />
              <span className="text-sm text-gray-400">{product?.unit || '單位'}</span>
            </div>
            <input placeholder="備註（如：去頭尾、切小丁、不黑不爛）" value={note}
              onChange={(e) => updateCartNote(productId, e.target.value)}
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 placeholder:text-gray-300" />
          </div>
        ))}

        {/* 配送日期選擇 */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3 mt-4">
          <h3 className="font-medium text-gray-900">📅 配送日期</h3>
          {datesLoading ? (
            <p className="text-sm text-gray-400">載入日期中...</p>
          ) : availableDates.length === 0 ? (
            <p className="text-sm text-red-400">目前無可選日期，請聯繫管理員</p>
          ) : (
            <select
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {availableDates.map(d => (
                <option key={d} value={d}>{formatDateOption(d)}</option>
              ))}
            </select>
          )}
        </div>

        {/* 訂單備註 */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3 mt-4">
          <h3 className="font-medium text-gray-900">📍 訂單備註</h3>
          <div>
            <textarea placeholder="如：需要保冰配送" value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm placeholder:text-gray-300" rows={2} />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            ⚠️ {error}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!selectedDate || datesLoading}
          className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          送出訂單（{cart.length} 項）
        </button>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="確認送出訂單？"
        message={`將送出 ${cart.length} 項品項，配送日期：${formatDateOption(selectedDate)}。送出後訂單將寫入系統。`}
        confirmText="確認送出"
        variant="info"
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  )
}
