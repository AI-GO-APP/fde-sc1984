import { db } from './client';

export interface Product {
  id: string;
  erp_id?: string;
  name: string;
  sku: string;
  type: string;     // 'goods', 'service' 等
  uom_id: string;   // 預設計量單位
  category_id?: string;
  list_price: number;
  standard_price?: number;
  stock?: number;
}

export const getProducts = async (): Promise<Product[]> => {
  let products: any[] = [];
  let quants: any[] = [];

  try {
    products = await db.query('product_templates');
  } catch (e) {
    console.warn('[stock] product_templates 查詢失敗:', e);
    return [];
  }

  try {
    quants = await db.query('stock_quants');
  } catch (e) {
    // stock_quants 不存在或查詢失敗時，以 stock=0 繼續
    console.warn('[stock] stock_quants 查詢失敗 (以 0 替代):', e);
  }
  
  const stockMap: Record<string, number> = {};
  (quants || []).forEach(q => {
     const pid = Array.isArray(q.product_id) ? String(q.product_id[0]) : String(q.product_id);
     stockMap[pid] = (stockMap[pid] || 0) + (q.quantity || 0);
  });

  return (products || []).map(p => ({
    id: String(p.id),
    erp_id: p.default_code || '',
    name: p.name || 'Unknown',
    sku: p.default_code || '',
    type: 'goods',
    uom_id: Array.isArray(p.uom_id) ? p.uom_id[1] : (p.uom_id || 'Unit'),
    category_id: Array.isArray(p.categ_id) ? String(p.categ_id[0]) : p.categ_id,
    list_price: p.list_price || 0,
    standard_price: p.standard_price || 0,
    stock: stockMap[String(p.id)] || 0
  }));
};

// 若後續需要庫存查詢 (Stock Quants)
export const getStockQuantities = async () => {
  return await db.query('stock_quants');
};
