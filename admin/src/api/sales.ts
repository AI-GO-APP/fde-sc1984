/**
 * 銷售訂單 API — 嚴格 AI GO 標準
 *
 * sale_orders.state: draft | sent | sale | done | cancel
 */
import { db } from './client'
import { isUUID } from '../utils/displayHelpers'

// ─── 型別 ───

export interface SaleOrder {
  id: string
  name: string           // 訂單編號（如 S00001）
  state: string          // draft | sent | sale | done | cancel
  date: string           // 訂單日期
  customerName: string   // 已解析的客戶名稱（非 UUID）
  totalAmount: number
  note: string
  lines: SaleOrderLine[]
}

export interface SaleOrderLine {
  id: string
  orderId: string
  productTemplateId: string
  name: string           // 品名（從 line.name 取得）
  quantity: number
  unitPrice: number
  subtotal: number
}

// ─── 名稱解析 ───

const resolveCustomerName = (raw: any, customerMap: Record<string, string>): string => {
  if (Array.isArray(raw)) return String(raw[1] || raw[0])
  if (typeof raw === 'string' && customerMap[raw]) return customerMap[raw]
  if (typeof raw === 'string' && !isUUID(raw)) return raw
  return '未知客戶'
}

// ─── API ───

export const getSaleOrders = async (): Promise<SaleOrder[]> => {
  const [orders, lines, customers] = await Promise.all([
    db.query('sale_orders'),
    db.query('sale_order_lines'),
    db.query('customers').catch(() => []),
  ])

  // 客戶 UUID → 名稱 查找表
  const customerMap: Record<string, string> = {}
  ;(customers || []).forEach((c: any) => {
    customerMap[String(c.id)] = c.name || ''
  })

  return orders.map((o: any) => ({
    id: String(o.id),
    name: o.name || String(o.id),
    state: o.state || 'draft',
    date: o.date_order ? String(o.date_order).split(' ')[0] : '',
    customerName: resolveCustomerName(o.customer_id, customerMap),
    totalAmount: o.amount_total || 0,
    note: o.note || '',
    lines: lines
      .filter((l: any) => (Array.isArray(l.order_id) ? l.order_id[0] : l.order_id) === o.id)
      .map((l: any) => ({
        id: String(l.id),
        orderId: String(o.id),
        productTemplateId: Array.isArray(l.product_template_id)
          ? String(l.product_template_id[0])
          : String(l.product_template_id || ''),
        name: l.name || '未知商品',
        quantity: l.product_uom_qty || 0,
        unitPrice: l.price_unit || 0,
        subtotal: l.price_subtotal || 0,
      })),
  }))
}

/** 更新銷售訂單狀態（不可逆操作） */
export const updateSaleOrderState = async (id: string, state: string) => {
  return await db.update('sale_orders', id, { state })
}
