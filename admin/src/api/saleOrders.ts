import { db } from './client'
import { TABLES } from './tables'

export interface OrderLine {
  id: string
  name: string
  productUomQty: number
}

/**
 * 查詢指定訂單的訂單明細
 * fail-silent：發生錯誤時回傳空陣列
 */
export async function getOrderLines(orderId: string): Promise<OrderLine[]> {
  try {
    const rows = await db.query<any>(TABLES.SALE_ORDER_LINES, {
      filters: [{ column: 'order_id', op: 'eq', value: orderId }],
      select_columns: ['id', 'name', 'product_uom_qty'],
    })
    return (rows || []).map((r: any) => ({
      id: String(r.id),
      name: String(r.name || ''),
      productUomQty: Number(r.product_uom_qty || 0),
    }))
  } catch {
    return []
  }
}
