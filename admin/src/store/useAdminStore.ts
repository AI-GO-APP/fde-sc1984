/**
 * Admin 全域狀態管理 — Zustand Store
 *
 * 三大資料來源：銷售訂單、產品、採購單
 * 含 5 分鐘 TTL 快取
 */
import { create } from 'zustand'
import { getSaleOrders, type SaleOrder } from '../api/sales'
import { getProducts, type Product } from '../api/stock'
import { getPurchaseOrders, type PurchaseOrder } from '../api/purchase'

const TTL = 5 * 60 * 1000

interface AdminState {
  saleOrders: SaleOrder[]
  salesLoadedAt: number
  salesLoading: boolean
  loadSales: (force?: boolean) => Promise<void>

  products: Product[]
  productsLoadedAt: number
  productsLoading: boolean
  loadProducts: (force?: boolean) => Promise<void>

  purchaseOrders: PurchaseOrder[]
  purchasesLoadedAt: number
  purchasesLoading: boolean
  loadPurchases: (force?: boolean) => Promise<void>

  loadAll: (force?: boolean) => Promise<void>
}

export const useAdminStore = create<AdminState>((set, get) => ({
  saleOrders: [],
  salesLoadedAt: 0,
  salesLoading: false,
  loadSales: async (force = false) => {
    const { salesLoadedAt, salesLoading } = get()
    if (!force && Date.now() - salesLoadedAt < TTL) return
    if (salesLoading) return
    set({ salesLoading: true })
    try {
      const data = await getSaleOrders()
      set({ saleOrders: data, salesLoadedAt: Date.now() })
    } catch (err) {
      console.error('[store] 載入銷售訂單失敗:', err)
    } finally {
      set({ salesLoading: false })
    }
  },

  products: [],
  productsLoadedAt: 0,
  productsLoading: false,
  loadProducts: async (force = false) => {
    const { productsLoadedAt, productsLoading } = get()
    if (!force && Date.now() - productsLoadedAt < TTL) return
    if (productsLoading) return
    set({ productsLoading: true })
    try {
      const data = await getProducts()
      set({ products: data, productsLoadedAt: Date.now() })
    } catch (err) {
      console.error('[store] 載入產品失敗:', err)
    } finally {
      set({ productsLoading: false })
    }
  },

  purchaseOrders: [],
  purchasesLoadedAt: 0,
  purchasesLoading: false,
  loadPurchases: async (force = false) => {
    const { purchasesLoadedAt, purchasesLoading } = get()
    if (!force && Date.now() - purchasesLoadedAt < TTL) return
    if (purchasesLoading) return
    set({ purchasesLoading: true })
    try {
      const data = await getPurchaseOrders()
      set({ purchaseOrders: data, purchasesLoadedAt: Date.now() })
    } catch (err) {
      console.error('[store] 載入採購單失敗:', err)
    } finally {
      set({ purchasesLoading: false })
    }
  },

  loadAll: async (force = false) => {
    const { loadSales, loadProducts, loadPurchases } = get()
    await Promise.all([loadSales(force), loadProducts(force), loadPurchases(force)])
  },
}))
