/**
 * Mock 產品資料 — 對應 product_templates + product_categories + uom_uom
 * 來自紙本單據的真實品項
 */

export interface Category {
  id: string
  name: string
  code: string
}

export interface Product {
  id: string
  name: string
  categoryId: string
  unit: string       // 台斤, 顆, 盒, 包, 把, 件
  defaultCode: string
  supplierId: string
}

export interface Supplier {
  id: string
  ref: string
  name: string
  address: string
  phone: string
  vat: string        // 統一編號
}

export interface Customer {
  id: string
  ref: string
  name: string
  address: string
  phone: string
  vat: string           // 統一編號
  contactPerson: string // 聯絡人
}

export const categories: Category[] = []
export const suppliers: Supplier[] = []
export const customers: Customer[] = []
export const products: Product[] = []
