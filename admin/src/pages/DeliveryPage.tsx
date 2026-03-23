import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { customers } from '../data/mockData'
import { useStore } from '../store/useStore'
import ConfirmDialog from '../components/ConfirmDialog'
import SearchInput from '../components/SearchInput'
import StatusDropdown from '../components/StatusDropdown'
import Pagination from '../components/Pagination'
import { usePrint, PrintArea } from '../components/PrintProvider'
import DeliverySlipPrint from '../templates/DeliverySlipPrint'

const stateOptions = [
  { value: 'all', label: 'All' },
  { value: 'confirmed', label: 'Pending' },
  { value: 'shipped', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
]

const stateConfig: Record<string, { label: string; color: string }> = {
  confirmed: { label: 'Pending',    color: 'bg-orange-100 text-orange-700' },
  shipped:   { label: 'In Transit', color: 'bg-blue-100 text-blue-700' },
  delivered: { label: 'Delivered',  color: 'bg-green-100 text-green-700' },
}

const drivers = ['Driver A', 'Driver B', 'Driver C']
const PAGE_SIZE = 10

type DeliveryAction = { type: 'ship' | 'deliver'; orderId: string }

export default function DeliveryPage() {
  const navigate = useNavigate()
  const { orders, markShipped, markDelivered } = useStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<DeliveryAction | null>(null)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [driverMap, setDriverMap] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const { contentRef: batchRef, print: printBatch } = usePrint()
  const { contentRef: singleRef, print: printSingle } = usePrint()
  const [singlePrintId, setSinglePrintId] = useState<string | null>(null)

  const deliverableOrders = useMemo(() => {
    let list = orders.filter(o => ['confirmed', 'shipped', 'delivered'].includes(o.state))
    if (filter !== 'all') list = list.filter(o => o.state === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(o => {
        const cust = customers.find(c => c.id === o.customerId)
        return o.id.toLowerCase().includes(q) || cust?.name.toLowerCase().includes(q) || cust?.ref.toLowerCase().includes(q) || cust?.address.toLowerCase().includes(q)
      })
    }
    return list
  }, [orders, filter, search])

  const totalPages = Math.ceil(deliverableOrders.length / PAGE_SIZE)
  const paged = deliverableOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const customerGroups = new Map<string, typeof paged>()
  for (const order of paged) {
    const list = customerGroups.get(order.customerId) || []
    list.push(order)
    customerGroups.set(order.customerId, list)
  }

  const handleConfirm = () => {
    if (!confirmAction) return
    if (confirmAction.type === 'ship') markShipped(confirmAction.orderId)
    else markDelivered(confirmAction.orderId)
    setConfirmAction(null)
  }

  const toggleOrderSelect = (orderId: string) => {
    setSelectedOrders(prev => { const next = new Set(prev); next.has(orderId) ? next.delete(orderId) : next.add(orderId); return next })
  }
  const selectAllOrders = () => {
    if (selectedOrders.size === deliverableOrders.length) setSelectedOrders(new Set())
    else setSelectedOrders(new Set(deliverableOrders.map(o => o.id)))
  }

  const handleSinglePrint = (orderId: string) => { setSinglePrintId(orderId); setTimeout(() => printSingle(), 100) }

  const batchPrintOrders = orders.filter(o => selectedOrders.has(o.id))
  const singlePrintOrder = singlePrintId ? orders.filter(o => o.id === singlePrintId) : []
  const actionOrder = confirmAction ? orders.find(o => o.id === confirmAction.orderId) : null
  const actionCustomer = actionOrder ? customers.find(c => c.id === actionOrder.customerId) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 p-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Delivery Management</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={selectAllOrders} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50">
              {selectedOrders.size === deliverableOrders.length && deliverableOrders.length > 0 ? 'Deselect' : 'Select All'}
            </button>
            <button onClick={printBatch} disabled={selectedOrders.size === 0}
              className={`px-3 py-1.5 text-sm rounded-lg ${selectedOrders.size > 0 ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
              Print ({selectedOrders.size})
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search..." className="flex-1 max-w-xs" />
          <StatusDropdown value={filter} onChange={(v) => { setFilter(v); setPage(1) }} options={stateOptions} />
        </div>
      </header>

      <div className="p-6 max-w-5xl mx-auto">
        {customerGroups.size === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p>{search || filter !== 'all' ? 'No matching orders' : 'No delivery orders'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Array.from(customerGroups.entries()).map(([custId, custOrders]) => {
              const cust = customers.find(c => c.id === custId)
              const isExpanded = expanded === custId
              return (
                <div key={custId} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <button onClick={() => setExpanded(isExpanded ? null : custId)} className="w-full px-4 py-4 flex justify-between items-center hover:bg-gray-50">
                    <div className="text-left">
                      <p className="font-bold text-gray-900">{cust?.ref} {cust?.name}</p>
                      <p className="text-sm text-gray-400">{cust?.address}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">{custOrders.length} orders</span>
                      <span className="text-gray-400 text-xl">{isExpanded ? '\u25BE' : '\u25B8'}</span>
                    </div>
                  </button>
                  {isExpanded && custOrders.map(order => {
                    const config = stateConfig[order.state] || stateConfig.confirmed
                    return (
                      <div key={order.id} className="border-t border-gray-200">
                        <div className="px-4 py-3 flex justify-between items-center bg-gray-50">
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={selectedOrders.has(order.id)} onChange={() => toggleOrderSelect(order.id)} className="w-4 h-4 accent-primary bg-white" />
                            <div>
                              <p className="text-sm font-medium">{order.id}</p>
                              <p className="text-xs text-gray-400">{order.lines.length} items</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <select value={driverMap[order.id] || ''} onChange={(e) => setDriverMap(prev => ({ ...prev, [order.id]: e.target.value }))}
                              className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-600">
                              <option value="">Driver</option>
                              {drivers.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>
                            <button onClick={() => setPreviewId(previewId === order.id ? null : order.id)} className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-xs hover:bg-gray-300">{previewId === order.id ? 'Close' : 'Preview'}</button>
                            <button onClick={() => handleSinglePrint(order.id)} className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-xs hover:bg-gray-300">Print</button>
                            {order.state === 'confirmed' && <button onClick={() => setConfirmAction({ type: 'ship', orderId: order.id })} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Ship</button>}
                            {order.state === 'shipped' && <button onClick={() => setConfirmAction({ type: 'deliver', orderId: order.id })} className="px-3 py-1 bg-primary text-white rounded text-xs hover:bg-green-700">Delivered</button>}
                          </div>
                        </div>
                        <div className="px-4 py-2">
                          <div className="flex flex-wrap gap-1.5">
                            {order.lines.map((line, i) => <span key={i} className="px-2 py-0.5 bg-gray-50 rounded text-xs text-gray-500">{line.productName} x{line.allocatedQty}{line.unit}</span>)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      <PrintArea printRef={batchRef}><DeliverySlipPrint orders={batchPrintOrders} /></PrintArea>
      <PrintArea printRef={singleRef}><DeliverySlipPrint orders={singlePrintOrder} /></PrintArea>

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.type === 'ship' ? 'Confirm shipment?' : 'Confirm delivery?'}
        message={`Order ${actionOrder?.id} for ${actionCustomer?.name}`}
        confirmText={confirmAction?.type === 'ship' ? 'Ship' : 'Delivered'}
        variant={confirmAction?.type === 'deliver' ? 'info' : 'warning'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}
