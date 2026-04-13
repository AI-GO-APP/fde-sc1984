import { db } from './client'
import { TABLES } from './tables'

interface OrderAuditEntry {
  orderId: string
  field: string
  oldValue: string
  newValue: string
  changedBy: string
  changedAt?: string
  note?: string
}

interface OrderAuditRecord extends Required<OrderAuditEntry> {
  id: string
}

export async function writeOrderAuditLog(entry: OrderAuditEntry): Promise<void> {
  await db.insert(TABLES.ORDER_AUDIT_LOG, {
    order_id: entry.orderId,
    field: entry.field,
    old_value: entry.oldValue,
    new_value: entry.newValue,
    changed_by: entry.changedBy,
    changed_at: entry.changedAt ?? new Date().toISOString(),
    note: entry.note ?? '',
  })
}

export async function getOrderAuditLog(orderId: string): Promise<OrderAuditRecord[]> {
  try {
    const rows = await db.query<any>(TABLES.ORDER_AUDIT_LOG, {
      filters: [{ column: 'order_id', op: 'eq', value: orderId }],
    })
    const records: OrderAuditRecord[] = (rows || []).map((r: any) => ({
      id: String(r.id),
      orderId: String(r.order_id),
      field: String(r.field),
      oldValue: String(r.old_value),
      newValue: String(r.new_value),
      changedBy: String(r.changed_by),
      changedAt: String(r.changed_at),
      note: String(r.note ?? ''),
    }))
    return records.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
  } catch {
    return []
  }
}

export async function updateOrderLineWithAudit(
  lineId: string,
  orderId: string,
  oldQty: number,
  newQty: number,
  changedBy: string
): Promise<void> {
  await db.update(TABLES.SALE_ORDER_LINES, lineId, { product_uom_qty: newQty })
  try {
    await writeOrderAuditLog({
      orderId,
      field: 'product_uom_qty',
      oldValue: String(oldQty),
      newValue: String(newQty),
      changedBy,
    })
  } catch (err) {
    console.warn('[orderAuditLog] audit log 寫入失敗，資料已更新但稽核紀錄遺失', err)
  }
}
