import { db } from './client'
import { resolveId } from '../utils/odooHelpers'
import { TABLES } from './tables'

interface SupplierMappingRecord {
  id: string
  productTemplateId: string
  supplierId: string
}

export async function listSupplierMappings(): Promise<SupplierMappingRecord[]> {
  try {
    const rows = await db.query<any>(TABLES.SUPPLIER_INFO, {
      select_columns: ['id', 'product_tmpl_id', 'supplier_id'],
    })
    return (rows || []).map((r: any) => ({
      id: String(r.id),
      productTemplateId: resolveId(r.product_tmpl_id),
      supplierId: resolveId(r.supplier_id),
    }))
  } catch {
    return []
  }
}

export async function addSupplierMapping(productTmplId: string, supplierId: string): Promise<SupplierMappingRecord> {
  const row = await db.insert<any>(TABLES.SUPPLIER_INFO, {
    product_tmpl_id: productTmplId,
    supplier_id: supplierId,
  })
  return {
    id: String(row.id),
    productTemplateId: resolveId(row.product_tmpl_id ?? productTmplId),
    supplierId: resolveId(row.supplier_id ?? supplierId),
  }
}

export async function deleteSupplierMapping(id: string): Promise<void> {
  await db.delete(TABLES.SUPPLIER_INFO, id)
}
