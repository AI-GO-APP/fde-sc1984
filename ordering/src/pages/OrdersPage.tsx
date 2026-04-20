/**
 * C4 訂單歷史 / 狀態頁
 * 預設按配送日期分組（每日一區塊），可切換為按下單日期分組
 */
import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useAuthStore } from '../store/useAuthStore'
import type { RawSaleOrder, RawSaleOrderLine } from '../api/client'

const stateMap: Record<string, { label: string; color: string }> = {
  draft: { label: '待處理', color: 'bg-gray-100 text-gray-600' },
  sent: { label: '已報價', color: 'bg-blue-100 text-blue-700' },
  sale: { label: '已確認', color: 'bg-green-100 text-green-700' },
  done: { label: '已完成', color: 'bg-emerald-100 text-emerald-700' },
  cancel: { label: '已取消', color: 'bg-red-100 text-red-600' },
}

/** 從 lines 或 note 中提取配送日期 */
function extractDeliveryDate(order: RawSaleOrder, lines: RawSaleOrderLine[]): string | null {
  const fromLines = lines.find(l => l.delivery_date)?.delivery_date
  if (fromLines) return fromLines
  if (order.note) {
    const match = order.note.match(/配送日期：(\d{4}-\d{2}-\d{2})/)
    if (match) return match[1]
  }
  return null
}

function getOrderDate(order: RawSaleOrder): string {
  return order.date_order?.slice(0, 10) || order.created_at?.slice(0, 10) || ''
}

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']
function formatDateHeader(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${ymd}（${DAY_NAMES[date.getDay()]}）`
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const { apiOrders, ordersLoading, loadOrders, liveProducts } = useStore()
  const { logout } = useAuthStore()
  const [sortBy, setSortBy] = useState<'delivery_date' | 'order_date'>('delivery_date')

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const getProduct = (templateId: string | null) => {
    if (!templateId) return null
    return liveProducts.find(pp => pp.id === templateId) || null
  }

  const dateGroups = useMemo(() => {
    const groups: Record<string, typeof apiOrders> = {}
    for (const apiOrder of apiOrders) {
      const key = sortBy === 'delivery_date'
        ? (extractDeliveryDate(apiOrder.raw, apiOrder.lines) ?? '未排程')
        : getOrderDate(apiOrder.raw)
      if (!groups[key]) groups[key] = []
      groups[key].push(apiOrder)
    }
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === '未排程') return 1
      if (b === '未排程') return -1
      // 配送日期：升冪（最早在上）；下單日期：降冪（最新在上）
      return sortBy === 'delivery_date' ? a.localeCompare(b) : b.localeCompare(a)
    })
    return sortedKeys.map(key => ({ date: key, orders: groups[key] }))
  }, [apiOrders, sortBy])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/order')} className="text-gray-400 hover:text-gray-600">←</button>
          <h1 className="text-lg font-bold">我的訂單</h1>
          {ordersLoading && <span className="text-xs text-gray-400 animate-pulse">載入中...</span>}
        </div>
        <button onClick={() => { logout(); navigate('/login') }} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
          登出
        </button>
      </header>

      {/* 排序切換 */}
      <div className="px-4 pt-3 pb-1 flex gap-2">
        <button
          onClick={() => setSortBy('delivery_date')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${sortBy === 'delivery_date' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          📅 配送日期
        </button>
        <button
          onClick={() => setSortBy('order_date')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${sortBy === 'order_date' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          🗓 下單日期
        </button>
      </div>

      {ordersLoading && apiOrders.length === 0 ? (
        <div className="px-4 py-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3 animate-pulse">
              <div className="flex justify-between items-start">
                <div>
                  <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
                  <div className="h-4 bg-gray-100 rounded w-24"></div>
                </div>
                <div className="h-5 bg-gray-100 rounded-full w-16"></div>
              </div>
              <div className="space-y-2 mt-3">
                <div className="h-4 bg-gray-100 rounded w-full"></div>
                <div className="h-4 bg-gray-100 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : apiOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 space-y-3">
          <span className="text-5xl">📋</span>
          <p>還沒有訂單</p>
          <button onClick={() => navigate('/order')} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
            去點餐
          </button>
        </div>
      ) : (
        <div className="px-4 py-3 space-y-5">
          {dateGroups.map(({ date, orders }) => (
            <div key={date}>
              {/* 日期區塊標頭 */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-gray-600">
                  {date === '未排程' ? '⏳ 未排程' : `${sortBy === 'delivery_date' ? '📅' : '🗓'} ${formatDateHeader(date)}`}
                </span>
                <span className="text-xs text-gray-400">{orders.length} 筆</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* 該日期的訂單列表 */}
              <div className="space-y-3">
                {orders.map(({ raw: order, lines }) => {
                  const config = stateMap[order.state] || stateMap.draft
                  const total = order.amount_total || lines.reduce((sum, l) => sum + (l.price_total || 0), 0)
                  return (
                    <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900">{order.name || `訂單 ${order.id.slice(0, 8)}`}</p>
                          <p className="text-sm text-gray-400">下單：{getOrderDate(order)}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>
                      </div>
                      {/* 品項摘要 */}
                      <div className="space-y-1">
                        {lines.slice(0, 4).map((line) => (
                          <div key={line.id} className="flex justify-between text-sm">
                            <span className="text-gray-600 truncate max-w-[60%]">
                              {line.name || getProduct(line.product_template_id)?.name || '未知品項'}
                            </span>
                            <span className="text-gray-400">
                              × {Number(line.product_uom_qty)} {getProduct(line.product_template_id)?.unit || '單位'}
                              {line.price_unit > 0 && (
                                <span className="ml-2 text-gray-600">${Math.round(Number(line.product_uom_qty) * line.price_unit)}</span>
                              )}
                            </span>
                          </div>
                        ))}
                        {lines.length > 4 && (
                          <p className="text-xs text-gray-400">...還有 {lines.length - 4} 項</p>
                        )}
                      </div>
                      {/* 底部 */}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                        <span className="text-sm text-gray-400">{lines.length} 項商品</span>
                        {total > 0 && (
                          <span className="font-bold text-primary text-lg">${Math.round(total).toLocaleString()}</span>
                        )}
                      </div>
                      {order.note && (
                        <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-1.5">📝 {order.note}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
