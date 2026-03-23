/**
 * 共用型別定義 — 從 API 模組遷移過來的業務資料型別
 */

// === 銷貨相關 ===

export interface SalesOrder {
  id: string
  erp_id: string
  date: string
  customer_id: string      // 客戶名稱（API 回傳已解析）
  total_amount: number
  status: string
  lines: SalesOrderLine[]
  metadata?: { note?: string }
}

export interface SalesOrderLine {
  id: string
  invoice_id: string
  product_id: string       // 產品名稱或 ID
  quantity: number
  unit_price: number
  subtotal: number
  metadata?: { note?: string }
}

// === 採購相關 ===

export interface PurchaseOrder {
  id: string
  erp_id: string
  supplier_id: string      // 供應商名稱（API 回傳已解析）
  date: string
  status: string
  total_amount: number
  lines: PurchaseOrderLine[]
}

export interface PurchaseOrderLine {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
}

// === 庫存相關 ===

export interface StockProduct {
  id: string
  name: string
  stock: number
  cost: number
  price: number
  margin: number
  category?: string
}
