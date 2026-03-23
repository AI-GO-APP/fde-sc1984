import { getSalesInvoices } from './sales';
import { getPurchaseOrders } from './purchase';

export interface DashboardStats {
  totalSalesOrders: number;
  totalPurchaseOrders: number;
  pendingShipments: number; // 待出貨
  pendingReceives: number;  // 待收貨
  todaySalesVolume: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // 實務上這端點應由後端聚合作業，目前透過查拉前幾百筆資料來動態運算
    const [sales, purchases] = await Promise.all([
      getSalesInvoices(),
      getPurchaseOrders()
    ]);

    const pendingShipments = sales.filter(s => s.status !== 'posted' && s.status !== 'done').length;
    const pendingReceives = purchases.filter(p => p.status !== 'received' && p.status !== 'done').length;
    const todaySalesVolume = sales.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

    return {
      totalSalesOrders: sales.length,
      totalPurchaseOrders: purchases.length,
      pendingShipments,
      pendingReceives,
      todaySalesVolume,
    };
  } catch (err) {
    console.error('Failed to fetch dashboard stats', err);
    return {
      totalSalesOrders: 0,
      totalPurchaseOrders: 0,
      pendingShipments: 0,
      pendingReceives: 0,
      todaySalesVolume: 0,
    };
  }
};
