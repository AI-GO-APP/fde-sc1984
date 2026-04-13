import { db } from './client'
import { TABLES } from './tables'

interface PriceAuditEntry {
  productTmplId: string
  oldPrice: number
  newPrice: number
  updatedBy: string
  updatedAt?: string
  batchId: string
}

interface PriceAuditRecord extends Required<PriceAuditEntry> {
  id: string
}

export async function updateProductPrice(productTmplId: string, newPrice: number): Promise<void> {
  await db.update(TABLES.PRODUCT_TEMPLATES, productTmplId, { list_price: newPrice })
}

export async function syncOrderLinePrices(
  productTmplId: string,
  newPrice: number,
  deliveryDate: string,
): Promise<{ updated: number; batchId: string }> {
  const lines = await db.query<any>(TABLES.SALE_ORDER_LINES, {
    filters: [{ column: 'product_template_id', op: 'eq', value: productTmplId }],
    select_columns: ['id', 'order_id'],
  })
  if (!lines || lines.length === 0) return { updated: 0, batchId: '' }

  // AI GO proxy 不支援 join，因此 client-side filter：
  // 取出所有涉及的 order_id，查詢 sale_orders 的 state 與 date_order，
  // 只更新 state 為 'draft' 或 'sale'，且 date_order 符合 deliveryDate 的進行中訂單。
  const orderIds = [...new Set(lines.map((l: any) => String(l.order_id)))]
  const orders = await db.query<any>(TABLES.SALE_ORDERS, {
    filters: [{ column: 'id', op: 'in', value: orderIds }],
    select_columns: ['id', 'state', 'date_order'],
  })
  const activeOrderIds = new Set(
    (orders || [])
      .filter((o: any) =>
        (o.state === 'draft' || o.state === 'sale') &&
        String(o.date_order).slice(0, 10) === deliveryDate
      )
      .map((o: any) => String(o.id))
  )

  const activeLines = lines.filter((l: any) => activeOrderIds.has(String(l.order_id)))
  if (activeLines.length === 0) return { updated: 0, batchId: '' }

  const batchId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

  await Promise.all(
    activeLines.map((line: any) =>
      db.update(TABLES.SALE_ORDER_LINES, line.id, { price_unit: newPrice })
    )
  )

  return { updated: activeLines.length, batchId }
}

export async function writePriceAuditLog(entry: PriceAuditEntry): Promise<void> {
  await db.insert(TABLES.PRICE_AUDIT_LOG, {
    product_tmpl_id: entry.productTmplId,
    old_price: entry.oldPrice,
    new_price: entry.newPrice,
    updated_by: entry.updatedBy,
    updated_at: entry.updatedAt ?? new Date().toISOString(),
    batch_id: entry.batchId,
  })
}

export async function getPriceAuditLog(productTmplId: string): Promise<PriceAuditRecord[]> {
  try {
    const rows = await db.query<any>(TABLES.PRICE_AUDIT_LOG, {
      filters: [{ column: 'product_tmpl_id', op: 'eq', value: productTmplId }],
    })
    const records: PriceAuditRecord[] = (rows || []).map((r: any) => ({
      id: String(r.id),
      productTmplId: String(r.product_tmpl_id),
      oldPrice: Number(r.old_price),
      newPrice: Number(r.new_price),
      updatedBy: String(r.updated_by),
      updatedAt: String(r.updated_at),
      batchId: String(r.batch_id),
    }))
    return records.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  } catch {
    return []
  }
}

/**
 * 原子化更新產品價格：同時更新 product_templates、同步訂單行價格，並寫入稽核紀錄。
 * 任一步驟失敗均會 throw，確保呼叫端可感知錯誤。
 */
export async function updateProductPriceWithAudit(
  productTmplId: string,
  oldPrice: number,
  newPrice: number,
  updatedBy: string,
  deliveryDate: string,
): Promise<{ updated: number; batchId: string }> {
  await updateProductPrice(productTmplId, newPrice)
  const { updated, batchId } = await syncOrderLinePrices(productTmplId, newPrice, deliveryDate)
  try {
    await writePriceAuditLog({ productTmplId, oldPrice, newPrice, updatedBy, batchId })
  } catch (err) {
    console.warn('[priceAuditLog] audit log 寫入失敗，資料已更新但稽核紀錄遺失', err)
  }
  return { updated, batchId }
}
