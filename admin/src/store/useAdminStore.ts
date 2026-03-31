/**
 * Admin 全域狀態管理 — Zustand Store
 *
 * 資料來源：銷售訂單、產品、採購單、司機
 * 含 5 分鐘 TTL 快取
 */
import { create } from 'zustand'
import { getSaleOrders, type SaleOrder } from '../api/sales'
import { getProducts, getDrivers, type Product } from '../api/stock'
import { getPurchaseOrders, type PurchaseOrder } from '../api/purchase'
import { getTodayDateStr } from '../utils/dateHelpers'

const TTL = 5 * 60 * 1000

interface AdminState {
  targetDate: string
  setTargetDate: (dateStr: string) => Promise<void>

  // 快取池 (以 dateStr 為 key)
  salesCache: Record<string, SaleOrder[]>
  purchasesCache: Record<string, PurchaseOrder[]>
  salesLoadedAt: Record<string, number>
  purchasesLoadedAt: Record<string, number>

  // 當前畫面的暴露狀態
  saleOrders: SaleOrder[]
  salesLoading: boolean
  loadSales: (dateStr: string, force?: boolean) => Promise<void>

  products: Product[]
  productsLoadedAt: number
  productsLoading: boolean
  loadProducts: (force?: boolean) => Promise<void>

  purchaseOrders: PurchaseOrder[]
  purchasesLoading: boolean
  loadPurchases: (dateStr: string, force?: boolean) => Promise<void>

  drivers: Array<{ id: string; name: string }>
  driversLoadedAt: number
  loadDrivers: (force?: boolean) => Promise<void>

  loadAll: (force?: boolean) => Promise<void>
}

export const useAdminStore = create<AdminState>((set, get) => ({
  targetDate: getTodayDateStr(),
  setTargetDate: async (dateStr: string) => {
    set({ targetDate: dateStr })
    // 更新對外呈現的當前指標，若已存在則直接秒切，若不存在將交由 loadAll 去補抓
    set(state => ({
      saleOrders: state.salesCache[dateStr] || [],
      purchaseOrders: state.purchasesCache[dateStr] || [],
    }))
    await get().loadAll()
  },

  salesCache: {},
  purchasesCache: {},
  salesLoadedAt: {},
  purchasesLoadedAt: {},

  saleOrders: [],
  salesLoading: false,
  loadSales: async (dateStr: string, force = false) => {
    const { salesLoadedAt, salesLoading } = get()
    if (!force && (Date.now() - (salesLoadedAt[dateStr] || 0) < TTL)) return
    if (salesLoading) return
    set({ salesLoading: true })
    try {
      const data = await getSaleOrders(dateStr)
      set(state => ({
        salesCache: { ...state.salesCache, [dateStr]: data },
        salesLoadedAt: { ...state.salesLoadedAt, [dateStr]: Date.now() },
        // 只在畫面上目標日沒變時更新現行陣列
        ...(state.targetDate === dateStr ? { saleOrders: data } : {})
      }))
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
  purchasesLoading: false,
  loadPurchases: async (dateStr: string, force = false) => {
    const { purchasesLoadedAt, purchasesLoading } = get()
    if (!force && (Date.now() - (purchasesLoadedAt[dateStr] || 0) < TTL)) return
    if (purchasesLoading) return
    set({ purchasesLoading: true })
    try {
      const data = await getPurchaseOrders(dateStr)
      set(state => ({
        purchasesCache: { ...state.purchasesCache, [dateStr]: data },
        purchasesLoadedAt: { ...state.purchasesLoadedAt, [dateStr]: Date.now() },
        ...(state.targetDate === dateStr ? { purchaseOrders: data } : {})
      }))
    } catch (err) {
      console.error('[store] 載入採購單失敗:', err)
    } finally {
      set({ purchasesLoading: false })
    }
  },

  drivers: [],
  driversLoadedAt: 0,
  loadDrivers: async (force = false) => {
    const { driversLoadedAt } = get()
    if (!force && Date.now() - driversLoadedAt < TTL) return
    try {
      const data = await getDrivers()
      set({ drivers: data, driversLoadedAt: Date.now() })
    } catch (err) {
      console.error('[store] 載入司機失敗:', err)
    }
  },

  loadAll: async (force = false) => {
    const { targetDate, loadSales, loadProducts, loadPurchases, loadDrivers } = get()
    await Promise.all([
      loadSales(targetDate, force), 
      loadProducts(force), 
      loadPurchases(targetDate, force), 
      loadDrivers(force)
    ])
  },
}))
