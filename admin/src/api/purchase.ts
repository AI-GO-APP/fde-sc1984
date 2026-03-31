/**
 * 採購訂單 API — 嚴格 AI GO 標準
 *
 * purchase_orders.state: draft | sent | purchase | done | cancel
 */
import { db } from './client'
import { isUUID } from '../utils/displayHelpers'

// ─── 型別 ───

export interface PurchaseOrder {
  id: string
  name: string            // PO 編號
  state: string           // draft | sent | purchase | done | cancel
  date: string
  supplierName: string    // 已解析的供應商名稱
  totalAmount: number
  note: string
  lines: PurchaseOrderLine[]
}

export interface PurchaseOrderLine {
  id: string
  orderId: string
  productTemplateId: string
  name: string            // 品名
  quantity: number
  unitPrice: number
  subtotal: number
}

// ─── 名稱解析 ───

const resolveSupplierName = (raw: any, supplierMap: Record<string, string>): string => {
  if (Array.isArray(raw)) return String(raw[1] || raw[0])
  if (typeof raw === 'string' && supplierMap[raw]) return supplierMap[raw]
  if (typeof raw === 'string' && !isUUID(raw)) return raw
  return '未知供應商'
}

// ─── API ───

export const getPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  const [orders, lines, suppliers] = await Promise.all([
    db.query('purchase_orders'),
    db.query('purchase_order_lines'),
    db.query('suppliers').catch(() => []),
  ])

  const supplierMap: Record<string, string> = {}
  ;(suppliers || []).forEach((s: any) => {
    supplierMap[String(s.id)] = s.name || ''
  })

  return orders.map((o: any) => ({
    id: String(o.id),
    name: o.name || String(o.id),
    state: o.state || 'draft',
    date: o.date_order ? String(o.date_order).split(' ')[0] : '',
    supplierName: resolveSupplierName(o.supplier_id, supplierMap),
    totalAmount: o.amount_total || 0,
    note: o.note || '',
    lines: lines
      .filter((l: any) => (Array.isArray(l.order_id) ? l.order_id[0] : l.order_id) === o.id)
      .map((l: any) => ({
        id: String(l.id),
        orderId: String(o.id),
        productTemplateId: Array.isArray(l.product_template_id)
          ? String(l.product_template_id[0])
          : String(l.product_template_id || l.product_id || ''),
        name: l.name || '未知商品',
        quantity: l.product_qty || 0,
        unitPrice: l.price_unit || 0,
        subtotal: l.price_subtotal || 0,
      })),
  }))
}

/** 更新採購單狀態（不可逆操作） */
export const updatePurchaseOrderState = async (id: string, state: string) => {
  return await db.update('purchase_orders', id, { state })
}

/** 更新採購單明細行（數量 / 單價） */
export const updatePurchaseOrderLine = async (
  lineId: string,
  data: { product_qty?: number; price_unit?: number },
) => {
  return await db.update('purchase_order_lines', lineId, data)
}

/**
 * 從已確認銷售訂單產生採購單
 *
 * 彙總 state=sale 的 sale_orders 品項需求 → 建立單張 PO + lines
 */
export async function generatePurchaseOrder(
  confirmedOrders: Array<{
    lines: Array<{ productTemplateId: string; name: string; quantity: number }>
  }>,
): Promise<string> {
  if (confirmedOrders.length === 0) throw new Error('沒有已確認的訂單可產生採購單')

  // 彙總品項需求量
  const demand = new Map<string, { name: string; totalQty: number }>()
  for (const order of confirmedOrders) {
    for (const line of order.lines) {
      const pid = line.productTemplateId
      const existing = demand.get(pid) || { name: line.name || '未知', totalQty: 0 }
      existing.totalQty = Math.round((existing.totalQty + line.quantity) * 100) / 100
      demand.set(pid, existing)
    }
  }

  // 建立採購單主檔
  const poRes = await db.insert<{ id: string }>('purchase_orders', {
    date_order: new Date().toISOString().slice(0, 10),
    state: 'draft',
    note: `自動產生自 ${confirmedOrders.length} 筆銷售訂單`,
  })
  const poId = poRes.id

  // 建立採購單明細行
  const linePromises = Array.from(demand.entries()).map(([pid, d]) =>
    db.insert('purchase_order_lines', {
      order_id: poId,
      product_template_id: pid,
      product_qty: d.totalQty,
      name: d.name,
      price_unit: 0,
    }),
  )
  await Promise.all(linePromises)

  return poId
}
