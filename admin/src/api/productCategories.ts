/**
 * product_categories CRUD
 */
import { db } from './client'
import { resolveId } from '../utils/odooHelpers'

const TABLE = 'product_categories'

export interface ProductCategory {
  id: string
  name: string
  parentId: string
}

export async function listProductCategories(): Promise<ProductCategory[]> {
  const rows = await db.query<any>(TABLE, {
    select_columns: ['id', 'name', 'parent_id'],
  })
  return (rows || [])
    .map((r: any) => ({
      id: String(r.id),
      name: String(r.name || ''),
      parentId: resolveId(r.parent_id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'))
}

export async function addProductCategory(name: string, parentId?: string): Promise<ProductCategory> {
  const payload: Record<string, any> = { name }
  if (parentId) payload.parent_id = parentId
  const row = await db.insert<any>(TABLE, payload)
  return {
    id: String(row.id),
    name: String(row.name || name),
    parentId: resolveId(row.parent_id ?? parentId ?? ''),
  }
}

export async function updateProductCategory(id: string, data: { name?: string; parentId?: string }): Promise<void> {
  const payload: Record<string, any> = {}
  if (data.name !== undefined) payload.name = data.name
  if (data.parentId !== undefined) payload.parent_id = data.parentId || false
  await db.update(TABLE, id, payload)
}

export async function deleteProductCategory(id: string): Promise<void> {
  await db.delete(TABLE, id)
}
