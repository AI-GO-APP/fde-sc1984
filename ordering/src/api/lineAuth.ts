/**
 * LINE Login OAuth 2.0 utility
 *
 * Flow:
 * 1. Frontend redirects to LINE authorize URL (only needs Channel ID — public)
 * 2. User authorizes on LINE
 * 3. LINE redirects back with authorization code
 * 4. Code is sent to backend for token exchange (Channel Secret stays on backend)
 */

const LINE_CHANNEL_ID = import.meta.env.VITE_LINE_CHANNEL_ID || ''
const LINE_CALLBACK_URL = import.meta.env.VITE_LINE_CALLBACK_URL || `${window.location.origin}/auth/line/callback`

/**
 * Generate a random hex string of given byte length
 */
function generateHex(bytes: number): string {
  const array = new Uint8Array(bytes)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate a random state string for CSRF protection
 */
function generateState(): string {
  return generateHex(16)
}

/**
 * Generate a random nonce for replay attack protection
 */
function generateNonce(): string {
  return generateHex(16)
}

/**
 * Redirect user to LINE Login authorization page
 */
export function redirectToLineLogin(): void {
  const state = generateState()
  const nonce = generateNonce()

  // Save state and nonce to sessionStorage for verification on callback
  sessionStorage.setItem('line_login_state', state)
  sessionStorage.setItem('line_login_nonce', nonce)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINE_CHANNEL_ID,
    redirect_uri: LINE_CALLBACK_URL,
    state,
    scope: 'profile openid email',
    nonce,
  })

  window.location.href = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`
}

/**
 * Verify the state parameter from LINE callback
 */
export function verifyState(receivedState: string): boolean {
  const savedState = sessionStorage.getItem('line_login_state')
  sessionStorage.removeItem('line_login_state')
  return savedState === receivedState
}

/**
 * Get the saved nonce for ID token verification
 */
export function getSavedNonce(): string | null {
  const nonce = sessionStorage.getItem('line_login_nonce')
  sessionStorage.removeItem('line_login_nonce')
  return nonce
}

// --- 型別 ---

/** LINE 登入成功回傳 */
export interface LineLoginSuccess {
  needs_email: false
  access_token: string
  refresh_token: string
  expires_in: number
  user: {
    id: string
    email: string
    display_name: string
    avatar_url: string | null
    is_active: boolean
    created_at: string
  }
}

/** LINE 登入需補填 email */
export interface LineLoginNeedsEmail {
  needs_email: true
  pending_token: string
  display_name?: string
  avatar_url?: string | null
}

export type LineExchangeResult = LineLoginSuccess | LineLoginNeedsEmail

/**
 * Exchange LINE authorization code for app tokens via backend
 * 回傳兩種可能：
 * - needs_email: false → 成功取得 token
 * - needs_email: true  → LINE 用戶未授權 email，需補填
 */
export async function exchangeLineCode(code: string, redirectUri: string): Promise<LineExchangeResult> {
  // 呼叫本地後端（/line-auth/callback），Secret 只在後端處理
  const res = await fetch('/line-auth/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirect_uri: redirectUri }),
  })

  if (!res.ok) {
    let msg = `LINE 登入失敗 (${res.status})`
    try {
      const data = await res.json()
      msg = typeof data.detail === 'string' ? data.detail : msg
    } catch { /* 空 body */ }
    throw new Error(msg)
  }

  const data = await res.json()

  // 若後端回傳 needs_email（LINE 用戶未授權 email）
  if (data.needs_email || data.pending_token) {
    return {
      needs_email: true,
      pending_token: data.pending_token || data.oauth_pending,
      display_name: data.display_name,
      avatar_url: data.avatar_url,
    }
  }

  // 正常登入成功
  return { needs_email: false, ...data }
}

/**
 * 補填 email 完成 LINE 註冊
 * 後端端點：POST /api/v1/custom-app-oauth/{slug}/oauth/complete-email
 */
export async function completeEmail(pendingToken: string, email: string): Promise<LineLoginSuccess> {
  const APP_SLUG = import.meta.env.VITE_APP_SLUG || ''
  const res = await fetch(`/api/v1/custom-app-oauth/${APP_SLUG}/oauth/complete-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pending_token: pendingToken, email }),
  })

  if (!res.ok) {
    let msg = `補填 Email 失敗 (${res.status})`
    try {
      const data = await res.json()
      msg = typeof data.detail === 'string' ? data.detail : msg
    } catch { /* 空 body */ }
    throw new Error(msg)
  }

  const data = await res.json()
  return { needs_email: false, ...data }
}

