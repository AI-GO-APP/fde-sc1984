/**
 * Customer 自動同步模組
 *
 * CustomAppUser 登入/註冊後，透過 Proxy API 確保對應的 AI GO Customer 存在並綁定。
 * 以 email 作為匹配鍵判斷 Customer 是否已存在。
 *
 * 使用的 Proxy API 表：
 * - customers — 查詢/建立 Customer
 * - customer_custom_app_user_rel — 查詢/建立綁定關係
 */

import { useAuthStore } from '../store/useAuthStore'

// 從 .env 讀取設定（與 client.ts 相同）
const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1/open/proxy'
const API_KEY = import.meta.env.VITE_API_KEY || ''

/** 通用 proxy fetch（精簡版，不做重試） */
async function proxyFetch<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, unknown>,
): Promise<T> {
  const url = `${API_BASE}/${endpoint}`
  const token = useAuthStore.getState().token
  const res = await fetch(url, {
    method,
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body && method !== 'GET' ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`CustomerSync API error ${res.status}: ${text}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// --- 型別 ---

interface ProxyCustomer {
  id: string
  name: string
  email: string | null
  customer_type: string
}

interface ProxyRel {
  id: string
  customer_id: string
  custom_app_user_id: string
}

interface ProxyInsertResult {
  id: string
  data: Record<string, unknown>
}

// --- 核心邏輯 ---

/**
 * 確保當前登入的 CustomAppUser 有對應的 AI GO Customer 並綁定。
 * 成功後將 customerId 存入 useAuthStore。
 *
 * 流程：
 * 1. 查 customer_custom_app_user_rel（以 custom_app_user_id）
 *    → 找到就用 customer_id
 * 2. 沒有 rel → 以 email 查 customers
 *    → 找到就建立 rel
 * 3. email 也找不到 → 建立新 Customer + rel
 */
export async function ensureCustomerForCurrentUser(): Promise<string | null> {
  const { user } = useAuthStore.getState()
  if (!user) return null
  if (!user.email) return null

  const userId = user.id
  const email = user.email.toLowerCase().trim()

  try {
    // 1. 查現有綁定
    const rels = await proxyFetch<ProxyRel[]>('customer_custom_app_user_rel/query', 'POST', {
      filters: [{ column: 'custom_app_user_id', op: 'eq', value: userId }],
      limit: 1,
    })

    if (rels && rels.length > 0) {
      // 已綁定 — 儲存並回傳
      const customerId = rels[0].customer_id
      useAuthStore.getState().setCustomerId(customerId)
      return customerId
    }

    // 2. 以 email 查 Customer
    const customers = await proxyFetch<ProxyCustomer[]>('customers/query', 'POST', {
      filters: [{ column: 'email', op: 'eq', value: email }],
      limit: 1,
    })

    let customerId: string

    if (customers && customers.length > 0) {
      // 找到同 email 的 Customer
      customerId = customers[0].id
    } else {
      // 3. 建立新 Customer
      const newCustomer = await proxyFetch<ProxyInsertResult>('customers', 'POST', {
        name: user.display_name || email.split('@')[0],
        email: email,
        customer_type: 'individual',
        status: 'active',
      })
      customerId = newCustomer.id
    }

    // 建立綁定
    await proxyFetch<ProxyInsertResult>('customer_custom_app_user_rel', 'POST', {
      customer_id: customerId,
      custom_app_user_id: userId,
    })

    // 儲存至 AuthStore
    useAuthStore.getState().setCustomerId(customerId)
    return customerId
  } catch (err) {
    // 非致命錯誤：同步失敗不應影響使用者正常操作
    console.error('[CustomerSync] 同步失敗，不影響正常使用:', err)
    return null
  }
}
