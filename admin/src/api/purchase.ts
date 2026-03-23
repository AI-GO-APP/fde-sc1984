import { db } from './client';

export interface PurchaseOrder {
  id: string;
  erp_id: string;
  supplier_id: string;
  date: string;
  status: string;
  total_amount: number;
  lines: PurchaseOrderLine[];
}

export interface PurchaseOrderLine {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface PurchaseInvoice {
  id: string;
  erp_id: string;
  supplier_id: string;
  date: string;
  status: string;
  total_amount: number;
  lines: PurchaseInvoiceLine[];
}

export interface PurchaseInvoiceLine {
  id: string;
  invoice_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export const getPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  const [orders, lines] = await Promise.all([
    db.query('purchase_orders'),
    db.query('purchase_order_lines')
  ]);
  
  return orders.map(o => ({
    id: String(o.id),
    erp_id: o.name || String(o.id),
    date: o.date_order ? String(o.date_order).split(' ')[0] : '',
    supplier_id: Array.isArray(o.supplier_id) ? o.supplier_id[1] : o.supplier_id,
    total_amount: o.amount_total || 0,
    status: o.state || 'draft',
    lines: lines.filter(l => (Array.isArray(l.order_id) ? l.order_id[0] : l.order_id) === o.id).map(l => ({
        id: String(l.id),
        order_id: String(o.id),
        product_id: Array.isArray(l.product_id) ? String(l.product_id[0]) : String(l.product_id),
        quantity: l.product_qty || 0,
        unit_price: l.price_unit || 0,
        subtotal: l.price_subtotal || 0
    }))
  }));
};

export const updatePurchaseOrderStatus = async (id: string, status: string) => {
  return await db.update('purchase_orders', id, { state: status });
};

export const getPurchaseInvoices = async (): Promise<PurchaseInvoice[]> => {
  // Mapping to POs for now based on context 
  return []; 
};

export const updatePurchaseInvoiceStatus = async (_id: string, _status: string) => {
  return {};
};
