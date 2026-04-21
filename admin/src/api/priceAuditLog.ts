import { db } from './client'
import { TABLES } from './tables'

const PRICE_LOG_UUID = '390d4f0b-9a2b-4131-a35b-67fce21286be'

interface PriceLogEntry {
  productProductId: string
  standardPrice: number
  lstPrice: number
  updatedBy: string
  effectiveDate: string
}

export interface PriceLogRecord {
  id: string
  productProductId: string
  standardPrice: number
  lstPrice: number
  updatedBy: string
  effectiveDate: string
  updatedAt: string
}

export async function updateProductPrices(
  productProductId: string,
  standardPrice: number,
  lstPrice: number,
): Promise<void> {
  await db.update('product_products', productProductId, {
    standard_price: standardPrice,
    lst_price: lstPrice,
  })
}

export async function syncOrderLinePrices(
  productProductId: string,
  lstPrice: number,
  deliveryDate: string,
): Promise<{ updated: number }> {
  const lines = await db.query<any>(TABLES.SALE_ORDER_LINES, {
    filters: [{ column: 'product_id', op: 'eq', value: productProductId }],
    select_columns: ['id', 'delivery_date'],
  })
  const matchingLines = (lines || []).filter(
    (l: any) => String(l.delivery_date || '').slice(0, 10) === deliveryDate,
  )
  await Promise.all(
    matchingLines.map((l: any) => db.update(TABLES.SALE_ORDER_LINES, l.id, { price_unit: lstPrice })),
  )
  return { updated: matchingLines.length }
}

async function writePriceLog(entry: PriceLogEntry): Promise<void> {
  await db.insertCustom(PRICE_LOG_UUID, {
    product_product_id: entry.productProductId,
    standard_price: entry.standardPrice,
    lst_price: entry.lstPrice,
    updated_by: entry.updatedBy,
    effective_date: entry.effectiveDate,
  })
}

export async function getPriceLog(productProductId: string): Promise<PriceLogRecord[]> {
  try {
    const rows = await db.queryCustom<any>(PRICE_LOG_UUID)
    return (rows || [])
      .filter((r: any) => String(r.product_product_id) === productProductId)
      .map((r: any) => ({
        id: String(r.id),
        productProductId: String(r.product_product_id),
        standardPrice: Number(r.standard_price),
        lstPrice: Number(r.lst_price),
        updatedBy: String(r.updated_by),
        effectiveDate: String(r.effective_date),
        updatedAt: String(r.updated_at),
      }))
      .sort((a: PriceLogRecord, b: PriceLogRecord) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
  } catch {
    return []
  }
}

export async function updateProductPricesWithLog(
  productProductId: string,
  standardPrice: number,
  lstPrice: number,
  updatedBy: string,
  effectiveDate: string,
): Promise<{ updated: number }> {
  await updateProductPrices(productProductId, standardPrice, lstPrice)
  const { updated } = await syncOrderLinePrices(productProductId, lstPrice, effectiveDate)
  try {
    await writePriceLog({ productProductId, standardPrice, lstPrice, updatedBy, effectiveDate })
  } catch (err) {
    console.warn('[productProductPriceLog] 稽核紀錄寫入失敗，資料已更新', err)
  }
  return { updated }
}
