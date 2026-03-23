import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
        <Route path="/" element={<DashboardPage />} />
        <Route path="/purchase-list" element={<PurchaseListPage />} />
        <Route path="/procurement" element={<ProcurementPage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/sales-orders" element={<SalesOrdersPage />} />
        <Route path="/delivery" element={<DeliveryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
