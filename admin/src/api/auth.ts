/**
 * AI GO Platform Auth — One-Time Code Token Exchange
 *
 * Admin 不處理自訂使用者登入，而是透過 AI GO 主站的
 * One-Time Code 機制交換 JWT token。
 *
 * 流程：
 * 1. 使用者從 AI GO 點擊「開啟應用」
 * 2. AI GO 產生 60 秒有效的一次性 Code
 * 3. 重導至 /auth/callback?code=xxx
 * 4. 前端呼叫 POST /ext/auth/exchange（帶 API Key + code）
 * 5. 取得 { access_token, user } 完成登入
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'
const API_KEY = import.meta.env.VITE_API_KEY || ''

// --- 型別定義 ---

export interface AuthUser {
  id: string
  email: string
  name: string
}

export interface ExchangeResponse {
  access_token: string
  user: AuthUser
}

export interface RefreshResponse {
  access_token: string
}

// --- Token Exchange ---

/**
 * 用一次性 Code 向 AI GO 換取 access_token
 */
export const exchangeOneTimeCode = async (code: string): Promise<ExchangeResponse> => {
  const res = await fetch(`${API_BASE}/ext/auth/exchange`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify({ code }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token exchange 失敗 (${res.status}): ${text}`)
  }

  return res.json()
}

/**
 * 重新整理 access_token
 */
export const refreshToken = async (): Promise<string> => {
  const currentToken = getAdminToken()
  if (!currentToken) throw new Error('無法 refresh：尚無 token')

  const res = await fetch(`${API_BASE}/ext/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      'Authorization': `Bearer ${currentToken}`,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token refresh 失敗 (${res.status}): ${text}`)
  }

  const data: RefreshResponse = await res.json()
  setAdminToken(data.access_token)
  return data.access_token
}

// --- Token Storage ---

export const setAdminToken = (token: string) => {
  localStorage.setItem('admin_token', token)
}

export const getAdminToken = () => {
  return localStorage.getItem('admin_token')
}

export const clearAdminToken = () => {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
}

// --- User Storage ---

export const setAdminUser = (user: AuthUser) => {
  localStorage.setItem('admin_user', JSON.stringify(user))
}

export const getAdminUser = (): AuthUser | null => {
  const raw = localStorage.getItem('admin_user')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}
