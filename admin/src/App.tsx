import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthCallbackPage from './pages/AuthCallbackPage'
import AuthGuard from './components/AuthGuard'
import DashboardPage from './pages/DashboardPage'
import PurchaseListPage from './pages/PurchaseListPage'
import ProcurementPage from './pages/ProcurementPage'
import StockPage from './pages/StockPage'
import SalesOrdersPage from './pages/SalesOrdersPage'
import DeliveryPage from './pages/DeliveryPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Callback — 不需要 AuthGuard */}
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* 受保護路由 — 需要 AuthGuard */}
        <Route path="/" element={<AuthGuard><DashboardPage /></AuthGuard>} />
        <Route path="/purchase-list" element={<AuthGuard><PurchaseListPage /></AuthGuard>} />
        <Route path="/procurement" element={<AuthGuard><ProcurementPage /></AuthGuard>} />
        <Route path="/stock" element={<AuthGuard><StockPage /></AuthGuard>} />
        <Route path="/sales-orders" element={<AuthGuard><SalesOrdersPage /></AuthGuard>} />
        <Route path="/delivery" element={<AuthGuard><DeliveryPage /></AuthGuard>} />

        {/* 未知路由 → Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
