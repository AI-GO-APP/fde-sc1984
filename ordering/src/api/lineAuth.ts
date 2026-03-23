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
 * Generate a random state string for CSRF protection
 */
function generateState(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate a random nonce for replay attack protection
 */
function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
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

/**
 * Exchange LINE authorization code for app tokens via backend
 * The backend handles the actual token exchange with LINE (using client_secret)
 * and returns our app's JWT tokens
 */
export async function exchangeLineCode(code: string, redirectUri: string): Promise<{
  access_token: string
  refresh_token: string
  user: {
    id: string
    email: string
    display_name: string
    avatar_url: string | null
    is_active: boolean
    created_at: string
  }
}> {
  // 呼叫本地後端（/line-auth/callback），Secret 只在後端處理
  const res = await fetch('/line-auth/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirect_uri: redirectUri }),
  })

  const data = await res.json()

  if (!res.ok) {
    const msg = typeof data.detail === 'string' ? data.detail : 'LINE Login failed'
    throw new Error(msg)
  }

  return data
}
