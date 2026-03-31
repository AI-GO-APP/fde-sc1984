/**
 * 產品 API — 品名 + 單位查找
 */
import { db } from './client'

export interface Product {
  id: string
  name: string
  sku: string
  uom: string       // 單位名稱（如 公斤、個、箱）
}

/** 取得 UoM 查找表：uuid → 名稱 */
export const getUomMap = async (): Promise<Record<string, string>> => {
  try {
    const uoms = await db.query('uom_uom')
    const map: Record<string, string> = {}
    uoms.forEach((u: any) => { map[String(u.id)] = u.name || '單位' })
    return map
  } catch {
    return {}
  }
}

export const getProducts = async (): Promise<Product[]> => {
  const [templates, uomMap] = await Promise.all([
    db.query('product_templates'),
    getUomMap(),
  ])
  return templates.map((t: any) => ({
    id: String(t.id),
    name: t.name || '未知商品',
    sku: t.default_code || '-',
    uom: uomMap[String(t.uom_id)] || '單位',
  }))
}

/** 取得司機（配送員）清單 from hr_employees */
export const getDrivers = async (): Promise<Array<{ id: string; name: string }>> => {
  try {
    const employees = await db.query('hr_employees')
    return employees.map((e: any) => ({
      id: String(e.id),
      name: e.name || '未知',
    }))
  } catch {
    return []
  }
}
