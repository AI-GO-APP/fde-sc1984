/**
 * 產品 API — 品名 + 單位查找
 * 參照資料由 refCache 統一快取，product_templates 只查一次
 */
import { getCachedUomMap, getCachedProductTemplates } from './refCache'

export interface Product {
  id: string
  name: string
  sku: string
  uom: string       // 單位名稱（如 台斤、包、箱）
}

/**
 * 解析 UoM 欄位 — 支援三種格式：
 * 1. [uuid, "台斤"] → "台斤"
 * 2. "台斤"         → "台斤"
 * 3. uuid           → 查 uomMap
 */
const resolveUom = (raw: any, uomMap: Record<string, string>): string => {
  if (Array.isArray(raw) && raw.length >= 2) return String(raw[1])
  if (typeof raw === 'string') {
    if (raw.length < 30) return raw
    return uomMap[raw] || '單位'
  }
  return '單位'
}

/** 取得 UoM 查找表（已快取版本） */
export const getUomMap = getCachedUomMap

export const getProducts = async (): Promise<Product[]> => {
  // 直接從 refCache 取得已快取的 product_templates 和 uomMap
  const [templates, uomMap] = await Promise.all([
    getCachedProductTemplates(),
    getCachedUomMap(),
  ])
  return templates.map((t: any) => ({
    id: String(t.id),
    name: t.name || '未知商品',
    sku: t.default_code || '-',
    uom: resolveUom(t.uom_id, uomMap),
  }))
}

/** 解析單位（export 給其他 API 使用） */
export { resolveUom }

/** 取得司機（配送員）清單 — 使用 refCache */
import { getCachedDrivers } from './refCache'
export const getDrivers = getCachedDrivers
