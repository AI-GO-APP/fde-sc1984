import { db } from './client'
import { resolveId } from '../utils/odooHelpers'
import { TABLES } from './tables'

interface DriverCustomerMapping {
  id: string
  driverId: string
  customerId: string
}

export async function getDriverCustomerMappings(): Promise<DriverCustomerMapping[]> {
  try {
    const rows = await db.query<any>(TABLES.DRIVER_CUSTOMER, {
      select_columns: ['id', 'driver_id', 'customer_id'],
    })
    return (rows || []).map((r: any) => ({
      id: String(r.id),
      driverId: resolveId(r.driver_id),
      customerId: resolveId(r.customer_id),
    }))
  } catch {
    return []
  }
}

export async function addDriverCustomerMapping(
  driverId: string,
  customerId: string,
  createdBy: string
): Promise<DriverCustomerMapping> {
  const row = await db.insert<any>(TABLES.DRIVER_CUSTOMER, {
    driver_id: driverId,
    customer_id: customerId,
    created_by: createdBy,
    created_at: new Date().toISOString(),
  })
  return {
    id: String(row.id),
    driverId: resolveId(row.driver_id ?? driverId),
    customerId: resolveId(row.customer_id ?? customerId),
  }
}

export async function deleteDriverCustomerMapping(id: string): Promise<void> {
  await db.delete(TABLES.DRIVER_CUSTOMER, id)
}

export function getCustomersByDriver(driverId: string, mappings: DriverCustomerMapping[]): string[] {
  return mappings
    .filter(m => m.driverId === driverId)
    .map(m => m.customerId)
}
