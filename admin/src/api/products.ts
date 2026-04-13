import { db } from './client'
import { TABLES } from './tables'

export interface Product {
  id: string
  name: string
  listPrice: number
}

/**
 * 查詢所有產品範本（id / name / list_price）
 * fail-silent：發生錯誤時回傳空陣列
 */
export async function listProducts(): Promise<Product[]> {
  try {
    const rows = await db.query<any>(TABLES.PRODUCT_TEMPLATES, {
      select_columns: ['id', 'name', 'list_price'],
    })
    return (rows || []).map((r: any) => ({
      id: String(r.id),
      name: String(r.name || ''),
      listPrice: Number(r.list_price || 0),
    }))
  } catch {
    return []
  }
}
