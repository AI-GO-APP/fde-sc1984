/**
 * 全域狀態管理 — Zustand Store
 *
 * 核心改動：
 * 1. products / categories 由 API 載入，全域共享
 * 2. submitOrder 改為 async，呼叫 API 建立 sale_order + sale_order_lines
 * 3. orders 由 API 載入（querySaleOrders）
 * 4. 保留 Admin 端功能（procurement, stock）以免影響
 */
import { create } from 'zustand'
import { customers, products as mockProducts, type Customer, type Product, type Category } from '../data/mockData'
import {
  fetchProductTemplates,
  fetchProductCategories,
  mapCategories,
  mapProducts,
  createSaleOrder,
  createSaleOrderLine,
  querySaleOrders,
  querySaleOrderLines,
  type RawSaleOrder,
  type RawSaleOrderLine,
} from '../api/client'

// === 型別定義 ===

export interface CartItem {
  productId: string
  qty: number
  note: string
}

export interface OrderLine {
  productId: string
  productName: string
  qty: number           // 需求量（客戶訂的）
  allocatedQty: number  // 實際配量
  unit: string
  note: string
}

export interface Order {
  id: string
  customerId: string
  date: string
  deliveryDate: string
  note: string
  lines: OrderLine[]
  state: 'draft' | 'sent' | 'sale' | 'done' | 'cancel'
}

export interface ApiOrder {
  raw: RawSaleOrder
  lines: RawSaleOrderLine[]
}

export interface ProcurementItem {
  productId: string
  productName: string
  unit: string
  supplierId: string
  estimatedQty: number
  actualQty: number
  purchasePrice: number
  markupRate: number
  sellingPrice: number
  state: 'pending' | 'priced' | 'stocked'
}

export interface StockItem {
  productId: string
  productName: string
  unit: string
  qty: number
  allocatedQty: number
  remainingQty: number
  purchasePrice: number
  sellingPrice: number
  date: string
}

// === Store ===

interface AppState {
  // 全域產品（LIVE API）
  liveProducts: Product[]
  liveCategories: Category[]
  productsLoading: boolean
  productsLoaded: boolean
  loadProducts: () => Promise<void>

  // 購物車
  cart: CartItem[]
  addToCart: (productId: string) => void
  removeFromCart: (productId: string) => void
  updateCartQty: (productId: string, qty: number) => void
  updateCartNote: (productId: string, note: string) => void
  clearCart: () => void

  // 訂單（API）
  apiOrders: ApiOrder[]
  ordersLoading: boolean
  loadOrders: () => Promise<void>
  submitOrderAsync: (deliveryDate: string, note: string) => Promise<string>
  submitError: string | null

  // Legacy（保留 Admin 功能）
  orders: Order[]
  submitOrder: (customerId: string, deliveryDate: string, note: string) => void
  procurementItems: ProcurementItem[]
  generateProcurement: () => void
  updatePurchasePrice: (productId: string, price: number) => void
  updateActualQty: (productId: string, qty: number) => void
  updateMarkupRate: (productId: string, rate: number) => void
  applyItemPricing: (productId: string) => void
  applyAllPricing: () => void
  stockItem: (productId: string) => void
  stockItems: StockItem[]
  updateAllocatedQty: (orderId: string, productId: string, qty: number) => void
  confirmOrder: (orderId: string) => void
  markShipped: (orderId: string) => void
  markDelivered: (orderId: string) => void
  currentCustomer: Customer
}

let orderCounter = 1

