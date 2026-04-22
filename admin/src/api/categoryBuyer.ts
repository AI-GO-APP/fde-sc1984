/**
 * 分類-買辦人（員工）對應 — x_category_buyer
 */
import { db } from './client'
import { resolveId } from '../utils/odooHelpers'
import { TABLES } from './tables'

export interface CategoryBuyerMapping {
  id: string
  categoryId: string
  employeeId: string
}

export async function listCategoryBuyerMappings(): Promise<CategoryBuyerMapping[]> {
  try {
    const rows = await db.query<any>(TABLES.CATEGORY_BUYER, {
      select_columns: ['id', 'category_id', 'employee_id'],
    })
    return (rows || []).map((r: any) => ({
      id: String(r.id),
      categoryId: resolveId(r.category_id),
      employeeId: resolveId(r.employee_id),
    }))
  } catch {
    return []
  }
}

export async function addCategoryBuyerMapping(
  categoryId: string,
  employeeId: string,
  createdBy: string,
): Promise<CategoryBuyerMapping> {
  const row = await db.insert<any>(TABLES.CATEGORY_BUYER, {
    category_id: categoryId,
    employee_id: employeeId,
    created_by: createdBy,
    created_at: new Date().toISOString(),
  })
  return {
    id: String(row.id),
    categoryId: resolveId(row.category_id ?? categoryId),
    employeeId: resolveId(row.employee_id ?? employeeId),
  }
}

export async function deleteCategoryBuyerMapping(id: string): Promise<void> {
  await db.delete(TABLES.CATEGORY_BUYER, id)
}
