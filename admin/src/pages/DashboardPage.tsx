import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats, type DashboardStats } from '../api/dashboard'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats().then(data => {
      setStats(data)
      setLoading(false)
    })
  }, [])

  const steps = [
    { step: '1', label: 'Sales Orders', desc: `${stats?.totalSalesOrders || 0} orders`, href: '/sales-orders', count: stats?.totalSalesOrders || 0 },
    { step: '2', label: 'Procurement', desc: `${stats?.totalPurchaseOrders || 0} items`, href: '/procurement', count: stats?.totalPurchaseOrders || 0 },
    { step: '3', label: 'Pending Shipments', desc: `${stats?.pendingShipments || 0} unfulfilled`, href: '/delivery', count: stats?.pendingShipments || 0 },
    { step: '4', label: 'Pending Receives', desc: `${stats?.pendingReceives || 0} missing`, href: '/purchase-list', count: stats?.pendingReceives || 0 },
    { step: '5', label: 'Stock', desc: `View Inventory`, href: '/stock', count: 0 },
  ]

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 1a13 13 0 0 1 .8 13c-1 1.8-2 3.1-3.8 4.5"/><path d="M5 20c.5-1 1.4-3 2-4.5"/></svg>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <p className="text-sm text-gray-400">{new Date().toISOString().slice(0,10)} Overview (Live API)</p>
      </header>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {l: 'Total Sales Orders', v: stats?.totalSalesOrders, c: 'text-gray-900'},
            {l: 'Pending Shipments', v: stats?.pendingShipments, c: 'text-orange-600'},
            {l: 'Pending Receives', v: stats?.pendingReceives, c: 'text-blue-600'},
            {l: 'Sales Volume', v: `$${stats?.todaySalesVolume?.toLocaleString() || 0}`, c: 'text-green-600'}
          ].map(s => (
            <div key={s.l} className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-400">{s.l}</p><p className={`text-3xl font-bold ${s.c}`}>{s.v}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Workflow Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {steps.map(s => (
              <button key={s.label} onClick={() => navigate(s.href)} className="rounded-xl border border-gray-100 bg-white hover:bg-gray-50 p-4 text-left transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center">{s.step}</span>
                  {s.count > 0 && <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">{s.count}</span>}
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
