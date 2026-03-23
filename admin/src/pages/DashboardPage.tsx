import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { orders, procurementItems, stockItems } = useStore()

  const draft = orders.filter(o => o.state === 'draft').length
  const confirmed = orders.filter(o => o.state === 'confirmed').length
  const shipped = orders.filter(o => o.state === 'shipped').length
  const delivered = orders.filter(o => o.state === 'delivered').length

  const hasProcurement = procurementItems.length > 0
  const pendingItems = procurementItems.filter(i => i.state === 'pending').length
  const pricedItems = procurementItems.filter(i => i.state === 'priced').length
  const stockedItems = procurementItems.filter(i => i.state === 'stocked').length
  const totalItems = procurementItems.length

  const steps = [
    { step: '1', label: 'Orders', desc: `${draft} pending`, href: '/purchase-list', count: draft },
    { step: '2', label: 'Purchase List', desc: hasProcurement ? `${totalItems} items` : 'Generate', href: '/purchase-list', count: hasProcurement ? totalItems : 0 },
    { step: '3', label: 'Procurement', desc: `${pendingItems} pending / ${pricedItems} priced`, href: '/procurement', count: pendingItems },
    { step: '4', label: 'Entry', desc: `${stockedItems}/${totalItems} stocked`, href: '/procurement', count: pricedItems },
    { step: '5', label: 'Stock', desc: `${stockItems.length} items`, href: '/stock', count: stockItems.length },
    { step: '6', label: 'Sales Orders', desc: `${confirmed} confirmed`, href: '/sales-orders', count: confirmed },
    { step: '7', label: 'Delivery', desc: `${shipped} in transit`, href: '/delivery', count: shipped + delivered },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 1a13 13 0 0 1 .8 13c-1 1.8-2 3.1-3.8 4.5"/><path d="M5 20c.5-1 1.4-3 2-4.5"/></svg>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <p className="text-sm text-gray-400">{new Date().toISOString().slice(0,10)} Overview</p>
      </header>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[{l:'All Orders',v:orders.length,c:'text-gray-900'},{l:'Draft',v:draft,c:'text-orange-600'},{l:'Confirmed',v:confirmed,c:'text-blue-600'},{l:'Shipped',v:shipped,c:'text-yellow-600'},{l:'Delivered',v:delivered,c:'text-green-600'}].map(s=>(
            <div key={s.l} className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-400">{s.l}</p><p className={`text-3xl font-bold ${s.c}`}>{s.v}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Workflow</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {steps.map(s=>(
              <button key={s.label} onClick={()=>navigate(s.href)} className="rounded-xl border border-gray-100 bg-white hover:bg-gray-50 p-4 text-left transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center">{s.step}</span>
                  {s.count>0&&<span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">{s.count}</span>}
                </div>
                <p className="font-medium mt-1 text-gray-900 text-sm">{s.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
