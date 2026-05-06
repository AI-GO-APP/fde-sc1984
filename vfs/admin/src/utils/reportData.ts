// vfs/admin/src/utils/reportData.ts

export interface PurchaseRow {
  customerCode: string;     // 路線代號 + 客戶簡稱，如 "F33炸料"
  qty: number;
  uom: string;
  note: string;
}

export interface PurchaseProductBlock {
  productName: string;
  uom: string;              // 該品項主單位（同品項應一致；若不一致以第一筆為準）
  rows: PurchaseRow[];
}

export interface PurchaseSheet {
  supplierId: string;       // 或 '__none__'
  supplierName: string;
  products: PurchaseProductBlock[];
}

export interface PickingRow {
  productName: string;
  qty: number;
  uom: string;
  note: string;
}

export interface PickingSheet {
  customerId: string;
  customerCode: string;     // 路線代號 + 客戶簡稱
  customerFullName: string;
  lines: PickingRow[];
}

export interface ReportInput {
  orders: any[];                              // 已篩 selectedDate 的訂單（所有 state，呼叫端先過濾 draft）
  orderLines: any[];                          // 全部 sale_order_lines（內部會用 delivery_date + order_id 對齊）
  customers: Record<string, any>;             // id → customer
  customerTags: any[];                        // customer_tags 陣列
  products: any[];                            // product_templates
  suppliers: Record<string, any>;             // id → supplier
  uomMap: Record<string, string>;             // uom_id → name
  selectedDate: string;                       // YYYY-MM-DD
}

const _id = (v: any): string => Array.isArray(v) ? String(v[0] || '') : String(v || '');

// ── helpers (exported for testability) ──

export function customerCode(cust: any | undefined, tagsById: Record<string, any>): string {
  if (!cust) return '';
  const tagId = _id(cust?.custom_data?.region_tag_id);
  const route = tagId ? String(tagsById[tagId]?.name || '') : '';
  const short = String(cust?.short_name || '').trim() || String(cust?.name || '').slice(0, 3);
  return `${route}${short}`;
}

export function lineNote(line: any): string {
  const cd = line?.custom_data;
  return (cd && typeof cd === 'object') ? String(cd.note || '') : '';
}

export function lineUom(
  line: any,
  productsById: Record<string, any>,
  uomMap: Record<string, string>,
): string {
  const pid = _id(line?.product_template_id || line?.product_id);
  const prod = productsById[pid];
  const uomId = _id(prod?.uom_id);
  return uomMap[uomId] || '';
}

// 後續 task 補：
export function buildPurchaseSheets(_input: ReportInput): PurchaseSheet[] { return []; }
export function buildPickingSheets(_input: ReportInput): PickingSheet[] { return []; }
