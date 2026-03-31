/**
 * 產品 API — 僅供品名查找
 */
import { db } from './client'

export interface Product {
  id: string
  name: string
  sku: string
  uomId: string
}

export const getProducts = async (): Promise<Product[]> => {
  const templates = await db.query('product_templates')
  return templates.map((t: any) => ({
    id: String(t.id),
    name: t.name || '未知商品',
    sku: t.default_code || '-',
    uomId: Array.isArray(t.uom_id) ? String(t.uom_id[1]) : String(t.uom_id || '單位'),
  }))
}