export const useStore = create<AppState>((set, get) => ({
  currentCustomer: customers[0],

  // === 全域產品 ===
  liveProducts: [],
  liveCategories: [],
  productsLoading: false,
  productsLoaded: false,
  loadProducts: async () => {
    if (get().productsLoaded || get().productsLoading) return
    set({ productsLoading: true })
    try {
      const [rawTemplates, rawCategories] = await Promise.all([
        fetchProductTemplates(),
        fetchProductCategories(),
      ])
      const cats = mapCategories(rawCategories)
      const prods = mapProducts(rawTemplates, cats)
      set({ liveProducts: prods, liveCategories: cats, productsLoaded: true })
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      set({ productsLoading: false })
    }
  },

  // === 購物車 ===
  cart: [],
  addToCart: (productId) => set((s) => {
    const existing = s.cart.find(i => i.productId === productId)
    if (existing) {
      return { cart: s.cart.map(i => i.productId === productId ? { ...i, qty: Math.round((i.qty + 0.5) * 100) / 100 } : i) }
    }
    return { cart: [...s.cart, { productId, qty: 1, note: '' }] }
  }),
  removeFromCart: (productId) => set((s) => {
    const existing = s.cart.find(i => i.productId === productId)
    if (existing && existing.qty > 0.5) {
      return { cart: s.cart.map(i => i.productId === productId ? { ...i, qty: Math.round((i.qty - 0.5) * 100) / 100 } : i) }
    }
    return { cart: s.cart.filter(i => i.productId !== productId) }
  }),
  updateCartQty: (productId, qty) => set((s) => ({
    cart: qty <= 0 ? s.cart.filter(i => i.productId !== productId) : s.cart.map(i => i.productId === productId ? { ...i, qty } : i)
  })),
  updateCartNote: (productId, note) => set((s) => ({
    cart: s.cart.map(i => i.productId === productId ? { ...i, note } : i)
  })),
  clearCart: () => set({ cart: [] }),

  // === API 訂單 ===
  apiOrders: [],
  ordersLoading: false,
  submitError: null,

  loadOrders: async () => {
    set({ ordersLoading: true })
    try {
      const orders = await querySaleOrders(
        [],
        [{ column: 'created_at', direction: 'desc' }],
        50,
      )
      // 批次載入所有訂單的明細行
      const orderIds = orders.map(o => o.id)
      let allLines: RawSaleOrderLine[] = []
      if (orderIds.length > 0) {
        allLines = await querySaleOrderLines(
          [{ column: 'order_id', op: 'in', value: orderIds }],
          500,
        )
      }
      const apiOrders: ApiOrder[] = orders.map(o => ({
        raw: o,
        lines: allLines.filter(l => l.order_id === o.id),
      }))
      set({ apiOrders })
    } catch (err) {
      console.error('Failed to load orders:', err)
    } finally {
      set({ ordersLoading: false })
    }
  },

  submitOrderAsync: async (deliveryDate, note) => {
    const { cart, liveProducts, clearCart } = get()
    if (cart.length === 0) throw new Error('購物車是空的')

    set({ submitError: null })
    try {
      // 1. 建立 sale_order
      const orderRes = await createSaleOrder({
        date_order: new Date().toISOString().slice(0, 10),
        note: note || undefined,
        state: 'draft',
      })
      const orderId = orderRes.id

      // 2. 建立每一行 sale_order_line
      const linePromises = cart.map(item => {
        const product = liveProducts.find(p => p.id === item.productId)
        return createSaleOrderLine({
          order_id: orderId,
          product_template_id: item.productId,
          name: product ? `${product.name}${item.note ? ` (${item.note})` : ''}` : item.productId,
          product_uom_qty: item.qty,
          delivery_date: deliveryDate,
        })
      })
      await Promise.all(linePromises)

      // 3. 清空購物車並重新載入訂單
      clearCart()
      get().loadOrders()

      return orderId
    } catch (err) {
      const msg = err instanceof Error ? err.message : '下單失敗'
      set({ submitError: msg })
      throw err
    }
  },

  // === Legacy local orders（保留 Admin 功能） ===
  orders: [],
  submitOrder: (customerId, deliveryDate, note) => {
    const { cart, clearCart } = get()
    if (cart.length === 0) return
    const id = `SO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(orderCounter++).padStart(3, '0')}`
    const lines: OrderLine[] = cart.map(item => {
      const p = mockProducts.find(pp => pp.id === item.productId)!
      return {
        productId: item.productId,
        productName: p.name,
        qty: item.qty,
        allocatedQty: item.qty,
        unit: p.unit,
        note: item.note,
      }
    })
    set((s) => ({ orders: [...s.orders, { id, customerId, date: new Date().toISOString().slice(0, 10), deliveryDate, note, lines, state: 'draft' as const }] }))
    clearCart()
  },

  // === 採購品項 ===
  procurementItems: [],
  generateProcurement: () => {
    const { orders } = get()
    const draftOrders = orders.filter(o => o.state === 'draft')
    const itemMap = new Map<string, ProcurementItem>()
    for (const order of draftOrders) {
      for (const line of order.lines) {
        const p = mockProducts.find(pp => pp.id === line.productId)!
        const existing = itemMap.get(line.productId)
        if (existing) {
          existing.estimatedQty = Math.round((existing.estimatedQty + line.qty) * 100) / 100
          existing.actualQty = existing.estimatedQty
        } else {
          itemMap.set(line.productId, {
            productId: line.productId, productName: p.name, unit: p.unit, supplierId: p.supplierId,
            estimatedQty: line.qty, actualQty: line.qty,
            purchasePrice: 0, markupRate: 130, sellingPrice: 0, state: 'pending',
          })
        }
      }
    }
    set({ procurementItems: Array.from(itemMap.values()) })
  },

  updatePurchasePrice: (productId, price) => set((s) => ({
    procurementItems: s.procurementItems.map(item =>
      item.productId === productId ? { ...item, purchasePrice: price, sellingPrice: price > 0 ? Math.round(price * item.markupRate / 100) : 0 } : item
    ),
  })),
  updateActualQty: (productId, qty) => set((s) => ({
    procurementItems: s.procurementItems.map(item => item.productId === productId ? { ...item, actualQty: qty } : item),
  })),
  updateMarkupRate: (productId, rate) => set((s) => ({
    procurementItems: s.procurementItems.map(item =>
      item.productId === productId ? { ...item, markupRate: rate, sellingPrice: item.purchasePrice > 0 ? Math.round(item.purchasePrice * rate / 100) : 0 } : item
    ),
  })),
  applyItemPricing: (productId) => set((s) => ({
    procurementItems: s.procurementItems.map(item => item.productId === productId && item.purchasePrice > 0 ? { ...item, state: 'priced' as const } : item),
  })),
  applyAllPricing: () => set((s) => ({
    procurementItems: s.procurementItems.map(item => item.purchasePrice > 0 ? { ...item, state: 'priced' as const } : item),
  })),

  stockItem: (productId) => set((s) => {
    const item = s.procurementItems.find(i => i.productId === productId)
    if (!item || item.state !== 'priced') return s
    const newStock: StockItem = {
      productId: item.productId, productName: item.productName, unit: item.unit,
      qty: item.actualQty, allocatedQty: 0, remainingQty: item.actualQty,
      purchasePrice: item.purchasePrice, sellingPrice: item.sellingPrice,
      date: new Date().toISOString().slice(0, 10),
    }
    return {
      procurementItems: s.procurementItems.map(i => i.productId === productId ? { ...i, state: 'stocked' as const } : i),
      stockItems: [...s.stockItems.filter(si => si.productId !== productId), newStock],
    }
  }),

  stockItems: [],

  updateAllocatedQty: (orderId, productId, qty) => set((s) => ({
    orders: s.orders.map(o =>
      o.id === orderId
        ? { ...o, lines: o.lines.map(l => l.productId === productId ? { ...l, allocatedQty: qty } : l) }
        : o
    ),
  })),

  confirmOrder: (orderId) => set((s) => ({
    orders: s.orders.map(o => o.id === orderId && (o.state === 'draft')
      ? { ...o, state: 'sale' as const }
      : o
    ),
  })),

  markShipped: (orderId) => set((s) => ({
    orders: s.orders.map(o => o.id === orderId ? { ...o, state: 'done' as const } : o),
  })),
  markDelivered: (orderId) => set((s) => ({
    orders: s.orders.map(o => o.id === orderId ? { ...o, state: 'done' as const } : o),
  })),
}))
