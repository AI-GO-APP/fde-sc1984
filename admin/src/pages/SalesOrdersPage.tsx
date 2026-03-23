/**
 * A6 Sales Orders - with search, filter, select, batch, pagination, oversell check
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { customers } from '../data/mockData'
import { useStore } from '../store/useStore'
import ConfirmDialog from '../components/ConfirmDialog'
import SearchInput from '../components/SearchInput'
import StatusDropdown from '../components/StatusDropdown'
import Pagination from '../components/Pagination'
import { usePrint, PrintArea } from '../components/PrintProvider'
import SalesInvoicePrint from '../templates/SalesInvoicePrint'

const stateOptions = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
]

const stateConfig: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Pending',   color: 'bg-orange-100 text-orange-700' },
  allocated: { label: 'Pending',   color: 'bg-orange-100 text-orange-700' },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-700' },
  shipped:   { label: 'Shipped',   color: 'bg-blue-100 text-blue-700' },
  delivered: { label: 'Delivered', color: 'bg-gray-100 text-gray-600' },
}

const PAGE_SIZE = 10

export default function SalesOrdersPage() {
  const navigate = useNavigate()
  const { orders, stockItems, updateAllocatedQty, confirmOrder } = useStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [confirmAction, setConfirmAction] = useState<{ type: 'single' | 'batch'; orderId?: string } | null>(null)
  const [page, setPage] = useState(1)
  const { contentRef, print: handlePrint } = usePrint()

  const getStock = (productId: string) => stockItems.find(s => s.productId === productId)
  const getPrice = (productId: string) => getStock(productId)?.sellingPrice || 0
  const getStockQty = (productId: string) => getStock(productId)?.qty || 0

  const filtered = useMemo(() => {
    let list = orders
    if (filter !== 'all') list = list.filter(o => o.state === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(o => {
        const cust = customers.find(c => c.id === o.customerId)
        return o.id.toLowerCase().includes(q) ||
          cust?.name.toLowerCase().includes(q) ||
          cust?.ref.toLowerCase().includes(q)
      })
    }
    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [orders, filter, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleOrder = (id: string) => {
    setSelectedOrders(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }
  const selectAll = () => {
    if (selectedOrders.size === filtered.length) setSelectedOrders(new Set())
    else setSelectedOrders(new Set(filtered.map(o => o.id)))
  }

  const handleConfirm = () => {
    if (!confirmAction) return
    if (confirmAction.type === 'single' && confirmAction.orderId) {
      confirmOrder(confirmAction.orderId)
    } else if (confirmAction.type === 'batch') {
      for (const id of selectedOrders) {
        const o = orders.find(ord => ord.id === id)
        if (o && (o.state === 'draft' || o.state === 'allocated')) confirmOrder(id)
      }
    }
    setConfirmAction(null)
    setSelectedOrders(new Set())
  }

  const checkOversell = (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    if (!order) return false
    return order.lines.some(l => { const s = getStockQty(l.productId); return s > 0 && l.allocatedQty > s })
  }

  const printableOrders = orders.filter(o => selectedOrders.has(o.id))
  const batchableCount = [...selectedOrders].filter(id => { const o = orders.find(ord => ord.id === id); return o?.state === 'draft' || o?.state === 'allocated' }).length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 p-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sales Orders</h1>
              <p className="text-sm text-gray-400">{filtered.length} orders | {stockItems.length} stocked items</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={selectAll} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50">
              {selectedOrders.size === filtered.length && filtered.length > 0 ? 'Deselect' : `Select All (${filtered.length})`}
            </button>
            {batchableCount > 0 && (
              <button onClick={() => setConfirmAction({ type: 'batch' })} className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:opacity-90">
                Batch Confirm ({batchableCount})
              </button>
            )}
            <button onClick={handlePrint} disabled={selectedOrders.size === 0}
              className={`px-3 py-1.5 text-sm rounded-lg ${selectedOrders.size > 0 ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
              Print ({selectedOrders.size})
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search customer, order..." className="flex-1 max-w-xs" />
          <StatusDropdown value={filter} onChange={(v) => { setFilter(v); setPage(1) }} options={stateOptions} />
        </div>
      </header>

      {stockItems.length > 0 && (
        <div className="px-6 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm">
            <span className="font-medium text-blue-700">Stock:</span>
            <span className="text-blue-600 ml-2">
              {stockItems.map(s => `${s.productName} ${s.qty}${s.unit}@$${s.sellingPrice}`).join(' | ')}
            </span>
          </div>
        </div>
      )}

      <div className="p-6 max-w-6xl mx-auto space-y-3">
        {paged.length === 0 ? (
          <div className="text-center text-gray-400 py-12 space-y-2">
            <p>{search || filter !== 'all' ? 'No matching orders' : 'No orders yet'}</p>
            {!search && filter === 'all' && (
              <button onClick={() => navigate('/purchase-list')} className="text-primary hover:underline text-sm">Go to Purchase List</button>
            )}
          </div>
        ) : (
          paged.map(order => {
            const cust = customers.find(c => c.id === order.customerId)
            const config = stateConfig[order.state] || stateConfig.draft
            const isExpanded = expanded === order.id
            const total = order.lines.reduce((s, l) => s + l.allocatedQty * getPrice(l.productId), 0)
            const hasOversell = checkOversell(order.id)

            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={selectedOrders.has(order.id)} onChange={() => toggleOrder(order.id)}
                      className="w-4 h-4 accent-primary rounded border-gray-300 bg-white" />
                    <button onClick={() => setExpanded(isExpanded ? null : order.id)} className="text-left">
                      <p className="font-bold text-gray-900">{cust?.ref} {cust?.name}</p>
                      <p className="text-xs text-gray-400">{order.id} | {order.date} | {order.lines.length} items</p>
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    {total > 0 && <span className="text-lg font-bold text-primary">${Math.round(total).toLocaleString()}</span>}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>
                    {(order.state === 'draft' || order.state === 'allocated') && (
                      <button onClick={() => setConfirmAction({ type: 'single', orderId: order.id })}
                        className={`px-3 py-1 rounded text-xs text-white ${hasOversell ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-green-700'}`}>
                        {hasOversell ? 'Oversell!' : 'Confirm'}
                      </button>
                    )}
                    <button onClick={() => setExpanded(isExpanded ? null : order.id)} className="text-gray-400 text-xl">{isExpanded ? '\u25BE' : '\u25B8'}</button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-400 text-xs border-b border-gray-100">
                          <th className="py-2 px-4 text-left">Product</th>
                          <th className="py-2 px-4 text-right">Request</th>
                          <th className="py-2 px-4 text-right">Allocated</th>
                          <th className="py-2 px-4 text-left">Unit</th>
                          <th className="py-2 px-4 text-right">Stock</th>
                          <th className="py-2 px-4 text-right">Price</th>
                          <th className="py-2 px-4 text-right">Amount</th>
                          <th className="py-2 px-4 text-left">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.lines.map(line => {
                          const price = getPrice(line.productId)
                          const stockQty = getStockQty(line.productId)
                          const amount = Math.round(line.allocatedQty * price)
                          const oversell = stockQty > 0 && line.allocatedQty > stockQty
                          return (
                            <tr key={line.productId} className={`border-b border-gray-50 ${oversell ? 'bg-red-50/50' : stockQty === 0 ? 'bg-yellow-50/50' : ''}`}>
                              <td className="py-2 px-4 font-medium">{line.productName}</td>
                              <td className="py-2 px-4 text-right text-gray-400">{line.qty.toFixed(2)}</td>
                              <td className="py-2 px-4 text-right">
                                <input type="number" value={line.allocatedQty} step="0.01" min="0"
                                  onChange={(e) => updateAllocatedQty(order.id, line.productId, parseFloat(e.target.value) || 0)}
                                  className="w-20 text-right px-1.5 py-1 border border-gray-200 rounded-lg bg-white font-medium text-sm"
                                  disabled={order.state === 'confirmed'} />
                              </td>
                              <td className="py-2 px-4 text-gray-400">{line.unit}</td>
                              <td className={`py-2 px-4 text-right text-xs ${stockQty > 0 ? (oversell ? 'text-red-600 font-bold' : 'text-green-600') : 'text-orange-500'}`}>
                                {stockQty > 0 ? stockQty.toFixed(2) : 'N/A'}
                              </td>
                              <td className="py-2 px-4 text-right">{price > 0 ? `$${price}` : <span className="text-orange-500 text-xs">TBD</span>}</td>
                              <td className="py-2 px-4 text-right font-bold text-primary">{price > 0 ? `$${amount.toLocaleString()}` : '-'}</td>
                              <td className="py-2 px-4 text-gray-400 text-xs">{line.note || ''}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    <div className="px-4 py-2 bg-gray-50 text-right text-sm">
                      <span className="text-gray-400">Subtotal: </span>
                      <strong className="text-primary text-lg">${Math.round(total).toLocaleString()}</strong>
                    </div>
                    {order.note && <p className="px-4 py-1.5 text-xs text-gray-400 border-t border-gray-50">Note: {order.note}</p>}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      <PrintArea printRef={contentRef}>
        <SalesInvoicePrint orders={printableOrders} stockItems={stockItems} />
      </PrintArea>

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.type === 'batch' ? `Batch confirm ${batchableCount} orders?` : 'Confirm shipment?'}
        message={confirmAction?.type === 'batch'
          ? `${batchableCount} pending orders will be confirmed.`
          : 'Once confirmed, allocations cannot be modified.'}
        confirmText="Confirm"
        variant="warning"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}
