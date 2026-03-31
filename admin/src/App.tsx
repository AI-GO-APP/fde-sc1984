import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthCallbackPage from './pages/AuthCallbackPage'
import AuthGuard from './components/AuthGuard'
import LoadingCover from './components/LoadingCover'
import ToastContainer from './components/ToastContainer'
import { useAdminStore } from './store/useAdminStore'
import { useUIStore } from './store/useUIStore'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const PurchasePage = lazy(() => import('./pages/PurchasePage'))
const AllocationPage = lazy(() => import('./pages/AllocationPage'))
const DeliveryPage = lazy(() => import('./pages/DeliveryPage'))

function LoadingFallback() {
  return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">載入中...</div>
}

export default function App() {
  useEffect(() => {
    const ui = useUIStore.getState()
    ui.showLoading('載入資料中...')
    useAdminStore.getState().loadAll()
      .then(() => ui.hideLoading())
      .catch(() => {
        ui.hideLoading()
        ui.toast('error', '資料載入失敗，請重新整理')
      })
  }, [])

  return (
    <BrowserRouter>
      <LoadingCover />
      <ToastContainer />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/" element={<AuthGuard><DashboardPage /></AuthGuard>} />
          <Route path="/orders" element={<AuthGuard><OrdersPage /></AuthGuard>} />
          <Route path="/purchase" element={<AuthGuard><PurchasePage /></AuthGuard>} />
          <Route path="/allocation" element={<AuthGuard><AllocationPage /></AuthGuard>} />
          <Route path="/delivery" element={<AuthGuard><DeliveryPage /></AuthGuard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
