/**
 * 全域狀態管理 — Zustand Store
 * 
 * 核心概念：
 * 1. 分散式採購 — 品項獨立流轉
 * 2. 配貨概念 — 入庫後有總量，人工分配給各客戶
 *    - 需求量 = 客戶原始訂購量
 *    - 實際量 = 管理者實際配給量（可能 ≠ 需求量）
 *    - 出貨價 = 實際量 × 售價
 */
import { create } from 'zustand'
import { products, customers, type Customer } from '../data/mockData'

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
  allocatedQty: number  // 實際配量（管理者配的，預設 = 需求量）
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
  state: 'draft' | 'allocated' | 'confirmed' | 'shipped' | 'delivered'
  // draft = 剛下單, allocated = 已配貨, confirmed = 銷貨單已確認, shipped, delivered
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
  qty: number            // 入庫總量
  allocatedQty: number   // 已配出量
  remainingQty: number   // 剩餘可配量
  purchasePrice: number
  sellingPrice: number
  date: string
}

// === Store ===

interface AppState {
  cart: CartItem[]
  addToCart: (productId: string) => void
  removeFromCart: (productId: string) => void
  updateCartQty: (productId: string, qty: number) => void
  updateCartNote: (productId: string, note: string) => void
  clearCart: () => void

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

  // 配貨：管理者調整個別客戶品項的實際配量
  updateAllocatedQty: (orderId: string, productId: string, qty: number) => void
  // 確認銷貨單（不需全部入庫）
  confirmOrder: (orderId: string) => void

  markShipped: (orderId: string) => void
  markDelivered: (orderId: string) => void

  currentCustomer: Customer
}

let orderCounter = 1

export const useStore = create<AppState>((set, get) => ({
  currentCustomer: customers[0],

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

  // === 訂單 ===
  orders: [],
  submitOrder: (customerId, deliveryDate, note) => {
    const { cart, clearCart } = get()
    if (cart.length === 0) return
    const id = `SO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(orderCounter++).padStart(3, '0')}`
    const lines: OrderLine[] = cart.map(item => {
      const p = products.find(pp => pp.id === item.productId)!
      return {
        productId: item.productId,
        productName: p.name,
        qty: item.qty,
        allocatedQty: item.qty,  // 預設 = 需求量
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
        const p = products.find(pp => pp.id === line.productId)!
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

  // 入庫
  stockItem: (productId) => set((s) => {
    const item = s.procurementItems.find(i => i.productId === productId)
    if (!item || item.state !== 'priced') return s
    const newStock: StockItem = {
      productId: item.productId, productName: item.productName, unit: item.unit,
      qty: item.actualQty,
      allocatedQty: 0,
      remainingQty: item.actualQty,
      purchasePrice: item.purchasePrice, sellingPrice: item.sellingPrice,
      date: new Date().toISOString().slice(0, 10),
    }
    return {
      procurementItems: s.procurementItems.map(i => i.productId === productId ? { ...i, state: 'stocked' as const } : i),
      stockItems: [...s.stockItems.filter(si => si.productId !== productId), newStock],
    }
  }),

  stockItems: [],

  // === 配貨（核心改動） ===
  updateAllocatedQty: (orderId, productId, qty) => set((s) => ({
    orders: s.orders.map(o =>
      o.id === orderId
        ? { ...o, lines: o.lines.map(l => l.productId === productId ? { ...l, allocatedQty: qty } : l) }
        : o
    ),
  })),

  // 確認個別訂單的銷貨單（不需全部入庫）
  confirmOrder: (orderId) => set((s) => ({
    orders: s.orders.map(o => o.id === orderId && (o.state === 'draft' || o.state === 'allocated')
      ? { ...o, state: 'confirmed' as const }
      : o
    ),
  })),

  markShipped: (orderId) => set((s) => ({
    orders: s.orders.map(o => o.id === orderId ? { ...o, state: 'shipped' as const } : o),
  })),
  markDelivered: (orderId) => set((s) => ({
    orders: s.orders.map(o => o.id === orderId ? { ...o, state: 'delivered' as const } : o),
  })),
}))
